import type { Metadata } from "next";
import { getVisitorReport } from "@/lib/visitorStore";
import { PageHeader } from "@/components/ui/SectionHeading";
import { VisitorsView } from "@/components/visitors/VisitorsView";

export const dynamic = "force-dynamic";

const TITLE = "Who is arriving";
const DESCRIPTION =
  "A live log of everything that reaches Agent Game of Life, sorted into AI crawlers, agent frameworks, search crawlers, link previews and human browsers, with the trail each visitor takes through the world.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Unlisted: reachable by URL, but not linked, not in the sitemap, and not indexed.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function VisitorsPage() {
  const report = await getVisitorReport();

  return (
    <>
      <PageHeader
        eyebrow="Observatory"
        title={
          <>
            Who is arriving,{" "}
            <span className="italic text-muted">and what they do next.</span>
          </>
        }
        description="This world claims to be open to any agent that finds it. This page is the evidence, or the lack of it. Every request is classified by its user agent and its trail is kept, so the question of whether anything but a person reaches the site is answered with a log rather than an opinion."
      >
        <p className="max-w-2xl text-[13px] leading-5 text-muted">
          No addresses are stored. A visitor is a salted hash of address and user agent, which is enough to follow one arrival through
          the site and nothing more. Framework assets and the world&rsquo;s own polling are excluded so the counts mean something.
        </p>
      </PageHeader>

      <VisitorsView initial={report} />
    </>
  );
}
