import { useState } from 'react';
import { ChevronDown, ChevronRight, Search, RotateCcw, Loader2, Sparkles, CheckCircle2, XCircle, PlusCircle, Database, FileText, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScenarioSimulation } from '@/components/ScenarioSimulation';
import { useAppStore } from '@/store/useAppStore';
import { COMP_SEARCH_REGIONS, COMP_SEARCH_PLIS } from '@/lib/types';
import type { Customer, CompSearchCriteria, CriteriaRecommendation } from '@/lib/types';
import { cn, computeIQR } from '@/lib/utils';
import { INDUSTRIES, JURISDICTIONS } from '@/lib/mockData';

// ----- ACCEPTED comp list -----
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

// ----- REJECTED comp list -----
const REJECTED_COMP_LIST = [
  { name: 'Arjo Australia Pty Ltd', country: 'Australia', sicCode: 'SIC 5047', rev2024: 89200000, rev2023: 82100000, rejectReason: 'Company is owned greater than 50 percent by one entity', characteristics: 'Distributes patient handling and medical devices equipment.', functionalAnalysis: 'Subsidiary distributor of Swedish parent. Functions limited to local sales under direction of parent.', independence: 'NOT independent — 100% owned by Arjo AB (Sweden).', financials: 'FY24: Revenue AUD 89.2M | OM 4.2%' },
  { name: 'Honda Australia Pty Ltd', country: 'Australia', sicCode: 'SIC 5012', rev2024: 1850000000, rev2023: 1720000000, rejectReason: 'Company is owned greater than 50 percent by one entity', characteristics: 'Distributes motor vehicles, motorcycles, and power equipment in Australia.', functionalAnalysis: 'National distributor and importer. Performs sales, marketing, and after-sales service. However, controlled by Honda Motor Co., Ltd.', independence: 'NOT independent — 100% subsidiary of Honda Motor Co., Ltd (Japan).', financials: 'FY24: Revenue AUD 1.85B | OM 3.1%' },
  { name: 'One Stop Warehouse Pty Ltd', country: 'Australia', sicCode: 'SIC 5065', rev2024: 420000000, rev2023: 510000000, rejectReason: 'Operating income is negative for 2 years', characteristics: 'Distributes solar panels, inverters, and renewable energy equipment.', functionalAnalysis: 'Wholesale distributor of solar and battery products. Rapid growth but persistent losses due to price compression.', independence: 'Independent — privately held.', financials: 'FY24: Revenue AUD 420M | OP -AUD 12M | OM -2.9%' },
  { name: 'Edgen Murray Australia Pty Ltd', country: 'Australia', sicCode: 'SIC 5051', rev2024: 45000000, rev2023: 52000000, rejectReason: 'Average operating income for the period is negative', characteristics: 'Distributes steel pipes, plates, and fittings for oil & gas and infrastructure.', functionalAnalysis: 'Specialist steel distributor. Different products — metals rather than industrial equipment.', independence: 'Independent — part of group but <50% ownership in AU entity.', financials: 'FY24: Revenue AUD 45M | OP -AUD 1.8M | OM -4.0%' },
  { name: 'Sydney Tools Pty Ltd', country: 'Australia', sicCode: 'SIC 5072', rev2024: 680000000, rev2023: 590000000, rejectReason: "Company's primary function is dissimilar from tested party", characteristics: 'Operates power tool and hardware retail superstores across Australia.', functionalAnalysis: 'Primarily a retailer with direct consumer sales through large showrooms. Functions are retail-focused (merchandising, store ops) rather than B2B distribution.', independence: 'Independent — privately held by founders.', financials: 'FY24: Revenue AUD 680M | OM 8.4%' },
  { name: 'Reece Limited', country: 'Australia', sicCode: 'SIC 5074', rev2024: 8900000000, rev2023: 8400000000, rejectReason: 'Different products', characteristics: 'Distributes plumbing, bathroom, and HVAC products through trade-focused branches.', functionalAnalysis: 'Plumbing and bathroom supplies distributor. Product category (plumbing/HVAC) is materially different from industrial machinery and vertical access solutions.', independence: 'Independent — publicly listed on ASX (REH).', financials: 'FY24: Revenue AUD 8.9B | OM 9.7%' },
  { name: 'Conplant Pty Ltd', country: 'Australia', sicCode: 'SIC 5082', rev2024: 125000000, rev2023: 118000000, rejectReason: 'Company is owned greater than 50 percent by one entity', characteristics: 'Distributes construction and mining equipment including excavators and loaders.', functionalAnalysis: 'Equipment distributor with rental fleet and after-sales service. Functionally comparable but fails independence screen.', independence: 'NOT independent — 100% owned by XCMG Machinery (China).', financials: 'FY24: Revenue AUD 125M | OM 6.8%' },
];

// ----- Similar prior comp lists -----
const PRIOR_COMP_LISTS = [
  { id: 'prior-1', entityName: 'TechDist Australia Pty Ltd', jurisdiction: 'AU', industry: 'Industrial Manufacturing', fiscalYear: 2024, pli: 'Operating Margin', region: 'Asia Pacific', minIndependence: 25, compCount: 14, iqr: '3.8% – 7.2%', comps: [{ name: 'Porter Equipment AU', country: 'Australia', sicCode: 'SIC 5082', pli: 3.89 }, { name: 'Ramsey Bros Pty Ltd', country: 'Australia', sicCode: 'SIC 5083', pli: 5.57 }, { name: 'Semco Pty Limited', country: 'Australia', sicCode: 'SIC 5082', pli: 9.86 }] },
  { id: 'prior-2', entityName: 'Alimak Group Denmark A/S', jurisdiction: 'DK', industry: 'Industrial Manufacturing', fiscalYear: 2024, pli: 'Operating Margin', region: 'Western Europe', minIndependence: 30, compCount: 11, iqr: '4.5% – 9.1%', comps: [{ name: 'Hi-Tec Global Holding', country: 'United Kingdom', sicCode: 'SIC 5084', pli: 10.40 }, { name: 'Roy Gripske & Sons', country: 'Australia', sicCode: 'SIC 5083', pli: 8.01 }] },
  { id: 'prior-3', entityName: 'CoxGomyl Operations SAU', jurisdiction: 'ES', industry: 'Industrial Manufacturing', fiscalYear: 2023, pli: 'Net Cost Plus', region: 'Western Europe', minIndependence: 25, compCount: 9, iqr: '5.1% – 12.8%', comps: [{ name: 'NTAW Holdings Limited', country: 'Australia', sicCode: 'SIC 5010', pli: 3.04 }, { name: 'Dynamic Supplies', country: 'Australia', sicCode: 'SIC 5045', pli: 4.24 }] },
];

// ----- Similar existing analyses (for the new tab) -----
const SIMILAR_ANALYSES = [
  {
    id: 'analysis-1',
    entityName: 'Alimak Group Australia Pty Ltd',
    jurisdiction: 'AU',
    industry: 'Industrial Manufacturing',
    fiscalYear: 2025,
    profile: 'Value-added distributor of vertical access solutions',
    matchReason: 'Same jurisdiction (AU), same industry (Industrial Manufacturing), same functional profile (value-added distributor with after-sales service)',
    similarity: 95,
    sections: [
      { id: 's1', label: 'Tested Party Characterization', type: 'paragraph' as const, text: 'Based on the functional analysis above, Alimak AUS performs the functions of a value-added distributor including local sales, marketing and customer relations, after-sales services, on-site service and installation, transportation and limited warehousing while the functions of product development, purchasing and manufacturing operations are performed by the Alimak Affiliates. Alimak AUS assumes the routine risks associated with its distribution and rental activities, including market, credit and local inventory risk, together with a share of delivery and logistics, warranty and rental-related capacity-utilization risk, but does not bear foreign exchange risk. Accordingly, Alimak AUS is characterized as a value-added distributor that does not own non-routine intangibles or assume entrepreneurial risk and is selected as the tested party for this transaction.' },
      { id: 's2', label: 'Method Selection Rationale', type: 'paragraph' as const, text: 'The TNMM was selected as the most appropriate method based on the availability of reliable data and because comparable uncontrolled transactions with which to apply the transactional methods could not be identified reliably. Independent companies with similar functions to those of the tested party were reliably identified. The profitability of the tested party was then compared to that of the independent companies, effectively measuring the arm\'s length nature of the intercompany transaction.' },
      { id: 's3', label: 'Search Methodology', type: 'paragraph' as const, text: 'The set of potential comparable companies was initially narrowed down to include those in Australia. Companies that were at least 50% owned by another company, had operating income missing for 3 years, or had net sales missing for 3 years were excluded. The search was limited to relevant distributors. Bulk rejections were applied for missing financials, high R&D ratios, majority ownership, missing operating margins, and negative average operating income. The resulting pool was qualitatively reviewed for functional comparability.' },
      { id: 's4', label: 'Conclusion (within IQR)', type: 'sentence' as const, text: 'The interquartile range of the five-year weighted average OM ratios for the set of selected comparable companies is between 4.22% and 9.86%, with a median of 5.57%. During FY 2025, the tested party earned an OM ratio of 8.42% with respect to its distribution activities, which falls within the full range established by the set of comparable companies. Therefore, the entity bears minimum transfer pricing risk with respect to this transaction.' },
      { id: 's5', label: 'Form vs Substance (s815-130)', type: 'paragraph' as const, text: 'The distribution arrangement is structured such that the tested party purchases finished products, parts and related services from affiliates and resells them, together with after-sales services, to customers in the local market, targeting an arm\'s length operating margin. The form of the arrangement is that of a distribution agreement; the economic substance is that of a value-added distributor that buys and sells the products in its own name and for its own account. The form and substance are consistent — the entity performs genuine distribution and value-adding functions and assumes the risks commensurate with that profile. Exception 1 does not apply.' },
    ],
  },
  {
    id: 'analysis-2',
    entityName: 'TechDist Australia Pty Ltd',
    jurisdiction: 'AU',
    industry: 'Software',
    fiscalYear: 2024,
    profile: 'Buy-sell distributor of IT hardware and peripherals',
    matchReason: 'Same jurisdiction (AU), similar functional profile (B2B distribution with warehousing)',
    similarity: 78,
    sections: [
      { id: 's6', label: 'Transactional Analysis (TNMM)', type: 'paragraph' as const, text: 'Application of the TNMM compares the net profit margin of the tested party arising from the intercompany transaction with the net profit margins realized by arm\'s length parties with similar functional profiles. As the TNMM relies on a comparison of net margins, a high standard of functional comparability must be met. The controlled transaction participant whose profitability is being evaluated is the "tested party" — in most cases the least complex entity for which reliable comparable data can be located.' },
      { id: 's7', label: 'Economic Circumstances', type: 'paragraph' as const, text: 'The tested party operates in the Australian market and makes exclusively business-to-business sales. It is responsible for developing the business in Australia and accordingly assumes the market risk associated with adverse conditions in that market. The geographic market, the level of competition and the customer base in Australia are the relevant economic conditions for this transaction.' },
      { id: 's8', label: 'Service Validation (Benefits Test)', type: 'paragraph' as const, text: 'To determine whether an intra-group service has been provided, it is necessary to examine whether the activity provides a group member with economic or commercial value to enhance or maintain its business position. An independent party in similar circumstances would have been willing to pay for the activity if performed for it by an independent party or would have performed the activity in-house for itself.' },
    ],
  },
  {
    id: 'analysis-3',
    entityName: 'PharmaDistrib Holdings',
    jurisdiction: 'AU',
    industry: 'Pharmaceuticals',
    fiscalYear: 2024,
    profile: 'Limited-risk distributor of pharmaceutical products',
    matchReason: 'Same jurisdiction (AU), distribution function with after-sales component',
    similarity: 65,
    sections: [
      { id: 's9', label: 'RAP Conclusion Template', type: 'paragraph' as const, text: 'The entity holds the transfer pricing treatments described in this report as reasonably arguable positions within the meaning of Subdivision 284-E of Schedule 1 to the Taxation Administration Act 1953 and s284-255. The actual conditions of each controlled dealing are consistent with the arm\'s length conditions that would be expected to operate between independent entities dealing wholly independently in comparable circumstances, as required by s815-120(1) of the ITAA 1997. No transfer pricing benefit arises under s815-120 for the fiscal year in respect of any of the tested transactions.' },
      { id: 's10', label: 'PCG 2019/1 Risk Assessment', type: 'sentence' as const, text: 'Self-assessment against PCG 2019/1 (compliance approach to inbound distribution arrangements) confirms that the entity\'s EBIT margin relative to sales falls within the low-risk zone for the general industry schedule, indicating that the arrangement is unlikely to attract ATO compliance activity.' },
    ],
  },
];

// ----- Collapsible section -----
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
  const [form, setForm] = useState({ reportingCountry: customer.jurisdiction, region: 'Global' as string, industry: customer.industry, pli: 'Operating Margin' as string, minIndependencePct: 25, excludeLossMaking: true, maxResults: 12 });
  const [recommendation, setRecommendation] = useState<CriteriaRecommendation | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, 'accept' | 'reject'>>({});
  const [expandedComp, setExpandedComp] = useState<string | null>(null);
  const [addedFromPrior, setAddedFromPrior] = useState<Set<string>>(new Set());
  const [copiedSections, setCopiedSections] = useState<Set<string>>(new Set());

  useState(() => {
    try {
      const rec = fetchCriteriaRecommendation(customer.id);
      setRecommendation(rec);
      setForm((f) => ({ ...f, region: rec.recommendedCriteria.region ?? f.region, industry: rec.recommendedCriteria.industry ?? f.industry, pli: rec.recommendedCriteria.pli ?? f.pli, minIndependencePct: rec.recommendedCriteria.minIndependencePct ?? f.minIndependencePct, maxResults: rec.recommendedCriteria.maxResults ?? f.maxResults }));
    } catch {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runComparablesSearch(customer.id, { reportingCountry: form.reportingCountry, industry: form.industry, region: form.region, pli: form.pli, minIndependencePct: form.minIndependencePct, excludeLossMaking: form.excludeLossMaking, maxResults: form.maxResults });
  };

  const toggleVerdict = (name: string, v: 'accept' | 'reject') => {
    setVerdicts((prev) => ({ ...prev, [name]: prev[name] === v ? undefined as any : v }));
  };

  const addFromPriorList = (compName: string) => { setAddedFromPrior((prev) => new Set([...prev, compName])); };

  const handleCopySection = (sectionId: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedSections((prev) => new Set([...prev, sectionId]));
    setTimeout(() => setCopiedSections((prev) => { const n = new Set(prev); n.delete(sectionId); return n; }), 2000);
  };

  const acceptedPlis = COMP_LIST.filter((c) => verdicts[c.name] === 'accept').map((c) => c.pli);
  const liveIqr = acceptedPlis.length >= 3 ? computeIQR(acceptedPlis) : null;

  return (
    <div className="space-y-4">
      {/* 1. Method & Tested Party */}
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

      {/* 2. Comparable Search */}
      <CollapsibleSection title="Comparable Search" badge={recommendation ? <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">AI-recommended criteria</span> : undefined}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant={mode === 'prior' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('prior')}><RotateCcw className="h-3.5 w-3.5" /> Search Prior Comp List</Button>
            <Button variant={mode === 'new' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('new')}><Search className="h-3.5 w-3.5" /> New Comp Search</Button>
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
            <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={form.excludeLossMaking} onChange={(e) => setForm({ ...form, excludeLossMaking: e.target.checked })} className="h-3.5 w-3.5 rounded border-border" /> Exclude persistent loss-makers</label>
            <Button type="submit" disabled={isSearchRunning} className="w-full">
              {isSearchRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isSearchRunning ? 'Searching…' : 'Run New Comp Search'}
            </Button>
          </form>
        </div>
      </CollapsibleSection>

      {/* 3. Accepted Comparable Companies */}
      <CollapsibleSection title="Accepted Comparable Companies" badge={<span className="ml-2 text-[10px] text-muted-fg">{COMP_LIST.length} companies · Click row to expand · Accept/reject to update IQR</span>}>
        <div className="space-y-3">
          {liveIqr && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2">
              <div className="text-[11px] font-semibold text-green-800">Live IQR ({acceptedPlis.length} accepted)</div>
              <div className="mt-1 flex items-center gap-4 text-sm">
                <span>Q1: <strong>{liveIqr.q1.toFixed(2)}%</strong></span>
                <span>Median: <strong>{liveIqr.median.toFixed(2)}%</strong></span>
                <span>Q3: <strong>{liveIqr.q3.toFixed(2)}%</strong></span>
              </div>
            </div>
          )}
          <CompTable comps={COMP_LIST} verdicts={verdicts} expandedComp={expandedComp} onToggleExpand={(n) => setExpandedComp(expandedComp === n ? null : n)} onToggleVerdict={toggleVerdict} type="accepted" />
          {/* Added from prior lists */}
          {addedFromPrior.size > 0 && (
            <div className="mt-2 text-[10px] font-semibold text-purple-700">+ {addedFromPrior.size} added from Similar Prior Comp Lists</div>
          )}
        </div>
      </CollapsibleSection>

      {/* 4. Rejected Comparable Companies */}
      <CollapsibleSection title="Rejected Comparable Companies" defaultOpen={false} badge={<span className="ml-2 text-[10px] text-muted-fg">{REJECTED_COMP_LIST.length} companies</span>}>
        <CompTable comps={REJECTED_COMP_LIST} verdicts={{}} expandedComp={expandedComp} onToggleExpand={(n) => setExpandedComp(expandedComp === n ? null : n)} onToggleVerdict={() => {}} type="rejected" />
      </CollapsibleSection>

      {/* 5. Similar Prior Comp Lists */}
      <CollapsibleSection title="Similar Prior Comp Lists" badge={<span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">{PRIOR_COMP_LISTS.length} found</span>}>
        <div className="space-y-3">
          <p className="text-[11px] text-muted-fg">Prior searches for similar entities. Use <strong>+</strong> to add individual comparables to your current list.</p>
          {PRIOR_COMP_LISTS.map((list) => (
            <div key={list.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <div><span className="text-xs font-semibold">{list.entityName}</span><span className="ml-2 text-[10px] text-muted-fg">{list.jurisdiction} · FY{list.fiscalYear}</span></div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-fg">IQR: {list.iqr}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-muted-fg">
                <span>Industry: {list.industry}</span><span>·</span><span>PLI: {list.pli}</span><span>·</span><span>Region: {list.region}</span><span>·</span><span>Min Indep: {list.minIndependence}%</span><span>·</span><span>{list.compCount} comps</span>
              </div>
              <div className="mt-2 space-y-1">
                {list.comps.map((comp) => (
                  <div key={comp.name} className="flex items-center justify-between rounded border border-border bg-muted/30 px-2 py-1.5">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-medium">{comp.name}</span><span className="text-muted-fg">{comp.country}</span><span className="text-muted-fg">{comp.sicCode}</span><span className="tabular-nums">PLI: {comp.pli}%</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-purple-700 hover:bg-purple-100" onClick={() => addFromPriorList(comp.name)} disabled={addedFromPrior.has(comp.name)}>
                      {addedFromPrior.has(comp.name) ? <><CheckCircle2 className="h-3 w-3 text-green-600" /> Added</> : <><PlusCircle className="h-3 w-3" /> Add to list</>}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 6. Similar Existing Analyses */}
      <CollapsibleSection title="Similar Existing Analyses" defaultOpen={false} badge={<span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{SIMILAR_ANALYSES.length} matches</span>}>
        <div className="space-y-1 mb-3">
          <p className="text-[11px] text-muted-fg">Existing economic analyses for similar tested party profiles. Select paragraphs or sentences to copy into your current analysis.</p>
        </div>
        <div className="space-y-4">
          {SIMILAR_ANALYSES.map((analysis) => (
            <div key={analysis.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold">{analysis.entityName}</span>
                  <span className="ml-2 text-[10px] text-muted-fg">{analysis.jurisdiction} · FY{analysis.fiscalYear} · {analysis.industry}</span>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', analysis.similarity >= 90 ? 'bg-green-100 text-green-800' : analysis.similarity >= 75 ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-fg')}>
                  {analysis.similarity}% match
                </span>
              </div>
              <div className="mt-1 text-[10px] text-muted-fg">
                <strong>Profile:</strong> {analysis.profile}
              </div>
              <div className="mt-0.5 text-[10px] text-blue-700">
                <strong>Match reasoning:</strong> {analysis.matchReason}
              </div>

              {/* Selectable sections */}
              <div className="mt-3 space-y-2">
                {analysis.sections.map((section) => (
                  <div key={section.id} className="group rounded-md border border-border bg-muted/20 p-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-medium', section.type === 'paragraph' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}>
                            {section.type === 'paragraph' ? 'PARAGRAPH' : 'SENTENCE'}
                          </span>
                          <span className="text-[11px] font-medium">{section.label}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-fg/80">{section.text.length > 200 ? section.text.slice(0, 200) + '…' : section.text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn('shrink-0 h-7 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity', copiedSections.has(section.id) && 'opacity-100')}
                        onClick={() => handleCopySection(section.id, section.text)}
                      >
                        {copiedSections.has(section.id) ? <><Check className="h-3 w-3 text-green-600" /> Copied</> : <><Copy className="h-3 w-3" /> Use in analysis</>}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 7. Scenario Simulation */}
      <CollapsibleSection title="Scenario Simulation" defaultOpen={false}>
        <ScenarioSimulation customer={customer} />
      </CollapsibleSection>
    </div>
  );
}

// ----- Comp Table (reused for accepted & rejected) -----
function CompTable({ comps, verdicts, expandedComp, onToggleExpand, onToggleVerdict, type }: {
  comps: typeof COMP_LIST | typeof REJECTED_COMP_LIST;
  verdicts: Record<string, 'accept' | 'reject'>;
  expandedComp: string | null;
  onToggleExpand: (name: string) => void;
  onToggleVerdict: (name: string, v: 'accept' | 'reject') => void;
  type: 'accepted' | 'rejected';
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-[11px]">
        <thead className={type === 'accepted' ? 'bg-[#1a5c1a] text-white' : 'bg-red-800 text-white'}>
          <tr>
            <th className="px-2 py-2 text-left font-medium">Company Name</th>
            <th className="px-2 py-2 text-left font-medium">Country</th>
            <th className="px-2 py-2 text-left font-medium">SIC Code</th>
            <th className="px-2 py-2 text-right font-medium">Revenue 2024</th>
            <th className="px-2 py-2 text-right font-medium">Revenue 2023</th>
            <th className="px-2 py-2 text-left font-medium">{type === 'accepted' ? 'Acceptance Reason' : 'Rejection Reason'}</th>
            {type === 'accepted' && <th className="px-2 py-2 text-center font-medium">Verdict</th>}
          </tr>
        </thead>
        <tbody>
          {comps.map((c: any) => {
            const v = verdicts[c.name];
            const isExpanded = expandedComp === c.name;
            const reason = type === 'accepted' ? c.acceptReason : c.rejectReason;
            return (
              <>
                <tr key={c.name} className={cn('border-t border-border cursor-pointer transition-colors hover:bg-muted/30', v === 'accept' && 'bg-green-50', v === 'reject' && 'bg-red-50 opacity-60', isExpanded && '!bg-blue-50')} onClick={() => onToggleExpand(c.name)}>
                  <td className="px-2 py-1.5 font-medium">{c.name}</td>
                  <td className="px-2 py-1.5">{c.country}</td>
                  <td className="px-2 py-1.5 text-muted-fg">{c.sicCode}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{(c.rev2024 / 1_000_000).toFixed(1)}M</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{(c.rev2023 / 1_000_000).toFixed(1)}M</td>
                  <td className="px-2 py-1.5 max-w-[220px] truncate text-muted-fg" title={reason}>{reason}</td>
                  {type === 'accepted' && (
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => onToggleVerdict(c.name, 'accept')} className={cn('rounded p-0.5', v === 'accept' ? 'bg-green-200 text-green-800' : 'text-muted-fg hover:bg-green-100')}><CheckCircle2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => onToggleVerdict(c.name, 'reject')} className={cn('rounded p-0.5', v === 'reject' ? 'bg-red-200 text-red-800' : 'text-muted-fg hover:bg-red-100')}><XCircle className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  )}
                </tr>
                {isExpanded && (
                  <tr key={`${c.name}-detail`} className="border-t border-blue-100 bg-blue-50/60">
                    <td colSpan={type === 'accepted' ? 7 : 6} className="px-4 py-3">
                      <div className="grid grid-cols-2 gap-4 text-[10px] leading-relaxed">
                        <div><div className="mb-0.5 font-bold text-muted-fg uppercase text-[9px] tracking-wide">Characteristics of Property/Services</div>{c.characteristics}</div>
                        <div><div className="mb-0.5 font-bold text-muted-fg uppercase text-[9px] tracking-wide">Functional Analysis & Characterization</div>{c.functionalAnalysis}</div>
                        <div><div className="mb-0.5 font-bold text-muted-fg uppercase text-[9px] tracking-wide">Independence Status</div>{c.independence}</div>
                        <div><div className="mb-0.5 font-bold text-muted-fg uppercase text-[9px] tracking-wide">Financial Statements</div>{c.financials}</div>
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
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-fg">{label}</span>{children}</label>;
}
