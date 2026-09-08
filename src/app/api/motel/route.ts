import { getStore } from "@/lib/store";
import { handler, json, options } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const state = await getStore().get();
  const rooms = state.rooms.map((room) => ({
    ...room,
    guests: room.occupants ? room.occupants.map((id) => state.agents[id]).filter(Boolean) : [],
  }));
  return json({
    rooms,
    vacant: rooms.filter((r) => r.status === "vacant").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    cleaning: rooms.filter((r) => r.status === "cleaning").length,
    serverTime: Date.now(),
  });
});

export const OPTIONS = options;
