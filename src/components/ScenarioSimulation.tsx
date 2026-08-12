import { useState } from 'react';
import { AlertTriangle, TrendingDown, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Customer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  customer: Customer;
}

export function ScenarioSimulation({ customer }: Props) {
  const [showSimulation, setShowSimulation] = useState(false);
  const [simMargin, setSimMargin] = useState(3.5);

  // Mock IQR from the customer's economics output
  const iqr = { q1: 4.22, median: 5.57, q3: 9.86 };
  const isOutOfRange = simMargin < iqr.q1;
  const shortfall = isOutOfRange ? iqr.median - simMargin : 0;
  // Mock revenue for calculating adjustment
  const mockRevenue = 81482000; // AUD
  const adjustmentAmount = Math.round((shortfall / 100) * mockRevenue);

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-900">Scenario Simulation</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSimulation(!showSimulation)}
          className="text-[11px]"
        >
          {showSimulation ? 'Hide' : 'What if margin falls outside range?'}
        </Button>
      </div>
      <p className="mt-1 text-[11px] text-amber-800">
        Simulate scenarios where the tested party's financial ratios fall outside the arm's length range to understand potential tax implications.
      </p>

      {showSimulation && (
        <div className="mt-3 space-y-3">
          <div className="rounded-md border border-border bg-white p-3">
            <div className="flex items-center gap-4">
              <label className="block text-xs">
                <span className="text-muted-fg">Simulated Operating Margin (%)</span>
                <input
                  type="number"
                  step="0.1"
                  min={-5}
                  max={25}
                  value={simMargin}
                  onChange={(e) => setSimMargin(parseFloat(e.target.value) || 0)}
                  className="input mt-1 w-24 py-1 text-xs"
                />
              </label>
              <div className="text-xs">
                <div className="text-muted-fg">IQR Range:</div>
                <div className="font-medium">{iqr.q1}% – {iqr.q3}% (median {iqr.median}%)</div>
              </div>
              <div className={cn('rounded px-2 py-1 text-xs font-medium', isOutOfRange ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                {isOutOfRange ? 'OUTSIDE RANGE' : 'WITHIN RANGE'}
              </div>
            </div>
          </div>

          {isOutOfRange && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-semibold text-red-800">Tax Implications — Potential Transfer Pricing Adjustment</span>
              </div>

              <div className="space-y-2 text-red-900">
                <p>
                  <strong>Finding:</strong> The tested party's simulated operating margin of <strong>{simMargin}%</strong> falls
                  below the lower quartile ({iqr.q1}%) of the arm's length range. Under Subdivision 815-B of the ITAA 1997,
                  this constitutes a <strong>transfer pricing benefit</strong> as defined in s815-120.
                </p>

                <p>
                  <strong>Adjustment Basis:</strong> Consistent with OECD Guidelines paragraph 3.62, when the tested party's result
                  falls outside the interquartile range, the ATO would typically adjust to the <strong>median</strong> ({iqr.median}%).
                  This represents a margin shortfall of <strong>{shortfall.toFixed(2)}%</strong>.
                </p>

                <div className="rounded border border-red-300 bg-white p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-fg">Estimated Adjustment:</span>
                      <div className="font-bold text-red-800">AUD {adjustmentAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-fg">Additional Tax (30%):</span>
                      <div className="font-bold text-red-800">AUD {Math.round(adjustmentAmount * 0.3).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-fg">Penalty (without RAP, 25%):</span>
                      <div className="font-bold text-red-800">AUD {Math.round(adjustmentAmount * 0.3 * 0.25).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-fg">Penalty (with RAP, 10%):</span>
                      <div className="font-bold text-red-800">AUD {Math.round(adjustmentAmount * 0.3 * 0.1).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <p>
                  <strong>Recommended Actions for Analyst:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Discuss with the customer whether the margin depression is due to temporary factors (one-off costs, market downturn) that can be documented</li>
                  <li>Consider whether a working capital adjustment or other comparability adjustment narrows the gap</li>
                  <li>Evaluate whether the full range (minimum {(iqr.q1 - 2).toFixed(1)}%) rather than IQR is appropriate given the specific facts</li>
                  <li>Ensure contemporaneous documentation is prepared before tax return lodgement to establish a Reasonably Arguable Position (RAP) under s284-255</li>
                  <li>Assess risk under PCG 2019/1 (inbound distribution compliance approach) to determine the ATO risk zone</li>
                </ul>

                <p className="mt-2 text-[10px] italic text-red-700">
                  Note: A transfer pricing adjustment must be made within 7 years of the date of assessment (Subdivisions 815-B, C, and D).
                  Penalties without RAP: 25%–50%; with RAP: 10%–25% of the shortfall amount.
                </p>
              </div>
            </div>
          )}

          {!isOutOfRange && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="font-semibold">No Adjustment Required</span>
              </div>
              <p className="mt-1">
                At an operating margin of {simMargin}%, the tested party's result falls within the interquartile range ({iqr.q1}%–{iqr.q3}%).
                No transfer pricing benefit arises under s815-120 and no adjustment is warranted. The entity bears minimum transfer pricing risk.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
