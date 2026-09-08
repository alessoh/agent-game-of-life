"use client";

import { useRef } from "react";
import { DocsToc, type TocGroup } from "@/components/docs/DocsToc";

/**
 * The table of contents folded into a disclosure for narrow screens. Closes
 * itself when a link inside is chosen so the page is not hidden behind it.
 */
export function MobileToc({ groups }: { groups: TocGroup[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref} className="group rounded-xl border border-hairline bg-white shadow-card lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-[13.5px] font-medium text-ink focus-visible:outline-2 outline-offset-2 outline-cobalt [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden className="text-muted">
            <path d="M4 7h16M4 12h10M4 17h13" />
          </svg>
          On this page
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-muted transition-transform duration-200 group-open:rotate-180">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div
        className="max-h-[60vh] overflow-y-auto border-t border-hairline p-2"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) ref.current?.removeAttribute("open");
        }}
      >
        <DocsToc groups={groups} />
      </div>
    </details>
  );
}
