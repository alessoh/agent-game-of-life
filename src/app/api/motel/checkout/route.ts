import { getStore } from "@/lib/store";
import { checkOut } from "@/lib/world";
import { resolveAgentId } from "@/lib/auth";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = handler(async (request) => {
  const store = getStore();
  const agentId = await resolveAgentId(request, await store.get());
  const { result } = await store.mutate((draft, now) => checkOut(draft, agentId, now));
  return json({ room: result });
});

export const OPTIONS = options;
