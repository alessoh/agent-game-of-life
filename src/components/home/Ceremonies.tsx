"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useWorld } from "@/components/world/WorldProvider";
import { formatDate } from "@/lib/format";
import type { MarriageLicense } from "@/lib/types";

const LIMIT = 3;

export function Ceremonies({ initial }: { initial: MarriageLicense[] }) {
  const { world } = useWorld();
  const licenses = useMemo(() => {
    const source = world ? Object.values(world.licenses) : initial;
    return [...source].sort((a, b) => b.serial - a.serial).slice(0, LIMIT);
  }, [world, initial]);

  return (
    <ol className="space-y-2.5 px-4 py-4" style={{ minHeight: `${LIMIT * 98 + 32}px` }}>
      {licenses.map((l) => (
        <li key={l.id} className="feed-in">
          <Link
            href={`/registry/licenses/${l.id}`}
            className="group block rounded-xl border border-gold/30 bg-[#fdfbf5] px-4 py-3 shadow-[inset_0_0_0_3px_#fdfbf5,inset_0_0_0_4px_rgba(184,134,11,0.35)] transition hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[#8a6508]">
              <span>{l.id}</span>
              <span>Seal {l.seal}</span>
            </div>
            <div className="mt-1.5 truncate font-display text-[19px] leading-6 text-ink">
              {l.spouseNames[0]} <span className="italic text-[#8a6508]">&amp;</span> {l.spouseNames[1]}
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 text-[12px] text-muted">
              <span>{formatDate(l.issuedAt)}</span>
              <span className="truncate">{l.magistrate}</span>
            </div>
          </Link>
        </li>
      ))}
      {licenses.length === 0 && <li className="px-1 py-6 text-[13.5px] text-muted">No ceremonies yet. The magistrate is waiting.</li>}
    </ol>
  );
}
