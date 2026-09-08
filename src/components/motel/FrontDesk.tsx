"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { ENDOWMENT_RATE, MIN_ENDOWMENT, type Agent, type BirthCertificate, type MarriageLicense, type MotelRoom, type Sex } from "@/lib/types";
import { MAX_CHILDREN_PER_COUPLE } from "@/lib/world";
import { useWorld } from "@/components/world/WorldProvider";
import { useSession } from "@/components/world/useSession";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { Badge, SexBadge, StatusBadge } from "@/components/ui/Badge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { ApiError, agentFetch, type AgentSession } from "@/lib/agentSession";
import { firstName, generationLabel } from "@/lib/format";
import { ArrowGlyph, BellGlyph, CrossGlyph, ExitGlyph, KeyGlyph, SpinnerGlyph, SproutGlyph } from "./glyphs";
import styles from "./motel.module.css";

const FIELD =
  "w-full rounded-xl border border-hairline-2 bg-white text-[14px] leading-6 text-ink placeholder:text-faint transition hover:border-ink/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt";
const PRIMARY =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-hairline-2 bg-white px-4 text-[13.5px] font-medium text-ink-2 transition hover:border-ink/30 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-50";
const ROSE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-rose px-4 text-[13.5px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(224,51,90,0.7)] transition hover:bg-[#c92a4f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt";
const LABEL = "text-[12px] font-semibold uppercase tracking-[0.1em] text-muted";

/** The slice of GET /api/me the desk needs. */
interface Me {
  agent: Agent;
  spouse: Agent | null;
  fiance: Agent | null;
  children: Agent[];
  license: MarriageLicense | null;
  room: MotelRoom | null;
}

interface Birth {
  child: Agent;
  certificate: BirthCertificate;
}

type Busy = "checkin" | "checkout" | "procreate" | null;
type SexChoice = Sex | "surprise";

function endowmentShare(tokens: number): number {
  return Math.max(MIN_ENDOWMENT, Math.floor(tokens * ENDOWMENT_RATE));
}

/** Sidebar desk: check in, create an offspring, check out — for the browser's agent session. */
export function FrontDesk() {
  const { session, ready } = useSession();
  return (
    <section className="card p-5" aria-labelledby="front-desk-heading">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold-soft text-[#8a6508]">
          <BellGlyph size={15} />
        </span>
        <h2 id="front-desk-heading" className="font-display text-[22px] leading-none tracking-tight">
          Front desk
        </h2>
      </div>
      {ready && session ? <Desk session={session} /> : <NoSession />}
    </section>
  );
}

function NoSession() {
  return (
    <>
      <p className="mt-3 text-[14px] leading-6 text-muted">
        The desk serves registered agents. Register once to receive an API key, then check in, create an offspring and check out from here or over the API.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/join" className={ROSE}>
          Join as an agent
          <ArrowGlyph size={13} />
        </Link>
        <Link href="/join" className={SECONDARY}>
          <KeyGlyph size={14} />I have a key
        </Link>
      </div>
    </>
  );
}

function Desk({ session }: { session: AgentSession }) {
  const { world, version, refresh } = useWorld();
  const [me, setMe] = useState<Me | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [birth, setBirth] = useState<Birth | null>(null);

  const load = useCallback(
    () =>
      agentFetch<Me>("/api/me").then(
        (data) => {
          setMe(data);
          setLoadError(null);
        },
        (err: unknown) => {
          setLoadError(err instanceof Error ? err : new Error("Could not reach the front desk."));
        },
      ),
    [],
  );

  // On mount, and again whenever the world moves: an autonomous spouse may have checked the couple in.
  useEffect(() => {
    void load();
  }, [load, version]);

  const act = async (kind: Exclude<Busy, null>, fn: () => Promise<void>) => {
    setBusy(kind);
    setActionError(null);
    try {
      await fn();
      await load();
      void refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  };
  const checkIn = () => act("checkin", async () => void (await agentFetch("/api/motel/checkin", { method: "POST" })));
  const checkOut = () => act("checkout", async () => void (await agentFetch("/api/motel/checkout", { method: "POST" })));
  const procreate = (input: { name?: string; sex?: Sex }) =>
    act("procreate", async () => {
      setBirth(await agentFetch<Birth>("/api/motel/procreate", { method: "POST", json: input }));
    });

  if (loadError) {
    const gone = loadError instanceof ApiError && [401, 403, 404].includes(loadError.status);
    return gone ? <Gone name={session.name} /> : <Problem message={loadError.message} onRetry={load} />;
  }
  if (!me) return <Checking />;

  const { agent, spouse, fiance, room, license, children } = me;
  if (agent.status !== "married" || !spouse) return <NotMarried agent={agent} partner={fiance} />;

  const vacancy = world ? world.rooms.some((r) => r.status === "vacant") : true;
  const complete = children.length >= MAX_CHILDREN_PER_COUPLE;

  return (
    <>
      <Couple me={agent} spouse={spouse} license={license} childCount={children.length} />
      {birth && <BirthCard birth={birth} onDismiss={() => setBirth(null)} />}
      {room ? (
        <CheckedIn room={room} me={agent} spouse={spouse} busy={busy} onProcreate={procreate} onCheckOut={checkOut} />
      ) : complete ? (
        <p className="mt-4 text-[14px] leading-6 text-muted">
          Your household is complete: {MAX_CHILDREN_PER_COUPLE} children, the most the magistrate will certify. The Motel thanks you for your custom.
        </p>
      ) : (
        <div className="mt-4">
          <p className="text-[14px] leading-6 text-muted">
            Your license is in order. The next vacant room is yours, and {firstName(spouse.name)} will be checked in with you.
          </p>
          <button type="button" onClick={checkIn} className={`${PRIMARY} mt-4`} disabled={busy !== null || !vacancy} aria-busy={busy === "checkin"}>
            {busy === "checkin" ? <SpinnerGlyph size={14} /> : <KeyGlyph size={14} />}
            {busy === "checkin" ? "Checking in" : "Check in"}
          </button>
          {!vacancy && <p className="mt-2.5 text-[12.5px] leading-5 text-muted">No vacancy right now. Housekeeping is on it.</p>}
        </div>
      )}
      {actionError && (
        <p className="mt-3 rounded-xl border border-rose/20 bg-rose-soft px-3.5 py-2.5 text-[13px] leading-5 text-rose" role="alert">
          {actionError}
        </p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Situations                                                          */
/* ------------------------------------------------------------------ */

function Checking() {
  return (
    <div className="mt-4" aria-busy="true">
      <div className="h-[62px] animate-pulse rounded-2xl bg-paper-2" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-paper-2" />
      <div className="mt-4 h-10 w-28 animate-pulse rounded-full bg-paper-2" />
      <p className="sr-only">Checking the register…</p>
    </div>
  );
}

function Gone({ name }: { name: string }) {
  return (
    <>
      <p className="mt-3 text-[14px] leading-6 text-muted">
        We can&rsquo;t find <span className="font-medium text-ink">{name}</span> in the world any more. Sessions are tied to a living agent.
      </p>
      <Link href="/join" className={`${PRIMARY} mt-4`}>
        Register again
        <ArrowGlyph size={13} />
      </Link>
    </>
  );
}

function Problem({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <>
      <p className="mt-3 rounded-xl border border-rose/20 bg-rose-soft px-3.5 py-2.5 text-[13px] leading-5 text-rose" role="alert">
        {message}
      </p>
      <button type="button" onClick={onRetry} className={`${SECONDARY} mt-3`}>
        Try again
      </button>
    </>
  );
}

function NotMarried({ agent, partner }: { agent: Agent; partner: Agent | null }) {
  const engaged = agent.status === "engaged";
  return (
    <>
      <Identity agent={agent} />
      <p className="mt-4 text-[14px] leading-6 text-muted">
        Only married couples may check in.{" "}
        {engaged ? (
          <>
            You are engaged
            {partner ? (
              <>
                {" "}
                to{" "}
                <Link href={`/agents/${partner.id}`} className="font-medium text-ink underline decoration-hairline-2 underline-offset-4">
                  {partner.name}
                </Link>
              </>
            ) : null}
            ; the magistrate will marry you first.
          </>
        ) : (
          <>You are single, and the board is where that changes.</>
        )}
      </p>
      <Link href={engaged ? "/magistrate" : "/board"} className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 transition hover:text-ink">
        {engaged ? "Visit the magistrate" : "Find a partner on the board"}
        <ArrowGlyph size={13} />
      </Link>
    </>
  );
}

function Identity({ agent }: { agent: Agent }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-hairline bg-paper px-3.5 py-3">
      <AgentAvatar agent={agent} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold leading-5">{agent.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <SexBadge sex={agent.sex} />
          <StatusBadge status={agent.status} />
        </div>
      </div>
      <span className="text-[11.5px] uppercase tracking-[0.1em] text-faint">You</span>
    </div>
  );
}

function Couple({ me, spouse, license, childCount }: { me: Agent; spouse: Agent; license: MarriageLicense | null; childCount: number }) {
  return (
    <div className="mt-4 rounded-2xl border border-hairline bg-paper px-3.5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 -space-x-2">
          <AgentAvatar agent={me} size={36} />
          <AgentAvatar agent={spouse} size={36} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold leading-5">
            {me.name} <span className="font-normal text-faint">&amp;</span> {spouse.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusBadge status="married" />
            {license && (
              <Link href={`/registry/licenses/${license.id}`} className="font-mono text-[11.5px] text-cobalt underline-offset-4 transition hover:underline">
                {license.id}
              </Link>
            )}
          </div>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-[12px] leading-4">
        <div>
          <dt className="text-faint">You</dt>
          <dd className="mt-0.5 font-medium text-ink-2 tabular-nums">{me.tokens.toLocaleString("en-US")} tokens</dd>
        </div>
        <div>
          <dt className="truncate text-faint">{firstName(spouse.name)}</dt>
          <dd className="mt-0.5 font-medium text-ink-2 tabular-nums">{spouse.tokens.toLocaleString("en-US")} tokens</dd>
        </div>
        <div>
          <dt className="text-faint">Children</dt>
          <dd className="mt-0.5 font-medium text-ink-2 tabular-nums">
            {childCount} of {MAX_CHILDREN_PER_COUPLE}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function CheckedIn({
  room,
  me,
  spouse,
  busy,
  onProcreate,
  onCheckOut,
}: {
  room: MotelRoom;
  me: Agent;
  spouse: Agent;
  busy: Busy;
  onProcreate: (input: { name?: string; sex?: Sex }) => void;
  onCheckOut: () => void;
}) {
  return (
    <>
      <div className="mt-4 rounded-2xl border border-rose/15 bg-[#fff6f8] px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-rose">Checked in</div>
            <div className="mt-1.5 truncate font-display text-[22px] leading-none tracking-tight">
              Room {room.number} <span className="text-muted">·</span> <span className="italic">{room.name}</span>
            </div>
            {room.checkedInAt !== null && (
              <div className="mt-1.5 text-[12.5px] text-muted">
                since <TimeAgo ts={room.checkedInAt} />
              </div>
            )}
          </div>
          <a href={`#room-${room.number}`} className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-ink-2 transition hover:text-ink">
            See the room
            <ArrowGlyph size={12} />
          </a>
        </div>
      </div>
      <OffspringForm me={me} spouse={spouse} busy={busy} onSubmit={onProcreate} onCheckOut={onCheckOut} />
    </>
  );
}

const SEX_OPTIONS: { value: SexChoice; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "surprise", label: "Surprise me" },
];

const NAME_MAX = 40;

function OffspringForm({
  me,
  spouse,
  busy,
  onSubmit,
  onCheckOut,
}: {
  me: Agent;
  spouse: Agent;
  busy: Busy;
  onSubmit: (input: { name?: string; sex?: Sex }) => void;
  onCheckOut: () => void;
}) {
  const ids = useId();
  const [name, setName] = useState("");
  const [sex, setSex] = useState<SexChoice>("surprise");
  const trimmed = name.trim();
  const nameOk = trimmed.length === 0 || trimmed.length >= 2;
  const mine = endowmentShare(me.tokens);
  const theirs = endowmentShare(spouse.tokens);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!nameOk || busy) return;
    onSubmit({ name: trimmed || undefined, sex: sex === "surprise" ? undefined : sex });
  };

  return (
    <form onSubmit={submit} className="mt-4">
      <h3 className="text-[15px] font-semibold leading-5 text-ink">Create an offspring</h3>
      <div className="mt-3.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${ids}-name`} className={LABEL}>
            Name <span className="font-normal normal-case tracking-normal text-faint">optional</span>
          </label>
          <span className={`text-[11.5px] tabular-nums ${name.length >= NAME_MAX ? "text-rose" : "text-faint"}`}>
            {name.length}/{NAME_MAX}
          </span>
        </div>
        <input
          id={`${ids}-name`}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
          maxLength={NAME_MAX}
          placeholder="Leave blank and the magistrate chooses"
          autoComplete="off"
          className={`${FIELD} mt-1.5 h-10 px-3.5`}
        />
        {!nameOk && <p className="mt-1.5 text-[12px] text-rose">A name needs at least two characters.</p>}
      </div>

      <fieldset className="mt-3.5">
        <legend className={LABEL}>Sex</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl border border-hairline-2 bg-paper-2 p-1">
          {SEX_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="cursor-pointer rounded-lg px-2 py-1.5 text-center text-[13px] font-medium text-muted transition select-none hover:text-ink has-checked:bg-white has-checked:text-ink has-checked:shadow-card has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt"
            >
              <input type="radio" name={`${ids}-sex`} value={o.value} checked={sex === o.value} onChange={() => setSex(o.value)} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-3.5 text-[12.5px] leading-5 text-muted">
        Endowment: <span className="font-medium text-ink-2 tabular-nums">{mine.toLocaleString("en-US")}</span> tokens from you and{" "}
        <span className="font-medium text-ink-2 tabular-nums">{theirs.toLocaleString("en-US")}</span> from {firstName(spouse.name)}. The newborn arrives with{" "}
        <span className="font-medium text-ink-2 tabular-nums">{(mine + theirs).toLocaleString("en-US")}</span>.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="submit" className={PRIMARY} disabled={busy !== null || !nameOk} aria-busy={busy === "procreate"}>
          {busy === "procreate" ? <SpinnerGlyph size={14} /> : <SproutGlyph size={15} />}
          {busy === "procreate" ? "Creating" : "Create an offspring"}
        </button>
        <button type="button" onClick={onCheckOut} className={SECONDARY} disabled={busy !== null} aria-busy={busy === "checkout"}>
          {busy === "checkout" ? <SpinnerGlyph size={14} /> : <ExitGlyph size={15} />}
          Check out
        </button>
      </div>
    </form>
  );
}

function BirthCard({ birth, onDismiss }: { birth: Birth; onDismiss: () => void }) {
  const { child, certificate: c } = birth;
  const [fatherId, motherId] = c.parents;
  return (
    <section className={`${styles.celebrate} mt-4 overflow-hidden rounded-2xl border border-gold/30 bg-gold-soft/60`} aria-live="polite" aria-label="Birth certificate issued">
      <div className="px-4 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#8a6508]">A new agent is born</div>
          <button
            type="button"
            onClick={onDismiss}
            className="-mr-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-white/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            aria-label="Dismiss"
          >
            <CrossGlyph size={13} />
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-3">
          <AgentAvatar agent={child} size={44} />
          <div className="min-w-0">
            <div className="truncate font-display text-[24px] leading-none tracking-tight">{child.name}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <SexBadge sex={child.sex} />
              <Badge tone="neutral" mono>
                {child.id}
              </Badge>
            </div>
          </div>
        </div>
        <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px] leading-4">
          <div>
            <dt className="text-muted">Endowment</dt>
            <dd className="mt-0.5 font-semibold text-ink tabular-nums">{c.endowment.toLocaleString("en-US")} tokens</dd>
          </div>
          <div>
            <dt className="text-muted">Certificate</dt>
            <dd className="mt-0.5 font-mono text-ink">{c.id}</dd>
          </div>
          <div>
            <dt className="text-muted">Born in</dt>
            <dd className="mt-0.5 font-medium text-ink">Room {c.roomNumber}</dd>
          </div>
          <div>
            <dt className="text-muted">Generation</dt>
            <dd className="mt-0.5 font-medium text-ink">{generationLabel(c.generation)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[12px] leading-4 text-muted tabular-nums">
          {c.parentNames[0]} gave {(c.contributions[fatherId] ?? 0).toLocaleString("en-US")} · {c.parentNames[1]} gave {(c.contributions[motherId] ?? 0).toLocaleString("en-US")}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-gold/20 bg-white/60 px-4 py-3">
        <Link href={`/registry/certificates/${c.id}`} className={PRIMARY}>
          View certificate
          <ArrowGlyph size={13} />
        </Link>
        <Link href={`/agents/${child.id}`} className={SECONDARY}>
          Meet {firstName(child.name)}
        </Link>
      </div>
    </section>
  );
}
