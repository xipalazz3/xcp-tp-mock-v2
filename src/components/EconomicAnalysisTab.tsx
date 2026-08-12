import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, RotateCcw, Loader2, Sparkles, CheckCircle2, XCircle, PlusCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScenarioSimulation } from '@/components/ScenarioSimulation';
import { useAppStore } from '@/store/useAppStore';
import { COMP_SEARCH_REGIONS, COMP_SEARCH_PLIS } from '@/lib/types';
import type { Customer, CompSearchCriteria, CriteriaRecommendation } from '@/lib/types';
import { cn, computeIQR } from '@/lib/utils';
import { INDUSTRIES, JURISDICTIONS } from '@/lib/mockData';

// ----- Pre-populated comp list (always visible) -----
const COMP_LIST = [
  { name: 'Ambertech Limited', country: 'Australia', sicCode: 'SIC 5065', rev2024: 95456000, rev2023: 84224000, pli: 4.45, acceptReason: 'Distributes technology equipment; functionally comparable value-added distributor', characteristics: 'Distributes home entertainment, integrated solutions, and professional broadcast/AV equipment to dealers and consumers across Australia and New Zealand.', functionalAnalysis: 'Value-added distributor performing local sales, marketing, warehousing, after-sales service, and dealer network management. Does not own non-routine intangibles. Characterized as a value-added distributor.', independence: 'Independent — publicly listed on ASX. No single shareholder owns >50%.', financials: 'FY25: Revenue AUD 101.2M | COGS AUD 68.9M | OpEx AUD 29.8M | OP AUD 2.5M | OM 2.51%' },
  { name: 'Bapcor Limited', country: 'Australia', sicCode: 'SIC 5013', rev2024: 2036938000, rev2023: 2021135000, pli: 7.99, acceptReason: 'Automotive aftermarket parts distributor; comparable distribution, service and rental functions', characteristics: 'Supplies vehicle parts, accessories, automotive equipment, and services. Operates wholesale, retail, and auto service centers in AU/NZ/Thailand.', functionalAnalysis: 'Full-service distributor with wholesale distribution, retail network, and service center operations. Bears market risk, credit risk, inventory risk, and warranty risk. Characterized as a value-added distributor.', independence: 'Independent — publicly listed on ASX (BAP). Widely held, no controlling shareholder.', financials: 'FY25: Revenue AUD 1.98B | COGS AUD 1.08B | OpEx AUD 805M | OP AUD 90.6M | OM 4.59%' },
  { name: 'CDK Stone Pty Ltd', country: 'Australia', sicCode: 'SIC 5032', rev2024: 69947305, rev2023: 69959734, pli: 7.88, acceptReason: 'Natural stone products, consumables and machinery wholesale distributor', characteristics: 'Distributes natural stone products, stone care consumables, and stone processing machinery to the Australian construction and architectural industry.', functionalAnalysis: 'Value-added distributor with warehousing, local sales, customer relations, and after-sales support for machinery. Limited-risk profile, no IP ownership. Characterized as a value-added distributor.', independence: 'Independent — private company, no group ownership identified above independence threshold.', financials: 'FY24: Revenue AUD 69.9M | COGS AUD 39.6M | OpEx AUD 25.7M | OP AUD 4.6M | OM 6.64%' },
  { name: 'Coventry Group Ltd', country: 'Australia', sicCode: 'SIC 5013', rev2024: 370805000, rev2023: 358543000, pli: 2.50, acceptReason: 'Industrial products distributor with fluid systems service component', characteristics: 'Distributes industrial fasteners, stainless steel hardware, hydraulic hose assemblies, and lubrication systems. Also designs and installs fluid systems.', functionalAnalysis: 'Trade distribution and fluid systems segments. Performs import, distribution, marketing, design, and installation functions. Bears market and inventory risk. Characterized as a value-added distributor.', independence: 'Independent — publicly listed on ASX (CYG). No single entity owns >50%.', financials: 'FY25: Revenue AUD 364.6M | COGS AUD 207.4M | OpEx AUD 154.3M | OP AUD 3.0M | OM 0.83%' },
  { name: 'Dicker Data Limited', country: 'Australia', sicCode: 'SIC 5045', rev2024: 2280658000, rev2023: 2266459000, pli: 5.44, acceptReason: 'IT hardware and software wholesale distributor; comparable distribution and logistics model', characteristics: 'Wholesale distribution of IT hardware, software, cloud solutions, and IoT for corporate and commercial markets in AU/NZ.', functionalAnalysis: 'Wholesale distributor with third-party logistics, configuration services, and software licensing. Bears market risk, credit risk, and inventory risk. Characterized as a buy-sell/value-added distributor.', independence: 'Independent — publicly listed on ASX (DDR). Founders hold minority stake.', financials: 'FY25: Revenue AUD 2.57B | COGS AUD 2.21B | OpEx AUD 209M | OP AUD 145.7M | OM 5.68%' },
  { name: 'Hare & Forbes Pty Ltd', country: 'Australia', sicCode: 'SIC 5084', rev2024: 171843026, rev2023: 179331151, pli: 19.23, acceptReason: 'Engineering machinery and workshop equipment distributor; after-sales service comparable', characteristics: 'Distributes new and used engineering machinery, automotive tools, and workshop equipment through retail showrooms and online.', functionalAnalysis: 'Value-added distributor with showroom operations, after-sales service, technical support, and equipment demonstrations. Owns some marketing intangibles. Characterized as a value-added distributor.', independence: 'Independent — private family-owned company. No related party ownership >50%.', financials: 'FY24: Revenue AUD 171.8M | COGS AUD 99.6M | OpEx AUD 44.8M | OP AUD 27.4M | OM 15.96%' },
  { name: 'Supply Network Limited', country: 'Australia', sicCode: 'SIC 5010', rev2024: 302718000, rev2023: 252260000, pli: 15.77, acceptReason: 'Commercial vehicle aftermarket parts distributor; comparable parts interpreting and supply services', characteristics: 'Provides aftermarket parts to the commercial vehicle market (trucks and buses) in AU/NZ under the Multispares brand.', functionalAnalysis: 'Specialist distributor performing procurement, parts interpreting, supply management, and problem solving services. Bears market, credit, and inventory risk. Characterized as a value-added distributor.', independence: 'Independent — publicly listed on ASX (SNL). No controlling shareholder.', financials: 'FY25: Revenue AUD 349.5M | COGS AUD 195.8M | OpEx AUD 95.2M | OP AUD 58.4M | OM 16.72%' },
  { name: 'Stealth Group Holdings', country: 'Australia', sicCode: 'SIC 5080', rev2024: 113680264, rev2023: 110992974, pli: 3.28, acceptReason: 'Industrial MRO distribution with inventory management services', characteristics: 'Distributes industrial maintenance, repairs and operating supplies, PPE, workwear, power tools, hand tools, and hardware.', functionalAnalysis: 'Industrial distributor performing warehousing, inventory management, technical support, and supply chain services. Serves mining, infrastructure, and government. Characterized as a value-added distributor.', independence: 'Independent — publicly listed on ASX (SGI). No entity holds >50%.', financials: 'FY25: Revenue AUD 141.7M | COGS AUD 101.1M | OpEx AUD 34.0M | OP AUD 6.6M | OM 4.68%' },
];

// ----- Similar prior comp lists (mock) -----
const PRIOR_COMP_LISTS = [
  {
    id: 'prior-1',
    entityName: 'TechDist Australia Pty Ltd',
    jurisdiction: 'AU',
    industry: 'Industrial Manufacturing',
    fiscalYear: 2024,
    pli: 'Operating Margin',
    region: 'Asia Pacific',
    minIndependence: 25,
    compCount: 14,
    iqr: '3.8% – 7.2%',
    comps: [
      { name: 'Porter Equipment AU', country: 'Australia', sicCode: 'SIC 5082', pli: 3.89 },
      { name: 'Ramsey Bros Pty Ltd', country: 'Australia', sicCode: 'SIC 5083', pli: 5.57 },
      { name: 'Semco Pty Limited', country: 'Australia', sicCode: 'SIC 5082', pli: 9.86 },
    ],
  },
  {
    id: 'prior-2',
    entityName: 'Alimak Group Denmark A/S',
    jurisdiction: 'DK',
    industry: 'Industrial Manufacturing',
    fiscalYear: 2024,
    pli: 'Operating Margin',
    region: 'Western Europe',
    minIndependence: 30,
    compCount: 11,
    iqr: '4.5% – 9.1%',
    comps: [
      { name: 'Hi-Tec Global Holding', country: 'United Kingdom', sicCode: 'SIC 5084', pli: 10.40 },
      { name: 'Roy Gripske & Sons', country: 'Australia', sicCode: 'SIC 5083', pli: 8.01 },
    ],
  },
  {
    id: 'prior-3',
    entityName: 'CoxGomyl Operations SAU',
    jurisdiction: 'ES',
    industry: 'Industrial Manufacturing',
    fiscalYear: 2023,
    pli: 'Net Cost Plus',
    region: 'Western Europe',
    minIndependence: 25,
    compCount: 9,
    iqr: '5.1% – 12.8%',
    comps: [
      { name: 'NTAW Holdings Limited', country: 'Australia', sicCode: 'SIC 5010', pli: 3.04 },
      { name: 'Dynamic Supplies', country: 'Australia', sicCode: 'SIC 5045', pli: 4.24 },
    ],
  },
];

// ----- Collapsible section wrapper -----
function CollapsibleSection({ title, defaultOpen = true, children, badge }: { title: string; defaultOpen?: boolean; children: React.ReactNode; badge?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md border border-border">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors">
        {open ? <ChevronDown className="h-4 w-4 text-muted-fg" /> : <ChevronRight className="h-4 w-4 text-muted-fg" />}
        <span className="text-sm font-semibold">{title}</span>
        {badge}
      </button>
      {open && <div className="border-t border-border px-4 py-3">{children}</div>}
    </div>
  );
}

// ----- Main component -----
export function EconomicAnalysisTab({ customer }: { customer: Customer }) {
  const runComparablesSearch = useAppStore((s) => s.runComparablesSearch);
  const fetchCriteriaRecommendation = useAppStore((s) => s.fetchCriteriaRecommendation);
  const toolRunning = useAppStore((s) => s.toolRunning);
  const isSearchRunning = toolRunning[`${customer.id}:comp`] ?? false;

  const [mode, setMode] = useState<'prior' | 'new'>('new');
  const [form, setForm] = useState({
    reportingCountry: customer.jurisdiction,
    region: 'Global' as string,
    industry: customer.industry,
    pli: 'Operating Margin' as string,
    minIndependencePct: 25,
    excludeLossMaking: true,
    maxResults: 12,
  });
  const [recommendation, setRecommendation] = useState<CriteriaRecommendation | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, 'accept' | 'reject'>>({});
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [addedFromPrior, setAddedFromPrior] = useState<Set<string>>(new Set());

  // Fetch recommendation on mount
  useState(() => {
    try {
      const rec = fetchCriteriaRecommendation(customer.id);
      setRecommendation(rec);
      setForm((f) => ({
        ...f,
        region: rec.recommendedCriteria.region ?? f.region,
        industry: rec.recommendedCriteria.industry ?? f.industry,
        pli: rec.recommendedCriteria.pli ?? f.pli,
        minIndependencePct: rec.recommendedCriteria.minIndependencePct ?? f.minIndependencePct,
        maxResults: rec.recommendedCriteria.maxResults ?? f.maxResults,
      }));
    } catch {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const criteria: CompSearchCriteria = { reportingCountry: form.reportingCountry, industry: form.industry, region: form.region, pli: form.pli, minIndependencePct: form.minIndependencePct, excludeLossMaking: form.excludeLossMaking, maxResults: form.maxResults };
    await runComparablesSearch(customer.id, criteria);
  };

  const toggleVerdict = (name: string, v: 'accept' | 'reject') => {
    setVerdicts((prev) => ({ ...prev, [name]: prev[name] === v ? undefined as any : v }));
  };

  const addFromPriorList = (compName: string) => {
    setAddedFromPrior((prev) => new Set([...prev, compName]));
  };

  // Compute IQR from accepted
  const acceptedPlis = COMP_LIST.filter((c) => verdicts[c.name] === 'accept').map((c) => c.pli);
  const liveIqr = acceptedPlis.length >= 3 ? computeIQR(acceptedPlis) : null;

  return (
    <div className="space-y-4">
      {/* Section 1: Method & Tested Party */}
      <CollapsibleSection title="Method Applied: TNMM" defaultOpen={false}>
        <div className="text-xs leading-relaxed space-y-2">
          <p>The <strong>Transactional Net Margin Method (TNMM)</strong> was selected as the most appropriate method based on the availability of reliable data and because comparable uncontrolled transactions with which to apply the transactional methods could not be identified reliably.</p>
          <h4 className="font-semibold mt-2">Tested Party Selection</h4>
          <p>The tested party is usually the participant in the transaction for which profit level indicators (PLIs) can be obtained most reliably and for which reliable data on comparable companies can be found. The tested party should not hold any valuable, non-routine intangibles, and should be the least complex entity.</p>
          <div className="mt-2 rounded border border-border bg-muted/30 p-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div><span className="text-muted-fg">Entity:</span> {customer.name}</div>
            <div><span className="text-muted-fg">Segment:</span> Division</div>
            <div><span className="text-muted-fg">Function:</span> Value-Added Distributor</div>
            <div><span className="text-muted-fg">PLI:</span> Operating Margin (OM)</div>
            <div><span className="text-muted-fg">Country:</span> {customer.jurisdiction}</div>
            <div><span className="text-muted-fg">Fiscal Year:</span> FY {customer.fiscalYear}</div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: Search Criteria & Run */}
      <CollapsibleSection title="Comparable Search" badge={
        recommendation ? <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">AI-recommended criteria</span> : undefined
      }>
        <div className="space-y-3">
          {/* Mode selector */}
          <div className="flex gap-2">
            <Button variant={mode === 'prior' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('prior')}>
              <RotateCcw className="h-3.5 w-3.5" /> Search Prior Comp List
            </Button>
            <Button variant={mode === 'new' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('new')}>
              <Search className="h-3.5 w-3.5" /> New Comp Search
            </Button>
          </div>

          {recommendation && mode === 'new' && (
            <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-900">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 text-blue-600" />
              <span><strong>AI Recommendation:</strong> Profile: {recommendation.functionalProfile}. Based on {recommendation.precedents.length} prior searches. Criteria pre-populated below.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Reporting Country"><select className="input py-1 text-xs" value={form.reportingCountry} onChange={(e) => setForm({ ...form, reportingCountry: e.target.value })}>{JURISDICTIONS.map((j) => <option key={j}>{j}</option>)}</select></Field>
              <Field label="Region"><select className="input py-1 text-xs" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>{COMP_SEARCH_REGIONS.map((r) => <option key={r}>{r}</option>)}</select></Field>
              <Field label="Industry"><select className="input py-1 text-xs" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</select></Field>
              <Field label="PLI"><select className="input py-1 text-xs" value={form.pli} onChange={(e) => setForm({ ...form, pli: e.target.value })}>{COMP_SEARCH_PLIS.map((p) => <option key={p}>{p}</option>)}</select></Field>
              <Field label="Min Independence (%)"><input type="number" min={0} max={100} className="input py-1 text-xs" value={form.minIndependencePct} onChange={(e) => setForm({ ...form, minIndependencePct: +e.target.value })} /></Field>
              <Field label="Max Results"><input type="number" min={1} max={25} className="input py-1 text-xs" value={form.maxResults} onChange={(e) => setForm({ ...form, maxResults: +e.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-[11px]">
              <input type="checkbox" checked={form.excludeLossMaking} onChange={(e) => setForm({ ...form, excludeLossMaking: e.target.checked })} className="h-3.5 w-3.5 rounded border-border" />
              Exclude persistent loss-makers
            </label>
            <Button type="submit" disabled={isSearchRunning} className="w-full">
              {isSearchRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isSearchRunning ? 'Searching…' : 'Run New Comp Search'}
            </Button>
          </form>
        </div>
      </CollapsibleSection>

      {/* Section 3: COMP LIST (always visible) */}
      <CollapsibleSection title="Comparable Companies" badge={
        <span className="ml-2 text-[10px] text-muted-fg">{COMP_LIST.length} companies · Click row to expand details · Accept/reject to update IQR</span>
      }>
        <div className="space-y-3">
          {/* Live IQR */}
          {liveIqr && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2">
              <div className="text-[11px] font-semibold text-green-800">Live Interquartile Range ({acceptedPlis.length} accepted)</div>
              <div className="mt-1 flex items-center gap-4 text-sm">
                <span>Q1: <strong>{liveIqr.q1.toFixed(2)}%</strong></span>
                <span>Median: <strong>{liveIqr.median.toFixed(2)}%</strong></span>
                <span>Q3: <strong>{liveIqr.q3.toFixed(2)}%</strong></span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-[11px]">
              <thead className="bg-[#1a5c1a] text-white">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">Company Name</th>
                  <th className="px-2 py-2 text-left font-medium">Country</th>
                  <th className="px-2 py-2 text-left font-medium">SIC Code</th>
                  <th className="px-2 py-2 text-right font-medium">Revenue 2024</th>
                  <th className="px-2 py-2 text-right font-medium">Revenue 2023</th>
                  <th className="px-2 py-2 text-left font-medium">Acceptance Reason</th>
                  <th className="px-2 py-2 text-center font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {COMP_LIST.map((c) => {
                  const v = verdicts[c.name];
                  const isExpanded = expandedComp === c.name;
                  return (
                    <CompRow
                      key={c.name}
                      comp={c}
                      verdict={v}
                      isExpanded={isExpanded}
                      onToggleExpand={() => setExpandedComp(isExpanded ? null : c.name)}
                      onAccept={() => toggleVerdict(c.name, 'accept')}
                      onReject={() => toggleVerdict(c.name, 'reject')}
                    />
                  );
                })}
                {/* Items added from prior lists */}
                {addedFromPrior.size > 0 && (
                  <tr className="border-t-2 border-purple-300 bg-purple-50/50">
                    <td colSpan={7} className="px-2 py-1 text-[10px] font-semibold text-purple-700">Added from Similar Prior Comp Lists</td>
                  </tr>
                )}
                {[...addedFromPrior].map((name) => {
                  const priorComp = PRIOR_COMP_LISTS.flatMap((l) => l.comps).find((c) => c.name === name);
                  if (!priorComp) return null;
                  const v = verdicts[name];
                  return (
                    <tr key={name} className={cn('border-t border-border', v === 'accept' && 'bg-green-50', v === 'reject' && 'bg-red-50 opacity-60')}>
                      <td className="px-2 py-1.5 font-medium">{priorComp.name}</td>
                      <td className="px-2 py-1.5">{priorComp.country}</td>
                      <td className="px-2 py-1.5 text-muted-fg">{priorComp.sicCode}</td>
                      <td className="px-2 py-1.5 text-right text-muted-fg">—</td>
                      <td className="px-2 py-1.5 text-right text-muted-fg">—</td>
                      <td className="px-2 py-1.5 text-muted-fg italic">Added from prior list</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => toggleVerdict(name, 'accept')} className={cn('rounded p-0.5', v === 'accept' ? 'bg-green-200 text-green-800' : 'text-muted-fg hover:bg-green-100')}><CheckCircle2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => toggleVerdict(name, 'reject')} className={cn('rounded p-0.5', v === 'reject' ? 'bg-red-200 text-red-800' : 'text-muted-fg hover:bg-red-100')}><XCircle className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 4: Similar Prior Comp Lists */}
      <CollapsibleSection title="Similar Prior Comp Lists" badge={
        <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">{PRIOR_COMP_LISTS.length} found</span>
      }>
        <div className="space-y-3">
          <p className="text-[11px] text-muted-fg">Prior comparable searches for similar entities. Use the <strong>+</strong> button to add individual comparables to your current search.</p>
          {PRIOR_COMP_LISTS.map((list) => (
            <div key={list.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold">{list.entityName}</span>
                  <span className="ml-2 text-[10px] text-muted-fg">{list.jurisdiction} · FY{list.fiscalYear}</span>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-fg">IQR: {list.iqr}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-muted-fg">
                <span>Industry: {list.industry}</span>
                <span>·</span>
                <span>PLI: {list.pli}</span>
                <span>·</span>
                <span>Region: {list.region}</span>
                <span>·</span>
                <span>Min Indep: {list.minIndependence}%</span>
                <span>·</span>
                <span>{list.compCount} comps</span>
              </div>
              <div className="mt-2 space-y-1">
                {list.comps.map((comp) => (
                  <div key={comp.name} className="flex items-center justify-between rounded border border-border bg-muted/30 px-2 py-1.5">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-medium">{comp.name}</span>
                      <span className="text-muted-fg">{comp.country}</span>
                      <span className="text-muted-fg">{comp.sicCode}</span>
                      <span className="tabular-nums">PLI: {comp.pli}%</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-purple-700 hover:bg-purple-100"
                      onClick={() => addFromPriorList(comp.name)}
                      disabled={addedFromPrior.has(comp.name)}
                    >
                      {addedFromPrior.has(comp.name) ? (
                        <><CheckCircle2 className="h-3 w-3 text-green-600" /> Added</>
                      ) : (
                        <><PlusCircle className="h-3 w-3" /> Add to list</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 5: Scenario Simulation */}
      <CollapsibleSection title="Scenario Simulation" defaultOpen={false}>
        <ScenarioSimulation customer={customer} />
      </CollapsibleSection>
    </div>
  );
}

// ----- Sub-components -----

function CompRow({ comp, verdict, isExpanded, onToggleExpand, onAccept, onReject }: {
  comp: typeof COMP_LIST[0];
  verdict?: 'accept' | 'reject';
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <>
      <tr
        className={cn(
          'border-t border-border cursor-pointer transition-colors hover:bg-muted/30',
          verdict === 'accept' && 'bg-green-50',
          verdict === 'reject' && 'bg-red-50 opacity-60',
          isExpanded && '!bg-blue-50',
        )}
        onClick={onToggleExpand}
      >
        <td className="px-2 py-1.5 font-medium">{comp.name}</td>
        <td className="px-2 py-1.5">{comp.country}</td>
        <td className="px-2 py-1.5 text-muted-fg">{comp.sicCode}</td>
        <td className="px-2 py-1.5 text-right tabular-nums">{(comp.rev2024 / 1_000_000).toFixed(1)}M</td>
        <td className="px-2 py-1.5 text-right tabular-nums">{(comp.rev2023 / 1_000_000).toFixed(1)}M</td>
        <td className="px-2 py-1.5 max-w-[220px] truncate text-muted-fg" title={comp.acceptReason}>{comp.acceptReason}</td>
        <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1">
            <button onClick={onAccept} className={cn('rounded p-0.5 transition-colors', verdict === 'accept' ? 'bg-green-200 text-green-800' : 'text-muted-fg hover:bg-green-100 hover:text-green-700')} title="Accept"><CheckCircle2 className="h-3.5 w-3.5" /></button>
            <button onClick={onReject} className={cn('rounded p-0.5 transition-colors', verdict === 'reject' ? 'bg-red-200 text-red-800' : 'text-muted-fg hover:bg-red-100 hover:text-red-700')} title="Reject"><XCircle className="h-3.5 w-3.5" /></button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-t border-blue-100 bg-blue-50/60">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-4 text-[10px] leading-relaxed">
              <div>
                <div className="mb-0.5 font-bold text-muted-fg uppercase text-[9px] tracking-wide">Characteristics of Property/Services</div>
                <div>{comp.characteristics}</div>
              </div>
              <div>
                <div className="mb-0.5 font-bold text-muted-fg uppercase text-[9px] tracking-wide">Functional Analysis & Characterization</div>
                <div>{comp.functionalAnalysis}</div>
              </div>
              <div>
                <div className="mb-0.5 font-bold text-muted-fg uppercase text-[9px] tracking-wide">Independence Status</div>
                <div>{comp.independence}</div>
              </div>
              <div>
                <div className="mb-0.5 font-bold text-muted-fg uppercase text-[9px] tracking-wide">Financial Statements</div>
                <div>{comp.financials}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-fg">{label}</span>
      {children}
    </label>
  );
}
