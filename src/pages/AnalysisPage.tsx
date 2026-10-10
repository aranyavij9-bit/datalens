import { useState, useMemo, useEffect } from 'react';
import {
  GitCompareArrows, Lightbulb, AlertTriangle, TrendingUp, TrendingDown, Minus, Telescope,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/context/useColors';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Select, EmptyState, StatCard, Badge } from '@/components/ui';
import { BarChart, LineChart, Histogram, BoxPlot } from '@/components/Charts';
import {
  getNumericValues, getNumericColumnNames, getCategoricalColumnNames, getDateColumnNames, formatNumber, groupAndAggregate, trendDirection, detectOutliersIQR, detectOutliersZScore, computeNumericStats, aggregationLabel,
} from '@/lib/stats';
import type { Aggregation, Dataset } from '@/lib/types';

type Tab = 'trends' | 'comparison' | 'outliers';

export function AnalysisPage() {
  const { workingDataset } = useApp();
  const colors = useColors();
  const [tab, setTab] = useState<Tab>('trends');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'trends', label: 'Trends' },
    { id: 'comparison', label: 'Comparison' },
    { id: 'outliers', label: 'Outliers' },
  ];

  if (!workingDataset) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <PageHeader title="Analysis" subtitle="Trends, comparisons, and outlier detection" icon={<Telescope size={20} />} />
        <EmptyState
          icon={<Telescope size={28} />}
          title="No dataset loaded"
          description="Load a dataset to analyze trends, compare groups, and detect outliers."
          action={<Button variant="primary" onClick={() => window.location.hash = 'data'}>Go to Data</Button>}
        />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader title="Analysis" subtitle="Trends, comparisons, and outlier detection" icon={<Telescope size={20} />} />

      <div className="flex gap-1 mb-6 surface rounded-full p-1 overflow-x-auto w-fit max-w-full">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
            style={{ backgroundColor: tab === t.id ? colors.primary : 'transparent', color: tab === t.id ? '#ffffff' : colors.textMuted }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'trends' && <TrendsTab dataset={workingDataset} colors={colors} />}
      {tab === 'comparison' && <ComparisonTab dataset={workingDataset} colors={colors} />}
      {tab === 'outliers' && <OutliersTab dataset={workingDataset} colors={colors} />}
    </div>
  );
}

// ── Trends Tab ────────────────────────────────────────────
function TrendsTab({ dataset, colors }: { dataset: Dataset; colors: ReturnType<typeof useColors> }) {
  const { addInsight } = useApp();
  const numericCols = getNumericColumnNames(dataset.columns);
  const dateCols = getDateColumnNames(dataset.columns);
  const catCols = getCategoricalColumnNames(dataset.columns);

  const [metric, setMetric] = useState('');
  const [timeCol, setTimeCol] = useState('');

  // Reset selections that don't exist in the current dataset
  useEffect(() => {
    if (!numericCols.includes(metric)) setMetric(numericCols[0] ?? '');
    if (![...dateCols, ...catCols].includes(timeCol)) setTimeCol(dateCols[0] ?? catCols[0] ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);

  const seriesData = useMemo(() => {
    if (!metric || !timeCol) return [];
    const grouped = groupAndAggregate(dataset.rows, timeCol, metric, 'avg');
    // Sort if date
    const isDate = dataset.columns.find(c => c.name === timeCol)?.type === 'date';
    if (isDate) grouped.sort((a, b) => a.label.localeCompare(b.label));
    return grouped;
  }, [dataset, metric, timeCol]);

  const trend = useMemo(() => {
    if (seriesData.length < 2) return null;
    return trendDirection(seriesData.map(d => d.value));
  }, [seriesData]);


  const peak = useMemo(() => {
    if (seriesData.length === 0) return null;
    const max = seriesData.reduce((a, b) => (b.value > a.value ? b : a), seriesData[0]);
    return max;
  }, [seriesData]);

  if (numericCols.length === 0) {
    return <EmptyState icon={<TrendingUp size={28} />} title="No numeric columns" description="Trends analysis requires at least one numeric column." />;
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-4">
        <Card title="Configuration">
          <div className="space-y-3">
            <Select label="Metric" value={metric} onChange={(e) => setMetric(e.target.value)}>
              {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Time/Group Column" value={timeCol} onChange={(e) => setTimeCol(e.target.value)}>
              {dateCols.map(c => <option key={c} value={c}>{c} (date)</option>)}
              {catCols.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </Card>

        {trend && (
          <Card title="Trend Analysis">
            <div className="flex items-center gap-2 mb-3">
              {trend.direction === 'upward' && <TrendingUp size={20} style={{ color: colors.primary }} />}
              {trend.direction === 'downward' && <TrendingDown size={20} style={{ color: colors.accent }} />}
              {trend.direction === 'stable' && <Minus size={20} style={{ color: colors.textMuted }} />}
              <Badge variant="primary" >{trend.direction}</Badge>
            </div>
            <p className="text-sm" style={{ color: colors.text }}>{trend.description}</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Change</span>
                <span style={{ color: trend.change >= 0 ? colors.primary : colors.accent }}>
                  {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(1)}%
                </span>
              </div>
              {peak && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Peak</span>
                  <span style={{ color: colors.text }}>{formatNumber(peak.value)} at {peak.label}</span>
                </div>
              )}
            </div>
            <Button size="sm" className="mt-3 w-full" onClick={() => addInsight(`${metric} shows an ${trend.direction} trend (${trend.change >= 0 ? '+' : ''}${trend.change.toFixed(1)}%) across ${timeCol}.`, '', 'trends')}>
              <Lightbulb size={15} /> Save Insight
            </Button>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <div className="mb-3">
            <h3 className="font-semibold text-sm" style={{ color: colors.text }}>Average {metric} over {timeCol}</h3>
            <p className="text-xs text-muted">With 3-period moving average overlay</p>
          </div>
          {seriesData.length > 0 ? (
            <LineChart
              data={seriesData.map(d => ({ label: d.label, value: d.value }))}
              colors={colors}
              yLabel={metric}
              xLabel={timeCol}
              showMovingAvg
            />
          ) : (
            <p className="text-muted text-center py-8">Select a metric and time column</p>
          )}
        </Card>

        {peak && (
          <Card title="Period Statistics">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="First Value" value={formatNumber(seriesData[0]?.value)} />
              <StatCard label="Last Value" value={formatNumber(seriesData[seriesData.length - 1]?.value)} />
              <StatCard label="Peak Value" value={formatNumber(peak.value)} />
              <StatCard label="Peak At" value={peak.label} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Comparison Tab ────────────────────────────────────────
function ComparisonTab({ dataset, colors }: { dataset: Dataset; colors: ReturnType<typeof useColors> }) {
  const { addInsight } = useApp();
  const numericCols = getNumericColumnNames(dataset.columns);
  const catCols = getCategoricalColumnNames(dataset.columns);

  const [metric, setMetric] = useState('');
  const [groupCol, setGroupCol] = useState('');
  const [agg, setAgg] = useState<Aggregation>('avg');

  useEffect(() => {
    if (!numericCols.includes(metric)) setMetric(numericCols[0] ?? '');
    if (!catCols.includes(groupCol)) setGroupCol(catCols[0] ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);

  const comparisonData = useMemo(() => {
    if (!metric || !groupCol) return [];
    return groupAndAggregate(dataset.rows, groupCol, metric, agg);
  }, [dataset, metric, groupCol, agg]);

  const stats = useMemo(() => {
    if (comparisonData.length < 2) return null;
    const values = comparisonData.map(d => d.value);
    const max = comparisonData.reduce((a, b) => b.value > a.value ? b : a);
    const min = comparisonData.reduce((a, b) => b.value < a.value ? b : a);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const diff = max.value - min.value;
    const pctDiff = min.value !== 0 ? ((max.value - min.value) / Math.abs(min.value)) * 100 : 0;
    return { max, min, avg, diff, pctDiff };
  }, [comparisonData]);

  if (numericCols.length === 0 || catCols.length === 0) {
    return <EmptyState icon={<GitCompareArrows size={28} />} title="Need both types" description="Comparison requires at least one numeric and one categorical column." />;
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-4">
        <Card title="Compare">
          <div className="space-y-3">
            <Select label="Metric" value={metric} onChange={(e) => setMetric(e.target.value)}>
              {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Group By" value={groupCol} onChange={(e) => setGroupCol(e.target.value)}>
              {catCols.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Aggregation" value={agg} onChange={(e) => setAgg(e.target.value as Aggregation)}>
              <option value="avg">Average</option>
              <option value="sum">Sum</option>
              <option value="count">Count</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </Select>
          </div>
        </Card>

        {stats && (
          <Card title="Comparison Summary">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Highest</span>
                <span style={{ color: colors.text }}>{stats.max.label}: {formatNumber(stats.max.value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Lowest</span>
                <span style={{ color: colors.text }}>{stats.min.label}: {formatNumber(stats.min.value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Average</span>
                <span style={{ color: colors.text }}>{formatNumber(stats.avg)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Difference</span>
                <span style={{ color: colors.text }}>{formatNumber(stats.diff)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">% Difference</span>
                <span style={{ color: colors.primary }}>{stats.pctDiff >= 0 ? '+' : ''}{stats.pctDiff.toFixed(1)}%</span>
              </div>
            </div>
            <Button size="sm" className="mt-3 w-full" onClick={() => addInsight(`${stats.max.label} has ${stats.pctDiff >= 0 ? 'higher' : 'lower'} ${agg} ${metric} than ${stats.min.label} (${stats.pctDiff >= 0 ? '+' : ''}${stats.pctDiff.toFixed(1)}%).`, '', 'comparison')}>
              <Lightbulb size={15} /> Save Insight
            </Button>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <div className="mb-3">
            <h3 className="font-semibold text-sm" style={{ color: colors.text }}>{aggregationLabel(agg)} {metric} by {groupCol}</h3>
          </div>
          {comparisonData.length > 0 ? (
            <BarChart data={comparisonData.map(d => ({ label: d.label, value: d.value }))} colors={colors} yLabel={metric} xLabel={groupCol} />
          ) : (
            <p className="text-muted text-center py-8">Select a metric and group</p>
          )}
        </Card>

        {stats && (
          <Card title="Key Finding">
            <p className="text-sm" style={{ color: colors.text }}>
              <strong>{stats.max.label}</strong> generated <strong>{stats.pctDiff >= 0 ? '+' : ''}{stats.pctDiff.toFixed(1)}%</strong> more {metric} ({agg}) than <strong>{stats.min.label}</strong>.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Outliers Tab ──────────────────────────────────────────
function OutliersTab({ dataset, colors }: { dataset: Dataset; colors: ReturnType<typeof useColors> }) {
  const { addInsight } = useApp();
  const numericCols = getNumericColumnNames(dataset.columns);
  const [col, setCol] = useState('');
  const [method, setMethod] = useState<'iqr' | 'zscore'>('iqr');

  useEffect(() => {
    if (!numericCols.includes(col)) setCol(numericCols[0] ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);

  const result = useMemo(() => {
    if (!col) return null;
    const values = getNumericValues(dataset.rows, col);
    if (values.length === 0) return null;

    const stats = computeNumericStats(values);
    let outliers: { value: number; index: number }[] = [];
    let lower = 0, upper = 0;

    if (method === 'iqr') {
      const res = detectOutliersIQR(values);
      lower = res.lower;
      upper = res.upper;
      outliers = res.indices.map(i => ({ value: values[i], index: i }));
    } else {
      const res = detectOutliersZScore(values, 2);
      outliers = res.indices.map(i => ({ value: values[i], index: i }));
      lower = stats.mean - 2 * stats.std;
      upper = stats.mean + 2 * stats.std;
    }

    return { stats, outliers, lower, upper, total: values.length };
  }, [col, method, dataset]);

  if (numericCols.length === 0) {
    return <EmptyState icon={<AlertTriangle size={28} />} title="No numeric columns" description="Outlier detection requires at least one numeric column." />;
  }

  // Build box plot data
  const boxData = result ? [{ label: col, values: getNumericValues(dataset.rows, col) }] : [];

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-4">
        <Card title="Detection Settings">
          <div className="space-y-3">
            <Select label="Column" value={col} onChange={(e) => setCol(e.target.value)}>
              {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value as 'iqr' | 'zscore')}>
              <option value="iqr">IQR (Interquartile Range)</option>
              <option value="zscore">Z-Score (±2σ)</option>
            </Select>
          </div>
        </Card>

        {result && (
          <Card title="Results">
            <div className="space-y-3">
              <div className="text-center py-2">
                <p className="text-3xl font-bold" style={{ color: result.outliers.length > 0 ? colors.accent : colors.primary }}>
                  {result.outliers.length}
                </p>
                <p className="text-sm text-muted">potential outliers</p>
              </div>
              <Badge variant="primary">Method: {method === 'iqr' ? 'IQR (1.5×)' : 'Z-Score (2σ)'}</Badge>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Lower bound</span>
                  <span style={{ color: colors.text }}>{formatNumber(result.lower)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Upper bound</span>
                  <span style={{ color: colors.text }}>{formatNumber(result.upper)}</span>
                </div>
                {result.outliers.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted">Lowest outlier</span>
                      <span style={{ color: colors.accent }}>{formatNumber(Math.min(...result.outliers.map(o => o.value)))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Highest outlier</span>
                      <span style={{ color: colors.accent }}>{formatNumber(Math.max(...result.outliers.map(o => o.value)))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Affected rows</span>
                      <span style={{ color: colors.text }}>{result.outliers.length} / {result.total}</span>
                    </div>
                  </>
                )}
              </div>
              <Button size="sm" className="w-full" onClick={() => addInsight(`${col} has ${result.outliers.length} potential outliers detected using ${method === 'iqr' ? 'IQR method' : 'Z-score method'}.`, '', 'outliers')}>
                <Lightbulb size={15} /> Save Insight
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        {result && (
          <>
            <Card>
              <div className="mb-3">
                <h3 className="font-semibold text-sm" style={{ color: colors.text }}>Distribution of {col}</h3>
                <p className="text-xs text-muted">Box plot with outliers shown as individual points</p>
              </div>
              <BoxPlot data={boxData} colors={colors} yLabel={col} />
            </Card>

            <Card>
              <div className="mb-3">
                <h3 className="font-semibold text-sm" style={{ color: colors.text }}>Histogram of {col}</h3>
              </div>
              <Histogram values={getNumericValues(dataset.rows, col)} colors={colors} xLabel={col} />
            </Card>

            {result.outliers.length > 0 && (
              <Card title="Potential Outliers">
                <p className="text-sm text-muted mb-3">
                  These are observations that fall outside the expected range. An unusual observation may still be legitimate — it is not necessarily an error.
                </p>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-muted">Row</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-muted">{col}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.outliers.slice(0, 50).map((o, i) => (
                        <tr key={i} className="border-b" style={{ borderColor: colors.border }}>
                          <td className="py-1.5 px-2 text-muted">{o.index + 1}</td>
                          <td className="py-1.5 px-2" style={{ color: colors.accent }}>{formatNumber(o.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
