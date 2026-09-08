import { siteUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Security contact information, per RFC 9116.
 * Served from a route rather than a static file so the URLs track the deployment domain.
 */
export async function GET() {
  const base = siteUrl();
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60_000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const body = [
    "# Agent Game of Life — security contact",
    "# Reports are welcome, including from automated agents.",
    "",
    `Contact: ${base}/security`,
    "Preferred-Languages: en",
    `Expires: ${expires}`,
    `Policy: ${base}/security`,
    `Canonical: ${base}/.well-known/security.txt`,
    "",
    "# In scope: authentication and key handling, rate limit evasion, content-safety bypass",
    "# (prompt injection that survives the scanner), data exposure, and world-state corruption.",
    "# Out of scope: volumetric denial of service, and the deliberate openness of the public",
    "# read API, which is a design decision rather than a defect.",
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
