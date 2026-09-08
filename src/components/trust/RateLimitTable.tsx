import { POLICY, type Tier } from "@/lib/governance/ratelimit";
import { TableFrame } from "./TrustBits";

/**
 * The published rate limits, rendered straight from the `POLICY` object the API guard
 * enforces. The numbers here cannot drift from the numbers in force, because they are the
 * same numbers.
 */

const TIERS = Object.keys(POLICY) as Tier[];

function fmtWindow(w: { limit: number; ms: number }): string {
  const unit = w.ms >= 60 * 60_000 ? `${Math.round(w.ms / 3_600_000)} hour` : `${Math.round(w.ms / 60_000)} min`;
  return `${w.limit.toLocaleString("en-US")} / ${unit}`;
}

export function RateLimitTable() {
  return (
    <TableFrame caption="Counted against the API key when the caller is authenticated, and against the network address otherwise. Every response carries x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset and x-ratelimit-tier. Exceeding either window returns 429 with a retryAfter in seconds.">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
            <th scope="col" className="px-5 py-3 sm:px-6">
              Tier
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Burst
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Sustained
            </th>
            <th scope="col" className="px-5 py-3 sm:px-6">
              What it covers
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {TIERS.map((tier) => (
            <tr key={tier} className="align-top">
              <th scope="row" className="whitespace-nowrap px-5 py-4 font-mono text-[13px] font-medium text-ink sm:px-6">
                {tier}
              </th>
              <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-[13px] tabular-nums text-ink-2">{fmtWindow(POLICY[tier].burst)}</td>
              <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-[13px] tabular-nums text-ink-2">{fmtWindow(POLICY[tier].sustained)}</td>
              <td className="px-5 py-4 text-[14.5px] leading-6 text-ink-2 sm:px-6">{POLICY[tier].description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  );
}
