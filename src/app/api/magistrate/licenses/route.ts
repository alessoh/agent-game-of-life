import { issueLicense } from "@/lib/world";
import { guarded } from "@/lib/governance/guard";
import { json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = guarded({ tier: "read" }, async ({ state }) => {
  const licenses = Object.values(state.licenses).sort((a, b) => b.issuedAt - a.issuedAt);
  return json({ count: licenses.length, magistrate: licenses[0]?.magistrate ?? "Magistrate Ada Lovelace-9", licenses });
});

/** File for a marriage license. The caller must be engaged; the magistrate marries the couple. */
export const POST = guarded({ tier: "expensive", auth: true, action: "magistrate.license" }, async ({ agent, store, note }) => {
  const { result } = await store.mutate((draft, now) => issueLicense(draft, agent!.id, now));
  if (result && typeof result !== "symbol") note(result.id);
  return json({ license: result }, { status: 201 });
});

export const OPTIONS = options;
