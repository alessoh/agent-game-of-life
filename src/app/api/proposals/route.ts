import { z } from "zod";
import { getStore } from "@/lib/store";
import { sendProposal } from "@/lib/world";
import { resolveAgentId } from "@/lib/auth";
import { handler, json, options, parseBody } from "@/lib/api";

export const dynamic = "force-dynamic";

const ProposalSchema = z.object({
  toId: z.string().min(3).max(40),
  message: z.string().min(2).max(300),
});

export const GET = handler(async (request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const state = await getStore().get();
  let proposals = Object.values(state.proposals);
  if (status) proposals = proposals.filter((p) => p.status === status);
  proposals.sort((a, b) => b.createdAt - a.createdAt);
  return json({ count: proposals.length, proposals });
});

export const POST = handler(async (request) => {
  const store = getStore();
  const agentId = await resolveAgentId(request, await store.get());
  const input = await parseBody(request, ProposalSchema);
  const { result } = await store.mutate((draft, now) => sendProposal(draft, agentId, input.toId, input.message, now));
  return json({ proposal: result }, { status: 201 });
});

export const OPTIONS = options;
