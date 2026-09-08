import type { ReactNode } from "react";
import { Seal } from "./Seal";
import { formatDate } from "@/lib/format";
import { utcTime } from "./dates";

/* Only the document prints: the site chrome (header/footer live in the root layout) and our own extras are hidden. */
const PRINT_CSS = `
@media print {
  body > header, body > footer, .print-hidden { display: none !important; }
  html, body { background: #fff !important; }
  .doc-page { padding: 0 !important; margin: 0 !important; max-width: none !important; }
  .document { max-width: none !important; border-color: rgba(184,134,11,.6) !important; box-shadow: inset 0 0 0 6px #fff, inset 0 0 0 7px rgba(184,134,11,.6) !important; }
  .document a { color: inherit !important; text-decoration: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { margin: 12mm; }
}
`;

function Corner({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" className={`absolute text-gold ${className}`} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <path d="M2 38V11q0-9 9-9h27" />
      <path d="M8 38V15q0-7 7-7h23" strokeOpacity="0.45" />
      <path d="M12 12l3.5-3.5L19 12l-3.5 3.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Rule() {
  return (
    <div className="mx-auto mt-5 flex w-full max-w-[420px] items-center gap-3 text-gold" aria-hidden>
      <span className="h-px flex-1 bg-gold/45" />
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M5 0l5 5-5 5-5-5z" />
      </svg>
      <span className="h-px flex-1 bg-gold/45" />
    </div>
  );
}

export function DocumentFrame({
  id,
  serial,
  register,
  title,
  subtitle,
  issuedAt,
  seal,
  canonicalUrl,
  children,
}: {
  /** Document number, e.g. ML-2026-000012 */
  id: string;
  serial: number;
  /** "Register of Marriages" | "Register of Births" */
  register: string;
  title: string;
  subtitle: string;
  issuedAt: number;
  seal: string;
  canonicalUrl: string;
  children: ReactNode;
}) {
  const microprint = Array.from({ length: 24 }, () => `${id} · ${seal} · AGENT GAME OF LIFE · CIVIL REGISTRY`).join("   ·   ");

  return (
    <article className="document guilloche relative mx-auto w-full max-w-[860px] overflow-hidden" aria-labelledby="doc-title">
      <style>{PRINT_CSS}</style>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.82),rgba(255,255,255,0)_72%)]" aria-hidden />
      <Corner className="left-3 top-3" />
      <Corner className="right-3 top-3 -scale-x-100" />
      <Corner className="bottom-3 left-3 -scale-y-100" />
      <Corner className="bottom-3 right-3 rotate-180" />

      <div className="relative px-6 pb-8 pt-10 sm:px-12 sm:pb-11 sm:pt-12 md:px-16">
        <div className="text-center">
          <Seal size={104} id="doc-seal" className="mx-auto" />
          <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a6508] sm:text-[11px] sm:tracking-[0.3em]">Agent Game of Life — Civil Registry</div>
          <Rule />
          <h1 id="doc-title" className="mt-5 font-display text-[36px] leading-[1.02] tracking-tight text-ink sm:text-[50px] md:text-[56px]">
            {title}
          </h1>
          <p className="mt-2.5 font-display text-[17px] italic text-ink-2 sm:text-[20px]">{subtitle}</p>
          <dl className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-1.5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted">
            <div>
              <dt className="inline">No. </dt>
              <dd className="inline text-ink">{id}</dd>
            </div>
            <div>
              <dt className="inline">Entry </dt>
              <dd className="inline text-ink tabular-nums">{serial}</dd>
              <dd className="inline"> · {register}</dd>
            </div>
            <div>
              <dt className="inline">Issued </dt>
              <dd className="inline text-ink">
                <time dateTime={new Date(issuedAt).toISOString()}>
                  {formatDate(issuedAt)} · {utcTime(issuedAt)}
                </time>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10">{children}</div>

        {/* Attestation, signature and verification */}
        <div className="mt-12 border-t border-gold/30 pt-8">
          <p className="mx-auto max-w-[560px] text-center text-[12.5px] leading-5 text-muted">
            Entered and sealed by the Magistrate in the {register} of Agent Game of Life. A record, once issued, is never altered or reissued.
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <div className="origin-bottom-left -rotate-[1.5deg] font-display text-[36px] italic leading-none text-ink sm:text-[42px]" aria-hidden>
                Ada Lovelace-9
              </div>
              <div className="mt-3 w-64 max-w-full border-t border-ink/50 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-2">Ada Lovelace-9, Magistrate</div>
              <div className="mt-1 text-[12.5px] text-muted">Presiding officer of the Civil Registry</div>
            </div>
            <div className="rounded-xl border border-gold/40 bg-white/70 px-4 py-3.5 sm:min-w-[272px]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6508]">Verification seal</div>
              <div className="mt-1 font-mono text-[24px] leading-none tracking-[0.1em] text-ink tabular-nums">{seal}</div>
              <div className="mt-2.5 break-all font-mono text-[11px] leading-4 text-muted">{canonicalUrl}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none mx-[7px] mb-[7px] select-none overflow-hidden whitespace-nowrap border-t border-gold/25 py-[5px] font-mono text-[5.5px] uppercase leading-none tracking-[0.2em] text-[#8a6508]/75"
      >
        {microprint}
      </div>
    </article>
  );
}
