import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { COMP_SEARCH_REGIONS, COMP_SEARCH_PLIS } from '@/lib/types';
import type { Customer, CriteriaRecommendation, CompSearchCriteria, CompVerdict } from '@/lib/types';
import { cn, computeIQR } from '@/lib/utils';
import { Search, RotateCcw, AlertCircle, Loader2, CheckCircle2, XCircle, Sparkles, Database } from 'lucide-react';
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

interface CompSearchPanelProps {
  customer: Customer;
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

export function CompSearchPanel({ customer }: CompSearchPanelProps) {
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
  const [showRelevantLists, setShowRelevantLists] = useState(false);
  const [updatedIqr, setUpdatedIqr] = useState<{ q1: number; median: number; q3: number } | null>(null);

  const hasPriorSearch = !!(customer.compSearchRecord || customer.comparablesSearch);
  const relevantLists = getRelevantCompLists(customer.id);

  const switchMode = useCallback(async (newMode: SearchMode) => {
    setMode(newMode);
    setError(null);
    if (newMode === 'prior') {
      // Load from prior search
      const last = customer.compSearchRecord?.criteria ?? customer.comparablesSearch?.criteria;
      if (last) {
        setForm({
          reportingCountry: last.reportingCountry,
          region: last.region,
          industry: last.industry,
          pli: last.pli,
          minIndependencePct: last.minIndependencePct,
          excludeLossMaking: last.excludeLossMaking,
          maxResults: last.maxResults,
        });
      }
    } else {
      // Fetch AI recommendation
      setLoadingRec(true);
      try {
        const rec = fetchCriteriaRecommendation(customer.id);
        setRecommendation(rec);
        setForm({
          reportingCountry: customer.jurisdiction,
          region: rec.recommendedCriteria.region ?? 'Global',
          industry: rec.recommendedCriteria.industry ?? customer.industry,
          pli: rec.recommendedCriteria.pli ?? 'Operating Margin',
          minIndependencePct: rec.recommendedCriteria.minIndependencePct ?? 25,
          excludeLossMaking: rec.recommendedCriteria.excludeLossMaking ?? true,
          maxResults: rec.recommendedCriteria.maxResults ?? 12,
        });
      } catch {
        setForm({ ...DEFAULT_CRITERIA, reportingCountry: customer.jurisdiction, industry: customer.industry });
      } finally {
        setLoadingRec(false);
      }
    }
  }, [customer, fetchCriteriaRecommendation]);

  useEffect(() => {
    if (mode === 'new' && !recommendation) {
      switchMode('new');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recompute IQR when verdicts change
  useEffect(() => {
    if (!customer.compSearchRecord) {
      setUpdatedIqr(null);
      return;
    }
    const acceptedNames = new Set(
      customer.compSearchRecord.verdicts.filter((v) => v.verdict === 'accept').map((v) => v.companyName),
    );
    if (acceptedNames.size < 3) {
      setUpdatedIqr(null);
      return;
    }
    const plis = customer.compSearchRecord.results.accepted
      .filter((a) => acceptedNames.has(a.name))
      .map((a) => a.pli);
    setUpdatedIqr(computeIQR(plis));
  }, [customer.compSearchRecord]);

  const updateField = <K extends keyof CriteriaFormState>(key: K, value: CriteriaFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const criteria: CompSearchCriteria = {
      reportingCountry: form.reportingCountry,
      industry: form.industry,
      region: form.region,
      pli: form.pli,
      minIndependencePct: form.minIndependencePct,
      excludeLossMaking: form.excludeLossMaking,
      maxResults: form.maxResults,
    };
    try {
      await runComparablesSearch(customer.id, criteria);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    }
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
      {/* Header with mode selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Comparable Company Search</h3>
        {relevantLists.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRelevantLists(!showRelevantLists)}
            className="text-[11px]"
          >
            <Database className="h-3 w-3" />
            {relevantLists.length} relevant prior{relevantLists.length > 1 ? ' lists' : ' list'}
          </Button>
        )}
      </div>

      {/* GraphRAG suggested relevant lists */}
      {showRelevantLists && relevantLists.length > 0 && (
        <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-purple-800">
            <Database className="h-3 w-3" />
            Auto-surfaced Relevant Comp Lists (GraphRAG)
          </div>
          <div className="space-y-2">
            {relevantLists.map((entry) => (
              <div key={entry.id} className="rounded border border-purple-200 bg-white p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{entry.testedParty.name}</span>
                  <span className="text-[10px] text-muted-fg">{entry.testedParty.jurisdiction} · {entry.testedParty.industry}</span>
                </div>
                <div className="mt-1 text-muted-fg">
                  {entry.results.accepted.length} comps · {entry.criteria.pli} · {entry.criteria.region}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] text-purple-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool mode buttons */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'prior' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => switchMode('prior')}
          disabled={!hasPriorSearch || isSearchRunning}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Search Prior Comp List
        </Button>
        <Button
          variant={mode === 'new' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => switchMode('new')}
          disabled={isSearchRunning}
        >
          <Search className="h-3.5 w-3.5" />
          New Comp Search
        </Button>
      </div>

      {/* AI recommendation info */}
      {mode === 'new' && recommendation && (
        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-900">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
          <div>
            <span className="font-medium">AI Recommendation:</span> Functional profile classified as{' '}
            <span className="font-semibold">{recommendation.functionalProfile}</span>.
            {recommendation.precedents.length > 0 && (
              <span>
                {' '}Based on {recommendation.precedents.length} similar prior search{recommendation.precedents.length > 1 ? 'es' : ''}.
              </span>
            )}
            <div className="mt-1 text-[10px] text-blue-700">
              Criteria below are pre-populated from the recommendation. Adjust as needed.
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Criteria form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {loadingRec ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Reporting Country">
                <select className="input py-1 text-xs" value={form.reportingCountry} onChange={(e) => updateField('reportingCountry', e.target.value)}>
                  {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </Field>
              <Field label="Search Region">
                <select className="input py-1 text-xs" value={form.region} onChange={(e) => updateField('region', e.target.value)}>
                  {COMP_SEARCH_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Industry">
                <select className="input py-1 text-xs" value={form.industry} onChange={(e) => updateField('industry', e.target.value)}>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Profit Level Indicator">
                <select className="input py-1 text-xs" value={form.pli} onChange={(e) => updateField('pli', e.target.value)}>
                  {COMP_SEARCH_PLIS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Min Independence (%)">
                <input type="number" min={0} max={100} className="input py-1 text-xs" value={form.minIndependencePct} onChange={(e) => updateField('minIndependencePct', +e.target.value)} />
              </Field>
              <Field label="Max Results">
                <input type="number" min={1} max={25} className="input py-1 text-xs" value={form.maxResults} onChange={(e) => updateField('maxResults', +e.target.value)} />
              </Field>
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

      {/* Loading skeleton */}
      {isSearchRunning && (
        <div className="space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded-md bg-muted" />
        </div>
      )}

      {/* Results with accept/reject */}
      {!isSearchRunning && searchResults && (
        <div className="space-y-4 border-t border-border pt-4">
          {/* Funnel visualization */}
          {searchRecord?.funnelStages && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Search Funnel</div>
              <div className="flex items-end gap-1">
                {searchRecord.funnelStages.map((stage, i) => {
                  const maxCount = searchRecord.funnelStages![0].count;
                  const height = Math.max(12, (stage.count / maxCount) * 48);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="text-[9px] font-medium tabular-nums">{stage.count}</div>
                      <div
                        className="w-full rounded-t bg-primary/60"
                        style={{ height: `${height}px` }}
                      />
                      <div className="text-[8px] leading-tight text-muted-fg text-center">{stage.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* IQR Widget */}
          {updatedIqr && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2">
              <div className="text-[11px] font-semibold text-green-800">
                Updated Interquartile Range (accepted companies)
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm">
                <span className="text-green-700">Q1: <strong>{updatedIqr.q1.toFixed(2)}%</strong></span>
                <span className="text-green-800">Median: <strong>{updatedIqr.median.toFixed(2)}%</strong></span>
                <span className="text-green-700">Q3: <strong>{updatedIqr.q3.toFixed(2)}%</strong></span>
              </div>
            </div>
          )}

          {/* Accepted comparables with verdict buttons */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold">
                Comparables ({searchResults.accepted.length})
              </div>
              <div className="text-[10px] text-muted-fg">
                Review each company — accept or reject to update the IQR
              </div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted text-muted-fg">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium">Company</th>
                    <th className="px-2 py-1.5 text-left font-medium">Country</th>
                    <th className="px-2 py-1.5 text-left font-medium">Industry</th>
                    <th className="px-2 py-1.5 text-right font-medium">{form.pli} (%)</th>
                    <th className="px-2 py-1.5 text-center font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.accepted.map((c, i) => {
                    const verdict = searchRecord?.verdicts.find((v) => v.companyName === c.name);
                    return (
                      <tr key={i} className={cn(
                        'border-t border-border transition-colors',
                        verdict?.verdict === 'accept' && 'bg-green-50',
                        verdict?.verdict === 'reject' && 'bg-red-50 opacity-60',
                      )}>
                        <td className="px-2 py-1.5 font-medium">{c.name}</td>
                        <td className="px-2 py-1.5">{c.country}</td>
                        <td className="px-2 py-1.5 text-muted-fg">{c.industry}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{c.pli.toFixed(2)}</td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleVerdict(c.name, 'accept')}
                              className={cn(
                                'rounded p-1 transition-colors',
                                verdict?.verdict === 'accept'
                                  ? 'bg-green-200 text-green-800'
                                  : 'text-muted-fg hover:bg-green-100 hover:text-green-700',
                              )}
                              title="Accept"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleVerdict(c.name, 'reject')}
                              className={cn(
                                'rounded p-1 transition-colors',
                                verdict?.verdict === 'reject'
                                  ? 'bg-red-200 text-red-800'
                                  : 'text-muted-fg hover:bg-red-100 hover:text-red-700',
                              )}
                              title="Reject"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejected */}
          {searchResults.rejected.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold">
                Auto-rejected ({searchResults.rejected.length})
              </div>
              <ul className="space-y-1 text-xs">
                {searchResults.rejected.map((r, i) => (
                  <li key={i} className="rounded-md border border-border px-2 py-1.5">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-fg"> — {r.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Search notes */}
          {searchResults.searchNotes && (
            <div className="text-[11px] leading-relaxed text-muted-fg">{searchResults.searchNotes}</div>
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
