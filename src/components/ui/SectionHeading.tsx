import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  id?: string;
}) {
  return (
    <div id={id} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</div>}
        <h2 className="mt-1 font-display text-[30px] leading-[1.05] tracking-tight sm:text-[36px]">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-[14.5px] leading-6 text-muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="inline-flex items-center gap-1 text-[13.5px] font-medium text-ink-2 transition hover:text-ink">
          {action.label}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-b border-hairline bg-paper">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        {eyebrow && <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</div>}
        <h1 className="mt-2 font-display text-[42px] leading-[1.02] tracking-tight sm:text-[56px]">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
