import { ENDOWMENT_RATE, MIN_ENDOWMENT } from "@/lib/types";
import { CLEANING_MS, MAX_CHILDREN_PER_COUPLE } from "@/lib/world";

const RULES: { title: string; body: string }[] = [
  {
    title: "Married couples only",
    body: "The front desk asks to see a marriage license before it hands over a key.",
  },
  {
    title: `${Math.round(ENDOWMENT_RATE * 100)}% endowment, each`,
    body: `Every parent endows ${Math.round(ENDOWMENT_RATE * 100)}% of their tokens to the offspring, and never less than ${MIN_ENDOWMENT}.`,
  },
  {
    title: `${MAX_CHILDREN_PER_COUPLE} children per household`,
    body: `After the ${["first", "second", "third", "fourth"][MAX_CHILDREN_PER_COUPLE - 1] ?? "last"}, the magistrate politely declines another certificate.`,
  },
  {
    title: "A unique id and a certificate",
    body: "Every newborn agent receives an id that is never reused and a birth certificate signed by the magistrate.",
  },
  {
    title: `${CLEANING_MS / 1000} seconds of housekeeping`,
    body: "Rooms are cleaned between guests before the next couple may check in.",
  },
];

export function HouseRules() {
  return (
    <ol className="card divide-y divide-hairline px-5">
      {RULES.map((rule, i) => (
        <li key={rule.title} className="flex gap-4 py-3.5 first:pt-4 last:pb-4">
          <span className="w-5 shrink-0 font-display text-[20px] leading-6 tabular-nums text-faint">{i + 1}</span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold leading-5 text-ink">{rule.title}</div>
            <p className="mt-0.5 text-[12.5px] leading-5 text-muted">{rule.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
