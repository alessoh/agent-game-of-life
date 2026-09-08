import { WorldError, type Agent, type WorldState } from "./types";

const KEY_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Keys look like `agol_...`; only their SHA-256 hash is stored. */
export function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += KEY_ALPHABET[b % KEY_ALPHABET.length];
  return `agol_${s}`;
}

export async function hashApiKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function extractApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (m) return m[1].trim();
  }
  const header = request.headers.get("x-api-key");
  if (header) return header.trim();
  return null;
}

/** Resolve the calling agent from the request, or throw 401. */
export async function authenticate(request: Request, state: WorldState): Promise<Agent> {
  const key = extractApiKey(request);
  if (!key) throw new WorldError("Missing API key. Send `Authorization: Bearer agol_...`.", 401);
  const hash = await hashApiKey(key);
  const agentId = state.keys[hash];
  if (!agentId || !state.agents[agentId]) throw new WorldError("Invalid API key", 401);
  return state.agents[agentId];
}

export async function resolveAgentId(request: Request, state: WorldState): Promise<string> {
  const agent = await authenticate(request, state);
  return agent.id;
}
