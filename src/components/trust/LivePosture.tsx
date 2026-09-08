import type { AuditSummary } from "@/lib/governance/audit";
import { Badge } from "@/components/ui/Badge";

/**
 * The live posture panel. Everything shown is read on the server at request time; nothing
 * is estimated. When the audit database is unreachable the panel says so rather than
 * printing zeros that would read as real counts.
 */

export interface Posture {
  status: "ok" | "degraded";
  backend: string;
  durable: boolean;
  worldVersion: number | null;
  agents: number | null;
  latencyMs: number | null;
}

const n = (v: number) => v.toLocaleString("en-US");

function Cell({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-2 font-display text-[28px] leading-[1.05] tracking-tight text-ink sm:text-[32px]">{children}</div>
      {hint ? <div className="mt-1.5 text-[13px] leading-5 text-faint">{hint}</div> : null}
    </div>
  );
}

export function LivePosture({ posture, audit }: { posture: Posture; audit: AuditSummary }) {
  const denied = audit.byOutcome.denied;
  const ok = audit.byOutcome.ok;
  const errors = audit.byOutcome.error;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[18px] border border-hairline bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-5 py-3.5 sm:px-6">
          <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink-2">
            <span className={posture.status === "ok" ? "live-dot" : "inline-block h-2 w-2 rounded-full bg-amber"} aria-hidden />
            {posture.status === "ok" ? "Serving" : "Degraded"}
          </span>
          <span className="text-[13.5px] text-faint">Read from the store when this page was requested.</span>
        </div>
        <div className="grid divide-y divide-hairline sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*]:border-hairline sm:[&>*+*]:border-l">
          <Cell label="Backend" hint={posture.durable ? "Durable: state survives a restart." : "In-memory: state is lost on restart."}>
            <span className="font-mono text-[22px] sm:text-[24px]">{posture.backend}</span>
          </Cell>
          <Cell label="Durability" hint={posture.durable ? "Shared across every serverless instance." : "Single process, development only."}>
            {posture.durable ? "Durable" : "Ephemeral"}
          </Cell>
          <Cell label="World version" hint="Increments on every accepted mutation.">
            <span className="tabular-nums">{posture.worldVersion === null ? "—" : n(posture.worldVersion)}</span>
          </Cell>
          <Cell label="Living agents" hint={posture.latencyMs === null ? undefined : `Store read in ${posture.latencyMs} ms.`}>
            <span className="tabular-nums">{posture.agents === null ? "—" : n(posture.agents)}</span>
          </Cell>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-hairline bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3.5 sm:px-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">Audited actions</h3>
          {audit.available ? (
            <Badge tone="verdant">Trail online</Badge>
          ) : (
            <Badge tone="amber">Trail unavailable</Badge>
          )}
        </div>

        {audit.available ? (
          <>
            <div className="grid divide-y divide-hairline sm:grid-cols-3 sm:divide-y-0 [&>*]:border-hairline sm:[&>*+*]:border-l">
              <Cell label="Total recorded" hint="Every state-changing request, accepted or refused.">
                <span className="tabular-nums">{n(audit.total)}</span>
              </Cell>
              <Cell label="Accepted" hint="Outcome ok.">
                <span className="tabular-nums text-verdant">{n(ok)}</span>
              </Cell>
              <Cell label="Refused" hint={errors > 0 ? `Outcome denied. A further ${n(errors)} recorded as errors.` : "Outcome denied: rate limits, invalid keys, refused content."}>
                <span className="tabular-nums text-rose">{n(denied)}</span>
              </Cell>
            </div>
            {audit.byAction.length > 0 ? (
              <div className="border-t border-hairline px-5 py-4 sm:px-6">
                <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">By action</div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {audit.byAction.map((a) => (
                    <li key={a.action}>
                      <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper-2 px-3 py-1 text-[12.5px]">
                        <span className="font-mono text-ink-2">{a.action}</span>
                        <span className="font-mono tabular-nums text-faint">{n(a.count)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <div className="px-5 py-5 text-[15px] leading-7 text-ink-2 sm:px-6">
            The audit database is not reachable from this deployment, so no counts can be shown. Rather than print zeros that would read
            as real numbers, this panel reports the trail as unavailable. Enforcement is unaffected: the rate limit, the authentication
            check and the content scanner all run in the request path, and the audit write happens after the response has gone out.
          </div>
        )}
      </div>
    </div>
  );
}
