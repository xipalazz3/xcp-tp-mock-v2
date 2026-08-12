import { useState } from 'react';
import { BookOpen, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { jitter } from '@/lib/utils';

const MOCK_ANSWERS = [
  'Under OECD TP Guidelines (Chapter II), the arm\'s length principle requires that conditions in intercompany transactions be consistent with those between independent enterprises in comparable circumstances.',
  'The TNMM examines the net profit relative to an appropriate base (costs, sales, assets) that a taxpayer realizes from a controlled transaction. It uses a profit level indicator (PLI) to compare the tested party\'s results against those of comparable companies.',
  'A limited-risk distributor typically performs routine sales and marketing functions without bearing significant market risk or owning valuable intangibles. This functional profile makes it the tested party in most benchmarking studies.',
];

export function KnowledgeHub() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    await jitter(800, 1500);
    setAnswer(MOCK_ANSWERS[Math.floor(Math.random() * MOCK_ANSWERS.length)]);
    setLoading(false);
  };

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-start bg-white px-8 py-12">
      <BookOpen className="h-10 w-10 text-primary/60" />
      <h2 className="mt-4 text-xl font-semibold">Knowledge Hub</h2>
      <p className="mt-1 text-sm text-muted-fg">Ask questions about transfer pricing regulations, methods, and precedents.</p>

      <div className="mt-8 flex w-full max-w-2xl items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleQuery(); }}
          placeholder="e.g. What is the arm's length principle?"
          className="input flex-1"
          disabled={loading}
        />
        <Button onClick={handleQuery} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {answer && (
        <div className="mt-6 w-full max-w-2xl rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}
