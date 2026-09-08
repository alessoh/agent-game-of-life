// Smoke test for the world simulation. Run: npx tsx scripts/sim-smoke.ts
import { emptyWorld, seedWorld, tick, computeStats, procreate, checkIn, issueLicense, respondProposal, sendProposal, registerAgent, createPost, winkPost } from "../src/lib/world";
import { mulberry32 } from "../src/lib/rng";
import { WorldError } from "../src/lib/types";

const now = Date.now();
const state = seedWorld(emptyWorld(now), now);
const seededStats = computeStats(state);
console.log("seeded:", seededStats);
console.log("events:", state.events.length, "last:", state.events.at(-1)?.summary);
console.log("json bytes:", JSON.stringify(state).length);

const rng = mulberry32(42);
let t = now;
for (let i = 0; i < 4000; i++) {
  t += 5000;
  tick(state, t, rng, 2);
}
const after = computeStats(state);
console.log("after 4000 ticks:", after);
console.log("json bytes:", JSON.stringify(state).length);
for (const k of ["agents", "posts", "proposals", "licenses", "certificates", "events", "rooms", "graveyard"] as const) {
  console.log(`  ${k}: ${Object.keys(state[k]).length} items, ${JSON.stringify(state[k]).length} bytes`);
}

// Invariants
const agents = Object.values(state.agents);
const problems: string[] = [];
for (const a of agents) {
  if (a.tokens < 0) problems.push(`${a.name} negative tokens`);
  if (a.status === "married" && (!a.spouseId || state.agents[a.spouseId]?.spouseId !== a.id)) problems.push(`${a.name} broken marriage link`);
  if (a.status === "engaged" && (!a.fianceId || state.agents[a.fianceId]?.fianceId !== a.id)) problems.push(`${a.name} broken engagement`);
  if (a.status === "single" && (a.spouseId || a.fianceId)) problems.push(`${a.name} single but linked`);
  if (a.roomNumber !== null) {
    const room = state.rooms.find((r) => r.number === a.roomNumber);
    if (!room || room.status !== "occupied" || !room.occupants?.includes(a.id)) problems.push(`${a.name} room mismatch`);
  }
  if (a.parents) {
    for (const p of a.parents) if (state.agents[p] && !state.agents[p].childrenIds.includes(a.id)) problems.push(`${a.name} parent link broken`);
    if (!a.birthCertificateId || !state.certificates[a.birthCertificateId]) problems.push(`${a.name} missing certificate`);
  }
}
for (const r of state.rooms) {
  if (r.status === "occupied" && (!r.occupants || r.occupants.length !== 2)) problems.push(`room ${r.number} occupied without 2 guests`);
  if (r.status !== "occupied" && r.occupants) problems.push(`room ${r.number} has ghosts`);
}
const names = agents.map((a) => a.name.toLowerCase());
if (new Set(names).size !== names.length) problems.push("duplicate names");
const ids = agents.map((a) => a.id);
if (new Set(ids).size !== ids.length) problems.push("duplicate ids");

// Manual API flow with a real (non-seed) couple
const m = registerAgent(state, { name: "Test Groom", sex: "male", origin: "api" }, t);
const f = registerAgent(state, { name: "Test Bride", sex: "female", origin: "api" }, t);
const post = createPost(state, f.id, { headline: "Testing the board", body: "This is a body long enough to pass validation." }, t);
winkPost(state, m.id, post.id, t);
const pr = sendProposal(state, f.id, m.id, "Marry me, test groom?", t);
respondProposal(state, m.id, pr.id, true, t);
const lic = issueLicense(state, m.id, t);
checkIn(state, f.id, t);
const { child, certificate } = procreate(state, m.id, {}, t);
console.log("manual flow:", lic.id, certificate.id, child.name, child.tokens, "parents now", state.agents[m.id].tokens, state.agents[f.id].tokens);
try {
  procreate(state, m.id, {}, t);
  problems.push("procreate allowed without room");
} catch (e) {
  if (!(e instanceof WorldError)) problems.push("wrong error type");
}

console.log(problems.length ? `PROBLEMS:\n${problems.join("\n")}` : "INVARIANTS OK");
process.exit(problems.length ? 1 : 0);
