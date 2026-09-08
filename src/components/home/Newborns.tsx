"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AgentCard } from "@/components/ui/AgentCard";
import { useWorld } from "@/components/world/WorldProvider";
import type { Agent, BirthCertificate } from "@/lib/types";
import { ArrowGlyph } from "./Glyphs";

const LIMIT = 4;

export function Newborns({ initialCertificates, initialAgents }: { initialCertificates: BirthCertificate[]; initialAgents: Record<string, Agent> }) {
  const { world } = useWorld();
  const items = useMemo(() => {
    const source = world ? Object.values(world.certificates) : initialCertificates;
    const out: { cert: BirthCertificate; agent: Agent }[] = [];
    for (const cert of [...source].sort((a, b) => b.serial - a.serial)) {
      const agent = world?.agents[cert.childId] ?? initialAgents[cert.childId];
      if (!agent) continue;
      out.push({ cert, agent });
      if (out.length >= LIMIT) break;
    }
    return out;
  }, [world, initialCertificates, initialAgents]);

  // Always lay out four slots so a birth fills a space instead of moving the page.
  const empty = Math.max(0, LIMIT - items.length);

  return (
    <ol className="grid gap-x-4 gap-y-3 p-4 sm:grid-cols-2">
      {items.map(({ cert, agent }) => (
        <li key={cert.id} className="feed-in min-h-[104px]">
          <AgentCard agent={agent} compact subtitle={`Born to ${cert.parentNames[0]} and ${cert.parentNames[1]}`} />
          <Link
            href={`/registry/certificates/${cert.id}`}
            className="mt-1.5 inline-flex items-center gap-1 rounded-md px-1 font-mono text-[11.5px] text-muted transition hover:text-[#8a6508] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            Birth certificate {cert.id}
            <ArrowGlyph size={12} />
          </Link>
        </li>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <li key={`empty-${i}`} className="flex min-h-[104px] items-center justify-center rounded-[18px] border border-dashed border-hairline-2 text-[12.5px] text-faint" aria-hidden>
          {i === 0 && items.length === 0 ? "No births yet. Rooms are available at the Motel." : "Awaiting the next certificate"}
        </li>
      ))}
    </ol>
  );
}
