export type StepId =
  | 'fetch'
  | 'bio'
  | 'transactional'
  | 'economics'
  | 'appendices'
  | 'regulations'
  | 'execsum'
  | 'report';

export const STEP_ORDER: StepId[] = [
  'fetch',
  'bio',
  'transactional',
  'economics',
  'appendices',
  'regulations',
  'execsum',
  'report',
];

export const STEP_LABEL: Record<StepId, string> = {
  fetch: 'Fetch Data',
  bio: 'Company Bio',
  transactional: 'Transactional',
  economics: 'Economics',
  appendices: 'Appendices',
  regulations: 'Regulations',
  execsum: 'Exec Summary',
  report: 'Report',
};

export type StepStatus = 'idle' | 'running' | 'done' | 'error';

export interface StepState {
  status: StepStatus;
  output?: unknown;
  ranAt?: string;
  error?: string;
}

export type ReviewStatus =
  | 'processing'
  | 'ready_for_review'
  | 'in_review'
  | 'approved'
  | 'sent_back'
  | 'failed';

export type FeedbackAction = 'reject' | 'edit' | 'flag';

export interface Feedback {
  id: string;
  ts: string;
  customerId: string;
  stepId: StepId;
  fieldPath: string;
  start: number;
  end: number;
  quotedText: string;
  action: FeedbackAction;
  replacement?: string;
  note?: string;
  resolved?: boolean;
}

export interface ChatMessage {
  id: string;
  ts: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface Customer {
  id: string;
  name: string;
  jurisdiction: string;
  fiscalYear: number;
  industry: string;
  createdAt: string;
  reviewStatus: ReviewStatus;
  batchRunAt?: string;
  steps: Record<StepId, StepState>;
  feedbacks: Feedback[];
  chatSessions?: ChatSession[];
  activeChatSessionId?: string;
  comparablesSearch?: ComparablesSearch;
  priorYearComparison?: PriorYearComparison;
  compSearchRecord?: CompSearchRecord;
}

export interface CompSearchCriteria {
  reportingCountry: string;
  industry: string;
  region: string;
  pli: string;
  minIndependencePct: number;
  excludeLossMaking: boolean;
  maxResults: number;
}

export interface ComparablesSearch {
  criteria: CompSearchCriteria;
  accepted: { name: string; country: string; industry: string; pli: number }[];
  rejected: { name: string; reason: string }[];
  pliValues: number[];
  searchNotes: string;
  quartileGuidance: string;
  ranAt?: string;
}

export interface PriorYearComparison {
  customerId: string;
  currentFiscalYear: number;
  priorFiscalYear: number;
  basis: string;
  metrics: {
    metric: string;
    current: number;
    prior: number;
    changePct: number;
    direction: string;
  }[];
  transactionMovements: {
    id: string;
    type: string;
    currentTestedPct: number;
    priorTestedPct: number;
    changePct: number;
    flag: string;
  }[];
  observations: string[];
  ranAt?: string;
}

export const COMP_SEARCH_REGIONS = [
  'Global',
  'North America',
  'Western Europe',
  'Asia Pacific',
] as const;

export const COMP_SEARCH_PLIS = [
  'Operating Margin',
  'Net Cost Plus',
  'Berry Ratio',
  'Gross Margin',
  'Return on Operating Assets',
] as const;

export interface EntityData {
  legalName: string;
  tin: string;
  incorporated: string;
  hqAddress: string;
  relatedParties: { name: string; country: string; relationship: string }[];
  transactions: { id: string; type: string; counterparty: string; amountUsd: number }[];
  financials: { revenueUsd: number; opIncomeUsd: number; assetsUsd: number };
}

export interface BioOutput {
  overview: string;
  orgChart: string;
  keyPeople: { name: string; role: string }[];
}

export interface TransactionalOutput {
  transactions: {
    id: string;
    type: string;
    testedParty: string;
    method: 'TNMM' | 'CUP' | 'CPM' | 'RPM';
    pli: string;
    range: { low: number; median: number; high: number };
    tested: number;
    conclusion: "Arm's length" | 'Outside range';
  }[];
}

export interface EconomicsOutput {
  comparables: { name: string; country: string; industry: string; pli: number }[];
  iqr: { q1: number; median: number; q3: number };
  rejections: { name: string; reason: string }[];
}

export interface AppendicesOutput {
  items: { title: string; body: string }[];
}

export interface RegulationsOutput {
  jurisdiction: string;
  citations: { code: string; title: string; note: string }[];
}

export interface ExecSummaryOutput {
  summary: string;
  keyFindings: string[];
}

export interface ReportOutput {
  markdown: string;
}

export interface FunnelStage {
  label: string;
  count: number;
}

export interface CompVerdict {
  companyName: string;
  verdict: 'accept' | 'reject' | 'pending';
  reason?: string;
  timestamp?: string;
}

export interface CompSearchRecord {
  searchId: string;
  customerId: string;
  createdAt: string;
  criteria: CompSearchCriteria;
  testedPartyContext: TestedPartyContext;
  results: ComparablesSearch;
  verdicts: CompVerdict[];
  funnelStages?: FunnelStage[];
  status: 'active' | 'finalized';
}

export interface TestedPartyContext {
  name: string;
  jurisdiction: string;
  industry: string;
  functionalProfile: string;
  industryClassification?: string;
  description?: string;
}

export interface CriteriaRecommendation {
  functionalProfile: string;
  recommendedCriteria: Partial<CompSearchCriteria>;
  precedents: SearchPrecedent[];
}

export interface SearchPrecedent {
  searchId: string;
  criteria: CompSearchCriteria;
  outcomeSummary: string;
  similarity: number;
}

export interface IQR {
  q1: number;
  median: number;
  q3: number;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export type ManagerReportStatus = 'Draft' | 'In Review' | 'Approved' | 'Filed';

export type AttentionFlag = 'overdue' | 'outside_range' | 'insufficient_comps';

export interface ManagerReport {
  customerId: string;
  customerName: string;
  jurisdiction: string;
  fiscalYear: number;
  assignedReviewer: string;
  status: ManagerReportStatus;
  lastUpdated: string;
  flags: AttentionFlag[];
}

export interface ReviewerStat {
  name: string;
  completed: number;
  avgCompletionDays: number;
  compSearchQualityScore: number;
}

export interface ManagerMetrics {
  totalCompleted: number;
  avgDraftToApproved: number;
  overdueCount: number;
  reviewerStats: ReviewerStat[];
}

/** GraphRAG storage types */
export interface GraphRAGEntry {
  id: string;
  ts: string;
  customerId: string;
  testedParty: TestedPartyContext;
  criteria: CompSearchCriteria;
  results: ComparablesSearch;
  verdicts: CompVerdict[];
  tags: string[];
}

export type ActiveView = 'queue' | 'hub' | 'manager';
