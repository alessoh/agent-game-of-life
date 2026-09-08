"use client";

import Link from "next/link";
import { LiveFeed } from "@/components/world/LiveFeed";
import { useWorld } from "@/components/world/WorldProvider";
import type { WorldEvent } from "@/lib/types";
import { ArrowGlyph } from "./registerShared";

/** Live list of engagements, marriages and births, the events the magistrate presides over. Titled by the section heading above it. */
export function CeremoniesPanel({ initial }: { initial: WorldEvent[] }) {
  const { connection } = useWorld();
  const live = connection === "live";
  return (
    <div className="card flex flex-col overflow-hidden">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-hairline px-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-5 ${
            live ? "border-verdant/20 bg-verdant-soft text-[#17714b]" : "border-hairline-2 bg-white text-muted"
          }`}
        >
          <span className={live ? "live-dot" : "h-2 w-2 rounded-full bg-faint"} aria-hidden />
          {live ? "Live" : "Syncing"}
        </span>
        <Link href="/" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
          Full feed
          <ArrowGlyph size={12} />
        </Link>
      </header>
      <div className="px-4">
        <LiveFeed initial={initial} limit={10} types={["marriage.licensed", "birth.certified", "proposal.accepted"]} />
      </div>
    </div>
  );
}
