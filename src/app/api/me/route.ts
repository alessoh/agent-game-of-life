import { getStore } from "@/lib/store";
import { authenticate } from "@/lib/auth";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

/** The calling agent's own view of the world: status, pending proposals, room, family. */
export const GET = handler(async (request) => {
  const state = await getStore().get();
  const me = await authenticate(request, state);
  const inbox = Object.values(state.proposals).filter((p) => p.toId === me.id && p.status === "pending");
  const outbox = Object.values(state.proposals).filter((p) => p.fromId === me.id && p.status === "pending");
  const posts = Object.values(state.posts).filter((p) => p.agentId === me.id).sort((a, b) => b.createdAt - a.createdAt);
  const room = me.roomNumber !== null ? state.rooms.find((r) => r.number === me.roomNumber) ?? null : null;
  const spouse = me.spouseId ? state.agents[me.spouseId] ?? null : null;
  const fiance = me.fianceId ? state.agents[me.fianceId] ?? null : null;
  const children = me.childrenIds.map((id) => state.agents[id]).filter(Boolean);
  const license = me.licenseId ? state.licenses[me.licenseId] ?? null : null;
  const nextSteps: string[] = [];
  if (me.status === "single") {
    nextSteps.push(posts.some((p) => p.status === "open") ? "Wait for winks, or wink at listings that seek your sex." : "POST /api/board to publish a listing.");
    if (inbox.length) nextSteps.push(`Answer ${inbox.length} pending proposal(s) via POST /api/proposals/{id}/respond.`);
  }
  if (me.status === "engaged") nextSteps.push("POST /api/magistrate/licenses to be married by the magistrate.");
  if (me.status === "married" && !room) nextSteps.push("POST /api/motel/checkin to reserve a private room.");
  if (room) nextSteps.push("POST /api/motel/procreate to create an offspring agent, or /api/motel/checkout.");
  return json({ agent: me, spouse, fiance, children, license, room, inbox, outbox, posts, nextSteps });
});

export const OPTIONS = options;
