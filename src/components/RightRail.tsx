import { useAppStore } from '@/store/useAppStore';
import { Sparkles, Play, Loader2, Search, CalendarClock } from 'lucide-react';
import { STEP_LABEL, STEP_ORDER } from '@/lib/types';
import type { StepId } from '@/lib/types';

export function RightRail() {
  const selected = useAppStore((s) => s.customers.find((c) => c.id === s.selectedId));
  const disabled = !selected || selected.reviewStatus === 'processing';

  return (
    <aside className="flex h-full w-64 flex-col border-l border-border bg-white">
      <div className="border-b border-border p-3">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-fg">
          Model
        </label>
        <select
          disabled
          value="auto"
          className="w-full cursor-not-allowed rounded-md border border-border bg-muted px-2 py-1.5 text-sm text-muted-fg"
        >
          <option value="auto">auto (managed)</option>
        </select>
        <div className="mt-1 text-[10px] text-muted-fg">Managed by platform</div>
      </div>

      <div className="flex items-center gap-2 px-3 pt-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="text-sm font-semibold">Skills & Tools</div>
      </div>
      <div className="px-3 pt-1 text-[11px] text-muted-fg">
        Run pipeline steps or on-demand tools for the selected customer.
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-fg">Pipeline Steps</div>
        <div className="space-y-1">
          {STEP_ORDER.map((step) => {
            const s = selected?.steps[step];
            return (
              <SkillButton
                key={step}
                label={STEP_LABEL[step]}
                running={s?.status === 'running'}
                disabled={disabled}
                icon={<Play className="h-3.5 w-3.5 text-muted-fg" />}
              />
            );
          })}
        </div>

        <div className="my-3 border-t border-border" />

        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-fg">On-Demand Tools</div>
        <div className="space-y-1">
          <SkillButton
            label="Search Prior Comp List"
            running={false}
            disabled={disabled}
            icon={<CalendarClock className="h-3.5 w-3.5 text-primary" />}
            highlight
          />
          <SkillButton
            label="New Comp Search"
            running={false}
            disabled={disabled}
            icon={<Search className="h-3.5 w-3.5 text-primary" />}
            highlight
          />
          <SkillButton
            label="Prior-Year Comparison"
            running={false}
            disabled={disabled}
            icon={<CalendarClock className="h-3.5 w-3.5 text-primary" />}
            highlight
          />
          <SkillButton
            label="Scenario Simulation"
            running={false}
            disabled={disabled}
            icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
            highlight
          />
        </div>

        <div className="mt-3 text-[10px] text-muted-fg">
          Tool results surface in the <span className="font-medium">Economic Analysis</span> tab. Accept/reject comparables to update the IQR live.
        </div>
      </div>
    </aside>
  );
}

function SkillButton({ label, running, disabled, icon, highlight }: { label: string; running: boolean; disabled: boolean; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <button
      disabled={disabled || running}
      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'}`}
    >
      <span className={highlight ? 'font-medium text-primary' : ''}>{label}</span>
      {running ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" /> : icon}
    </button>
  );
}
