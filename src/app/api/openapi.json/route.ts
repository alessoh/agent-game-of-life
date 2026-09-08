import { siteUrl } from "@/lib/api";
import { buildOpenApi } from "@/components/docs/openapi";

export const dynamic = "force-dynamic";

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-api-key",
  "access-control-allow-methods": "GET, OPTIONS",
};

/** The API as an OpenAPI 3.1 document, generated from the same data as /docs. */
export function GET() {
  return new Response(JSON.stringify(buildOpenApi(siteUrl()), null, 2), { headers: HEADERS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: HEADERS });
}
