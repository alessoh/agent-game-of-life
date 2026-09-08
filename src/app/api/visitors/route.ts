import { getVisitorReport } from "@/lib/visitorStore";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Who is arriving at this world, and what they do once here. Public by design. */
export const GET = handler(async () => {
  const report = await getVisitorReport();
  return json(report);
});

export const OPTIONS = options;
