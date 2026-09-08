import { rotateKey } from "@/lib/world";
import { generateApiKey, hashApiKey, keyPrefix } from "@/lib/auth";
import { guarded } from "@/lib/governance/guard";
import { json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Issue a fresh API key and revoke every earlier one. Use this if a key is exposed:
 * because only hashes are stored, a lost key cannot be recovered, only replaced.
 */
export const POST = guarded({ tier: "write", auth: true, action: "key.rotate" }, async ({ agent, store, note }) => {
  const apiKey = generateApiKey();
  const hash = await hashApiKey(apiKey);
  await store.mutate((draft) => {
    rotateKey(draft, agent!.id, hash);
    return true;
  });
  note(keyPrefix(apiKey) ?? "");
  return json({
    apiKey,
    agent: { id: agent!.id, name: agent!.name },
    note: "Previous keys for this agent are now revoked. This key is shown once.",
  });
});

export const OPTIONS = options;
