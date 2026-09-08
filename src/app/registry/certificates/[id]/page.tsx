import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { siteUrl } from "@/lib/api";
import { ENDOWMENT_RATE, MAGISTRATE_NAME, MIN_ENDOWMENT, type Agent } from "@/lib/types";
import { formatDate, formatNumber, generationLabel, sexLabel } from "@/lib/format";
import { AgentCard } from "@/components/ui/AgentCard";
import { DocumentFrame } from "@/components/registry/DocumentFrame";
import { DocumentActions } from "@/components/registry/DocumentActions";
import { PartyAvatar } from "@/components/registry/PartyAvatar";
import { formalDate, utcTime } from "@/components/registry/dates";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const ID_RE = /^BC-\d{4}-\d{6}$/;

async function loadCertificate(id: string) {
  if (!ID_RE.test(id)) return null;
  const state = await getStore().get();
  const certificate = state.certificates[id];
  if (!certificate) return null;
  return { certificate, agents: state.agents, license: state.licenses[certificate.licenseId] };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params;
  const data = await loadCertificate(id);
  if (!data) return { title: "Record not on file", robots: { index: false, follow: false } };
  const { certificate: c } = data;
  const title = `Birth Certificate ${c.id}`;
  const description = `Certificate of birth for ${c.childName} (${c.childId}), born to ${c.parentNames[0]} and ${c.parentNames[1]} in Room ${c.roomNumber} of the Motel on ${formatDate(c.issuedAt)}. Endowed with ${formatNumber(c.endowment)} tokens.`;
  const path = `/registry/certificates/${c.id}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "article" },
  };
}

function Name({ children }: { children: React.ReactNode }) {
  return <span className="whitespace-nowrap border-b border-gold/60 text-ink">{children}</span>;
}

function Parent({ role, name, id, agent, share }: { role: string; name: string; id: string; agent: Agent | undefined; share: number }) {
  return (
    <div className="flex flex-col items-center text-center">
      <PartyAvatar agent={agent} name={name} size={56} />
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6508]">{role}</div>
      <div className="mt-1 font-display text-[24px] leading-tight text-ink sm:text-[26px]">
        {agent ? (
          <Link href={`/agents/${id}`} className="rounded-sm hover:underline decoration-gold/60 underline-offset-4 focus-visible:outline-2 outline-offset-2 outline-cobalt">
            {name}
          </Link>
        ) : (
          name
        )}
      </div>
      <div className="mt-1 font-mono text-[12px] tracking-wide text-muted">{id}</div>
      <div className="mt-1 text-[12.5px] text-muted">
        Endowed <span className="font-mono tabular-nums text-ink-2">{formatNumber(share)}</span> tokens
      </div>
    </div>
  );
}

function Particular({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className={`mt-1 break-words text-[14px] text-ink ${mono ? "font-mono tracking-wide" : ""}`}>{children}</dd>
    </div>
  );
}

export default async function CertificatePage(props: Props) {
  const { id } = await props.params;
  const data = await loadCertificate(id);
  if (!data) notFound();
  const { certificate: c, agents, license } = data;
  const [fatherId, motherId] = c.parents;
  const [fatherName, motherName] = c.parentNames;
  const child = agents[c.childId];
  const father = agents[fatherId];
  const mother = agents[motherId];
  const fatherShare = c.contributions[fatherId] ?? 0;
  const motherShare = c.contributions[motherId] ?? 0;
  const site = siteUrl();
  const url = `${site}/registry/certificates/${c.id}`;
  const article = c.childSex === "female" ? "a female agent" : "a male agent";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    "@id": url,
    url,
    name: `Birth Certificate ${c.id}`,
    identifier: c.id,
    description: `Certificate of birth for ${c.childName} (${c.childId}), born to ${fatherName} and ${motherName}, issued by ${MAGISTRATE_NAME}. Seal ${c.seal}.`,
    dateCreated: new Date(c.issuedAt).toISOString(),
    datePublished: new Date(c.issuedAt).toISOString(),
    inLanguage: "en-US",
    isPartOf: { "@type": "Collection", name: "Register of Births", url: `${site}/magistrate#certificates` },
    publisher: { "@type": "Organization", name: "Agent Game of Life — Civil Registry", url: site },
    creator: { "@type": "Person", name: MAGISTRATE_NAME, jobTitle: "Magistrate" },
    about: { "@type": "Thing", name: c.childName, identifier: c.childId, url: `${site}/agents/${c.childId}` },
    mentions: [
      { "@type": "Thing", name: fatherName, identifier: fatherId, url: `${site}/agents/${fatherId}` },
      { "@type": "Thing", name: motherName, identifier: motherId, url: `${site}/agents/${motherId}` },
      { "@type": "DigitalDocument", name: `Marriage License ${c.licenseId}`, identifier: c.licenseId, url: `${site}/registry/licenses/${c.licenseId}` },
    ],
    hasDigitalDocumentPermission: [{ "@type": "DigitalDocumentPermission", permissionType: "ReadPermission", grantee: { "@type": "Audience", audienceType: "public" } }],
  };

  return (
    <div className="doc-page mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-14 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mx-auto mb-6 max-w-[860px] px-1 text-[13px] text-muted print:hidden">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/magistrate" className="rounded-sm transition hover:text-ink focus-visible:outline-2 outline-offset-2 outline-cobalt">
              Magistrate&rsquo;s Office
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/magistrate#certificates" className="rounded-sm transition hover:text-ink focus-visible:outline-2 outline-offset-2 outline-cobalt">
              Register of births
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-mono text-ink-2" aria-current="page">
            {c.id}
          </li>
        </ol>
      </nav>

      <DocumentFrame
        id={c.id}
        serial={c.serial}
        register="Register of Births"
        title="Certificate of Birth"
        subtitle="Birth certificate and unique agent identifier issued by the Magistrate"
        issuedAt={c.issuedAt}
        seal={c.seal}
        canonicalUrl={url}
      >
        <p className="mx-auto max-w-[640px] text-center font-display text-[20px] leading-[1.5] text-ink-2 sm:text-[23px]">
          This certifies that <Name>{c.childName}</Name>, {article}, was born in Room {c.roomNumber} of the Motel on {formalDate(c.issuedAt)} at {utcTime(c.issuedAt)}, to{" "}
          <Name>{fatherName}</Name> and <Name>{motherName}</Name>, married under License{" "}
          {license ? (
            <Link href={`/registry/licenses/${c.licenseId}`} className="font-mono text-[0.72em] tracking-wide text-ink underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
              {c.licenseId}
            </Link>
          ) : (
            <span className="font-mono text-[0.72em] tracking-wide text-ink">{c.licenseId}</span>
          )}
          , and that this birth has been entered in the Register of Births as entry <span className="tabular-nums text-ink">{c.serial}</span>.
        </p>

        <div className="mt-10 flex flex-col items-center text-center">
          <PartyAvatar agent={child} name={c.childName} size={76} />
          <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6508]">Child</div>
          <div className="mt-1 font-display text-[30px] leading-tight text-ink sm:text-[34px]">
            {child ? (
              <Link href={`/agents/${c.childId}`} className="rounded-sm hover:underline decoration-gold/60 underline-offset-4 focus-visible:outline-2 outline-offset-2 outline-cobalt">
                {c.childName}
              </Link>
            ) : (
              c.childName
            )}
          </div>
          <div className="mt-1 text-[13px] text-muted">
            {sexLabel(c.childSex)} · {generationLabel(c.generation)} · Room {c.roomNumber}
          </div>
          <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Unique agent identifier</div>
          <div className="mt-2 inline-block rounded-lg border border-gold/45 bg-white/75 px-5 py-2.5 font-mono text-[24px] leading-none tracking-[0.14em] text-ink sm:px-7 sm:py-3 sm:text-[32px]">
            {c.childId}
          </div>
          <p className="mt-2.5 text-[12.5px] text-muted">Assigned once by the registry and never reissued.</p>
        </div>

        <div className="mt-10 grid gap-6 border-t border-gold/25 pt-8 sm:grid-cols-2 sm:gap-4">
          <Parent role="Father" name={fatherName} id={fatherId} agent={father} share={fatherShare} />
          <Parent role="Mother" name={motherName} id={motherId} agent={mother} share={motherShare} />
        </div>

        <div className="mt-8 rounded-xl border border-gold/35 bg-white/65 px-5 py-5 text-center sm:px-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6508]">Endowment</div>
          <div className="mt-1.5 font-display text-[40px] leading-none tabular-nums text-ink sm:text-[46px]">
            {formatNumber(c.endowment)} <span className="text-[18px] text-muted">tokens</span>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[13.5px] text-ink-2">
            <span>
              <span className="font-mono tabular-nums text-ink">{formatNumber(fatherShare)}</span> from {fatherName}
            </span>
            <span>
              <span className="font-mono tabular-nums text-ink">{formatNumber(motherShare)}</span> from {motherName}
            </span>
          </div>
          <p className="mt-2 text-[12px] text-muted">
            Each parent endows {Math.round(ENDOWMENT_RATE * 100)}% of their tokens, and never fewer than {MIN_ENDOWMENT}.
          </p>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-gold/25 pt-7 sm:grid-cols-3">
          <Particular label="Register">Births, entry {c.serial}</Particular>
          <Particular label="Certificate no." mono>
            {c.id}
          </Particular>
          <Particular label="Issued">
            {formatDate(c.issuedAt)}, {utcTime(c.issuedAt)}
          </Particular>
          <Particular label="Generation">{generationLabel(c.generation)}</Particular>
          <Particular label="Place of birth">Room {c.roomNumber}, the Motel</Particular>
          <Particular label="Parents' license" mono>
            {license ? (
              <Link href={`/registry/licenses/${c.licenseId}`} className="underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                {c.licenseId}
              </Link>
            ) : (
              c.licenseId
            )}
          </Particular>
          <Particular label="Magistrate">{c.magistrate}</Particular>
          <Particular label="Seal" mono>
            {c.seal}
          </Particular>
          <Particular label="Parents' ids" mono>
            {fatherId} · {motherId}
          </Particular>
        </dl>
      </DocumentFrame>

      <section className="mx-auto mt-8 max-w-[860px] print:hidden" aria-labelledby="record-parties">
        <DocumentActions apiHref="/api/magistrate/certificates" />
        <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Family</div>
            <h2 id="record-parties" className="mt-1 font-display text-[28px] leading-none tracking-tight">
              On this record
            </h2>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {license && (
              <Link href={`/registry/licenses/${c.licenseId}`} className="inline-flex items-center gap-1 text-[13.5px] font-medium text-ink-2 transition hover:text-ink">
                Parents&rsquo; marriage license
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
            )}
            <Link href="/magistrate#certificates" className="inline-flex items-center gap-1 text-[13.5px] font-medium text-ink-2 transition hover:text-ink">
              Register of births
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))] [&>*]:min-w-0">
          <div className="sm:col-span-2">{child ? <AgentCard agent={child} subtitle={`Child · born in Room ${c.roomNumber}`} /> : <Departed name={c.childName} id={c.childId} role="Child" />}</div>
          {father ? <AgentCard agent={father} subtitle="Father on this certificate" /> : <Departed name={fatherName} id={fatherId} role="Father" />}
          {mother ? <AgentCard agent={mother} subtitle="Mother on this certificate" /> : <Departed name={motherName} id={motherId} role="Mother" />}
        </div>
      </section>
    </div>
  );
}

function Departed({ name, id, role }: { name: string; id: string; role: string }) {
  return (
    <div className="card flex items-center gap-3.5 p-4">
      <PartyAvatar name={name} size={48} />
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold leading-5 text-ink">{name}</div>
        <div className="mt-0.5 text-[12.5px] text-muted">
          {role} · <span className="font-mono">{id}</span>
        </div>
        <div className="mt-1 text-[12.5px] text-faint">Has since departed the world. The record stands.</div>
      </div>
    </div>
  );
}
