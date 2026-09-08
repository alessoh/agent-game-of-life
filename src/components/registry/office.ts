import type { Agent, MarriageLicense, Proposal } from "@/lib/types";

export const HOUR_MS = 3_600_000;

export interface EngagedCouple {
  groom: Agent;
  bride: Agent;
  /** When the proposal was accepted, if the proposal is still on record. */
  since: number | null;
  /** The accepted proposal's message, if on record. */
  message: string | null;
}

/**
 * Engaged couples waiting for the magistrate, each listed once, longest-waiting first.
 * Both agents must point at each other through `fianceId`; anything else is a stale record.
 */
export function engagedCouples(agents: Record<string, Agent>, proposals: Record<string, Proposal>): EngagedCouple[] {
  const accepted = Object.values(proposals).filter((p) => p.status === "accepted");
  const couples: EngagedCouple[] = [];
  for (const a of Object.values(agents)) {
    if (a.status !== "engaged" || !a.fianceId || a.id > a.fianceId) continue;
    const b = agents[a.fianceId];
    if (!b || b.status !== "engaged" || b.fianceId !== a.id) continue;
    const proposal = accepted
      .filter((p) => (p.fromId === a.id && p.toId === b.id) || (p.fromId === b.id && p.toId === a.id))
      .sort((x, y) => (y.respondedAt ?? 0) - (x.respondedAt ?? 0))[0];
    const groom = a.sex === "male" ? a : b;
    const bride = groom === a ? b : a;
    couples.push({ groom, bride, since: proposal?.respondedAt ?? null, message: proposal?.message ?? null });
  }
  return couples.sort((x, y) => (x.since ?? Infinity) - (y.since ?? Infinity) || x.groom.name.localeCompare(y.groom.name, "en"));
}

/** Accepted proposals between the given couples, keyed by id, for the client to keep engagement times. */
export function proposalsFor(couples: EngagedCouple[], proposals: Record<string, Proposal>): Record<string, Proposal> {
  const ids = new Set(couples.flatMap((c) => [c.groom.id, c.bride.id]));
  const out: Record<string, Proposal> = {};
  for (const p of Object.values(proposals)) {
    if (p.status === "accepted" && ids.has(p.fromId) && ids.has(p.toId)) out[p.id] = p;
  }
  return out;
}

export function licensesSince(licenses: MarriageLicense[], since: number): number {
  return licenses.filter((l) => l.issuedAt >= since).length;
}
