import * as RT from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export const Tabs = RT.Root;
export const TabsList = ({ children, className }: { children: ReactNode; className?: string }) => (
  <RT.List className={cn('flex flex-wrap gap-1 border-b border-border px-1', className)}>{children}</RT.List>
);
export const TabsTrigger = ({ value, children }: { value: string; children: ReactNode }) => (
  <RT.Trigger
    value={value}
    className="border-b-2 border-transparent px-3 py-2 text-xs font-medium text-muted-fg data-[state=active]:border-primary data-[state=active]:text-fg hover:text-fg"
  >
    {children}
  </RT.Trigger>
);
export const TabsContent = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => (
  <RT.Content value={value} className={cn('py-4', className)}>
    {children}
  </RT.Content>
);
