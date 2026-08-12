import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { Sparkles, Play, Loader2 } from 'lucide-react';
import { STEP_LABEL, STEP_ORDER } from '@/lib/types';
import type { StepId } from '@/lib/types';
import { VoiceButton } from '@/components/VoiceButton';

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

      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">Skills</div>
        </div>
        <VoiceButton />
      </div>
      <div className="px-3 pt-1 text-[11px] text-muted-fg">
        Run any step independently for the selected customer.
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {STEP_ORDER.map((step) => {
            const s = selected?.steps[step];
            return (
              <SkillButton
                key={step}
                step={step}
                running={s?.status === 'running'}
                disabled={disabled}
              />
            );
          })}
        </div>

        <div className="my-4 border-t border-border" />

        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">
          On-Demand Tools
        </div>
        <div className="mb-3 text-[11px] text-muted-fg">
          Results appear in their own tabs and do not change the generated report.
        </div>

        <div className="space-y-2">
          <div className="rounded-md border border-border bg-primary/5 p-2.5">
            <div className="text-xs font-medium text-primary">Search Prior Comp List</div>
            <div className="mt-0.5 text-[10px] text-muted-fg">
              Retrieve and re-use comparables from a prior year or similar entity.
            </div>
          </div>
          <div className="rounded-md border border-border bg-primary/5 p-2.5">
            <div className="text-xs font-medium text-primary">New Comp Search</div>
            <div className="mt-0.5 text-[10px] text-muted-fg">
              Run a fresh comparables search with AI-recommended or custom criteria.
            </div>
          </div>
        </div>

        <div className="mt-3 text-[10px] text-muted-fg">
          Both tools surface results in the <span className="font-medium">Economics</span> tab where you can review and accept/reject each company.
        </div>
      </div>
    </aside>
  );
}

function SkillButton({ step, running, disabled }: { step: StepId; running: boolean; disabled: boolean }) {
  return (
    <button
      disabled={disabled || running}
      className="flex w-full items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{STEP_LABEL[step]}</span>
      {running ? <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" /> : <Play className="h-3.5 w-3.5 text-muted-fg" />}
    </button>
  );
}
