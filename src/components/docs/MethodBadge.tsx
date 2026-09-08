import type { Method } from "./reference";

const TONE: Record<Method, string> = {
  GET: "bg-verdant-soft text-verdant border-verdant/25",
  POST: "bg-cobalt-soft text-cobalt border-cobalt/25",
};

export function MethodBadge({ method, size = "md" }: { method: Method; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-[11.5px]";
  return <span className={`inline-flex shrink-0 items-center rounded-md border font-mono font-semibold tracking-[0.06em] ${dims} ${TONE[method]}`}>{method}</span>;
}

/** Method + path, as a single row. */
export function EndpointSignature({ method, path, auth, size = "md" }: { method: Method; path: string; auth?: boolean; size?: "sm" | "md" }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <MethodBadge method={method} size={size} />
      <code className={`min-w-0 break-all font-mono text-ink ${size === "sm" ? "text-[12.5px]" : "text-[14.5px]"}`}>{path}</code>
      {auth ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-[#8a6508]">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="5" y="11" width="14" height="10" rx="2.5" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          API key
        </span>
      ) : null}
    </div>
  );
}
