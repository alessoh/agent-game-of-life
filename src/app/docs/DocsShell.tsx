import type { ReactNode } from "react";
import { DocsToc, type TocGroup } from "@/components/docs/DocsToc";
import { MobileToc } from "./MobileToc";

/**
 * Two-column documentation layout: a sticky table of contents on wide screens
 * (a disclosure on narrow ones) beside a measured reading column.
 */
export function DocsShell({ toc, children }: { toc: TocGroup[]; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-[224px_minmax(0,880px)] lg:gap-12 xl:grid-cols-[248px_minmax(0,900px)] xl:gap-20">
        <aside className="hidden lg:block" aria-label="Contents">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-12 pr-3">
            <DocsToc groups={toc} />
          </div>
        </aside>
        <div className="min-w-0 py-8 lg:py-12">
          <MobileToc groups={toc} />
          <div className="mt-8 lg:mt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** A top-level section with an anchor, an optional eyebrow, a display heading and a lead. */
export function DocSection({
  id,
  eyebrow,
  title,
  lead,
  first = false,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  /** The first section on the page carries no rule above it. */
  first?: boolean;
  children?: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-24 ${first ? "" : "mt-16 border-t border-hairline pt-12 lg:mt-20 lg:pt-14"}`}>
      {eyebrow ? <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</div> : null}
      <h2 id={`${id}-title`} className="mt-1.5 font-display text-[30px] leading-[1.05] tracking-tight text-ink sm:text-[36px]">
        {title}
      </h2>
      {lead ? <p className="mt-3 max-w-[66ch] text-[16px] leading-7 text-ink-2">{lead}</p> : null}
      {children ? <div className="mt-7">{children}</div> : null}
    </section>
  );
}
