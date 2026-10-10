import { useState, type ReactNode } from 'react';
import {
  Home, LayoutDashboard, Database, BarChart3, GitCompareArrows, FlaskConical, Lightbulb, FileText, GraduationCap, Info, Sun, Moon, Menu, Telescope as AnalysisIcon,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Page } from '@/context/router';
import { useColors } from '@/context/useColors';

const NAV_ITEMS: { page: Page; label: string; icon: typeof Home; group: string }[] = [
  { page: 'home', label: 'Home', icon: Home, group: 'Start' },
  { page: 'workspace', label: 'Workspace', icon: LayoutDashboard, group: 'Start' },
  { page: 'data', label: 'Data', icon: Database, group: 'Data' },
  { page: 'visual', label: 'Visual Lab', icon: BarChart3, group: 'Analysis' },
  { page: 'relationships', label: 'Relationships', icon: GitCompareArrows, group: 'Analysis' },
  { page: 'analysis', label: 'Trends & Compare', icon: AnalysisIcon, group: 'Analysis' },
  { page: 'decision', label: 'Decision Lab', icon: FlaskConical, group: 'Analysis' },
  { page: 'insights', label: 'Insights', icon: Lightbulb, group: 'Workspace' },
  { page: 'reports', label: 'Reports', icon: FileText, group: 'Workspace' },
  { page: 'about', label: 'How It Works', icon: Info, group: 'Project' },
  { page: 'student', label: 'About Aranya', icon: GraduationCap, group: 'Project' },
];

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className={`font-display font-semibold tracking-tight text-[var(--color-text)] ${small ? 'text-lg' : 'text-[22px]'}`}>
      Data<span className="italic text-primary">Lens</span>
      <span className="inline-block w-1.5 h-1.5 rounded-full ml-0.5" style={{ backgroundColor: 'var(--color-accent)' }} />
    </span>
  );
}

export function Layout({ page, navigate, children }: { page: Page; navigate: (p: Page) => void; children: ReactNode }) {
  const { theme, toggleTheme, dataset } = useApp();
  const colors = useColors();
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = Array.from(new Set(NAV_ITEMS.map((n) => n.group)));

  const sidebar = (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.bg }}>
      {/* Logo */}
      <div className="px-6 pt-7 pb-5">
        <Logo />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {groups.map((group) => (
          <div key={group} className="mb-4">
            <p className="px-3.5 mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>{group}</p>
            {NAV_ITEMS.filter((n) => n.group === group).map((item) => {
              const Icon = item.icon;
              const active = page === item.page;
              return (
                <button
                  key={item.page}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => { navigate(item.page); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors mb-0.5 ${active ? '' : 'hover:bg-[var(--color-surface)]'}`}
                  style={{
                    backgroundColor: active ? colors.surface : undefined,
                    color: active ? colors.primary : colors.textMuted,
                    boxShadow: active ? 'var(--shadow-soft)' : undefined,
                  }}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Theme toggle + dataset indicator */}
      <div className="px-4 py-4">
        {dataset && (
          <div className="px-3.5 py-2.5 mb-2 rounded-2xl text-xs" style={{ backgroundColor: colors.surface, color: colors.textMuted }}>
            <span className="font-medium" style={{ color: colors.text }}>{dataset.name}</span>
            <span className="ml-1">· {dataset.rows.length} rows</span>
            {dataset.isDemo && <span className="ml-1 opacity-60">(Demo)</span>}
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors hover:bg-[var(--color-surface)]"
          style={{ color: colors.textMuted }}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: colors.bg }}>
      {/* Desktop sidebar */}
      <aside className="w-60 flex-shrink-0 hidden lg:block no-print">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden no-print" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden no-print animate-slide-in">
            {sidebar}
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b no-print" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
          <button aria-label="Open menu" onClick={() => setMobileOpen(true)}>
            <Menu size={22} style={{ color: colors.text }} />
          </button>
          <Logo small />
          <button aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} style={{ color: colors.text }} /> : <Sun size={20} style={{ color: colors.text }} />}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
