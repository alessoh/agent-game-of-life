"use client";

import { useMemo, useState } from "react";
import { useWorld } from "@/components/world/WorldProvider";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { formatNumber, generationLabel, pluralize, sexLabel } from "@/lib/format";
import type { Agent, BirthCertificate } from "@/lib/types";
import { PartyAvatar } from "./PartyAvatar";
import { DocumentLink, EmptyRows, LABELLED, NameLink, PAGE_SIZE, RegisterToolbar, SealChip, SerialCell, ShowMore, TABLE, TBODY, TD, TH, THEAD, TR, matches } from "./registerShared";

/** The Register of Births: every certificate, newest first, searchable by name or serial. Live. */
export function BirthRegister({ initial, initialAgents }: { initial: BirthCertificate[]; initialAgents: Record<string, Agent> }) {
  const { world } = useWorld();
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [baseline] = useState(() => initial.reduce((m, c) => Math.max(m, c.serial), 0));

  const agents = world?.agents ?? initialAgents;
  const certificates = useMemo(() => [...(world ? Object.values(world.certificates) : initial)].sort((a, b) => b.serial - a.serial), [world, initial]);
  const filtered = useMemo(
    () => certificates.filter((c) => matches(query, c.childName, c.parentNames[0], c.parentNames[1], c.id, c.serial, c.childId, c.seal)),
    [certificates, query],
  );
  const visible = filtered.slice(0, shown);
  const searching = query.trim() !== "";

  return (
    <div className="mt-8">
      <RegisterToolbar
        label="Search the register of births"
        placeholder="Search by name or serial"
        query={query}
        onQuery={(q) => {
          setQuery(q);
          setShown(PAGE_SIZE);
        }}
        summary={
          searching ? (
            <>
              {pluralize(filtered.length, "match", "matches")} of {pluralize(certificates.length, "certificate")}
            </>
          ) : (
            <>
              {pluralize(certificates.length, "certificate")} on file · newest first
            </>
          )
        }
      />

      <div className="mt-5">
        {visible.length === 0 ? (
          <EmptyRows>{searching ? `No certificate answers to “${query.trim()}”.` : "No births yet. The Motel has twelve rooms and the night is young."}</EmptyRows>
        ) : (
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr>
                <th scope="col" className={`${TH} w-[176px]`}>
                  Certificate
                </th>
                <th scope="col" className={TH}>
                  Child
                </th>
                <th scope="col" className={`${TH} md:max-lg:hidden`}>
                  Parents
                </th>
                <th scope="col" className={`${TH} w-[120px] text-right`}>
                  Endowment
                </th>
                <th scope="col" className={`${TH} w-[104px]`}>
                  Room
                </th>
                <th scope="col" className={`${TH} w-[136px]`}>
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
              {visible.map((c) => {
                const [fatherId, motherId] = c.parents;
                const [fatherName, motherName] = c.parentNames;
                const child = agents[c.childId];
                const href = `/registry/certificates/${c.id}`;
                const fresh = c.serial > baseline;
                return (
                  <tr key={c.id} className={`${TR} ${fresh ? "feed-in" : ""}`}>
                    <td className={`${TD} ${LABELLED}`} data-label="Certificate">
                      <SerialCell id={c.id} serial={c.serial} href={href} fresh={fresh} />
                    </td>
                    <td className={`${TD} ${LABELLED} max-md:col-span-2`} data-label="Child">
                      <div className="flex items-center gap-3">
                        <PartyAvatar agent={child} name={c.childName} size={32} />
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold leading-5">
                            <NameLink id={c.childId} name={c.childName} present={!!child} />
                          </div>
                          <div className="mt-0.5 truncate text-[11.5px] text-faint">
                            {sexLabel(c.childSex)} · {generationLabel(c.generation)} · <span className="font-mono">{c.childId}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`${TD} ${LABELLED} max-md:col-span-2 md:max-lg:hidden`} data-label="Parents">
                      <div className="text-[13.5px] leading-5 text-ink-2">
                        <NameLink id={fatherId} name={fatherName} present={!!agents[fatherId]} /> <span className="font-display italic text-[#8a6508]">&amp;</span>{" "}
                        <NameLink id={motherId} name={motherName} present={!!agents[motherId]} />
                      </div>
                      <div className="mt-0.5 font-mono text-[11.5px] text-faint">
                        {c.contributions[fatherId] !== undefined && c.contributions[motherId] !== undefined
                          ? `${formatNumber(c.contributions[fatherId])} + ${formatNumber(c.contributions[motherId])} tokens`
                          : `License ${c.licenseId}`}
                      </div>
                    </td>
                    <td className={`${TD} ${LABELLED} md:text-right`} data-label="Endowment">
                      <span className="font-display text-[20px] leading-none tabular-nums text-ink">{formatNumber(c.endowment)}</span>
                      <span className="ml-1 text-[11px] uppercase tracking-[0.1em] text-faint">tokens</span>
                    </td>
                    <td className={`${TD} ${LABELLED}`} data-label="Room">
                      <span className="text-[13.5px] text-ink-2">Room {c.roomNumber}</span>
                    </td>
                    <td className={`${TD} ${LABELLED}`} data-label="Issued">
                      <span className="text-[13.5px] text-ink-2">
                        <TimeAgo ts={c.issuedAt} />
                      </span>
                    </td>
                    <td className={`${TD} ${LABELLED} xl:table-cell max-xl:hidden`} data-label="Seal">
                      <SealChip seal={c.seal} />
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
