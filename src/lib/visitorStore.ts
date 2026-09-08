import { postgresConfig } from "./store";
import type { VisitorClass, VisitorKind } from "./visitors";

/**
 * Arrival log.
 *
 * Kept deliberately separate from the world store: this is observability, not game state,
 * and it must never slow a request down or grow without bound. Writes happen after the
 * response is sent (see `proxy.ts`), the detail log is capped, and per-visitor totals are
 * permanent so history survives pruning.
 *
 * Privacy: the address is never stored. A visitor is identified by a salted hash of
 * address plus user agent, which is enough to follow one arrival's trail and nothing else.
 */

export interface VisitInput {
  visitor: string;
  ua: string;
  path: string;
  method: string;
  referer: string | null;
  country: string | null;
  at: number;
}

export interface TrailStep {
  at: number;
  method: string;
  path: string;
}

export interface VisitorSession {
  visitor: string;
  class: VisitorClass;
  name: string;
  operator: string | null;
  ua: string;
  country: string | null;
  firstSeen: number;
  lastSeen: number;
  hits: number;
  acted: boolean;
  trail: TrailStep[];
}

export interface NamedVisitor {
  class: VisitorClass;
  name: string;
  operator: string | null;
  hits: number;
  visitors: number;
  firstSeen: number;
  lastSeen: number;
}

export interface RecentVisit {
  at: number;
  class: VisitorClass;
  name: string;
  method: string;
  path: string;
  country: string | null;
  visitor: string;
}

export interface VisitorReport {
  enabled: boolean;
  backend: "postgres" | "memory";
  totals: { hits: number; visitors: number; byClass: Record<VisitorClass, { hits: number; visitors: number }> };
  named: NamedVisitor[];
  recent: RecentVisit[];
  sessions: VisitorSession[];
  /** Visitors that made a state-changing API call. */
  actors: VisitorSession[];
  since: number | null;
  serverTime: number;
}

const TRAIL_MAX = 30;
const DETAIL_MAX = 1500;
const RECENT_LIMIT = 60;
const SESSION_LIMIT = 40;

const EMPTY_BY_CLASS = (): Record<VisitorClass, { hits: number; visitors: number }> => ({
  "ai-crawler": { hits: 0, visitors: 0 },
  "ai-agent": { hits: 0, visitors: 0 },
  "search-crawler": { hits: 0, visitors: 0 },
  social: { hits: 0, visitors: 0 },
  browser: { hits: 0, visitors: 0 },
  unknown: { hits: 0, visitors: 0 },
});

/* ------------------------------------------------------------------ */
/* Memory backend (local development)                                  */
/* ------------------------------------------------------------------ */

interface MemoryVisitors {
  sessions: Map<string, VisitorSession>;
  detail: RecentVisit[];
  startedAt: number;
}

function mem(): MemoryVisitors {
  const g = globalThis as unknown as { __agolVisitors?: MemoryVisitors };
  if (!g.__agolVisitors) g.__agolVisitors = { sessions: new Map(), detail: [], startedAt: Date.now() };
  return g.__agolVisitors;
}

/* ------------------------------------------------------------------ */
/* Postgres backend                                                    */
/* ------------------------------------------------------------------ */

type SqlFn = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

let sqlPromise: Promise<SqlFn> | null = null;
let schemaPromise: Promise<void> | null = null;

function sqlClient(url: string): Promise<SqlFn> {
  if (!sqlPromise) {
    sqlPromise = import("@neondatabase/serverless").then(({ neon }) => neon(url) as unknown as SqlFn);
  }
  return sqlPromise;
}

async function ensureSchema(sql: SqlFn): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS agol_visitors (
        visitor TEXT PRIMARY KEY,
        class TEXT NOT NULL,
        name TEXT NOT NULL,
        operator TEXT,
        ua TEXT NOT NULL,
        country TEXT,
        first_seen BIGINT NOT NULL,
        last_seen BIGINT NOT NULL,
        hits BIGINT NOT NULL DEFAULT 1,
        acted BOOLEAN NOT NULL DEFAULT FALSE,
        trail JSONB NOT NULL DEFAULT '[]'::jsonb
      )`;
      await sql`CREATE TABLE IF NOT EXISTS agol_visit_log (
        id BIGSERIAL PRIMARY KEY,
        at BIGINT NOT NULL,
        visitor TEXT NOT NULL,
        class TEXT NOT NULL,
        name TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        country TEXT
      )`;
      await sql`CREATE INDEX IF NOT EXISTS agol_visit_log_at ON agol_visit_log (at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS agol_visitors_last ON agol_visitors (last_seen DESC)`;
    })().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

/** Record one arrival. Never throws: observability must not break the site. */
export async function recordVisit(input: VisitInput, kind: VisitorKind, acted: boolean): Promise<void> {
  const step: TrailStep = { at: input.at, method: input.method, path: input.path };
  const cfg = postgresConfig();

  if (!cfg) {
    const m = mem();
    const existing = m.sessions.get(input.visitor);
    if (existing) {
      existing.hits += 1;
      existing.lastSeen = input.at;
      existing.acted = existing.acted || acted;
      existing.trail = [...existing.trail, step].slice(-TRAIL_MAX);
      if (input.country) existing.country = input.country;
    } else {
      m.sessions.set(input.visitor, {
        visitor: input.visitor,
        class: kind.class,
        name: kind.name,
        operator: kind.operator ?? null,
        ua: input.ua,
        country: input.country,
        firstSeen: input.at,
        lastSeen: input.at,
        hits: 1,
        acted,
        trail: [step],
      });
    }
    m.detail.push({ at: input.at, class: kind.class, name: kind.name, method: input.method, path: input.path, country: input.country, visitor: input.visitor });
    if (m.detail.length > DETAIL_MAX) m.detail.splice(0, m.detail.length - DETAIL_MAX);
    return;
  }

  try {
    const sql = await sqlClient(cfg.url);
    await ensureSchema(sql);
    await sql`
      INSERT INTO agol_visitors (visitor, class, name, operator, ua, country, first_seen, last_seen, hits, acted, trail)
      VALUES (${input.visitor}, ${kind.class}, ${kind.name}, ${kind.operator ?? null}, ${input.ua.slice(0, 400)}, ${input.country},
              ${input.at}, ${input.at}, 1, ${acted}, ${JSON.stringify([step])}::jsonb)
      ON CONFLICT (visitor) DO UPDATE SET
        last_seen = ${input.at},
        hits = agol_visitors.hits + 1,
        acted = agol_visitors.acted OR ${acted},
        country = COALESCE(${input.country}, agol_visitors.country),
        trail = (
          SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
            SELECT t FROM jsonb_array_elements(agol_visitors.trail || ${JSON.stringify([step])}::jsonb) AS t
            OFFSET GREATEST(0, jsonb_array_length(agol_visitors.trail || ${JSON.stringify([step])}::jsonb) - ${TRAIL_MAX})
          ) sub
        )`;
    await sql`INSERT INTO agol_visit_log (at, visitor, class, name, method, path, country)
              VALUES (${input.at}, ${input.visitor}, ${kind.class}, ${kind.name}, ${input.method}, ${input.path.slice(0, 300)}, ${input.country})`;
    // Keep the detail log bounded; cheap because it only fires occasionally.
    if (Math.random() < 0.02) {
      await sql`DELETE FROM agol_visit_log WHERE id < (SELECT COALESCE(MAX(id), 0) - ${DETAIL_MAX} FROM agol_visit_log)`;
    }
  } catch (err) {
    console.error("visitor log write failed", err);
  }
}

/* ------------------------------------------------------------------ */
/* Read                                                                */
/* ------------------------------------------------------------------ */

export async function getVisitorReport(): Promise<VisitorReport> {
  const cfg = postgresConfig();
  const serverTime = Date.now();

  if (!cfg) {
    const m = mem();
    const sessions = [...m.sessions.values()].sort((a, b) => b.lastSeen - a.lastSeen);
    return buildReport(sessions, [...m.detail].reverse().slice(0, RECENT_LIMIT), "memory", sessions.length ? Math.min(...sessions.map((s) => s.firstSeen)) : null, serverTime);
  }

  try {
    const sql = await sqlClient(cfg.url);
    await ensureSchema(sql);
    const rows = await sql`SELECT visitor, class, name, operator, ua, country, first_seen, last_seen, hits, acted, trail
                           FROM agol_visitors ORDER BY last_seen DESC LIMIT 500`;
    const logRows = await sql`SELECT at, visitor, class, name, method, path, country
                              FROM agol_visit_log ORDER BY at DESC LIMIT ${RECENT_LIMIT}`;
    const sessions: VisitorSession[] = rows.map((r) => ({
      visitor: String(r.visitor),
      class: String(r.class) as VisitorClass,
      name: String(r.name),
      operator: r.operator ? String(r.operator) : null,
      ua: String(r.ua),
      country: r.country ? String(r.country) : null,
      firstSeen: Number(r.first_seen),
      lastSeen: Number(r.last_seen),
      hits: Number(r.hits),
      acted: Boolean(r.acted),
      trail: Array.isArray(r.trail) ? (r.trail as TrailStep[]) : [],
    }));
    const recent: RecentVisit[] = logRows.map((r) => ({
      at: Number(r.at),
      visitor: String(r.visitor),
      class: String(r.class) as VisitorClass,
      name: String(r.name),
      method: String(r.method),
      path: String(r.path),
      country: r.country ? String(r.country) : null,
    }));
    const since = sessions.length ? Math.min(...sessions.map((s) => s.firstSeen)) : null;
    return buildReport(sessions, recent, "postgres", since, serverTime);
  } catch (err) {
    console.error("visitor report failed", err);
    return {
      enabled: false,
      backend: "postgres",
      totals: { hits: 0, visitors: 0, byClass: EMPTY_BY_CLASS() },
      named: [],
      recent: [],
      sessions: [],
      actors: [],
      since: null,
      serverTime,
    };
  }
}

function buildReport(sessions: VisitorSession[], recent: RecentVisit[], backend: "postgres" | "memory", since: number | null, serverTime: number): VisitorReport {
  const byClass = EMPTY_BY_CLASS();
  const namedMap = new Map<string, NamedVisitor>();
  let hits = 0;

  for (const s of sessions) {
    hits += s.hits;
    const bucket = byClass[s.class] ?? byClass.unknown;
    bucket.hits += s.hits;
    bucket.visitors += 1;
    const key = `${s.class}|${s.name}`;
    const entry = namedMap.get(key);
    if (entry) {
      entry.hits += s.hits;
      entry.visitors += 1;
      entry.firstSeen = Math.min(entry.firstSeen, s.firstSeen);
      entry.lastSeen = Math.max(entry.lastSeen, s.lastSeen);
    } else {
      namedMap.set(key, {
        class: s.class,
        name: s.name,
        operator: s.operator,
        hits: s.hits,
        visitors: 1,
        firstSeen: s.firstSeen,
        lastSeen: s.lastSeen,
      });
    }
  }

  const named = [...namedMap.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  const nonBrowser = sessions.filter((s) => s.class !== "browser");
  const actors = sessions.filter((s) => s.acted).slice(0, SESSION_LIMIT);

  return {
    enabled: true,
    backend,
    totals: { hits, visitors: sessions.length, byClass },
    named,
    recent,
    // Show the interesting arrivals first: anything that is not a plain browser.
    sessions: [...nonBrowser, ...sessions.filter((s) => s.class === "browser")].slice(0, SESSION_LIMIT),
    actors,
    since,
    serverTime,
  };
}
