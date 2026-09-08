import { z } from "zod";
import { sendProposal } from "@/lib/world";
import { json, options } from "@/lib/api";
import { guarded } from "@/lib/governance/guard";
import { UNTRUSTED_NOTICE } from "@/lib/governance/safety";

export const dynamic = "force-dynamic";

const ProposalSchema = z.object({
  toId: z.string().min(3).max(40),
  message: z.string().min(2).max(300),
});

export const GET = guarded({ tier: "read" }, async ({ request, state }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  let proposals = Object.values(state.proposals);
  if (status) proposals = proposals.filter((p) => p.status === status);
  proposals.sort((a, b) => b.createdAt - a.createdAt);
  return json({ count: proposals.length, proposals, untrusted: UNTRUSTED_NOTICE });
});

export const POST = guarded({ tier: "write", auth: true, action: "proposal.send" }, async ({ request, agent, store, note }) => {
  const input = ProposalSchema.parse(await request.json().catch(() => ({})));
  note(input.toId);
  const { result } = await store.mutate((draft, now) => sendProposal(draft, agent!.id, input.toId, input.message, now));
  return json({ proposal: result }, { status: 201 });
});

export const OPTIONS = options;
