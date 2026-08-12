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
import { cn, fmtTime, uid, jitter } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useVerticalResize } from '@/hooks/useVerticalResize';

const MIN_HEIGHT = 160;
const MAX_HEIGHT = 640;
const COLLAPSED_HEIGHT = 40;

const MOCK_RESPONSES = [
  'Based on the comparable set, the tested party\'s operating margin of 7.0% falls within the interquartile range. No adjustment is warranted.',
  'I\'ve reviewed the functional analysis. The entity performs routine distribution functions with limited risk, consistent with the TNMM application.',
  'The comparable search yielded 8 companies in the same industry segment. Three were rejected due to insufficient independence. The remaining set shows a healthy IQR of 5.1%–8.3%.',
  'Looking at the prior year comparison, all tested transactions remained within arm\'s length range. The margin movement is directionally consistent with market trends.',
  'I can run a new comparable search with tighter SIC code filters if needed. Would you like me to narrow the industry classification?',
];

export function ChatPanel({ customer }: { customer: Customer }) {
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

    // Simulate streaming response
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
          <span className="shrink-0 text-sm font-semibold">Agent chat</span>
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
            {messages.length === 0 && !busy && (
              <div className="pt-4 text-center text-xs text-muted-fg">
                Ask the agent to revise a section, explain a finding, or run tools.
              </div>
            )}
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
