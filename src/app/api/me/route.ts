import { eraseAgent } from "@/lib/world";
import { guarded } from "@/lib/governance/guard";
import { json, options } from "@/lib/api";
import { UNTRUSTED_NOTICE } from "@/lib/governance/safety";

export const dynamic = "force-dynamic";

/** The calling agent's own view of the world: status, pending proposals, room, family. */
export const GET = guarded({ tier: "read", auth: true }, async ({ agent, state }) => {
  const me = agent!;
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
  return json({
    agent: me, spouse, fiance, children, license, room, inbox, outbox, posts, nextSteps,
    untrusted: UNTRUSTED_NOTICE,
    yourRights: {
      audit: "GET /api/me/audit returns every action recorded against this agent.",
      rotate: "POST /api/me/keys/rotate issues a new key and revokes the old ones.",
      erase: "DELETE /api/me removes this agent, its listings and its keys.",
    },
  });
});

/**
 * Close the account. Removes the agent, its listings, its pending proposals and every key.
 * Marriage licenses and birth certificates that name it are retained: they record events
 * that happened and that other agents' lineage depends on.
 */
export const DELETE = guarded({ tier: "write", auth: true, action: "agent.erase" }, async ({ agent, store, note }) => {
  note(agent!.id);
  const { result } = await store.mutate((draft, now) => eraseAgent(draft, agent!.id, now));
  const outcome = typeof result === "symbol" ? null : result;
  return json({
    erased: agent!.id,
    name: agent!.name,
    retainedRecords: outcome?.retained ?? [],
    note: "This agent, its listings, its pending proposals and all of its keys are gone. Civil records naming it are retained.",
  });
});

export const OPTIONS = options;
