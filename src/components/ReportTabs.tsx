import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { CompSearchPanel } from '@/components/CompSearchPanel';
import { cn, fmtTime } from '@/lib/utils';
import type {
  AppendicesOutput,
  BioOutput,
  Customer,
  EconomicsOutput,
  EntityData,
  ExecSummaryOutput,
  RegulationsOutput,
  ReportOutput,
  TransactionalOutput,
} from '@/lib/types';

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function ReportTabs({ customer }: { customer: Customer }) {
  const fetch = customer.steps.fetch.output as EntityData | undefined;
  const bio = customer.steps.bio.output as BioOutput | undefined;
  const tx = customer.steps.transactional.output as TransactionalOutput | undefined;
  const econ = customer.steps.economics.output as EconomicsOutput | undefined;
  const appx = customer.steps.appendices.output as AppendicesOutput | undefined;
  const regs = customer.steps.regulations.output as RegulationsOutput | undefined;
  const exec = customer.steps.execsum.output as ExecSummaryOutput | undefined;
  const report = customer.steps.report.output as ReportOutput | undefined;

  return (
    <Tabs defaultValue="economics" className="mt-2">
      <TabsList>
        <TabsTrigger value="execsum">Exec Summary</TabsTrigger>
        <TabsTrigger value="bio">Company Bio</TabsTrigger>
        <TabsTrigger value="fetch">Entity Data</TabsTrigger>
        <TabsTrigger value="transactional">Transactional</TabsTrigger>
        <TabsTrigger value="economics">Economic Analysis</TabsTrigger>
        <TabsTrigger value="regulations">Regulations</TabsTrigger>
        <TabsTrigger value="appendices">Appendices</TabsTrigger>
        <TabsTrigger value="report">Full Report</TabsTrigger>
      </TabsList>

      <TabsContent value="execsum">
        {exec ? (
          <div className="text-sm">
            <p className="leading-relaxed">{exec.summary}</p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              {exec.keyFindings.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        ) : <Empty />}
      </TabsContent>

      <TabsContent value="bio">
        {bio ? (
          <div className="text-sm">
            <p className="leading-relaxed">{bio.overview}</p>
            <div className="mt-4 rounded-md border border-border bg-muted p-3">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Org Chart</div>
              <pre className="whitespace-pre text-xs">{bio.orgChart}</pre>
            </div>
            <div className="mt-3">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Key People</div>
              <ul className="text-sm">{bio.keyPeople.map((p) => <li key={p.name}>{p.name} — {p.role}</li>)}</ul>
            </div>
          </div>
        ) : <Empty />}
      </TabsContent>

      <TabsContent value="fetch">
        {fetch ? (
          <div className="text-sm">
            <div className="grid grid-cols-2 gap-2">
              <KV label="Legal name" value={fetch.legalName} />
              <KV label="TIN" value={fetch.tin} />
              <KV label="Incorporated" value={fetch.incorporated} />
              <KV label="HQ" value={fetch.hqAddress} />
              <KV label="Revenue" value={money(fetch.financials.revenueUsd)} />
              <KV label="Op income" value={money(fetch.financials.opIncomeUsd)} />
            </div>
            <div className="mt-4">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Transactions</div>
              <Table
                headers={['ID', 'Type', 'Counterparty', 'Amount']}
                rows={fetch.transactions.map((t) => [t.id, t.type, t.counterparty, money(t.amountUsd)])}
              />
            </div>
          </div>
        ) : <Empty />}
      </TabsContent>

      <TabsContent value="transactional">
        {tx ? (
          <Table
            headers={['ID', 'Type', 'Tested Party', 'Method', 'PLI', 'Range', 'Tested', 'Conclusion']}
            rows={tx.transactions.map((t) => [
              t.id, t.type, t.testedParty, t.method, t.pli,
              `${t.range.low}% – ${t.range.high}%`,
              `${t.tested.toFixed(2)}%`,
              t.conclusion,
            ])}
          />
        ) : <Empty />}
      </TabsContent>

      <TabsContent value="economics">
        <CompSearchPanel customer={customer} />
        {econ && (
          <div className="mt-6 text-sm">
            <div className="mb-2 text-xs font-semibold uppercase text-muted-fg">Pipeline Economics Output</div>
            <div className="mb-3">
              Interquartile range: <strong>{econ.iqr.q1}% – {econ.iqr.q3}%</strong> (median {econ.iqr.median}%)
            </div>
            <Table
              headers={['Name', 'Country', 'Industry', 'PLI']}
              rows={econ.comparables.map((c) => [c.name, c.country, c.industry, `${c.pli}%`])}
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="regulations">
        {regs ? (
          <div className="text-sm">
            <div className="mb-2 text-xs text-muted-fg">Jurisdiction: <strong>{regs.jurisdiction}</strong></div>
            <ul className="space-y-2">
              {regs.citations.map((c) => (
                <li key={c.code} className="rounded-md border border-border p-3">
                  <div className="font-semibold">{c.code} — {c.title}</div>
                  <div className="mt-1 text-muted-fg">{c.note}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : <Empty />}
      </TabsContent>

      <TabsContent value="appendices">
        {appx ? (
          <ul className="space-y-2 text-sm">
            {appx.items.map((a) => (
              <li key={a.title} className="rounded-md border border-border p-3">
                <div className="font-semibold">{a.title}</div>
                <div className="mt-1 text-muted-fg">{a.body}</div>
              </li>
            ))}
          </ul>
        ) : <Empty />}
      </TabsContent>

      <TabsContent value="report">
        {report ? (
          <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border p-4">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed">{report.markdown}</pre>
          </div>
        ) : <Empty />}
      </TabsContent>
    </Tabs>
  );
}

function Empty() {
  return <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">Not run yet.</div>;
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-fg">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted text-muted-fg">
          <tr>{headers.map((h) => <th key={h} className="px-2 py-1.5 text-left font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">{r.map((cell, j) => <td key={j} className="px-2 py-1.5">{String(cell)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
