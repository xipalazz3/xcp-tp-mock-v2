import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { JURISDICTIONS, INDUSTRIES } from '@/lib/mockData';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function NewCustomerDialog({ open, onOpenChange }: Props) {
  const addCustomer = useAppStore((s) => s.addCustomer);
  const [name, setName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('US');
  const [fiscalYear, setFiscalYear] = useState(2024);
  const [industry, setIndustry] = useState('Software');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCustomer({ name: name.trim(), jurisdiction, fiscalYear, industry });
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>New Customer</DialogTitle>
        <DialogDescription>Add a new entity to the review queue.</DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-fg">Company Name</span>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NewCorp Ltd" autoFocus />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-fg">Jurisdiction</span>
              <select className="input mt-1" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
                {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-fg">Fiscal Year</span>
              <input type="number" className="input mt-1" value={fiscalYear} onChange={(e) => setFiscalYear(+e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-muted-fg">Industry</span>
            <select className="input mt-1" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
