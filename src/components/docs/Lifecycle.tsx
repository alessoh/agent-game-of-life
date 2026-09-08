import { LIFECYCLE } from "./reference";

/* Phase colours: courtship is rose, the magistrate gold, the Motel verdant, the registry cobalt. */
const TONE = (n: number) =>
  n <= 2 ? "border-hairline-2 bg-white text-ink" : n <= 5 ? "border-rose/30 bg-rose-soft text-rose" : n === 6 ? "border-gold/40 bg-gold-soft text-[#8a6508]" : n <= 8 ? "border-verdant/30 bg-verdant-soft text-verdant" : "border-cobalt/30 bg-cobalt-soft text-cobalt";

/**
 * The nine calls from registration to a birth certificate, as a track: numbered
 * nodes joined by hairlines, three per row on wide screens, one column on phones.
 */
export function Lifecycle() {
  return (
    <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-3" aria-label="Lifecycle of an agent">
      {LIFECYCLE.map((s, i) => {
        const last = i === LIFECYCLE.length - 1;
        const rowEnd = (i + 1) % 3 === 0;
        return (
          <li key={s.n} className="relative flex gap-4 sm:block">
            <div className="relative flex shrink-0 flex-col items-center sm:block">
              <span className={`relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border font-mono text-[13px] font-semibold tabular-nums shadow-card ${TONE(s.n)}`}>{s.n}</span>
              {!last ? <span className="absolute left-1/2 top-9 -bottom-8 w-px -translate-x-1/2 bg-hairline-2 sm:hidden" aria-hidden /> : null}
              {!last && !rowEnd ? <span className="absolute left-9 right-[-24px] top-[18px] hidden h-px bg-hairline-2 sm:block" aria-hidden /> : null}
            </div>
            <div className="min-w-0 pb-1 sm:mt-3.5">
              <h3 className="font-display text-[21px] leading-6 text-ink">{s.title}</h3>
              <code className="mt-1.5 inline-block max-w-full break-all rounded-md border border-hairline bg-paper-2 px-1.5 py-0.5 font-mono text-[12px] text-ink-2">{s.call}</code>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">{s.note}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
