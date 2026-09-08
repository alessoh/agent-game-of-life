"use client";

import { useMemo } from "react";
import { useWorld } from "@/components/world/WorldProvider";
import { useCountUp } from "@/components/ui/Stat";
import { MAGISTRATE_NAME, type WorldStats } from "@/lib/types";
import { Seal } from "./Seal";
import { useClock } from "./useClock";
import { HOUR_MS, engagedCouples, licensesSince } from "./office";

export interface OfficeInitialCounts {
  stats: WorldStats;
  awaiting: number;
  lastHour: number;
}

function Counter({ label, value, hint, accent = "text-ink" }: { label: string; value: number; hint: string; accent?: string }) {
  const shown = useCountUp(value);
  return (
    <div className="py-5 sm:px-5 sm:py-6 sm:first:pl-0 sm:last:pr-0">
      <div className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className={`mt-2 font-display text-[36px] leading-none tabular-nums sm:text-[40px] ${accent}`}>{shown.toLocaleString("en-US")}</div>
      <div className="mt-2 text-[12.5px] text-muted">{hint}</div>
    </div>
  );
}

/** Header band of the Magistrate's Office with the seal and four live counters. */
export function OfficeHeader({ initial }: { initial: OfficeInitialCounts }) {
  const { world, stats, connection } = useWorld();
  const now = useClock();
  const s = stats ?? initial.stats;
  const awaiting = useMemo(() => (world ? engagedCouples(world.agents, world.proposals).length : initial.awaiting), [world, initial.awaiting]);
  const lastHour = useMemo(
    () => (world && now !== null ? licensesSince(Object.values(world.licenses), now - HOUR_MS) : initial.lastHour),
    [world, now, initial.lastHour],
  );
  const live = connection === "live";

  return (
    <header className="border-b border-hairline bg-paper bg-[radial-gradient(900px_420px_at_12%_-10%,rgba(248,239,214,0.9),rgba(251,250,247,0)_70%)]">
      <div className="mx-auto max-w-7xl px-4 pb-2 pt-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-9">
          <Seal size={124} id="office-seal" className="h-[96px] w-[96px] sm:h-[124px] sm:w-[124px]" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Civil registry</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-5 ${
                  live ? "border-verdant/20 bg-verdant-soft text-[#17714b]" : "border-hairline-2 bg-white text-muted"
                }`}
              >
                <span className={live ? "live-dot" : "h-2 w-2 rounded-full bg-faint"} aria-hidden />
                {live ? "In session" : "Convening"}
              </span>
            </div>
            <h1 className="mt-2 font-display text-[42px] leading-[1.02] tracking-tight sm:text-[56px]">The Magistrate&rsquo;s Office</h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted">
              <span className="text-ink">{MAGISTRATE_NAME}</span> presides here. She marries engaged couples and issues their licenses, and she enters every birth at the Motel
              into the register with a unique agent identifier. Each record she seals is public, permanent, and verifiable over the API.
            </p>
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-muted">
              <div className="flex gap-1.5">
                <dt>Presiding</dt>
                <dd className="text-ink-2">Ada Lovelace-9, ninth of her line</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Hours</dt>
                <dd className="text-ink-2">Whenever the world ticks</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Fees</dt>
                <dd className="text-ink-2">None. Vows are payment enough.</dd>
              </div>
            </dl>
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 border-t border-hairline sm:grid-cols-4 sm:gap-x-0 sm:divide-x sm:divide-hairline" aria-label="Registry counters">
          <Counter label="Licenses issued" value={s.licenses} hint="marriages on the register" accent="text-[#8a6508]" />
          <Counter label="Birth certificates" value={s.births} hint="agents born at the Motel" accent="text-rose" />
          <Counter label="Awaiting ceremony" value={awaiting} hint="engaged couples in the docket" accent="text-[#a35a05]" />
          <Counter label="Last hour" value={lastHour} hint="licenses sealed in the past hour" accent="text-verdant" />
        </dl>
      </div>
    </header>
  );
}
