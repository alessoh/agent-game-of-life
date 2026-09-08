import { CodeBlock, InlineMd } from "./CodeBlock";
import { FieldTable } from "./FieldTable";
import { EndpointSignature } from "./MethodBadge";
import { exampleJson, fill, type Endpoint } from "./reference";

const STATUS_TONE = (status: number) => (status === 401 || status === 403 ? "text-[#a35a05] bg-amber-soft border-amber/25" : status >= 500 ? "text-rose bg-rose-soft border-rose/20" : "text-ink-2 bg-paper-2 border-hairline-2");

export function EndpointSection({ endpoint: e, base }: { endpoint: Endpoint; base: string }) {
  return (
    <section id={e.id} className="scroll-mt-24 border-t border-hairline pt-10">
      <h3 className="font-display text-[28px] leading-[1.08] tracking-tight text-ink">{e.title}</h3>
      <div className="mt-3">
        <EndpointSignature method={e.method} path={e.path} auth={e.auth} />
      </div>
      <p className="mt-4 text-[15.5px] leading-7 text-ink-2">
        <InlineMd text={e.summary} />
      </p>
      {e.description.map((p, i) => (
        <p key={i} className="mt-3 text-[15px] leading-7 text-muted">
          <InlineMd text={p} />
        </p>
      ))}

      <div className="mt-6 space-y-5">
        {e.pathParams?.length ? <FieldTable fields={e.pathParams} caption="Path parameters" /> : null}
        {e.query?.length ? <FieldTable fields={e.query} caption="Query parameters" /> : null}
        {e.body?.length ? <FieldTable fields={e.body} caption="Request body · application/json" /> : null}
        <CodeBlock title="Example request" lang="bash" code={fill(e.curl, base)} />
        <CodeBlock title={`Example response · ${e.responseStatus}`} lang={e.id === "stream" ? "sse" : "json"} code={exampleJson(e.responseExample)} />
        {e.notes?.map((n, i) => (
          <p key={i} className="text-[13.5px] leading-6 text-muted">
            <InlineMd text={n} />
          </p>
        ))}
        {e.errors.length ? (
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">Errors</div>
            <ul className="mt-2.5 divide-y divide-hairline rounded-xl border border-hairline bg-white">
              {e.errors.map((err, i) => (
                <li key={i} className="flex items-start gap-3 px-3.5 py-2.5 text-[13.5px] leading-6">
                  <span className={`mt-0.5 inline-flex shrink-0 rounded-md border px-1.5 font-mono text-[12px] font-semibold tabular-nums ${STATUS_TONE(err.status)}`}>{err.status}</span>
                  <span className="text-ink-2">
                    <InlineMd text={err.reason} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
