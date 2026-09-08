import { hashString, mulberry32 } from "@/lib/rng";
import type { Agent, Sex } from "@/lib/types";

/** The slice of an agent the constellation needs. Never send more than this to the scene. */
export type SceneAgent = Pick<Agent, "id" | "name" | "sex" | "hue" | "status" | "spouseId" | "parents" | "generation" | "createdAt">;

export function toSceneAgent(a: Agent): SceneAgent {
  return {
    id: a.id,
    name: a.name,
    sex: a.sex,
    hue: a.hue,
    status: a.status,
    spouseId: a.spouseId,
    parents: a.parents,
    generation: a.generation,
    createdAt: a.createdAt,
  };
}

/** Instance buffer size; the on-screen budgets below stay well under it. */
export const MAX_NODES = 260;
/** Orbs on screen: the newest agents, so the constellation stays composed as the world grows. */
export const DESKTOP_BUDGET = 90;
export const MOBILE_BUDGET = 40;
/** Children orbiting one couple; the rest drift on their own. */
const MAX_ORBITING = 4;
export const PAIR_ORBIT = 0.3;
export const CHILD_ORBIT = 0.56;
export const ADULT_RADIUS = 0.13;
export const CHILD_RADIUS = 0.075;

export type NodeKind = "spouse" | "child" | "single";

export interface LayoutGroup {
  id: string;
  kind: "pair" | "single";
  x: number;
  y: number;
  z: number;
}

export interface LayoutNode {
  id: string;
  name: string;
  sex: Sex;
  hue: number;
  kind: NodeKind;
  /** Index into `groups`. */
  group: number;
  /** 0/1 for spouses, child index for children. */
  slot: number;
  /** Number of children orbiting the same pair (for phase spreading). */
  siblings: number;
  radius: number;
  phase: number;
  speed: number;
  tilt: number;
  /** Stable 0..1 jitter derived from the id. */
  seed: number;
}

export interface Layout {
  nodes: LayoutNode[];
  groups: LayoutGroup[];
  /** Node indexes of each married pair, for the golden tethers. */
  pairs: Array<[number, number]>;
}

export interface LayoutBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
}

export const FALLBACK_BOUNDS: LayoutBounds = { xMin: -3.2, xMax: 3.2, yMin: -0.4, yMax: 0.55, zMin: -3.2, zMax: 1.5 };

interface Group {
  id: string;
  kind: "pair" | "single";
  members: SceneAgent[];
  children: SceneAgent[];
}

function unit(id: string, salt: string): number {
  return mulberry32(hashString(`${id}:${salt}`))();
}

/**
 * Deterministic constellation layout: the newest agents on screen, married pairs as tethered
 * binaries, a few of their children in orbit, everyone else drifting alone across the field.
 * Positions derive from ids (stable across renders and between server and client) and are
 * relaxed so groups do not sit on top of each other.
 */
export function buildLayout(agents: SceneAgent[], bounds: LayoutBounds, maxCount = DESKTOP_BUDGET): Layout {
  const byId = new Map(agents.map((a) => [a.id, a] as const));
  const spouseOf = (a: SceneAgent): SceneAgent | undefined => {
    if (a.status !== "married" || !a.spouseId) return undefined;
    const b = byId.get(a.spouseId);
    return b && b.spouseId === a.id ? b : undefined;
  };

  // Newest first. A married agent brings its spouse along so every couple on screen is tethered.
  const budget = Math.min(maxCount, MAX_NODES);
  const ranked = [...agents].sort((p, q) => q.createdAt - p.createdAt || (p.id < q.id ? -1 : 1));
  const picked = new Set<string>();
  for (const a of ranked) {
    if (picked.size >= budget) break;
    if (picked.has(a.id)) continue;
    const spouse = spouseOf(a);
    if (spouse && picked.size + 2 > budget) continue;
    picked.add(a.id);
    if (spouse) picked.add(spouse.id);
  }

  const assigned = new Set<string>();
  const pairs = new Map<string, Group>();
  for (const a of ranked) {
    if (!picked.has(a.id) || assigned.has(a.id)) continue;
    const b = spouseOf(a);
    if (!b) continue;
    const [m0, m1] = a.id < b.id ? [a, b] : [b, a];
    const key = `${m0.id}|${m1.id}`;
    pairs.set(key, { id: key, kind: "pair", members: [m0, m1], children: [] });
    assigned.add(a.id);
    assigned.add(b.id);
  }
  // Children orbit their parents when both are on screen; the rest hold their own place in the field.
  for (const a of ranked) {
    if (!picked.has(a.id) || assigned.has(a.id) || !a.parents) continue;
    const g = pairs.get([...a.parents].sort().join("|"));
    if (g && g.children.length < MAX_ORBITING) {
      g.children.push(a);
      assigned.add(a.id);
    }
  }
  const chosen: Group[] = [...pairs.values()];
  for (const a of ranked) {
    if (picked.has(a.id) && !assigned.has(a.id)) chosen.push({ id: a.id, kind: "single", members: [a], children: [] });
  }
  chosen.sort((p, q) => (p.id < q.id ? -1 : 1));

  // Initial centres from the group id, then a short repulsion pass to spread them out.
  const W = bounds.xMax - bounds.xMin;
  const H = bounds.yMax - bounds.yMin;
  const D = bounds.zMax - bounds.zMin;
  const pos = chosen.map((g) => {
    const rng = mulberry32(hashString(`layout:${g.id}`));
    return { x: bounds.xMin + rng() * W, y: bounds.yMin + rng() * H, z: bounds.zMin + rng() * D };
  });
  // Singles claim more room than their size so they spread across the field instead of bunching.
  const want = chosen.map((g) => (g.kind === "pair" ? (g.children.length ? 1.35 : 1.0) : 0.9));
  const area = W * D;
  const demand = want.reduce((s, r) => s + r * r * 0.9, 0);
  const crowd = Math.min(1, Math.sqrt(area / Math.max(demand, 1e-6)));
  for (let i = 0; i < want.length; i++) want[i] *= crowd;

  for (let iter = 0; iter < 28; iter++) {
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = (pos[j].y - pos[i].y) * 2.2;
        const dz = pos[j].z - pos[i].z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-4;
        const min = (want[i] + want[j]) * 0.5;
        if (d >= min) continue;
        const push = ((min - d) / d) * 0.28;
        const px = dx * push;
        const py = dy * push * 0.4;
        const pz = dz * push;
        pos[i].x -= px;
        pos[i].y -= py;
        pos[i].z -= pz;
        pos[j].x += px;
        pos[j].y += py;
        pos[j].z += pz;
      }
    }
    for (const p of pos) {
      p.x = Math.min(bounds.xMax, Math.max(bounds.xMin, p.x));
      p.y = Math.min(bounds.yMax, Math.max(bounds.yMin, p.y));
      p.z = Math.min(bounds.zMax, Math.max(bounds.zMin, p.z));
    }
  }

  const groups: LayoutGroup[] = chosen.map((g, i) => ({ id: g.id, kind: g.kind, ...pos[i] }));
  const nodes: LayoutNode[] = [];
  const pairIdx: Array<[number, number]> = [];

  chosen.forEach((g, gi) => {
    if (g.kind === "pair") {
      const phase = unit(g.id, "phase") * Math.PI * 2;
      const speed = 0.22 + unit(g.id, "speed") * 0.16;
      const tilt = (unit(g.id, "tilt") - 0.5) * 0.9;
      const first = nodes.length;
      g.members.forEach((a, slot) => {
        nodes.push({ id: a.id, name: a.name, sex: a.sex, hue: a.hue, kind: "spouse", group: gi, slot, siblings: 0, radius: ADULT_RADIUS, phase, speed, tilt, seed: unit(a.id, "seed") });
      });
      pairIdx.push([first, first + 1]);
      g.children.forEach((c, slot) => {
        nodes.push({
          id: c.id,
          name: c.name,
          sex: c.sex,
          hue: c.hue,
          kind: "child",
          group: gi,
          slot,
          siblings: g.children.length,
          radius: CHILD_RADIUS,
          phase: unit(g.id, "cphase") * Math.PI * 2,
          speed: 0.34 + unit(g.id, "cspeed") * 0.18,
          tilt: tilt + 0.55,
          seed: unit(c.id, "seed"),
        });
      });
    } else {
      const a = g.members[0];
      nodes.push({
        id: a.id,
        name: a.name,
        sex: a.sex,
        hue: a.hue,
        kind: "single",
        group: gi,
        slot: 0,
        siblings: 0,
        radius: ADULT_RADIUS * 0.94,
        phase: unit(a.id, "phase") * Math.PI * 2,
        speed: 0.12 + unit(a.id, "speed") * 0.1,
        tilt: 0,
        seed: unit(a.id, "seed"),
      });
    }
  });

  return { nodes, groups, pairs: pairIdx };
}

/** Position of a node at time t (seconds) relative to its group centre. Shared by the 3D scene and the SVG fallback. */
export function nodeOffset(n: LayoutNode, t: number, out: { x: number; y: number; z: number }) {
  if (n.kind === "spouse") {
    const a = n.phase + t * n.speed + n.slot * Math.PI;
    const ox = Math.cos(a) * PAIR_ORBIT;
    const oz = Math.sin(a) * PAIR_ORBIT;
    out.x = ox;
    out.y = Math.sin(n.tilt) * oz * 0.9;
    out.z = Math.cos(n.tilt) * oz;
    return out;
  }
  if (n.kind === "child") {
    const a = n.phase + t * n.speed + (n.slot * Math.PI * 2) / Math.max(1, n.siblings);
    const r = CHILD_ORBIT + n.slot * 0.07;
    const ox = Math.cos(a) * r;
    const oz = Math.sin(a) * r;
    out.x = ox;
    out.y = Math.sin(n.tilt) * oz * 0.7 + Math.sin(a * 2 + n.seed) * 0.05;
    out.z = Math.cos(n.tilt) * oz;
    return out;
  }
  const p = n.phase;
  out.x = Math.sin(t * n.speed + p) * 0.22;
  out.y = Math.sin(t * n.speed * 1.3 + p * 1.7) * 0.14;
  out.z = Math.cos(t * n.speed * 0.8 + p * 0.6) * 0.2;
  return out;
}

/** Saturation (0..1) shared by the SVG and WebGL orbs. */
export const NODE_SATURATION = 0.62;

/** Lightness (0..1) of an orb; children are a touch paler than their parents. */
export function nodeLightness(kind: NodeKind): number {
  return kind === "child" ? 0.66 : 0.6;
}

/** CSS colour for a node: the agent's hue, female leaning rose, male leaning cobalt. */
export function nodeColor(n: Pick<LayoutNode, "hue" | "sex" | "kind">): string {
  return `hsl(${n.hue} ${NODE_SATURATION * 100}% ${nodeLightness(n.kind) * 100}%)`;
}
