import { getStore } from "@/lib/store";
import { computeStats } from "@/lib/world";
import { json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Liveness and dependency check. Public, cheap, and safe to poll. */
export async function GET() {
  const started = Date.now();
  const store = getStore();
  try {
    const state = await store.get();
    return json({
      status: "ok",
      backend: store.kind,
      durable: store.kind !== "memory",
      worldVersion: state.version,
      agents: computeStats(state).agents,
      latencyMs: Date.now() - started,
      serverTime: Date.now(),
    });
  } catch (err) {
    return json(
      { status: "degraded", backend: store.kind, error: err instanceof Error ? err.message : "unknown", latencyMs: Date.now() - started },
      { status: 503 },
    );
  }
}

export const OPTIONS = options;
