import { useState, useMemo, useEffect } from 'react';
import { FlaskConical, Lightbulb, AlertCircle, ArrowRight, Sliders } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/context/useColors';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Select, EmptyState, Badge, Input } from '@/components/ui';
import { BarChart } from '@/components/Charts';
import {
  getNumericValues, getNumericColumnNames, computeNumericStats, linearRegression, formatNumber, getPairedValues,
} from '@/lib/stats';

export function DecisionLabPage() {
  const { workingDataset, setScenario, scenario, addInsight } = useApp();
  const colors = useColors();
  const numericCols = workingDataset ? getNumericColumnNames(workingDataset.columns) : [];

  const [inputCol, setInputCol] = useState('');
  const [outputCol, setOutputCol] = useState('');
  const [fromVal, setFromVal] = useState(0);
  const [toVal, setToVal] = useState(0);
  const [saved, setSaved] = useState(false);

  // Auto-set defaults
  useEffect(() => {
    if (!workingDataset || numericCols.length < 2) return;
    if (!numericCols.includes(inputCol)) {
      setInputCol(numericCols[0]);
      const vals = getNumericValues(workingDataset.rows, numericCols[0]);
      const stats = computeNumericStats(vals);
      setFromVal(Math.round(stats.mean * 10) / 10);
      setToVal(Math.round(stats.mean * 10) / 10);
    }
    if (!numericCols.includes(outputCol)) setOutputCol(numericCols[1]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingDataset]);

  // Update fromVal when inputCol changes
  const updateInputCol = (col: string) => {
    setInputCol(col);
    if (workingDataset) {
      const vals = getNumericValues(workingDataset.rows, col);
      const stats = computeNumericStats(vals);
      setFromVal(Math.round(stats.mean * 10) / 10);
      setToVal(Math.round(stats.mean * 10) / 10);
    }
  };

  const scenarioResult = useMemo(() => {
    if (!workingDataset || !inputCol || !outputCol || inputCol === outputCol) return null;
    const { x, y } = getPairedValues(workingDataset.rows, inputCol, outputCol);
    if (x.length < 3) return null;

    const stats = computeNumericStats(y);
    const { slope, intercept } = linearRegression(x, y);

    // Current predicted value at fromVal
    const currentPredicted = slope * fromVal + intercept;
    const scenarioPredicted = slope * toVal + intercept;
    const difference = scenarioPredicted - currentPredicted;
    const pctChange = currentPredicted !== 0 ? (difference / Math.abs(currentPredicted)) * 100 : 0;

    // Actual average
    const actualAvg = stats.mean;

    return {
      slope, intercept,
      currentPredicted,
      scenarioPredicted,
      difference,
      pctChange,
      actualAvg,
      stats,
    };
  }, [workingDataset, inputCol, outputCol, fromVal, toVal]);

  const handleSaveScenario = () => {
    if (!scenarioResult || !inputCol || !outputCol) return;
    setScenario({
      id: `sc_${Date.now()}`,
      inputCol, outputCol, fromValue: fromVal, toValue: toVal,
      createdAt: Date.now(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveInsight = () => {
    if (!scenarioResult || !inputCol || !outputCol) return;
    addInsight(
      `Scenario: changing ${inputCol} from ${fromVal} to ${toVal} estimates ${scenarioResult.pctChange >= 0 ? '+' : ''}${scenarioResult.pctChange.toFixed(1)}% change in ${outputCol}.`,
      '', 'decision'
    );
  };

  if (!workingDataset) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <PageHeader title="Decision Lab" subtitle="What-if scenario modeling" icon={<FlaskConical size={20} />} />
        <EmptyState
          icon={<FlaskConical size={28} />}
          title="No dataset loaded"
          description="Load a dataset to create what-if scenarios and explore how variables affect outcomes."
          action={<Button variant="primary" onClick={() => window.location.hash = 'data'}>Go to Data</Button>}
        />
      </div>
    );
  }

  if (numericCols.length < 2) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <PageHeader title="Decision Lab" subtitle="What-if scenario modeling" icon={<FlaskConical size={20} />} />
        <EmptyState
          icon={<FlaskConical size={28} />}
          title="Not enough numeric columns"
          description="The Decision Lab needs at least two numeric columns to model relationships between variables."
        />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Decision Lab"
        subtitle="Explore what happens when you change a variable"
        icon={<FlaskConical size={20} />}
        action={
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveInsight}><Lightbulb size={15} /> Save Insight</Button>
            <Button size="sm" variant="primary" onClick={handleSaveScenario}>Save Scenario</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card title="Scenario Setup">
            <div className="space-y-4">
              <Select label="Input Variable" value={inputCol} onChange={(e) => updateInputCol(e.target.value)}>
                {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="Outcome Variable" value={outputCol} onChange={(e) => setOutputCol(e.target.value)}>
                {numericCols.filter(c => c !== inputCol).map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </Card>

          <Card title="What-If Controls">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">Current {inputCol}</label>
                  <span className="text-sm font-bold" style={{ color: colors.text }}>{fromVal}</span>
                </div>
                <input
                  type="range"
                  min={Math.min(...getNumericValues(workingDataset.rows, inputCol))}
                  max={Math.max(...getNumericValues(workingDataset.rows, inputCol))}
                  step="0.1"
                  value={fromVal}
                  onChange={(e) => setFromVal(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">Scenario {inputCol}</label>
                  <span className="text-sm font-bold" style={{ color: colors.primary }}>{toVal}</span>
                </div>
                <input
                  type="range"
                  min={Math.min(...getNumericValues(workingDataset.rows, inputCol))}
                  max={Math.max(...getNumericValues(workingDataset.rows, inputCol))}
                  step="0.1"
                  value={toVal}
                  onChange={(e) => setToVal(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="Current" type="number" step="0.1" value={fromVal} onChange={(e) => setFromVal(Number(e.target.value))} />
                <Input label="Scenario" type="number" step="0.1" value={toVal} onChange={(e) => setToVal(Number(e.target.value))} />
              </div>
            </div>
          </Card>

          {scenarioResult && (
            <Card title="Observed Relationship">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Slope</span>
                  <span style={{ color: colors.text }}>{formatNumber(scenarioResult.slope, 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Intercept</span>
                  <span style={{ color: colors.text }}>{formatNumber(scenarioResult.intercept, 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Avg {outputCol}</span>
                  <span style={{ color: colors.text }}>{formatNumber(scenarioResult.actualAvg)}</span>
                </div>
              </div>
            </Card>
          )}

          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-xl animate-fade-in" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <span className="text-sm">Scenario saved to workspace.</span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {scenarioResult ? (
            <>
              {/* Before/After comparison */}
              <Card title="Scenario Estimate">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-xl" style={{ backgroundColor: colors.surface2 }}>
                    <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Current</p>
                    <p className="text-3xl font-bold" style={{ color: colors.text }}>{formatNumber(scenarioResult.currentPredicted)}</p>
                    <p className="text-xs text-muted mt-1">{outputCol} at {inputCol} = {fromVal}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <ArrowRight size={28} className="mx-auto mb-1" style={{ color: colors.primary }} />
                      <p className="text-2xl font-bold" style={{ color: scenarioResult.pctChange >= 0 ? colors.primary : colors.accent }}>
                        {scenarioResult.pctChange >= 0 ? '+' : ''}{scenarioResult.pctChange.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted">{scenarioResult.difference >= 0 ? '+' : ''}{formatNumber(scenarioResult.difference)}</p>
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl" style={{ backgroundColor: colors.surface2, border: `2px solid ${colors.primary}` }}>
                    <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: colors.primary }}>Scenario</p>
                    <p className="text-3xl font-bold" style={{ color: colors.primary }}>{formatNumber(scenarioResult.scenarioPredicted)}</p>
                    <p className="text-xs text-muted mt-1">{outputCol} at {inputCol} = {toVal}</p>
                  </div>
                </div>

                {/* Bar comparison */}
                <BarChart
                  data={[
                    { label: 'Current', value: scenarioResult.currentPredicted },
                    { label: 'Scenario', value: scenarioResult.scenarioPredicted },
                  ]}
                  colors={colors}
                  yLabel={outputCol}
                />
              </Card>

              {/* Disclaimer */}
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-warn-bg)', color: 'var(--color-warn)' }}>
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Scenario Estimate</p>
                  <p className="text-sm mt-1">
                    This scenario is an analytical simulation based on relationships observed in the selected dataset.
                    It does not guarantee a real-world outcome. The estimate uses a simple linear model and assumes
                    the relationship between {inputCol} and {outputCol} holds across the specified range.
                  </p>
                </div>
              </div>

              {scenario && (
                <Card title="Saved Scenario">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="primary">Active</Badge>
                      <p className="text-sm mt-2" style={{ color: colors.text }}>
                        {scenario.inputCol}: {scenario.fromValue} → {scenario.toValue} → {scenario.outputCol}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => setScenario(null)}>Clear</Button>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="py-12 text-center">
                <Sliders size={32} className="mx-auto mb-3 text-muted" />
                <p className="text-muted text-sm">Create a what-if scenario to compare possible outcomes.</p>
                <p className="text-muted text-xs mt-1">Select an input and outcome variable, then adjust the sliders.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
