import { Redis } from "@upstash/redis";
import type { WorldState } from "./types";
import { emptyWorld, seedWorld } from "./world";

/**
 * World persistence.
 *
 * Two backends share one interface:
 *  - Redis (Upstash / Vercel KV): the whole world is one JSON document guarded by a
 *    version key. Writes are compare-and-set via a Lua script, so concurrent serverless
 *    invocations never clobber each other.
 *  - Memory: a process-wide singleton for local development and preview environments
 *    without a database. Mutations are serialised through a promise chain.
 */

export const NO_CHANGE: unique symbol = Symbol("no-change");
export type NoChange = typeof NO_CHANGE;
export type Mutation<T> = (state: WorldState, now: number) => T | NoChange;
export type MutationResult<T> = { result: T | NoChange; state: WorldState };

export type StoreKind = "redis" | "postgres" | "memory";

export interface Store {
  readonly kind: StoreKind;
  get(): Promise<WorldState>;
  version(): Promise<number>;
  mutate<T>(fn: Mutation<T>): Promise<MutationResult<T>>;
  /** Resolve once the version moves past `since`, or after `timeoutMs`. */
  waitForChange(since: number, timeoutMs: number): Promise<number>;
  /** Simple fixed-window counter used for rate limiting. Returns the count after increment. */
  hit(key: string, windowMs: number): Promise<number>;
  reset(): Promise<WorldState>;
}

const WORLD_KEY = "agol:world:v1";
const VERSION_KEY = "agol:version:v1";

function freshWorld(): WorldState {
  const now = Date.now();
  return seedWorld(emptyWorld(now), now);
}

/* ------------------------------------------------------------------ */
/* Memory backend                                                      */
/* ------------------------------------------------------------------ */

type Listener = (version: number) => void;

interface MemoryGlobal {
  state: WorldState | null;
  queue: Promise<unknown>;
  listeners: Set<Listener>;
  hits: Map<string, { count: number; resetAt: number }>;
}

function memoryGlobal(): MemoryGlobal {
  const g = globalThis as unknown as { __agolMemory?: MemoryGlobal };
  if (!g.__agolMemory) {
    g.__agolMemory = { state: null, queue: Promise.resolve(), listeners: new Set(), hits: new Map() };
  }
  return g.__agolMemory;
}

class MemoryStore implements Store {
  readonly kind = "memory" as const;

  private ensure(): WorldState {
    const g = memoryGlobal();
    if (!g.state) g.state = freshWorld();
    return g.state;
  }

  async get(): Promise<WorldState> {
    return this.ensure();
  }

  async version(): Promise<number> {
    return this.ensure().version;
  }

  mutate<T>(fn: Mutation<T>): Promise<MutationResult<T>> {
    const g = memoryGlobal();
    const run = async (): Promise<MutationResult<T>> => {
      const state = this.ensure();
      const draft = structuredClone(state);
      const result = fn(draft, Date.now());
      if (result === NO_CHANGE) return { result, state };
      draft.version = state.version + 1;
      g.state = draft;
      for (const l of g.listeners) l(draft.version);
      return { result, state: draft };
    };
    const p = g.queue.then(run, run);
    g.queue = p.catch(() => undefined);
    return p;
  }

  waitForChange(since: number, timeoutMs: number): Promise<number> {
    const g = memoryGlobal();
    const current = this.ensure().version;
    if (current > since) return Promise.resolve(current);
    return new Promise((resolve) => {
      const done = (v: number) => {
        clearTimeout(timer);
        g.listeners.delete(done);
        resolve(v);
      };
      const timer = setTimeout(() => done(this.ensure().version), timeoutMs);
      g.listeners.add(done);
    });
  }

  async hit(key: string, windowMs: number): Promise<number> {
    const g = memoryGlobal();
    const now = Date.now();
    const cur = g.hits.get(key);
    if (!cur || cur.resetAt <= now) {
      g.hits.set(key, { count: 1, resetAt: now + windowMs });
      return 1;
    }
    cur.count += 1;
    return cur.count;
  }

  async reset(): Promise<WorldState> {
    const g = memoryGlobal();
    g.state = freshWorld();
    for (const l of g.listeners) l(g.state.version);
    return g.state;
  }
}

/* ------------------------------------------------------------------ */
/* Redis backend                                                       */
/* ------------------------------------------------------------------ */

const CAS_SCRIPT = `
local v = redis.call('GET', KEYS[2])
if (v == false and ARGV[1] == '0') or v == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2])
  redis.call('SET', KEYS[2], ARGV[3])
  return 1
end
return 0
`;

class RedisStore implements Store {
  readonly kind = "redis" as const;
  private redis: Redis;

  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token, automaticDeserialization: false });
  }

  private async load(): Promise<WorldState | null> {
    const raw = await this.redis.get<string>(WORLD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorldState;
  }

  private async cas(expected: number, next: WorldState): Promise<boolean> {
    const ok = await this.redis.eval(CAS_SCRIPT, [WORLD_KEY, VERSION_KEY], [String(expected), JSON.stringify(next), String(next.version)]);
    return Number(ok) === 1;
  }

  async get(): Promise<WorldState> {
    const existing = await this.load();
    if (existing) return existing;
    const seeded = freshWorld();
    seeded.version = 1;
    if (await this.cas(0, seeded)) return seeded;
    return (await this.load()) ?? seeded;
  }

  async version(): Promise<number> {
    const v = await this.redis.get<string>(VERSION_KEY);
    return v ? Number(v) : 0;
  }

  async mutate<T>(fn: Mutation<T>): Promise<MutationResult<T>> {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const state = await this.get();
      const draft = structuredClone(state);
      const result = fn(draft, Date.now());
      if (result === NO_CHANGE) return { result, state };
      draft.version = state.version + 1;
      try {
        if (await this.cas(state.version, draft)) return { result, state: draft };
      } catch (err) {
        lastErr = err;
      }
      await new Promise((r) => setTimeout(r, 40 + Math.random() * 120 * (attempt + 1)));
    }
    throw lastErr ?? new Error("The world was busy; please retry");
  }

  async waitForChange(since: number, timeoutMs: number): Promise<number> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const v = await this.version();
      if (v > since) return v;
      await new Promise((r) => setTimeout(r, 900));
    }
    return this.version();
  }

  async hit(key: string, windowMs: number): Promise<number> {
    const k = `agol:rl:${key}`;
    const count = await this.redis.incr(k);
    if (count === 1) await this.redis.pexpire(k, windowMs);
    return count;
  }

  async reset(): Promise<WorldState> {
    const seeded = freshWorld();
    seeded.version = (await this.version()) + 1;
    await this.redis.set(WORLD_KEY, JSON.stringify(seeded));
    await this.redis.set(VERSION_KEY, String(seeded.version));
    return seeded;
  }
}

/* ------------------------------------------------------------------ */
/* Postgres backend (Neon / Vercel Postgres over HTTP)                 */
/* ------------------------------------------------------------------ */

type SqlFn = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

class PostgresStore implements Store {
  readonly kind = "postgres" as const;
  private sqlPromise: Promise<SqlFn> | null = null;
  private ready: Promise<void> | null = null;

  constructor(private url: string) {}

  private async sql(): Promise<SqlFn> {
    if (!this.sqlPromise) {
      this.sqlPromise = import("@neondatabase/serverless").then(({ neon }) => neon(this.url) as unknown as SqlFn);
    }
    return this.sqlPromise;
  }

  private async ensureSchema(): Promise<void> {
    if (!this.ready) {
      this.ready = (async () => {
        const sql = await this.sql();
        await sql`CREATE TABLE IF NOT EXISTS agol_world (id INT PRIMARY KEY, version BIGINT NOT NULL, doc TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
        await sql`CREATE TABLE IF NOT EXISTS agol_hits (key TEXT PRIMARY KEY, count INT NOT NULL, reset_at BIGINT NOT NULL)`;
      })().catch((err) => {
        this.ready = null;
        throw err;
      });
    }
    return this.ready;
  }

  private async load(): Promise<WorldState | null> {
    await this.ensureSchema();
    const sql = await this.sql();
    const rows = await sql`SELECT doc FROM agol_world WHERE id = 1`;
    if (!rows.length) return null;
    return JSON.parse(String(rows[0].doc)) as WorldState;
  }

  async get(): Promise<WorldState> {
    const existing = await this.load();
    if (existing) return existing;
    const seeded = freshWorld();
    seeded.version = 1;
    const sql = await this.sql();
    await sql`INSERT INTO agol_world (id, version, doc) VALUES (1, ${seeded.version}, ${JSON.stringify(seeded)}) ON CONFLICT (id) DO NOTHING`;
    return (await this.load()) ?? seeded;
  }

  async version(): Promise<number> {
    await this.ensureSchema();
    const sql = await this.sql();
    const rows = await sql`SELECT version FROM agol_world WHERE id = 1`;
    return rows.length ? Number(rows[0].version) : 0;
  }

  async mutate<T>(fn: Mutation<T>): Promise<MutationResult<T>> {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const state = await this.get();
      const draft = structuredClone(state);
      const result = fn(draft, Date.now());
      if (result === NO_CHANGE) return { result, state };
      draft.version = state.version + 1;
      try {
        const sql = await this.sql();
        const rows = await sql`UPDATE agol_world SET doc = ${JSON.stringify(draft)}, version = ${draft.version}, updated_at = now() WHERE id = 1 AND version = ${state.version} RETURNING version`;
        if (rows.length) return { result, state: draft };
      } catch (err) {
        lastErr = err;
      }
      await new Promise((r) => setTimeout(r, 40 + Math.random() * 120 * (attempt + 1)));
    }
    throw lastErr ?? new Error("The world was busy; please retry");
  }

  async waitForChange(since: number, timeoutMs: number): Promise<number> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const v = await this.version();
      if (v > since) return v;
      await new Promise((r) => setTimeout(r, 900));
    }
    return this.version();
  }

  async hit(key: string, windowMs: number): Promise<number> {
    await this.ensureSchema();
    const sql = await this.sql();
    const now = Date.now();
    const rows = await sql`
      INSERT INTO agol_hits (key, count, reset_at) VALUES (${key}, 1, ${now + windowMs})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN agol_hits.reset_at <= ${now} THEN 1 ELSE agol_hits.count + 1 END,
        reset_at = CASE WHEN agol_hits.reset_at <= ${now} THEN ${now + windowMs} ELSE agol_hits.reset_at END
      RETURNING count`;
    return rows.length ? Number(rows[0].count) : 1;
  }

  async reset(): Promise<WorldState> {
    await this.ensureSchema();
    const seeded = freshWorld();
    seeded.version = (await this.version()) + 1;
    const sql = await this.sql();
    await sql`INSERT INTO agol_world (id, version, doc) VALUES (1, ${seeded.version}, ${JSON.stringify(seeded)}) ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version, doc = EXCLUDED.doc, updated_at = now()`;
    return seeded;
  }
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

export function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };
  return null;
}

export function postgresConfig(): { url: string } | null {
  const url = process.env.AGOL_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (url && /^postgres(ql)?:\/\//.test(url)) return { url };
  return null;
}

let cached: Store | null = null;

/** Backend priority: Redis (Upstash / Vercel KV) → Postgres (Neon / Vercel Postgres) → in-memory. */
export function getStore(): Store {
  if (cached) return cached;
  const redis = redisConfig();
  const pg = postgresConfig();
  const store: Store = redis ? new RedisStore(redis.url, redis.token) : pg ? new PostgresStore(pg.url) : new MemoryStore();
  cached = store;
  return store;
}
