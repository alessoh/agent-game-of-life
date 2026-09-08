"use client";

import { useEffect, useState } from "react";
import { CheckGlyph, CopyGlyph } from "./Glyphs";

/** Copies `text` to the clipboard; shows a check for a moment afterwards. */
export function CopyButton({
  text,
  label = "Copy",
  className = "",
  size = "sm",
  tone = "light",
}: {
  text: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
  /** `dark` for use on ink backgrounds. */
  tone?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  const dims = size === "md" ? "h-9 px-3.5 text-[13px]" : "h-7 px-2.5 text-[12px]";
  const rest =
    tone === "dark"
      ? copied
        ? "border-verdant/40 bg-verdant/20 text-white"
        : "border-white/15 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/15 hover:text-white"
      : copied
        ? "border-verdant/25 bg-verdant-soft text-verdant"
        : "border-hairline-2 bg-white text-ink-2 hover:border-ink/30 hover:text-ink";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium transition focus-visible:outline-2 outline-offset-2 ${tone === "dark" ? "outline-white" : "outline-cobalt"} ${dims} ${rest} ${className}`}
    >
      {copied ? <CheckGlyph size={13} /> : <CopyGlyph size={13} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
