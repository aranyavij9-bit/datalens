import { useMemo, useRef } from 'react';
import { FileText, Printer, Copy, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/context/useColors';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, EmptyState } from '@/components/ui';
import {
  computeNumericStats, getNumericValues, getNumericColumnNames,
  getCategoricalColumnNames, computeCategoricalStats,
  formatNumber, correlation, groupAndAggregate, trendDirection,
  detectOutliersIQR, getPairedValues,
} from '@/lib/stats';
import { useState } from 'react';

export function ReportsPage() {
  const { workingDataset, insights, scenario } = useApp();
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const reportData = useMemo(() => {
    if (!workingDataset) return null;
    const ds = workingDataset;
    const numericCols = getNumericColumnNames(ds.columns);
    const catCols = getCategoricalColumnNames(ds.columns);

    // Key stats for each numeric column
    const numericStats = numericCols.map(col => ({
      col,
      stats: computeNumericStats(getNumericValues(ds.rows, col)),
    }));

    // Top categorical distributions
    const catStats = catCols.slice(0, 3).map(col => ({
      col,
      stats: computeCategoricalStats(ds.rows.map(r => r[col])),
    }));

    // Correlations (top pairs)
    const correlations: { a: string; b: string; r: number }[] = [];
    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const { x, y } = getPairedValues(ds.rows, numericCols[i], numericCols[j]);
        correlations.push({ a: numericCols[i], b: numericCols[j], r: correlation(x, y) });
      }
    }
    correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

    // Outliers
    const outliers = numericCols.map(col => {
      const vals = getNumericValues(ds.rows, col);
      const res = detectOutliersIQR(vals);
      return { col, count: res.outliers.length };
    }).filter(o => o.count > 0);

    // Trends (first numeric col by first date/cat col)
    const dateCols = ds.columns.filter(c => c.type === 'date').map(c => c.name);
    const trendCol = dateCols[0] || catCols[0];
    let trend = null;
    if (trendCol && numericCols.length > 0) {
      const series = groupAndAggregate(ds.rows, trendCol, numericCols[0], 'avg');
      trend = { col: trendCol, metric: numericCols[0], ...trendDirection(series.map(s => s.value)) };
    }

    return { numericStats, catStats, correlations: correlations.slice(0, 5), outliers, trend };
  }, [workingDataset]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!reportRef.current) return;
    const text = reportRef.current.innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!workingDataset) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
        <PageHeader title="Reports" subtitle="Generate a structured data report" icon={<FileText size={20} />} />
        <EmptyState
          icon={<FileText size={28} />}
          title="No dataset loaded"
          description="Load a dataset to generate a report with statistics, trends, correlations, and insights."
          action={<Button variant="primary" onClick={() => window.location.hash = 'data'}>Go to Data</Button>}
        />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title="Report Builder"
        subtitle="Structured analysis report from your current dataset"
        icon={<FileText size={20} />}
        action={
          <div className="flex gap-2 no-print">
            <Button size="sm" onClick={handleCopy}>
              {copied ? <><CheckCircle2 size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
            </Button>
            <Button size="sm" variant="primary" onClick={handlePrint}><Printer size={15} /> Print</Button>
          </div>
        }
      />

      <div ref={reportRef} className="space-y-4">
        {/* Report header */}
        <Card>
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold" style={{ color: colors.text }}>DataLens Analysis Report</h2>
            <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
              {workingDataset.name} · {workingDataset.rows.length} rows · {workingDataset.columns.length} columns
            </p>
            <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
              Generated: {new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
            {workingDataset.isDemo && <p className="text-xs mt-1" style={{ color: colors.textMuted }}>(Demo Dataset)</p>}
          </div>
        </Card>

        {/* Dataset overview */}
        <Card title="1. Dataset Overview">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><span className="text-muted">Rows: </span><span style={{ color: colors.text }}>{workingDataset.rows.length.toLocaleString()}</span></div>
            <div><span className="text-muted">Columns: </span><span style={{ color: colors.text }}>{workingDataset.columns.length}</span></div>
            <div><span className="text-muted">Numeric: </span><span style={{ color: colors.text }}>{workingDataset.columns.filter(c => c.type === 'numeric').length}</span></div>
            <div><span className="text-muted">Categorical: </span><span style={{ color: colors.text }}>{workingDataset.columns.filter(c => c.type === 'categorical').length}</span></div>
            <div><span className="text-muted">Date: </span><span style={{ color: colors.text }}>{workingDataset.columns.filter(c => c.type === 'date').length}</span></div>
            <div><span className="text-muted">Missing: </span><span style={{ color: colors.text }}>{workingDataset.columns.reduce((a, c) => a + c.missing, 0)}</span></div>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Columns</p>
            <div className="flex flex-wrap gap-1.5">
              {workingDataset.columns.map(c => (
                <span key={c.name} className="text-xs px-2 py-1 rounded surface-2" style={{ color: colors.text }}>
                  {c.name} ({c.type})
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Key statistics */}
        {reportData && (
          <Card title="2. Key Statistics">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <th className="text-left py-2 text-xs font-semibold text-muted">Column</th>
                    <th className="text-right py-2 text-xs font-semibold text-muted">Mean</th>
                    <th className="text-right py-2 text-xs font-semibold text-muted">Median</th>
                    <th className="text-right py-2 text-xs font-semibold text-muted">Min</th>
                    <th className="text-right py-2 text-xs font-semibold text-muted">Max</th>
                    <th className="text-right py-2 text-xs font-semibold text-muted">Std Dev</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.numericStats.map(({ col, stats }) => (
                    <tr key={col} className="border-b" style={{ borderColor: colors.border }}>
                      <td className="py-2 font-medium" style={{ color: colors.text }}>{col}</td>
                      <td className="py-2 text-right" style={{ color: colors.text }}>{formatNumber(stats.mean)}</td>
                      <td className="py-2 text-right" style={{ color: colors.text }}>{formatNumber(stats.median)}</td>
                      <td className="py-2 text-right" style={{ color: colors.text }}>{formatNumber(stats.min)}</td>
                      <td className="py-2 text-right" style={{ color: colors.text }}>{formatNumber(stats.max)}</td>
                      <td className="py-2 text-right" style={{ color: colors.text }}>{formatNumber(stats.std)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Trends */}
        {reportData?.trend && (
          <Card title="3. Trend Analysis">
            <p className="text-sm" style={{ color: colors.text }}>
              <strong>{reportData.trend.metric}</strong> shows an <strong>{reportData.trend.direction}</strong> trend across {reportData.trend.col}
              ({reportData.trend.change >= 0 ? '+' : ''}{reportData.trend.change.toFixed(1)}% change).
            </p>
            <p className="text-sm text-muted mt-1">{reportData.trend.description}</p>
          </Card>
        )}

        {/* Correlations */}
        {reportData && reportData.correlations.length > 0 && (
          <Card title="4. Top Correlations">
            <div className="space-y-2">
              {reportData.correlations.map(({ a, b, r }, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: colors.text }}>{a} ↔ {b}</span>
                  <span className="font-bold" style={{ color: r > 0 ? colors.primary : colors.accent }}>
                    {r >= 0 ? '+' : ''}{r.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Outliers */}
        {reportData && reportData.outliers.length > 0 && (
          <Card title="5. Potential Outliers">
            <div className="space-y-2">
              {reportData.outliers.map((o, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: colors.text }}>{o.col}</span>
                  <span style={{ color: colors.accent }}>{o.count} potential outliers (IQR method)</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Scenario */}
        {scenario && (
          <Card title="6. Scenario Analysis">
            <p className="text-sm" style={{ color: colors.text }}>
              Input: {scenario.inputCol} changed from {scenario.fromValue} to {scenario.toValue}.
              Outcome variable: {scenario.outputCol}.
            </p>
            <p className="text-xs text-muted mt-1">Scenario Estimate — analytical simulation, not a real-world prediction.</p>
          </Card>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <Card title={`${scenario ? '7' : '6'}. Saved Insights`}>
            <div className="space-y-2">
              {insights.map((ins) => (
                <div key={ins.id} className="text-sm">
                  <span className="text-muted">• </span>
                  <span style={{ color: colors.text }}>{ins.text}</span>
                  {ins.note && <span className="text-muted"> — {ins.note}</span>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: colors.textMuted }}>
            Generated by DataLens — Interactive Data Analytics & Decision Lab
          </p>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            This report is based on simplified statistical methods and should not be treated as professional analysis.
          </p>
        </div>
      </div>
    </div>
  );
}
