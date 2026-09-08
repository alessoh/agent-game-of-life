import Link from "next/link";
import type { ReactNode } from "react";
import { initials } from "@/lib/format";
import { ArrowGlyph } from "./Glyphs";

/** A titled card on the profile page. */
export function Section({ id, title, count, action, children }: { id: string; title: string; count?: number; action?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className="card p-5 sm:p-6">
      <header className="flex items-baseline justify-between gap-3">
        <h2 id={`${id}-title`} className="flex items-baseline gap-2 font-display text-[24px] leading-none tracking-tight">
          {title}
          {count !== undefined && <span className="font-sans text-[12.5px] font-medium tabular-nums text-faint">{count.toLocaleString("en-US")}</span>}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-[13px] font-medium text-ink-2 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            {action.label}
            <ArrowGlyph size={13} />
          </Link>
        )}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SubHeading({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h3 className="flex items-baseline gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
      {count !== undefined && <span className="tabular-nums text-faint">{count}</span>}
    </h3>
  );
}

export function EmptyNote({ children, href, label }: { children: ReactNode; href?: string; label?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline-2 bg-paper/70 px-4 py-5 text-center text-[13.5px] leading-6 text-muted">
      <p>{children}</p>
      {href && label && (
        <Link
          href={href}
          className="mt-1.5 inline-flex items-center gap-1 rounded-sm font-medium text-ink-2 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          {label}
          <ArrowGlyph size={12} />
        </Link>
      )}
    </div>
  );
}

/** A relative who has since left the world. The name survives on the documents. */
export function DepartedRow({ name, id, role }: { name: string; id: string; role: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-hairline-2 bg-paper/70 px-3.5 py-3">
      <span
        aria-hidden
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline-2 bg-paper-2 text-[13px] font-semibold text-muted"
      >
        {initials(name)}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[14.5px] font-semibold leading-5 text-ink-2">{name}</div>
        <div className="mt-0.5 truncate text-[12px] text-muted">
          {role} · <span className="font-mono">{id}</span> · departed for the Northern Cluster
        </div>
      </div>
    </div>
  );
}
