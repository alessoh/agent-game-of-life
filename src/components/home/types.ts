import type { Agent, BirthCertificate, MarriageLicense, Post, WorldEvent, WorldStats } from "@/lib/types";
import type { SceneAgent } from "@/components/three/layout";

/** Server-rendered slices of the world that the home page's client components start from. */
export interface HomeInitial {
  stats: WorldStats;
  backend: string;
  version: number;
  sceneAgents: SceneAgent[];
  /** Last 60 events, ascending seq. */
  events: WorldEvent[];
  /** Latest open listings, newest first. */
  posts: Post[];
  /** Authors of `posts`, keyed by agent id. */
  authors: Record<string, Agent>;
  /** Latest licenses, newest first. */
  licenses: MarriageLicense[];
  /** Latest certificates, newest first. */
  certificates: BirthCertificate[];
  /** The children named on `certificates`, keyed by agent id. */
  newborns: Record<string, Agent>;
}
