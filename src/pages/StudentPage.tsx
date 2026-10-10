import {
  GraduationCap, Mail, School, Telescope, Code, TrendingUp, BarChart3, GitCompareArrows, FlaskConical, Database,
} from 'lucide-react';
import { useColors } from '@/context/useColors';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export function StudentPage() {
  const colors = useColors();

  const exploredTopics = [
    { icon: Database, label: 'Data Organization', desc: 'Structuring raw data into typed columns and working copies' },
    { icon: TrendingUp, label: 'Statistical Analysis', desc: 'Mean, median, standard deviation, and percentile calculations' },
    { icon: BarChart3, label: 'Data Visualization', desc: 'Building interactive charts that answer analytical questions' },
    { icon: GitCompareArrows, label: 'Correlation', desc: 'Measuring linear relationships between numeric variables' },
    { icon: TrendingUp, label: 'Trend Analysis', desc: 'Detecting directional patterns and moving averages' },
    { icon: FlaskConical, label: 'Scenario Modeling', desc: 'What-if analysis using observed linear relationships' },
    { icon: Code, label: 'Interactive Software Design', desc: 'Building a responsive, browser-based analytics workspace' },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader title="About Aranya" subtitle="The person behind DataLens" icon={<GraduationCap size={20} />} />

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.primary }}>
              <Telescope size={36} color={colors.surface} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Aranya Vij</h2>
              <p className="text-sm mt-1" style={{ color: colors.textMuted }}>Computer Science Applicant</p>
              <div className="mt-3 flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2" style={{ color: colors.text }}>
                  <School size={15} style={{ color: colors.primary }} />
                  <span>Redmond High School</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: colors.text }}>
                  <Mail size={15} style={{ color: colors.primary }} />
                  <a href="mailto:aranyavij9@gmail.com" style={{ color: colors.primary }}>aranyavij9@gmail.com</a>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* About the project */}
        <Card title="About the Project">
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: colors.text }}>
            <p>
              I created DataLens to explore how raw information can be transformed into visual patterns, measurable insights,
              and better decisions. The project combines data analysis with interactive software design.
            </p>
            <p>
              DataLens was created to explore how raw datasets can be transformed into visual patterns, measurable
              relationships, and informed decisions. Rather than building another dashboard that just displays numbers,
              I wanted to create something that encourages exploration — where every chart, every calculation, and every
              interaction has a clear purpose.
            </p>
            <p style={{ color: colors.textMuted }}>
              The application runs entirely in the browser. No servers, no APIs, no accounts — just the data and the tools
              to understand it.
            </p>
          </div>
        </Card>

        {/* What I explored */}
        <Card title="What I Explored">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exploredTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <div key={topic.label} className="surface-2 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={18} style={{ color: colors.primary }} />
                    <h4 className="font-semibold text-sm" style={{ color: colors.text }}>{topic.label}</h4>
                  </div>
                  <p className="text-xs" style={{ color: colors.textMuted }}>{topic.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Motivation */}
        <Card title="Why I Built This">
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: colors.text }}>
            <p>
              I think data science is about more than making charts. It is about asking questions, examining evidence,
              identifying relationships, and making informed decisions. DataLens is my attempt to build a tool that
              reflects that process — from importing raw data to modeling scenarios and saving insights.
            </p>
            <p style={{ color: colors.textMuted }}>
              I wanted to understand what happens behind the scenes when a chart is generated, how correlation is
              calculated, and how a simple linear model can be used to explore "what if" questions. Building this
              project taught me that every visualization should answer a question, and every calculation should be
              traceable to the data it came from.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
