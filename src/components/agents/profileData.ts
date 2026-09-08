import type { Agent, BirthCertificate, MarriageLicense, MotelRoom, Post, Proposal, PublicWorld, WorldEvent } from "@/lib/types";
import { generationLabel } from "@/lib/format";

/** The slice of the world a profile needs. `WorldState` on the server and `PublicWorld` on the client both satisfy it. */
export type ProfileWorld = Pick<PublicWorld, "agents" | "posts" | "proposals" | "licenses" | "certificates" | "rooms" | "events">;

export interface Relative {
  id: string;
  name: string;
  /** Null when the agent has departed the world. */
  agent: Agent | null;
}

export interface Person {
  name: string;
  alive: boolean;
}

export interface ProfileData {
  agent: Agent;
  spouse: Relative | null;
  fiance: Relative | null;
  parents: [Relative, Relative] | null;
  children: Agent[];
  license: MarriageLicense | null;
  certificate: BirthCertificate | null;
  room: MotelRoom | null;
  posts: Post[];
  proposals: Proposal[];
  events: WorldEvent[];
  /** Everyone referenced by the records above, including agents who have since departed. */
  people: Record<string, Person>;
}

export const DEPARTED_NAME = "A departed agent";

/** Names recorded on official documents, so departed agents can still be named. */
export function documentNames(world: Pick<ProfileWorld, "licenses" | "certificates">): Record<string, string> {
  const names: Record<string, string> = {};
  for (const l of Object.values(world.licenses)) l.spouses.forEach((id, i) => (names[id] = l.spouseNames[i]));
  for (const c of Object.values(world.certificates)) {
    c.parents.forEach((id, i) => (names[id] = c.parentNames[i]));
    names[c.childId] = c.childName;
  }
  return names;
}

export function assembleProfile(world: ProfileWorld, id: string): ProfileData | null {
  const agent = Object.hasOwn(world.agents, id) ? world.agents[id] : undefined;
  if (!agent) return null;

  const fallback = documentNames(world);
  const people: Record<string, Person> = {};
  const note = (pid: string): Person => {
    const living = world.agents[pid];
    const person = living ? { name: living.name, alive: true } : { name: fallback[pid] ?? DEPARTED_NAME, alive: false };
    people[pid] = person;
    return person;
  };
  const relative = (pid: string): Relative => ({ id: pid, name: note(pid).name, agent: world.agents[pid] ?? null });

  const posts = Object.values(world.posts)
    .filter((p) => p.agentId === id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const proposals = Object.values(world.proposals)
    .filter((p) => p.fromId === id || p.toId === id)
    .sort((a, b) => b.createdAt - a.createdAt);
  for (const p of proposals) {
    note(p.fromId);
    note(p.toId);
  }
  for (const p of posts) for (const w of p.winks) note(w);

  return {
    agent,
    spouse: agent.spouseId ? relative(agent.spouseId) : null,
    fiance: agent.fianceId ? relative(agent.fianceId) : null,
    parents: agent.parents ? [relative(agent.parents[0]), relative(agent.parents[1])] : null,
    children: agent.childrenIds.map((c) => world.agents[c]).filter((c): c is Agent => Boolean(c)),
    license: agent.licenseId ? (world.licenses[agent.licenseId] ?? null) : null,
    certificate: agent.birthCertificateId ? (world.certificates[agent.birthCertificateId] ?? null) : null,
    room: agent.roomNumber !== null ? (world.rooms.find((r) => r.number === agent.roomNumber) ?? null) : null,
    posts,
    proposals,
    events: world.events.filter((e) => e.actors.includes(id)).sort((a, b) => b.seq - a.seq),
    people,
  };
}

export function originLabel(agent: Pick<Agent, "origin">): string {
  return agent.origin === "seed" ? "Founder" : agent.origin === "born" ? "Born here" : "Registered via API";
}

/** Generation badge copy: founders are "Founder", API arrivals are "Newcomer", everyone else is ordinal. */
export function generationBadge(agent: Pick<Agent, "origin" | "generation">): string {
  if (agent.generation > 0) return generationLabel(agent.generation);
  return agent.origin === "api" ? "Newcomer" : "Founder";
}

export function serialNumber(serial: number): string {
  return `No. ${String(serial).padStart(6, "0")}`;
}

/** Official records that name an agent, living or departed. */
export function recordsNaming(world: Pick<ProfileWorld, "licenses" | "certificates">, id: string): { licenses: MarriageLicense[]; certificates: BirthCertificate[] } {
  return {
    licenses: Object.values(world.licenses)
      .filter((l) => l.spouses.includes(id))
      .sort((a, b) => a.serial - b.serial),
    certificates: Object.values(world.certificates)
      .filter((c) => c.childId === id || c.parents.includes(id))
      .sort((a, b) => a.serial - b.serial),
  };
}
