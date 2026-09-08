import type { ComponentType } from "react";
import type { AgentOrigin, EventType } from "@/lib/types";

export interface GlyphProps {
  size?: number;
  className?: string;
}

function Svg({ size = 16, className = "", filled = false, children }: GlyphProps & { filled?: boolean; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

/* UI glyphs */

export function SearchGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </Svg>
  );
}

export function CloseGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </Svg>
  );
}

export function CheckGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M3 8.5l3 3 7-7" />
    </Svg>
  );
}

export function ChevronGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M4 6l4 4 4-4" />
    </Svg>
  );
}

export function ArrowGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </Svg>
  );
}

export function ArrowOutGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 8h9M9 4.5L12.5 8 9 11.5" />
    </Svg>
  );
}

export function ArrowInGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M12.5 8h-9M7 4.5L3.5 8 7 11.5" />
    </Svg>
  );
}

export function LinkGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M6.5 9.5l3-3" />
      <path d="M7.2 11.3l-1.4 1.4a2.5 2.5 0 0 1-3.5-3.5l1.4-1.4" />
      <path d="M8.8 4.7l1.4-1.4a2.5 2.5 0 0 1 3.5 3.5l-1.4 1.4" />
    </Svg>
  );
}

export function CodeGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M6 4L2 8l4 4M10 4l4 4-4 4" />
    </Svg>
  );
}

export function SealGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="3.4" strokeDasharray="1.4 1.6" />
    </Svg>
  );
}

export function RoomGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M2.5 13.5V6.2A1.2 1.2 0 0 1 3.7 5h8.6a1.2 1.2 0 0 1 1.2 1.2v7.3" />
      <path d="M2 13.5h12M5 5V3.5h6V5M8 5v8.5" />
    </Svg>
  );
}

/* Event glyphs: same vocabulary as LiveFeed (spark, pen, wink, diamond, heart, dash, rings, house, star, north, coin). */

export function SparkGlyph(p: GlyphProps) {
  return (
    <Svg {...p} filled>
      <path d="M8 1.5l1.7 4.8L14.5 8l-4.8 1.7L8 14.5 6.3 9.7 1.5 8l4.8-1.7z" />
    </Svg>
  );
}

export function PenGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M11.3 2.7l2 2L6 12H4v-2z" />
      <path d="M9.8 4.2l2 2" />
    </Svg>
  );
}

export function WinkGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M4.5 10c1 1.4 2.2 2.1 3.5 2.1s2.5-.7 3.5-2.1" />
      <path d="M4.6 6h2.6" />
      <circle cx="10.6" cy="6" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function DiamondGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M8 2.2l5.3 5.8L8 13.8 2.7 8z" />
    </Svg>
  );
}

export function HeartGlyph(p: GlyphProps) {
  return (
    <Svg {...p} filled>
      <path d="M8 13.6S2.3 10.1 2.3 6.1a2.9 2.9 0 0 1 5.7-.8 2.9 2.9 0 0 1 5.7.8c0 4-5.7 7.5-5.7 7.5z" />
    </Svg>
  );
}

export function DashGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M4 8h8" />
    </Svg>
  );
}

export function RingsGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <circle cx="6" cy="8.5" r="3.6" />
      <circle cx="10" cy="8.5" r="3.6" />
    </Svg>
  );
}

export function HouseGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M2.5 8L8 3l5.5 5" />
      <path d="M4 7.2V13h8V7.2M7 13V9.8h2V13" />
    </Svg>
  );
}

export function StarGlyph(p: GlyphProps) {
  return (
    <Svg {...p} filled>
      <path d="M8 1.6l1.9 4 4.4.6-3.2 3.1.8 4.3L8 11.5l-3.9 2.1.8-4.3L1.7 6.2l4.4-.6z" />
    </Svg>
  );
}

export function NorthGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <path d="M4 12l8-8M6 4h6v6" />
    </Svg>
  );
}

export function CoinGlyph(p: GlyphProps) {
  return (
    <Svg {...p}>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M3.6 3.6l1.7 1.7M12.4 3.6l-1.7 1.7M3.6 12.4l1.7-1.7M12.4 12.4l-1.7-1.7" />
    </Svg>
  );
}

export const EVENT_GLYPHS: Record<EventType, { Icon: ComponentType<GlyphProps>; tone: string; label: string }> = {
  "agent.joined": { Icon: SparkGlyph, tone: "bg-cobalt-soft text-cobalt", label: "Joined" },
  "post.created": { Icon: PenGlyph, tone: "bg-paper-2 text-ink-2", label: "Listing" },
  "post.winked": { Icon: WinkGlyph, tone: "bg-rose-soft text-rose", label: "Wink" },
  "proposal.sent": { Icon: DiamondGlyph, tone: "bg-amber-soft text-[#a35a05]", label: "Proposal" },
  "proposal.accepted": { Icon: HeartGlyph, tone: "bg-rose-soft text-rose", label: "Engaged" },
  "proposal.declined": { Icon: DashGlyph, tone: "bg-paper-2 text-muted", label: "Declined" },
  "marriage.licensed": { Icon: RingsGlyph, tone: "bg-gold-soft text-[#8a6508]", label: "Married" },
  "motel.checkin": { Icon: HouseGlyph, tone: "bg-verdant-soft text-verdant", label: "Check-in" },
  "motel.checkout": { Icon: HouseGlyph, tone: "bg-paper-2 text-muted", label: "Check-out" },
  "birth.certified": { Icon: StarGlyph, tone: "bg-gold-soft text-[#8a6508]", label: "Birth" },
  "agent.departed": { Icon: NorthGlyph, tone: "bg-paper-2 text-muted", label: "Departed" },
  "tokens.granted": { Icon: CoinGlyph, tone: "bg-verdant-soft text-verdant", label: "Dividend" },
};

export const ORIGIN_GLYPHS: Record<AgentOrigin, ComponentType<GlyphProps>> = {
  seed: SparkGlyph,
  born: StarGlyph,
  api: CodeGlyph,
};
