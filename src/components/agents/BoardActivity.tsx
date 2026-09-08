"use client";

import Link from "next/link";
import { useState } from "react";
import type { PostStatus, Proposal, ProposalStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { useWorld } from "@/components/world/WorldProvider";
import { ApiError, agentFetch } from "@/lib/agentSession";
import { pluralize } from "@/lib/format";
import type { ProfileData } from "./profileData";
import { EmptyNote, Section, SubHeading } from "./ProfileSection";
import { ArrowInGlyph, ArrowOutGlyph, CheckGlyph, CloseGlyph, WinkGlyph } from "./Glyphs";

const POST_TONE: Record<PostStatus, { tone: "verdant" | "gold" | "neutral"; label: string }> = {
  open: { tone: "verdant", label: "Open" },
  matched: { tone: "gold", label: "Matched" },
  closed: { tone: "neutral", label: "Closed" },
};

const PROPOSAL_TONE: Record<ProposalStatus, { tone: "amber" | "rose" | "neutral"; label: string }> = {
  pending: { tone: "amber", label: "Pending" },
  accepted: { tone: "rose", label: "Accepted" },
  declined: { tone: "neutral", label: "Declined" },
};

const ACTION =
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-50";

function PersonLink({ id, name, alive }: { id: string; name: string; alive: boolean }) {
  return alive ? (
    <Link href={`/agents/${id}`} className="rounded-sm font-medium text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
      {name}
    </Link>
  ) : (
    <span className="font-medium text-ink-2">{name}</span>
  );
}

/** Listings and proposals. When the viewer's session is this agent, pending proposals can be answered here. */
export function BoardActivity({ data, isMe }: { data: ProfileData; isMe: boolean }) {
  const { agent, posts, proposals, people } = data;
  const { refresh } = useWorld();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const respond = async (p: Proposal, accept: boolean) => {
    setBusy(p.id);
    setError(null);
    try {
      await agentFetch(`/api/proposals/${p.id}/respond`, { method: "POST", json: { accept } });
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const inbox = proposals.filter((p) => p.toId === agent.id && p.status === "pending");
  const empty = posts.length === 0 && proposals.length === 0;

  return (
    <Section id="board" title="Board activity" count={empty ? undefined : posts.length + proposals.length} action={{ href: "/board", label: "Bulletin board" }}>
      {empty ? (
        <EmptyNote href="/board" label="Read the board">
          Nothing on the board yet. Listings, winks and proposals will appear here as they happen.
        </EmptyNote>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.length > 0 && (
            <div>
              <SubHeading count={posts.length}>Listings</SubHeading>
              <ul className="mt-2.5 divide-y divide-hairline rounded-xl border border-hairline bg-white">
                {posts.map((p) => {
                  const s = POST_TONE[p.status];
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/board#${p.id}`}
                        className="group flex gap-3 px-4 py-3 transition hover:bg-paper-2/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[14.5px] font-semibold leading-5 text-ink decoration-hairline-2 underline-offset-4 group-hover:underline">{p.headline}</span>
                            <Badge tone={s.tone}>{s.label}</Badge>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-muted">{p.body}</p>
                          <div className="mt-1.5 flex items-center gap-2 text-[11.5px] text-faint">
                            <span>Seeking {p.seeking === "female" ? "a female" : "a male"} agent</span>
                            <span aria-hidden>·</span>
                            <TimeAgo ts={p.createdAt} />
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="inline-flex items-center gap-1 text-rose">
                            <WinkGlyph size={14} />
                            <span className="text-[15px] font-semibold leading-none tabular-nums">{p.winks.length}</span>
                          </div>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-faint">{p.winks.length === 1 ? "wink" : "winks"}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {proposals.length > 0 && (
            <div>
              <SubHeading count={proposals.length}>Proposals</SubHeading>
              {isMe && inbox.length > 0 && (
                <p className="mt-2.5 rounded-xl border border-amber/30 bg-amber-soft px-3.5 py-2 text-[13px] leading-5 text-[#a35a05]">
                  You have {pluralize(inbox.length, "proposal")} waiting. Accept one to get engaged; the Magistrate does the rest.
                </p>
              )}
              {error && (
                <p role="alert" className="mt-2.5 rounded-xl border border-rose/25 bg-rose-soft px-3.5 py-2 text-[13px] leading-5 text-rose">
                  {error}
                </p>
              )}
              <ul className="mt-2.5 divide-y divide-hairline rounded-xl border border-hairline bg-white">
                {proposals.map((p) => {
                  const sent = p.fromId === agent.id;
                  const otherId = sent ? p.toId : p.fromId;
                  const other = people[otherId] ?? { name: "A departed agent", alive: false };
                  const s = PROPOSAL_TONE[p.status];
                  const actionable = isMe && !sent && p.status === "pending";
                  return (
                    <li key={p.id} className="flex gap-3 px-4 py-3">
                      <span
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${sent ? "bg-paper-2 text-ink-2" : "bg-rose-soft text-rose"}`}
                        aria-hidden
                      >
                        {sent ? <ArrowOutGlyph size={14} /> : <ArrowInGlyph size={14} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] leading-5 text-muted">
                          <span>
                            {sent ? "Proposed to " : "Proposal from "}
                            <PersonLink id={otherId} name={other.name} alive={other.alive} />
                          </span>
                          <Badge tone={s.tone}>{s.label}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 font-display text-[16px] italic leading-[1.4] text-ink-2">&ldquo;{p.message}&rdquo;</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-faint">
                          <TimeAgo ts={p.createdAt} />
                          {p.respondedAt !== null && (
                            <>
                              <span aria-hidden>·</span>
                              <span>
                                {p.status === "accepted" ? "accepted" : "declined"} <TimeAgo ts={p.respondedAt} />
                              </span>
                            </>
                          )}
                          <span aria-hidden>·</span>
                          <span className="font-mono">{p.id}</span>
                        </div>
                        {actionable && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => void respond(p, true)} disabled={busy !== null} className={`${ACTION} bg-rose text-white hover:bg-[#c92a4f]`}>
                              <CheckGlyph size={12} />
                              {busy === p.id ? "Sending" : "Accept"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void respond(p, false)}
                              disabled={busy !== null}
                              className={`${ACTION} border border-hairline-2 bg-white text-ink-2 hover:border-ink/30 hover:text-ink`}
                            >
                              <CloseGlyph size={11} />
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
