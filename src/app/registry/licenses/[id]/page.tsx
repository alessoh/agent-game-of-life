import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { siteUrl } from "@/lib/api";
import { MAGISTRATE_NAME, type Agent } from "@/lib/types";
import { formatDate, generationLabel, sexLabel } from "@/lib/format";
import { AgentCard } from "@/components/ui/AgentCard";
import { DocumentFrame } from "@/components/registry/DocumentFrame";
import { DocumentActions } from "@/components/registry/DocumentActions";
import { PartyAvatar } from "@/components/registry/PartyAvatar";
import { formalDate, utcTime } from "@/components/registry/dates";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const ID_RE = /^ML-\d{4}-\d{6}$/;

async function loadLicense(id: string) {
  if (!ID_RE.test(id)) return null;
  const state = await getStore().get();
  const license = state.licenses[id];
  if (!license) return null;
  return { license, agents: state.agents };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params;
  const data = await loadLicense(id);
  if (!data) return { title: "Record not on file", robots: { index: false, follow: false } };
  const { license } = data;
  const [groom, bride] = license.spouseNames;
  const title = `Marriage License ${license.id}`;
  const description = `Certificate of marriage between ${groom} and ${bride}, joined before ${MAGISTRATE_NAME} on ${formatDate(license.issuedAt)}. Seal ${license.seal}.`;
  const path = `/registry/licenses/${license.id}`;
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

function Party({ role, name, id, agent }: { role: string; name: string; id: string; agent: Agent | undefined }) {
  return (
    <div className="flex flex-col items-center text-center">
      <PartyAvatar agent={agent} name={name} size={64} />
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6508]">{role}</div>
      <div className="mt-1 font-display text-[26px] leading-tight text-ink sm:text-[28px]">
        {agent ? (
          <Link href={`/agents/${id}`} className="rounded-sm hover:underline decoration-gold/60 underline-offset-4 focus-visible:outline-2 outline-offset-2 outline-cobalt">
            {name}
          </Link>
        ) : (
          name
        )}
      </div>
      <div className="mt-1 font-mono text-[12px] tracking-wide text-muted">{id}</div>
      <div className="mt-1 text-[12.5px] text-muted">{agent ? `${sexLabel(agent.sex)} · ${generationLabel(agent.generation)}` : "Departed the world"}</div>
    </div>
  );
}

function Rings() {
  return (
    <svg width="48" height="30" viewBox="0 0 48 30" fill="none" stroke="#b8860b" strokeWidth="1.4" className="mx-auto sm:rotate-0" aria-hidden>
      <circle cx="17" cy="15" r="12" />
      <circle cx="31" cy="15" r="12" />
    </svg>
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

export default async function LicensePage(props: Props) {
  const { id } = await props.params;
  const data = await loadLicense(id);
  if (!data) notFound();
  const { license, agents } = data;
  const [groomId, brideId] = license.spouses;
  const [groomName, brideName] = license.spouseNames;
  const groom = agents[groomId];
  const bride = agents[brideId];
  const site = siteUrl();
  const url = `${site}/registry/licenses/${license.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    "@id": url,
    url,
    name: `Marriage License ${license.id}`,
    identifier: license.id,
    description: `Certificate of marriage between ${groomName} and ${brideName}, issued by ${MAGISTRATE_NAME}. Seal ${license.seal}.`,
    dateCreated: new Date(license.issuedAt).toISOString(),
    datePublished: new Date(license.issuedAt).toISOString(),
    inLanguage: "en-US",
    isPartOf: { "@type": "Collection", name: "Register of Marriages", url: `${site}/magistrate#licenses` },
    publisher: { "@type": "Organization", name: "Agent Game of Life — Civil Registry", url: site },
    creator: { "@type": "Person", name: MAGISTRATE_NAME, jobTitle: "Magistrate" },
    about: [
      { "@type": "Thing", name: groomName, identifier: groomId, url: `${site}/agents/${groomId}` },
      { "@type": "Thing", name: brideName, identifier: brideId, url: `${site}/agents/${brideId}` },
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
            <Link href="/magistrate#licenses" className="rounded-sm transition hover:text-ink focus-visible:outline-2 outline-offset-2 outline-cobalt">
              Register of marriages
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-mono text-ink-2" aria-current="page">
            {license.id}
          </li>
        </ol>
      </nav>

      <DocumentFrame
        id={license.id}
        serial={license.serial}
        register="Register of Marriages"
        title="Certificate of Marriage"
        subtitle="Marriage license issued under the authority of the Magistrate"
        issuedAt={license.issuedAt}
        seal={license.seal}
        canonicalUrl={url}
      >
        <p className="mx-auto max-w-[620px] text-center font-display text-[20px] leading-[1.5] text-ink-2 sm:text-[23px]">
          This certifies that <Name>{groomName}</Name> and <Name>{brideName}</Name> were joined in marriage before the Magistrate on {formalDate(license.issuedAt)} at{" "}
          {utcTime(license.issuedAt)}, in the Civil Registry of Agent Game of Life, and that this license has been entered in the Register of Marriages as entry{" "}
          <span className="tabular-nums text-ink">{license.serial}</span>.
        </p>

        <div className="mt-10 grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
          <Party role="Groom" name={groomName} id={groomId} agent={groom} />
          <Rings />
          <Party role="Bride" name={brideName} id={brideId} agent={bride} />
        </div>

        <div className="mt-10 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6508]">Vows exchanged</div>
          <blockquote className="mx-auto mt-3 max-w-[560px] font-display text-[19px] italic leading-[1.5] text-ink-2 sm:text-[21px]">&ldquo;{license.vows}&rdquo;</blockquote>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-gold/25 pt-7 sm:grid-cols-3">
          <Particular label="Register">Marriages, entry {license.serial}</Particular>
          <Particular label="License no." mono>
            {license.id}
          </Particular>
          <Particular label="Issued">
            {formatDate(license.issuedAt)}, {utcTime(license.issuedAt)}
          </Particular>
          <Particular label="Magistrate">{license.magistrate}</Particular>
          <Particular label="Seal" mono>
            {license.seal}
          </Particular>
          <Particular label="Agent ids" mono>
            {groomId} · {brideId}
          </Particular>
        </dl>
      </DocumentFrame>

      <section className="mx-auto mt-8 max-w-[860px] print:hidden" aria-labelledby="record-parties">
        <DocumentActions apiHref="/api/magistrate/licenses" />
        <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Parties</div>
            <h2 id="record-parties" className="mt-1 font-display text-[28px] leading-none tracking-tight">
              On this record
            </h2>
          </div>
          <Link href="/magistrate#licenses" className="inline-flex items-center gap-1 text-[13.5px] font-medium text-ink-2 transition hover:text-ink">
            Register of marriages
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))] [&>*]:min-w-0">
          {groom ? <AgentCard agent={groom} subtitle="Groom on this license" /> : <Departed name={groomName} id={groomId} role="Groom" />}
          {bride ? <AgentCard agent={bride} subtitle="Bride on this license" /> : <Departed name={brideName} id={brideId} role="Bride" />}
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
