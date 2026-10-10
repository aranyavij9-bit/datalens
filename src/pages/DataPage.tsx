import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Database, Upload, Search, ChevronLeft, ChevronRight, ArrowUpDown, Eye, EyeOff, Filter as FilterIcon, X, Trash2, Type, Hash, Calendar, CheckCircle2, AlertTriangle, Wand2, RefreshCw, Edit3,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/context/useColors';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Badge, EmptyState, StatCard, ProgressBar, Select } from '@/components/ui';
import { parseCSV, toCSV, toJSON, downloadFile } from '@/lib/csv';
import { createDemoDatasets, DEMO_DATASET_NAMES } from '@/lib/demoData';
import {
  computeNumericStats, computeCategoricalStats, computeDateStats, getNumericValues, formatNumber, parseNumeric,
} from '@/lib/stats';
import type { Dataset, ColumnType, ColumnMeta, Filter } from '@/lib/types';

type Tab = 'import' | 'explore' | 'profile' | 'cleaning';

export function DataPage() {
  const { workingDataset, importDataset, loadDemo, setWorkingDataset, commitWorking, resetWorking, updateColumnMeta } = useApp();
  const colors = useColors();
  const [tab, setTab] = useState<Tab>('import');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'import', label: 'Import' },
    { id: 'explore', label: 'Explore' },
    { id: 'profile', label: 'Profile' },
    { id: 'cleaning', label: 'Cleaning Lab' },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Data"
        subtitle="Import, explore, profile, and clean your dataset"
        icon={<Database size={20} />}
      />

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 surface rounded-full p-1 overflow-x-auto w-fit max-w-full">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              backgroundColor: tab === t.id ? colors.primary : 'transparent',
              color: tab === t.id ? '#ffffff' : colors.textMuted,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!workingDataset && tab !== 'import' ? (
        <EmptyState
          icon={<Database size={28} />}
          title="No dataset loaded"
          description="Choose a demo dataset or import a CSV to begin exploring."
          action={<Button variant="primary" onClick={() => setTab('import')}>Go to Import</Button>}
        />
      ) : (
        <>
          {tab === 'import' && <ImportTab colors={colors} onImport={importDataset} onLoadDemo={loadDemo} />}
          {tab === 'explore' && workingDataset && <ExploreTab dataset={workingDataset} colors={colors} />}
          {tab === 'profile' && workingDataset && <ProfileTab dataset={workingDataset} colors={colors} onUpdateType={updateColumnMeta} />}
          {tab === 'cleaning' && workingDataset && (
            <CleaningTab
              dataset={workingDataset}
              colors={colors}
              onApply={setWorkingDataset}
              onCommit={commitWorking}
              onReset={resetWorking}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Import Tab ────────────────────────────────────────────
function ImportTab({ colors, onImport, onLoadDemo }: {
  colors: ReturnType<typeof useColors>;
  onImport: (name: string, headers: string[], rows: Record<string, string>[]) => void;
  onLoadDemo: (name?: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [importedInfo, setImportedInfo] = useState<{ name: string; rows: number; cols: number } | null>(null);

  const handleFile = (file: File) => {
    setError('');
    setImportedInfo(null);
    // Allow choosing the same file again later
    if (fileRef.current) fileRef.current.value = '';
    if (file.size > 5 * 1024 * 1024) {
      setError('File is larger than 5MB. Please use a smaller file for browser-based processing.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const { headers, rows } = parseCSV(text);
        if (rows.length === 0) throw new Error('The CSV file contains headers but no data rows.');
        const name = file.name.replace(/\.csv$/i, '');
        onImport(name, headers, rows);
        setImportedInfo({ name, rows: rows.length, cols: headers.length });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse the CSV file.');
      }
    };
    reader.onerror = () => setError('Failed to read the file.');
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* CSV Upload */}
      <Card title="Import CSV" subtitle="Upload a structured CSV file with headers">
        <div
          className="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
          style={{ borderColor: colors.border }}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        >
          <Upload size={32} className="mx-auto mb-3" style={{ color: colors.textMuted }} />
          <p className="font-medium mb-1" style={{ color: colors.text }}>Drop a CSV file here or click to browse</p>
          <p className="text-sm" style={{ color: colors.textMuted }}>Max 5MB · Headers in first row</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {importedInfo && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">Imported "{importedInfo.name}" — {importedInfo.rows} rows, {importedInfo.cols} columns.</p>
          </div>
        )}
      </Card>

      {/* Demo datasets */}
      <Card title="Demo Datasets" subtitle="Explore DataLens immediately with built-in datasets">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEMO_DATASET_NAMES.map((name) => {
            const demos = createDemoDatasets();
            const ds = demos.find((d) => d.name === name);
            if (!ds) return null;
            return (
              <button
                key={name}
                onClick={() => onLoadDemo(name)}
                className="surface-2 rounded-xl p-4 text-left hover:opacity-90 transition-opacity"
                style={{ border: `1px solid ${colors.border}` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm" style={{ color: colors.text }}>{name}</h4>
                  <Badge variant="primary">Demo</Badge>
                </div>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  {ds.rows.length} rows · {ds.columns.length} columns · {ds.columns.filter(c => c.type === 'numeric').length} numeric
                </p>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── Explore Tab ───────────────────────────────────────────
function ExploreTab({ dataset, colors }: { dataset: Dataset; colors: ReturnType<typeof useColors> }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filterCol, setFilterCol] = useState('');
  const [filterText, setFilterText] = useState('');
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');

  const filteredRows = useMemo(() => {
    let result = dataset.rows;
    // Text search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((r) =>
        Object.values(r).some((v) => v !== null && String(v).toLowerCase().includes(s))
      );
    }
    // Filters
    for (const f of filters) {
      if (f.type === 'text') {
        result = result.filter((r) => f.values.includes(String(r[f.column] ?? '')));
      } else if (f.type === 'numeric') {
        result = result.filter((r) => {
          const v = parseNumeric(r[f.column] ?? null);
          if (v === null) return false;
          if (f.min !== undefined && v < f.min) return false;
          if (f.max !== undefined && v > f.max) return false;
          return true;
        });
      }
    }
    // Sort
    if (sortCol) {
      result = [...result].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        if (av === null) return 1;
        if (bv === null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return result;
  }, [dataset.rows, search, filters, sortCol, sortDir]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);
  const visibleCols = dataset.columns.filter((c) => !hiddenCols.has(c.name));

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const addTextFilter = () => {
    if (!filterCol) return;
    const col = dataset.columns.find((c) => c.name === filterCol);
    if (!col) return;
    const uniqueVals = Array.from(new Set(dataset.rows.map((r) => String(r[filterCol] ?? '')))).sort();
    setFilters([...filters, {
      id: `f_${Date.now()}`,
      column: filterCol,
      type: 'text',
      values: filterText ? uniqueVals.filter((v) => v.toLowerCase().includes(filterText.toLowerCase())) : uniqueVals.slice(0, 5),
    }]);
    setFilterCol('');
    setFilterText('');
  };

  const addNumericFilter = () => {
    if (!filterCol) return;
    setFilters([...filters, {
      id: `f_${Date.now()}`,
      column: filterCol,
      type: 'numeric',
      values: [],
      min: filterMin ? Number(filterMin) : undefined,
      max: filterMax ? Number(filterMax) : undefined,
    }]);
    setFilterCol('');
    setFilterMin('');
    setFilterMax('');
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
    setPage(0);
  };

  const selectedFilterCol = dataset.columns.find((c) => c.name === filterCol);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="primary">Filtered: {filteredRows.length} / {dataset.rows.length}</Badge>
        {filters.map((f) => (
          <div key={f.id} className="flex items-center gap-1 px-2 py-1 rounded-md surface-2 text-xs" style={{ color: colors.text }}>
            <FilterIcon size={12} />
            <span>{f.column}</span>
            {f.type === 'numeric' && (f.min !== undefined || f.max !== undefined) && (
              <span className="text-muted">{f.min ?? '−∞'} to {f.max ?? '∞'}</span>
            )}
            {f.type === 'text' && <span className="text-muted">{f.values.length} values</span>}
            <button onClick={() => removeFilter(f.id)}><X size={12} /></button>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search all columns..."
            className="input-base rounded-xl pl-9 pr-3 py-2 text-sm w-full"
          />
        </div>
        <Button size="sm" onClick={() => setShowFilters(!showFilters)}>
          <FilterIcon size={15} /> Filter
        </Button>
        <div className="relative">
          <details className="relative">
            <summary className="cursor-pointer list-none inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm surface" style={{ color: colors.text }}>
              <Eye size={15} /> Columns
            </summary>
            <div className="absolute right-0 top-full mt-1 surface rounded-xl p-2 z-10 min-w-[200px] max-h-64 overflow-y-auto shadow-lg">
              {dataset.columns.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    const next = new Set(hiddenCols);
                    if (next.has(c.name)) next.delete(c.name); else next.add(c.name);
                    setHiddenCols(next);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:opacity-80"
                  style={{ color: colors.text }}
                >
                  {hiddenCols.has(c.name) ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="animate-fade-in">
          <div className="flex flex-wrap items-end gap-3">
            <Select label="Column" value={filterCol} onChange={(e) => setFilterCol(e.target.value)}>
              <option value="">Select column...</option>
              {dataset.columns.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </Select>
            {selectedFilterCol?.type === 'numeric' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">Min</label>
                  <input type="number" value={filterMin} onChange={(e) => setFilterMin(e.target.value)} placeholder="Min" className="input-base rounded-xl px-3 py-2 text-sm w-24" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">Max</label>
                  <input type="number" value={filterMax} onChange={(e) => setFilterMax(e.target.value)} placeholder="Max" className="input-base rounded-xl px-3 py-2 text-sm w-24" />
                </div>
                <Button size="sm" variant="primary" onClick={addNumericFilter}>Add Filter</Button>
              </>
            )}
            {(selectedFilterCol?.type === 'categorical' || selectedFilterCol?.type === 'boolean') && (
              <>
                <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">Contains text</label>
                  <input value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter by text..." className="input-base rounded-xl px-3 py-2 text-sm" />
                </div>
                <Button size="sm" variant="primary" onClick={addTextFilter}>Add Filter</Button>
              </>
            )}
            {selectedFilterCol?.type === 'date' && (
              <p className="text-sm text-muted">Date filtering is available via the search box.</p>
            )}
          </div>
        </Card>
      )}

      {/* Table */}
      <div className="surface rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: colors.surface2, borderBottom: `1px solid ${colors.border}` }}>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted" style={{ width: 40 }}>#</th>
                {visibleCols.map((col) => (
                  <th key={col.name} className="px-3 py-2 text-left whitespace-nowrap">
                    <button onClick={() => toggleSort(col.name)} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                      <TypeIcon type={col.type} />
                      <span className="font-semibold" style={{ color: colors.text }}>{col.name}</span>
                      {sortCol === col.name && <ArrowUpDown size={12} style={{ color: colors.primary }} />}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr key={i} className="border-b transition-colors hover:opacity-60" style={{ borderColor: colors.border }}>
                  <td className="px-3 py-2 text-xs text-muted">{page * pageSize + i + 1}</td>
                  {visibleCols.map((col) => {
                    const v = row[col.name];
                    return (
                      <td key={col.name} className="px-3 py-2 whitespace-nowrap" style={{ color: v === null ? colors.textMuted : colors.text }}>
                        {v === null || v === '' ? <span className="italic opacity-50">—</span> : String(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: colors.border }}>
          <span className="text-xs" style={{ color: colors.textMuted }}>
            Page {page + 1} of {Math.max(1, totalPages)} · {filteredRows.length} rows
          </span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="p-1.5 rounded-xl surface disabled:opacity-30"><ChevronLeft size={16} /></button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="p-1.5 rounded-xl surface disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeIcon({ type }: { type: ColumnType }) {
  if (type === 'numeric') return <Hash size={12} className="text-muted" />;
  if (type === 'date') return <Calendar size={12} className="text-muted" />;
  return <Type size={12} className="text-muted" />;
}

// ── Profile Tab ───────────────────────────────────────────
function ProfileTab({ dataset, colors, onUpdateType }: {
  dataset: Dataset;
  colors: ReturnType<typeof useColors>;
  onUpdateType: (colName: string, meta: Partial<ColumnMeta>) => void;
}) {
  const [selectedCol, setSelectedCol] = useState<string>(dataset.columns[0]?.name ?? '');

  const col = dataset.columns.find((c) => c.name === selectedCol);
  const missingTotal = dataset.columns.reduce((a, c) => a + c.missing, 0);
  const maxMissing = Math.max(...dataset.columns.map((c) => c.missing), 1);

  const numericStats = col?.type === 'numeric' ? computeNumericStats(getNumericValues(dataset.rows, selectedCol)) : null;
  const catStats = col?.type === 'categorical' || col?.type === 'boolean' ? computeCategoricalStats(dataset.rows.map((r) => r[selectedCol])) : null;
  const dateStats = col?.type === 'date' ? computeDateStats(dataset.rows.map((r) => r[selectedCol])) : null;

  return (
    <div className="space-y-6">
      {/* Dataset summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Rows" value={dataset.rows.length.toLocaleString()} />
        <StatCard label="Columns" value={dataset.columns.length} />
        <StatCard label="Numeric" value={dataset.columns.filter(c => c.type === 'numeric').length} />
        <StatCard label="Categorical" value={dataset.columns.filter(c => c.type === 'categorical').length} />
        <StatCard label="Date" value={dataset.columns.filter(c => c.type === 'date').length} />
        <StatCard label="Missing" value={missingTotal} sub="total cells" />
      </div>

      {/* Missing data overview */}
      <Card title="Missing Data Overview" subtitle="Identify columns with incomplete values">
        <div className="space-y-2">
          {dataset.columns.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <span className="text-sm w-32 truncate" style={{ color: colors.text }}>{c.name}</span>
              <div className="flex-1"><ProgressBar value={c.missing} max={maxMissing} color={c.missing > 0 ? 'var(--color-amber)' : colors.primary} /></div>
              <span className="text-sm w-12 text-right" style={{ color: c.missing > 0 ? 'var(--color-amber)' : colors.textMuted }}>{c.missing}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Column detail */}
      <Card title="Column Profile" subtitle="Detailed statistics for a selected column">
        <div className="flex flex-wrap gap-2 mb-4">
          {dataset.columns.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCol(c.name)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: selectedCol === c.name ? colors.primary : colors.surface2,
                color: selectedCol === c.name ? '#ffffff' : colors.text,
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {col && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="primary">{col.type}</Badge>
              <Badge>{col.uniqueCount} unique</Badge>
              <Badge variant={col.missing > 0 ? 'warning' : 'default'}>{col.missing} missing</Badge>
              {/* Type correction */}
              <Select
                value={col.type}
                onChange={(e) => onUpdateType(col.name, { type: e.target.value as ColumnType })}
                className="ml-auto w-36"
              >
                <option value="numeric">numeric</option>
                <option value="categorical">categorical</option>
                <option value="date">date</option>
                <option value="boolean">boolean</option>
              </Select>
            </div>

            {numericStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Mean" value={formatNumber(numericStats.mean)} />
                <StatCard label="Median" value={formatNumber(numericStats.median)} />
                <StatCard label="Min" value={formatNumber(numericStats.min)} />
                <StatCard label="Max" value={formatNumber(numericStats.max)} />
                <StatCard label="Range" value={formatNumber(numericStats.range)} />
                <StatCard label="Std Dev" value={formatNumber(numericStats.std)} />
                <StatCard label="Q1" value={formatNumber(numericStats.q1)} />
                <StatCard label="Q3" value={formatNumber(numericStats.q3)} />
              </div>
            )}

            {catStats && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard label="Unique Values" value={catStats.unique} />
                  <StatCard label="Most Frequent" value={catStats.top} sub={`${catStats.topCount} occurrences`} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Frequency Distribution</p>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {catStats.distribution.slice(0, 15).map((d) => (
                      <div key={d.value} className="flex items-center gap-2">
                        <span className="text-sm w-32 truncate" style={{ color: colors.text }}>{d.value}</span>
                        <div className="flex-1"><ProgressBar value={d.count} max={catStats.distribution[0].count} /></div>
                        <span className="text-sm w-10 text-right text-muted">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {dateStats && (
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Earliest" value={dateStats.earliest} />
                <StatCard label="Latest" value={dateStats.latest} />
                <StatCard label="Observations" value={dateStats.periods} />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Cleaning Tab ──────────────────────────────────────────
function CleaningTab({ dataset, colors, onApply, onCommit, onReset }: {
  dataset: Dataset;
  colors: ReturnType<typeof useColors>;
  onApply: (ds: Dataset) => void;
  onCommit: () => void;
  onReset: () => void;
}) {
  const [preview, setPreview] = useState<{ action: string; before: number; after: number; applyFn: () => void } | null>(null);
  const [renaming, setRenaming] = useState<{ old: string; new: string } | null>(null);
  const [removingCol, setRemovingCol] = useState<string | null>(null);
  const [changingType, setChangingType] = useState<{ col: string; type: ColumnType } | null>(null);
  const [fillingMissing, setFillingMissing] = useState<{ col: string; value: string } | null>(null);
  const [status, setStatus] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorOpen = Boolean(renaming || removingCol || changingType || fillingMissing);

  // Editors and previews render away from the button that opened them; bring them into view
  useEffect(() => {
    if (editorOpen) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [editorOpen, renaming?.old, removingCol, changingType?.col, fillingMissing?.col]);
  useEffect(() => {
    if (preview) previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [preview]);

  const applyChange = (action: string, before: number, after: number, fn: () => void) => {
    setPreview({ action, before, after, applyFn: fn });
  };

  const confirmApply = () => {
    if (!preview) return;
    preview.applyFn();
    setPreview(null);
    setStatus(`${preview.action} applied. ${preview.before} → ${preview.after} rows.`);
    setTimeout(() => setStatus(''), 3000);
  };

  const actionRemoveDuplicates = () => {
    const seen = new Set<string>();
    const deduped = dataset.rows.filter((r) => {
      const key = JSON.stringify(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    applyChange('Remove duplicate rows', dataset.rows.length, deduped.length, () => onApply({ ...dataset, rows: deduped }));
  };

  const actionFillMissingNumeric = (col: string, value: string) => {
    // Keep the fill value numeric; formatted strings like "1,234.5" would become NaN
    const fillVal = value === 'mean'
      ? Math.round(computeNumericStats(getNumericValues(dataset.rows, col)).mean * 100) / 100
      : Number(value);
    const updated = dataset.rows.map((r) => {
      if (r[col] === null || r[col] === '' || r[col] === undefined) {
        return { ...r, [col]: fillVal };
      }
      return r;
    });
    applyChange(`Fill missing in "${col}"`, dataset.rows.length, dataset.rows.length, () => onApply({ ...dataset, rows: updated }));
    setFillingMissing(null);
  };

  const actionFillMissingCategorical = (col: string, value: string) => {
    const updated = dataset.rows.map((r) => {
      if (r[col] === null || r[col] === '' || r[col] === undefined) {
        return { ...r, [col]: value };
      }
      return r;
    });
    applyChange(`Fill missing in "${col}"`, dataset.rows.length, dataset.rows.length, () => onApply({ ...dataset, rows: updated }));
    setFillingMissing(null);
  };

  const actionTrimText = (col: string) => {
    const updated = dataset.rows.map((r) => {
      const v = r[col];
      if (typeof v === 'string') return { ...r, [col]: v.trim() };
      return r;
    });
    applyChange(`Trim whitespace in "${col}"`, dataset.rows.length, dataset.rows.length, () => onApply({ ...dataset, rows: updated }));
  };

  const actionRemoveCol = (col: string) => {
    const updated = dataset.rows.map((r) => {
      const rest = { ...r };
      delete rest[col];
      return rest;
    });
    applyChange(`Remove column "${col}"`, dataset.rows.length, dataset.rows.length, () => onApply({
      ...dataset,
      rows: updated,
      columns: dataset.columns.filter((c) => c.name !== col),
    }));
    setRemovingCol(null);
  };

  const actionRenameCol = (oldName: string, newName: string) => {
    if (!newName || newName === oldName) { setRenaming(null); return; }
    const updated = dataset.rows.map((r) => {
      const { [oldName]: val, ...rest } = r;
      return { ...rest, [newName]: val };
    });
    applyChange(`Rename "${oldName}" to "${newName}"`, dataset.rows.length, dataset.rows.length, () => onApply({
      ...dataset,
      rows: updated,
      columns: dataset.columns.map((c) => c.name === oldName ? { ...c, name: newName } : c),
    }));
    setRenaming(null);
  };

  const actionChangeType = (col: string, type: ColumnType) => {
    const updated = dataset.rows.map((r) => {
      const v = r[col];
      if (v === null || v === undefined || v === '') return r;
      if (type === 'numeric') {
        const n = Number(v);
        return { ...r, [col]: isNaN(n) ? v : n };
      }
      return { ...r, [col]: String(v) };
    });
    applyChange(`Convert "${col}" to ${type}`, dataset.rows.length, dataset.rows.length, () => onApply({
      ...dataset,
      rows: updated,
      columns: dataset.columns.map((c) => c.name === col ? { ...c, type } : c),
    }));
    setChangingType(null);
  };

  const actionExportCSV = () => {
    downloadFile(`${dataset.name}_cleaned.csv`, toCSV(dataset), 'text/csv');
  };

  const actionExportJSON = () => {
    downloadFile(`${dataset.name}_cleaned.json`, toJSON(dataset), 'application/json');
  };

  const cleaningActions = [
    { label: 'Remove duplicate rows', desc: 'Remove rows that are exact duplicates', icon: Trash2, onClick: actionRemoveDuplicates },
  ];

  return (
    <div className="space-y-4">
      {status && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
          <CheckCircle2 size={18} />
          <p className="text-sm">{status}</p>
        </div>
      )}

      {/* Preview dialog */}
      {preview && (
        <div ref={previewRef}>
        <Card className="animate-fade-in" title="Preview Change">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium" style={{ color: colors.text }}>{preview.action}</p>
              <p className="text-sm text-muted mt-1">
                Before: {preview.before} rows → After: {preview.after} rows
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={confirmApply}><CheckCircle2 size={16} /> Apply Change</Button>
            <Button onClick={() => setPreview(null)}>Cancel</Button>
          </div>
        </Card>
        </div>
      )}

      {/* Working copy note */}
      <div className="flex items-center justify-between p-3 rounded-xl surface-2">
        <div className="flex items-center gap-2">
          <Wand2 size={16} style={{ color: colors.primary }} />
          <p className="text-sm" style={{ color: colors.text }}>Working copy — changes are previewed before applying</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onReset}><RefreshCw size={14} /> Reset</Button>
          <Button size="sm" variant="primary" onClick={onCommit}>Save Changes</Button>
        </div>
      </div>

      {/* Dataset-level actions */}
      <Card title="Dataset Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cleaningActions.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={a.onClick} className="surface-2 rounded-xl p-3 text-left hover:opacity-90 transition-opacity">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} style={{ color: colors.primary }} />
                  <span className="font-medium text-sm" style={{ color: colors.text }}>{a.label}</span>
                </div>
                <p className="text-xs text-muted">{a.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Column-level actions */}
      <Card title="Column Actions" subtitle="Transform individual columns">
        <div className="space-y-2">
          {dataset.columns.map((col) => (
            <div key={col.name} className="flex items-center justify-between p-3 rounded-xl surface-2">
              <div className="flex items-center gap-2">
                <TypeIcon type={col.type} />
                <span className="font-medium text-sm" style={{ color: colors.text }}>{col.name}</span>
                <Badge>{col.type}</Badge>
                {col.missing > 0 && <Badge variant="warning">{col.missing} missing</Badge>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {col.type === 'categorical' && col.missing > 0 && (
                  <Button size="sm" onClick={() => setFillingMissing({ col: col.name, value: '' })}>Fill Missing</Button>
                )}
                {col.type === 'numeric' && col.missing > 0 && (
                  <Button size="sm" onClick={() => setFillingMissing({ col: col.name, value: 'mean' })}>Fill Missing</Button>
                )}
                {col.type === 'categorical' && (
                  <Button size="sm" onClick={() => actionTrimText(col.name)}>Trim Text</Button>
                )}
                <Button size="sm" onClick={() => setRenaming({ old: col.name, new: col.name })}><Edit3 size={13} /> Rename</Button>
                <Select
                  value={col.type}
                  onChange={(e) => setChangingType({ col: col.name, type: e.target.value as ColumnType })}
                  className="w-28"
                >
                  <option value="numeric">numeric</option>
                  <option value="categorical">categorical</option>
                  <option value="date">date</option>
                </Select>
                <Button size="sm" variant="danger" onClick={() => setRemovingCol(col.name)}><Trash2 size={13} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Inline editors */}
      <div ref={editorRef} className="space-y-4">
      {renaming && (
        <Card title={`Rename "${renaming.old}"`}>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wide">New name</label>
              <input value={renaming.new} onChange={(e) => setRenaming({ ...renaming, new: e.target.value })} className="input-base rounded-xl px-3 py-2 text-sm w-full mt-1" autoFocus />
            </div>
            <Button variant="primary" onClick={() => actionRenameCol(renaming.old, renaming.new)}>Rename</Button>
            <Button onClick={() => setRenaming(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      {removingCol && (
        <Card title={`Remove column "${removingCol}"?`}>
          <p className="text-sm text-muted mb-3">This will permanently remove the column from your working copy. You can still cancel before saving.</p>
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => actionRemoveCol(removingCol)}>Remove Column</Button>
            <Button onClick={() => setRemovingCol(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      {changingType && (
        <Card title={`Convert "${changingType.col}" to ${changingType.type}?`}>
          <p className="text-sm text-muted mb-3">Values will be converted to the new type. Non-convertible values will remain as-is.</p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => actionChangeType(changingType.col, changingType.type)}>Convert</Button>
            <Button onClick={() => setChangingType(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      {fillingMissing && (
        <Card title={`Fill missing values in "${fillingMissing.col}"`}>
          <div className="flex gap-2 items-end">
            {dataset.columns.find(c => c.name === fillingMissing.col)?.type === 'numeric' ? (
              <>
                <Select label="Fill with" value={fillingMissing.value} onChange={(e) => setFillingMissing({ ...fillingMissing, value: e.target.value })}>
                  <option value="mean">Mean value</option>
                  <option value="0">0</option>
                </Select>
                <Button variant="primary" onClick={() => actionFillMissingNumeric(fillingMissing.col, fillingMissing.value)}>Fill</Button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted uppercase tracking-wide">Fill with</label>
                  <input value={fillingMissing.value} onChange={(e) => setFillingMissing({ ...fillingMissing, value: e.target.value })} placeholder="e.g. Unknown" className="input-base rounded-xl px-3 py-2 text-sm w-full mt-1" autoFocus />
                </div>
                <Button variant="primary" onClick={() => actionFillMissingCategorical(fillingMissing.col, fillingMissing.value || 'Unknown')}>Fill</Button>
              </>
            )}
            <Button onClick={() => setFillingMissing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      </div>

      {/* Export */}
      <Card title="Export Data">
        <div className="flex gap-2">
          <Button variant="primary" onClick={actionExportCSV}>Export CSV</Button>
          <Button onClick={actionExportJSON}>Export JSON</Button>
        </div>
      </Card>
    </div>
  );
}
