import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ActiveView,
  ChatMessage,
  ChatSession,
  CompSearchCriteria,
  CompSearchRecord,
  CompVerdict,
  CriteriaRecommendation,
  Customer,
  Feedback,
  GraphRAGEntry,
  IQR,
  ManagerMetrics,
  ManagerReport,
  ReviewStatus,
  StepId,
  StepState,
  VoiceState,
} from '@/lib/types';
import { STEP_ORDER } from '@/lib/types';
import { uid, summarizeText, namePrefix, computeIQR, jitter } from '@/lib/utils';
import {
  buildSeedCustomers,
  buildManagerReports,
  buildManagerMetrics,
  buildSeedGraphRAG,
  generateCompSearchResults,
  generateCompSearchRecord,
  generateCriteriaRecommendation,
  findRelevantGraphRAGEntries,
} from '@/lib/mockData';

interface AppState {
  customers: Customer[];
  selectedId: string | null;
  seeded: boolean;
  lastBatchAt: string | null;
  activeView: ActiveView;
  chatPanelHeight: number;
  voiceState: VoiceState;

  // Manager dashboard
  managerReports: ManagerReport[];
  managerMetrics: ManagerMetrics | null;

  // GraphRAG
  graphRAGEntries: GraphRAGEntry[];

  // Tool running state
  toolRunning: Record<string, boolean>;

  // Actions
  setActiveView: (v: ActiveView) => void;
  setChatPanelHeight: (px: number) => void;
  hydrateSeeds: () => void;
  select: (id: string) => void;
  addCustomer: (input: Pick<Customer, 'name' | 'jurisdiction' | 'fiscalYear' | 'industry'>) => Customer;
  setStep: (customerId: string, stepId: StepId, patch: Partial<StepState>) => void;
  setReviewStatus: (customerId: string, status: ReviewStatus) => void;

  // Comp search
  runComparablesSearch: (customerId: string, criteria: CompSearchCriteria) => Promise<void>;
  fetchCriteriaRecommendation: (customerId: string) => CriteriaRecommendation;
  saveVerdict: (customerId: string, searchId: string, companyName: string, verdict: 'accept' | 'reject', reason?: string) => IQR | null;
  getRelevantCompLists: (customerId: string) => GraphRAGEntry[];

  // Chat
  startNewChatSession: (customerId: string) => ChatSession;
  switchChatSession: (customerId: string, sessionId: string) => void;
  saveChatSession: (customerId: string, sessionId: string, messages: ChatMessage[]) => void;
  deleteChatSession: (customerId: string, sessionId: string) => void;

  // Feedback
  addFeedback: (fb: Omit<Feedback, 'id' | 'ts'>) => Feedback;
  deleteFeedback: (customerId: string, feedbackId: string) => void;
  resolveFeedback: (customerId: string, feedbackId: string) => void;

  // Voice
  setVoiceState: (state: VoiceState) => void;

  // Manager
  fetchManagerReports: () => void;
  fetchManagerMetrics: () => void;
  approveReport: (customerId: string) => void;
  sendBackReport: (customerId: string, comment: string) => void;
}

function emptySteps(): Record<StepId, StepState> {
  return STEP_ORDER.reduce((acc, s) => {
    acc[s] = { status: 'idle' };
    return acc;
  }, {} as Record<StepId, StepState>);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      customers: [],
      selectedId: null,
      seeded: false,
      lastBatchAt: null,
      activeView: 'queue',
      chatPanelHeight: 256,
      voiceState: 'idle' as VoiceState,
      managerReports: [],
      managerMetrics: null,
      graphRAGEntries: [],
      toolRunning: {},

      setActiveView: (v) => set({ activeView: v }),
      setChatPanelHeight: (px) => set({ chatPanelHeight: px }),

      hydrateSeeds: () => {
        if (get().seeded) return;
        const customers = buildSeedCustomers();
        const graphRAGEntries = buildSeedGraphRAG();
        const managerReports = buildManagerReports();
        const managerMetrics = buildManagerMetrics();
        set({
          customers,
          seeded: true,
          selectedId: customers[0]?.id ?? null,
          lastBatchAt: new Date().toISOString(),
          graphRAGEntries,
          managerReports,
          managerMetrics,
        });
      },

      select: (id) => set({ selectedId: id }),

      addCustomer: (input) => {
        const now = new Date().toISOString();
        const c: Customer = {
          id: uid(),
          ...input,
          createdAt: now,
          reviewStatus: 'ready_for_review',
          batchRunAt: now,
          steps: emptySteps(),
          feedbacks: [],
          chatSessions: [],
        };
        set((s) => ({ customers: [c, ...s.customers], selectedId: c.id }));
        return c;
      },

      setStep: (customerId, stepId, patch) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id !== customerId
              ? c
              : { ...c, steps: { ...c.steps, [stepId]: { ...c.steps[stepId], ...patch } } },
          ),
        })),

      setReviewStatus: (customerId, status) =>
        set((s) => ({
          customers: s.customers.map((c) => (c.id === customerId ? { ...c, reviewStatus: status } : c)),
        })),

      runComparablesSearch: async (customerId, criteria) => {
        set((s) => ({ toolRunning: { ...s.toolRunning, [`${customerId}:comp`]: true } }));
        // Simulate network delay
        await jitter(800, 1500);
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) {
          set((s) => ({ toolRunning: { ...s.toolRunning, [`${customerId}:comp`]: false } }));
          return;
        }
        const results = generateCompSearchResults(criteria);
        const record = generateCompSearchRecord(customerId, customer, criteria, results);

        // Store in GraphRAG
        const ragEntry: GraphRAGEntry = {
          id: uid(),
          ts: new Date().toISOString(),
          customerId,
          testedParty: record.testedPartyContext,
          criteria,
          results,
          verdicts: record.verdicts,
          tags: [
            criteria.industry.toLowerCase(),
            criteria.region.toLowerCase().replace(/\s+/g, '-'),
            record.testedPartyContext.functionalProfile.toLowerCase().replace(/\s+/g, '-'),
            criteria.pli.toLowerCase().replace(/\s+/g, '-'),
          ],
        };

        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? { ...c, comparablesSearch: results, compSearchRecord: record }
              : c,
          ),
          graphRAGEntries: [...s.graphRAGEntries, ragEntry],
          toolRunning: { ...s.toolRunning, [`${customerId}:comp`]: false },
        }));
      },

      fetchCriteriaRecommendation: (customerId) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) throw new Error('Customer not found');
        return generateCriteriaRecommendation(customer);
      },

      saveVerdict: (customerId, searchId, companyName, verdict, reason?) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer?.compSearchRecord || customer.compSearchRecord.searchId !== searchId) return null;

        const newVerdict: CompVerdict = { companyName, verdict, reason, timestamp: new Date().toISOString() };
        const existingIdx = customer.compSearchRecord.verdicts.findIndex((v) => v.companyName === companyName);
        const updatedVerdicts = existingIdx >= 0
          ? customer.compSearchRecord.verdicts.map((v, i) => (i === existingIdx ? newVerdict : v))
          : [...customer.compSearchRecord.verdicts, newVerdict];

        // Compute updated IQR based on accepted companies
        const acceptedNames = new Set(
          updatedVerdicts.filter((v) => v.verdict === 'accept').map((v) => v.companyName),
        );
        const acceptedPlis = customer.compSearchRecord.results.accepted
          .filter((a) => acceptedNames.has(a.name))
          .map((a) => a.pli);
        const iqr = acceptedPlis.length >= 3 ? computeIQR(acceptedPlis) : null;

        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId && c.compSearchRecord?.searchId === searchId
              ? { ...c, compSearchRecord: { ...c.compSearchRecord, verdicts: updatedVerdicts } }
              : c,
          ),
        }));

        return iqr;
      },

      getRelevantCompLists: (customerId) => {
        const customer = get().customers.find((c) => c.id === customerId);
        if (!customer) return [];
        return findRelevantGraphRAGEntries(get().graphRAGEntries, customer);
      },

      startNewChatSession: (customerId) => {
        const now = new Date().toISOString();
        const session: ChatSession = {
          id: uid(),
          title: 'New conversation',
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, chatSessions: [...(c.chatSessions ?? []), session], activeChatSessionId: session.id }
              : c,
          ),
        }));
        return session;
      },

      switchChatSession: (customerId, sessionId) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, activeChatSessionId: sessionId } : c,
          ),
        }));
      },

      saveChatSession: (customerId, sessionId, messages) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const sessions = c.chatSessions ?? [];
            const idx = sessions.findIndex((s) => s.id === sessionId);
            if (idx === -1) return c;
            const existing = sessions[idx];
            const firstUserMsg = messages.find((m) => m.role === 'user');
            const title =
              existing.title === 'New conversation' && firstUserMsg
                ? `${namePrefix(c.name)} — ${summarizeText(firstUserMsg.content)}`
                : existing.title;
            const nextSessions = [...sessions];
            nextSessions[idx] = { ...existing, messages, title, updatedAt: new Date().toISOString() };
            return { ...c, chatSessions: nextSessions };
          }),
        }));
      },

      deleteChatSession: (customerId, sessionId) => {
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id !== customerId) return c;
            const nextSessions = (c.chatSessions ?? []).filter((s) => s.id !== sessionId);
            const activeChatSessionId = c.activeChatSessionId === sessionId ? undefined : c.activeChatSessionId;
            return { ...c, chatSessions: nextSessions, activeChatSessionId };
          }),
        }));
      },

      addFeedback: (fb) => {
        const full: Feedback = { ...fb, id: uid(), ts: new Date().toISOString() };
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === fb.customerId ? { ...c, feedbacks: [...c.feedbacks, full] } : c,
          ),
        }));
        return full;
      },

      deleteFeedback: (customerId, feedbackId) => {
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId ? { ...c, feedbacks: c.feedbacks.filter((f) => f.id !== feedbackId) } : c,
          ),
        }));
      },

      resolveFeedback: (customerId, feedbackId) => {
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? { ...c, feedbacks: c.feedbacks.map((f) => (f.id === feedbackId ? { ...f, resolved: true } : f)) }
              : c,
          ),
        }));
      },

      setVoiceState: (state) => set({ voiceState: state }),

      fetchManagerReports: () => {
        const reports = buildManagerReports();
        set({ managerReports: reports });
      },

      fetchManagerMetrics: () => {
        const metrics = buildManagerMetrics();
        set({ managerMetrics: metrics });
      },

      approveReport: (customerId) => {
        set((s) => ({
          managerReports: s.managerReports.map((r) =>
            r.customerId === customerId ? { ...r, status: 'Approved' as const, lastUpdated: new Date().toISOString(), flags: [] } : r,
          ),
        }));
      },

      sendBackReport: (customerId, _comment) => {
        set((s) => ({
          managerReports: s.managerReports.map((r) =>
            r.customerId === customerId ? { ...r, status: 'Draft' as const, lastUpdated: new Date().toISOString() } : r,
          ),
        }));
      },
    }),
    {
      name: 'tp-reviewer-mock-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        customers: s.customers,
        seeded: s.seeded,
        selectedId: s.selectedId,
        lastBatchAt: s.lastBatchAt,
        activeView: s.activeView,
        chatPanelHeight: s.chatPanelHeight,
        managerReports: s.managerReports,
        managerMetrics: s.managerMetrics,
        graphRAGEntries: s.graphRAGEntries,
      }),
    },
  ),
);
