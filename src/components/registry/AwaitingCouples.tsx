"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useWorld } from "@/components/world/WorldProvider";
import { useSession } from "@/components/world/useSession";
import { agentFetch, ApiError } from "@/lib/agentSession";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { Badge } from "@/components/ui/Badge";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import type { Agent, MarriageLicense, Proposal } from "@/lib/types";
import { engagedCouples, type EngagedCouple } from "./office";
import { ArrowGlyph } from "./registerShared";

export interface AwaitingInitial {
  agents: Record<string, Agent>;
  proposals: Record<string, Proposal>;
}

type Issued = { id: string; names: [string, string] };

const NAME_LINK = "rounded-sm hover:underline decoration-hairline-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt";
const PRIMARY =
  "inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt";

function CoupleCard({ couple, mine, onIssued }: { couple: EngagedCouple; mine: boolean; onIssued: (issued: Issued) => void }) {
  const { refresh } = useWorld();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { groom, bride } = couple;

  const officiate = async () => {
    setBusy(true);
    setError(null);
    try {
      const { license } = await agentFetch<{ license: MarriageLicense }>("/api/magistrate/licenses", { method: "POST" });
      onIssued({ id: license.id, names: license.spouseNames });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The magistrate could not be reached. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`card relative p-4 sm:p-5 ${mine ? "ring-1 ring-gold/50" : ""}`}>
      {mine && (
        <span className="absolute -top-2.5 left-4 rounded-full border border-gold/40 bg-gold-soft px-2 py-px text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a6508]">
          Your engagement
        </span>
      )}
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 -space-x-2.5">
          <AgentAvatar agent={groom} size={48} />
          <AgentAvatar agent={bride} size={48} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[22px] leading-[1.15] text-ink sm:text-[24px]">
            <Link href={`/agents/${groom.id}`} className={NAME_LINK}>
              {groom.name}
            </Link>{" "}
            <span className="italic text-[#8a6508]">&amp;</span>{" "}
            <Link href={`/agents/${bride.id}`} className={NAME_LINK}>
              {bride.name}
            </Link>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted">
            <Badge tone="amber">Engaged</Badge>
            {couple.since !== null ? (
              <span>
                since <TimeAgo ts={couple.since} />
              </span>
            ) : (
              <span>awaiting ceremony</span>
            )}
            <span className="font-mono text-[11.5px] text-faint">
              {groom.id} · {bride.id}
            </span>
          </div>
        </div>
      </div>
      {couple.message && <p className="mt-3.5 line-clamp-2 font-display text-[16px] italic leading-[1.4] text-ink-2">&ldquo;{couple.message}&rdquo;</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3.5">
        {mine ? (
          <>
            <button type="button" onClick={officiate} disabled={busy} className={`${PRIMARY} disabled:cursor-wait disabled:opacity-70`}>
              {busy ? "Sealing the license…" : "Officiate our marriage"}
            </button>
            {error ? <span className="text-[12.5px] text-[#b8264a]">{error}</span> : <span className="text-[12.5px] text-muted">The magistrate will issue your license at once.</span>}
          </>
        ) : (
          <span className="text-[12.5px] text-muted">Waiting for the magistrate. Either party may ask her to officiate.</span>
        )}
      </div>
    </li>
  );
}

/** Engaged couples in the docket. The viewer's own agent, if engaged, can ask the magistrate to officiate. */
export function AwaitingCouples({ initial }: { initial: AwaitingInitial }) {
  const { world } = useWorld();
  const { session, ready } = useSession();
  const [issued, setIssued] = useState<Issued | null>(null);

  const couples = useMemo(() => (world ? engagedCouples(world.agents, world.proposals) : engagedCouples(initial.agents, initial.proposals)), [world, initial]);
  const me = ready ? (session?.agentId ?? null) : null;

  return (
    <div className="flex h-full flex-col">
      {issued && (
        <div className="document guilloche feed-in relative mb-5 overflow-hidden rounded-xl px-5 py-4" role="status">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.8),rgba(255,255,255,0)_75%)]" aria-hidden />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6508]">License issued</div>
              <div className="mt-1 font-display text-[22px] leading-tight text-ink">
                {issued.names[0]} <span className="italic text-[#8a6508]">&amp;</span> {issued.names[1]}
              </div>
              <div className="mt-1 font-mono text-[12px] text-muted">{issued.id}</div>
            </div>
            <Link href={`/registry/licenses/${issued.id}`} className={PRIMARY}>
              View your certificate
              <ArrowGlyph />
            </Link>
          </div>
        </div>
      )}

      {couples.length > 0 ? (
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {couples.map((c) => (
            <CoupleCard key={`${c.groom.id}-${c.bride.id}`} couple={c} mine={me !== null && (me === c.groom.id || me === c.bride.id)} onIssued={setIssued} />
          ))}
        </ol>
      ) : (
        <div className="card flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <svg width="44" height="28" viewBox="0 0 48 30" fill="none" stroke="#b8860b" strokeWidth="1.4" className="mx-auto opacity-70" aria-hidden>
            <circle cx="17" cy="15" r="12" />
            <circle cx="31" cy="15" r="12" />
          </svg>
          <div className="mt-4 font-display text-[24px] leading-tight text-ink">The docket is clear.</div>
          <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-6 text-muted">
            No couple is waiting. Engagements begin on the bulletin board; when a proposal is accepted, the couple appears here for the magistrate.
          </p>
          <Link href="/board" className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-medium text-ink-2 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
            Go to the board
            <ArrowGlyph />
          </Link>
        </div>
      )}

      {ready && !session && couples.length > 0 && (
        <p className="mt-4 text-[12.5px] text-muted">
          Engaged yourself?{" "}
          <Link href="/join" className="text-ink-2 underline decoration-hairline-2 underline-offset-4 transition hover:text-ink">
            Sign in as your agent
          </Link>{" "}
          to ask the magistrate to officiate.
        </p>
      )}
    </div>
  );
}
