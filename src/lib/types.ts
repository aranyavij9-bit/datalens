export type ColumnType = 'numeric' | 'categorical' | 'date' | 'boolean';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  missing: number;
  uniqueCount: number;
}

export interface Dataset {
  id: string;
  name: string;
  isDemo: boolean;
  rows: Record<string, string | number | null>[];
  columns: ColumnMeta[];
  createdAt: number;
}

export interface NumericStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  std: number;
  q1: number;
  q3: number;
  count: number;
}

export interface CategoricalStats {
  unique: number;
  top: string;
  topCount: number;
  distribution: { value: string; count: number }[];
}

export interface DateStats {
  earliest: string;
  latest: string;
  periods: number;
}

export interface SavedInsight {
  id: string;
  text: string;
  note: string;
  page: string;
  createdAt: number;
}

export interface ChartConfig {
  id: string;
  chartType: ChartType;
  xCol: string;
  yCol: string;
  groupCol: string;
  aggregation: Aggregation;
  createdAt: number;
}

export type ChartType = 'bar' | 'line' | 'area' | 'scatter' | 'histogram' | 'pie' | 'box';
export type Aggregation = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface Scenario {
  id: string;
  inputCol: string;
  outputCol: string;
  fromValue: number;
  toValue: number;
  createdAt: number;
}

export interface Filter {
  id: string;
  column: string;
  type: 'text' | 'numeric' | 'date';
  values: string[];
  min?: number;
  max?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface WorkspaceState {
  datasetId: string | null;
  filters: Filter[];
  insights: SavedInsight[];
  charts: ChartConfig[];
  scenario: Scenario | null;
  savedAt: number;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  /** Secondary highlight, used for warnings and outliers */
  accent: string;
  chartColors: string[];
}
