import { useState, useMemo, useEffect } from 'react';
import { GitCompareArrows, Lightbulb } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/context/useColors';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Select, EmptyState } from '@/components/ui';
import { ScatterChart } from '@/components/Charts';
import {
  correlation, correlationLabel, linearRegression, getNumericValues, getNumericColumnNames, formatNumber, getPairedValues,
} from '@/lib/stats';
import type { Dataset } from '@/lib/types';

export function RelationshipsPage() {
  const { workingDataset, addInsight } = useApp();
  const colors = useColors();
  const numericCols = workingDataset ? getNumericColumnNames(workingDataset.columns) : [];
  const [colA, setColA] = useState('');
  const [colB, setColB] = useState('');

  useEffect(() => {
    if (!workingDataset || numericCols.length < 2) return;
    if (numericCols.includes(colA) && numericCols.includes(colB)) return;
    // Open on the most strongly related pair so the first view is interesting
    let best = [numericCols[0], numericCols[1]];
    let bestR = -1;
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const { x, y } = getPairedValues(workingDataset.rows, numericCols[i], numericCols[j]);
        const r = Math.abs(correlation(x, y));
        if (x.length >= 3 && r > bestR) { bestR = r; best = [numericCols[i], numericCols[j]]; }
      }
    }
    setColA(best[0]);
    setColB(best[1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingDataset]);

  const result = useMemo(() => {
    if (!workingDataset || !colA || !colB || colA === colB) return null;
    const { x, y } = getPairedValues(workingDataset.rows, colA, colB);
    const n = Math.min(x.length, y.length);
    if (n < 2) return null;
    const r = correlation(x, y);
    const { slope, intercept } = linearRegression(x, y);
    return { r, label: correlationLabel(r), slope, intercept, n, x, y };
  }, [workingDataset, colA, colB]);

  if (!workingDataset) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <PageHeader title="Relationships" subtitle="Explore correlations between variables" icon={<GitCompareArrows size={20} />} />
        <EmptyState
          icon={<GitCompareArrows size={28} />}
          title="No dataset loaded"
          description="Load a dataset to explore relationships between numeric variables."
          action={<Button variant="primary" onClick={() => window.location.hash = 'data'}>Go to Data</Button>}
        />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Relationship Explorer"
        subtitle="Measure the linear relationship between two numeric variables"
        icon={<GitCompareArrows size={20} />}
        action={
          result && (
            <Button size="sm" onClick={() => addInsight(`${colA} and ${colB} show a ${result.label.toLowerCase()} (r = ${result.r.toFixed(2)}).`, '', 'relationships')}>
              <Lightbulb size={15} /> Save Insight
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-4">
          <Card title="Select Variables">
            <div className="space-y-3">
              <Select label="Variable A" value={colA} onChange={(e) => setColA(e.target.value)}>
                {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="Variable B" value={colB} onChange={(e) => setColB(e.target.value)}>
                {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </Card>

          {result && (
            <Card title="Correlation">
              <div className="text-center py-2">
                <p className="text-4xl font-bold" style={{ color: colors.primary }}>
                  {result.r >= 0 ? '+' : ''}{result.r.toFixed(3)}
                </p>
                <p className="text-sm mt-2" style={{ color: colors.text }}>{result.label}</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Observations</span>
                  <span style={{ color: colors.text }}>{result.n}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Slope</span>
                  <span style={{ color: colors.text }}>{formatNumber(result.slope, 4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Intercept</span>
                  <span style={{ color: colors.text }}>{formatNumber(result.intercept, 4)}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <Card>
                <div className="mb-3">
                  <h3 className="font-semibold text-sm" style={{ color: colors.text }}>{colB} vs {colA}</h3>
                  <p className="text-xs text-muted">Each point represents one observation. Dashed line shows the linear trend.</p>
                </div>
                <ScatterChart
                  data={result.x.slice(0, result.n).map((x, i) => ({ x, y: result.y[i] }))}
                  colors={colors}
                  xLabel={colA}
                  yLabel={colB}
                  trendLine={{ slope: result.slope, intercept: result.intercept }}
                />
              </Card>

              <Card title="Interpretation">
                <div className="space-y-3 text-sm" style={{ color: colors.text }}>
                  <p>The variables <strong>{colA}</strong> and <strong>{colB}</strong> show a {result.label.toLowerCase()} in this dataset (r = {result.r.toFixed(3)}).</p>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: colors.surface2 }}>
                    <p className="text-muted">
                      Correlation measures the strength and direction of a linear relationship.
                      A value of +1 means a perfect positive relationship, -1 a perfect negative relationship, and 0 no linear relationship.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-warn-bg)', color: 'var(--color-warn)' }}>
                    <p className="font-medium">Important: Correlation does not imply causation.</p>
                    <p className="text-sm mt-1">These variables show a statistical relationship in this dataset, but this does not mean one causes the other.</p>
                  </div>
                </div>
              </Card>

              <CorrelationMatrix dataset={workingDataset} colors={colors} />
            </>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <p className="text-muted text-sm">Select two different numeric variables to explore their relationship.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CorrelationMatrix({ dataset, colors }: { dataset: Dataset; colors: ReturnType<typeof useColors> }) {
  const numericCols = getNumericColumnNames(dataset.columns);
  const matrix = numericCols.map((a) =>
    numericCols.map((b) => {
      if (a === b) return 1;
      const x = getNumericValues(dataset.rows, a);
      const y = getNumericValues(dataset.rows, b);
      return correlation(x, y);
    })
  );

  if (numericCols.length < 2) return null;

  return (
    <Card title="Correlation Matrix" subtitle="All numeric variables compared pairwise">
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th></th>
              {numericCols.map(c => <th key={c} className="px-2 py-1 text-center font-medium" style={{ color: colors.text }}>{c.length > 8 ? c.slice(0, 8) + '…' : c}</th>)}
            </tr>
          </thead>
          <tbody>
            {numericCols.map((a, i) => (
              <tr key={a}>
                <td className="px-2 py-1 font-medium text-right" style={{ color: colors.text }}>{a.length > 10 ? a.slice(0, 10) + '…' : a}</td>
                {matrix[i].map((r, j) => {
                  const abs = Math.abs(r);
                  const bg = r > 0
                    ? `rgba(13, 124, 102, ${abs * 0.7})`
                    : `rgba(194, 65, 12, ${abs * 0.7})`;
                  return (
                    <td key={j} className="px-2 py-1 text-center" style={{ backgroundColor: bg, color: abs > 0.5 ? '#fff' : colors.text }}>
                      {r.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
