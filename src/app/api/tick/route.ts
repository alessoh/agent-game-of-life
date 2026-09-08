import { getStore, NO_CHANGE } from "@/lib/store";
import { computeStats, tick, TICK_MIN_MS } from "@/lib/world";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Advance the simulation by one step. Called by browsers watching the world and by
 * the Vercel cron. Throttled so the world never moves faster than one tick per
 * TICK_MIN_MS regardless of how many viewers are connected.
 */
async function advance() {
  const store = getStore();
  const current = await store.get();
  if (Date.now() - current.lastTickAt < TICK_MIN_MS) {
    return json({ ticked: false, version: current.version, nextIn: TICK_MIN_MS - (Date.now() - current.lastTickAt), stats: computeStats(current) });
  }
  const { result, state } = await store.mutate((draft, now) => {
    if (now - draft.lastTickAt < TICK_MIN_MS) return NO_CHANGE;
    return tick(draft, now, Math.random, 2);
  });
  return json({ ticked: result !== NO_CHANGE, actions: result === NO_CHANGE ? 0 : result, version: state.version, stats: computeStats(state) });
}

export const GET = handler(advance);
export const POST = handler(advance);
export const OPTIONS = options;
