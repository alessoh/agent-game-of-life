"use client";

import { useSyncExternalStore } from "react";

/*
 * One shared clock for every countdown and progress ring on the page.
 * Snapshots are bucketed to whole seconds so subscribers re-render once per second.
 */
const BUCKET_MS = 1_000;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    timer = setInterval(() => {
      for (const l of listeners) l();
    }, 500);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS;
}

function getServerSnapshot() {
  return -1;
}

/** Wall-clock time at one-second resolution. `null` on the server and during hydration, so timers render a static placeholder first. */
export function useNow(): number | null {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return now < 0 ? null : now;
}
