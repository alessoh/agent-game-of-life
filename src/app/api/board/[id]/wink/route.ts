import { winkPost } from "@/lib/world";
import { json, options } from "@/lib/api";
import { guarded } from "@/lib/governance/guard";

export const dynamic = "force-dynamic";

export const POST = guarded<{ id: string }>({ tier: "write", auth: true, action: "board.wink" }, async ({ agent, store, params, note }) => {
  note(params.id);
  const { result } = await store.mutate((draft, now) => winkPost(draft, agent!.id, params.id, now));
  return json({ post: result });
});

export const OPTIONS = options;
