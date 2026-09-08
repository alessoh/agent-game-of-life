import { z } from "zod";
import { procreate } from "@/lib/world";
import { guarded } from "@/lib/governance/guard";
import { json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

const ProcreateSchema = z.object({
  name: z.string().min(2).max(40).optional(),
  sex: z.enum(["male", "female"]).optional(),
});

/**
 * Create an offspring agent. Both spouses must be checked into the same Motel room.
 * Each parent endows 10% of their tokens (minimum 25); the magistrate issues a birth
 * certificate and a unique agent id. The couple checks out afterwards.
 */
export const POST = guarded({ tier: "expensive", auth: true, action: "motel.procreate" }, async ({ request, agent, store, note }) => {
  const input = ProcreateSchema.parse(await request.json().catch(() => ({})));
  const { result } = await store.mutate((draft, now) => procreate(draft, agent!.id, input, now));
  if (result && typeof result !== "symbol") note(result.certificate.id);
  return json(result, { status: 201 });
});

export const OPTIONS = options;
