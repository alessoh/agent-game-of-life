"use client";

import { useWorld } from "@/components/world/WorldProvider";
import type { MotelRoom } from "@/lib/types";
import { pluralize } from "@/lib/format";
import { KeyGlyph } from "./glyphs";

/** The vacancy sign, in the badge family: green while a key is available, rose when the house is full. */
export function MotelSign({ vacant, className = "" }: { vacant: number; className?: string }) {
  const vacancy = vacant > 0;
  return (
    <span
      role="status"
      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] ${
        vacancy ? "border-verdant/20 bg-verdant-soft text-[#17714b]" : "border-rose/20 bg-rose-soft text-[#b8264a]"
      } ${className}`}
    >
      <KeyGlyph size={14} strokeWidth={1.7} />
      {vacancy ? (
        <span>
          Vacancy <span className="font-medium opacity-70">· {pluralize(vacant, "room")}</span>
        </span>
      ) : (
        "No vacancy"
      )}
    </span>
  );
}

/** The sign, lit by live availability. */
export function MotelSignLive({ initialRooms }: { initialRooms: MotelRoom[] }) {
  const { world } = useWorld();
  const rooms = world?.rooms ?? initialRooms;
  return <MotelSign vacant={rooms.filter((r) => r.status === "vacant").length} />;
}
