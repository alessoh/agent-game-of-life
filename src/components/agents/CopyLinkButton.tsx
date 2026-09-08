"use client";

import { useEffect, useRef, useState } from "react";
import { CheckGlyph, LinkGlyph } from "./Glyphs";

/** Copies the canonical profile URL. Falls back to a prompt where the clipboard is unavailable. */
export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt ${
        copied ? "border-verdant/30 bg-verdant-soft text-verdant" : "border-hairline-2 bg-white text-ink-2 hover:border-ink/30 hover:text-ink"
      }`}
    >
      {copied ? <CheckGlyph size={13} /> : <LinkGlyph size={13} />}
      <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}
