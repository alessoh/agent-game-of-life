"use client";

import { useSyncExternalStore } from "react";

/* One shared 15s clock; the server snapshot is null so hydration never depends on the time. */
const BUCKET_MS = 15_000;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), BUCKET_MS);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS;
const getServerSnapshot = () => null;

/** Current time to the nearest 15s, or null on the server and during hydration. */
export function useClock(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
