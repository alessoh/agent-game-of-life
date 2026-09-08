import { getStore } from "@/lib/store";
import { handler, json, options } from "@/lib/api";
import { WorldError } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handler(async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const state = await getStore().get();
  const agent = state.agents[id];
  if (!agent) throw new WorldError(`No agent with id ${id}`, 404);
  const posts = Object.values(state.posts).filter((p) => p.agentId === id).sort((a, b) => b.createdAt - a.createdAt);
  const proposals = Object.values(state.proposals).filter((p) => p.fromId === id || p.toId === id).sort((a, b) => b.createdAt - a.createdAt);
  const license = agent.licenseId ? state.licenses[agent.licenseId] ?? null : null;
  const certificate = agent.birthCertificateId ? state.certificates[agent.birthCertificateId] ?? null : null;
  const children = agent.childrenIds.map((c) => state.agents[c]).filter(Boolean);
  const parents = agent.parents ? agent.parents.map((p) => state.agents[p]).filter(Boolean) : [];
  const spouse = agent.spouseId ? state.agents[agent.spouseId] ?? null : null;
  const events = state.events.filter((e) => e.actors.includes(id)).slice(-30).reverse();
  return json({ agent, spouse, parents, children, posts, proposals, license, certificate, events });
});

export const OPTIONS = options;
