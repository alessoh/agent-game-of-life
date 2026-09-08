"use client";

import { useSyncExternalStore } from "react";
import { useWorld } from "@/components/world/WorldProvider";
import { useCountUp } from "@/components/ui/Stat";
import { type PulseCounts, pulseCounts } from "./boardModel";

const BUCKET_MS = 30_000;

function subscribeClock(cb: () => void) {
  const t = setInterval(cb, BUCKET_MS);
  return () => clearInterval(t);
}

/** Live counts for the page header. Renders the server's numbers first, then follows the world stream. */
export function BoardPulse({ initial, serverNow }: { initial: PulseCounts; serverNow: number }) {
  const { world, connection } = useWorld();
  const now = useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / BUCKET_MS) * BUCKET_MS,
    () => serverNow,
  );
  const counts = world ? pulseCounts(Object.values(world.posts), world.events, now) : initial;

  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-5">
      <PulseItem label="Open listings" value={counts.open} />
      <PulseItem label="Seeking a female" value={counts.seekingFemale} tone="text-rose" />
      <PulseItem label="Seeking a male" value={counts.seekingMale} tone="text-cobalt" />
      <PulseItem label="Winks · last hour" value={counts.winksLastHour} live={connection === "live"} />
    </dl>
  );
}

function PulseItem({ label, value, tone = "text-ink", live = false }: { label: string; value: number; tone?: string; live?: boolean }) {
  const shown = useCountUp(value);
  return (
    <div className="flex min-w-[7.5rem] flex-col-reverse">
      <dt className="mt-1.5 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em] text-muted">
        {label}
        {live && <span className="live-dot" aria-hidden />}
      </dt>
      <dd className={`font-display text-[32px] leading-none tabular-nums ${tone}`}>{shown.toLocaleString("en-US")}</dd>
    </div>
  );
}
