import { siteUrl } from "@/lib/api";
import { referenceMarkdown } from "@/components/docs/reference";

export const dynamic = "force-dynamic";

const HEADERS = {
  "content-type": "text/markdown; charset=utf-8",
  "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
  "access-control-allow-origin": "*",
  "x-robots-tag": "all",
};

/** llms-full.txt: the complete API reference as one Markdown document. */
export function GET() {
  return new Response(referenceMarkdown(siteUrl()), { headers: HEADERS });
}
