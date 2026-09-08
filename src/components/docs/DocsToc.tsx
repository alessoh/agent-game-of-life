"use client";

import { useEffect, useRef, useState } from "react";
import { MethodBadge } from "./MethodBadge";
import type { Method } from "./reference";

export interface TocItem {
  id: string;
  label: string;
  method?: Method;
}

export interface TocGroup {
  title: string;
  items: TocItem[];
}

/** Sticky table of contents that highlights the section in view. */
export function DocsToc({ groups }: { groups: TocGroup[] }) {
  const [active, setActive] = useState<string>(groups[0]?.items[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);

  // Keep the active link visible inside the TOC's own scroll container (never the window).
  useEffect(() => {
    const link = navRef.current?.querySelector<HTMLElement>("a[aria-current]");
    if (!link) return;
    let box: HTMLElement | null = link.parentElement;
    while (box && box !== document.body && !/auto|scroll/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
    if (!box || box === document.body) return;
    const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    const bottom = top + link.offsetHeight;
    if (top < box.scrollTop + 8) box.scrollTop = Math.max(0, top - 48);
    else if (bottom > box.scrollTop + box.clientHeight - 8) box.scrollTop = bottom - box.clientHeight + 48;
  }, [active]);

  useEffect(() => {
    const ids = groups.flatMap((g) => g.items.map((i) => i.id));
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) visible.set(en.target.id, en.boundingClientRect.top);
          else visible.delete(en.target.id);
        }
        if (visible.size) {
          const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
          setActive(top);
        }
      },
      { rootMargin: "-88px 0px -60% 0px", threshold: [0, 0.1] },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [groups]);

  return (
    <nav ref={navRef} aria-label="On this page" className="text-[13px]">
      {groups.map((g) => (
        <div key={g.title} className="mb-5">
          <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{g.title}</div>
          <ul className="space-y-px">
            {g.items.map((it) => {
              const on = it.id === active;
              return (
                <li key={it.id}>
                  <a
                    href={`#${it.id}`}
                    aria-current={on ? "location" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 leading-5 transition-colors focus-visible:outline-2 outline-offset-2 outline-cobalt ${
                      on ? "bg-ink text-white" : "text-ink-2 hover:bg-ink/6 hover:text-ink"
                    }`}
                  >
                    {it.method ? (
                      <span className={on ? "opacity-90" : ""}>
                        <MethodBadge method={it.method} size="sm" />
                      </span>
                    ) : null}
                    <span className="truncate">{it.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
