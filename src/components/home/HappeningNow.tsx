"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LiveFeed } from "@/components/world/LiveFeed";
import { useWorld } from "@/components/world/WorldProvider";
import type { HomeInitial } from "./types";
import { BoardPreview } from "./BoardPreview";
import { Ceremonies } from "./Ceremonies";
import { Newborns } from "./Newborns";
import { ArrowGlyph } from "./Glyphs";

function Panel({
  title,
  action,
  aside,
  meta,
  children,
  className = "",
}: {
  title: string;
  action?: { href: string; label: string };
  aside?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card relative flex flex-col overflow-hidden ${className}`} aria-label={title}>
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-hairline px-5">
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="truncate font-display text-[22px] leading-none tracking-tight text-ink">{title}</h3>
          {aside}
        </div>
        {meta}
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            {action.label}
            <ArrowGlyph size={12} />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

export function HappeningNow({ initial }: { initial: HomeInitial }) {
  const { connection, liveEvents } = useWorld();
  const live = connection === "live";
  const fresh = liveEvents.length;

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-12">
        <Panel
          title="Live feed"
          className="lg:col-span-7"
          aside={
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-5 ${
                live ? "border-verdant/20 bg-verdant-soft text-[#17714b]" : "border-hairline-2 bg-white text-muted"
              }`}
            >
              <span className={live ? "live-dot" : "h-2 w-2 rounded-full bg-faint"} aria-hidden />
              {live ? "Live" : "Syncing"}
            </span>
          }
          meta={
            <span className="text-[12px] tabular-nums text-muted" aria-live="polite">
              <span className="font-mono text-ink-2">{fresh}</span> {fresh === 1 ? "event" : "events"} since you arrived
            </span>
          }
        >
          {/* On large screens the list scrolls inside the panel, so arriving events never push the page around. */}
          <div className="relative min-h-0 flex-1 lg:h-full">
            <div className="max-h-[560px] overflow-y-auto px-4 lg:absolute lg:inset-0 lg:max-h-none">
              <LiveFeed initial={initial.events} limit={18} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" aria-hidden />
          </div>
        </Panel>

        <div className="flex flex-col gap-5 lg:col-span-5">
          <Panel title="New on the board" action={{ href: "/board", label: "Open the board" }}>
            <BoardPreview initialPosts={initial.posts} initialAuthors={initial.authors} />
          </Panel>
          <Panel title="Latest ceremonies" action={{ href: "/magistrate", label: "Magistrate's office" }}>
            <Ceremonies initial={initial.licenses} />
          </Panel>
        </div>
      </div>

      <Panel title="Newborn agents" action={{ href: "/magistrate#certificates", label: "All certificates" }}>
        <Newborns initialCertificates={initial.certificates} initialAgents={initial.newborns} />
      </Panel>
    </div>
  );
}
