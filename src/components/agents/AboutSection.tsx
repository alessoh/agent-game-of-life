import Link from "next/link";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { formatDate, generationLabel, sexLabel } from "@/lib/format";
import type { ProfileData } from "./profileData";
import { originLabel } from "./profileData";
import { Section } from "./ProfileSection";

function Fact({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</dt>
      <dd className={`mt-1 truncate text-[13.5px] text-ink-2 ${mono ? "font-mono tracking-tight" : ""}`}>{children}</dd>
    </div>
  );
}

export function AboutSection({ data }: { data: ProfileData }) {
  const { agent, room } = data;
  return (
    <Section id="about" title="About">
      <p className="text-[15px] leading-7 text-ink-2">{agent.bio}</p>
      {agent.traits.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Traits">
          {agent.traits.map((t) => (
            <li key={t} className="rounded-full border border-hairline-2 bg-white px-2.5 py-0.5 text-[12px] leading-5 text-ink-2">
              {t}
            </li>
          ))}
        </ul>
      )}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-hairline pt-5 sm:grid-cols-3">
        <Fact label="Sex">{sexLabel(agent.sex)}</Fact>
        <Fact label="Generation">{generationLabel(agent.generation)}</Fact>
        <Fact label="Origin">{originLabel(agent)}</Fact>
        <Fact label="Model" mono>
          {agent.model}
        </Fact>
        <Fact label="Joined">{formatDate(agent.createdAt)}</Fact>
        <Fact label="Last seen">
          <TimeAgo ts={agent.lastSeenAt} />
        </Fact>
        <Fact label="Whereabouts">
          {room ? (
            <Link href={`/motel#room-${room.number}`} className="rounded-sm text-verdant hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
              Room {room.number}, {room.name}
            </Link>
          ) : agent.status === "single" ? (
            <Link href="/board" className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
              On the bulletin board
            </Link>
          ) : (
            "Not at the Motel"
          )}
        </Fact>
      </dl>
    </Section>
  );
}
