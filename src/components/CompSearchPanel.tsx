import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { COMP_SEARCH_REGIONS, COMP_SEARCH_PLIS } from '@/lib/types';
import type { Customer, CriteriaRecommendation, CompSearchCriteria, CompVerdict, GraphRAGEntry } from '@/lib/types';
import { cn, computeIQR } from '@/lib/utils';
import { Search, RotateCcw, AlertCircle, Loader2, CheckCircle2, XCircle, Sparkles, Database, PlusCircle, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { INDUSTRIES, JURISDICTIONS } from '@/lib/mockData';

type SearchMode = 'prior' | 'new';

interface CriteriaFormState {
  reportingCountry: string;
  region: string;
  industry: string;
  pli: string;
  minIndependencePct: number;
  excludeLossMaking: boolean;
  maxResults: number;
}

const DEFAULT_CRITERIA: CriteriaFormState = {
  reportingCountry: 'US',
  region: 'Global',
  industry: '',
  pli: 'Operating Margin',
  minIndependencePct: 25,
  excludeLossMaking: true,
  maxResults: 12,
};

// Mock enriched comparable data matching the Alimak report structure
const MOCK_COMP_DETAILS = [
  { name: 'Ambertech Limited', country: 'Australia', sicCode: 'SIC 5065', rev2024: 95456000, rev2023: 84224000, pli: 4.45, acceptReason: 'Distributes technology equipment; functionally comparable value-added distributor', characteristics: 'Distributes home entertainment, integrated solutions, and professional broadcast equipment', functionalAnalysis: 'Value-added distributor performing local sales, marketing, after-sales service, and warehousing. Characterized as a value-added distributor.', independence: 'Independent (publicly listed, no >50% shareholder)', financials: 'Revenue AUD 101M (FY25), OM 2.51%' },
  { name: 'Bapcor Limited', country: 'Australia', sicCode: 'SIC 5013', rev2024: 2036938000, rev2023: 2021135000, pli: 7.99, acceptReason: 'Automotive aftermarket parts distributor; comparable distribution and service functions', characteristics: 'Supplies vehicle parts, accessories, automotive equipment, and services in AU/NZ', functionalAnalysis: 'Full-service distributor with wholesale, retail, and service center operations. Bears market risk, credit risk, and inventory risk.', independence: 'Independent (publicly listed, widely held)', financials: 'Revenue AUD 1.98B (FY25), OM 4.59%' },
  { name: 'CDK Stone Pty Ltd', country: 'Australia', sicCode: 'SIC 5032', rev2024: 69947305, rev2023: 69959734, pli: 7.88, acceptReason: 'Natural stone products, consumables and machinery distributor', characteristics: 'Distributes stone products, care products and machinery to construction industry', functionalAnalysis: 'Value-added distributor with warehousing, local sales and after-sales support. Limited-risk profile.', independence: 'Independent (private, no group ownership identified)', financials: 'Revenue AUD 70M (FY24), OM 6.64%' },
  { name: 'Coventry Group Ltd', country: 'Australia', sicCode: 'SIC 5013', rev2024: 370805000, rev2023: 358543000, pli: 2.50, acceptReason: 'Industrial products distributor with service component', characteristics: 'Distributes industrial fasteners, hydraulic systems, and lubrication systems', functionalAnalysis: 'Trade distribution and fluid systems. Performs installation, design, and distribution functions.', independence: 'Independent (publicly listed)', financials: 'Revenue AUD 365M (FY25), OM 0.83%' },
  { name: 'Dicker Data Limited', country: 'Australia', sicCode: 'SIC 5045', rev2024: 2280658000, rev2023: 2266459000, pli: 5.44, acceptReason: 'IT hardware/software distributor; comparable wholesale distribution model', characteristics: 'Wholesale distribution of IT hardware, software, cloud, and IoT solutions', functionalAnalysis: 'Wholesale distributor with logistics and configuration services. Bears market and credit risk.', independence: 'Independent (publicly listed, ASX)', financials: 'Revenue AUD 2.57B (FY25), OM 5.68%' },
  { name: 'Hare & Forbes Pty Ltd', country: 'Australia', sicCode: 'SIC 5084', rev2024: 171843026, rev2023: 179331151, pli: 19.23, acceptReason: 'Engineering machinery distributor; comparable value-added distribution with after-sales', characteristics: 'Distributes new and used engineering machinery, automotive tools and workshop equipment', functionalAnalysis: 'Value-added distributor with showroom, after-sales service, and technical support. Owns marketing intangibles.', independence: 'Independent (private, family-owned)', financials: 'Revenue AUD 172M (FY24), OM 15.96%' },
  { name: 'Supply Network Limited', country: 'Australia', sicCode: 'SIC 5010', rev2024: 302718000, rev2023: 252260000, pli: 15.77, acceptReason: 'Aftermarket parts distributor; comparable distribution and parts interpreting services', characteristics: 'Provides aftermarket parts to commercial vehicle market in AU/NZ', functionalAnalysis: 'Specialist distributor performing procurement, supply management, and problem solving services.', independence: 'Independent (publicly listed, ASX)', financials: 'Revenue AUD 349M (FY25), OM 16.72%' },
  { name: 'Stealth Group Holdings', country: 'Australia', sicCode: 'SIC 5080', rev2024: 113680264, rev2023: 110992974, pli: 3.28, acceptReason: 'Industrial distribution company; comparable distribution and inventory management', characteristics: 'Distributes industrial MRO supplies, PPE, workwear, power tools, and hardware', functionalAnalysis: 'Industrial distributor performing warehousing, inventory management, and technical support.', independence: 'Independent (publicly listed)', financials: 'Revenue AUD 142M (FY25), OM 4.68%' },
];

export function CompSearchPanel({ customer }: { customer: Customer }) {
  const runComparablesSearch = useAppStore((s) => s.runComparablesSearch);
  const fetchCriteriaRecommendation = useAppStore((s) => s.fetchCriteriaRecommendation);
  const saveVerdict = useAppStore((s) => s.saveVerdict);
  const getRelevantCompLists = useAppStore((s) => s.getRelevantCompLists);
  const toolRunning = useAppStore((s) => s.toolRunning);

  const isSearchRunning = toolRunning[`${customer.id}:comp`] ?? false;

  const [mode, setMode] = useState<SearchMode>('new');
  const [form, setForm] = useState<CriteriaFormState>({
    ...DEFAULT_CRITERIA,
    reportingCountry: customer.jurisdiction,
    industry: customer.industry,
  });
  const [error, setError] = useState<string | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [recommendation, setRecommendation] = useState<CriteriaRecommendation | null>(null);
  const [updatedIqr, setUpdatedIqr] = useState<{ q1: number; median: number; q3: number } | null>(null);
  const [showExistingLists, setShowExistingLists] = useState(true);
  const [expandedComp, setExpandedComp] = useState<string | null>(null);

  const hasPriorSearch = !!(customer.compSearchRecord || customer.comparablesSearch);
  const relevantLists = getRelevantCompLists(customer.id);

  const switchMode = useCallback(async (newMode: SearchMode) => {
    setMode(newMode);
    setError(null);
    if (newMode === 'prior') {
      const last = customer.compSearchRecord?.criteria ?? customer.comparablesSearch?.criteria;
      if (last) {
        setForm({ reportingCountry: last.reportingCountry, region: last.region, industry: last.industry, pli: last.pli, minIndependencePct: last.minIndependencePct, excludeLossMaking: last.excludeLossMaking, maxResults: last.maxResults });
      }
    } else {
      setLoadingRec(true);
      try {
        const rec = fetchCriteriaRecommendation(customer.id);
        setRecommendation(rec);
        setForm({ reportingCountry: customer.jurisdiction, region: rec.recommendedCriteria.region ?? 'Global', industry: rec.recommendedCriteria.industry ?? customer.industry, pli: rec.recommendedCriteria.pli ?? 'Operating Margin', minIndependencePct: rec.recommendedCriteria.minIndependencePct ?? 25, excludeLossMaking: rec.recommendedCriteria.excludeLossMaking ?? true, maxResults: rec.recommendedCriteria.maxResults ?? 12 });
      } catch { setForm({ ...DEFAULT_CRITERIA, reportingCountry: customer.jurisdiction, industry: customer.industry }); }
      finally { setLoadingRec(false); }
    }
  }, [customer, fetchCriteriaRecommendation]);

  useEffect(() => { if (mode === 'new' && !recommendation) { switchMode('new'); } }, []);

  useEffect(() => {
    if (!customer.compSearchRecord) { setUpdatedIqr(null); return; }
    const acceptedNames = new Set(customer.compSearchRecord.verdicts.filter((v) => v.verdict === 'accept').map((v) => v.companyName));
    if (acceptedNames.size < 3) { setUpdatedIqr(null); return; }
    const plis = customer.compSearchRecord.results.accepted.filter((a) => acceptedNames.has(a.name)).map((a) => a.pli);
    setUpdatedIqr(computeIQR(plis));
  }, [customer.compSearchRecord]);

  const updateField = <K extends keyof CriteriaFormState>(key: K, value: CriteriaFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const criteria: CompSearchCriteria = { reportingCountry: form.reportingCountry, industry: form.industry, region: form.region, pli: form.pli, minIndependencePct: form.minIndependencePct, excludeLossMaking: form.excludeLossMaking, maxResults: form.maxResults };
    try { await runComparablesSearch(customer.id, criteria); } catch (e) { setError(e instanceof Error ? e.message : 'Search failed.'); }
  };

  const handleVerdict = (companyName: string, verdict: 'accept' | 'reject') => {
    if (!customer.compSearchRecord) return;
    const iqr = saveVerdict(customer.id, customer.compSearchRecord.searchId, companyName, verdict);
    if (iqr) setUpdatedIqr(iqr);
  };

  const searchRecord = customer.compSearchRecord;
  const searchResults = searchRecord?.results ?? customer.comparablesSearch;

  return (
    <div className="space-y-4">
      {/* Existing Similar Comp Lists (GraphRAG) */}
      {relevantLists.length > 0 && (
        <div className="rounded-md border border-purple-200 bg-purple-50/50 p-3">
          <button onClick={() => setShowExistingLists(!showExistingLists)} className="flex w-full items-center gap-2 text-left">
            {showExistingLists ? <ChevronDown className="h-3.5 w-3.5 text-purple-600" /> : <ChevronRight className="h-3.5 w-3.5 text-purple-600" />}
            <Database className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-800">Existing Similar Comp Lists ({relevantLists.length})</span>
            <span className="ml-auto text-[10px] text-purple-600">Auto-surfaced from GraphRAG</span>
          </button>
          {showExistingLists && (
            <div className="mt-2 space-y-2">
              {relevantLists.map((entry) => (
                <div key={entry.id} className="rounded border border-purple-200 bg-white p-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium">{entry.testedParty.name}</span>
                      <span className="ml-2 text-[10px] text-muted-fg">{entry.testedParty.jurisdiction} · {entry.testedParty.industry} · {entry.criteria.pli}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-purple-700" title="Add comparables from this list to new search">
                      <PlusCircle className="h-3 w-3" />
                      Add to search
                    </Button>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-fg">
                    {entry.results.accepted.length} comps · Region: {entry.criteria.region} · Min Independence: {entry.criteria.minIndependencePct}%
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {entry.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] text-purple-700">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button variant={mode === 'prior' ? 'primary' : 'outline'} size="sm" onClick={() => switchMode('prior')} disabled={!hasPriorSearch || isSearchRunning}>
          <RotateCcw className="h-3.5 w-3.5" />
          Search Prior Comp List
        </Button>
        <Button variant={mode === 'new' ? 'primary' : 'outline'} size="sm" onClick={() => switchMode('new')} disabled={isSearchRunning}>
          <Search className="h-3.5 w-3.5" />
          New Comp Search
        </Button>
      </div>

      {/* AI Recommendation */}
      {mode === 'new' && recommendation && (
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-900">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
          <div>
            <span className="font-medium">AI Recommendation:</span> Functional profile: <span className="font-semibold">{recommendation.functionalProfile}</span>.
            {recommendation.precedents.length > 0 && <span> Based on {recommendation.precedents.length} similar prior searches.</span>}
            <div className="mt-0.5 text-[10px] text-blue-700">Criteria pre-populated. Adjust as needed.</div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Criteria form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {loadingRec ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />)}</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Reporting Country"><select className="input py-1 text-xs" value={form.reportingCountry} onChange={(e) => updateField('reportingCountry', e.target.value)}>{JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}</select></Field>
              <Field label="Search Region"><select className="input py-1 text-xs" value={form.region} onChange={(e) => updateField('region', e.target.value)}>{COMP_SEARCH_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
              <Field label="Industry"><select className="input py-1 text-xs" value={form.industry} onChange={(e) => updateField('industry', e.target.value)}>{INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}</select></Field>
              <Field label="PLI"><select className="input py-1 text-xs" value={form.pli} onChange={(e) => updateField('pli', e.target.value)}>{COMP_SEARCH_PLIS.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field>
              <Field label="Min Independence (%)"><input type="number" min={0} max={100} className="input py-1 text-xs" value={form.minIndependencePct} onChange={(e) => updateField('minIndependencePct', +e.target.value)} /></Field>
              <Field label="Max Results"><input type="number" min={1} max={25} className="input py-1 text-xs" value={form.maxResults} onChange={(e) => updateField('maxResults', +e.target.value)} /></Field>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-fg">
              <input type="checkbox" checked={form.excludeLossMaking} onChange={(e) => updateField('excludeLossMaking', e.target.checked)} className="h-3.5 w-3.5 rounded border-border" />
              Exclude persistent loss-makers
            </label>
            <Button type="submit" disabled={isSearchRunning || !form.industry} className="w-full">
              {isSearchRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isSearchRunning ? 'Searching…' : mode === 'prior' ? 'Re-run with Prior Criteria' : 'Run New Comp Search'}
            </Button>
          </>
        )}
      </form>

      {isSearchRunning && <div className="space-y-2"><div className="h-4 w-2/3 animate-pulse rounded bg-muted" /><div className="h-20 animate-pulse rounded-md bg-muted" /></div>}

      {/* Results with expanded columns */}
      {!isSearchRunning && searchResults && (
        <div className="space-y-4 border-t border-border pt-4">
          {/* IQR */}
          {updatedIqr && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2">
              <div className="text-[11px] font-semibold text-green-800">Updated Interquartile Range (accepted companies)</div>
              <div className="mt-1 flex items-center gap-4 text-sm">
                <span className="text-green-700">Q1: <strong>{updatedIqr.q1.toFixed(2)}%</strong></span>
                <span className="text-green-800">Median: <strong>{updatedIqr.median.toFixed(2)}%</strong></span>
                <span className="text-green-700">Q3: <strong>{updatedIqr.q3.toFixed(2)}%</strong></span>
              </div>
            </div>
          )}

          {/* Comp table with expanded columns */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold">Accepted Comparables ({MOCK_COMP_DETAILS.length})</div>
              <div className="text-[10px] text-muted-fg">Click a row to expand details · Accept/reject to update IQR</div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-[11px]">
                <thead className="bg-[#1a5c1a] text-white">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Company Name</th>
                    <th className="px-2 py-1.5 text-left font-medium">Country</th>
                    <th className="px-2 py-1.5 text-left font-medium">SIC Code</th>
                    <th className="px-2 py-1.5 text-right font-medium">Revenue 2024</th>
                    <th className="px-2 py-1.5 text-right font-medium">Revenue 2023</th>
                    <th className="px-2 py-1.5 text-left font-medium">Acceptance Reason</th>
                    <th className="px-2 py-1.5 text-center font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_COMP_DETAILS.map((c) => {
                    const verdict = searchRecord?.verdicts.find((v) => v.companyName === c.name);
                    const isExpanded = expandedComp === c.name;
                    return (
                      <>
                        <tr
                          key={c.name}
                          className={cn(
                            'border-t border-border cursor-pointer transition-colors',
                            verdict?.verdict === 'accept' && 'bg-green-50',
                            verdict?.verdict === 'reject' && 'bg-red-50 opacity-60',
                            isExpanded && 'bg-blue-50',
                          )}
                          onClick={() => setExpandedComp(isExpanded ? null : c.name)}
                        >
                          <td className="px-2 py-1.5 font-medium">{c.name}</td>
                          <td className="px-2 py-1.5">{c.country}</td>
                          <td className="px-2 py-1.5 text-muted-fg">{c.sicCode}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{(c.rev2024 / 1000000).toFixed(1)}M</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{(c.rev2023 / 1000000).toFixed(1)}M</td>
                          <td className="px-2 py-1.5 max-w-[200px] truncate text-muted-fg" title={c.acceptReason}>{c.acceptReason}</td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleVerdict(c.name, 'accept')} className={cn('rounded p-0.5 transition-colors', verdict?.verdict === 'accept' ? 'bg-green-200 text-green-800' : 'text-muted-fg hover:bg-green-100 hover:text-green-700')} title="Accept"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleVerdict(c.name, 'reject')} className={cn('rounded p-0.5 transition-colors', verdict?.verdict === 'reject' ? 'bg-red-200 text-red-800' : 'text-muted-fg hover:bg-red-100 hover:text-red-700')} title="Reject"><XCircle className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${c.name}-detail`} className="border-t border-blue-100 bg-blue-50/50">
                            <td colSpan={7} className="px-3 py-2">
                              <div className="grid grid-cols-2 gap-3 text-[10px]">
                                <div><span className="font-semibold text-muted-fg">Characteristics of Property/Services:</span><br />{c.characteristics}</div>
                                <div><span className="font-semibold text-muted-fg">Functional Analysis & Characterization:</span><br />{c.functionalAnalysis}</div>
                                <div><span className="font-semibold text-muted-fg">Independence Status:</span><br />{c.independence}</div>
                                <div><span className="font-semibold text-muted-fg">Financial Statements:</span><br />{c.financials}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejected */}
          {searchResults.rejected.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold">Auto-rejected ({searchResults.rejected.length})</div>
              <ul className="space-y-1 text-xs">
                {searchResults.rejected.map((r, i) => (
                  <li key={i} className="rounded-md border border-border px-2 py-1.5">
                    <span className="font-medium">{r.name}</span><span className="text-muted-fg"> — {r.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
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
