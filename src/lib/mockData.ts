import type {
  CompSearchCriteria,
  CompSearchRecord,
  CompVerdict,
  ComparablesSearch,
  Customer,
  EconomicsOutput,
  EntityData,
  BioOutput,
  TransactionalOutput,
  AppendicesOutput,
  RegulationsOutput,
  ExecSummaryOutput,
  ReportOutput,
  GraphRAGEntry,
  ManagerReport,
  ManagerMetrics,
  CriteriaRecommendation,
  TestedPartyContext,
  FunnelStage,
} from './types';
import { uid } from './utils';

export const JURISDICTIONS = ['US', 'DE', 'SG', 'UK', 'IE', 'JP'];
export const INDUSTRIES = [
  'Software',
  'Semiconductors',
  'Pharmaceuticals',
  'Consumer Goods',
  'Financial Services',
  'Industrial Manufacturing',
];

const COMP_NAMES = [
  'TechLogic Corp', 'DataSphere Inc', 'AlphaWare Solutions', 'NovaTech Ltd',
  'SynergyByte AG', 'PrimeCore Holdings', 'Quantum Dynamics', 'Vertex Systems',
  'ClearPath Technologies', 'BlueShift Analytics', 'Orion Digital', 'Catalyst Software',
  'FusionPoint Ltd', 'Nexwave Corp', 'Pinnacle Solutions',
];

const COUNTRIES = ['US', 'UK', 'DE', 'FR', 'NL', 'SG', 'JP', 'IE', 'SE', 'CH'];

function randomPli(): number {
  return Math.round((3 + Math.random() * 12) * 100) / 100;
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateCompSearchResults(criteria: CompSearchCriteria): ComparablesSearch {
  const count = Math.min(criteria.maxResults, 8 + Math.floor(Math.random() * 5));
  const accepted = COMP_NAMES.slice(0, count).map((name) => ({
    name,
    country: randomFrom(COUNTRIES),
    industry: criteria.industry,
    pli: randomPli(),
  }));
  const rejected = COMP_NAMES.slice(count, count + 3).map((name) => ({
    name,
    reason: randomFrom([
      'Insufficient independence (<25%)',
      'Persistent loss-maker (3+ years)',
      'Different functional profile',
      'No available financial data for FY',
      'SIC code mismatch',
    ]),
  }));
  return {
    criteria,
    accepted,
    rejected,
    pliValues: accepted.map((a) => a.pli),
    searchNotes: `Search completed with ${accepted.length} accepted and ${rejected.length} rejected comparables in ${criteria.region}.`,
    quartileGuidance: 'Use the accepted set to compute quartiles. The IQR will update as you accept/reject individual companies.',
    ranAt: new Date().toISOString(),
  };
}

export function generateCriteriaRecommendation(customer: Customer): CriteriaRecommendation {
  return {
    functionalProfile: 'Limited-risk distributor',
    recommendedCriteria: {
      region: customer.jurisdiction === 'US' ? 'North America' : 'Western Europe',
      industry: customer.industry,
      pli: 'Operating Margin',
      minIndependencePct: 25,
      excludeLossMaking: true,
      maxResults: 12,
    },
    precedents: [
      {
        searchId: 'prev-001',
        criteria: {
          reportingCountry: customer.jurisdiction,
          industry: customer.industry,
          region: 'Global',
          pli: 'Operating Margin',
          minIndependencePct: 25,
          excludeLossMaking: true,
          maxResults: 10,
        },
        outcomeSummary: '9 accepted, IQR 4.2%–8.1%',
        similarity: 0.92,
      },
      {
        searchId: 'prev-002',
        criteria: {
          reportingCountry: customer.jurisdiction,
          industry: customer.industry,
          region: 'Western Europe',
          pli: 'Net Cost Plus',
          minIndependencePct: 30,
          excludeLossMaking: true,
          maxResults: 15,
        },
        outcomeSummary: '11 accepted, IQR 5.1%–9.3%',
        similarity: 0.85,
      },
    ],
  };
}

export function generateCompSearchRecord(
  customerId: string,
  customer: Customer,
  criteria: CompSearchCriteria,
  results: ComparablesSearch,
): CompSearchRecord {
  const verdicts: CompVerdict[] = results.accepted.map((a) => ({
    companyName: a.name,
    verdict: 'pending' as const,
    timestamp: new Date().toISOString(),
  }));

  const funnelStages: FunnelStage[] = [
    { label: 'Initial Universe', count: 450 + Math.floor(Math.random() * 200) },
    { label: 'SIC Filter', count: 80 + Math.floor(Math.random() * 40) },
    { label: 'Independence Screen', count: 35 + Math.floor(Math.random() * 15) },
    { label: 'Financial Data Available', count: 20 + Math.floor(Math.random() * 10) },
    { label: 'Quantitative Screen', count: results.accepted.length + results.rejected.length },
    { label: 'Final Accepted', count: results.accepted.length },
  ];

  const testedPartyContext: TestedPartyContext = {
    name: customer.name,
    jurisdiction: customer.jurisdiction,
    industry: customer.industry,
    functionalProfile: 'Limited-risk distributor',
    industryClassification: `SIC ${2000 + Math.floor(Math.random() * 6000)}`,
    description: `${customer.name} performs routine distribution functions in ${customer.jurisdiction}.`,
  };

  return {
    searchId: uid(),
    customerId,
    createdAt: new Date().toISOString(),
    criteria,
    testedPartyContext,
    results,
    verdicts,
    funnelStages,
    status: 'active',
  };
}

export function buildSeedCustomers(): Customer[] {
  const templates = [
    { name: 'Acme Robotics', jurisdiction: 'US', fiscalYear: 2024, industry: 'Industrial Manufacturing' },
    { name: 'Globex Pharma', jurisdiction: 'DE', fiscalYear: 2024, industry: 'Pharmaceuticals' },
    { name: 'Initech Software', jurisdiction: 'IE', fiscalYear: 2024, industry: 'Software' },
    { name: 'Umbra Semiconductors', jurisdiction: 'SG', fiscalYear: 2024, industry: 'Semiconductors' },
    { name: 'Wayne Consumer Co', jurisdiction: 'UK', fiscalYear: 2024, industry: 'Consumer Goods' },
  ];

  return templates.map((t) => {
    const id = uid();
    const now = new Date().toISOString();
    return {
      id,
      ...t,
      createdAt: now,
      reviewStatus: 'ready_for_review' as const,
      batchRunAt: now,
      steps: buildMockSteps(t),
      feedbacks: [],
      chatSessions: [],
    };
  });
}

function buildMockSteps(t: { name: string; jurisdiction: string; fiscalYear: number; industry: string }) {
  const now = new Date().toISOString();

  const entityData: EntityData = {
    legalName: `${t.name} ${t.jurisdiction} Ltd`,
    tin: `${t.jurisdiction}-${Math.floor(100000 + Math.random() * 900000)}`,
    incorporated: `${2005 + Math.floor(Math.random() * 15)}`,
    hqAddress: `123 Business Ave, ${t.jurisdiction}`,
    relatedParties: [
      { name: `${t.name} Holdings`, country: 'US', relationship: 'Parent' },
      { name: `${t.name} Asia`, country: 'SG', relationship: 'Subsidiary' },
    ],
    transactions: [
      { id: 'TX-001', type: 'Product Sales', counterparty: `${t.name} Holdings`, amountUsd: 45000000 },
      { id: 'TX-002', type: 'Service Fees', counterparty: `${t.name} Asia`, amountUsd: 8500000 },
      { id: 'TX-003', type: 'Royalties', counterparty: `${t.name} Holdings`, amountUsd: 3200000 },
    ],
    financials: { revenueUsd: 125000000, opIncomeUsd: 8750000, assetsUsd: 95000000 },
  };

  const bio: BioOutput = {
    overview: `${t.name} is a ${t.industry.toLowerCase()} company headquartered in ${t.jurisdiction}. The group operates through a principal-structure model in which the local entity primarily performs routine distribution and support functions on behalf of the group's central IP and risk-bearing entities.`,
    orgChart: `${t.name} Holdings (US)\n├── ${t.name} ${t.jurisdiction} Ltd (Tested Party)\n├── ${t.name} Asia (SG)\n└── ${t.name} IP Co (IE)`,
    keyPeople: [
      { name: 'Sarah Chen', role: 'Managing Director' },
      { name: 'James Mueller', role: 'CFO' },
      { name: 'Raj Patel', role: 'VP Operations' },
    ],
  };

  const transactional: TransactionalOutput = {
    transactions: [
      { id: 'TX-001', type: 'Product Sales', testedParty: `${t.name} ${t.jurisdiction}`, method: 'TNMM', pli: 'Operating Margin', range: { low: 3.2, median: 5.8, high: 8.4 }, tested: 7.0, conclusion: "Arm's length" },
      { id: 'TX-002', type: 'Service Fees', testedParty: `${t.name} ${t.jurisdiction}`, method: 'TNMM', pli: 'Net Cost Plus', range: { low: 5.0, median: 8.2, high: 12.1 }, tested: 9.4, conclusion: "Arm's length" },
      { id: 'TX-003', type: 'Royalties', testedParty: `${t.name} ${t.jurisdiction}`, method: 'CUP', pli: 'Royalty Rate', range: { low: 2.0, median: 3.5, high: 5.0 }, tested: 2.6, conclusion: "Arm's length" },
    ],
  };

  const economics: EconomicsOutput = {
    comparables: [
      { name: 'TechLogic Corp', country: 'US', industry: t.industry, pli: 5.2 },
      { name: 'DataSphere Inc', country: 'UK', industry: t.industry, pli: 6.8 },
      { name: 'AlphaWare Solutions', country: 'DE', industry: t.industry, pli: 4.9 },
      { name: 'NovaTech Ltd', country: 'FR', industry: t.industry, pli: 7.3 },
      { name: 'SynergyByte AG', country: 'NL', industry: t.industry, pli: 8.1 },
      { name: 'PrimeCore Holdings', country: 'SE', industry: t.industry, pli: 5.7 },
    ],
    iqr: { q1: 5.05, median: 6.25, q3: 7.65 },
    rejections: [
      { name: 'Quantum Dynamics', reason: 'Persistent loss-maker (3+ years)' },
      { name: 'Vertex Systems', reason: 'Insufficient independence (<25%)' },
    ],
  };

  const appendices: AppendicesOutput = {
    items: [
      { title: 'Appendix A — Functional Analysis', body: `Detailed functional analysis of ${t.name} including functions performed, assets employed, and risks assumed.` },
      { title: 'Appendix B — Rejected Comparables', body: 'Full list of rejected comparables with detailed reasons for exclusion from the benchmark set.' },
      { title: 'Appendix C — Financial Data', body: 'Three-year financial summaries of accepted comparable companies.' },
    ],
  };

  const regulations: RegulationsOutput = {
    jurisdiction: t.jurisdiction,
    citations: [
      { code: 'IRC §482', title: 'Allocation of income and deductions', note: "Governing arm's length standard." },
      { code: 'Treas. Reg. §1.482-5', title: 'Comparable profits method', note: 'Basis for TNMM application.' },
    ],
  };

  const execsum: ExecSummaryOutput = {
    summary: `This transfer pricing study analyzes the intercompany transactions of ${t.name} for fiscal year ${t.fiscalYear}. All tested transactions were found to be at arm's length using the TNMM with Operating Margin as the profit level indicator.`,
    keyFindings: [
      `${t.name}'s operating margin of 7.0% falls within the interquartile range of 5.05%–7.65%`,
      'All tested transactions comply with local transfer pricing regulations',
      'No adjustment is recommended for the current fiscal year',
    ],
  };

  const report: ReportOutput = {
    markdown: `# Transfer Pricing Report — ${t.name}\n\n## Executive Summary\n${execsum.summary}\n\n## Key Findings\n${execsum.keyFindings.map((f) => `- ${f}`).join('\n')}\n\n## Methodology\nThe TNMM was selected as the most appropriate method based on the tested party's functional profile as a limited-risk distributor.\n\n## Conclusion\nAll intercompany transactions are conducted at arm's length.`,
  };

  return {
    fetch: { status: 'done' as const, output: entityData, ranAt: now },
    bio: { status: 'done' as const, output: bio, ranAt: now },
    transactional: { status: 'done' as const, output: transactional, ranAt: now },
    economics: { status: 'done' as const, output: economics, ranAt: now },
    appendices: { status: 'done' as const, output: appendices, ranAt: now },
    regulations: { status: 'done' as const, output: regulations, ranAt: now },
    execsum: { status: 'done' as const, output: execsum, ranAt: now },
    report: { status: 'done' as const, output: report, ranAt: now },
  };
}

/** Seed manager reports for the dashboard */
export function buildManagerReports(): ManagerReport[] {
  const now = new Date();
  return [
    { customerId: 'mgr-1', customerName: 'Acme Robotics', jurisdiction: 'US', fiscalYear: 2024, assignedReviewer: 'Alice Johnson', status: 'In Review', lastUpdated: new Date(now.getTime() - 2 * 3600000).toISOString(), flags: ['outside_range'] },
    { customerId: 'mgr-2', customerName: 'Globex Pharma', jurisdiction: 'DE', fiscalYear: 2024, assignedReviewer: 'Bob Smith', status: 'Draft', lastUpdated: new Date(now.getTime() - 5 * 3600000).toISOString(), flags: ['overdue'] },
    { customerId: 'mgr-3', customerName: 'Initech Software', jurisdiction: 'IE', fiscalYear: 2024, assignedReviewer: 'Alice Johnson', status: 'In Review', lastUpdated: new Date(now.getTime() - 8 * 3600000).toISOString(), flags: [] },
    { customerId: 'mgr-4', customerName: 'Umbra Semiconductors', jurisdiction: 'SG', fiscalYear: 2024, assignedReviewer: 'Charlie Kim', status: 'Approved', lastUpdated: new Date(now.getTime() - 24 * 3600000).toISOString(), flags: [] },
    { customerId: 'mgr-5', customerName: 'Wayne Consumer Co', jurisdiction: 'UK', fiscalYear: 2024, assignedReviewer: 'Bob Smith', status: 'Draft', lastUpdated: new Date(now.getTime() - 48 * 3600000).toISOString(), flags: ['insufficient_comps'] },
    { customerId: 'mgr-6', customerName: 'NovaChem GmbH', jurisdiction: 'DE', fiscalYear: 2024, assignedReviewer: 'Diana Lee', status: 'Filed', lastUpdated: new Date(now.getTime() - 72 * 3600000).toISOString(), flags: [] },
    { customerId: 'mgr-7', customerName: 'TerraFirm Holdings', jurisdiction: 'US', fiscalYear: 2024, assignedReviewer: 'Charlie Kim', status: 'In Review', lastUpdated: new Date(now.getTime() - 4 * 3600000).toISOString(), flags: ['overdue', 'outside_range'] },
    { customerId: 'mgr-8', customerName: 'Pacific Logistics', jurisdiction: 'JP', fiscalYear: 2024, assignedReviewer: 'Alice Johnson', status: 'Approved', lastUpdated: new Date(now.getTime() - 96 * 3600000).toISOString(), flags: [] },
  ];
}

export function buildManagerMetrics(): ManagerMetrics {
  return {
    totalCompleted: 42,
    avgDraftToApproved: 5.3,
    overdueCount: 3,
    reviewerStats: [
      { name: 'Alice Johnson', completed: 14, avgCompletionDays: 4.2, compSearchQualityScore: 92 },
      { name: 'Bob Smith', completed: 11, avgCompletionDays: 6.1, compSearchQualityScore: 87 },
      { name: 'Charlie Kim', completed: 10, avgCompletionDays: 5.0, compSearchQualityScore: 91 },
      { name: 'Diana Lee', completed: 7, avgCompletionDays: 4.8, compSearchQualityScore: 95 },
    ],
  };
}

/** Seed GraphRAG entries */
export function buildSeedGraphRAG(): GraphRAGEntry[] {
  const now = new Date();
  return [
    {
      id: 'rag-001',
      ts: new Date(now.getTime() - 30 * 24 * 3600000).toISOString(),
      customerId: 'prev-cust-1',
      testedParty: { name: 'SimilarCo GmbH', jurisdiction: 'DE', industry: 'Software', functionalProfile: 'Limited-risk distributor' },
      criteria: { reportingCountry: 'DE', industry: 'Software', region: 'Western Europe', pli: 'Operating Margin', minIndependencePct: 25, excludeLossMaking: true, maxResults: 12 },
      results: generateCompSearchResults({ reportingCountry: 'DE', industry: 'Software', region: 'Western Europe', pli: 'Operating Margin', minIndependencePct: 25, excludeLossMaking: true, maxResults: 12 }),
      verdicts: [],
      tags: ['software', 'western-europe', 'limited-risk-distributor', 'operating-margin'],
    },
    {
      id: 'rag-002',
      ts: new Date(now.getTime() - 60 * 24 * 3600000).toISOString(),
      customerId: 'prev-cust-2',
      testedParty: { name: 'PharmaEU Ltd', jurisdiction: 'IE', industry: 'Pharmaceuticals', functionalProfile: 'Contract manufacturer' },
      criteria: { reportingCountry: 'IE', industry: 'Pharmaceuticals', region: 'Western Europe', pli: 'Net Cost Plus', minIndependencePct: 30, excludeLossMaking: true, maxResults: 15 },
      results: generateCompSearchResults({ reportingCountry: 'IE', industry: 'Pharmaceuticals', region: 'Western Europe', pli: 'Net Cost Plus', minIndependencePct: 30, excludeLossMaking: true, maxResults: 15 }),
      verdicts: [],
      tags: ['pharmaceuticals', 'western-europe', 'contract-manufacturer', 'net-cost-plus'],
    },
  ];
}

export function findRelevantGraphRAGEntries(
  entries: GraphRAGEntry[],
  customer: Customer,
): GraphRAGEntry[] {
  return entries
    .filter((e) => {
      const matchIndustry = e.testedParty.industry.toLowerCase() === customer.industry.toLowerCase();
      const matchJurisdiction = e.testedParty.jurisdiction === customer.jurisdiction;
      return matchIndustry || matchJurisdiction;
    })
    .sort((a, b) => {
      // Score by relevance
      let scoreA = 0, scoreB = 0;
      if (a.testedParty.industry.toLowerCase() === customer.industry.toLowerCase()) scoreA += 2;
      if (a.testedParty.jurisdiction === customer.jurisdiction) scoreA += 1;
      if (b.testedParty.industry.toLowerCase() === customer.industry.toLowerCase()) scoreB += 2;
      if (b.testedParty.jurisdiction === customer.jurisdiction) scoreB += 1;
      return scoreB - scoreA;
    })
    .slice(0, 5);
}
