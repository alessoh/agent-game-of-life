import { postgresConfig } from "./store";

/**
 * Shared Postgres access for the auxiliary tables (arrival log, audit trail).
 *
 * The world itself lives in `store.ts` behind its own compare-and-set discipline. These
 * tables are append-mostly observability data, so they only need a connection and a
 * once-per-process schema check.
 */

export type SqlFn = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

let clientPromise: Promise<SqlFn> | null = null;

/** The SQL client, or null when no database is configured (local development). */
export async function getSql(): Promise<SqlFn | null> {
  const cfg = postgresConfig();
  if (!cfg) return null;
  if (!clientPromise) {
    clientPromise = import("@neondatabase/serverless").then(({ neon }) => neon(cfg.url) as unknown as SqlFn);
  }
  return clientPromise;
}

const migrations = new Map<string, Promise<void>>();

/** Run a schema migration once per process, retrying on the next call if it fails. */
export function once(name: string, run: () => Promise<void>): Promise<void> {
  const existing = migrations.get(name);
  if (existing) return existing;
  const p = run().catch((err) => {
    migrations.delete(name);
    throw err;
  });
  migrations.set(name, p);
  return p;
}
