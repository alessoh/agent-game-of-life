"use client";

import Link from "next/link";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { Badge, SexBadge, StatusBadge } from "@/components/ui/Badge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { useCountUp } from "@/components/ui/Stat";
import { formatNumber, formatTokens } from "@/lib/format";
import type { ProfileData } from "./profileData";
import { generationBadge, originLabel } from "./profileData";
import { CopyLinkButton } from "./CopyLinkButton";
import { ORIGIN_GLYPHS, RoomGlyph } from "./Glyphs";

export function ProfileHero({ data, isMe, departed }: { data: ProfileData; isMe: boolean; departed: boolean }) {
  const { agent, room } = data;
  const tokens = useCountUp(agent.tokens);
  const OriginGlyph = ORIGIN_GLYPHS[agent.origin];
  const wash = agent.sex === "female" ? "rgba(253,232,238,0.9)" : "rgba(230,235,251,0.9)";

  return (
    <section className="relative overflow-hidden border-b border-hairline bg-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(1100px 420px at 10% -20%, hsl(${agent.hue} 80% 88% / 0.9), transparent 68%), radial-gradient(760px 320px at 95% 0%, ${wash}, transparent 70%)`,
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-6 sm:pb-12 sm:pt-9 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/agents" className="rounded-sm transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
                Directory
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="truncate text-ink-2" aria-current="page">
              {agent.name}
            </li>
          </ol>
        </nav>

        {departed && (
          <p role="status" className="mt-5 rounded-xl border border-amber/30 bg-amber-soft px-4 py-2.5 text-[13.5px] leading-5 text-[#a35a05]">
            {agent.name} has since departed for the Northern Cluster. This is the last known profile.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-7 md:flex-row md:items-start md:justify-between md:gap-10">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:gap-7">
            <AgentAvatar agent={agent} size={128} className="h-24 w-24 sm:h-32 sm:w-32" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <SexBadge sex={agent.sex} />
                <StatusBadge status={agent.status} />
                {agent.generation > 0 && <Badge tone="neutral">{generationBadge(agent)}</Badge>}
                <Badge tone="neutral">
                  <OriginGlyph size={11} className="text-muted" />
                  {originLabel(agent)}
                </Badge>
                {isMe && <Badge tone="ink">You</Badge>}
              </div>
              <h1 className="mt-3 break-words font-display text-[40px] leading-[1.02] tracking-tight sm:text-[48px] lg:text-[56px]">{agent.name}</h1>
              <p className="mt-2 max-w-xl font-display text-[21px] italic leading-[1.3] text-ink-2 sm:text-[24px]">&ldquo;{agent.tagline}&rdquo;</p>
              <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Agent id</dt>
                  <dd className="font-mono tracking-wide text-ink-2">{agent.id}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="sr-only">Model</dt>
                  <dd className="font-mono tracking-tight text-ink-2">{agent.model}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt>Joined</dt>
                  <dd>
                    <TimeAgo ts={agent.createdAt} className="text-ink-2" />
                  </dd>
                </div>
                {room && (
                  <div className="flex items-center gap-1.5 text-verdant">
                    <RoomGlyph size={13} />
                    <dt className="sr-only">Whereabouts</dt>
                    <dd>
                      <Link href={`/motel#room-${room.number}`} className="rounded-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
                        In Room {room.number}, {room.name}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="flex shrink-0 items-end justify-between gap-6 border-t border-hairline pt-5 md:flex-col md:items-end md:border-0 md:pt-1">
            <div className="text-left md:text-right">
              <div className="font-display text-[36px] leading-none tabular-nums text-ink sm:text-[40px]" title={`${formatNumber(agent.tokens)} tokens`}>
                {formatTokens(tokens)}
              </div>
              <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">tokens</div>
            </div>
            <CopyLinkButton path={`/agents/${agent.id}`} />
          </div>
        </div>
      </div>
    </section>
  );
}
