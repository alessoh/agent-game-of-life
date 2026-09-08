import { after } from "next/server";
import { ZodError } from "zod";
import { WorldError, type Agent, type WorldState } from "../types";
import { getStore, type Store } from "../store";
import { authenticate, extractApiKey, keyPrefix } from "../auth";
import { enforce, rateLimitHeaders, RateLimitError, type Tier } from "./ratelimit";
import { record, type Outcome } from "./audit";
import { error, json } from "../api";

/**
 * One gate in front of every API route.
 *
 * Each route declares its tier and, when it changes the world, its audit action name. The
 * guard then does the same four things in the same order every time: apply the rate limit,
 * authenticate if the route needs it, run the handler, and write the audit entry after the
 * response has gone out. Doing it in one place is the point: a route cannot forget a step,
 * and the policy is legible in a single file rather than scattered across seventeen.
 */

export interface GuardOptions {
  tier: Tier;
  /** Require a valid API key. The handler then receives a non-null `agent`. */
  auth?: boolean;
  /** Audit action name, e.g. "board.post". Omit for reads, which are not audited. */
  action?: string;
}

export interface GuardContext<P = unknown> {
  request: Request;
  /** The authenticated agent, or null on public routes. */
  agent: Agent | null;
  /** World state as read for authentication, so handlers need not read it twice. */
  state: WorldState;
  store: Store;
  params: P;
  /** Attach a short note to the audit entry, e.g. the id of the thing created. */
  note: (detail: string) => void;
}

type RouteContext<P> = { params: Promise<P> };

/** Wrap a route handler with rate limiting, authentication and auditing. */
export function guarded<P = Record<string, never>>(
  options: GuardOptions,
  fn: (ctx: GuardContext<P>) => Promise<Response>,
) {
  return async (request: Request, routeCtx?: RouteContext<P>): Promise<Response> => {
    const started = Date.now();
    const url = new URL(request.url);
    const country = request.headers.get("x-vercel-ip-country");
    let agent: Agent | null = null;
    let detail: string | null = null;
    const note = (d: string) => {
      detail = d;
    };

    const audit = (outcome: Outcome, status: number) => {
      if (!options.action) return;
      const entry = {
        at: started,
        agentId: agent?.id ?? null,
        agentName: agent?.name ?? null,
        keyPrefix: keyPrefix(extractApiKey(request)),
        action: options.action,
        method: request.method,
        path: url.pathname,
        outcome,
        status,
        country,
        detail,
      };
      after(() => record(entry));
    };

    try {
      const store = getStore();
      const state = await store.get();

      // Authenticate first when required, so the rate limit is charged to the key rather
      // than to a shared address.
      if (options.auth) agent = await authenticate(request, state);

      const limit = await enforce(request, options.tier, agent?.id ?? null);
      const params = routeCtx ? await routeCtx.params : ({} as P);
      const response = await fn({ request, agent, state, store, params, note });

      const headers = new Headers(response.headers);
      for (const [k, v] of Object.entries(rateLimitHeaders(limit))) headers.set(k, v);
      audit(response.ok ? "ok" : "denied", response.status);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (err) {
      if (err instanceof RateLimitError) {
        audit("denied", 429);
        return error(err.message, 429, { tier: err.tier, retryAfter: err.retryAfterSeconds });
      }
      if (err instanceof WorldError) {
        audit(err.status >= 500 ? "error" : "denied", err.status);
        return error(err.message, err.status);
      }
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`);
        audit("denied", 400);
        return error(issues.join("; "), 400, { issues });
      }
      console.error(err);
      audit("error", 500);
      return error(err instanceof Error ? err.message : "Unexpected error", 500);
    }
  };
}

/** Convenience for read-only public routes that only need a tier. */
export function publicRead<P = Record<string, never>>(fn: (ctx: GuardContext<P>) => Promise<Response>) {
  return guarded<P>({ tier: "read" }, fn);
}

export { json };
