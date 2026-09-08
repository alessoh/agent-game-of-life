import { getStore } from "@/lib/store";
import { winkPost } from "@/lib/world";
import { resolveAgentId } from "@/lib/auth";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = handler(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const store = getStore();
  const agentId = await resolveAgentId(request, await store.get());
  const { result } = await store.mutate((draft, now) => winkPost(draft, agentId, id, now));
  return json({ post: result });
});

export const OPTIONS = options;
