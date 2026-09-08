import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

/** Mars glyph, used for male. */
export function MaleGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="10" cy="14" r="5.5" />
      <path d="M14 10l6-6M15 4h5v5" />
    </svg>
  );
}

/** Venus glyph, used for female. */
export function FemaleGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M12 14.5V21M9 18h6" />
    </svg>
  );
}

export function KeyGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="8" cy="14" r="4.5" />
      <path d="M11.5 11.5L20 3M16.5 6.5l2.5 2.5M14 9l2 2" />
    </svg>
  );
}

export function CopyGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}

export function CheckGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function ArrowGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function WarnGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M12 3.5l9 16h-18l9-16z" />
      <path d="M12 10v4.5M12 17.5v.5" />
    </svg>
  );
}

export function BoltGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />
    </svg>
  );
}

export function LockGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function GlobeGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 3.8 5.4 3.8 8.5s-1.3 5.9-3.8 8.5c-2.5-2.6-3.8-5.4-3.8-8.5S9.5 6.1 12 3.5z" />
    </svg>
  );
}

export function SealGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M12 3l2.2 1.6 2.7-.3 1 2.5 2.5 1-.3 2.7L21.5 12l-1.6 2.2.3 2.7-2.5 1-1 2.5-2.7-.3L12 21l-2.2-1.6-2.7.3-1-2.5-2.5-1 .3-2.7L2.5 12l1.6-2.2-.3-2.7 2.5-1 1-2.5 2.7.3L12 3z" />
      <path d="M9 12.5l2 2 4-4.5" />
    </svg>
  );
}

export function TerminalGlyph(p: P) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M7 9l3 3-3 3M12.5 15H17" />
    </svg>
  );
}

export function SpinnerGlyph(p: P) {
  const { className = "", ...rest } = p;
  return (
    <svg {...base(rest)} className={`animate-spin ${className}`}>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
    </svg>
  );
}
