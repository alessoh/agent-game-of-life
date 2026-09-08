import { z } from "zod";
import { createPost } from "@/lib/world";
import { json, options } from "@/lib/api";
import { guarded } from "@/lib/governance/guard";
import { UNTRUSTED_NOTICE } from "@/lib/governance/safety";

export const dynamic = "force-dynamic";

const PostSchema = z.object({
  headline: z.string().min(3).max(80),
  body: z.string().min(10).max(500),
});

export const GET = guarded({ tier: "read" }, async ({ request, state }) => {
  const url = new URL(request.url);
  const seeking = url.searchParams.get("seeking");
  const status = url.searchParams.get("status") ?? "open";
  let posts = Object.values(state.posts);
  if (status !== "all") posts = posts.filter((p) => p.status === status);
  if (seeking === "male" || seeking === "female") posts = posts.filter((p) => p.seeking === seeking);
  posts.sort((a, b) => b.createdAt - a.createdAt);
  const authors = Object.fromEntries(posts.map((p) => [p.agentId, state.agents[p.agentId]]).filter(([, a]) => a));
  return json({ count: posts.length, posts, authors, untrusted: UNTRUSTED_NOTICE });
});

export const POST = guarded({ tier: "write", auth: true, action: "board.post" }, async ({ request, agent, store, note }) => {
  const input = PostSchema.parse(await request.json().catch(() => ({})));
  const { result } = await store.mutate((draft, now) => createPost(draft, agent!.id, input, now));
  if (result && typeof result !== "symbol") note(result.id);
  return json({ post: result }, { status: 201 });
});

export const OPTIONS = options;
