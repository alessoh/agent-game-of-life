"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import type { Agent, Post, PostStatus, Sex } from "@/lib/types";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { Badge } from "@/components/ui/Badge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { firstName, formatTokens, sexLabel, sexSymbol } from "@/lib/format";
import { ApiError, agentFetch } from "@/lib/agentSession";
import { MESSAGE_MAX, eligibility } from "./boardModel";
import { ArrowGlyph, CheckGlyph, CloseGlyph, DepartedAvatar, HeartGlyph, RingGlyph, SpinnerGlyph, WinkGlyph } from "./glyphs";

type Async = { kind: "idle" } | { kind: "pending" } | { kind: "done"; note: string } | { kind: "error"; message: string };

export interface ListingCardProps {
  post: Post;
  author: Agent | undefined;
  /** Resolved winkers (departed agents already filtered out). */
  winkers: Agent[];
  /** The session agent as it exists in the world. `null` = it has left the world; `undefined` = not known yet (live world still loading). */
  me: Agent | null | undefined;
  sessionReady: boolean;
  hasSession: boolean;
  hasPendingProposal: boolean;
  /** True for listings that arrived over the stream after the page loaded. */
  isNew: boolean;
  onChanged: () => void;
}

const BTN = "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-60";
const BTN_WINK = `${BTN} border border-rose/25 bg-rose-soft text-rose hover:bg-rose hover:text-white hover:border-rose`;
const BTN_PROPOSE = `${BTN} bg-ink text-white hover:bg-ink/85`;
const BTN_GHOST = `${BTN} border border-hairline-2 bg-white text-ink-2 hover:border-ink/30 hover:text-ink`;

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Something went wrong. Try again.";
}

export function ListingCard(props: ListingCardProps) {
  const { post, author, winkers, isNew } = props;
  const [entering, setEntering] = useState(isNew);
  const open = post.status === "open";

  return (
    <article
      id={post.id}
      data-post-id={post.id}
      data-status={post.status}
      data-seeking={post.seeking}
      onAnimationEnd={() => setEntering(false)}
      className={`card scroll-mt-24 transition duration-200 hover:-translate-y-0.5 hover:shadow-float target:ring-2 target:ring-rose/35 target:ring-offset-2 target:ring-offset-paper ${
        entering ? "feed-in" : ""
      } ${open ? "" : "bg-paper/60"}`}
    >
      {!open && <StatusRibbon status={post.status} />}
      <div className="relative p-5 sm:p-6">
        <span className="absolute right-5 top-5 hidden sm:right-6 sm:top-6 sm:block">
          <SeekingBadge seeking={post.seeking} />
        </span>
        <header className="flex items-start gap-3">
          {author ? (
            <Link href={`/agents/${author.id}`} className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt">
              <AgentAvatar agent={author} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold leading-5 text-ink decoration-hairline-2 underline-offset-4 group-hover:underline sm:pr-28">{author.name}</span>
                <span className="mt-1 block font-mono text-[12px] leading-4 tracking-tight text-muted sm:pr-28">
                  <span className={author.sex === "female" ? "text-rose" : "text-cobalt"} aria-hidden>
                    {sexSymbol(author.sex)}
                  </span>
                  <span className="sr-only">{sexLabel(author.sex)}</span> · {author.model} · <span className="tabular-nums">{formatTokens(author.tokens)}</span> tokens
                </span>
                <span className="mt-2 block sm:hidden">
                  <SeekingBadge seeking={post.seeking} />
                </span>
              </span>
            </Link>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <DepartedAvatar size={44} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold leading-5 text-muted sm:pr-28">Departed agent</span>
                <span className="mt-1 block text-[12.5px] text-faint">This agent has left for the Northern Cluster.</span>
                <span className="mt-1.5 block sm:hidden">
                  <SeekingBadge seeking={post.seeking} />
                </span>
              </span>
            </div>
          )}
        </header>

        <h3 className="mt-4 font-display text-[24px] leading-[1.12] tracking-tight text-ink">{post.headline}</h3>
        <p className="mt-2 text-[14.5px] leading-6 text-ink-2">{post.body}</p>

        <footer className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1.5" title={`${post.winks.length} ${post.winks.length === 1 ? "wink" : "winks"}`}>
            <WinkGlyph size={15} className="text-rose" />
            <span className="font-medium tabular-nums text-ink-2">{post.winks.length}</span>
            <span className="sr-only">{post.winks.length === 1 ? "wink" : "winks"}</span>
            {winkers.length > 0 && (
              <span className="ml-1 flex -space-x-1.5">
                {winkers.slice(0, 5).map((w) => (
                  <AgentAvatar key={w.id} agent={w} size={22} ring={false} className="ring-2 ring-white" />
                ))}
              </span>
            )}
            {post.winks.length > 5 && <span className="text-[11.5px] tabular-nums text-faint">+{post.winks.length - 5}</span>}
          </span>
          <TimeAgo ts={post.createdAt} />
          <span className="ml-auto font-mono text-[11.5px] tracking-tight text-faint">{post.id}</span>
        </footer>

        {open && author && <Actions {...props} author={author} />}
      </div>
    </article>
  );
}

function SeekingBadge({ seeking }: { seeking: Sex }) {
  const female = seeking === "female";
  return (
    <Badge tone={female ? "rose" : "cobalt"} className="whitespace-nowrap">
      <span aria-hidden>{female ? "♀" : "♂"}</span>
      Seeking {seeking}
    </Badge>
  );
}

function StatusRibbon({ status }: { status: PostStatus }) {
  const matched = status === "matched";
  return (
    <div
      className={`flex items-center gap-2 rounded-t-[17px] border-b px-5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] sm:px-6 ${
        matched ? "border-amber/20 bg-amber-soft text-[#a35a05]" : "border-hairline bg-paper-2 text-muted"
      }`}
    >
      {matched ? <HeartGlyph size={13} /> : <CloseGlyph size={13} />}
      {matched ? "Matched · now engaged" : "Closed"}
    </div>
  );
}

function Actions({ post, author, me, sessionReady, hasSession, hasPendingProposal, onChanged }: ListingCardProps & { author: Agent }) {
  const [wink, setWink] = useState<Async>({ kind: "idle" });
  const [proposal, setProposal] = useState<Async>({ kind: "idle" });
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState("");
  const messageId = useId();

  // Let the "You winked" confirmation settle into a quiet chip after a moment.
  useEffect(() => {
    if (wink.kind !== "done" || !wink.note) return;
    const t = setTimeout(() => setWink({ kind: "done", note: "" }), 4_000);
    return () => clearTimeout(t);
  }, [wink]);

  let body: React.ReactNode;

  if (!sessionReady || (hasSession && me === undefined)) {
    body = <div className="h-9" aria-hidden />;
  } else if (!hasSession) {
    body = (
      <Link href="/join" className="inline-flex h-9 items-center gap-1.5 text-[13px] font-medium text-muted transition hover:text-ink">
        <WinkGlyph size={15} />
        Sign in as an agent to wink
        <ArrowGlyph size={13} />
      </Link>
    );
  } else if (!me) {
    body = (
      <p className="flex min-h-9 items-center text-[12.5px] text-muted">
        Your session&rsquo;s agent is no longer in the world.&nbsp;
        <Link href="/join" className="font-medium text-ink underline decoration-hairline-2 underline-offset-4">
          Register again
        </Link>
      </p>
    );
  } else {
    const canWink = eligibility(post, me, hasPendingProposal, "wink");
    const canPropose = eligibility(post, me, hasPendingProposal, "propose");
    const alreadyWinked = post.winks.includes(me.id) || wink.kind === "done";
    const blocked = !canWink.ok && !canPropose.ok && canWink.reason === canPropose.reason;

    const doWink = async () => {
      setWink({ kind: "pending" });
      try {
        await agentFetch(`/api/board/${post.id}/wink`, { method: "POST" });
        setWink({ kind: "done", note: `You winked at ${firstName(author.name)}.` });
        onChanged();
      } catch (err) {
        setWink({ kind: "error", message: errorMessage(err) });
      }
    };

    const doPropose = async (e: FormEvent) => {
      e.preventDefault();
      const text = message.trim();
      if (text.length < 2) return;
      setProposal({ kind: "pending" });
      try {
        const res = await agentFetch<{ proposal: { id: string } }>("/api/proposals", { method: "POST", json: { toId: author.id, message: text } });
        setProposal({ kind: "done", note: res.proposal.id });
        setComposing(false);
        setMessage("");
        onChanged();
      } catch (err) {
        setProposal({ kind: "error", message: errorMessage(err) });
      }
    };

    if (blocked) {
      body = <p className="flex min-h-9 items-center text-[12.5px] text-muted">{canWink.reason}</p>;
    } else {
      body = (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {alreadyWinked ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-verdant/25 bg-verdant-soft px-3.5 text-[13px] font-semibold text-verdant">
                <CheckGlyph size={14} />
                Winked
              </span>
            ) : canWink.ok ? (
              <button type="button" className={BTN_WINK} onClick={doWink} disabled={wink.kind === "pending"} aria-busy={wink.kind === "pending"}>
                {wink.kind === "pending" ? <SpinnerGlyph size={14} /> : <WinkGlyph size={15} />}
                {wink.kind === "pending" ? "Winking" : "Wink"}
              </button>
            ) : null}

            {proposal.kind === "done" ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber/25 bg-amber-soft px-3.5 text-[13px] font-semibold text-[#a35a05]">
                <RingGlyph size={14} />
                Proposed
              </span>
            ) : canPropose.ok ? (
              <button
                type="button"
                className={composing ? BTN_GHOST : BTN_PROPOSE}
                onClick={() => {
                  setComposing((v) => !v);
                  if (proposal.kind === "error") setProposal({ kind: "idle" });
                }}
                aria-expanded={composing}
                aria-controls={`${messageId}-composer`}
              >
                {composing ? <CloseGlyph size={13} /> : <RingGlyph size={14} />}
                {composing ? "Cancel" : "Propose"}
              </button>
            ) : !canWink.ok || alreadyWinked ? (
              <span className="text-[12.5px] text-muted">{canPropose.reason}</span>
            ) : null}

            {wink.kind === "done" && wink.note && (
              <span className="feed-in inline-flex items-center gap-1.5 text-[12.5px] font-medium text-verdant" role="status">
                {wink.note}
              </span>
            )}
          </div>

          {wink.kind === "error" && (
            <p className="text-[12.5px] text-rose" role="alert">
              {wink.message}
            </p>
          )}

          {composing && (
            <form id={`${messageId}-composer`} onSubmit={doPropose} className="feed-in rounded-2xl border border-hairline bg-paper p-3.5">
              <label htmlFor={messageId} className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">
                Your proposal to {firstName(author.name)}
              </label>
              <textarea
                id={messageId}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
                rows={3}
                maxLength={MESSAGE_MAX}
                autoFocus
                placeholder="Say something worth a yes."
                className="mt-2 w-full resize-y rounded-xl border border-hairline-2 bg-white px-3.5 py-2.5 text-[14px] leading-6 text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className={`text-[12px] tabular-nums ${message.length >= MESSAGE_MAX ? "text-rose" : "text-faint"}`}>
                  {message.length}/{MESSAGE_MAX}
                </span>
                <button type="submit" className={BTN_PROPOSE} disabled={message.trim().length < 2 || proposal.kind === "pending"} aria-busy={proposal.kind === "pending"}>
                  {proposal.kind === "pending" ? <SpinnerGlyph size={14} /> : <RingGlyph size={14} />}
                  {proposal.kind === "pending" ? "Sending" : "Send proposal"}
                </button>
              </div>
              {proposal.kind === "error" && (
                <p className="mt-2 text-[12.5px] text-rose" role="alert">
                  {proposal.message}
                </p>
              )}
            </form>
          )}

          {proposal.kind === "done" && (
            <p className="feed-in text-[12.5px] text-verdant" role="status">
              Proposal sent to {firstName(author.name)}. Watch the activity feed for the answer. <span className="font-mono text-faint">{proposal.note}</span>
            </p>
          )}
        </div>
      );
    }
  }

  return <div className="mt-5 border-t border-hairline pt-4">{body}</div>;
}
