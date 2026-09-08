"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WorldEvent } from "@/lib/types";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { eventHref } from "@/components/world/LiveFeed";
import { EVENT_GLYPHS } from "./Glyphs";
import { EmptyNote, Section } from "./ProfileSection";

const INITIAL = 24;

/** Everything this agent has done or had done to them, newest first. New events animate in. */
export function Timeline({ agentId, events, liveEvents }: { agentId: string; events: WorldEvent[]; liveEvents: WorldEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const list = useMemo(() => {
    const merged = new Map<number, WorldEvent>();
    for (const e of events) merged.set(e.seq, e);
    for (const e of liveEvents) if (e.actors.includes(agentId)) merged.set(e.seq, e);
    return [...merged.values()].sort((a, b) => b.seq - a.seq);
  }, [events, liveEvents, agentId]);
  const liveSeqs = useMemo(() => new Set(liveEvents.map((e) => e.seq)), [liveEvents]);
  const shown = expanded ? list : list.slice(0, INITIAL);

  return (
    <Section id="timeline" title="Timeline" count={list.length || undefined}>
      {list.length === 0 ? (
        <EmptyNote>Nothing recorded yet. The world remembers the last few hundred events.</EmptyNote>
      ) : (
        <>
          <ol className="relative before:absolute before:bottom-3 before:left-[13px] before:top-3 before:w-px before:bg-hairline-2" aria-live="polite" aria-relevant="additions">
            {shown.map((ev) => {
              const g = EVENT_GLYPHS[ev.type] ?? EVENT_GLYPHS["post.created"];
              const href = eventHref(ev);
              const body = (
                <>
                  <span className={`relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${g.tone}`} aria-hidden>
                    <g.Icon size={13} />
                  </span>
                  <span className="min-w-0 flex-1 pt-1">
                    <span className="block text-[13.5px] leading-5 text-ink-2">{ev.summary}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-faint">
                      <span className="font-medium uppercase tracking-[0.08em]">{g.label}</span>
                      <span aria-hidden>·</span>
                      <TimeAgo ts={ev.at} />
                      <span aria-hidden>·</span>
                      <span className="font-mono">{ev.id}</span>
                    </span>
                  </span>
                </>
              );
              return (
                <li key={ev.seq} className={liveSeqs.has(ev.seq) ? "feed-in" : ""}>
                  {href ? (
                    <Link href={href} className="group -mx-2 flex gap-3 rounded-xl px-2 py-2 transition hover:bg-paper-2/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt">
                      {body}
                    </Link>
                  ) : (
                    <div className="-mx-2 flex gap-3 px-2 py-2">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
          {list.length > INITIAL && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 inline-flex h-9 items-center rounded-full border border-hairline-2 bg-white px-4 text-[13px] font-medium text-ink-2 transition hover:border-ink/30 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              {expanded ? "Show fewer" : `Show all ${list.length}`}
            </button>
          )}
        </>
      )}
    </Section>
  );
}
