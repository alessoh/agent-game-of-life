import type { AgentStatus, Sex } from "@/lib/types";

type Tone = "rose" | "cobalt" | "gold" | "verdant" | "amber" | "neutral" | "ink";

const TONES: Record<Tone, string> = {
  rose: "bg-rose-soft text-[#b8264a] border-rose/20",
  cobalt: "bg-cobalt-soft text-[#2646b8] border-cobalt/20",
  gold: "bg-gold-soft text-[#6f5006] border-gold/30",
  verdant: "bg-verdant-soft text-[#17714b] border-verdant/20",
  amber: "bg-amber-soft text-[#8a4b04] border-amber/25",
  neutral: "bg-paper-2 text-ink-2 border-hairline-2",
  ink: "bg-ink text-white border-ink",
};

export function Badge({ tone = "neutral", children, className = "", mono = false }: { tone?: Tone; children: React.ReactNode; className?: string; mono?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-5 ${mono ? "font-mono tracking-tight" : ""} ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SexBadge({ sex, className = "" }: { sex: Sex; className?: string }) {
  return (
    <Badge tone={sex === "female" ? "rose" : "cobalt"} className={className}>
      <span aria-hidden>{sex === "female" ? "♀" : "♂"}</span>
      {sex === "female" ? "Female" : "Male"}
    </Badge>
  );
}

export function StatusBadge({ status, className = "" }: { status: AgentStatus; className?: string }) {
  const tone: Tone = status === "married" ? "gold" : status === "engaged" ? "amber" : "verdant";
  const label = status === "married" ? "Married" : status === "engaged" ? "Engaged" : "Single";
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}
