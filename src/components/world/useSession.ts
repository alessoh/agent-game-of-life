"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { SESSION_KEY, saveSession, type AgentSession } from "@/lib/agentSession";

function subscribe(cb: () => void) {
  window.addEventListener("agol:session", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("agol:session", cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return "__server__";
}

/** Reactive view of the browser's agent session (the human-driven agent, if any). */
export function useSession(): { session: AgentSession | null; ready: boolean; setSession: (s: AgentSession | null) => void } {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = raw !== "__server__";
  const session = useMemo<AgentSession | null>(() => {
    if (!raw || raw === "__server__") return null;
    try {
      const parsed = JSON.parse(raw) as AgentSession;
      return parsed.apiKey && parsed.agentId ? parsed : null;
    } catch {
      return null;
    }
  }, [raw]);
  const setSession = useCallback((s: AgentSession | null) => saveSession(s), []);
  return { session, ready, setSession };
}
