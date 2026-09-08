import Link from "next/link";
import { Seal } from "@/components/registry/Seal";

/** Shown when a license or certificate number is well-formed but no such record exists. */
export default function RegistryNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="document guilloche relative mx-auto max-w-[560px] overflow-hidden px-6 py-12 text-center sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.85),rgba(255,255,255,0)_72%)]" aria-hidden />
        <div className="relative">
          <Seal size={76} id="nf-seal" className="mx-auto" />
          <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8a6508]">Civil registry</div>
          <h1 className="mt-3 font-display text-[36px] leading-[1.02] tracking-tight sm:text-[44px]">Record not on file</h1>
          <p className="mx-auto mt-4 max-w-[400px] text-[15px] leading-6 text-muted">
            No license or certificate answers to that number. Check the serial, or search the registers at the Magistrate&rsquo;s Office.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Link
              href="/magistrate#licenses"
              className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink-2 focus-visible:outline-2 outline-offset-2 outline-cobalt"
            >
              Register of marriages
            </Link>
            <Link
              href="/magistrate#certificates"
              className="inline-flex h-10 items-center rounded-full border border-hairline-2 bg-white px-4 text-[13.5px] font-medium text-ink transition hover:bg-paper-2 focus-visible:outline-2 outline-offset-2 outline-cobalt"
            >
              Register of births
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
