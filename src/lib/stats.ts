import type {
  ColumnMeta,
  NumericStats,
  CategoricalStats,
  DateStats,
  ColumnType,
  Aggregation,
} from './types';

export function detectType(values: (string | number | null)[]): ColumnType {
  let numeric = 0;
  let date = 0;
  let bool = 0;
  let nonNull = 0;

  for (const v of values) {
    if (v === null || v === '' || v === undefined) continue;
    nonNull++;
    const s = String(v).trim();
    if (s === 'true' || s === 'false') {
      bool++;
      continue;
    }
    if (s !== '' && !isNaN(Number(s))) {
      numeric++;
      continue;
    }
    if (isValidDate(s)) {
      date++;
    }
  }

  if (nonNull === 0) return 'categorical';
  if (bool / nonNull > 0.8) return 'boolean';
  if (numeric / nonNull > 0.8) return 'numeric';
  if (date / nonNull > 0.7) return 'date';
  return 'categorical';
}

function isValidDate(s: string): boolean {
  if (!s) return false;
  // ISO date or common date formats
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) return !isNaN(Date.parse(s));
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s)) return !isNaN(Date.parse(s));
  return false;
}

export function parseNumeric(v: string | number | null): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return isNaN(n) ? null : n;
}

export function computeNumericStats(values: number[]): NumericStats {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, range: 0, std: 0, q1: 0, q3: 0, count: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const median = percentile(sorted, 50);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);

  return {
    mean,
    median,
    min,
    max,
    range: max - min,
    std,
    q1,
    q3,
    count: values.length,
  };
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function computeCategoricalStats(
  values: (string | number | null)[]
): CategoricalStats {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (v === null || v === '' || v === undefined) continue;
    const key = String(v);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const distribution = Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  return {
    unique: counts.size,
    top: distribution[0]?.value ?? '',
    topCount: distribution[0]?.count ?? 0,
    distribution,
  };
}

export function computeDateStats(values: (string | number | null)[]): DateStats {
  const dates: number[] = [];
  for (const v of values) {
    if (v === null || v === '' || v === undefined) continue;
    const d = Date.parse(String(v));
    if (!isNaN(d)) dates.push(d);
  }
  if (dates.length === 0) {
    return { earliest: '', latest: '', periods: 0 };
  }
  dates.sort((a, b) => a - b);
  return {
    earliest: new Date(dates[0]).toISOString().slice(0, 10),
    latest: new Date(dates[dates.length - 1]).toISOString().slice(0, 10),
    periods: dates.length,
  };
}

export function correlation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const dxi = x[i] - mx;
    const dyi = y[i] - my;
    num += dxi * dyi;
    dx += dxi * dxi;
    dy += dyi * dyi;
  }
  const denom = Math.sqrt(dx * dy);
  if (denom === 0) return 0;
  return num / denom;
}

export function correlationLabel(r: number): string {
  const abs = Math.abs(r);
  const dir = r > 0 ? 'positive' : 'negative';
  if (abs < 0.2) return 'Little to no linear relationship';
  if (abs < 0.4) return `Weak ${dir} relationship`;
  if (abs < 0.6) return `Moderate ${dir} relationship`;
  if (abs < 0.8) return `Strong ${dir} relationship`;
  return `Very strong ${dir} relationship`;
}

export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { slope: 0, intercept: 0 };
  const mx = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  return { slope, intercept };
}

export function detectOutliersIQR(values: number[]): { lower: number; upper: number; outliers: number[]; indices: number[] } {
  if (values.length < 4) return { lower: 0, upper: 0, outliers: [], indices: [] };
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const outliers: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] < lower || values[i] > upper) {
      outliers.push(values[i]);
      indices.push(i);
    }
  }
  return { lower, upper, outliers, indices };
}

export function detectOutliersZScore(values: number[], threshold = 2): { outliers: number[]; indices: number[] } {
  if (values.length < 2) return { outliers: [], indices: [] };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return { outliers: [], indices: [] };
  const outliers: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (Math.abs((values[i] - mean) / std) > threshold) {
      outliers.push(values[i]);
      indices.push(i);
    }
  }
  return { outliers, indices };
}

export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

export function percentChange(first: number, last: number): number {
  if (first === 0) return 0;
  return ((last - first) / Math.abs(first)) * 100;
}

export function trendDirection(values: number[]): {
  direction: 'upward' | 'downward' | 'stable';
  change: number;
  description: string;
} {
  if (values.length < 2) {
    return { direction: 'stable', change: 0, description: 'Not enough data points to determine a trend.' };
  }
  const first = values[0];
  const last = values[values.length - 1];
  const change = percentChange(first, last);
  const { slope } = linearRegression(
    values.map((_, i) => i),
    values
  );

  if (Math.abs(change) < 2 && Math.abs(slope) < 0.01) {
    return { direction: 'stable', change, description: 'The selected metric remains relatively stable across the observed period.' };
  }
  if (change > 0 || slope > 0) {
    return { direction: 'upward', change, description: 'The selected metric shows an overall upward movement across the observed period.' };
  }
  return { direction: 'downward', change, description: 'The selected metric shows an overall downward movement across the observed period.' };
}

export function formatNumber(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return '—';
  if (Number.isInteger(n) && Math.abs(n) < 10000) return n.toLocaleString();
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 10000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function getColumnValues(
  rows: Record<string, string | number | null>[],
  col: string
): (string | number | null)[] {
  return rows.map((r) => r[col] ?? null);
}

/**
 * Numeric values from two columns, keeping only rows where both are present
 * so each x stays paired with the y from the same row.
 */
export function getPairedValues(
  rows: Record<string, string | number | null>[],
  colX: string,
  colY: string
): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  for (const r of rows) {
    const a = parseNumeric(r[colX] ?? null);
    const b = parseNumeric(r[colY] ?? null);
    if (a !== null && b !== null) {
      x.push(a);
      y.push(b);
    }
  }
  return { x, y };
}

export function getNumericValues(
  rows: Record<string, string | number | null>[],
  col: string
): number[] {
  return rows
    .map((r) => parseNumeric(r[col] ?? null))
    .filter((v): v is number => v !== null);
}

export function getNumericColumnNames(columns: ColumnMeta[]): string[] {
  return columns.filter((c) => c.type === 'numeric').map((c) => c.name);
}

export function getCategoricalColumnNames(columns: ColumnMeta[]): string[] {
  return columns.filter((c) => c.type === 'categorical' || c.type === 'boolean').map((c) => c.name);
}

export function getDateColumnNames(columns: ColumnMeta[]): string[] {
  return columns.filter((c) => c.type === 'date').map((c) => c.name);
}

export function aggregate(
  rows: Record<string, string | number | null>[],
  yCol: string,
  agg: 'sum' | 'avg' | 'count' | 'min' | 'max'
): number {
  const nums = getNumericValues(rows, yCol);
  if (agg === 'count') return rows.length;
  if (nums.length === 0) return 0;
  switch (agg) {
    case 'sum': return nums.reduce((a, b) => a + b, 0);
    case 'avg': return nums.reduce((a, b) => a + b, 0) / nums.length;
    case 'min': return Math.min(...nums);
    case 'max': return Math.max(...nums);
  }
}

export function groupAndAggregate(
  rows: Record<string, string | number | null>[],
  groupCol: string,
  yCol: string,
  agg: 'sum' | 'avg' | 'count' | 'min' | 'max'
): { label: string; value: number }[] {
  const groups = new Map<string, Record<string, string | number | null>[]>();
  for (const row of rows) {
    const key = String(row[groupCol] ?? '—');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.entries())
    .map(([label, groupRows]) => ({ label, value: aggregate(groupRows, yCol, agg) }))
    .sort((a, b) => b.value - a.value);
}

/** Reader-friendly label for an aggregation, e.g. "Average". */
export function aggregationLabel(agg: Aggregation): string {
  return { sum: 'Total', avg: 'Average', count: 'Count of', min: 'Lowest', max: 'Highest' }[agg];
}
