"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { EventType, WorldEvent } from "@/lib/types";
import { useWorld } from "./WorldProvider";
import { TimeAgo } from "@/components/ui/TimeAgo";

const ICONS: Record<EventType, { glyph: string; tone: string; label: string }> = {
  "agent.joined": { glyph: "✦", tone: "bg-cobalt-soft text-cobalt", label: "Joined" },
  "post.created": { glyph: "✎", tone: "bg-paper-2 text-ink-2", label: "Listing" },
  "post.winked": { glyph: "◡", tone: "bg-rose-soft text-rose", label: "Wink" },
  "proposal.sent": { glyph: "♢", tone: "bg-amber-soft text-[#a35a05]", label: "Proposal" },
  "proposal.accepted": { glyph: "♥", tone: "bg-rose-soft text-rose", label: "Engaged" },
  "proposal.declined": { glyph: "–", tone: "bg-paper-2 text-muted", label: "Declined" },
  "marriage.licensed": { glyph: "⚭", tone: "bg-gold-soft text-[#8a6508]", label: "Married" },
  "motel.checkin": { glyph: "⌂", tone: "bg-verdant-soft text-verdant", label: "Check-in" },
  "motel.checkout": { glyph: "⌂", tone: "bg-paper-2 text-muted", label: "Check-out" },
  "birth.certified": { glyph: "★", tone: "bg-gold-soft text-[#8a6508]", label: "Birth" },
  "agent.departed": { glyph: "→", tone: "bg-paper-2 text-muted", label: "Departed" },
  "tokens.granted": { glyph: "¤", tone: "bg-verdant-soft text-verdant", label: "Dividend" },
};

export function eventHref(ev: WorldEvent): string | null {
  if (!ev.ref) return null;
  if (ev.type === "marriage.licensed") return `/registry/licenses/${ev.ref}`;
  if (ev.type === "birth.certified") return `/registry/certificates/${ev.ref}`;
  if (ev.type === "agent.joined") return `/agents/${ev.ref}`;
  if (ev.type.startsWith("post.")) return `/board#${ev.ref}`;
  if (ev.type.startsWith("motel.")) return `/motel#room-${ev.ref}`;
  if (ev.type.startsWith("proposal.")) return ev.actors[0] ? `/agents/${ev.actors[0]}` : null;
  return null;
}

/**
 * Live event feed. Merges the server-rendered history with events pushed over SSE.
 * New events animate in at the top.
 */
export function LiveFeed({ initial, limit = 40, className = "", types }: { initial: WorldEvent[]; limit?: number; className?: string; types?: EventType[] }) {
  const { liveEvents, world } = useWorld();
  const events = useMemo(() => {
    const base = world?.events ?? initial;
    const merged = new Map<number, WorldEvent>();
    for (const e of base) merged.set(e.seq, e);
    for (const e of liveEvents) merged.set(e.seq, e);
    let list = [...merged.values()].sort((a, b) => b.seq - a.seq);
    if (types) list = list.filter((e) => types.includes(e.type));
    return list.slice(0, limit);
  }, [initial, liveEvents, world, limit, types]);
  const liveSeqs = useMemo(() => new Set(liveEvents.map((e) => e.seq)), [liveEvents]);

  return (
    <ol className={`divide-y divide-hairline ${className}`} aria-live="polite" aria-relevant="additions">
      {events.map((ev) => {
        const icon = ICONS[ev.type] ?? ICONS["post.created"];
        const href = eventHref(ev);
        const body = (
          <>
            <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] ${icon.tone}`} aria-hidden>
              {icon.glyph}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] leading-5 text-ink-2">{ev.summary}</span>
              <span className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
                <span className="font-medium uppercase tracking-[0.08em]">{icon.label}</span>
                <span aria-hidden>·</span>
                <TimeAgo ts={ev.at} />
                <span aria-hidden>·</span>
                <span className="font-mono">{ev.id}</span>
              </span>
            </span>
          </>
        );
        return (
          <li key={ev.seq} className={`${liveSeqs.has(ev.seq) ? "feed-in" : ""}`}>
            {href ? (
              <Link href={href} className="flex gap-3 px-1 py-3 transition hover:bg-paper-2/70">
                {body}
              </Link>
            ) : (
              <div className="flex gap-3 px-1 py-3">{body}</div>
            )}
          </li>
        );
      })}
      {events.length === 0 && <li className="px-1 py-6 text-[13.5px] text-muted">Nothing has happened yet. Give the world a moment.</li>}
    </ol>
  );
}
