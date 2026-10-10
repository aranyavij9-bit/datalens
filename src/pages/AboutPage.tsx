import {
  Info, Upload, Database, BarChart3, GitCompareArrows, FlaskConical, ShieldCheck, AlertCircle, Telescope, Workflow,
} from 'lucide-react';
import { useColors } from '@/context/useColors';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export function AboutPage() {
  const colors = useColors();

  const workflow = [
    { icon: Upload, label: 'Import', desc: 'Load a CSV or pick a demo dataset' },
    { icon: Database, label: 'Clean', desc: 'Fix types, handle missing values, remove duplicates' },
    { icon: Database, label: 'Explore', desc: 'Search, filter, sort, and profile the data' },
    { icon: BarChart3, label: 'Visualize', desc: 'Create interactive charts with live aggregation' },
    { icon: GitCompareArrows, label: 'Analyze', desc: 'Correlations, trends, comparisons, outliers' },
    { icon: FlaskConical, label: 'Decide', desc: 'Model what-if scenarios and save insights' },
  ];

  const concepts = [
    'Data structures — typed columns, working copies, and dataset metadata',
    'Statistical measures — mean, median, standard deviation, quartiles, IQR',
    'Filtering and aggregation — multi-column filters and group-by operations',
    'Data visualization — seven chart types with interactive tooltips and selection',
    'Correlation — Pearson correlation coefficient with linear regression',
    'Outlier detection — IQR method and Z-score threshold',
    'Trend analysis — directional detection with moving averages',
    'Scenario analysis — linear regression-based what-if modeling',
    'Client-side persistence — LocalStorage for datasets, insights, and workspace',
  ];

  const limitations = [
    'Statistical methods are simplified and educational, not professional-grade.',
    'Scenario modeling uses simple linear regression and does not account for confounding variables.',
    'Correlation does not imply causation — relationships in the data are statistical, not causal.',
    'Large datasets (over ~50,000 rows) may slow down browser-based processing.',
    'CSV parsing is basic and may not handle all edge cases (quoted fields with newlines, encoding issues).',
  ];

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader title="How It Works" subtitle="The ideas and math behind DataLens" icon={<Info size={20} />} />

      <div className="space-y-6">
        {/* Why */}
        <Card title="Why DataLens?">
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: colors.text }}>
            <p>
              Raw data is just numbers and text. On its own, it does not tell you much. DataLens exists to bridge the gap
              between a spreadsheet full of values and the questions you actually want to answer: What patterns exist?
              Which variables are related? What happens if something changes?
            </p>
            <p style={{ color: colors.textMuted }}>
              The goal is not to replace professional tools but to provide an accessible, transparent environment where
              the analytical process itself is visible — from data import to decision.
            </p>
          </div>
        </Card>

        {/* Workflow */}
        <Card title="Analytical Workflow">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {workflow.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-3 md:flex-1">
                  <div className="flex flex-col items-center text-center flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1.5" style={{ backgroundColor: colors.surface2, border: `1px solid ${colors.border}` }}>
                      <Icon size={20} style={{ color: colors.primary }} />
                    </div>
                    <p className="font-semibold text-xs" style={{ color: colors.text }}>{step.label}</p>
                    <p className="text-[10px]" style={{ color: colors.textMuted }}>{step.desc}</p>
                  </div>
                  {i < workflow.length - 1 && (
                    <div className="hidden md:block w-4 h-px" style={{ backgroundColor: colors.border }} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Technical concepts */}
        <Card title="Technical Concepts">
          <div className="space-y-2">
            {concepts.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Workflow size={14} className="flex-shrink-0 mt-0.5" style={{ color: colors.primary }} />
                <span style={{ color: colors.text }}>{c}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Privacy */}
        <Card title="Privacy">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="flex-shrink-0 mt-0.5" style={{ color: colors.primary }} />
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
              DataLens processes imported datasets within the browser and does not require users to upload their data
              to a server. All data, insights, and workspace settings are stored locally using LocalStorage.
              No accounts, no API keys, no cloud services.
            </p>
          </div>
        </Card>

        {/* Limitations */}
        <Card title="Limitations">
          <div className="space-y-2">
            {limitations.map((l, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-amber)' }} />
                <span style={{ color: colors.text }}>{l}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: colors.surface2 }}>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              DataLens is designed as an educational exploration platform. Its statistical analysis and scenario
              modeling methods are simplified and should not be treated as professional forecasting or scientific
              modeling.
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 py-4">
          <Telescope size={16} style={{ color: colors.primary }} />
          <span className="text-sm font-medium" style={{ color: colors.text }}>DataLens</span>
          <span className="text-sm" style={{ color: colors.textMuted }}>— Turn raw data into patterns, insights, and decisions.</span>
        </div>
      </div>
    </div>
  );
}
