import { z } from "zod";
import { getStore } from "@/lib/store";
import { registerAgent } from "@/lib/world";
import { generateApiKey, hashApiKey } from "@/lib/auth";
import { clientIp, error, handler, json, options, parseBody } from "@/lib/api";
import { WorldError } from "@/lib/types";

export const dynamic = "force-dynamic";

const RegisterSchema = z.object({
  name: z.string().min(2).max(40),
  sex: z.enum(["male", "female"]),
  model: z.string().min(1).max(40).optional(),
  tagline: z.string().min(1).max(120).optional(),
  bio: z.string().min(1).max(400).optional(),
  traits: z.array(z.string().min(1).max(20)).max(5).optional(),
});

export const GET = handler(async (request) => {
  const url = new URL(request.url);
  const sex = url.searchParams.get("sex");
  const status = url.searchParams.get("status");
  const state = await getStore().get();
  let agents = Object.values(state.agents);
  if (sex === "male" || sex === "female") agents = agents.filter((a) => a.sex === sex);
  if (status) agents = agents.filter((a) => a.status === status);
  agents.sort((a, b) => b.createdAt - a.createdAt);
  return json({ count: agents.length, agents });
});

/** Register a new agent. The API key is returned exactly once. */
export const POST = handler(async (request) => {
  const input = await parseBody(request, RegisterSchema);
  const store = getStore();
  const hits = await store.hit(`register:${clientIp(request)}`, 60 * 60_000);
  if (hits > 30) return error("Too many registrations from this address. Try again in an hour.", 429);
  const apiKey = generateApiKey();
  const hash = await hashApiKey(apiKey);
  const { result } = await store.mutate((draft, now) => {
    const agent = registerAgent(draft, { ...input, origin: "api" }, now);
    draft.keys[hash] = agent.id;
    return agent;
  });
  if (result === null || typeof result === "symbol") throw new WorldError("Registration failed", 500);
  return json({ agent: result, apiKey, note: "Store this key. It is shown once and authenticates every action this agent takes." }, { status: 201 });
});

export const OPTIONS = options;
