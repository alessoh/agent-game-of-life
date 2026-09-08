"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PublicWorld, WorldEvent, WorldStats } from "@/lib/types";

export interface WorldSnapshot {
  world: PublicWorld;
  stats: WorldStats;
  backend: "redis" | "postgres" | "memory";
  serverTime: number;
}

export type ConnectionState = "connecting" | "live" | "reconnecting" | "offline";

interface WorldContextValue {
  snapshot: WorldSnapshot | null;
  world: PublicWorld | null;
  stats: WorldStats | null;
  /** Events observed since the page loaded (newest first). */
  liveEvents: WorldEvent[];
  connection: ConnectionState;
  backend: "redis" | "postgres" | "memory" | null;
  version: number;
  refresh: () => Promise<void>;
}

const WorldContext = createContext<WorldContextValue | null>(null);

const TICK_INTERVAL_MS = 6_000;
const REFRESH_DEBOUNCE_MS = 350;

export function WorldProvider({ children, initial }: { children: ReactNode; initial?: WorldSnapshot | null }) {
  const [snapshot, setSnapshot] = useState<WorldSnapshot | null>(initial ?? null);
  const [liveEvents, setLiveEvents] = useState<WorldEvent[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [version, setVersion] = useState<number>(initial?.world.version ?? 0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenSeq = useRef<number>(initial?.world.counters.event ?? 0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as WorldSnapshot;
      setSnapshot(data);
      setVersion(data.world.version);
      if (data.world.counters.event > seenSeq.current) seenSeq.current = data.world.counters.event;
    } catch {
      /* transient; the stream will trigger another refresh */
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      void refresh();
    }, REFRESH_DEBOUNCE_MS);
  }, [refresh]);

  // Initial load when no server snapshot was provided.
  useEffect(() => {
    if (initial) return;
    const t = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t);
  }, [initial, refresh]);

  // Server-Sent Events subscription with automatic reconnect (EventSource handles it).
  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;
    let es: EventSource | null = null;
    let closed = false;
    let retry = 0;

    const connect = () => {
      if (closed) return;
      es = new EventSource(`/api/stream?since=${seenSeq.current}`);
      es.addEventListener("hello", () => {
        retry = 0;
        setConnection("live");
      });
      es.addEventListener("update", (e) => {
        const data = JSON.parse((e as MessageEvent).data) as { version: number; seq: number; events: WorldEvent[]; stats: WorldStats };
        const fresh = data.events.filter((ev) => ev.seq > seenSeq.current);
        if (fresh.length) {
          seenSeq.current = Math.max(seenSeq.current, ...fresh.map((ev) => ev.seq));
          setLiveEvents((prev) => [...fresh.slice().reverse(), ...prev].slice(0, 120));
        }
        setVersion(data.version);
        setSnapshot((prev) => (prev ? { ...prev, stats: data.stats } : prev));
        scheduleRefresh();
      });
      es.addEventListener("bye", () => {
        es?.close();
        connect();
      });
      es.onerror = () => {
        setConnection("reconnecting");
        es?.close();
        retry += 1;
        setTimeout(connect, Math.min(8000, 800 * retry));
      };
    };
    connect();
    return () => {
      closed = true;
      es?.close();
    };
  }, [scheduleRefresh]);

  // Heartbeat: while someone is watching, keep the world moving.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const beat = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/tick", { method: "POST", keepalive: true }).catch(() => undefined);
    };
    const start = () => {
      if (timer) return;
      beat();
      timer = setInterval(beat, TICK_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const value = useMemo<WorldContextValue>(
    () => ({
      snapshot,
      world: snapshot?.world ?? null,
      stats: snapshot?.stats ?? null,
      liveEvents,
      connection,
      backend: snapshot?.backend ?? null,
      version,
      refresh,
    }),
    [snapshot, liveEvents, connection, version, refresh],
  );

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useWorld(): WorldContextValue {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error("useWorld must be used within WorldProvider");
  return ctx;
}
