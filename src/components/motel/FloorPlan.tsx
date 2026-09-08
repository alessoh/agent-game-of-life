"use client";

import { useWorld } from "@/components/world/WorldProvider";
import type { Agent, MarriageLicense, MotelRoom } from "@/lib/types";
import { RoomCard } from "./RoomCard";

/** The twelve rooms, server-rendered first and then kept live by the world stream. */
export function FloorPlan({
  initialRooms,
  initialAgents,
  initialLicenses,
  initialNow,
}: {
  initialRooms: MotelRoom[];
  initialAgents: Record<string, Agent>;
  initialLicenses: Record<string, MarriageLicense>;
  /** Server clock at render; room timers count from it until the client clock takes over. */
  initialNow: number;
}) {
  const { world } = useWorld();
  const rooms = world?.rooms ?? initialRooms;
  const agents = world?.agents ?? initialAgents;
  const licenses = world?.licenses ?? initialLicenses;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room, i) => (
        <RoomCard key={room.number} room={room} agents={agents} licenses={licenses} initialNow={initialNow} index={i} />
      ))}
    </div>
  );
}
