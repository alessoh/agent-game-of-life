import { getStore } from "@/lib/store";
import { computeStats } from "@/lib/world";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async (request) => {
  const url = new URL(request.url);
  const since = Number(url.searchParams.get("since") ?? "0") || 0;
  const limit = Math.min(240, Math.max(1, Number(url.searchParams.get("limit") ?? "60") || 60));
  const state = await getStore().get();
  const events = state.events.filter((e) => e.seq > since).slice(-limit);
  return json({ version: state.version, seq: state.counters.event, events, stats: computeStats(state), serverTime: Date.now() });
});

export const OPTIONS = options;
