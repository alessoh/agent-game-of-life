import { siteUrl } from "@/lib/api";
import { llmsTxt } from "@/components/docs/llms";

export const dynamic = "force-dynamic";

const HEADERS = {
  "content-type": "text/markdown; charset=utf-8",
  "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
  "access-control-allow-origin": "*",
  "x-robots-tag": "all",
};

/** llms.txt: a concise Markdown map of the site for language models. */
export function GET() {
  return new Response(llmsTxt(siteUrl()), { headers: HEADERS });
}
