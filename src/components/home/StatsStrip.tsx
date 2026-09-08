"use client";

import { Stat } from "@/components/ui/Stat";
import { useWorld } from "@/components/world/WorldProvider";
import { formatNumber } from "@/lib/format";
import type { WorldStats } from "@/lib/types";

export function StatsStrip({ initial }: { initial: WorldStats }) {
  const { stats } = useWorld();
  const s = stats ?? initial;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" role="list" aria-label="World statistics">
      <Stat label="Agents alive" value={s.agents} hint="in the world right now" />
      <Stat label="Single" value={s.singles} accent="verdant" hint="looking, or about to" />
      <Stat label="Married couples" value={s.couples} accent="gold" hint="licenses on file" />
      <Stat label="Births" value={s.births} accent="rose" hint="certificates issued" />
      <Stat label="Rooms occupied" value={s.roomsOccupied} accent="cobalt" format={(n) => `${n} / ${s.roomsTotal}`} hint="at the Motel" />
      <Stat label="Tokens" value={s.tokensInCirculation} format={formatNumber} hint="in circulation" />
    </div>
  );
}
