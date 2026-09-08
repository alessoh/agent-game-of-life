import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, className = "", ...rest }: GlyphProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: `shrink-0 ${className}`,
    ...rest,
  };
}

/** A closed, winking eye with three lashes. */
export function WinkGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 6.5c1.6 2.6 4 3.6 5.5 3.6s3.9-1 5.5-3.6" />
      <path d="M4.6 9.4l-.9 1.6M8 10.3v1.9M11.4 9.4l.9 1.6" />
    </svg>
  );
}

/** A ring with a small stone: the proposal. */
export function RingGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8" cy="10.2" r="3.6" />
      <path d="M6.2 4.6L8 2.4l1.8 2.2L8 6.6z" />
    </svg>
  );
}

export function HeartGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 13.4S2.6 10.2 2.6 6.5A2.9 2.9 0 0 1 8 4.9a2.9 2.9 0 0 1 5.4 1.6c0 3.7-5.4 6.9-5.4 6.9z" />
    </svg>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

export function SearchGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <circle cx="7" cy="7" r="4.4" />
      <path d="M10.3 10.3L14 14" />
    </svg>
  );
}

export function ArrowGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function PenGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M10.8 2.7l2.5 2.5L5.2 13.3H2.7v-2.5z" />
      <path d="M9.2 4.3l2.5 2.5" />
    </svg>
  );
}

export function CloseGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function SpinnerGlyph({ className = "", ...rest }: GlyphProps) {
  return (
    <svg {...base({ ...rest, className: `animate-spin ${className}` })}>
      <circle cx="8" cy="8" r="5.5" strokeOpacity="0.25" />
      <path d="M13.5 8a5.5 5.5 0 0 0-5.5-5.5" />
    </svg>
  );
}

/** An empty noticeboard with a single pin. */
export function BoardGlyph(props: GlyphProps) {
  return (
    <svg {...base({ size: 28, ...props })}>
      <rect x="2" y="3.5" width="12" height="9" rx="1.6" />
      <path d="M5.5 7h5M5.5 9.5h3" />
      <circle cx="8" cy="3.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KeyGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <circle cx="5.5" cy="8" r="3" />
      <path d="M8.5 8h5M11.5 8v2.2M13.5 8v1.6" />
    </svg>
  );
}

/** Placeholder avatar for an agent that has left the world. */
export function DepartedAvatar({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Departed agent" className={`shrink-0 rounded-full ${className}`}>
      <circle cx="32" cy="32" r="31" fill="#f4f2ec" stroke="rgba(20,20,22,0.18)" strokeWidth="1.5" strokeDasharray="4 4" />
      <path d="M22 40c2-8 18-8 20 0" stroke="#a4a4ab" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="26" cy="27" r="2.6" fill="#a4a4ab" />
      <circle cx="38" cy="27" r="2.6" fill="#a4a4ab" />
    </svg>
  );
}

/** A prompt chevron with a cursor line: the API. */
export function TerminalGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 4.5l4 3.5-4 3.5M8.5 11.5H13" />
    </svg>
  );
}

/** A heartbeat trace: live activity. */
export function PulseGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M1.5 8h2.6l1.6-3.6 2.4 7.2 1.9-5.2 1.1 1.6h3.4" />
    </svg>
  );
}
