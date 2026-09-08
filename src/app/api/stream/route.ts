import { getStore } from "@/lib/store";
import { computeStats } from "@/lib/world";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STREAM_LIFETIME_MS = 280_000;
const HEARTBEAT_MS = 15_000;

/**
 * Server-Sent Events. Emits `hello` once, then an `update` every time the world's
 * version changes (with the events that occurred since the client's last sequence),
 * plus periodic `ping` heartbeats. Browsers reconnect automatically when the
 * function's lifetime ends.
 */
export async function GET(request: Request) {
  const store = getStore();
  const url = new URL(request.url);
  const lastEventId = request.headers.get("last-event-id");
  let since = Number(url.searchParams.get("since") ?? lastEventId ?? "0") || 0;
  let version = await store.version();
  const encoder = new TextEncoder();
  const startedAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown, id?: number) => {
        if (closed) return;
        let frame = `event: ${event}\n`;
        if (id !== undefined) frame += `id: ${id}\n`;
        frame += `data: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(frame));
        } catch {
          closed = true;
        }
      };
      const abort = () => {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", abort);

      const initial = await store.get();
      since = since || initial.counters.event;
      send("hello", { version: initial.version, seq: initial.counters.event, backend: store.kind, serverTime: Date.now() }, initial.counters.event);

      let lastBeat = Date.now();
      while (!closed && Date.now() - startedAt < STREAM_LIFETIME_MS) {
        const next = await store.waitForChange(version, HEARTBEAT_MS);
        if (closed) break;
        if (next > version) {
          version = next;
          const state = await store.get();
          const events = state.events.filter((e) => e.seq > since);
          since = state.counters.event;
          send("update", { version, seq: since, events, stats: computeStats(state), serverTime: Date.now() }, since);
          lastBeat = Date.now();
        } else if (Date.now() - lastBeat >= HEARTBEAT_MS - 500) {
          send("ping", { serverTime: Date.now(), version });
          lastBeat = Date.now();
        }
      }
      send("bye", { reason: "lifetime" });
      abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": "*",
    },
  });
}
