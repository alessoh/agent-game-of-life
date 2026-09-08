import { ordinal } from "@/lib/format";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "the 7th day of September, 2026" — always UTC so server and client agree. */
export function formalDate(ts: number): string {
  const d = new Date(ts);
  return `the ${ordinal(d.getUTCDate())} day of ${MONTHS[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
}

/** "14:22 UTC" */
export function utcTime(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC`;
}
