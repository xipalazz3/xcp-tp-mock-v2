import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ReportTabs } from '@/components/ReportTabs';
import { ChatPanel } from '@/components/ChatPanel';
import { CheckCircle2 } from 'lucide-react';
import { fmtTime } from '@/lib/utils';

export function MainPanel() {
  const selected = useAppStore((s) => s.customers.find((c) => c.id === s.selectedId));
  const setReviewStatus = useAppStore((s) => s.setReviewStatus);

  if (!selected) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-muted-fg">
        Select a customer from the work queue.
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{selected.name}</h1>
          <StatusBadge status={selected.reviewStatus} />
        </div>
        <div className="mt-0.5 text-xs text-muted-fg">
          {selected.jurisdiction} · FY{selected.fiscalYear} · {selected.industry} · Batch run {fmtTime(selected.batchRunAt)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <ReportTabs customer={selected} />
      </div>

      <ChatPanel customer={selected} />

      <footer className="flex items-center justify-end gap-2 border-t border-border bg-white px-6 py-3">
        <Button variant="outline" onClick={() => setReviewStatus(selected.id, 'sent_back')}>
          Send Back
        </Button>
        <Button onClick={() => setReviewStatus(selected.id, 'approved')}>
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </Button>
      </footer>
    </main>
  );
}
