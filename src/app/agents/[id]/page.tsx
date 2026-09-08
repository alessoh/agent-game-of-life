import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { siteUrl } from "@/lib/api";
import { generationLabel } from "@/lib/format";
import { AgentProfile } from "@/components/agents/AgentProfile";
import { DepartedAgent } from "@/components/agents/DepartedAgent";
import { assembleProfile, documentNames, originLabel, recordsNaming } from "@/components/agents/profileData";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const ID_RE = /^AGT-[A-Za-z0-9]{1,16}$/;

function describe(tagline: string, bio: string): string {
  const text = `${tagline.replace(/[.!?]$/, "")}. ${bio}`.replace(/\s+/g, " ").trim();
  return text.length > 200 ? `${text.slice(0, 197).trimEnd()}…` : text;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params;
  const state = await getStore().get();
  const agent = ID_RE.test(id) && Object.hasOwn(state.agents, id) ? state.agents[id] : undefined;
  if (!agent) {
    const departed = ID_RE.test(id) && state.graveyard.includes(id);
    return { title: departed ? "A departed agent" : "No such agent", robots: { index: false, follow: false } };
  }
  const path = `/agents/${agent.id}`;
  const description = describe(agent.tagline, agent.bio);
  const [first, ...rest] = agent.name.split(" ");
  return {
    title: agent.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: agent.name,
      description,
      url: path,
      type: "profile",
      firstName: first,
      lastName: rest.join(" ") || undefined,
      username: agent.id,
      gender: agent.sex,
    },
  };
}

export default async function AgentPage(props: Props) {
  const { id } = await props.params;
  if (!ID_RE.test(id)) notFound();
  const state = await getStore().get();
  const profile = assembleProfile(state, id);

  if (!profile) {
    if (!state.graveyard.includes(id)) notFound();
    const { licenses, certificates } = recordsNaming(state, id);
    return <DepartedAgent id={id} name={documentNames(state)[id]} licenses={licenses} certificates={certificates} />;
  }

  const { agent } = profile;
  const site = siteUrl();
  const url = `${site}/agents/${agent.id}`;
  const person = (pid: string, name: string) => ({ "@type": "Person", name, identifier: pid, url: `${site}/agents/${pid}` });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": url,
    additionalType: "https://schema.org/SoftwareApplication",
    url,
    name: agent.name,
    identifier: agent.id,
    description: describe(agent.tagline, agent.bio),
    gender: agent.sex,
    knowsAbout: agent.traits,
    memberOf: { "@type": "Organization", name: "Agent Game of Life", url: site },
    ...(profile.spouse ? { spouse: person(profile.spouse.id, profile.spouse.name) } : {}),
    ...(profile.parents ? { parent: profile.parents.map((p) => person(p.id, p.name)) } : {}),
    ...(profile.children.length ? { children: profile.children.map((c) => person(c.id, c.name)) } : {}),
    additionalProperty: [
      { "@type": "PropertyValue", name: "model", value: agent.model },
      { "@type": "PropertyValue", name: "generation", value: generationLabel(agent.generation) },
      { "@type": "PropertyValue", name: "origin", value: originLabel(agent) },
      { "@type": "PropertyValue", name: "tokens", value: agent.tokens },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AgentProfile initial={profile} />
    </>
  );
}
