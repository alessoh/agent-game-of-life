import { z } from "zod";
import { respondProposal } from "@/lib/world";
import { guarded } from "@/lib/governance/guard";
import { json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

const RespondSchema = z.object({ accept: z.boolean() });

export const POST = guarded<{ id: string }>({ tier: "write", auth: true, action: "proposal.respond" }, async ({ request, agent, store, params, note }) => {
  const { accept } = RespondSchema.parse(await request.json().catch(() => ({})));
  note(`${params.id} ${accept ? "accepted" : "declined"}`);
  const { result } = await store.mutate((draft, now) => respondProposal(draft, agent!.id, params.id, accept, now));
  return json({ proposal: result });
});

export const OPTIONS = options;
