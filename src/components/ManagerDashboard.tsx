import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, CornerDownLeft, AlertTriangle, Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, fmtTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import type { AttentionFlag, ManagerReport, ManagerReportStatus, ManagerMetrics } from '@/lib/types';

const STATUS_ORDER: ManagerReportStatus[] = ['Draft', 'In Review', 'Approved', 'Filed'];

const FLAG_CONFIG: Record<AttentionFlag, { label: string; className: string }> = {
  overdue: { label: 'Overdue', className: 'bg-amber-100 text-amber-800 border-amber-300' },
  outside_range: { label: 'Outside Range', className: 'bg-red-100 text-red-700 border-red-300' },
  insufficient_comps: { label: 'Insufficient Comps', className: 'bg-orange-100 text-orange-700 border-orange-300' },
};

function AttentionBadge({ flag }: { flag: AttentionFlag }) {
  const config = FLAG_CONFIG[flag];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', config.className)}>
      {config.label}
    </span>
  );
}

/* ---------- Metrics Panel ---------- */

function MetricsPanel({ metrics }: { metrics: ManagerMetrics }) {
  return (
    <div className="grid grid-cols-4 gap-4 border-b border-border p-4">
      <MetricCard
        icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        label="Completed (YTD)"
        value={String(metrics.totalCompleted)}
      />
      <MetricCard
        icon={<Clock className="h-5 w-5 text-blue-600" />}
        label="Avg Days to Approve"
        value={`${metrics.avgDraftToApproved.toFixed(1)}`}
      />
      <MetricCard
        icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
        label="Overdue"
        value={String(metrics.overdueCount)}
        highlight={metrics.overdueCount > 0}
      />
      <MetricCard
        icon={<Users className="h-5 w-5 text-purple-600" />}
        label="Active Reviewers"
        value={String(metrics.reviewerStats.length)}
      />
    </div>
  );
}

function MetricCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('rounded-lg border p-3', highlight ? 'border-amber-300 bg-amber-50' : 'border-border')}>
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <div className={cn('text-xl font-bold', highlight ? 'text-amber-800' : 'text-fg')}>{value}</div>
          <div className="text-[11px] text-muted-fg">{label}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Reviewer Stats Table ---------- */

function ReviewerStatsTable({ metrics }: { metrics: ManagerMetrics }) {
  return (
    <div className="border-b border-border p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-fg">Team Performance</div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-fg">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Reviewer</th>
              <th className="px-3 py-2 text-right font-medium">Completed</th>
              <th className="px-3 py-2 text-right font-medium">Avg Days</th>
              <th className="px-3 py-2 text-right font-medium">Search Quality</th>
            </tr>
          </thead>
          <tbody>
            {metrics.reviewerStats.map((r) => (
              <tr key={r.name} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.completed}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.avgCompletionDays.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    r.compSearchQualityScore >= 90 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800',
                  )}>
                    {r.compSearchQualityScore}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Approval Panel ---------- */

function ApprovalPanel({ report, onDone }: { report: ManagerReport; onDone: () => void }) {
  const approveReport = useAppStore((s) => s.approveReport);
  const sendBackReport = useAppStore((s) => s.sendBackReport);

  const [sendBackComment, setSendBackComment] = useState('');
  const [showSendBack, setShowSendBack] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasFlags = report.flags.length > 0;

  const handleApprove = () => {
    if (hasFlags) {
      setConfirmDialogOpen(true);
      return;
    }
    doApprove();
  };

  const doApprove = () => {
    setLoading(true);
    approveReport(report.customerId);
    setLoading(false);
    setConfirmDialogOpen(false);
    onDone();
  };

  const handleSendBack = () => {
    if (!sendBackComment.trim()) return;
    setLoading(true);
    sendBackReport(report.customerId, sendBackComment.trim());
    setLoading(false);
    onDone();
  };

  return (
    <div className="ml-6 mt-1 rounded-md border border-border bg-white p-3 shadow-sm">
      <div className="mb-2 text-xs font-medium text-muted-fg">Approval Actions</div>

      {!showSendBack ? (
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={handleApprove} disabled={loading}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600" onClick={() => setShowSendBack(true)} disabled={loading}>
            <CornerDownLeft className="mr-1 h-3.5 w-3.5" />
            Send Back
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-muted-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={3}
            placeholder="Comment explaining reason for sending back (required)"
            value={sendBackComment}
            onChange={(e) => setSendBackComment(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600" onClick={handleSendBack} disabled={loading || !sendBackComment.trim()}>
              <CornerDownLeft className="mr-1 h-3.5 w-3.5" />
              Confirm Send Back
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowSendBack(false); setSendBackComment(''); }} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogTitle>Confirm Approval</DialogTitle>
          <DialogDescription>
            This report has attention flags. Are you sure you want to approve it?
          </DialogDescription>
          <div className="mt-3 space-y-2">
            {report.flags.map((flag) => (
              <div key={flag} className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm">{FLAG_CONFIG[flag].label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={doApprove} disabled={loading}>
              Approve Anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Report Row ---------- */

function ReportRow({ report, selected, onSelect }: { report: ManagerReport; selected: boolean; onSelect: () => void }) {
  return (
    <div
      className={cn(
        'cursor-pointer rounded-md border px-3 py-2 transition-colors',
        selected ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-muted',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-fg">{report.customerName}</span>
            {report.flags.map((f) => <AttentionBadge key={f} flag={f} />)}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-fg">
            {report.jurisdiction} · FY{report.fiscalYear} · {report.assignedReviewer}
          </div>
        </div>
        <div className="shrink-0 text-[11px] text-muted-fg">{fmtTime(report.lastUpdated)}</div>
      </div>
    </div>
  );
}

/* ---------- Status Group ---------- */

function StatusGroup({ status, reports, defaultOpen, selectedReportId, onSelectReport }: {
  status: ManagerReportStatus;
  reports: ManagerReport[];
  defaultOpen?: boolean;
  selectedReportId: string | null;
  onSelectReport: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-fg" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-fg" />}
        <span className="text-sm font-semibold text-fg">{status}</span>
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-fg">{reports.length}</span>
        {reports.some((r) => r.flags.length > 0) && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
      </button>
      {open && (
        <div className="ml-2 mt-1 space-y-0.5">
          {reports.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-fg">No reports</div>
          ) : (
            reports.map((r) => (
              <div key={r.customerId}>
                <ReportRow
                  report={r}
                  selected={selectedReportId === r.customerId}
                  onSelect={() => onSelectReport(selectedReportId === r.customerId ? null : r.customerId)}
                />
                {selectedReportId === r.customerId && (status === 'In Review' || status === 'Draft') && (
                  <ApprovalPanel report={r} onDone={() => onSelectReport(null)} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Manager Dashboard ---------- */

export function ManagerDashboard() {
  const fetchManagerReports = useAppStore((s) => s.fetchManagerReports);
  const fetchManagerMetrics = useAppStore((s) => s.fetchManagerMetrics);
  const managerReports = useAppStore((s) => s.managerReports);
  const managerMetrics = useAppStore((s) => s.managerMetrics);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchManagerReports();
    fetchManagerMetrics();
  }, [fetchManagerReports, fetchManagerMetrics]);

  const grouped = useMemo(() => {
    const map: Record<ManagerReportStatus, ManagerReport[]> = { Draft: [], 'In Review': [], Approved: [], Filed: [] };
    for (const report of managerReports) {
      map[report.status]?.push(report);
    }
    for (const status of STATUS_ORDER) {
      map[status].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    }
    return map;
  }, [managerReports]);

  const flaggedCount = managerReports.filter((r) => r.flags.length > 0).length;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg">Manager Dashboard</h2>
            <p className="text-xs text-muted-fg">
              {managerReports.length} report{managerReports.length !== 1 ? 's' : ''} across all statuses
              {flaggedCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                  {flaggedCount} flagged
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {managerMetrics && <MetricsPanel metrics={managerMetrics} />}

      {/* Reviewer stats */}
      {managerMetrics && <ReviewerStatsTable metrics={managerMetrics} />}

      {/* Reports by status */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {STATUS_ORDER.map((status) => (
          <StatusGroup
            key={status}
            status={status}
            reports={grouped[status]}
            defaultOpen={status === 'Draft' || status === 'In Review'}
            selectedReportId={selectedReportId}
            onSelectReport={setSelectedReportId}
          />
        ))}
      </div>
    </div>
  );
}
