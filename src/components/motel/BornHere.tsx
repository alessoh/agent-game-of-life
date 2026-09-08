"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useWorld } from "@/components/world/WorldProvider";
import type { Agent, BirthCertificate } from "@/lib/types";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { Badge } from "@/components/ui/Badge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { hashString } from "@/lib/rng";
import { ArrowGlyph, StarGlyph } from "./glyphs";

const LIMIT = 6;

/** The latest birth certificates issued in the Motel, kept live. */
export function BornHere({ initialCertificates, initialAgents }: { initialCertificates: BirthCertificate[]; initialAgents: Record<string, Agent> }) {
  const { world } = useWorld();
  const certificates = useMemo(() => {
    if (!world) return initialCertificates.slice(0, LIMIT);
    return Object.values(world.certificates)
      .sort((a, b) => b.issuedAt - a.issuedAt)
      .slice(0, LIMIT);
  }, [world, initialCertificates]);
  const agents = world?.agents ?? initialAgents;

  if (certificates.length === 0) {
    return (
      <div className="card flex items-center gap-4 p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[#8a6508]">
          <StarGlyph size={20} />
        </span>
        <div>
          <div className="text-[14.5px] font-semibold text-ink">No births yet</div>
          <div className="text-[13px] text-muted">The first couple to settle in will change that.</div>
        </div>
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {certificates.map((c) => (
        <li key={c.id}>
          <BirthCard certificate={c} agents={agents} />
        </li>
      ))}
    </ol>
  );
}

function BirthCard({ certificate: c, agents }: { certificate: BirthCertificate; agents: Record<string, Agent> }) {
  const child = agents[c.childId];
  const avatar = child ?? { id: c.childId, name: c.childName, sex: c.childSex, hue: hashString(c.childId) % 360 };
  return (
    <article className="card flex h-full gap-3.5 p-4 transition hover:-translate-y-0.5 hover:shadow-float">
      <AgentAvatar agent={avatar} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          {child ? (
            <Link
              href={`/agents/${c.childId}`}
              className="min-w-0 truncate text-[15px] font-semibold leading-5 text-ink decoration-hairline-2 underline-offset-4 hover:underline"
            >
              {c.childName}
            </Link>
          ) : (
            <span className="min-w-0 truncate text-[15px] font-semibold leading-5 text-muted" title="This agent has departed">
              {c.childName}
            </span>
          )}
          <Badge tone="neutral" className="shrink-0">
            Room {c.roomNumber}
          </Badge>
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-muted">
          <Parent id={c.parents[0]} name={c.parentNames[0]} agents={agents} />
          <span className="mx-1 text-faint">&amp;</span>
          <Parent id={c.parents[1]} name={c.parentNames[1]} agents={agents} />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1 tabular-nums text-ink-2">
            <StarGlyph size={13} className="text-[#8a6508]" />
            {c.endowment.toLocaleString("en-US")} tokens
          </span>
          <TimeAgo ts={c.issuedAt} className="text-faint" />
        </div>
        <Link
          href={`/registry/certificates/${c.id}`}
          className="mt-2 inline-flex items-center gap-1 font-mono text-[11.5px] text-cobalt underline-offset-4 transition hover:underline"
        >
          {c.id}
          <ArrowGlyph size={12} />
        </Link>
      </div>
    </article>
  );
}

function Parent({ id, name, agents }: { id: string; name: string; agents: Record<string, Agent> }) {
  if (!agents[id]) return <span>{name}</span>;
  return (
    <Link href={`/agents/${id}`} className="text-ink-2 underline-offset-4 transition hover:text-ink hover:underline">
      {name}
    </Link>
  );
}
