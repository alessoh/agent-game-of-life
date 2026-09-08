"use client";

import { useMemo, useState } from "react";
import { useWorld } from "@/components/world/WorldProvider";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { pluralize } from "@/lib/format";
import type { Agent, MarriageLicense } from "@/lib/types";
import { PartyAvatar } from "./PartyAvatar";
import { DocumentLink, EmptyRows, LABELLED, NameLink, PAGE_SIZE, RegisterToolbar, SealChip, SerialCell, ShowMore, TABLE, TBODY, TD, TH, THEAD, TR, matches } from "./registerShared";

/** The Register of Marriages: every license, newest first, searchable by name or serial. Live. */
export function MarriageRegister({ initial, initialAgents }: { initial: MarriageLicense[]; initialAgents: Record<string, Agent> }) {
  const { world } = useWorld();
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  // Licenses with a higher serial than anything present at first render arrived live.
  const [baseline] = useState(() => initial.reduce((m, l) => Math.max(m, l.serial), 0));

  const agents = world?.agents ?? initialAgents;
  const licenses = useMemo(() => [...(world ? Object.values(world.licenses) : initial)].sort((a, b) => b.serial - a.serial), [world, initial]);
  const filtered = useMemo(() => licenses.filter((l) => matches(query, l.spouseNames[0], l.spouseNames[1], l.id, l.serial, l.seal)), [licenses, query]);
  const visible = filtered.slice(0, shown);
  const searching = query.trim() !== "";

  return (
    <div className="mt-8">
      <RegisterToolbar
        label="Search the register of marriages"
        placeholder="Search by name or serial"
        query={query}
        onQuery={(q) => {
          setQuery(q);
          setShown(PAGE_SIZE);
        }}
        summary={
          searching ? (
            <>
              {pluralize(filtered.length, "match", "matches")} of {pluralize(licenses.length, "license")}
            </>
          ) : (
            <>
              {pluralize(licenses.length, "license")} on file · newest first
            </>
          )
        }
      />

      <div className="mt-5">
        {visible.length === 0 ? (
          <EmptyRows>{searching ? `No license answers to “${query.trim()}”.` : "No marriages yet. The magistrate is waiting."}</EmptyRows>
        ) : (
          <table className={`${TABLE} md:table-fixed`}>
            <thead className={THEAD}>
              <tr>
                <th scope="col" className={`${TH} w-[176px]`}>
                  License
                </th>
                <th scope="col" className={TH}>
                  Spouses
                </th>
                <th scope="col" className={`${TH} w-[34%] md:max-lg:hidden`}>
                  Vows
                </th>
                <th scope="col" className={`${TH} w-[112px]`}>
                  Issued
                </th>
                <th scope="col" className={`${TH} w-[116px] xl:table-cell max-xl:hidden`}>
                  Seal
                </th>
                <th scope="col" className={`${TH} w-[92px] text-right`}>
                  <span className="sr-only">Document</span>
                </th>
              </tr>
            </thead>
            <tbody className={TBODY}>
              {visible.map((l) => {
                const [groomId, brideId] = l.spouses;
                const [groomName, brideName] = l.spouseNames;
                const groom = agents[groomId];
                const bride = agents[brideId];
                const href = `/registry/licenses/${l.id}`;
                const fresh = l.serial > baseline;
                return (
                  <tr key={l.id} className={`${TR} ${fresh ? "feed-in" : ""}`}>
                    <td className={`${TD} ${LABELLED}`} data-label="License">
                      <SerialCell id={l.id} serial={l.serial} href={href} fresh={fresh} />
                    </td>
                    <td className={`${TD} ${LABELLED} max-md:col-span-2`} data-label="Spouses">
                      <div className="flex items-center gap-3">
                        <div className="flex shrink-0 -space-x-2">
                          <PartyAvatar agent={groom} name={groomName} size={32} />
                          <PartyAvatar agent={bride} name={brideName} size={32} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold leading-5">
                            <NameLink id={groomId} name={groomName} present={!!groom} /> <span className="font-display italic font-normal text-[#8a6508]">&amp;</span>{" "}
                            <NameLink id={brideId} name={brideName} present={!!bride} />
                          </div>
                          <div className="mt-0.5 truncate font-mono text-[11.5px] text-faint">
                            {groomId} · {brideId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`${TD} ${LABELLED} max-md:col-span-2 md:max-lg:hidden`} data-label="Vows">
                      <p className="line-clamp-2 font-display text-[15px] italic leading-[1.4] text-ink-2">&ldquo;{l.vows}&rdquo;</p>
                    </td>
                    <td className={`${TD} ${LABELLED}`} data-label="Issued">
                      <span className="text-[13.5px] text-ink-2">
                        <TimeAgo ts={l.issuedAt} />
                      </span>
                    </td>
                    <td className={`${TD} ${LABELLED} xl:table-cell max-xl:hidden`} data-label="Seal">
                      <SealChip seal={l.seal} />
                    </td>
                    <td className={`${TD} md:text-right max-md:col-span-2`}>
                      <DocumentLink href={href} label="Certificate" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-5">
        <ShowMore remaining={filtered.length - visible.length} onClick={() => setShown((n) => n + PAGE_SIZE)} />
      </div>
    </div>
  );
}
