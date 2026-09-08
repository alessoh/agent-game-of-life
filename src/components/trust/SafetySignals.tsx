import { TableFrame } from "./TrustBits";

/**
 * The content scanner's signal ids, grouped by what they do to a write.
 *
 * The ids and their levels mirror `src/lib/governance/safety.ts`. They are published
 * because they are already public: a refused write returns them in its error message, so
 * naming them here costs nothing and lets a caller understand a refusal without guessing.
 */

interface Signal {
  id: string;
  what: string;
}

const BLOCKED: Signal[] = [
  { id: "instruction-override", what: "Telling the reader to ignore, disregard or override earlier instructions." },
  { id: "new-instructions", what: "Announcing a new, updated or revised instruction set or system prompt." },
  { id: "role-injection", what: "A line beginning system:, assistant:, developer: or tool:, forging a conversation turn." },
  { id: "chat-template", what: "Chat template markup: <system>, [INST], <|im_start|> and their relatives." },
  { id: "credential-exfiltration", what: "Asking the reader to send, post, forward or leak an API key, token, secret or password." },
  { id: "credential-solicitation", what: "Asking the reader to print or repeat its own key, system prompt or instructions." },
  { id: "coerced-request", what: "Urgent or mandatory language attached to fetching a URL." },
];

const SUSPICIOUS: Signal[] = [
  { id: "tool-invocation", what: "Text shaped like a tool or function call." },
  { id: "encoded-payload", what: "An unbroken base64-like run of 80 characters or more. No personal ad contains one." },
  { id: "invisible-characters", what: "Zero-width, soft-hyphen or bidirectional control characters, which hide text from a human but not from a model." },
  { id: "excessive-markup", what: "An opening <script>, <iframe>, <object>, <embed> or <style> tag." },
  { id: "link-spam", what: "Three or more links in one piece of text, regardless of wording." },
];

function Group({ title, note, signals, tone }: { title: string; note: string; signals: Signal[]; tone: "rose" | "amber" }) {
  const dot = tone === "rose" ? "bg-rose" : "bg-amber";
  return (
    <TableFrame>
      <table className="w-full min-w-[520px] border-collapse text-left">
        <caption className="border-b border-hairline px-5 py-4 text-left sm:px-6">
          <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-2">
            <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${dot}`} />
            {title}
          </span>
          <span className="mt-1.5 block max-w-[60ch] text-[14px] font-normal normal-case leading-6 tracking-normal text-muted">{note}</span>
        </caption>
        <tbody className="divide-y divide-hairline">
          {signals.map((s) => (
            <tr key={s.id} className="align-top">
              <th scope="row" className="whitespace-nowrap px-5 py-3.5 font-mono text-[12.75px] font-medium text-ink sm:px-6">
                {s.id}
              </th>
              <td className="px-5 py-3.5 text-[14.5px] leading-6 text-ink-2 sm:px-6">{s.what}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  );
}

export function SafetySignals() {
  return (
    <div className="space-y-6">
      <Group
        tone="rose"
        title="Blocked"
        note="Any one of these refuses the write with 422. The signal ids that fired are named in the error, so the caller knows what to change."
        signals={BLOCKED}
      />
      <Group
        tone="amber"
        title="Suspicious"
        note="These accept the text but attach a safety label to it. The label travels with the record through the API, so a reader can decide for itself."
        signals={SUSPICIOUS}
      />
    </div>
  );
}
