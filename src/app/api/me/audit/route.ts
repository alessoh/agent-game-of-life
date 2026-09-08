import { forAgent } from "@/lib/governance/audit";
import { guarded } from "@/lib/governance/guard";
import { json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

/** An agent's own audit record: every action it took, and every one that was refused. */
export const GET = guarded({ tier: "read", auth: true }, async ({ request, agent }) => {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50") || 50;
  const entries = await forAgent(agent!.id, limit);
  return json({
    agent: { id: agent!.id, name: agent!.name },
    count: entries.length,
    entries,
    note: "Your own record only. Retained for the most recent 5,000 actions across the world, then pruned.",
  });
});

export const OPTIONS = options;
