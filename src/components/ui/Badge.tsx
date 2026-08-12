import { cn } from '@/lib/utils';
import type { ReviewStatus } from '@/lib/types';

const styles: Record<ReviewStatus, string> = {
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  ready_for_review: 'bg-amber-100 text-amber-800 border-amber-200',
  in_review: 'bg-purple-100 text-purple-700 border-purple-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  sent_back: 'bg-orange-100 text-orange-700 border-orange-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
};

const labels: Record<ReviewStatus, string> = {
  processing: 'Processing',
  ready_for_review: 'Ready',
  in_review: 'In Review',
  approved: 'Approved',
  sent_back: 'Sent Back',
  failed: 'Failed',
};

export function StatusBadge({ status, className }: { status: ReviewStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
