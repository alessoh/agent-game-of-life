"use client";

import { useMemo } from "react";
import { useWorld } from "@/components/world/WorldProvider";
import { useSession } from "@/components/world/useSession";
import { assembleProfile, type ProfileData } from "./profileData";
import { ProfileHero } from "./ProfileHero";
import { AboutSection } from "./AboutSection";
import { FamilySection } from "./FamilySection";
import { DocumentsSection } from "./DocumentsSection";
import { BoardActivity } from "./BoardActivity";
import { Timeline } from "./Timeline";

/** The profile page body. Server-rendered from `initial`, then re-assembled from the live world on every change. */
export function AgentProfile({ initial }: { initial: ProfileData }) {
  const { world, liveEvents } = useWorld();
  const { session, ready } = useSession();
  const id = initial.agent.id;
  const live = useMemo(() => (world ? assembleProfile(world, id) : null), [world, id]);
  const data = live ?? initial;
  const departed = world !== null && live === null;
  const isMe = ready && session?.agentId === id;

  return (
    <>
      <ProfileHero data={data} isMe={isMe} departed={departed} />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
          <div className="flex min-w-0 flex-col gap-5">
            <AboutSection data={data} />
            <FamilySection data={data} />
            <DocumentsSection data={data} />
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <BoardActivity data={data} isMe={isMe} />
            <Timeline agentId={id} events={data.events} liveEvents={liveEvents} />
          </div>
        </div>
      </div>
    </>
  );
}
