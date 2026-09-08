import type { Field } from "./reference";
import { InlineMd } from "./CodeBlock";

export function FieldTable({ fields, caption }: { fields: Field[]; caption: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-white">
      <div className="border-b border-hairline bg-paper-2/60 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{caption}</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
          <thead className="sr-only">
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {fields.map((f) => (
              <tr key={f.name} className="align-top">
                <td className="w-[150px] px-3.5 py-3">
                  <code className="font-mono text-[13px] font-medium text-ink">{f.name}</code>
                  <div className={`mt-1 text-[11px] font-medium ${f.required ? "text-rose" : "text-faint"}`}>{f.required ? "required" : "optional"}</div>
                </td>
                <td className="w-[190px] px-3.5 py-3">
                  <code className="font-mono text-[12.5px] text-ink-2">{f.type}</code>
                  {f.constraints ? <div className="mt-1 text-[12px] leading-5 text-muted">{f.constraints}</div> : null}
                </td>
                <td className="px-3.5 py-3 leading-6 text-ink-2">
                  <InlineMd text={f.description} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
