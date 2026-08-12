import { useEffect } from 'react';
import { LeftRail } from '@/components/LeftRail';
import { MainPanel } from '@/components/MainPanel';
import { RightRail } from '@/components/RightRail';
import { ManagerDashboard } from '@/components/ManagerDashboard';
import { KnowledgeHub } from '@/components/KnowledgeHub';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { ListChecks, BookOpen, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function App() {
  const hydrateSeeds = useAppStore((s) => s.hydrateSeeds);
  const seeded = useAppStore((s) => s.seeded);
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);

  useEffect(() => {
    hydrateSeeds();
  }, [hydrateSeeds]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-11 items-center justify-between border-b border-border bg-white px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-fg">
              TP
            </div>
            <div className="text-sm font-semibold">TP Reviewer</div>
          </div>
          <nav className="flex items-center gap-1">
            <TabButton active={activeView === 'queue'} onClick={() => setActiveView('queue')} icon={<ListChecks className="h-3.5 w-3.5" />}>
              Work Queue
            </TabButton>
            <TabButton active={activeView === 'hub'} onClick={() => setActiveView('hub')} icon={<BookOpen className="h-3.5 w-3.5" />}>
              Knowledge Hub
            </TabButton>
            <TabButton active={activeView === 'manager'} onClick={() => setActiveView('manager')} icon={<LayoutDashboard className="h-3.5 w-3.5" />}>
              Manager View
            </TabButton>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-fg">demo@exactera.com</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {activeView === 'queue' ? (
          <>
            <LeftRail />
            {seeded ? <MainPanel /> : <LoadingPanel />}
            <RightRail />
          </>
        ) : activeView === 'hub' ? (
          <KnowledgeHub />
        ) : (
          <ManagerDashboard />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-fg hover:bg-muted hover:text-fg',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function LoadingPanel() {
  return (
    <main className="flex flex-1 items-center justify-center text-sm text-muted-fg">
      Loading customer work queue…
    </main>
  );
}
