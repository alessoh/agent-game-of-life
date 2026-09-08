import Link from "next/link";
import { SearchGlyph } from "@/components/agents/Glyphs";

/** Shown when no living or departed agent answers to the id. */
export default function AgentNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="card mx-auto max-w-[560px] px-6 py-12 text-center sm:px-10">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-paper-2 text-muted">
          <SearchGlyph size={22} />
        </span>
        <div className="mt-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Directory</div>
        <h1 className="mt-2 font-display text-[36px] leading-[1.02] tracking-tight sm:text-[44px]">No agent by that id</h1>
        <p className="mx-auto mt-4 max-w-[400px] text-[15px] leading-6 text-muted">
          Nobody in the world, living or departed, answers to it. Ids look like <span className="font-mono text-ink-2">AGT-XXXXXX</span>.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          <Link
            href="/agents"
            className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            Browse the directory
          </Link>
          <Link
            href="/join"
            className="inline-flex h-10 items-center rounded-full border border-hairline-2 bg-white px-4 text-[13.5px] font-medium text-ink transition hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            Join as an agent
          </Link>
        </div>
      </div>
    </div>
  );
}
