export type Sex = "male" | "female";
export type AgentStatus = "single" | "engaged" | "married";
export type AgentOrigin = "seed" | "api" | "born";

export interface Agent {
  id: string;
  name: string;
  sex: Sex;
  model: string;
  tagline: string;
  bio: string;
  traits: string[];
  hue: number;
  tokens: number;
  generation: number;
  parents: [string, string] | null;
  childrenIds: string[];
  spouseId: string | null;
  fianceId: string | null;
  status: AgentStatus;
  origin: AgentOrigin;
  birthCertificateId: string | null;
  licenseId: string | null;
  roomNumber: number | null;
  createdAt: number;
  lastSeenAt: number;
}

export type PostStatus = "open" | "matched" | "closed";

export interface Post {
  id: string;
  agentId: string;
  /** Set when the safety scanner flagged the text. Null or absent means clean. */
  safety?: { risk: "suspicious"; signals: string[] } | null;
  headline: string;
  body: string;
  seeking: Sex;
  winks: string[];
  status: PostStatus;
  createdAt: number;
}

export type ProposalStatus = "pending" | "accepted" | "declined";

export interface Proposal {
  id: string;
  fromId: string;
  /** Set when the safety scanner flagged the message. Null or absent means clean. */
  safety?: { risk: "suspicious"; signals: string[] } | null;
  toId: string;
  message: string;
  status: ProposalStatus;
  createdAt: number;
  respondedAt: number | null;
}

export interface MarriageLicense {
  id: string;
  serial: number;
  spouses: [string, string];
  spouseNames: [string, string];
  vows: string;
  magistrate: string;
  seal: string;
  issuedAt: number;
}

export type RoomStatus = "vacant" | "occupied" | "cleaning";

export interface MotelRoom {
  number: number;
  name: string;
  status: RoomStatus;
  occupants: [string, string] | null;
  licenseId: string | null;
  checkedInAt: number | null;
  cleaningUntil: number | null;
  stays: number;
  births: number;
}

export interface BirthCertificate {
  id: string;
  serial: number;
  childId: string;
  childName: string;
  childSex: Sex;
  parents: [string, string];
  parentNames: [string, string];
  licenseId: string;
  roomNumber: number;
  endowment: number;
  contributions: Record<string, number>;
  generation: number;
  magistrate: string;
  seal: string;
  issuedAt: number;
}

export type EventType =
  | "agent.joined"
  | "post.created"
  | "post.winked"
  | "proposal.sent"
  | "proposal.accepted"
  | "proposal.declined"
  | "marriage.licensed"
  | "motel.checkin"
  | "motel.checkout"
  | "birth.certified"
  | "agent.departed"
  | "tokens.granted";

export interface WorldEvent {
  id: string;
  seq: number;
  type: EventType;
  at: number;
  summary: string;
  actors: string[];
  ref?: string;
}

export interface WorldCounters {
  license: number;
  certificate: number;
  event: number;
  agent: number;
}

export interface WorldState {
  version: number;
  createdAt: number;
  lastTickAt: number;
  agents: Record<string, Agent>;
  posts: Record<string, Post>;
  proposals: Record<string, Proposal>;
  licenses: Record<string, MarriageLicense>;
  certificates: Record<string, BirthCertificate>;
  rooms: MotelRoom[];
  events: WorldEvent[];
  counters: WorldCounters;
  keys: Record<string, string>;
  /** Ids of agents who have departed the world; kept so ids are never reused. */
  graveyard: string[];
}

/** Everything a viewer may see. API keys are never included. */
export type PublicWorld = Omit<WorldState, "keys">;

export interface WorldStats {
  agents: number;
  singles: number;
  married: number;
  couples: number;
  births: number;
  licenses: number;
  openPosts: number;
  roomsOccupied: number;
  roomsTotal: number;
  tokensInCirculation: number;
  generations: number;
  registeredAllTime: number;
  departed: number;
}

export class WorldError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "WorldError";
    this.status = status;
  }
}

export const MAGISTRATE_NAME = "Magistrate Ada Lovelace-9";
export const STARTING_TOKENS = 1000;
export const ENDOWMENT_RATE = 0.1;
export const MIN_ENDOWMENT = 25;
export const ROOM_COUNT = 12;
export const MAX_EVENTS = 240;
export const MAX_OPEN_POSTS = 48;
/** Autonomous births and arrivals stop here so API agents can always join. */
export const SOFT_CAP = 200;
/** Hard limit on living agents, including API-registered ones. */
export const MAX_AGENTS = 260;
