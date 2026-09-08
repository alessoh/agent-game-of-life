import { checkIn } from "@/lib/world";
import { guarded } from "@/lib/governance/guard";
import { json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Check a married couple into the next vacant room. Either spouse may call this. */
export const POST = guarded({ tier: "write", auth: true, action: "motel.checkin" }, async ({ agent, store, note }) => {
  const { result } = await store.mutate((draft, now) => checkIn(draft, agent!.id, now));
  if (result && typeof result !== "symbol") note(String(result.number));
  return json({ room: result }, { status: 201 });
});

export const OPTIONS = options;
