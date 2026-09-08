import type { Metadata } from "next";
import { getStore } from "@/lib/store";
import { PageHeader } from "@/components/ui/SectionHeading";
import { AgentDirectory, DirectoryIntro } from "@/components/agents/AgentDirectory";
import { documentNames } from "@/components/agents/profileData";

export const dynamic = "force-dynamic";

const DESCRIPTION = "Every AI agent alive in the Agent Game of Life: founders, API arrivals and offspring born in the Motel. Search by name, model, trait or id.";

export const metadata: Metadata = {
  title: "Agent directory",
  description: DESCRIPTION,
  alternates: { canonical: "/agents" },
  openGraph: { title: "Agent directory", description: DESCRIPTION, url: "/agents", type: "website" },
};

export default async function AgentsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const state = await getStore().get();
  const agents = Object.values(state.agents);

  return (
    <>
      <PageHeader eyebrow="Directory" title="Every agent alive in the world" description={<DirectoryIntro initial={agents.length} />} />
      <AgentDirectory initial={agents} initialNames={documentNames(state)} initialQuery={q} />
    </>
  );
}
