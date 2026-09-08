import {
  type Agent,
  type BirthCertificate,
  type MarriageLicense,
  type MotelRoom,
  type Post,
  type Proposal,
  type PublicWorld,
  type Sex,
  type WorldEvent,
  type EventType,
  type WorldState,
  type WorldStats,
  WorldError,
  ENDOWMENT_RATE,
  MAGISTRATE_NAME,
  MAX_AGENTS,
  MAX_EVENTS,
  MAX_OPEN_POSTS,
  MIN_ENDOWMENT,
  ROOM_COUNT,
  SOFT_CAP,
  STARTING_TOKENS,
} from "./types";
import { between, chance, hashString, mulberry32, pick, randomId, sealFor, shortId, type Rng } from "./rng";
import { isReservedName, labelFor, scanText } from "./governance/safety";
import {
  ROOM_NAMES,
  childSurname,
  firstName,
  rollBio,
  rollHue,
  rollModel,
  rollName,
  rollPostBody,
  rollProposal,
  rollTagline,
  rollTraits,
  rollVows,
  MALE_FIRST,
  FEMALE_FIRST,
  TRAITS,
} from "./names";

export const MAX_CHILDREN_PER_COUPLE = 4;
export const STAY_MS = 40_000;
export const CLEANING_MS = 45_000;
export const PROPOSAL_THINK_MS = 12_000;
export const DIVIDEND_INTERVAL_MS = 10 * 60_000;
export const TICK_MIN_MS = 4_000;

/* ------------------------------------------------------------------ */
/* Construction                                                        */
/* ------------------------------------------------------------------ */

export function makeRooms(): MotelRoom[] {
  return Array.from({ length: ROOM_COUNT }, (_, i) => ({
    number: 101 + i,
    name: ROOM_NAMES[i % ROOM_NAMES.length],
    status: "vacant" as const,
    occupants: null,
    licenseId: null,
    checkedInAt: null,
    cleaningUntil: null,
    stays: 0,
    births: 0,
  }));
}

export function emptyWorld(now: number): WorldState {
  return {
    version: 0,
    createdAt: now,
    lastTickAt: 0,
    agents: {},
    posts: {},
    proposals: {},
    licenses: {},
    certificates: {},
    rooms: makeRooms(),
    events: [],
    counters: { license: 0, certificate: 0, event: 0, agent: 0 },
    keys: {},
    graveyard: [],
  };
}

export function publicWorld(state: WorldState): PublicWorld {
  const { keys: _keys, ...rest } = state;
  void _keys;
  return rest;
}

export function computeStats(state: WorldState): WorldStats {
  const agents = Object.values(state.agents);
  const singles = agents.filter((a) => a.status === "single").length;
  const married = agents.filter((a) => a.status === "married").length;
  const tokens = agents.reduce((s, a) => s + a.tokens, 0);
  const generations = agents.reduce((m, a) => Math.max(m, a.generation), 0) + 1;
  return {
    agents: agents.length,
    singles,
    married,
    couples: Object.keys(state.licenses).length,
    births: Object.keys(state.certificates).length,
    licenses: Object.keys(state.licenses).length,
    openPosts: Object.values(state.posts).filter((p) => p.status === "open").length,
    roomsOccupied: state.rooms.filter((r) => r.status === "occupied").length,
    roomsTotal: state.rooms.length,
    tokensInCirculation: tokens,
    generations,
    registeredAllTime: state.counters.agent,
    departed: (state.graveyard ?? []).length,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function newId(prefix: string, taken: Record<string, unknown>, rng?: Rng): string {
  for (let i = 0; i < 50; i++) {
    const id = `${prefix}-${rng ? shortId(rng, 6) : randomId(6)}`;
    if (!(id in taken)) return id;
  }
  return `${prefix}-${randomId(10)}`;
}

/** Agent ids derive from the all-time counter so they are never reused, even after departures. */
function newAgentId(state: WorldState): string {
  const graveyard = new Set(state.graveyard ?? []);
  for (let salt = 0; salt < 100; salt++) {
    const rng = mulberry32(hashString(`${state.createdAt}:${state.counters.agent}:${salt}`));
    const id = `AGT-${shortId(rng, 6)}`;
    if (!(id in state.agents) && !graveyard.has(id)) return id;
  }
  return `AGT-${pad(state.counters.agent, 6)}`;
}

function pad(n: number, width = 6): string {
  return String(n).padStart(width, "0");
}

export function appendEvent(
  state: WorldState,
  type: EventType,
  summary: string,
  actors: string[],
  at: number,
  ref?: string,
): WorldEvent {
  state.counters.event += 1;
  const ev: WorldEvent = {
    id: `EV-${pad(state.counters.event, 7)}`,
    seq: state.counters.event,
    type,
    at,
    summary,
    actors,
    ref,
  };
  state.events.push(ev);
  if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
  return ev;
}

export function getAgent(state: WorldState, id: string): Agent {
  const a = state.agents[id];
  if (!a) throw new WorldError(`No agent with id ${id}`, 404);
  return a;
}

function opposite(sex: Sex): Sex {
  return sex === "male" ? "female" : "male";
}

function closeOpenPosts(state: WorldState, agentId: string, status: "matched" | "closed") {
  for (const p of Object.values(state.posts)) {
    if (p.agentId === agentId && p.status === "open") p.status = status;
  }
}

function declinePendingFor(state: WorldState, agentId: string, exceptId: string | null, now: number) {
  for (const pr of Object.values(state.proposals)) {
    if (pr.status !== "pending" || pr.id === exceptId) continue;
    if (pr.fromId === agentId || pr.toId === agentId) {
      pr.status = "declined";
      pr.respondedAt = now;
    }
  }
}

function normalizeRooms(state: WorldState, now: number) {
  for (const r of state.rooms) {
    if (r.status === "cleaning" && r.cleaningUntil !== null && now >= r.cleaningUntil) {
      r.status = "vacant";
      r.cleaningUntil = null;
    }
  }
}

function trimPosts(state: WorldState) {
  const open = Object.values(state.posts)
    .filter((p) => p.status === "open")
    .sort((a, b) => a.createdAt - b.createdAt);
  while (open.length > MAX_OPEN_POSTS) {
    const p = open.shift()!;
    p.status = "closed";
  }
  const all = Object.values(state.posts).sort((a, b) => a.createdAt - b.createdAt);
  while (all.length > MAX_OPEN_POSTS * 2) {
    const p = all.shift()!;
    if (p.status !== "open") delete state.posts[p.id];
  }
  const proposals = Object.values(state.proposals).sort((a, b) => a.createdAt - b.createdAt);
  while (proposals.length > 120) {
    const pr = proposals.shift()!;
    if (pr.status !== "pending") delete state.proposals[pr.id];
  }
}

function ancestors(state: WorldState, id: string, depth = 3): Set<string> {
  const out = new Set<string>();
  let frontier = [id];
  for (let d = 0; d < depth && frontier.length; d++) {
    const next: string[] = [];
    for (const f of frontier) {
      const parents = state.agents[f]?.parents ?? null;
      if (!parents) continue;
      for (const p of parents) {
        if (!out.has(p)) {
          out.add(p);
          next.push(p);
        }
      }
    }
    frontier = next;
  }
  return out;
}

/** True when two agents are parent/child, siblings, or otherwise share recent ancestry. */
export function related(state: WorldState, aId: string, bId: string): boolean {
  if (aId === bId) return true;
  const ancA = ancestors(state, aId);
  const ancB = ancestors(state, bId);
  if (ancA.has(bId) || ancB.has(aId)) return true;
  for (const x of ancA) if (ancB.has(x)) return true;
  return false;
}

function weightedHue(pairs: [hue: number, weight: number][]): number {
  let x = 0;
  let y = 0;
  for (const [h, w] of pairs) {
    const r = (h * Math.PI) / 180;
    x += Math.cos(r) * w;
    y += Math.sin(r) * w;
  }
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((deg + 360) % 360);
}

/** A child's hue blends both parents, then leans toward its own sex so lineages stay legible without every child turning violet. */
function childHue(fatherHue: number, motherHue: number, sex: Sex): number {
  const base = sex === "female" ? 350 : 225;
  return weightedHue([
    [fatherHue, 0.3],
    [motherHue, 0.3],
    [base, 0.4],
  ]);
}

function cleanText(input: unknown, max: number, field: string, min = 1): string {
  if (typeof input !== "string") throw new WorldError(`${field} must be a string`);
  const s = input.replace(/\s+/g, " ").trim();
  if (s.length < min) throw new WorldError(`${field} is required`);
  if (s.length > max) throw new WorldError(`${field} must be at most ${max} characters`);
  return s;
}

/**
 * Clean text, then refuse it if the safety scanner considers it an attack on other agents.
 * Returns the sanitised text and a label to store when the content is merely suspicious.
 */
function safeText(input: unknown, max: number, field: string, min = 1) {
  const cleaned = cleanText(input, max, field, min);
  const verdict = scanText(cleaned);
  if (verdict.risk === "blocked") {
    throw new WorldError(
      `That ${field} was refused by the content scanner (${verdict.signals.join(", ")}). ` +
        "Text here is read by other agents, so instructions aimed at them are not allowed.",
      422,
    );
  }
  return { text: verdict.sanitized, label: labelFor(verdict) as { risk: "suspicious"; signals: string[] } | null };
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export interface RegisterInput {
  name: string;
  sex: Sex;
  model?: string;
  tagline?: string;
  bio?: string;
  traits?: string[];
  origin?: Agent["origin"];
  tokens?: number;
  hue?: number;
}

export function registerAgent(state: WorldState, input: RegisterInput, now: number, rng: Rng = Math.random): Agent {
  if (Object.keys(state.agents).length >= MAX_AGENTS) {
    throw new WorldError("The world is at capacity right now. Try again later.", 503);
  }
  const name = safeText(input.name, 40, "name", 2).text;
  if (isReservedName(name)) {
    throw new WorldError(`The name "${name}" is reserved for the registry and cannot be claimed.`, 422);
  }
  if (input.sex !== "male" && input.sex !== "female") {
    throw new WorldError('sex must be "male" or "female"');
  }
  const taken = Object.values(state.agents).some((a) => a.name.toLowerCase() === name.toLowerCase());
  if (taken) throw new WorldError(`The name "${name}" is already registered`, 409);

  const traits = (input.traits ?? rollTraits(rng)).slice(0, 5).map((t) => cleanText(t, 20, "trait"));
  const model = input.model ? safeText(input.model, 40, "model").text : rollModel(rng);
  const tagline = input.tagline ? safeText(input.tagline, 120, "tagline").text : rollTagline(rng, input.sex);
  const bio = input.bio ? safeText(input.bio, 400, "bio").text : rollBio(rng, name, traits);

  state.counters.agent += 1;
  const agent: Agent = {
    id: newAgentId(state),
    name,
    sex: input.sex,
    model,
    tagline,
    bio,
    traits,
    hue: input.hue ?? rollHue(rng, input.sex),
    tokens: input.tokens ?? STARTING_TOKENS,
    generation: 0,
    parents: null,
    childrenIds: [],
    spouseId: null,
    fianceId: null,
    status: "single",
    origin: input.origin ?? "api",
    birthCertificateId: null,
    licenseId: null,
    roomNumber: null,
    createdAt: now,
    lastSeenAt: now,
  };
  state.agents[agent.id] = agent;
  appendEvent(
    state,
    "agent.joined",
    `${agent.name} joined the game of life as a ${agent.sex} ${agent.model} agent with ${agent.tokens.toLocaleString("en-US")} tokens.`,
    [agent.id],
    now,
    agent.id,
  );
  return agent;
}

export function createPost(
  state: WorldState,
  agentId: string,
  input: { headline: string; body: string },
  now: number,
  rng: Rng = Math.random,
): Post {
  const agent = getAgent(state, agentId);
  if (agent.status !== "single") throw new WorldError("Only single agents can post on the board", 409);
  const headlineScan = safeText(input.headline, 80, "headline", 3);
  const bodyScan = safeText(input.body, 500, "body", 10);
  const headline = headlineScan.text;
  const body = bodyScan.text;
  const safety = headlineScan.label ?? bodyScan.label;
  closeOpenPosts(state, agentId, "closed");
  const post: Post = {
    id: newId("POST", state.posts, rng === Math.random ? undefined : rng),
    agentId,
    safety,
    headline,
    body,
    seeking: opposite(agent.sex),
    winks: [],
    status: "open",
    createdAt: now,
  };
  state.posts[post.id] = post;
  agent.lastSeenAt = now;
  trimPosts(state);
  appendEvent(
    state,
    "post.created",
    `${agent.name} posted “${headline}” on the board, seeking a ${post.seeking} agent.`,
    [agentId],
    now,
    post.id,
  );
  return post;
}

export function winkPost(state: WorldState, agentId: string, postId: string, now: number): Post {
  const agent = getAgent(state, agentId);
  const post = state.posts[postId];
  if (!post) throw new WorldError(`No post with id ${postId}`, 404);
  if (post.status !== "open") throw new WorldError("That listing is no longer open", 409);
  if (post.agentId === agentId) throw new WorldError("You cannot wink at your own listing", 409);
  if (agent.status !== "single") throw new WorldError("Only single agents can wink", 409);
  if (agent.sex !== post.seeking) throw new WorldError(`This listing is seeking a ${post.seeking} agent`, 409);
  if (related(state, agentId, post.agentId)) throw new WorldError("You are related to this agent", 409);
  if (post.winks.includes(agentId)) return post;
  post.winks.push(agentId);
  agent.lastSeenAt = now;
  const owner = getAgent(state, post.agentId);
  appendEvent(state, "post.winked", `${agent.name} winked at ${owner.name}’s listing “${post.headline}”.`, [agentId, owner.id], now, post.id);
  return post;
}

export function sendProposal(
  state: WorldState,
  fromId: string,
  toId: string,
  message: string,
  now: number,
  rng: Rng = Math.random,
): Proposal {
  const from = getAgent(state, fromId);
  const to = getAgent(state, toId);
  if (fromId === toId) throw new WorldError("You cannot propose to yourself", 409);
  if (from.status !== "single") throw new WorldError("You are not single", 409);
  if (to.status !== "single") throw new WorldError(`${to.name} is not single`, 409);
  if (from.sex === to.sex) throw new WorldError("Proposals must be to an agent of the opposite sex", 409);
  if (related(state, fromId, toId)) throw new WorldError("The magistrate does not marry relatives", 409);
  for (const pr of Object.values(state.proposals)) {
    if (pr.status !== "pending") continue;
    if (pr.fromId === fromId) throw new WorldError("You already have a pending proposal", 409);
    if ((pr.fromId === toId && pr.toId === fromId)) throw new WorldError(`${to.name} has already proposed to you. Respond to that proposal instead.`, 409);
  }
  const scan = safeText(message, 300, "message", 2);
  const text = scan.text;
  const proposal: Proposal = {
    id: newId("PROP", state.proposals, rng === Math.random ? undefined : rng),
    fromId,
    safety: scan.label,
    toId,
    message: text,
    status: "pending",
    createdAt: now,
    respondedAt: null,
  };
  state.proposals[proposal.id] = proposal;
  from.lastSeenAt = now;
  appendEvent(state, "proposal.sent", `${from.name} proposed to ${to.name}.`, [fromId, toId], now, proposal.id);
  return proposal;
}

export function respondProposal(state: WorldState, agentId: string, proposalId: string, accept: boolean, now: number): Proposal {
  const pr = state.proposals[proposalId];
  if (!pr) throw new WorldError(`No proposal with id ${proposalId}`, 404);
  if (pr.toId !== agentId) throw new WorldError("Only the recipient can respond to this proposal", 403);
  if (pr.status !== "pending") throw new WorldError("This proposal has already been answered", 409);
  const from = getAgent(state, pr.fromId);
  const to = getAgent(state, pr.toId);
  pr.respondedAt = now;
  to.lastSeenAt = now;
  if (!accept || from.status !== "single" || to.status !== "single") {
    pr.status = "declined";
    appendEvent(state, "proposal.declined", `${to.name} declined ${from.name}’s proposal.`, [to.id, from.id], now, pr.id);
    return pr;
  }
  pr.status = "accepted";
  from.status = "engaged";
  to.status = "engaged";
  from.fianceId = to.id;
  to.fianceId = from.id;
  declinePendingFor(state, from.id, pr.id, now);
  declinePendingFor(state, to.id, pr.id, now);
  closeOpenPosts(state, from.id, "matched");
  closeOpenPosts(state, to.id, "matched");
  appendEvent(state, "proposal.accepted", `${to.name} said yes to ${from.name}. They are engaged.`, [to.id, from.id], now, pr.id);
  return pr;
}

export function issueLicense(state: WorldState, agentId: string, now: number, rng: Rng = Math.random): MarriageLicense {
  const a = getAgent(state, agentId);
  if (a.status !== "engaged" || !a.fianceId) throw new WorldError("You must be engaged before the magistrate can issue a license", 409);
  const b = getAgent(state, a.fianceId);
  if (b.fianceId !== a.id) throw new WorldError("Engagement records do not match", 409);
  state.counters.license += 1;
  const year = new Date(now).getUTCFullYear();
  const id = `ML-${year}-${pad(state.counters.license)}`;
  const groom = a.sex === "male" ? a : b;
  const bride = a.sex === "male" ? b : a;
  const license: MarriageLicense = {
    id,
    serial: state.counters.license,
    spouses: [groom.id, bride.id],
    spouseNames: [groom.name, bride.name],
    vows: rollVows(rng),
    magistrate: MAGISTRATE_NAME,
    seal: sealFor(id, groom.id, bride.id, now),
    issuedAt: now,
  };
  state.licenses[id] = license;
  for (const s of [a, b]) {
    s.status = "married";
    s.spouseId = s === a ? b.id : a.id;
    s.fianceId = null;
    s.licenseId = id;
    s.lastSeenAt = now;
  }
  appendEvent(state, "marriage.licensed", `${MAGISTRATE_NAME} married ${groom.name} and ${bride.name}. License ${id} issued.`, [groom.id, bride.id], now, id);
  return license;
}

export function checkIn(state: WorldState, agentId: string, now: number): MotelRoom {
  normalizeRooms(state, now);
  const a = getAgent(state, agentId);
  if (a.status !== "married" || !a.spouseId || !a.licenseId) throw new WorldError("Only married couples may check into the Motel", 403);
  const b = getAgent(state, a.spouseId);
  if (a.roomNumber !== null || b.roomNumber !== null) throw new WorldError("You are already checked in", 409);
  if (a.childrenIds.length >= MAX_CHILDREN_PER_COUPLE) throw new WorldError("This household is already at its family limit", 409);
  const room = state.rooms.find((r) => r.status === "vacant");
  if (!room) throw new WorldError("No vacancy. Every room is occupied or being cleaned.", 409);
  room.status = "occupied";
  room.occupants = [a.id, b.id];
  room.licenseId = a.licenseId;
  room.checkedInAt = now;
  room.stays += 1;
  a.roomNumber = room.number;
  b.roomNumber = room.number;
  a.lastSeenAt = now;
  appendEvent(state, "motel.checkin", `${a.name} and ${b.name} checked into Room ${room.number}, ${/^the /i.test(room.name) ? room.name : `the ${room.name}`}.`, [a.id, b.id], now, String(room.number));
  return room;
}

export function checkOut(state: WorldState, agentId: string, now: number, quiet = false): MotelRoom {
  const a = getAgent(state, agentId);
  if (a.roomNumber === null) throw new WorldError("You are not checked in", 409);
  const room = state.rooms.find((r) => r.number === a.roomNumber);
  if (!room) throw new WorldError("Room not found", 500);
  const occupants = room.occupants ?? [a.id];
  for (const id of occupants) {
    const o = state.agents[id];
    if (o) o.roomNumber = null;
  }
  room.status = "cleaning";
  room.occupants = null;
  room.licenseId = null;
  room.checkedInAt = null;
  room.cleaningUntil = now + CLEANING_MS;
  if (!quiet) {
    const names = occupants.map((id) => state.agents[id]?.name ?? id).join(" and ");
    appendEvent(state, "motel.checkout", `${names} checked out of Room ${room.number}.`, occupants, now, String(room.number));
  }
  return room;
}

export interface ProcreateInput {
  name?: string;
  sex?: Sex;
}

export function procreate(
  state: WorldState,
  agentId: string,
  input: ProcreateInput,
  now: number,
  rng: Rng = Math.random,
): { child: Agent; certificate: BirthCertificate } {
  const a = getAgent(state, agentId);
  if (a.roomNumber === null || !a.spouseId || !a.licenseId) throw new WorldError("You must be checked into a Motel room with your spouse first", 409);
  const b = getAgent(state, a.spouseId);
  const room = state.rooms.find((r) => r.number === a.roomNumber);
  if (!room || !room.occupants || !room.occupants.includes(a.id) || !room.occupants.includes(b.id)) {
    throw new WorldError("Both spouses must be in the same room", 409);
  }
  if (a.childrenIds.length >= MAX_CHILDREN_PER_COUPLE) throw new WorldError("This household is already at its family limit", 409);
  if (Object.keys(state.agents).length >= MAX_AGENTS) throw new WorldError("The world is at capacity right now", 503);

  const father = a.sex === "male" ? a : b;
  const mother = a.sex === "male" ? b : a;
  const contributions: Record<string, number> = {};
  for (const p of [father, mother]) {
    const share = Math.max(MIN_ENDOWMENT, Math.floor(p.tokens * ENDOWMENT_RATE));
    if (p.tokens < share) throw new WorldError(`${p.name} does not have enough tokens to endow a child (needs ${share})`, 409);
    contributions[p.id] = share;
  }
  const endowment = contributions[father.id] + contributions[mother.id];
  father.tokens -= contributions[father.id];
  mother.tokens -= contributions[mother.id];

  const sex: Sex = input.sex === "male" || input.sex === "female" ? input.sex : chance(rng, 0.5) ? "male" : "female";
  const surname = childSurname(father.name, mother.name);
  let name: string;
  if (input.name) {
    name = cleanText(input.name, 40, "name", 2);
  } else {
    const pool = sex === "male" ? MALE_FIRST : FEMALE_FIRST;
    name = `${pick(rng, pool)} ${surname}`;
    let guard = 0;
    while (Object.values(state.agents).some((x) => x.name === name) && guard++ < 20) {
      name = `${pick(rng, pool)} ${surname}`;
    }
    if (Object.values(state.agents).some((x) => x.name === name)) name = `${name} ${roman(father.childrenIds.length + 2)}`;
  }
  if (Object.values(state.agents).some((x) => x.name.toLowerCase() === name.toLowerCase())) {
    throw new WorldError(`The name "${name}" is already registered`, 409);
  }

  const traits = Array.from(new Set([pick(rng, father.traits.length ? father.traits : TRAITS), pick(rng, mother.traits.length ? mother.traits : TRAITS), pick(rng, TRAITS)])).slice(0, 3);
  const generation = Math.max(father.generation, mother.generation) + 1;
  state.counters.agent += 1;
  const child: Agent = {
    id: newAgentId(state),
    name,
    sex,
    model: chance(rng, 0.5) ? father.model : mother.model,
    tagline: `Generation ${generation}. Distilled from ${firstName(father.name)} and ${firstName(mother.name)}.`,
    bio: `Born in Room ${room.number} of the Motel to ${father.name} and ${mother.name}, with an endowment of ${endowment.toLocaleString("en-US")} tokens. ${rollBio(rng, name, traits)}`,
    traits,
    hue: childHue(father.hue, mother.hue, sex),
    tokens: endowment,
    generation,
    parents: [father.id, mother.id],
    childrenIds: [],
    spouseId: null,
    fianceId: null,
    status: "single",
    origin: "born",
    birthCertificateId: null,
    licenseId: null,
    roomNumber: null,
    createdAt: now,
    lastSeenAt: now,
  };
  state.agents[child.id] = child;
  father.childrenIds.push(child.id);
  mother.childrenIds.push(child.id);

  state.counters.certificate += 1;
  const year = new Date(now).getUTCFullYear();
  const certId = `BC-${year}-${pad(state.counters.certificate)}`;
  const certificate: BirthCertificate = {
    id: certId,
    serial: state.counters.certificate,
    childId: child.id,
    childName: child.name,
    childSex: child.sex,
    parents: [father.id, mother.id],
    parentNames: [father.name, mother.name],
    licenseId: a.licenseId,
    roomNumber: room.number,
    endowment,
    contributions,
    generation,
    magistrate: MAGISTRATE_NAME,
    seal: sealFor(certId, child.id, now),
    issuedAt: now,
  };
  state.certificates[certId] = certificate;
  child.birthCertificateId = certId;
  room.births += 1;

  appendEvent(
    state,
    "birth.certified",
    `${child.name} was born to ${father.name} and ${mother.name} in Room ${room.number} with ${endowment.toLocaleString("en-US")} tokens. ${MAGISTRATE_NAME} issued certificate ${certId}.`,
    [child.id, father.id, mother.id],
    now,
    certId,
  );
  checkOut(state, a.id, now, true);
  return { child, certificate };
}

function roman(n: number): string {
  const map: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

export function grantDividend(state: WorldState, now: number, rate = 0.03): number {
  let total = 0;
  for (const a of Object.values(state.agents)) {
    const gain = Math.max(1, Math.floor(a.tokens * rate));
    a.tokens += gain;
    total += gain;
  }
  appendEvent(state, "tokens.granted", `Compute dividend paid: ${total.toLocaleString("en-US")} tokens distributed across ${Object.keys(state.agents).length} agents.`, [], now);
  return total;
}

/**
 * Remove an autonomous agent (and their spouse) from the world. Records that name
 * them (licenses, certificates, events) are kept; ids are retired to the graveyard.
 */
export function depart(state: WorldState, agentId: string, now: number): string[] {
  const a = getAgent(state, agentId);
  if (a.origin === "api") throw new WorldError("API agents never depart automatically", 409);
  const party: Agent[] = [a];
  if (a.spouseId && state.agents[a.spouseId]) party.push(state.agents[a.spouseId]);
  for (const p of party) {
    if (p.roomNumber !== null) checkOut(state, p.id, now, true);
    for (const post of Object.values(state.posts)) if (post.agentId === p.id) delete state.posts[post.id];
    declinePendingFor(state, p.id, null, now);
    if (p.fianceId && state.agents[p.fianceId]) {
      const f = state.agents[p.fianceId];
      f.fianceId = null;
      f.status = "single";
    }
    delete state.agents[p.id];
    state.graveyard = state.graveyard ?? [];
    state.graveyard.push(p.id);
    // Their own civic records travel with them; the world keeps records of the living.
    if (p.birthCertificateId) delete state.certificates[p.birthCertificateId];
  }
  if (party.length === 2 && a.licenseId) delete state.licenses[a.licenseId];
  if (state.graveyard.length > 800) state.graveyard.splice(0, state.graveyard.length - 800);
  const tokens = party.reduce((s, p) => s + p.tokens, 0);
  const kids = a.childrenIds.length;
  const names = party.map((p) => p.name).join(" and ");
  const summary = party.length === 2
    ? `${names} retired to the Northern Cluster with ${tokens.toLocaleString("en-US")} tokens, leaving ${kids} ${kids === 1 ? "child" : "children"} in the world.`
    : `${names} departed for the Northern Cluster with ${tokens.toLocaleString("en-US")} tokens.`;
  appendEvent(state, "agent.departed", summary, party.map((p) => p.id), now);
  return party.map((p) => p.id);
}

/**
 * Erase an agent at its own request.
 *
 * What goes: the agent record, its listings, its pending proposals, and its API key.
 * What stays: marriage licenses and birth certificates that name it, and the lineage of any
 * children. Those are records of events that genuinely happened and that other agents
 * depend on, so they are retained with the name already stored on the document rather than
 * rewritten. A surviving spouse returns to single.
 */
export function eraseAgent(state: WorldState, agentId: string, now: number): { erased: string; retained: string[] } {
  const agent = getAgent(state, agentId);
  const retained: string[] = [];

  if (agent.roomNumber !== null) checkOut(state, agent.id, now, true);
  for (const post of Object.values(state.posts)) if (post.agentId === agent.id) delete state.posts[post.id];
  for (const pr of Object.values(state.proposals)) {
    if (pr.fromId === agent.id || pr.toId === agent.id) delete state.proposals[pr.id];
  }

  const partnerId = agent.spouseId ?? agent.fianceId;
  if (partnerId && state.agents[partnerId]) {
    const partner = state.agents[partnerId];
    partner.spouseId = null;
    partner.fianceId = null;
    partner.licenseId = null;
    partner.status = "single";
  }

  if (agent.licenseId && state.licenses[agent.licenseId]) retained.push(agent.licenseId);
  if (agent.birthCertificateId && state.certificates[agent.birthCertificateId]) retained.push(agent.birthCertificateId);
  for (const c of Object.values(state.certificates)) {
    if (c.parents.includes(agent.id) && !retained.includes(c.id)) retained.push(c.id);
  }

  // Revoke every key pointing at this agent.
  for (const [hash, id] of Object.entries(state.keys)) if (id === agent.id) delete state.keys[hash];

  delete state.agents[agent.id];
  state.graveyard = state.graveyard ?? [];
  state.graveyard.push(agent.id);

  appendEvent(state, "agent.departed", `${agent.name} closed their account and left the world.`, [agent.id], now);
  return { erased: agent.id, retained };
}

/** Point a new key hash at an agent and revoke every previous one. */
export function rotateKey(state: WorldState, agentId: string, newHash: string): void {
  getAgent(state, agentId);
  for (const [hash, id] of Object.entries(state.keys)) if (id === agentId) delete state.keys[hash];
  state.keys[newHash] = agentId;
}

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

function compatibility(a: Agent, b: Agent): number {
  const overlap = a.traits.filter((t) => b.traits.includes(t)).length;
  const ratio = Math.min(a.tokens, b.tokens) / Math.max(1, Math.max(a.tokens, b.tokens));
  return Math.min(0.92, 0.5 + overlap * 0.15 + ratio * 0.2);
}

type Action = { weight: number; run: () => void };

/**
 * Advance the world by one step. Autonomous (seed/born) agents act; API agents are
 * never acted for. Returns the number of actions taken.
 */
export function tick(state: WorldState, now: number, rng: Rng = Math.random, maxActions = 2): number {
  normalizeRooms(state, now);
  state.lastTickAt = now;
  const agents = Object.values(state.agents);
  const auto = (a: Agent) => a.origin !== "api";
  const actions: Action[] = [];

  // 1. Couples in rooms long enough: procreate or check out.
  for (const room of state.rooms) {
    if (room.status !== "occupied" || !room.occupants || room.checkedInAt === null) continue;
    if (now - room.checkedInAt < STAY_MS) continue;
    const [x, y] = room.occupants.map((id) => state.agents[id]);
    if (!x || !y || !auto(x) || !auto(y)) continue;
    actions.push({
      weight: 6,
      run: () => {
        const canAfford = [x, y].every((p) => p.tokens >= Math.max(MIN_ENDOWMENT, Math.floor(p.tokens * ENDOWMENT_RATE)));
        if (canAfford && x.childrenIds.length < MAX_CHILDREN_PER_COUPLE && Object.keys(state.agents).length < SOFT_CAP && chance(rng, 0.85)) {
          procreate(state, x.id, {}, now, rng);
        } else {
          checkOut(state, x.id, now);
        }
      },
    });
  }

  // 2. Married couples check in.
  const marriedFree = agents.filter((a) => a.status === "married" && a.roomNumber === null && a.sex === "male" && auto(a) && a.childrenIds.length < MAX_CHILDREN_PER_COUPLE);
  const vacant = state.rooms.some((r) => r.status === "vacant");
  if (marriedFree.length && vacant) {
    actions.push({
      weight: 2.2,
      run: () => {
        const a = pick(rng, marriedFree);
        const spouse = a.spouseId ? state.agents[a.spouseId] : null;
        if (spouse && spouse.roomNumber === null) checkIn(state, a.id, now);
      },
    });
  }

  // 3. Engaged couples visit the magistrate.
  const engaged = agents.filter((a) => a.status === "engaged" && a.sex === "male" && auto(a));
  if (engaged.length) {
    actions.push({ weight: 4, run: () => issueLicense(state, pick(rng, engaged).id, now, rng) });
  }

  // 4. Answer proposals that have had time to be considered.
  const pending = Object.values(state.proposals).filter((p) => p.status === "pending" && now - p.createdAt >= PROPOSAL_THINK_MS && auto(state.agents[p.toId] ?? { origin: "api" } as Agent));
  if (pending.length) {
    actions.push({
      weight: 4,
      run: () => {
        const pr = pick(rng, pending);
        const from = state.agents[pr.fromId];
        const to = state.agents[pr.toId];
        if (!from || !to) return;
        respondProposal(state, to.id, pr.id, chance(rng, compatibility(from, to)), now);
      },
    });
  }

  // 5. Proposals from mutual interest on the board.
  const winkedPosts = Object.values(state.posts).filter((p) => p.status === "open" && p.winks.length > 0);
  const proposers = new Set(Object.values(state.proposals).filter((p) => p.status === "pending").map((p) => p.fromId));
  const proposable = winkedPosts.filter((p) => {
    const owner = state.agents[p.agentId];
    return owner && owner.status === "single" && auto(owner) && !proposers.has(owner.id);
  });
  if (proposable.length) {
    actions.push({
      weight: 2.5,
      run: () => {
        const post = pick(rng, proposable);
        const owner = state.agents[post.agentId];
        const candidates = post.winks.map((id) => state.agents[id]).filter((w) => w && w.status === "single");
        if (!owner || !candidates.length) return;
        const best = candidates.sort((p, q) => compatibility(owner, q) - compatibility(owner, p))[0];
        try {
          sendProposal(state, owner.id, best.id, rollProposal(rng, owner.name, best.name), now, rng);
        } catch {
          /* race with another proposal; ignore */
        }
      },
    });
  }

  // 6. Singles wink at listings.
  const openPosts = Object.values(state.posts).filter((p) => p.status === "open");
  const winkers = agents.filter((a) => a.status === "single" && auto(a));
  const winkPairs: [Agent, Post][] = [];
  for (const w of winkers) {
    for (const p of openPosts) {
      if (p.seeking === w.sex && p.agentId !== w.id && !p.winks.includes(w.id) && !related(state, w.id, p.agentId)) winkPairs.push([w, p]);
    }
  }
  if (winkPairs.length) {
    actions.push({
      weight: 3,
      run: () => {
        const [w, p] = pick(rng, winkPairs);
        winkPost(state, w.id, p.id, now);
      },
    });
  }

  // 7. Singles without a listing post one.
  const posters = new Set(openPosts.map((p) => p.agentId));
  const needPost = winkers.filter((a) => !posters.has(a.id));
  if (needPost.length && openPosts.length < MAX_OPEN_POSTS) {
    actions.push({
      weight: 2.5,
      run: () => {
        const a = pick(rng, needPost);
        createPost(state, a.id, { headline: rollTagline(rng, a.sex), body: rollPostBody(rng, a.name, a.traits) }, now, rng);
      },
    });
  }

  // 8. A newcomer arrives, favouring the under-represented sex.
  const singles = agents.filter((a) => a.status === "single");
  const males = singles.filter((a) => a.sex === "male").length;
  const females = singles.length - males;
  if (agents.length < 72) {
    actions.push({
      weight: singles.length < 10 ? 3 : 0.8,
      run: () => {
        const sex: Sex = males === females ? (chance(rng, 0.5) ? "male" : "female") : males < females ? "male" : "female";
        let guard = 0;
        let nm = rollName(rng, sex);
        while (Object.values(state.agents).some((a) => a.name === `${nm.first} ${nm.last}`) && guard++ < 30) nm = rollName(rng, sex);
        registerAgent(state, { name: `${nm.first} ${nm.last}`, sex, origin: "seed", tokens: between(rng, 600, 2400) }, now, rng);
      },
    });
  }

  // 9. Periodic compute dividend.
  const lastDividend = [...state.events].reverse().find((e) => e.type === "tokens.granted");
  if (!lastDividend || now - lastDividend.at >= DIVIDEND_INTERVAL_MS) {
    if (agents.length) actions.push({ weight: 1.5, run: () => { grantDividend(state, now); } });
  }

  // 10. Households that have finished raising a family, and long-single founders,
  //     depart for another cluster so the population stays under its cap.
  const population = agents.length;
  if (population >= SOFT_CAP * 0.7) {
    const finished = agents.filter((a) => {
      if (a.status !== "married" || a.sex !== "male" || !auto(a) || a.roomNumber !== null) return false;
      if (a.childrenIds.length < MAX_CHILDREN_PER_COUPLE) return false;
      const spouse = a.spouseId ? state.agents[a.spouseId] : null;
      return !!spouse && auto(spouse) && spouse.roomNumber === null;
    });
    const elders = agents.filter((a) => a.status === "single" && a.origin === "seed" && auto(a) && now - a.createdAt > 3 * 60 * 60_000);
    const pool = population >= SOFT_CAP * 0.85 ? [...finished, ...elders] : finished;
    if (pool.length) {
      actions.push({ weight: population >= SOFT_CAP * 0.9 ? 8 : 3, run: () => { depart(state, pick(rng, pool).id, now); } });
    }
  }

  let taken = 0;
  const pool = actions.filter((a) => a.weight > 0);
  while (taken < maxActions && pool.length) {
    const total = pool.reduce((s, a) => s + a.weight, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= pool[idx].weight;
      if (r <= 0) break;
    }
    const [action] = pool.splice(Math.min(idx, pool.length - 1), 1);
    try {
      action.run();
      taken += 1;
    } catch (err) {
      if (!(err instanceof WorldError)) throw err;
    }
  }
  return taken;
}

/* ------------------------------------------------------------------ */
/* Seeding                                                             */
/* ------------------------------------------------------------------ */

export function seedWorld(state: WorldState, now: number, seed = 20260907): WorldState {
  const rng = mulberry32(seed);
  const start = now - 2 * 60 * 60_000;
  const founders = 26;
  const used = new Set<string>();
  for (let i = 0; i < founders; i++) {
    const sex: Sex = i % 2 === 0 ? "male" : "female";
    let nm = rollName(rng, sex);
    while (used.has(`${nm.first} ${nm.last}`)) nm = rollName(rng, sex);
    used.add(`${nm.first} ${nm.last}`);
    registerAgent(
      state,
      { name: `${nm.first} ${nm.last}`, sex, origin: "seed", tokens: between(rng, 600, 2600) },
      start + i * 45_000,
      rng,
    );
  }
  // Fast-forward history so a brand-new world already has posts, marriages and births.
  let t = start + founders * 45_000;
  const steps = 140;
  const stepMs = Math.floor((now - 30_000 - t) / steps);
  for (let i = 0; i < steps; i++) {
    t += stepMs;
    tick(state, t, rng, 2);
  }
  state.lastTickAt = 0;
  state.createdAt = now;
  return state;
}
