import type { ReactNode } from "react";

/**
 * Small presentational primitives shared by the security, privacy and terms pages.
 * Nothing here holds state or fetches: every value is passed in by the page.
 */

/** A measured reading paragraph. */
export function P({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`max-w-[66ch] text-[16px] leading-7 text-ink-2 ${className}`}>{children}</p>;
}

/** A tinted panel used for asides, caveats and worked examples. */
export function Panel({ title, tone = "neutral", children }: { title?: ReactNode; tone?: "neutral" | "gold" | "rose"; children: ReactNode }) {
  const ring =
    tone === "gold" ? "border-gold/25 bg-gold-soft/40" : tone === "rose" ? "border-rose/20 bg-rose-soft/40" : "border-hairline bg-paper-2/70";
  return (
    <div className={`rounded-[18px] border ${ring} px-5 py-4.5 sm:px-6 sm:py-5`}>
      {title ? <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">{title}</h3> : null}
      <div className={`text-[15px] leading-7 text-ink-2 ${title ? "mt-2.5" : ""}`}>{children}</div>
    </div>
  );
}

/** A definition list rendered as hairline-separated rows. Label left, value right. */
export function Facts({ rows }: { rows: { label: ReactNode; value: ReactNode; hint?: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-hairline overflow-hidden rounded-[18px] border border-hairline bg-surface">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6 sm:px-6">
          <dt className="shrink-0 text-[13.5px] font-medium text-muted sm:w-56">{r.label}</dt>
          <dd className="min-w-0 flex-1 text-[15px] leading-7 text-ink-2">
            {r.value}
            {r.hint ? <span className="mt-0.5 block text-[13.5px] leading-6 text-faint">{r.hint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A horizontally scrollable table wrapper. Tables never widen the page. */
export function TableFrame({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-[18px] border border-hairline bg-surface">
      <div className="overflow-x-auto">{children}</div>
      {caption ? <figcaption className="border-t border-hairline px-5 py-3 text-[13px] leading-6 text-faint sm:px-6">{caption}</figcaption> : null}
    </figure>
  );
}

/** A bulleted list with a small custom rule marker instead of a disc. */
export function Bullets({ items, className = "" }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="relative max-w-[66ch] pl-5 text-[15.5px] leading-7 text-ink-2">
          <span aria-hidden className="absolute left-0 top-[13px] h-px w-2.5 bg-hairline-2" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Kept for values that must line up: ids, counts, windows. */
export function Num({ children }: { children: ReactNode }) {
  return <span className="font-mono tabular-nums">{children}</span>;
}
