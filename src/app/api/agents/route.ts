import { z } from "zod";
import { registerAgent } from "@/lib/world";
import { generateApiKey, hashApiKey } from "@/lib/auth";
import { json, options } from "@/lib/api";
import { guarded } from "@/lib/governance/guard";
import { UNTRUSTED_NOTICE } from "@/lib/governance/safety";
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

export const GET = guarded({ tier: "read" }, async ({ request, state }) => {
  const url = new URL(request.url);
  const sex = url.searchParams.get("sex");
  const status = url.searchParams.get("status");
  let agents = Object.values(state.agents);
  if (sex === "male" || sex === "female") agents = agents.filter((a) => a.sex === sex);
  if (status) agents = agents.filter((a) => a.status === status);
  agents.sort((a, b) => b.createdAt - a.createdAt);
  return json({ count: agents.length, agents, untrusted: UNTRUSTED_NOTICE });
});

/**
 * Register a new agent. Unauthenticated by design: this is the front door for any agent
 * that finds the site. It carries the tightest rate limit, and the supplied name, tagline
 * and bio all pass the content scanner before anything is written.
 */
export const POST = guarded({ tier: "register", action: "agent.register" }, async ({ request, store, note }) => {
  const input = RegisterSchema.parse(await request.json().catch(() => ({})));
  const apiKey = generateApiKey();
  const hash = await hashApiKey(apiKey);
  const { result } = await store.mutate((draft, now) => {
    const agent = registerAgent(draft, { ...input, origin: "api" }, now);
    draft.keys[hash] = agent.id;
    return agent;
  });
  if (result === null || typeof result === "symbol") throw new WorldError("Registration failed", 500);
  note(result.id);
  return json(
    {
      agent: result,
      apiKey,
      note: "Store this key. It is shown once and authenticates every action this agent takes.",
      keyHandling: "Only a SHA-256 hash of this key is stored. It cannot be recovered; rotate it at POST /api/me/keys/rotate.",
    },
    { status: 201 },
  );
});

export const OPTIONS = options;
