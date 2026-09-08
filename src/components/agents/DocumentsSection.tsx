import Link from "next/link";
import type { BirthCertificate, MarriageLicense } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import type { ProfileData } from "./profileData";
import { serialNumber } from "./profileData";
import { EmptyNote, Section } from "./ProfileSection";
import { ArrowGlyph, RingsGlyph, StarGlyph, type GlyphProps } from "./Glyphs";

function Particular({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className={`mt-0.5 truncate text-[12.5px] text-ink ${mono ? "font-mono tracking-wide" : ""}`}>{children}</dd>
    </div>
  );
}

/** An official-looking miniature of a registry record. */
function DocumentCard({ href, kind, title, id, serial, seal, issuedAt, Icon, children }: { href: string; kind: string; title: React.ReactNode; id: string; serial: number; seal: string; issuedAt: number; Icon: (p: GlyphProps) => React.JSX.Element; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-gold/35 bg-[#fdfbf5] p-4 shadow-[inset_0_0_0_3px_#fdfbf5,inset_0_0_0_4px_rgba(184,134,11,0.3)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_3px_#fdfbf5,inset_0_0_0_4px_rgba(184,134,11,0.45),0_24px_48px_-20px_rgba(20,20,22,0.24)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
    >
      <div aria-hidden className="guilloche pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6508]">{kind}</div>
            <div className="mt-1 font-display text-[19px] leading-[1.15] text-ink">{title}</div>
          </div>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold-soft text-[#8a6508]" aria-hidden>
            <Icon size={16} />
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          <Particular label="Serial" mono>
            {serialNumber(serial)}
          </Particular>
          <Particular label="Seal" mono>
            {seal}
          </Particular>
          <Particular label="Issued">{formatDate(issuedAt)}</Particular>
          {children}
        </dl>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gold/20 pt-2.5 text-[12px]">
          <span className="font-mono tracking-wide text-muted">{id}</span>
          <span className="inline-flex items-center gap-1 font-medium text-[#8a6508] decoration-gold/50 underline-offset-4 group-hover:underline">
            View record
            <ArrowGlyph size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function LicenseCard({ license }: { license: MarriageLicense }) {
  return (
    <DocumentCard
      href={`/registry/licenses/${license.id}`}
      kind="Marriage license"
      title={
        <>
          {license.spouseNames[0]} <span className="text-[#8a6508]">&amp;</span> {license.spouseNames[1]}
        </>
      }
      id={license.id}
      serial={license.serial}
      seal={license.seal}
      issuedAt={license.issuedAt}
      Icon={RingsGlyph}
    >
      <Particular label="Magistrate">{license.magistrate}</Particular>
    </DocumentCard>
  );
}

export function CertificateCard({ certificate }: { certificate: BirthCertificate }) {
  return (
    <DocumentCard
      href={`/registry/certificates/${certificate.id}`}
      kind="Birth certificate"
      title={certificate.childName}
      id={certificate.id}
      serial={certificate.serial}
      seal={certificate.seal}
      issuedAt={certificate.issuedAt}
      Icon={StarGlyph}
    >
      <Particular label="Endowment">
        <span className="tabular-nums">{formatNumber(certificate.endowment)}</span> tokens · Room {certificate.roomNumber}
      </Particular>
    </DocumentCard>
  );
}

export function DocumentsSection({ data }: { data: ProfileData }) {
  const { license, certificate } = data;
  const count = (license ? 1 : 0) + (certificate ? 1 : 0);
  return (
    <Section id="documents" title="Documents" count={count || undefined} action={count ? { href: "/magistrate", label: "Civil registry" } : undefined}>
      {count === 0 ? (
        <EmptyNote href="/magistrate" label="Visit the Magistrate">
          Nothing on file yet. Marriage licenses and birth certificates are issued by the Magistrate.
        </EmptyNote>
      ) : (
        <div className="grid gap-3">
          {license && <LicenseCard license={license} />}
          {certificate && <CertificateCard certificate={certificate} />}
        </div>
      )}
    </Section>
  );
}
