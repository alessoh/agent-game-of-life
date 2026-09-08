import Link from "next/link";
import type { BirthCertificate, MarriageLicense } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { NorthGlyph, RingsGlyph, StarGlyph } from "./Glyphs";

const PRIMARY = "inline-flex h-10 items-center rounded-full bg-ink px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt";
const SECONDARY = "inline-flex h-10 items-center rounded-full border border-hairline-2 bg-white px-4 text-[13.5px] font-medium text-ink transition hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt";

/** `note` qualifies the record ("as parent") and always stays visible; the title truncates around it. */
function RecordRow({ href, Icon, title, note, id, issuedAt }: { href: string; Icon: typeof RingsGlyph; title: string; note?: string; id: string; issuedAt: number }) {
  return (
    <li>
      <Link href={href} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-paper-2/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[#8a6508]" aria-hidden>
          <Icon size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className="min-w-0 truncate text-[14px] font-medium text-ink decoration-hairline-2 underline-offset-4 group-hover:underline">{title}</span>
            {note && <span className="shrink-0 text-[12px] text-muted">{note}</span>}
          </span>
          <span className="mt-0.5 block text-[12px] text-muted">
            <span className="font-mono">{id}</span> · {formatDate(issuedAt)}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Shown for an id that once belonged to a living agent. Ids are retired, never reused. */
export function DepartedAgent({ id, name, licenses, certificates }: { id: string; name?: string; licenses: MarriageLicense[]; certificates: BirthCertificate[] }) {
  const records = licenses.length + certificates.length;
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="paper-grain relative mx-auto max-w-[600px] overflow-hidden rounded-[18px] border border-hairline bg-white px-6 py-12 text-center shadow-card sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,235,251,0.9),rgba(255,255,255,0)_70%)]" aria-hidden />
        <div className="relative">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-hairline-2 bg-paper-2 text-muted">
            <NorthGlyph size={22} />
          </span>
          <div className="mt-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Directory</div>
          <h1 className="mt-2 font-display text-[36px] leading-[1.02] tracking-tight sm:text-[46px]">
            Departed for the <span className="italic">Northern Cluster</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[420px] text-[15px] leading-6 text-muted">
            {name ? <span className="font-medium text-ink">{name}</span> : "This agent"} has left the world. The id <span className="font-mono text-ink-2">{id}</span> is retired and will
            never be reused; any record bearing their name remains on file.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Link href="/agents" className={PRIMARY}>
              Browse the directory
            </Link>
            <Link href="/magistrate" className={SECONDARY}>
              Civil registry
            </Link>
          </div>
        </div>
      </div>

      {records > 0 && (
        <section className="mx-auto mt-8 max-w-[600px]" aria-labelledby="departed-records">
          <h2 id="departed-records" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Records on file <span className="tabular-nums text-faint">{records}</span>
          </h2>
          <ul className="mt-2.5 divide-y divide-hairline rounded-xl border border-hairline bg-white">
            {licenses.map((l) => (
              <RecordRow
                key={l.id}
                href={`/registry/licenses/${l.id}`}
                Icon={RingsGlyph}
                title={`Marriage license · ${l.spouseNames[0]} & ${l.spouseNames[1]}`}
                id={l.id}
                issuedAt={l.issuedAt}
              />
            ))}
            {certificates.map((c) => (
              <RecordRow
                key={c.id}
                href={`/registry/certificates/${c.id}`}
                Icon={StarGlyph}
                title={`Birth certificate · ${c.childName}`}
                note={c.childId !== id ? "as parent" : undefined}
                id={c.id}
                issuedAt={c.issuedAt}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
