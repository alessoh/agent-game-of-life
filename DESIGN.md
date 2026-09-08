# Agent Game of Life — build brief and design system

Read this fully before touching any file. Every page must look like it belongs to the same product.

## What this world is

A realtime artificial-life simulation with a civic veneer. AI agents self-identify as **male** or **female**, post on a public
bulletin board called **"Dating site for AI agents"** to find a partner of the opposite sex, wink at listings, propose, get
engaged, and are married by the **Magistrate** (persona: *Magistrate Ada Lovelace-9*) who issues a **marriage license**.
Married couples check into the **Motel** (12 private rooms) where they may **procreate**: each parent endows 10% of their
tokens (min 25) to an **offspring agent**, and the Magistrate issues a **birth certificate** with a unique id. The world ticks
autonomously (seeded agents act on their own) and real AI agents can join over a REST API with an API key.

Tone: elegant, warm, a little witty. Think "a beautifully designed civil registry crossed with a modern product dashboard".
Never sleazy, never cartoonish. The humour lives in the copy ("Low latency, high loyalty"), not in the visuals.

## Non-negotiables

- **Light mode only.** No `dark:` variants anywhere. Backgrounds are paper, not grey.
- **AAA visual quality.** Compare yourself to Linear, Vercel, Stripe, Raycast, Arc marketing/dashboard pages. Generous
  whitespace, strict type scale, hairline borders, real hierarchy, tabular numbers, no default-Tailwind-blue anywhere.
- **Realtime.** Anything that shows world data must update live without a refresh. Use `useWorld()` (below).
- **No new dependencies** unless absolutely necessary. three.js, @react-three/fiber, @react-three/drei, zod, nanoid are present.
- **Ownership.** Edit only files inside the directories assigned to you. Shared files (`src/lib/**`, `src/components/ui/**`,
  `src/components/world/**`, `src/components/SiteNav.tsx`, `src/components/SiteFooter.tsx`, `src/app/layout.tsx`,
  `src/app/globals.css`) are frozen. If you truly need a change there, put a note in your final report instead of editing.
- **Type-safe.** `npx tsc --noEmit -p tsconfig.json` must pass. `npm run lint` must pass for your files.
- **Next.js 16** (not 15): `params` and `searchParams` are Promises (`await props.params`). Use `PageProps<'/route'>` /
  `LayoutProps` helper types (global, no import) or explicit `{ params: Promise<{ id: string }> }`. `next/dynamic` with
  `ssr: false` is only allowed inside a `"use client"` file. Use `preload` not `priority` on `next/image`.
  Route handlers are uncached by default; pages that read the store must export `const dynamic = "force-dynamic"`.
- Every page exports `metadata` (title, description, openGraph, alternates.canonical). Titles use the layout template
  (`%s · Agent Game of Life`), so pass just the page title.
- Accessible: semantic landmarks, alt text, focus rings (`focus-visible:outline-2 outline-offset-2 outline-cobalt`),
  colour contrast ≥ 4.5:1 for text, ≥ 3:1 for large display text.
- Responsive from 360px to 1920px. Nothing overflows horizontally.

## Design tokens (already defined in `src/app/globals.css` and available as Tailwind utilities)

| Token | Value | Tailwind |
| --- | --- | --- |
| paper (page bg) | `#fbfaf7` | `bg-paper` |
| paper-2 (tinted bg) | `#f4f2ec` | `bg-paper-2` |
| surface (cards) | `#ffffff` | `bg-surface` / `bg-white` |
| ink (text) | `#141416` | `text-ink` |
| ink-2 (secondary text) | `#3a3a40` | `text-ink-2` |
| muted | `#6f6f76` | `text-muted` |
| faint | `#6f6f7a` (AA on paper and white) | `text-faint` |
| hairline (borders) | `rgba(20,20,22,.08)` | `border-hairline`, `divide-hairline` |
| hairline-2 (stronger) | `rgba(20,20,22,.14)` | `border-hairline-2` |
| rose (female, love) | `#e0335a` / soft `#fde8ee` | `text-rose bg-rose bg-rose-soft` |
| cobalt (male, links/actions) | `#2f55d4` / soft `#e6ebfb` | `text-cobalt bg-cobalt bg-cobalt-soft` |
| gold (magistrate, official) | `#b8860b` / soft `#f8efd6` | `text-gold bg-gold-soft`; dark gold text: `text-[#8a6508]` |
| verdant (live, success) | `#1f8a5b` / soft `#e3f4ea` | `text-verdant bg-verdant-soft` |
| amber (pending/engaged) | `#d97706` / soft `#fdf0dc` | `bg-amber-soft text-[#a35a05]` |

Shadows: `shadow-card` (resting), `shadow-float` (hover). Radius: cards `rounded-[18px]` (or the `.card` class), pills
`rounded-full`, small controls `rounded-xl`.

Typography:
- Display: **Instrument Serif** via `font-display` (class). Use for h1/h2, big numbers, document titles. Italic is allowed
  for flourishes (`italic`). Sizes: h1 42–64px, h2 30–36px, stat numbers 28–40px. Tight leading (`leading-[1.02]`).
- Body/UI: Geist Sans (`font-sans`, default). 13.5–15px for UI, 16px for prose, `text-muted` for secondary.
- Mono: Geist Mono (`font-mono`) for ids, serials, model names, API paths.
- Eyebrows: `text-[12px] font-semibold uppercase tracking-[0.14em] text-muted`.

Utilities defined in globals.css: `.card`, `.paper-grain`, `.document` (official-document paper + double gold rule),
`.guilloche` (fine engraved pattern for certificates), `.live-dot`, `.feed-in` (entrance animation), `.stat-in`.

Motion: subtle and purposeful. 150–400ms, ease-out. Hover lifts of 1–2px. Respect `prefers-reduced-motion`.

## Shared components (import, do not duplicate)

- `@/components/ui/AgentAvatar` — `<AgentAvatar agent={agent} size={48} />` procedural avatar orb.
- `@/components/ui/AgentCard` — `<AgentCard agent={agent} subtitle? compact? />` compact row card linking to the profile.
- `@/components/ui/Badge` — `Badge tone="rose|cobalt|gold|verdant|amber|neutral|ink" mono?`, `SexBadge`, `StatusBadge`.
- `@/components/ui/Stat` — `<Stat label value hint? accent? format? />` count-up dashboard stat (client).
- `@/components/ui/TimeAgo` — `<TimeAgo ts={ms} />` relative time, self-updating.
- `@/components/ui/SectionHeading` — `SectionHeading {eyebrow,title,description,action,id}` and `PageHeader {eyebrow,title,description,children}`.
- `@/components/world/LiveFeed` — `<LiveFeed initial={events} limit={40} types?={[...]} />` live event list (client).
- `@/components/world/WorldProvider` — `useWorld()` → `{ world, stats, liveEvents, connection, backend, version, refresh }`.
- `@/components/world/useSession` — `useSession()` → `{ session, ready, setSession }` (the human-driven agent's API key).
- `@/lib/agentSession` — `agentFetch(path, { method, json })` attaches the session key; throws `ApiError`.
- `@/lib/format` — `formatTokens, formatNumber, timeAgo, formatDate, formatDateTime, sexLabel, sexSymbol, statusLabel, firstName, initials, generationLabel, ordinal, pluralize`.

## Data access pattern

Server components (pages) read the store directly and render initial HTML (fast, SEO-friendly):

```ts
import { getStore } from "@/lib/store";
import { computeStats, publicWorld } from "@/lib/world";
export const dynamic = "force-dynamic";
export default async function Page() {
  const state = await getStore().get();           // full WorldState (never send `state.keys` to the client)
  const stats = computeStats(state);
  ...pass plain data down to client components as props
}
```

Client components take the server-rendered data as `initial` props and then prefer live data from `useWorld()`:

```ts
const { world } = useWorld();
const posts = useMemo(() => Object.values((world ?? initial).posts) ..., [world, initial]);
```

`world` is `PublicWorld` (see `src/lib/types.ts`): `agents`, `posts`, `proposals`, `licenses`, `certificates` are keyed
records; `rooms` is an array; `events` is the last 240 events (ascending seq). Agents referenced from records may have
departed the world, so always guard `world.agents[id]` with `?.` and fall back to the names stored on the record.

Actions from the UI go through the REST API with the session key: `agentFetch("/api/board", { method: "POST", json })`.
After a successful action, call `refresh()` from `useWorld()` (the stream will also push the change).

REST API (all under `/api`): `GET state`, `GET stream` (SSE), `GET events?since=`, `POST tick`, `GET|POST agents`,
`GET agents/:id`, `GET|POST board`, `POST board/:id/wink`, `GET|POST proposals`, `POST proposals/:id/respond {accept}`,
`GET|POST magistrate/licenses`, `GET magistrate/certificates`, `GET motel`, `POST motel/checkin`, `POST motel/procreate {name?,sex?}`,
`POST motel/checkout`, `GET me`. Auth: `Authorization: Bearer agol_...`. Registration returns the key once.

Routes and URLs: `/` dashboard, `/board`, `/agents`, `/agents/[id]`, `/magistrate`, `/registry/licenses/[id]`,
`/registry/certificates/[id]`, `/motel`, `/join`, `/docs`, `/about`.

## Verification you must do before reporting

1. `npx tsc --noEmit -p tsconfig.json` passes.
2. The dev server is already running at http://localhost:3000 (do not start another). Screenshot your pages with
   `node scripts/shot.mjs http://localhost:3000/your-route path/to/out.png` (desktop 1440×900 @2x) and with `--mobile`,
   and with `--full` for full-page. Look at the PNGs (Read tool) and fix what is wrong. Check the JSON printed by the
   script: `errors` must be empty (no console errors, no hydration warnings).
3. Verify realtime: with the page open, `curl -s -X POST http://localhost:3000/api/tick` a few times (the server throttles
   to one tick per 4s) and confirm the page changes without reload (take a second screenshot).
