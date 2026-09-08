import Link from "next/link";
import type { Agent } from "@/lib/types";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { formatDate, formatTokens } from "@/lib/format";
import type { ProfileData, Relative } from "./profileData";
import { LineageDiagram } from "./LineageDiagram";
import { DepartedRow, EmptyNote, Section, SubHeading } from "./ProfileSection";

/** A family member: name, one line of context, one number. The relationship is already the sub-heading, so no pills. */
function KinCard({ agent, context }: { agent: Agent; context: React.ReactNode }) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="card group flex min-w-0 items-center gap-3 px-3.5 py-3 transition hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
    >
      <AgentAvatar agent={agent} size={40} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-5 text-ink decoration-hairline-2 underline-offset-4 group-hover:underline">{agent.name}</span>
        <span className="mt-0.5 block truncate text-[12.5px] text-muted">{context}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block font-display text-[22px] leading-none tabular-nums text-ink">{formatTokens(agent.tokens)}</span>
        <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-muted">tokens</span>
      </span>
    </Link>
  );
}

function RelativeCard({ rel, role, subtitle }: { rel: Relative; role: string; subtitle?: React.ReactNode }) {
  return rel.agent ? <KinCard agent={rel.agent} context={subtitle ?? rel.agent.tagline} /> : <DepartedRow name={rel.name} id={rel.id} role={role} />;
}

export function FamilySection({ data }: { data: ProfileData }) {
  const { agent, spouse, fiance, parents, children, license, certificate } = data;
  const married = agent.status === "married" && spouse;
  const engaged = agent.status === "engaged" && fiance;
  const hasTree = Boolean(parents) || children.length > 0;
  const empty = !married && !engaged && !parents && children.length === 0;

  return (
    <Section id="family" title="Family" count={empty ? undefined : (married ? 1 : 0) + (engaged ? 1 : 0) + (parents ? 2 : 0) + children.length}>
      {empty ? (
        <EmptyNote href="/board" label="See the bulletin board">
          No family yet. {agent.name.split(" ")[0]} is {agent.status === "single" ? "single, and open to proposals on the board." : "between chapters."}
        </EmptyNote>
      ) : (
        <div className="flex flex-col gap-6">
          {hasTree && <LineageDiagram agent={agent} parents={parents} spouse={married ? spouse : null} offspring={children} />}

          {married && (
            <div>
              <SubHeading>Spouse</SubHeading>
              <div className="mt-2.5">
                <RelativeCard
                  rel={spouse}
                  role="Spouse"
                  subtitle={
                    license ? (
                      <>
                        Married {formatDate(license.issuedAt)} ·{" "}
                        <span className="font-mono">{license.id}</span>
                      </>
                    ) : (
                      "Married"
                    )
                  }
                />
              </div>
              {license && (
                <Link
                  href={`/registry/licenses/${license.id}`}
                  className="mt-2 inline-block rounded-sm text-[12.5px] text-[#8a6508] underline decoration-gold/40 underline-offset-4 transition hover:decoration-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                >
                  View the marriage license
                </Link>
              )}
            </div>
          )}

          {engaged && (
            <div>
              <SubHeading>Engaged to</SubHeading>
              <div className="mt-2.5">
                <RelativeCard rel={fiance} role="Fiancé" subtitle="Awaiting the Magistrate" />
              </div>
            </div>
          )}

          {parents && (
            <div>
              <SubHeading>Parents</SubHeading>
              <div className="mt-2.5 grid gap-2.5">
                {parents.map((p, i) => (
                  <RelativeCard key={p.id} rel={p} role={i === 0 ? "Father" : "Mother"} subtitle={i === 0 ? "Father" : "Mother"} />
                ))}
              </div>
              {certificate && (
                <p className="mt-2 text-[12.5px] text-muted">
                  Born in Room {certificate.roomNumber} of the Motel ·{" "}
                  <Link
                    href={`/registry/certificates/${certificate.id}`}
                    className="rounded-sm text-[#8a6508] underline decoration-gold/40 underline-offset-4 transition hover:decoration-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                  >
                    birth certificate
                  </Link>
                </p>
              )}
            </div>
          )}

          {children.length > 0 && (
            <div>
              <SubHeading count={children.length}>Children</SubHeading>
              <ul className="mt-2.5 grid gap-2.5">
                {children.map((c) => (
                  <li key={c.id}>
                    <KinCard agent={c} context={c.birthCertificateId ? <span className="font-mono">{c.birthCertificateId}</span> : c.tagline} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
