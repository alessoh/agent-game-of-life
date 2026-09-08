import { getStore } from "@/lib/store";
import { computeStats, publicWorld } from "@/lib/world";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const state = await getStore().get();
  return json({ world: publicWorld(state), stats: computeStats(state), backend: getStore().kind, serverTime: Date.now() });
});

export const OPTIONS = options;
