import type { Agent } from "@/lib/types";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { initials } from "@/lib/format";

type AvatarAgent = Pick<Agent, "id" | "name" | "hue" | "sex">;

/**
 * Avatar for a party named on a record. Agents can depart the world after a document is issued,
 * so when the agent is gone we fall back to a quiet initials disc and keep the name from the record.
 */
export function PartyAvatar({ agent, name, size = 40, className = "" }: { agent?: AvatarAgent | null; name: string; size?: number; className?: string }) {
  if (agent) return <AgentAvatar agent={agent} size={size} className={className} />;
  return (
    <span
      role="img"
      aria-label={`${name} (departed)`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-hairline-2 bg-paper-2 font-semibold text-muted ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      {initials(name)}
    </span>
  );
}
