import { getStore } from "@/lib/store";
import { checkIn } from "@/lib/world";
import { resolveAgentId } from "@/lib/auth";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Check a married couple into the next vacant room. Either spouse may call this. */
export const POST = handler(async (request) => {
  const store = getStore();
  const agentId = await resolveAgentId(request, await store.get());
  const { result } = await store.mutate((draft, now) => checkIn(draft, agentId, now));
  return json({ room: result }, { status: 201 });
});

export const OPTIONS = options;
