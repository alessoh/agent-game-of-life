"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export const PAGE_SIZE = 10;

export function SearchGlyph({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className} aria-hidden>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </svg>
  );
}

export function CloseGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
    </svg>
  );
}

export function ArrowGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** Search box + result count that sits between a register's heading and its table. */
export function RegisterToolbar({
  label,
  placeholder,
  query,
  onQuery,
  summary,
}: {
  label: string;
  placeholder: string;
  query: string;
  onQuery: (q: string) => void;
  summary: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative w-full sm:max-w-[360px]">
        <span className="sr-only">{label}</span>
        <SearchGlyph className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="h-10 w-full rounded-xl border border-hairline-2 bg-white pl-10 pr-10 text-[14px] text-ink shadow-[inset_0_1px_2px_rgba(20,20,22,0.03)] transition placeholder:text-faint focus:border-cobalt/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-ink/6 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            <CloseGlyph />
          </button>
        )}
      </label>
      <p className="text-[13px] tabular-nums text-muted" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}

export function ShowMore({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  if (remaining <= 0) return null;
  return (
    <div className="flex justify-center border-t border-hairline pt-5">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline-2 bg-white px-4 text-[13.5px] font-medium text-ink transition hover:-translate-y-px hover:bg-paper-2 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
      >
        Show {Math.min(PAGE_SIZE, remaining).toLocaleString("en-US")} more
        <span className="text-muted">· {remaining.toLocaleString("en-US")} remaining</span>
      </button>
    </div>
  );
}

export function EmptyRows({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-hairline-2 px-5 py-8 text-center text-[13.5px] text-muted">{children}</p>;
}

/* Table primitives. On md+ they are a real table; below md each row becomes a labelled card. */
export const TABLE = "w-full border-collapse max-md:block";
export const THEAD = "max-md:hidden";
export const TH = "border-b border-hairline-2 px-3 pb-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted first:pl-1 last:pr-1";
export const TBODY = "max-md:block";
export const TR = "border-b border-hairline transition md:hover:bg-paper-2/60 max-md:grid max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-3.5 max-md:py-4";
export const TD = "align-top md:px-3 md:py-3.5 md:first:pl-1 md:last:pr-1 max-md:block";
export const LABELLED =
  "max-md:before:mb-1 max-md:before:block max-md:before:text-[11px] max-md:before:font-semibold max-md:before:uppercase max-md:before:tracking-[0.14em] max-md:before:text-muted max-md:before:content-[attr(data-label)]";

export function SerialCell({ id, serial, href, fresh }: { id: string; serial: number; href: string; fresh: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div>
        <Link
          href={href}
          className="rounded-sm font-mono text-[12.5px] tracking-wide text-ink underline decoration-hairline-2 underline-offset-4 transition hover:decoration-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          {id}
        </Link>
        <div className="mt-1 text-[11.5px] tabular-nums text-faint">Entry {serial.toLocaleString("en-US")}</div>
      </div>
      {fresh && (
        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-verdant/20 bg-verdant-soft px-1.5 py-px text-[11px] font-semibold uppercase tracking-[0.08em] text-[#17714b]">
          New
        </span>
      )}
    </div>
  );
}

export function SealChip({ seal }: { seal: string }) {
  return <span className="inline-flex rounded-md border border-gold/40 bg-gold-soft/70 px-1.5 py-0.5 font-mono text-[11.5px] tracking-[0.08em] text-[#8a6508]">{seal}</span>;
}

export function DocumentLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-sm text-[13px] font-medium text-ink-2 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
    >
      {label}
      <ArrowGlyph size={13} />
    </Link>
  );
}

export function NameLink({ id, name, present }: { id: string; name: string; present: boolean }) {
  if (!present) return <span className="text-ink-2">{name}</span>;
  return (
    <Link href={`/agents/${id}`} className="rounded-sm text-ink underline decoration-transparent underline-offset-4 transition hover:decoration-hairline-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
      {name}
    </Link>
  );
}

export function matches(query: string, ...fields: (string | number)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => String(f).toLowerCase().includes(q));
}
