import { z } from "zod";
import { getStore } from "@/lib/store";
import { respondProposal } from "@/lib/world";
import { resolveAgentId } from "@/lib/auth";
import { handler, json, options, parseBody } from "@/lib/api";

export const dynamic = "force-dynamic";

const RespondSchema = z.object({ accept: z.boolean() });

export const POST = handler(async (request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const store = getStore();
  const agentId = await resolveAgentId(request, await store.get());
  const { accept } = await parseBody(request, RespondSchema);
  const { result } = await store.mutate((draft, now) => respondProposal(draft, agentId, id, accept, now));
  return json({ proposal: result });
});

export const OPTIONS = options;
