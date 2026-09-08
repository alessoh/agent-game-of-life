import type { RoomStatus } from "@/lib/types";

type GlyphProps = { size?: number; className?: string; strokeWidth?: number };

function base({ size = 20, className = "", strokeWidth = 1.5 }: GlyphProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: `shrink-0 ${className}`,
  };
}

/** A door whose state mirrors the room: swung open when vacant, shut when occupied, ajar with a sparkle while housekeeping is in. */
export function DoorGlyph({ status, ...props }: GlyphProps & { status: RoomStatus }) {
  const p = base(props);
  if (status === "occupied") {
    return (
      <svg {...p}>
        <rect x="6" y="3" width="12" height="18" rx="1.5" fill="currentColor" fillOpacity="0.14" />
        <path d="M3 21h18" />
        <circle cx="14.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (status === "cleaning") {
    return (
      <svg {...p}>
        <path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21" />
        <path d="M3 21h18" />
        <path d="M7 3.5l3.5 1.3v15.4L7 21z" fill="currentColor" fillOpacity="0.14" />
        <path d="M19.5 2.5v3.5M17.75 4.25h3.5" />
        <path d="M21.5 9v2M20.5 10h2" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21" />
      <path d="M3 21h18" />
      <path d="M7 3.5l7 2.6v13.8L7 21z" fill="currentColor" fillOpacity="0.14" />
      <circle cx="12" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function KeyGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H21M18 12v3M21 12v2.5" />
    </svg>
  );
}

export function BellGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 16a7 7 0 0 1 14 0" />
      <path d="M3.5 16h17" />
      <path d="M5 19.5h14" />
      <path d="M12 9V6.5" />
      <circle cx="12" cy="5.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SparkleGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" fill="currentColor" fillOpacity="0.15" />
      <path d="M19 15.5c.2 1.6 1 2.4 2.5 2.5-1.5.2-2.3 1-2.5 2.5-.2-1.5-1-2.3-2.5-2.5 1.5-.1 2.3-.9 2.5-2.5z" />
    </svg>
  );
}

export function StarGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.5l-5.1 2.8 1.1-5.8-4.3-4 5.8-.7z" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}

export function RingsGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="12" r="5.5" />
      <circle cx="15" cy="12" r="5.5" />
    </svg>
  );
}

export function ArrowGlyph(props: GlyphProps) {
  return (
    <svg {...base({ size: 14, strokeWidth: 1.6, ...props })} viewBox="0 0 16 16">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function CrossGlyph(props: GlyphProps) {
  return (
    <svg {...base({ size: 14, strokeWidth: 1.6, ...props })}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function CheckGlyph(props: GlyphProps) {
  return (
    <svg {...base({ size: 14, strokeWidth: 1.8, ...props })}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function SpinnerGlyph(props: GlyphProps) {
  const p = base({ size: 14, strokeWidth: 2, ...props });
  return (
    <svg {...p} className={`${p.className} animate-spin`}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

/** A seedling, for the offspring button. */
export function SproutGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.6 2.6-6 6.5-6 0 3.6-2.6 6-6.5 6z" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 16.5c0-3-2.1-5-5.5-5 0 3 2.1 5 5.5 5z" fill="currentColor" fillOpacity="0.15" />
      <path d="M7 21h10" />
    </svg>
  );
}

/** Out through the door. */
export function ExitGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M3 12h11M10 8l4 4-4 4" />
    </svg>
  );
}
