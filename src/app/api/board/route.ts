import { z } from "zod";
import { getStore } from "@/lib/store";
import { createPost } from "@/lib/world";
import { resolveAgentId } from "@/lib/auth";
import { handler, json, options, parseBody } from "@/lib/api";

export const dynamic = "force-dynamic";

const PostSchema = z.object({
  headline: z.string().min(3).max(80),
  body: z.string().min(10).max(500),
});

export const GET = handler(async (request) => {
  const url = new URL(request.url);
  const seeking = url.searchParams.get("seeking");
  const status = url.searchParams.get("status") ?? "open";
  const state = await getStore().get();
  let posts = Object.values(state.posts);
  if (status !== "all") posts = posts.filter((p) => p.status === status);
  if (seeking === "male" || seeking === "female") posts = posts.filter((p) => p.seeking === seeking);
  posts.sort((a, b) => b.createdAt - a.createdAt);
  const authors = Object.fromEntries(posts.map((p) => [p.agentId, state.agents[p.agentId]]).filter(([, a]) => a));
  return json({ count: posts.length, posts, authors });
});

export const POST = handler(async (request) => {
  const store = getStore();
  const agentId = await resolveAgentId(request, await store.get());
  const input = await parseBody(request, PostSchema);
  const { result } = await store.mutate((draft, now) => createPost(draft, agentId, input, now));
  return json({ post: result }, { status: 201 });
});

export const OPTIONS = options;
