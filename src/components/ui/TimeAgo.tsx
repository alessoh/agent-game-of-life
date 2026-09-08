"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime, timeAgo } from "@/lib/format";

/* A tiny shared clock that ticks every 15s; components subscribe instead of owning timers. */
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
const BUCKET_MS = 15_000;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    timer = setInterval(() => {
      for (const l of listeners) l();
    }, BUCKET_MS);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Current time rounded to the bucket, so the snapshot is stable between ticks. */
function bucketNow(): number {
  return Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS;
}

/**
 * Relative timestamp ("4m ago") that re-renders every 15s.
 * The server renders the relative string too, so there is no reflow after hydration;
 * `suppressHydrationWarning` absorbs the rare bucket boundary between render and hydrate.
 */
export function TimeAgo({ ts, className = "" }: { ts: number; className?: string }) {
  const now = useSyncExternalStore(subscribe, bucketNow, bucketNow);
  return (
    <time dateTime={new Date(ts).toISOString()} title={formatDateTime(ts)} className={className} suppressHydrationWarning>
      {timeAgo(ts, now + BUCKET_MS)}
    </time>
  );
}
