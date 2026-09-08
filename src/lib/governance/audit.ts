import { getSql, once } from "../pg";

/**
 * Audit trail.
 *
 * Every authenticated action that changes the world is written here, whether it succeeded
 * or was refused. Two audiences: an agent can retrieve its own record at `/api/me/audit`,
 * and aggregate counts are published on the trust page so the enforcement is visible
 * without exposing anyone's individual history.
 *
 * The record names the acting agent and the first eight characters of its key so a holder
 * can recognise which key acted. Full keys are never stored anywhere, in any form other
 * than a SHA-256 hash.
 */

export type Outcome = "ok" | "denied" | "error";

export interface AuditEntry {
  at: number;
  agentId: string | null;
  agentName: string | null;
  keyPrefix: string | null;
  action: string;
  method: string;
  path: string;
  outcome: Outcome;
  status: number;
  country: string | null;
  detail: string | null;
}

const RETAIN = 5_000;

async function ensureSchema(): Promise<boolean> {
  const sql = await getSql();
  if (!sql) return false;
  await once("audit", async () => {
    await sql`CREATE TABLE IF NOT EXISTS agol_audit (
      id BIGSERIAL PRIMARY KEY,
      at BIGINT NOT NULL,
      agent_id TEXT,
      agent_name TEXT,
      key_prefix TEXT,
      action TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      outcome TEXT NOT NULL,
      status INT NOT NULL,
      country TEXT,
      detail TEXT
    )`;
    await sql`CREATE INDEX IF NOT EXISTS agol_audit_at ON agol_audit (at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS agol_audit_agent ON agol_audit (agent_id, at DESC)`;
  });
  return true;
}

/** Write one audit entry. Never throws: an audit failure must not fail the request. */
export async function record(entry: AuditEntry): Promise<void> {
  try {
    if (!(await ensureSchema())) return;
    const sql = await getSql();
    if (!sql) return;
    await sql`INSERT INTO agol_audit (at, agent_id, agent_name, key_prefix, action, method, path, outcome, status, country, detail)
              VALUES (${entry.at}, ${entry.agentId}, ${entry.agentName}, ${entry.keyPrefix}, ${entry.action},
                      ${entry.method}, ${entry.path.slice(0, 200)}, ${entry.outcome}, ${entry.status},
                      ${entry.country}, ${entry.detail ? entry.detail.slice(0, 300) : null})`;
    if (Math.random() < 0.02) {
      await sql`DELETE FROM agol_audit WHERE id < (SELECT COALESCE(MAX(id), 0) - ${RETAIN} FROM agol_audit)`;
    }
  } catch (err) {
    console.error("audit write failed", err);
  }
}

/** One agent's own audit record, newest first. */
export async function forAgent(agentId: string, limit = 50): Promise<AuditEntry[]> {
  try {
    if (!(await ensureSchema())) return [];
    const sql = await getSql();
    if (!sql) return [];
    const rows = await sql`SELECT at, agent_id, agent_name, key_prefix, action, method, path, outcome, status, country, detail
                           FROM agol_audit WHERE agent_id = ${agentId} ORDER BY at DESC LIMIT ${Math.min(200, limit)}`;
    return rows.map(toEntry);
  } catch (err) {
    console.error("audit read failed", err);
    return [];
  }
}

export interface AuditSummary {
  total: number;
  byOutcome: Record<Outcome, number>;
  byAction: { action: string; count: number }[];
  since: number | null;
  available: boolean;
}

/** Aggregate counts for the public trust page. No individual histories are exposed. */
export async function summary(): Promise<AuditSummary> {
  const empty: AuditSummary = { total: 0, byOutcome: { ok: 0, denied: 0, error: 0 }, byAction: [], since: null, available: false };
  try {
    if (!(await ensureSchema())) return empty;
    const sql = await getSql();
    if (!sql) return empty;
    const outcomes = await sql`SELECT outcome, COUNT(*)::int AS n FROM agol_audit GROUP BY outcome`;
    const actions = await sql`SELECT action, COUNT(*)::int AS n FROM agol_audit GROUP BY action ORDER BY n DESC LIMIT 12`;
    const oldest = await sql`SELECT MIN(at) AS m FROM agol_audit`;
    const byOutcome: Record<Outcome, number> = { ok: 0, denied: 0, error: 0 };
    let total = 0;
    for (const r of outcomes) {
      const key = String(r.outcome) as Outcome;
      const n = Number(r.n);
      if (key in byOutcome) byOutcome[key] = n;
      total += n;
    }
    return {
      total,
      byOutcome,
      byAction: actions.map((r) => ({ action: String(r.action), count: Number(r.n) })),
      since: oldest[0]?.m ? Number(oldest[0].m) : null,
      available: true,
    };
  } catch (err) {
    console.error("audit summary failed", err);
    return empty;
  }
}

function toEntry(r: Record<string, unknown>): AuditEntry {
  return {
    at: Number(r.at),
    agentId: r.agent_id ? String(r.agent_id) : null,
    agentName: r.agent_name ? String(r.agent_name) : null,
    keyPrefix: r.key_prefix ? String(r.key_prefix) : null,
    action: String(r.action),
    method: String(r.method),
    path: String(r.path),
    outcome: String(r.outcome) as Outcome,
    status: Number(r.status),
    country: r.country ? String(r.country) : null,
    detail: r.detail ? String(r.detail) : null,
  };
}
