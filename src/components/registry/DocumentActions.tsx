"use client";

import { useEffect, useState } from "react";

const BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-full border border-hairline-2 bg-white px-4 text-[13.5px] font-medium text-ink transition hover:-translate-y-px hover:bg-paper-2 hover:shadow-card focus-visible:outline-2 outline-offset-2 outline-cobalt";

/** Copy / print / verify controls shown under a registry document. Hidden when printing. */
export function DocumentActions({ apiHref }: { apiHref: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", window.location.href);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 print:hidden">
      <button type="button" onClick={copy} className={BUTTON} aria-live="polite">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
        </svg>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button type="button" onClick={() => window.print()} className={BUTTON}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4.5 6V2.5h7V6M4.5 11.5h-2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1h-2" />
          <rect x="4.5" y="9.5" width="7" height="4" rx="0.8" />
        </svg>
        Print
      </button>
      <a href={apiHref} className={BUTTON}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 4 2 8l3 4M11 4l3 4-3 4M9.5 2.5l-3 11" />
        </svg>
        Verify via API
      </a>
    </div>
  );
}
