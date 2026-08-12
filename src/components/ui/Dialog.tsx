import * as RD from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RD.Root>
  );
}

export function DialogContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 z-40 bg-black/40" />
      <RD.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-white p-5 shadow-xl focus:outline-none',
          className,
        )}
      >
        {children}
        <RD.Close className="absolute right-3 top-3 rounded p-1 hover:bg-muted" aria-label="Close">
          <X className="h-4 w-4" />
        </RD.Close>
      </RD.Content>
    </RD.Portal>
  );
}

export const DialogTitle = ({ children }: { children: ReactNode }) => (
  <RD.Title className="text-base font-semibold text-fg">{children}</RD.Title>
);
export const DialogDescription = ({ children }: { children: ReactNode }) => (
  <RD.Description className="mt-1 text-sm text-muted-fg">{children}</RD.Description>
);
