import { useMemo, useState } from 'react';
import { Plus, Inbox, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { NewCustomerDialog } from '@/components/NewCustomerDialog';
import { cn, fmtTime } from '@/lib/utils';
import type { ChatSession } from '@/lib/types';

interface HistoryGroup {
  customerId: string;
  customerName: string;
  activeChatSessionId?: string;
  sessions: ChatSession[];
  mostRecent: string;
}

export function LeftRail() {
  const customers = useAppStore((s) => s.customers);
  const selectedId = useAppStore((s) => s.selectedId);
  const select = useAppStore((s) => s.select);
  const lastBatchAt = useAppStore((s) => s.lastBatchAt);
  const switchChatSession = useAppStore((s) => s.switchChatSession);
  const [open, setOpen] = useState(false);
  const [collapsedCustomers, setCollapsedCustomers] = useState<Set<string>>(new Set());

  const toggleGroupCollapsed = (customerId: string) => {
    setCollapsedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  };

  const ordered = [...customers].sort((a, b) => {
    const ra = a.batchRunAt ?? a.createdAt;
    const rb = b.batchRunAt ?? b.createdAt;
    return rb.localeCompare(ra);
  });

  const historyGroups = useMemo<HistoryGroup[]>(() => {
    const groups: HistoryGroup[] = [];
    for (const c of customers) {
      const sessions = c.chatSessions ?? [];
      if (sessions.length === 0) continue;
      const sorted = [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      groups.push({
        customerId: c.id,
        customerName: c.name,
        activeChatSessionId: c.activeChatSessionId,
        sessions: sorted,
        mostRecent: sorted[0].updatedAt,
      });
    }
    groups.sort((a, b) => b.mostRecent.localeCompare(a.mostRecent));
    return groups;
  }, [customers]);

  const openHistoryEntry = (customerId: string, sessionId: string) => {
    select(customerId);
    switchChatSession(customerId, sessionId);
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-white">
      <div className="space-y-2 p-3">
        <Button className="w-full" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New Customer
        </Button>
      </div>
      <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">
        Work Queue
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {ordered.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-fg">
            <Inbox className="h-8 w-8 opacity-40" />
            Queue is empty
          </div>
        )}
        {ordered.map((c) => (
          <button
            key={c.id}
            onClick={() => select(c.id)}
            className={cn(
              'mb-1 w-full rounded-md border px-3 py-2 text-left transition-colors',
              selectedId === c.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="truncate text-sm font-medium">{c.name}</div>
              <StatusBadge status={c.reviewStatus} />
            </div>
            <div className="mt-0.5 text-[11px] text-muted-fg">
              {c.jurisdiction} · FY{c.fiscalYear} · {c.industry}
            </div>
          </button>
        ))}
      </div>

      {/* Conversation History */}
      <div className="flex shrink-0 flex-col border-t border-border" style={{ height: 200 }}>
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">
          Conversation History
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {historyGroups.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-4 text-center text-xs text-muted-fg">
              <MessageSquare className="h-6 w-6 opacity-40" />
              No conversations yet
            </div>
          )}
          {historyGroups.map((group) => {
            const collapsed = collapsedCustomers.has(group.customerId);
            return (
              <div key={group.customerId} className="mb-2">
                <button
                  onClick={() => toggleGroupCollapsed(group.customerId)}
                  className="flex w-full items-center gap-1 rounded px-1 py-1 text-left hover:bg-muted"
                >
                  {collapsed ? (
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-fg" />
                  ) : (
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-fg" />
                  )}
                  <span className="truncate text-[11px] font-semibold text-fg">{group.customerName}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-fg">{group.sessions.length}</span>
                </button>
                {!collapsed &&
                  group.sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openHistoryEntry(group.customerId, s.id)}
                      className={cn(
                        'mb-0.5 block w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted',
                        selectedId === group.customerId && s.id === group.activeChatSessionId && 'bg-primary/5',
                      )}
                    >
                      <div className="truncate text-xs">{s.title}</div>
                      <div className="text-[10px] text-muted-fg">{fmtTime(s.updatedAt)} · {s.messages.length} msg</div>
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border px-3 py-2 text-[11px] text-muted-fg">
        Last batch: {fmtTime(lastBatchAt ?? undefined)} · {customers.length} processed
      </div>
      <NewCustomerDialog open={open} onOpenChange={setOpen} />
    </aside>
  );
}
