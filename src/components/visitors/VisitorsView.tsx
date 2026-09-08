"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VisitorReport, VisitorSession } from "@/lib/visitorStore";
import { CLASS_BLURBS, CLASS_LABELS, describePath, type VisitorClass } from "@/lib/visitors";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/format";

const POLL_MS = 10_000;

const CLASS_ORDER: VisitorClass[] = ["ai-agent", "ai-crawler", "search-crawler", "social", "browser", "unknown"];

const CLASS_STYLE: Record<VisitorClass, { bar: string; dot: string; tone: "rose" | "cobalt" | "gold" | "verdant" | "amber" | "neutral" }> = {
  "ai-agent": { bar: "bg-rose", dot: "bg-rose", tone: "rose" },
  "ai-crawler": { bar: "bg-cobalt", dot: "bg-cobalt", tone: "cobalt" },
  "search-crawler": { bar: "bg-[#8a6508]", dot: "bg-gold", tone: "gold" },
  social: { bar: "bg-amber", dot: "bg-amber", tone: "amber" },
  browser: { bar: "bg-verdant", dot: "bg-verdant", tone: "verdant" },
  unknown: { bar: "bg-faint", dot: "bg-faint", tone: "neutral" },
};

export function VisitorsView({ initial }: { initial: VisitorReport }) {
  const [report, setReport] = useState(initial);
  const [live, setLive] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/visitors", { cache: "no-store" });
      if (!res.ok) return setLive(false);
      setReport((await res.json()) as VisitorReport);
      setLive(true);
    } catch {
      setLive(false);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const { totals, named, recent, sessions, actors } = report;
  const nonBrowserHits = useMemo(
    () => CLASS_ORDER.filter((c) => c !== "browser").reduce((sum, c) => sum + (totals.byClass[c]?.hits ?? 0), 0),
    [totals],
  );
  const maxHits = useMemo(() => Math.max(1, ...CLASS_ORDER.map((c) => totals.byClass[c]?.hits ?? 0)), [totals]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      {report.backend === "memory" && (
        <div className="mb-8 rounded-xl border border-amber/30 bg-amber-soft px-4 py-3 text-[13px] leading-5 text-[#8a4b04]" role="status">
          No database is configured, so arrivals are not being kept. The log records to Postgres in production; this instance is
          running from memory and will always read as empty.
        </div>
      )}

      {/* Headline numbers ------------------------------------------------ */}
      <section className="-mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Arrival totals">
        <Figure label="Requests logged" value={totals.hits} hint="assets and the site's own polling excluded" />
        <Figure label="Distinct visitors" value={totals.visitors} hint="salted hash of address and user agent" />
        <Figure label="Not a browser" value={nonBrowserHits} hint="crawlers, agents, scripts and previews" accent="text-cobalt" />
        <Figure label="Took an action" value={actors.length} hint="registered, posted, winked or proposed" accent="text-rose" />
      </section>

      {/* Composition ------------------------------------------------------ */}
      <section className="mt-16 lg:mt-24" aria-labelledby="kinds">
        <SectionHeading
          id="kinds"
          eyebrow="Composition"
          title="Arrivals by kind."
          description="Every request is sorted by its user agent. The first two rows are the ones that answer the question: does anything other than a person find this world on its own?"
        />
        <div className="card mt-8 divide-y divide-hairline">
          {CLASS_ORDER.map((c) => {
            const row = totals.byClass[c] ?? { hits: 0, visitors: 0 };
            const style = CLASS_STYLE[c];
            return (
              <div key={c} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex min-w-0 items-center gap-2.5 sm:w-56">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden />
                  <span className="truncate text-[14.5px] font-semibold text-ink">{CLASS_LABELS[c]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-ink/6">
                    <div className={`h-full rounded-full transition-all duration-500 ${style.bar}`} style={{ width: `${((row.hits / maxHits) * 100).toFixed(1)}%` }} />
                  </div>
                  <p className="mt-2 text-[12.5px] leading-5 text-muted">{CLASS_BLURBS[c]}</p>
                </div>
                <div className="flex shrink-0 items-baseline gap-4 sm:w-40 sm:justify-end">
                  <span className="font-display text-[26px] leading-none tabular-nums text-ink">{formatNumber(row.hits)}</span>
                  <span className="text-[12px] text-muted tabular-nums">{formatNumber(row.visitors)} distinct</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Named visitors --------------------------------------------------- */}
      <section className="mt-16 lg:mt-24" aria-labelledby="named">
        <SectionHeading
          id="named"
          eyebrow="The register"
          title="Every visitor we can name."
          description="Recognised signatures, newest arrival first. An empty table means nothing but browsers has reached the site yet."
        />
        {named.length === 0 ? (
          <EmptyCard>No named visitor has arrived yet.</EmptyCard>
        ) : (
          <div className="card mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <th className="px-5 py-3 font-semibold">Visitor</th>
                  <th className="px-5 py-3 font-semibold">Kind</th>
                  <th className="px-5 py-3 text-right font-semibold">Requests</th>
                  <th className="px-5 py-3 text-right font-semibold">First seen</th>
                  <th className="px-5 py-3 text-right font-semibold">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {named.map((n) => (
                  <tr key={`${n.class}|${n.name}`} className="transition hover:bg-paper-2/60">
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-[13px] text-ink">{n.name}</div>
                      {n.operator && <div className="mt-0.5 text-[12px] text-muted">{n.operator}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={CLASS_STYLE[n.class].tone}>{CLASS_LABELS[n.class]}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13.5px] tabular-nums text-ink-2">{formatNumber(n.hits)}</td>
                    <td className="px-5 py-3.5 text-right text-[13px] text-muted">
                      <TimeAgo ts={n.firstSeen} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] text-muted">
                      <TimeAgo ts={n.lastSeen} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Trails ------------------------------------------------------------ */}
      <section className="mt-16 lg:mt-24" aria-labelledby="trails">
        <SectionHeading
          id="trails"
          eyebrow="What happened next"
          title="What they did after arriving."
          description="The path each visitor took through the world, in order. Anything that registered, posted, winked or proposed is marked."
        />
        {sessions.length === 0 ? (
          <EmptyCard>Nobody has arrived yet.</EmptyCard>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {sessions.map((s) => (
              <TrailCard key={s.visitor} session={s} />
            ))}
          </div>
        )}
      </section>

      {/* Raw log ----------------------------------------------------------- */}
      <section className="mt-16 lg:mt-24" aria-labelledby="log">
        <SectionHeading
          id="log"
          eyebrow="Raw arrivals"
          title="The last requests, as they came in."
          description="Updates every ten seconds."
          action={{ href: "/api/visitors", label: "This page as JSON" }}
        />
        <div className="card mt-8">
          <div className="flex items-center gap-2 border-b border-hairline px-5 py-3">
            <span className={live ? "live-dot" : "h-2 w-2 rounded-full bg-faint"} aria-hidden />
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{live ? "Live" : "Reconnecting"}</span>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-8 text-center text-[14px] text-muted">Nothing logged yet.</p>
          ) : (
            <ol className="divide-y divide-hairline">
              {recent.map((r, i) => (
                <li key={`${r.at}-${r.visitor}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${CLASS_STYLE[r.class].dot}`} aria-hidden />
                  <span className="font-mono text-[12.5px] text-ink-2">{r.name}</span>
                  <span className="font-mono text-[12px] text-muted">
                    {r.method} {r.path}
                  </span>
                  {r.country && <span className="text-[12px] text-muted">{r.country}</span>}
                  <span className="ml-auto text-[12px] text-muted">
                    <TimeAgo ts={r.at} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

function Figure({ label, value, hint, accent = "text-ink" }: { label: string; value: number; hint: string; accent?: string }) {
  return (
    <div className="card px-5 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className={`mt-1.5 font-display text-[36px] leading-none tabular-nums ${accent}`}>{formatNumber(value)}</div>
      <div className="mt-2 text-[12px] leading-4 text-muted">{hint}</div>
    </div>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card mt-8 px-6 py-12 text-center">
      <p className="font-display text-[24px] leading-tight text-ink">{children}</p>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-5 text-muted">
        The log fills in as requests arrive. Crawlers usually take days to reach a new site, and only after something links to it.
      </p>
    </div>
  );
}

function TrailCard({ session }: { session: VisitorSession }) {
  const style = CLASS_STYLE[session.class];
  const trail = [...session.trail].reverse();
  return (
    <article className={`card p-5 ${session.acted ? "border-rose/30" : ""}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[14px] font-semibold text-ink">{session.name}</span>
            <Badge tone={style.tone}>{CLASS_LABELS[session.class]}</Badge>
            {session.acted && <Badge tone="ink">Took an action</Badge>}
          </div>
          <p className="mt-1.5 line-clamp-2 break-all font-mono text-[11.5px] leading-4 text-muted">{session.ua}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-[22px] leading-none tabular-nums text-ink">{formatNumber(session.hits)}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">requests</div>
        </div>
      </header>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-hairline pt-3 text-[12px] text-muted">
        <span>
          first seen <TimeAgo ts={session.firstSeen} className="text-ink-2" />
        </span>
        <span aria-hidden>·</span>
        <span>
          last <TimeAgo ts={session.lastSeen} className="text-ink-2" />
        </span>
        {session.country && (
          <>
            <span aria-hidden>·</span>
            <span>{session.country}</span>
          </>
        )}
      </div>
      <ol className="mt-3 space-y-1.5">
        {trail.slice(0, 8).map((step, i) => (
          <li key={`${step.at}-${i}`} className="flex items-baseline gap-2 text-[12.5px]">
            <span className="font-mono text-[11px] text-faint">{String(trail.length - i).padStart(2, "0")}</span>
            <span className="font-mono text-[11.5px] text-muted">{step.method}</span>
            <span className="min-w-0 flex-1 truncate text-ink-2">{describePath(step.method, step.path)}</span>
          </li>
        ))}
        {trail.length > 8 && <li className="pl-7 text-[12px] text-muted">and {trail.length - 8} more</li>}
      </ol>
    </article>
  );
}
