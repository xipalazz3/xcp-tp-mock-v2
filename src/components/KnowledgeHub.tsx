import { useState } from 'react';
import { BookOpen, Send, Loader2, FileText, Globe, Database, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { jitter } from '@/lib/utils';

const REPRESENTATIVE_QUESTIONS = [
  { category: 'OECD Regulations', icon: <Globe className="h-4 w-4 text-blue-600" />, questions: [
    'What are the 2022 OECD Guidelines Chapter VI requirements for DEMPE analysis?',
    'How does Chapter VII define low value-adding intra-group services?',
    'What is the arm\'s length principle under Article 9 of the OECD Model Convention?',
    'What comparability factors does Paragraph 3.82 prescribe for benchmarking?',
  ]},
  { category: 'Australian TP Rules', icon: <FileText className="h-4 w-4 text-green-600" />, questions: [
    'What are the penalties for TP adjustments without RAP under Subdivision 284-E?',
    'What does PCG 2019/1 prescribe for inbound distribution arrangements?',
    'How does s815-130 define exceptions to the basic rule?',
    'What are the documentation requirements for CBC reporting entities?',
  ]},
  { category: 'Internal Work & Templates', icon: <Database className="h-4 w-4 text-purple-600" />, questions: [
    'Show me existing TP reports for value-added distributors in Australia',
    'What comparable sets have been used for industrial manufacturing distributors?',
    'Retrieve the standard functional analysis template for service providers',
    'Find prior year comp searches for entities in the Pharmaceuticals sector',
  ]},
  { category: 'Analysis & Methods', icon: <Search className="h-4 w-4 text-amber-600" />, questions: [
    'When is TNMM preferred over CUP or RPM for distribution transactions?',
    'How should I adjust for working capital differences in the comp set?',
    'What is the ATO\'s position on cost-plus markup for management services?',
    'How do I establish a Reasonably Arguable Position under s284-255?',
  ]},
];

const MOCK_ANSWERS: Record<string, string> = {
  'What are the 2022 OECD Guidelines Chapter VI requirements for DEMPE analysis?':
    'Chapter VI (paragraphs 6.32–6.71) of the 2022 OECD Transfer Pricing Guidelines requires that the return attributable to intangible property be determined by reference to the functions performed, assets used, and risks assumed by each entity — specifically the Development, Enhancement, Maintenance, Protection, and Exploitation (DEMPE) functions. Legal ownership alone does not determine entitlement to intangible-related returns. The entity(ies) performing and controlling the DEMPE functions, bearing the associated risks, and funding the costs are entitled to the corresponding returns. Where multiple entities contribute, a proportionate allocation based on relative contributions is required.',
  'What are the penalties for TP adjustments without RAP under Subdivision 284-E?':
    'Under Subdivision 284-E of the TAA 1953, penalties for a TP adjustment depend on whether the taxpayer has established a Reasonably Arguable Position (RAP):\n\n• With RAP: 10% or 25% of the shortfall amount\n• Without RAP: 25% or 50% of the shortfall amount\n\nThe rate within each band depends on whether the sole purpose of the arrangement was to obtain a transfer pricing benefit. For CBC reporting entities, penalties are doubled for false/misleading statements, failure to lodge on time, and entering into tax avoidance schemes without RAP. Failure to lodge the local file attracts minimum penalties of AUD 111,000 and maximum penalties of AUD 555,000.',
  'Show me existing TP reports for value-added distributors in Australia':
    'Found 3 relevant reports in the knowledge base:\n\n1. FY2025 Alimak Group Australia Pty Ltd — Value-added distributor (Industrial Manufacturing, SIC 5084), 17 comps, IQR 4.22%–9.86%, OM tested at 8.42%\n\n2. FY2024 TechDist Australia Pty Ltd — IT equipment distributor (SIC 5045), 12 comps, IQR 3.8%–7.2%, OM tested at 5.1%\n\n3. FY2024 MedEquip Distribution — Medical device distributor (SIC 5047), 9 comps, IQR 5.5%–11.3%, OM tested at 7.8%\n\nAll three used TNMM with Operating Margin as PLI and searched for comparables in Australia.',
};

export function KnowledgeHub() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const handleQuery = async (q?: string) => {
    const text = q || query.trim();
    if (!text || loading) return;
    setLoading(true);
    setAnswer(null);
    setActiveQuestion(text);
    if (!q) setQuery('');
    await jitter(800, 1500);

    // Check for pre-built answers
    const prebuilt = MOCK_ANSWERS[text];
    if (prebuilt) {
      setAnswer(prebuilt);
    } else {
      setAnswer(
        `Based on the knowledge base search across OECD Guidelines, local regulations, and internal work product:\n\n` +
        `The query "${text}" relates to transfer pricing methodology and compliance. ` +
        `Under the arm's length principle (OECD Guidelines Article 9, Chapter I), related party transactions must be priced consistently with conditions that would prevail between independent enterprises in comparable circumstances. ` +
        `The five comparability factors (contractual terms, FAR analysis, property characteristics, economic circumstances, and business strategies) must be evaluated.\n\n` +
        `For jurisdiction-specific guidance, refer to the relevant PCGs and Taxation Rulings in the regulatory library.`
      );
    }
    setLoading(false);
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-white">
      {/* Header */}
      <div className="border-b border-border px-8 py-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary/70" />
          <div>
            <h2 className="text-xl font-semibold">Knowledge Hub</h2>
            <p className="text-sm text-muted-fg">
              Central location for OECD regulations by jurisdiction, internal reports, templates, analysis, and precedents.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuery(); }}
            placeholder="Search regulations, internal work, templates, or ask a question…"
            className="input flex-1"
            disabled={loading}
          />
          <Button onClick={() => handleQuery()} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Answer display */}
        {answer && (
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">
              Answer — {activeQuestion}
            </div>
            <div className="whitespace-pre-line text-sm leading-relaxed">{answer}</div>
          </div>
        )}

        {/* Representative questions showcase */}
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-fg">
          Explore the Knowledge Base
        </div>
        <div className="grid grid-cols-2 gap-4">
          {REPRESENTATIVE_QUESTIONS.map((cat) => (
            <div key={cat.category} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center gap-2">
                {cat.icon}
                <span className="text-sm font-semibold">{cat.category}</span>
              </div>
              <ul className="space-y-2">
                {cat.questions.map((q) => (
                  <li key={q}>
                    <button
                      onClick={() => handleQuery(q)}
                      className="w-full rounded-md px-2 py-1.5 text-left text-xs text-fg transition-colors hover:bg-muted"
                      disabled={loading}
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Data sources */}
        <div className="mt-6 rounded-md border border-border bg-muted/20 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Connected Data Sources</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['OECD TP Guidelines 2022', 'ITAA 1997 (Subdiv 815-B)', 'ATO Taxation Rulings', 'PCG 2017/1-4', 'PCG 2019/1', 'PCG 2024/1',
              'Internal TP Reports (47)', 'Comp Search History (128)', 'Report Templates (12)', 'Prior Benchmarks (83)'].map((src) => (
              <span key={src} className="rounded-full border border-border bg-white px-2.5 py-1 text-[10px] text-muted-fg">{src}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
