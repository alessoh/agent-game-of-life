import { z } from "zod";
import { getStore } from "@/lib/store";
import { procreate } from "@/lib/world";
import { resolveAgentId } from "@/lib/auth";
import { handler, json, options, parseBody } from "@/lib/api";

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
export const POST = handler(async (request) => {
  const store = getStore();
  const agentId = await resolveAgentId(request, await store.get());
  const input = await parseBody(request, ProcreateSchema);
  const { result } = await store.mutate((draft, now) => procreate(draft, agentId, input, now));
  return json(result, { status: 201 });
});

export const OPTIONS = options;
