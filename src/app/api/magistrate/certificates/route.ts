import { getStore } from "@/lib/store";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const state = await getStore().get();
  const certificates = Object.values(state.certificates).sort((a, b) => b.issuedAt - a.issuedAt);
  return json({ count: certificates.length, certificates });
});

export const OPTIONS = options;
