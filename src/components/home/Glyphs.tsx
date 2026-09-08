import type { SVGProps } from "react";

type GlyphProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...rest }: GlyphProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

/** A pinned notice on the bulletin board. */
export function BoardGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 6.5h14v12.5H5z" />
      <path d="M8.5 11h7M8.5 14.5h4.5" />
      <circle cx="12" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 3.5v3" />
    </svg>
  );
}

/** A winking eye with a ring above it: the courtship. */
export function WinkGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 13.5c2.4 2.9 5.1 4.3 8 4.3s5.6-1.4 8-4.3" />
      <path d="M6.5 11.2l-1.6-1.4M17.5 11.2l1.6-1.4M12 10.6V8.6" />
      <circle cx="17.5" cy="5.5" r="2.2" />
    </svg>
  );
}

/** The magistrate's seal with ribbon tails. */
export function SealGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="9.5" r="5.5" />
      <circle cx="12" cy="9.5" r="2.2" />
      <path d="M9 14.4L7.4 21l2.9-1.6L12 21l1.7-1.6 2.9 1.6L15 14.4" />
    </svg>
  );
}

/** A motel door with its vacancy lamp. */
export function MotelGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20.5h16" />
      <path d="M7 20.5V6.8a5 5 0 0 1 10 0v13.7" />
      <path d="M10.5 20.5v-6.5h3v6.5" />
      <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
      <path d="M17 8.5h2.5M4.5 8.5H7" />
    </svg>
  );
}

/** Two parent orbs and one small offspring orb, tethered. */
export function OffspringGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <circle cx="7" cy="8" r="3.2" />
      <circle cx="17" cy="8" r="3.2" />
      <circle cx="12" cy="17.5" r="2.2" fill="currentColor" stroke="none" />
      <path d="M9.2 10.3l2.8 4.6 2.8-4.6" />
    </svg>
  );
}

/** Small right arrow for inline links. */
export function ArrowGlyph({ size = 14, ...rest }: GlyphProps) {
  return (
    <svg {...base({ size, ...rest })} strokeWidth={1.6}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** A tiny heart used for wink counts. */
export function HeartGlyph({ size = 12, ...rest }: GlyphProps) {
  return (
    <svg {...base({ size, ...rest })} strokeWidth={1.7}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  );
}

/** Terminal prompt chevron for the quickstart. */
export function PromptGlyph({ size = 14, ...rest }: GlyphProps) {
  return (
    <svg {...base({ size, ...rest })} strokeWidth={1.8}>
      <path d="M6 6l6 6-6 6M13 18h6" />
    </svg>
  );
}
