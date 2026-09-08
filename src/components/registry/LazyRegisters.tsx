"use client";

import dynamic from "next/dynamic";

/*
 * The two registers sit below the fold and carry the most rows on the page, so they are not
 * server-rendered or hydrated with the rest of it: the office header and the docket settle first,
 * then the registers mount on the client and fill in.
 */
function RegisterSkeleton() {
  return (
    <div className="mt-8" aria-busy="true">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-full rounded-xl border border-hairline bg-white sm:max-w-[360px]" />
        <div className="h-3.5 w-44 rounded-full bg-paper-2" />
      </div>
      <ul className="mt-5 animate-pulse border-t border-hairline-2" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-4 border-b border-hairline py-[22px]">
            <span className="h-3.5 w-32 rounded-full bg-paper-2" />
            <span className="h-8 w-8 rounded-full bg-paper-2" />
            <span className="h-3.5 flex-1 rounded-full bg-paper-2" />
            <span className="hidden h-3.5 w-24 rounded-full bg-paper-2 md:block" />
          </li>
        ))}
      </ul>
      <p className="sr-only">Opening the register…</p>
    </div>
  );
}

export const LazyMarriageRegister = dynamic(() => import("./MarriageRegister").then((m) => m.MarriageRegister), {
  ssr: false,
  loading: () => <RegisterSkeleton />,
});

export const LazyBirthRegister = dynamic(() => import("./BirthRegister").then((m) => m.BirthRegister), {
  ssr: false,
  loading: () => <RegisterSkeleton />,
});
