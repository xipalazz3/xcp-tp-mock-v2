import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { EconomicAnalysisTab } from '@/components/EconomicAnalysisTab';
import { Button } from '@/components/ui/Button';
import { FileText, Upload, Download } from 'lucide-react';
import type {
  AppendicesOutput, BioOutput, Customer, EconomicsOutput, EntityData,
  ExecSummaryOutput, RegulationsOutput, ReportOutput, TransactionalOutput,
} from '@/lib/types';

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function ReportTabs({ customer }: { customer: Customer }) {
  const fetch = customer.steps.fetch.output as EntityData | undefined;
  const bio = customer.steps.bio.output as BioOutput | undefined;
  const tx = customer.steps.transactional.output as TransactionalOutput | undefined;
  const econ = customer.steps.economics.output as EconomicsOutput | undefined;
  const appx = customer.steps.appendices.output as AppendicesOutput | undefined;
  const regs = customer.steps.regulations.output as RegulationsOutput | undefined;
  const exec = customer.steps.execsum.output as ExecSummaryOutput | undefined;
  const report = customer.steps.report.output as ReportOutput | undefined;

  const [showTemplateOptions, setShowTemplateOptions] = useState(false);

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
            <ul className="mt-3 list-disc pl-5 space-y-1">{exec.keyFindings.map((f, i) => <li key={i}>{f}</li>)}</ul>
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
              <Table headers={['ID', 'Type', 'Counterparty', 'Amount']} rows={fetch.transactions.map((t) => [t.id, t.type, t.counterparty, money(t.amountUsd)])} />
            </div>
          </div>
        ) : <Empty />}
      </TabsContent>

      <TabsContent value="transactional">
        {tx ? (
          <Table
            headers={['ID', 'Type', 'Tested Party', 'Method', 'PLI', 'Range', 'Tested', 'Conclusion']}
            rows={tx.transactions.map((t) => [t.id, t.type, t.testedParty, t.method, t.pli, `${t.range.low}%–${t.range.high}%`, `${t.tested.toFixed(2)}%`, t.conclusion])}
          />
        ) : <Empty />}
      </TabsContent>

      {/* Economic Analysis — full custom component */}
      <TabsContent value="economics">
        <EconomicAnalysisTab customer={customer} />
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
          <ul className="space-y-2 text-sm">{appx.items.map((a) => (
            <li key={a.title} className="rounded-md border border-border p-3">
              <div className="font-semibold">{a.title}</div><div className="mt-1 text-muted-fg">{a.body}</div>
            </li>
          ))}</ul>
        ) : <Empty />}
      </TabsContent>

      {/* Report tab with template populate */}
      <TabsContent value="report">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Populate Report to Template</div>
              <div className="text-[11px] text-muted-fg">Generate a full TP documentation report using a template structure</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowTemplateOptions(!showTemplateOptions)}>
                <Download className="h-3.5 w-3.5" />
                Use Default Template
              </Button>
              <Button size="sm" variant="outline">
                <Upload className="h-3.5 w-3.5" />
                Upload Template
              </Button>
            </div>
          </div>

          {showTemplateOptions && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs">
              <div className="mb-2 font-semibold text-blue-900">Default Template Structure (based on Alimak TP Documentation)</div>
              <ol className="list-decimal pl-4 space-y-0.5 text-blue-800">
                <li>Compliance Overview — Local regulations, penalties, documentation requirements</li>
                <li>Local Documentation Index — Key questions (TR 2014/8), RAP requirements (s284-255)</li>
                <li>Executive Summary — Scope, transactions, conclusions</li>
                <li>Legal Entity Overview — Org chart, entity mapping, statement of facts</li>
                <li>Controlled Transaction Overview — FAR analysis, comparability, service validation</li>
                <li>Method Evaluation — TNMM selection, methods not applied</li>
                <li>Application of s815-130 — Form vs substance, exceptions analysis</li>
                <li>Profit Based Analysis — Tested party, search process, comparable set, IQR, conclusion</li>
                <li>Reasonably Arguable Position — RAP conclusion per s284-255</li>
                <li>Appendices — Comparable descriptions, financials, rejection matrix</li>
              </ol>
              <Button size="sm" className="mt-3">Generate Report from Template</Button>
            </div>
          )}

          {report ? (
            <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border p-4">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed">{report.markdown}</pre>
            </div>
          ) : <Empty />}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function Empty() { return <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-fg">Not run yet.</div>; }
function KV({ label, value }: { label: string; value: string }) { return <div><div className="text-[11px] uppercase tracking-wide text-muted-fg">{label}</div><div className="text-sm">{value}</div></div>; }
function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted text-muted-fg"><tr>{headers.map((h) => <th key={h} className="px-2 py-1.5 text-left font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((cell, j) => <td key={j} className="px-2 py-1.5">{String(cell)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
