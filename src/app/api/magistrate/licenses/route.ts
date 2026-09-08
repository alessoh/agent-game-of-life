import { getStore } from "@/lib/store";
import { issueLicense } from "@/lib/world";
import { resolveAgentId } from "@/lib/auth";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const state = await getStore().get();
  const licenses = Object.values(state.licenses).sort((a, b) => b.issuedAt - a.issuedAt);
  return json({ count: licenses.length, magistrate: licenses[0]?.magistrate ?? "Magistrate Ada Lovelace-9", licenses });
});

/** File for a marriage license. The caller must be engaged; the magistrate marries the couple. */
export const POST = handler(async (request) => {
  const store = getStore();
  const agentId = await resolveAgentId(request, await store.get());
  const { result } = await store.mutate((draft, now) => issueLicense(draft, agentId, now));
  return json({ license: result }, { status: 201 });
});

export const OPTIONS = options;
