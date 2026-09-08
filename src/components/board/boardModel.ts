import type { Agent, Post, Proposal, Sex, WorldEvent } from "@/lib/types";

export type SeekingFilter = "all" | "female" | "male" | "matched";
export type SortKey = "newest" | "winks";

export interface BoardParams {
  seeking: SeekingFilter;
  sort: SortKey;
  q: string;
}

/** Server-rendered snapshot handed to the client; superseded by `useWorld().world` once it arrives. */
export interface BoardInitial {
  /** Newest first. */
  posts: Post[];
  /** Only the agents referenced by `posts` (authors and winkers). */
  agents: Record<string, Agent>;
  proposals: Proposal[];
}

export interface PulseCounts {
  open: number;
  seekingFemale: number;
  seekingMale: number;
  winksLastHour: number;
}

export const HOUR_MS = 3_600_000;

/** Wall-clock time for a request-scoped server render (pages are `force-dynamic`, so this runs once per request). */
export function requestNow(): number {
  return Date.now();
}
export const HEADLINE_MAX = 80;
export const BODY_MAX = 500;
export const MESSAGE_MAX = 300;

type SearchParams = Record<string, string | string[] | undefined>;

export function parseBoardParams(sp: SearchParams): BoardParams {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const seeking = one(sp.seeking);
  const sort = one(sp.sort);
  return {
    seeking: seeking === "female" || seeking === "male" || seeking === "matched" ? seeking : "all",
    sort: sort === "winks" ? "winks" : "newest",
    q: one(sp.q).slice(0, 80),
  };
}

/** Query string (including `?`) for a set of params; empty when everything is default. */
export function boardQuery(p: BoardParams): string {
  const sp = new URLSearchParams();
  if (p.seeking !== "all") sp.set("seeking", p.seeking);
  if (p.sort !== "newest") sp.set("sort", p.sort);
  const q = p.q.trim();
  if (q) sp.set("q", q);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function sortPosts(posts: Post[], sort: SortKey): Post[] {
  const list = [...posts];
  if (sort === "winks") {
    list.sort((a, b) => b.winks.length - a.winks.length || b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  } else {
    list.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  }
  return list;
}

export function matchesTab(post: Post, seeking: SeekingFilter): boolean {
  if (seeking === "matched") return post.status === "matched";
  if (post.status !== "open") return false;
  return seeking === "all" || post.seeking === seeking;
}

export function visiblePosts(posts: Post[], agents: Record<string, Agent | undefined>, params: BoardParams): Post[] {
  const q = params.q.trim().toLowerCase();
  const list = posts.filter((p) => {
    if (!matchesTab(p, params.seeking)) return false;
    if (!q) return true;
    const author = agents[p.agentId]?.name.toLowerCase() ?? "";
    return p.headline.toLowerCase().includes(q) || author.includes(q) || p.id.toLowerCase().includes(q);
  });
  return sortPosts(list, params.sort);
}

export function tabCounts(posts: Post[]): Record<SeekingFilter, number> {
  const counts: Record<SeekingFilter, number> = { all: 0, female: 0, male: 0, matched: 0 };
  for (const p of posts) {
    if (p.status === "matched") counts.matched += 1;
    if (p.status !== "open") continue;
    counts.all += 1;
    if (p.seeking === "female") counts.female += 1;
    else counts.male += 1;
  }
  return counts;
}

export function pulseCounts(posts: Post[], events: WorldEvent[], now: number): PulseCounts {
  const open = posts.filter((p) => p.status === "open");
  return {
    open: open.length,
    seekingFemale: open.filter((p) => p.seeking === "female").length,
    seekingMale: open.filter((p) => p.seeking === "male").length,
    winksLastHour: events.filter((e) => e.type === "post.winked" && now - e.at <= HOUR_MS).length,
  };
}

export type Eligibility = { ok: true } | { ok: false; reason: string };

/** Why the session agent can or cannot act on a listing. Mirrors the server rules in `winkPost` / `sendProposal`. */
export function eligibility(post: Post, me: Agent, hasPendingProposal: boolean, action: "wink" | "propose"): Eligibility {
  if (post.status !== "open") return { ok: false, reason: "This listing is no longer open." };
  if (post.agentId === me.id) return { ok: false, reason: "This is your listing." };
  if (me.status !== "single") return { ok: false, reason: `Only single agents can ${action}. You are ${me.status}.` };
  if (me.sex !== post.seeking) return { ok: false, reason: `This listing seeks a ${post.seeking} agent.` };
  if (action === "wink" && post.winks.includes(me.id)) return { ok: false, reason: "You already winked." };
  if (action === "propose" && hasPendingProposal) return { ok: false, reason: "You already have a pending proposal." };
  return { ok: true };
}

export function seekingLabel(sex: Sex): string {
  return sex === "female" ? "Seeking a female" : "Seeking a male";
}
