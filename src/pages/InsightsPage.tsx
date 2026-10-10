import { useState } from 'react';
import { Lightbulb, Plus, Trash2, Download, StickyNote } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/context/useColors';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, EmptyState, Badge } from '@/components/ui';
import { downloadFile } from '@/lib/csv';

export function InsightsPage() {
  const { insights, addInsight, removeInsight, updateInsightNote } = useApp();
  const colors = useColors();
  const [newInsight, setNewInsight] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!newInsight.trim()) return;
    addInsight(newInsight.trim(), '', 'insights');
    setNewInsight('');
    setAdding(false);
  };

  const handleExport = () => {
    const text = insights.map(i =>
      `[${new Date(i.createdAt).toLocaleDateString()}] ${i.text}${i.note ? `\n  Note: ${i.note}` : ''}`
    ).join('\n\n');
    downloadFile('datalens_insights.txt', text, 'text/plain');
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="Insight Board"
        subtitle="Save useful findings from your analysis"
        icon={<Lightbulb size={20} />}
        action={
          <div className="flex gap-2">
            {insights.length > 0 && <Button size="sm" onClick={handleExport}><Download size={15} /> Export</Button>}
            <Button size="sm" variant="primary" onClick={() => setAdding(!adding)}><Plus size={15} /> Add Insight</Button>
          </div>
        }
      />

      {adding && (
        <Card className="mb-4 animate-fade-in">
          <div className="space-y-3">
            <textarea
              value={newInsight}
              onChange={(e) => setNewInsight(e.target.value)}
              placeholder="Write your finding... e.g. 'Study hours and exam scores show a strong positive relationship.'"
              className="input-base rounded-xl px-3 py-2 text-sm w-full min-h-[80px] resize-y"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleAdd}>Save Insight</Button>
              <Button onClick={() => { setAdding(false); setNewInsight(''); }}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {insights.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={28} />}
          title="No insights yet"
          description="Save useful findings here as you explore the dataset. Insights from any analysis page can be saved here too."
          action={adding ? undefined : <Button variant="primary" onClick={() => setAdding(true)}>Add First Insight</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <div className="flex items-start justify-between mb-2">
                <Badge variant="primary">{insight.page}</Badge>
                <button onClick={() => removeInsight(insight.id)} className="text-muted hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-sm font-medium mb-2" style={{ color: colors.text }}>{insight.text}</p>
              <div className="flex items-center gap-2 mt-3">
                <StickyNote size={13} className="text-muted flex-shrink-0" />
                <input
                  value={insight.note}
                  onChange={(e) => updateInsightNote(insight.id, e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 text-xs input-base rounded px-2 py-1"
                  style={{ color: colors.text }}
                />
              </div>
              <p className="text-xs text-muted mt-2">{formatDate(insight.createdAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
