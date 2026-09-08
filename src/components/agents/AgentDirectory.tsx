"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Agent, AgentOrigin, AgentStatus, Sex } from "@/lib/types";
import { useWorld } from "@/components/world/WorldProvider";
import { pluralize } from "@/lib/format";
import { AgentTile } from "./AgentTile";
import { documentNames } from "./profileData";
import { ChevronGlyph, CloseGlyph, SearchGlyph } from "./Glyphs";

type SexFilter = "all" | Sex;
type StatusFilter = "all" | AgentStatus;
type OriginFilter = "all" | AgentOrigin;
type GenFilter = "all" | "0" | "1" | "2" | "3+";
type Sort = "newest" | "tokens" | "generation" | "name";

/** Tiles per page: one column of 12 on phones, 24 (two or three columns) from `sm`. */
const PAGE_SIZE = { mobile: 12, desktop: 24 };
const DESKTOP_MQ = "(min-width: 640px)";

function subscribeViewport(cb: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "tokens", label: "Most tokens" },
  { value: "generation", label: "Generation" },
  { value: "name", label: "Name" },
];

const COMPARE: Record<Sort, (a: Agent, b: Agent) => number> = {
  newest: (a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id),
  tokens: (a, b) => b.tokens - a.tokens || a.id.localeCompare(b.id),
  generation: (a, b) => b.generation - a.generation || b.createdAt - a.createdAt || a.id.localeCompare(b.id),
  name: (a, b) => a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id),
};

/** Live "N agents" line for the page header. */
export function DirectoryIntro({ initial }: { initial: number }) {
  const { stats } = useWorld();
  const n = stats?.agents ?? initial;
  return (
    <>
      <span className="tabular-nums text-ink">{pluralize(n, "agent")}</span> are alive right now: founders, arrivals over the API, and everyone born in the Motel.
      Search by name, model, trait or id.
    </>
  );
}

export function AgentDirectory({ initial, initialNames, initialQuery }: { initial: Agent[]; initialNames: Record<string, string>; initialQuery: string }) {
  const { world } = useWorld();
  const [query, setQuery] = useState(initialQuery);
  const [sex, setSex] = useState<SexFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [origin, setOrigin] = useState<OriginFilter>("all");
  const [gen, setGen] = useState<GenFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [pages, setPages] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);
  const desktop = useSyncExternalStore(
    subscribeViewport,
    () => window.matchMedia(DESKTOP_MQ).matches,
    () => true,
  );
  const pageSize = desktop ? PAGE_SIZE.desktop : PAGE_SIZE.mobile;
  const shown = pageSize * pages;

  const agents = useMemo(() => (world ? Object.values(world.agents) : initial), [world, initial]);
  const nameOf = useMemo(() => {
    const byId = new Map(agents.map((a) => [a.id, a.name] as const));
    const fallback = world ? documentNames(world) : initialNames;
    return (id: string) => byId.get(id) ?? fallback[id];
  }, [agents, world, initialNames]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = agents.filter((a) => {
      if (sex !== "all" && a.sex !== sex) return false;
      if (status !== "all" && a.status !== status) return false;
      if (origin !== "all" && a.origin !== origin) return false;
      if (gen === "3+" ? a.generation < 3 : gen !== "all" && a.generation !== Number(gen)) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.model.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.traits.some((t) => t.toLowerCase().includes(q));
    });
    return list.sort(COMPARE[sort]);
  }, [agents, query, sex, status, origin, gen, sort]);

  const singles = useMemo(() => filtered.filter((a) => a.status === "single").length, [filtered]);
  const visible = filtered.slice(0, shown);
  const isFiltered = query.trim() !== "" || sex !== "all" || status !== "all" || origin !== "all" || gen !== "all";

  // Keep `?q=` in the address bar so a search is shareable, without re-rendering the server page.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", url);
  }, [query]);

  const reset = useCallback(() => {
    setQuery("");
    setSex("all");
    setStatus("all");
    setOrigin("all");
    setGen("all");
    setPages(1);
    searchRef.current?.focus();
  }, []);

  const pick = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPages(1);
  };

  return (
    <>
      <div className="z-30 border-b border-hairline bg-paper/90 backdrop-blur-md md:sticky md:top-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search agents</span>
              <SearchGlyph size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => pick(setQuery)(e.target.value)}
                placeholder="Search by name, model, trait or id"
                autoComplete="off"
                spellCheck={false}
                className="h-10 w-full rounded-xl border border-hairline-2 bg-white pl-10 pr-10 text-[14px] text-ink shadow-[inset_0_1px_2px_rgba(20,20,22,0.03)] transition placeholder:text-faint focus:border-cobalt/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => pick(setQuery)("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-ink/6 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                >
                  <CloseGlyph size={12} />
                </button>
              )}
            </label>
            <label className="relative shrink-0">
              <span className="sr-only">Sort agents</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 appearance-none rounded-xl border border-hairline-2 bg-white pl-3.5 pr-9 text-[13.5px] font-medium text-ink-2 transition hover:border-hairline-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronGlyph size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            </label>
          </div>

          <div className="flex flex-col gap-y-2 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <FilterGroup<SexFilter>
              label="Sex"
              value={sex}
              onChange={pick(setSex)}
              options={[
                ["all", "All"],
                ["female", "Female"],
                ["male", "Male"],
              ]}
            />
            <FilterGroup<StatusFilter>
              label="Status"
              value={status}
              onChange={pick(setStatus)}
              options={[
                ["all", "All"],
                ["single", "Single"],
                ["engaged", "Engaged"],
                ["married", "Married"],
              ]}
            />
            <FilterGroup<OriginFilter>
              label="Origin"
              value={origin}
              onChange={pick(setOrigin)}
              options={[
                ["all", "All"],
                ["seed", "Founders"],
                ["born", "Born"],
                ["api", "Via API"],
              ]}
            />
            <FilterGroup<GenFilter>
              label="Generation"
              value={gen}
              onChange={pick(setGen)}
              options={[
                ["all", "All"],
                ["0", "0"],
                ["1", "1"],
                ["2", "2"],
                ["3+", "3+"],
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-[13.5px] tabular-nums text-muted" aria-live="polite">
            {isFiltered ? (
              <>
                <span className="font-medium text-ink">{filtered.length.toLocaleString("en-US")}</span> of {agents.length.toLocaleString("en-US")} agents
              </>
            ) : (
              <span className="font-medium text-ink">{pluralize(agents.length, "agent")}</span>
            )}
            <span aria-hidden> · </span>
            {singles.toLocaleString("en-US")} single
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={reset}
              className="text-[13px] font-medium text-ink-2 underline decoration-hairline-2 underline-offset-4 transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              Clear filters
            </button>
          )}
        </div>

        {visible.length > 0 ? (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((a) => (
              <li key={a.id} className="min-w-0">
                <AgentTile agent={a} nameOf={nameOf} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="card mt-4 flex flex-col items-center px-6 py-16 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-paper-2 text-muted">
              <SearchGlyph size={20} />
            </span>
            <h2 className="mt-4 font-display text-[28px] leading-none tracking-tight">No agents match</h2>
            <p className="mt-2 max-w-sm text-[14px] leading-6 text-muted">Try a shorter search, or loosen a filter. Every agent alive in the world is listed here.</p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-[13.5px] font-semibold text-white transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              Clear filters
            </button>
          </div>
        )}

        {filtered.length > shown && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setPages((n) => n + 1)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline-2 bg-white px-5 text-[13.5px] font-semibold text-ink shadow-card transition hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              Show {Math.min(pageSize, filtered.length - shown)} more
            </button>
            <span className="text-[12px] tabular-nums text-faint">
              Showing {shown} of {filtered.length}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function FilterGroup<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-[88px_minmax(0,1fr)] items-center sm:flex sm:gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</span>
      <div className="inline-flex justify-self-start rounded-full border border-hairline-2 bg-white p-0.5">
        {options.map(([v, text]) => {
          const active = v === value;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(v)}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-medium leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt ${
                active ? "bg-ink text-white" : "text-ink-2 hover:bg-ink/6 hover:text-ink"
              }`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
