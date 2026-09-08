"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useWorld } from "@/components/world/WorldProvider";
import { toSceneAgent, DESKTOP_BUDGET, MOBILE_BUDGET, type SceneAgent } from "@/components/three/layout";
import type { ScenePointer } from "@/components/three/ConstellationScene";
import { ConstellationFallback } from "./ConstellationFallback";

const Constellation = dynamic(() => import("@/components/three/ConstellationScene"), { ssr: false, loading: () => null });

const noopSubscribe = () => () => {};
let webglCache: boolean | null = null;
function webglSupported(): boolean {
  if (webglCache === null) {
    try {
      const c = document.createElement("canvas");
      webglCache = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
}
const serverFalse = () => false;

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, serverFalse);
}

/**
 * Hero visual. Server-renders the SVG constellation, then (on capable browsers that do not
 * prefer reduced motion) crossfades to the live three.js scene once its first frame is drawn.
 */
export function HeroScene({ initialAgents, className = "" }: { initialAgents: SceneAgent[]; className?: string }) {
  const { world, liveEvents } = useWorld();
  const agents = useMemo(() => (world ? Object.values(world.agents).map(toSceneAgent) : initialAgents), [world, initialAgents]);

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const desktop = useMediaQuery("(min-width: 1024px)");
  const webgl = useSyncExternalStore(noopSubscribe, webglSupported, serverFalse);
  const useScene = webgl && !reducedMotion;

  const [ready, setReady] = useState(false);
  const [fallbackGone, setFallbackGone] = useState(false);
  const pointer = useRef<ScenePointer>({ x: 0, y: 0 });
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setFallbackGone(true), 900);
    return () => clearTimeout(t);
  }, [ready]);

  // Parallax follows the pointer anywhere over the hero section, not just the canvas.
  useEffect(() => {
    const el = host.current?.closest("section") ?? host.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      pointer.current.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };
    const onLeave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);

  return (
    <div ref={host} className={`relative ${className}`} aria-hidden>
      {!fallbackGone && (
        <div className={`absolute inset-0 transition-opacity duration-700 ease-out lg:left-[34%] ${ready ? "opacity-0" : "opacity-100"}`}>
          <ConstellationFallback agents={agents} />
        </div>
      )}
      {useScene && (
        <div className={`absolute inset-0 transition-opacity duration-700 ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
          <Constellation
            agents={agents}
            events={liveEvents}
            pointer={pointer}
            align={desktop ? "right" : "center"}
            maxCount={desktop ? DESKTOP_BUDGET : MOBILE_BUDGET}
            onReady={onReady}
          />
        </div>
      )}
    </div>
  );
}
