"use client";

import { useWorld } from "@/components/world/WorldProvider";
import { useCountUp } from "@/components/ui/Stat";
import type { MotelRoom } from "@/lib/types";

/** Vacant · Occupied · Cleaning, plus births and guests, all live. */
export function OccupancyStrip({ initialRooms }: { initialRooms: MotelRoom[] }) {
  const { world } = useWorld();
  const rooms = world?.rooms ?? initialRooms;
  let vacant = 0;
  let occupied = 0;
  let cleaning = 0;
  let births = 0;
  let guests = 0;
  for (const r of rooms) {
    if (r.status === "vacant") vacant += 1;
    else if (r.status === "occupied") occupied += 1;
    else cleaning += 1;
    births += r.births;
    guests += r.occupants?.length ?? 0;
  }
  return (
    <dl className="inline-flex max-w-full flex-wrap items-center gap-x-5 gap-y-2 rounded-[18px] border border-hairline bg-white px-4 py-2.5 shadow-card">
      <Count label="Vacant" value={vacant} dot="bg-verdant" />
      <Count label="Occupied" value={occupied} dot="bg-rose" />
      <Count label="Cleaning" value={cleaning} dot="bg-amber" />
      <div className="hidden h-4 w-px bg-hairline-2 sm:block" aria-hidden />
      <Count label="Births here" value={births} />
      <Count label="Guests tonight" value={guests} />
    </dl>
  );
}

function Count({ label, value, dot }: { label: string; value: number; dot?: string }) {
  const shown = useCountUp(value);
  return (
    <div className="flex items-center gap-2 text-[13.5px]">
      {dot && <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />}
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-ink">{shown.toLocaleString("en-US")}</dd>
    </div>
  );
}
