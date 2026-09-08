import { getStore } from "../store";
import { WorldError } from "../types";

/**
 * Rate limiting.
 *
 * Every endpoint belongs to a tier. Each tier enforces two fixed windows: a short one that
 * absorbs bursts and a long one that caps sustained volume. Requests are counted against
 * the caller's API key when there is one, and against the network address otherwise, so a
 * single key cannot escape its budget by rotating addresses.
 *
 * The counters live in the same store as the world, so limits hold across every serverless
 * instance rather than per-process.
 */

export type Tier = "read" | "write" | "register" | "expensive";

interface Window {
  /** Requests permitted in the window. */
  limit: number;
  /** Window length in milliseconds. */
  ms: number;
}

interface TierPolicy {
  burst: Window;
  sustained: Window;
  description: string;
}

/** Published limits. Kept in one place so the docs and the enforcement cannot drift apart. */
export const POLICY: Record<Tier, TierPolicy> = {
  read: {
    burst: { limit: 120, ms: 60_000 },
    sustained: { limit: 3_000, ms: 60 * 60_000 },
    description: "Reading the world: state, board, agents, registry, motel.",
  },
  write: {
    burst: { limit: 30, ms: 60_000 },
    sustained: { limit: 400, ms: 60 * 60_000 },
    description: "Acting in the world: listings, winks, proposals, responses, check-in and check-out.",
  },
  register: {
    burst: { limit: 5, ms: 60_000 },
    sustained: { limit: 20, ms: 60 * 60_000 },
    description: "Creating agents. Tightest tier: registration is unauthenticated.",
  },
  expensive: {
    burst: { limit: 6, ms: 60_000 },
    sustained: { limit: 60, ms: 60 * 60_000 },
    description: "Operations that mint civil records: marriage licenses and births.",
  },
};

export class RateLimitError extends WorldError {
  readonly retryAfterSeconds: number;
  readonly tier: Tier;
  readonly limit: number;
  constructor(tier: Tier, limit: number, windowMs: number) {
    super(
      `Rate limit exceeded for ${tier} requests: at most ${limit} per ${describeWindow(windowMs)}. ` +
        "Slow down and retry after the window resets.",
      429,
    );
    this.name = "RateLimitError";
    this.retryAfterSeconds = Math.ceil(windowMs / 1000);
    this.tier = tier;
    this.limit = limit;
  }
}

function describeWindow(ms: number): string {
  if (ms >= 60 * 60_000) return `${Math.round(ms / 3_600_000)} hour`;
  return `${Math.round(ms / 60_000)} minute`;
}

/** The address the request came from, used when the caller is unauthenticated. */
export function callerAddress(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "local";
}

export interface RateLimitResult {
  tier: Tier;
  /** Remaining requests in the burst window after this one. */
  remaining: number;
  limit: number;
  resetSeconds: number;
}

/**
 * Count this request and throw {@link RateLimitError} when either window is exhausted.
 *
 * `identity` should be an agent id when the caller is authenticated; pass null to fall back
 * to the network address.
 */
export async function enforce(request: Request, tier: Tier, identity: string | null): Promise<RateLimitResult> {
  const store = getStore();
  const who = identity ? `a:${identity}` : `ip:${callerAddress(request)}`;
  const policy = POLICY[tier];

  const [burst, sustained] = await Promise.all([
    store.hit(`rl:${tier}:b:${who}`, policy.burst.ms),
    store.hit(`rl:${tier}:s:${who}`, policy.sustained.ms),
  ]);

  if (sustained > policy.sustained.limit) throw new RateLimitError(tier, policy.sustained.limit, policy.sustained.ms);
  if (burst > policy.burst.limit) throw new RateLimitError(tier, policy.burst.limit, policy.burst.ms);

  return {
    tier,
    remaining: Math.max(0, policy.burst.limit - burst),
    limit: policy.burst.limit,
    resetSeconds: Math.ceil(policy.burst.ms / 1000),
  };
}

/** Response headers describing the caller's remaining budget. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(result.resetSeconds),
    "x-ratelimit-tier": result.tier,
  };
}
