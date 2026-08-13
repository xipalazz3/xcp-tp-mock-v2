import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Bot,
  User as UserIcon,
  Plus,
} from 'lucide-react';
import type { ChatMessage, Customer } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { VoiceButton } from '@/components/VoiceButton';
import { cn, fmtTime, uid, jitter } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useVerticalResize } from '@/hooks/useVerticalResize';

const MIN_HEIGHT = 160;
const MAX_HEIGHT = 640;
const COLLAPSED_HEIGHT = 40;

const MOCK_RESPONSES = [
  'Based on the comparable set, the tested party\'s operating margin of 8.42% falls within the full range (2.50%–19.23%) and above the interquartile range (4.22%–9.86%). No adjustment is warranted — minimum TP risk.',
  'I\'ve reviewed the functional analysis. The entity performs value-added distribution functions including after-sales service, installation, and local marketing, consistent with the TNMM application using Operating Margin as PLI.',
  'The comparable search yielded 17 companies in Australia. The five-year weighted average IQR is 4.22%–9.86% with a median of 5.57%. Three companies were rejected due to insufficient independence (<50% ownership threshold).',
  'Looking at the prior year comparison, all tested transactions remained within arm\'s length range. The margin movement is directionally consistent with market trends in the Australian industrial distribution sector.',
  'I can run a new comparable search with tighter SIC code filters if needed. Would you like me to narrow the industry classification or adjust the independence threshold?',
  'The scenario simulation shows that if the tested party\'s OM drops to 3.8% (below Q1 of 4.22%), a potential transfer pricing adjustment of approximately AUD 340K would be required to bring margins to the median of 5.57%.',
];

/** Generate a customer-specific summary with hyperlinks */
function buildSummary(customer: Customer) {
  const name = customer.name;
  const juris = customer.jurisdiction;
  const fy = customer.fiscalYear;
  return {
    greeting: `Report summary for ${name} (${juris}, FY ${fy}):`,
    sections: [
      {
        label: 'Tested Party Profile',
        text: `${name} is characterized as a value-added distributor performing local sales, marketing, after-sales service, and warehousing. Selected as the tested party under TNMM with Operating Margin as PLI.`,
        link: 'economics',
        linkLabel: 'View Economic Analysis →',
      },
      {
        label: 'Comparable Search Result',
        text: `8 accepted comparables identified in ${juris}. Five-year weighted average IQR: 4.22%–9.86% (median 5.57%). 7 companies rejected (ownership, losses, dissimilar function).`,
        link: 'economics',
        linkLabel: 'View Comp List →',
      },
      {
        label: 'Similar Prior Analyses Found',
        text: `3 existing analyses match this profile (95%, 78%, 65% similarity). Includes reusable paragraphs for tested party characterization, method selection, and RAP conclusion.`,
        link: 'economics',
        linkLabel: 'View Similar Analyses →',
      },
      {
        label: 'Transactions',
        text: `3 intercompany transactions tested. All fall within arm's length range — no adjustment required. Method: TNMM (distribution), TNMM (services), CUP (financing).`,
        link: 'transactional',
        linkLabel: 'View Transactional Analysis →',
      },
    ],
    attentionItems: [
      {
        text: `Operating margin (8.42%) is above the IQR median — consider documenting rationale if margin is volatile year-over-year.`,
        severity: 'info' as const,
        link: 'economics',
        linkLabel: 'Scenario Simulation →',
      },
      {
        text: `7 rejected comparables include 3 companies with >50% ownership that may warrant a second look if independence criteria are relaxed.`,
        severity: 'warning' as const,
        link: 'economics',
        linkLabel: 'View Rejected List →',
      },
      {
        text: `Report template not yet generated — populate from default template or upload a custom one.`,
        severity: 'action' as const,
        link: 'report',
        linkLabel: 'Generate Report →',
      },
    ],
  };
}

export function ChatPanel({ customer, onNavigate }: { customer: Customer; onNavigate?: (tab: string) => void }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatPanelHeight = useAppStore((s) => s.chatPanelHeight);
  const setChatPanelHeight = useAppStore((s) => s.setChatPanelHeight);
  const startNewChatSession = useAppStore((s) => s.startNewChatSession);
  const saveChatSession = useAppStore((s) => s.saveChatSession);
  const deleteChatSession = useAppStore((s) => s.deleteChatSession);

  const activeSession = customer.chatSessions?.find((s) => s.id === customer.activeChatSessionId) ?? null;

  const { onPointerDown: onResizeStart } = useVerticalResize({
    value: chatPanelHeight,
    onChange: setChatPanelHeight,
    min: MIN_HEIGHT,
    max: MAX_HEIGHT,
  });

  useEffect(() => {
    setMessages(activeSession?.messages ?? []);
    setStreaming('');
  }, [customer.id, customer.activeChatSessionId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    let sessionId = customer.activeChatSessionId;
    let currentMessages = messages;
    if (!sessionId || !customer.chatSessions?.some((s) => s.id === sessionId)) {
      const session = startNewChatSession(customer.id);
      sessionId = session.id;
      currentMessages = [];
    }

    setBusy(true);
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, ts: new Date().toISOString(), role: 'user', content: text };
    const next = [...currentMessages, userMsg];
    setMessages(next);
    setInput('');
    setStreaming('');

    await jitter(600, 1200);
    const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    let accumulated = '';
    for (let i = 0; i < response.length; i += 3) {
      accumulated += response.slice(i, i + 3);
      setStreaming(accumulated);
      await new Promise((r) => setTimeout(r, 20));
    }

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      ts: new Date().toISOString(),
      role: 'assistant',
      content: response,
    };
    const final = [...next, assistantMsg];
    setMessages(final);
    saveChatSession(customer.id, sessionId!, final);
    setStreaming('');
    setBusy(false);
  };

  const handleLinkClick = (tab: string) => {
    onNavigate?.(tab);
  };

  const summary = buildSummary(customer);
  const showSummary = messages.length === 0 && !busy;

  return (
    <section
      className="relative flex flex-col border-t border-border bg-white"
      style={{ height: open ? chatPanelHeight : COLLAPSED_HEIGHT }}
    >
      <header
        className="flex h-10 shrink-0 cursor-pointer items-center justify-between gap-2 px-4 hover:bg-muted"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex min-w-0 items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
          <span className="shrink-0 text-sm font-semibold">Agent Chat</span>
          <div onClick={(e) => e.stopPropagation()}>
            <VoiceButton />
          </div>
          <span className="truncate text-[11px] text-muted-fg">
            · {activeSession ? activeSession.title : customer.name} · {messages.length} message{messages.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {open && (
            <>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); startNewChatSession(customer.id); }} title="New conversation">
                <Plus className="h-3.5 w-3.5" />
              </Button>
              {activeSession && messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (activeSession) deleteChatSession(customer.id, activeSession.id); }} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
          {open ? <ChevronDown className="h-4 w-4 text-muted-fg" /> : <ChevronUp className="h-4 w-4 text-muted-fg" />}
        </div>
      </header>

      {open && (
        <>
          <div
            className="group flex h-2.5 shrink-0 cursor-ns-resize items-center justify-center bg-transparent"
            onPointerDown={onResizeStart}
          >
            <div className="h-1 w-10 rounded-full bg-border group-hover:bg-primary/40" />
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2">
            {/* Pre-populated summary when no messages */}
            {showSummary && (
              <div className="space-y-3">
                {/* Summary header */}
                <div className="flex gap-2">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed">
                    <div className="mb-2 font-semibold text-fg">{summary.greeting}</div>

                    {/* Report sections */}
                    <div className="space-y-2">
                      {summary.sections.map((s, i) => (
                        <div key={i} className="rounded border border-border bg-white p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-fg">{s.label}</div>
                              <div className="mt-0.5 text-[11px] text-fg">{s.text}</div>
                            </div>
                            <button
                              onClick={() => handleLinkClick(s.link)}
                              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                            >
                              {s.linkLabel}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Attention items */}
                    <div className="mt-3">
                      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Needs Attention</div>
                      <div className="space-y-1.5">
                        {summary.attentionItems.map((item, i) => (
                          <div key={i} className={cn(
                            'flex items-start gap-2 rounded border p-2',
                            item.severity === 'info' && 'border-blue-200 bg-blue-50/50',
                            item.severity === 'warning' && 'border-amber-200 bg-amber-50/50',
                            item.severity === 'action' && 'border-purple-200 bg-purple-50/50',
                          )}>
                            <div className={cn(
                              'mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full',
                              item.severity === 'info' && 'bg-blue-500',
                              item.severity === 'warning' && 'bg-amber-500',
                              item.severity === 'action' && 'bg-purple-500',
                            )} />
                            <div className="flex-1 text-[11px]">{item.text}</div>
                            <button
                              onClick={() => handleLinkClick(item.link)}
                              className={cn(
                                'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                                item.severity === 'info' && 'text-blue-700 hover:bg-blue-100',
                                item.severity === 'warning' && 'text-amber-700 hover:bg-amber-100',
                                item.severity === 'action' && 'text-purple-700 hover:bg-purple-100',
                              )}
                            >
                              {item.linkLabel}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 border-t border-border pt-2 text-[10px] text-muted-fg">
                      Ask me to revise any section, explain a finding, run a comp search, or generate the report.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation messages */}
            <ul className="space-y-2">
              {messages.map((m) => (
                <li key={m.id} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.role === 'assistant' && (
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[70%] whitespace-pre-wrap rounded-lg px-3 py-1.5 text-xs leading-relaxed',
                      m.role === 'user' ? 'bg-primary text-primary-fg' : 'bg-muted text-fg',
                    )}
                  >
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserIcon className="h-3 w-3 text-muted-fg" />
                    </div>
                  )}
                </li>
              ))}
              {streaming && (
                <li className="flex gap-2">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="max-w-[70%] whitespace-pre-wrap rounded-lg bg-muted px-3 py-1.5 text-xs text-fg">
                    {streaming}<span className="animate-pulse">▍</span>
                  </div>
                </li>
              )}
              {busy && !streaming && (
                <li className="flex gap-2">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-fg">
                    <Loader2 className="inline h-3 w-3 animate-spin" /> thinking…
                  </div>
                </li>
              )}
            </ul>
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={busy}
              placeholder="Ask the agent to revise, explain, or dig in…"
              className="input flex-1"
            />
            <Button onClick={send} disabled={busy || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
