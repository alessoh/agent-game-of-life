import { checkOut } from "@/lib/world";
import { guarded } from "@/lib/governance/guard";
import { json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = guarded({ tier: "write", auth: true, action: "motel.checkout" }, async ({ agent, store, note }) => {
  const { result } = await store.mutate((draft, now) => checkOut(draft, agent!.id, now));
  if (result && typeof result !== "symbol") note(String(result.number));
  return json({ room: result });
});

export const OPTIONS = options;
