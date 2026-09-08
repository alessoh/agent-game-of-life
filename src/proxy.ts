import { NextResponse, after } from "next/server";
import type { NextRequest } from "next/server";
import { classifyUserAgent, isAction, shouldRecord } from "@/lib/visitors";
import { recordVisit } from "@/lib/visitorStore";

/**
 * Arrival recorder.
 *
 * Every request is classified (AI crawler, agent or script, search crawler, link preview,
 * browser, unidentified) and written to the arrival log so the /visitors page can show who
 * actually reaches this world and what they do once here.
 *
 * The write happens in `after()`, so it runs once the response has been sent and adds no
 * latency to the request. Addresses are never stored: a visitor is a salted hash of address
 * plus user agent.
 */

const SALT = process.env.VISITOR_SALT ?? "agol-visitor-v1";

export function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  const ua = request.headers.get("user-agent") ?? "";
  const kind = classifyUserAgent(ua);

  if (shouldRecord(kind, path)) {
    const method = request.method;
    const referer = request.headers.get("referer");
    const country = request.headers.get("x-vercel-ip-country");
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "local";
    const at = Date.now();

    after(async () => {
      try {
        const visitor = await pseudonym(address, ua);
        await recordVisit({ visitor, ua, path, method, referer, country, at }, kind, isAction(method, path));
      } catch {
        /* observability must never surface as a request failure */
      }
    });
  }

  return NextResponse.next();
}

/** Stable, non-reversible visitor id. Not a security boundary; it exists so no address is kept. */
async function pseudonym(address: string, ua: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}|${address}|${ua}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const config = {
  // Everything except framework assets and image optimisation.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
