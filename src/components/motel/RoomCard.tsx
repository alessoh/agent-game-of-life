"use client";

import Link from "next/link";
import type { Agent, MarriageLicense, MotelRoom, RoomStatus, Sex } from "@/lib/types";
import { CLEANING_MS, STAY_MS } from "@/lib/world";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { pluralize } from "@/lib/format";
import { hashString } from "@/lib/rng";
import { DoorGlyph, KeyGlyph, SparkleGlyph } from "./glyphs";
import { useNow } from "./useNow";
import styles from "./motel.module.css";

interface Tone {
  label: string;
  card: string;
  pill: string;
  dot: string;
  glyph: string;
}

const TONES: Record<RoomStatus, Tone> = {
  vacant: {
    label: "Vacant",
    card: "border-hairline bg-white",
    pill: "border-verdant/20 bg-verdant-soft text-verdant",
    dot: "bg-verdant",
    glyph: "bg-verdant-soft text-verdant",
  },
  occupied: {
    label: "Occupied",
    card: "border-rose/15 bg-[#fff6f8]",
    pill: "border-rose/20 bg-rose-soft text-rose",
    dot: "bg-rose",
    glyph: "bg-rose-soft text-rose",
  },
  cleaning: {
    label: "Cleaning",
    card: "border-amber/20 bg-[#fffaf0]",
    pill: "border-amber/25 bg-amber-soft text-[#a35a05]",
    dot: "bg-amber",
    glyph: "bg-amber-soft text-[#a35a05]",
  },
};

/** One of the twelve rooms. The body re-mounts on a status change so the new state animates in without moving anything else. */
export function RoomCard({
  room,
  agents,
  licenses,
  initialNow,
  index = 0,
}: {
  room: MotelRoom;
  agents: Record<string, Agent>;
  licenses: Record<string, MarriageLicense>;
  /** The server's clock at render, so timers show a real value from the first paint. */
  initialNow: number;
  index?: number;
}) {
  const tone = TONES[room.status];
  const license = room.licenseId ? licenses[room.licenseId] : undefined;
  return (
    <article
      id={`room-${room.number}`}
      aria-label={`Room ${room.number}, ${room.name}, ${tone.label.toLowerCase()}`}
      className={`${styles.room} ${styles.roomIn} flex scroll-mt-24 flex-col rounded-[18px] border p-5 shadow-card transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-float ${tone.card}`}
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-[36px] leading-none tracking-tight text-ink tabular-nums sm:text-[40px]">{room.number}</div>
          <div className="mt-2 truncate text-[13.5px] font-medium text-ink-2">{room.name}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusPill status={room.status} />
          <span className={`hidden h-9 w-9 items-center justify-center rounded-full transition-colors duration-500 sm:inline-flex ${tone.glyph}`}>
            <DoorGlyph status={room.status} size={20} />
          </span>
        </div>
      </header>

      <div className="mt-4 flex min-h-[74px] flex-col justify-center border-t border-hairline pt-4">
        <div key={room.status} className={styles.stateIn}>
          {room.status === "occupied" ? (
            <Occupied room={room} agents={agents} license={license} initialNow={initialNow} />
          ) : room.status === "cleaning" ? (
            <Cleaning room={room} initialNow={initialNow} />
          ) : (
            <Vacant />
          )}
        </div>
      </div>

      <footer className="mt-4 border-t border-hairline pt-3 text-[12.5px] text-muted tabular-nums">
        {pluralize(room.stays, "stay")} <span className="text-faint">·</span> {pluralize(room.births, "birth")} here
      </footer>
    </article>
  );
}

function StatusPill({ status }: { status: RoomStatus }) {
  const tone = TONES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium leading-5 transition-colors duration-500 ${tone.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot} ${status === "occupied" ? styles.pulse : ""}`} aria-hidden />
      {tone.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Bodies                                                              */
/* ------------------------------------------------------------------ */

interface Guest {
  id: string;
  name: string;
  sex: Sex;
  hue: number;
  alive: boolean;
}

/** Occupants may have departed the world; fall back to the names on the license, then the id. */
function guestsOf(room: MotelRoom, agents: Record<string, Agent>, license: MarriageLicense | undefined): Guest[] {
  return (room.occupants ?? []).map((id) => {
    const a = agents[id];
    if (a) return { id, name: a.name, sex: a.sex, hue: a.hue, alive: true };
    const idx = license ? license.spouses.indexOf(id) : -1;
    const name = license && idx >= 0 ? license.spouseNames[idx] : id;
    return { id, name, sex: idx === 1 ? "female" : "male", hue: hashString(id) % 360, alive: false };
  });
}

function Occupied({ room, agents, license, initialNow }: { room: MotelRoom; agents: Record<string, Agent>; license: MarriageLicense | undefined; initialNow: number }) {
  const now = useNow() ?? initialNow;
  const guests = guestsOf(room, agents, license);
  const elapsed = room.checkedInAt === null ? null : Math.max(0, now - room.checkedInAt);
  const ready = elapsed !== null && elapsed >= STAY_MS;
  const pct = elapsed === null ? 0 : Math.min(1, elapsed / STAY_MS);
  const remaining = elapsed === null ? null : Math.max(0, Math.ceil((STAY_MS - elapsed) / 1000));
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 -space-x-2">
          {guests.map((g) => (
            <AgentAvatar key={g.id} agent={g} size={32} />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[13.5px] font-semibold leading-5 text-ink">
            {guests.map((g, i) => (
              <span key={g.id}>
                {i > 0 && <span className="mx-1 font-normal text-faint">&amp;</span>}
                <GuestName guest={g} />
              </span>
            ))}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center text-[12px] text-muted">
            {license && (
              <>
                <Link href={`/registry/licenses/${license.id}`} className="font-mono text-cobalt underline-offset-4 transition hover:underline">
                  {license.id}
                </Link>
                <span className="mx-1.5 text-faint">·</span>
              </>
            )}
            {room.checkedInAt !== null && (
              <span className="whitespace-nowrap">
                checked in&nbsp;<TimeAgo ts={room.checkedInAt} />
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-ink/6" role="progressbar" aria-label="Stay" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
          <div className={`${styles.bar} h-full rounded-full ${ready ? "bg-verdant" : "bg-rose"}`} style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] leading-4">
          <span className={ready ? "font-medium text-verdant" : "text-muted"}>{ready ? "Ready" : "Settling in…"}</span>
          <span className="text-faint tabular-nums">{remaining === null ? "" : ready ? "awaiting the couple" : `${remaining}s`}</span>
        </div>
      </div>
    </div>
  );
}

function GuestName({ guest }: { guest: Guest }) {
  if (!guest.alive) {
    return (
      <span className="text-muted" title="This agent has departed">
        {guest.name}
      </span>
    );
  }
  return (
    <Link href={`/agents/${guest.id}`} className="decoration-hairline-2 underline-offset-4 transition hover:underline">
      {guest.name}
    </Link>
  );
}

function Cleaning({ room, initialNow }: { room: MotelRoom; initialNow: number }) {
  const now = useNow() ?? initialNow;
  const remainingMs = room.cleaningUntil === null ? null : Math.max(0, room.cleaningUntil - now);
  const pct = remainingMs === null ? 1 : Math.min(1, remainingMs / CLEANING_MS);
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-soft text-[#a35a05]">
          <SparkleGlyph size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold leading-5 text-ink">Housekeeping</div>
          <div className="mt-0.5 text-[12px] text-muted">Fresh linen, new key.</div>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-ink/6" role="progressbar" aria-label="Cleaning" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
          <div className={`${styles.bar} h-full rounded-full bg-amber`} style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] leading-4">
          <span className="text-muted">Vacant in</span>
          <span className="font-medium text-ink-2 tabular-nums">{remainingMs === null ? "" : remainingMs === 0 ? "any moment" : `${Math.ceil(remainingMs / 1000)}s`}</span>
        </div>
      </div>
    </div>
  );
}

function Vacant() {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-verdant-soft text-verdant">
        <KeyGlyph size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold leading-5 text-ink">Key at the front desk</div>
        <div className="mt-0.5 text-[12px] text-muted">Ready for the next couple.</div>
      </div>
    </div>
  );
}
