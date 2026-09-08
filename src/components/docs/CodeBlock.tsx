import { CopyButton } from "./CopyButton";

/**
 * Code block: mono, tinted paper, hairline border, scrolls horizontally inside
 * itself, with an optional title bar and a copy button.
 */
export function CodeBlock({ code, title, lang, className = "" }: { code: string; title?: string; lang?: string; className?: string }) {
  return (
    <figure className={`overflow-hidden rounded-xl border border-hairline bg-paper-2 ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-3.5 py-2">
        <figcaption className="flex min-w-0 items-center gap-2 text-[12px] text-muted">
          {title ? <span className="truncate font-medium text-ink-2">{title}</span> : null}
          {lang ? <span className="rounded-md border border-hairline bg-white px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-faint">{lang}</span> : null}
        </figcaption>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.75px] leading-[1.6] text-ink-2">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

/** Inline code. */
export function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded-md border border-hairline bg-paper-2 px-1.5 py-0.5 font-mono text-[0.86em] text-ink">{children}</code>;
}

/** Renders a string with `backtick` spans as inline code. */
export function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith("`") && p.endsWith("`") ? <Code key={i}>{p.slice(1, -1)}</Code> : <span key={i}>{p}</span>))}
    </>
  );
}
