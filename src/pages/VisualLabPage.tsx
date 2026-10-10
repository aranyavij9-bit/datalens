import { useState, useMemo, useEffect } from 'react';
import { BarChart3, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/context/useColors';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Select, EmptyState, Badge } from '@/components/ui';
import { BarChart, LineChart, ScatterChart, Histogram, PieChart, BoxPlot } from '@/components/Charts';
import {
  groupAndAggregate, getNumericValues, getNumericColumnNames, getCategoricalColumnNames, getDateColumnNames, parseNumeric, aggregationLabel,
} from '@/lib/stats';
import type { ChartType, Aggregation, ChartConfig } from '@/lib/types';

export function VisualLabPage() {
  const { workingDataset, addChart, charts, removeChart, addInsight } = useApp();
  const colors = useColors();

  const numericCols = workingDataset ? getNumericColumnNames(workingDataset.columns) : [];
  const catCols = workingDataset ? getCategoricalColumnNames(workingDataset.columns) : [];
  const dateCols = workingDataset ? getDateColumnNames(workingDataset.columns) : [];
  const allCols = workingDataset ? workingDataset.columns.map(c => c.name) : [];

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [groupCol, setGroupCol] = useState('');
  const [agg, setAgg] = useState<Aggregation>('sum');
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  // Auto-set defaults when dataset changes
  useEffect(() => {
    if (!workingDataset) return;
    if (!numericCols.includes(yCol)) setYCol(numericCols[0] ?? '');
    if (!allCols.includes(xCol)) setXCol(catCols[0] || dateCols[0] || allCols[0] || '');
    if (groupCol && !allCols.includes(groupCol)) setGroupCol('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingDataset]);

  const chartData = useMemo(() => {
    if (!workingDataset || !xCol) return [];
    const ds = workingDataset;

    if (chartType === 'scatter') {
      if (!xCol || !yCol) return [];
      return ds.rows
        .map(r => ({ x: parseNumeric(r[xCol]) ?? 0, y: parseNumeric(r[yCol]) ?? 0 }))
        .filter(d => d.x !== 0 || d.y !== 0);
    }

    if (chartType === 'histogram') {
      if (!yCol) return [];
      return getNumericValues(ds.rows, yCol);
    }

    if (chartType === 'box') {
      if (!yCol) return [];
      const groupBy = groupCol || xCol;
      if (!groupBy || groupBy === '_none') {
        return [{ label: yCol, values: getNumericValues(ds.rows, yCol) }];
      }
      const groups = new Map<string, number[]>();
      for (const r of ds.rows) {
        const key = String(r[groupBy] ?? '—');
        const v = parseNumeric(r[yCol]);
        if (v !== null) {
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(v);
        }
      }
      return Array.from(groups.entries()).map(([label, values]) => ({ label, values }));
    }

    // bar, line, area, pie
    if (!xCol || !yCol) return [];
    if (chartType === 'line' || chartType === 'area') {
      // For line/area, if x is a date column, sort by date
      const isDateX = ds.columns.find(c => c.name === xCol)?.type === 'date';
      const data = groupAndAggregate(ds.rows, xCol, yCol, agg);
      if (isDateX) {
        data.sort((a, b) => a.label.localeCompare(b.label));
      }
      return data.map(d => ({ label: d.label, value: d.value }));
    }
    return groupAndAggregate(ds.rows, xCol, yCol, agg).map(d => ({ label: d.label, value: d.value }));
  }, [workingDataset, chartType, xCol, yCol, groupCol, agg]);

  const handleSaveChart = () => {
    const chart: ChartConfig = {
      id: `chart_${Date.now()}`,
      chartType, xCol, yCol, groupCol, aggregation: agg,
      createdAt: Date.now(),
    };
    addChart(chart);
  };

  const handleSaveInsight = () => {
    const desc = `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart of ${yCol} by ${xCol}${groupCol ? ` grouped by ${groupCol}` : ''} (${agg})`;
    addInsight(desc, '', 'visual');
  };

  if (!workingDataset) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <PageHeader title="Visual Lab" subtitle="Create interactive charts from your dataset" icon={<BarChart3 size={20} />} />
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="No dataset loaded"
          description="Load a demo dataset or import a CSV to start creating visualizations."
          action={<Button variant="primary" onClick={() => window.location.hash = 'data'}>Go to Data</Button>}
        />
      </div>
    );
  }

  const chartTypes: { id: ChartType; label: string }[] = [
    { id: 'bar', label: 'Bar' },
    { id: 'line', label: 'Line' },
    { id: 'area', label: 'Area' },
    { id: 'scatter', label: 'Scatter' },
    { id: 'histogram', label: 'Histogram' },
    { id: 'pie', label: 'Pie/Donut' },
    { id: 'box', label: 'Box Plot' },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Visual Lab"
        subtitle="Create interactive, dynamically-updating charts"
        icon={<BarChart3 size={20} />}
        action={
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveInsight}><Lightbulb size={15} /> Save Insight</Button>
            <Button size="sm" variant="primary" onClick={handleSaveChart}><Plus size={15} /> Save Chart</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card title="Chart Type">
            <div className="grid grid-cols-3 gap-2">
              {chartTypes.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setChartType(ct.id)}
                  className="px-3 h-9 rounded-full text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: chartType === ct.id ? colors.primary : colors.surface2,
                    color: chartType === ct.id ? '#ffffff' : colors.text,
                  }}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Configuration">
            <div className="space-y-3">
              {chartType !== 'histogram' && (
                <Select label={chartType === 'scatter' ? 'X-Axis (numeric)' : 'X-Axis'} value={xCol} onChange={(e) => setXCol(e.target.value)}>
                  {chartType === 'scatter'
                    ? numericCols.map(c => <option key={c} value={c}>{c}</option>)
                    : allCols.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              )}
              <Select label="Y-Axis" value={yCol} onChange={(e) => setYCol(e.target.value)}>
                {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              {(chartType === 'bar' || chartType === 'pie' || chartType === 'box') && (
                <Select label="Group By" value={groupCol} onChange={(e) => setGroupCol(e.target.value)}>
                  <option value="">None</option>
                  {catCols.map(c => <option key={c} value={c}>{c}</option>)}
                  {dateCols.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              )}
              {chartType !== 'scatter' && chartType !== 'histogram' && chartType !== 'box' && (
                <Select label="Aggregation" value={agg} onChange={(e) => setAgg(e.target.value as Aggregation)}>
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </Select>
              )}
              {chartType === 'histogram' && (
                <Select label="Aggregation" value={agg} disabled>
                  <option>Frequency</option>
                </Select>
              )}
            </div>
          </Card>

          {/* Selected point detail */}
          {selectedPoint && (
            <Card title="Selected" className="animate-fade-in">
              <Badge variant="primary">{selectedPoint}</Badge>
              {workingDataset && (
                <p className="text-sm text-muted mt-2">
                  {workingDataset.rows.filter(r => String(r[xCol]) === selectedPoint).length} matching rows
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Chart area */}
        <div className="space-y-4">
          <Card>
            <div className="mb-4">
              <h3 className="font-semibold text-sm" style={{ color: colors.text }}>
                {chartType === 'histogram'
                  ? `Distribution of ${yCol}`
                  : chartType === 'scatter'
                  ? `${yCol} vs ${xCol}`
                  : `${aggregationLabel(agg)} ${yCol} by ${xCol}`}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {chartType === 'histogram'
                  ? `${chartData.length} values`
                  : `${(chartData as { label: string }[]).length} groups`}
              </p>
            </div>

            {chartData.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted text-sm">Select variables to create your first visualization.</p>
              </div>
            ) : (
              <div className="w-full">
                {chartType === 'bar' && <BarChart data={chartData as { label: string; value: number }[]} colors={colors} yLabel={yCol} xLabel={xCol} onSelect={setSelectedPoint} />}
                {chartType === 'line' && <LineChart data={chartData as { label: string; value: number }[]} colors={colors} yLabel={yCol} xLabel={xCol} showMovingAvg />}
                {chartType === 'area' && <LineChart data={chartData as { label: string; value: number }[]} colors={colors} yLabel={yCol} xLabel={xCol} showArea />}
                {chartType === 'scatter' && <ScatterChart data={chartData as { x: number; y: number }[]} colors={colors} xLabel={xCol} yLabel={yCol} />}
                {chartType === 'histogram' && <Histogram values={chartData as number[]} colors={colors} xLabel={yCol} />}
                {chartType === 'pie' && <PieChart data={chartData as { label: string; value: number }[]} colors={colors} onSelect={setSelectedPoint} />}
                {chartType === 'box' && <BoxPlot data={chartData as { label: string; values: number[] }[]} colors={colors} yLabel={yCol} />}
              </div>
            )}
          </Card>

          {/* Saved charts */}
          {charts.length > 0 && (
            <Card title="Saved Charts" subtitle={`${charts.length} saved`}>
              <div className="space-y-2">
                {charts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-xl surface-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={14} style={{ color: colors.primary }} />
                      <span className="text-sm" style={{ color: colors.text }}>
                        {c.chartType} · {c.yCol} by {c.xCol} ({c.aggregation})
                      </span>
                    </div>
                    <button onClick={() => removeChart(c.id)} className="text-muted hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
