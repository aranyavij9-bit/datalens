import { useState, useMemo } from 'react';
import { formatNumber, percentile } from '@/lib/stats';
import type { ThemeColors } from '@/lib/types';

interface ChartProps {
  colors: ThemeColors;
}

interface BarData {
  label: string;
  value: number;
}
interface BarChartProps extends ChartProps {
  data: BarData[];
  yLabel?: string;
  xLabel?: string;
  onSelect?: (label: string) => void;
}


/**
 * Round an axis out to tidy numbers (1, 2, 2.5, 5 × 10ⁿ). Returns the bounds and
 * the number of intervals, which lands between 4 and 6 depending on the data.
 */
function niceScale(lo: number, hi: number): { min: number; max: number; count: number } {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1, count: 5 };
  if (hi <= lo) hi = lo + 1;
  const raw = (hi - lo) / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 2.5, 5, 10, 20]) {
    const step = m * mag;
    if (step * 6 < hi - lo) continue;
    const min = Math.floor(lo / step) * step;
    const count = Math.max(1, Math.ceil((hi - min) / step - 1e-9));
    if (count <= 6) return { min, max: min + step * count, count };
  }
  return { min: lo, max: hi, count: 5 };
}

export function BarChart({ data, colors, yLabel, xLabel, onSelect }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const w = 800;
  const h = 400;
  const padding = { top: 20, right: 20, bottom: 60, left: 70 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const { min: minVal, max: maxVal, count: yTicks } = niceScale(Math.min(0, ...data.map((d) => d.value)), Math.max(...data.map((d) => d.value), 0.01));
  const range = maxVal - minVal || 1;
  const barW = data.length > 0 ? (chartW / data.length) * 0.7 : 0;
  const gap = data.length > 0 ? (chartW / data.length) * 0.3 : 0;

  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => minVal + (range * i) / yTicks);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img">
      {tickVals.map((tv, i) => {
        const y = padding.top + chartH - ((tv - minVal) / range) * chartH;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke={colors.border} strokeWidth="0.5" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={colors.textMuted}>
              {formatNumber(tv)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = padding.left + i * (barW + gap) + gap / 2;
        const barH = Math.abs((d.value - minVal) / range) * chartH;
        const y = d.value >= minVal ? padding.top + chartH - ((d.value - minVal) / range) * chartH : padding.top + chartH - ((0 - minVal) / range) * chartH;
        const isHovered = hovered === i;
        const isSelected = selected === i;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={isSelected ? colors.primary : colors.chartColors[i % colors.chartColors.length]}
              opacity={isHovered ? 0.85 : 1}
              rx="3"
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { setSelected(i); onSelect?.(d.label); }}
            />
            {isHovered && (
              <g>
                <rect x={x + barW / 2 - 60} y={y - 35} width="120" height="28" rx="4" fill={colors.text} opacity="0.9" />
                <text x={x + barW / 2} y={y - 21} textAnchor="middle" fontSize="11" fill={colors.surface} fontWeight="600">
                  {d.label.length > 12 ? d.label.slice(0, 12) + '…' : d.label}: {formatNumber(d.value)}
                </text>
              </g>
            )}
            {data.length <= 12 && (
              <text x={x + barW / 2} y={h - padding.bottom + 18} textAnchor="middle" fontSize="10" fill={colors.textMuted} transform={`rotate(${data.length > 6 ? -30 : 0}, ${x + barW / 2}, ${h - padding.bottom + 18})`}>
                {d.label.length > 15 ? d.label.slice(0, 15) + '…' : d.label}
              </text>
            )}
          </g>
        );
      })}
      <line x1={padding.left} y1={padding.top + chartH} x2={w - padding.right} y2={padding.top + chartH} stroke={colors.border} strokeWidth="1" />
      {yLabel && <text x={15} y={h / 2} textAnchor="middle" fontSize="12" fill={colors.textMuted} transform={`rotate(-90, 15, ${h / 2})`}>{yLabel}</text>}
      {xLabel && <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="12" fill={colors.textMuted}>{xLabel}</text>}
    </svg>
  );
}

interface LineData {
  label: string;
  value: number;
}
interface LineChartProps extends ChartProps {
  data: LineData[];
  yLabel?: string;
  xLabel?: string;
  showArea?: boolean;
  showMovingAvg?: boolean;
}

export function LineChart({ data, colors, yLabel, xLabel, showArea = false, showMovingAvg = false }: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const w = 800;
  const h = 400;
  const padding = { top: 20, right: 20, bottom: 60, left: 70 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const values = data.map((d) => d.value);
  const { min: minVal, max: maxVal, count: yTicks } = niceScale(Math.min(...values, 0), Math.max(...values, 0.01));
  const range = maxVal - minVal || 1;

  const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`
    : '';

  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => minVal + (range * i) / yTicks);

  // Moving average
  const maWindow = Math.max(3, Math.floor(data.length / 10));
  const maValues = useMemo(() => {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - maWindow + 1);
      const slice = values.slice(start, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    return result;
  }, [values, maWindow]);

  const maPoints = maValues.map((v, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartH - ((v - minVal) / range) * chartH,
  }));
  const maPath = maPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img">
      {tickVals.map((tv, i) => {
        const y = padding.top + chartH - ((tv - minVal) / range) * chartH;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke={colors.border} strokeWidth="0.5" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={colors.textMuted}>{formatNumber(tv)}</text>
          </g>
        );
      })}
      {showArea && <path d={areaPath} fill={colors.primary} opacity="0.12" />}
      <path d={linePath} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {showMovingAvg && <path d={maPath} fill="none" stroke={colors.chartColors[2]} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x} cy={p.y} r={hovered === i ? 5 : 3}
            fill={colors.primary}
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
          {hovered === i && (
            <g>
              <rect x={p.x - 65} y={p.y - 35} width="130" height="28" rx="4" fill={colors.text} opacity="0.9" />
              <text x={p.x} y={p.y - 21} textAnchor="middle" fontSize="11" fill={colors.surface} fontWeight="600">
                {p.label}: {formatNumber(p.value)}
              </text>
            </g>
          )}
          {data.length <= 20 && (
            <text x={p.x} y={h - padding.bottom + 18} textAnchor="middle" fontSize="10" fill={colors.textMuted} transform={`rotate(-30, ${p.x}, ${h - padding.bottom + 18})`}>
              {p.label.length > 12 ? p.label.slice(0, 12) + '…' : p.label}
            </text>
          )}
          {data.length > 20 && i % Math.ceil(data.length / 10) === 0 && (
            <text x={p.x} y={h - padding.bottom + 18} textAnchor="middle" fontSize="10" fill={colors.textMuted} transform={`rotate(-30, ${p.x}, ${h - padding.bottom + 18})`}>
              {p.label.length > 12 ? p.label.slice(0, 12) + '…' : p.label}
            </text>
          )}
        </g>
      ))}
      {yLabel && <text x={15} y={h / 2} textAnchor="middle" fontSize="12" fill={colors.textMuted} transform={`rotate(-90, 15, ${h / 2})`}>{yLabel}</text>}
      {xLabel && <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="12" fill={colors.textMuted}>{xLabel}</text>}
      {showMovingAvg && (
        <g>
          <line x1={w - 180} y1={padding.top + 10} x2={w - 160} y2={padding.top + 10} stroke={colors.chartColors[2]} strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={w - 155} y={padding.top + 14} fontSize="10" fill={colors.textMuted}>Moving Avg</text>
          <line x1={w - 80} y1={padding.top + 10} x2={w - 60} y2={padding.top + 10} stroke={colors.primary} strokeWidth="2.5" />
          <text x={w - 55} y={padding.top + 14} fontSize="10" fill={colors.textMuted}>Value</text>
        </g>
      )}
    </svg>
  );
}

interface ScatterData {
  x: number;
  y: number;
  label?: string;
}
interface ScatterChartProps extends ChartProps {
  data: ScatterData[];
  xLabel?: string;
  yLabel?: string;
  trendLine?: { slope: number; intercept: number };
}

export function ScatterChart({ data, colors, xLabel, yLabel, trendLine }: ScatterChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const w = 800;
  const h = 400;
  const padding = { top: 20, right: 20, bottom: 60, left: 70 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  // Fit the axes to the data rather than forcing zero, so the point cloud fills the chart
  const { min: minX, max: maxX, count: xTicks } = niceScale(Math.min(...xs), Math.max(...xs));
  const { min: minY, max: maxY, count: yTicks } = niceScale(Math.min(...ys), Math.max(...ys));
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const toX = (v: number) => padding.left + ((v - minX) / rangeX) * chartW;
  const toY = (v: number) => padding.top + chartH - ((v - minY) / rangeY) * chartH;

  const tickValsY = Array.from({ length: yTicks + 1 }, (_, i) => minY + (rangeY * i) / yTicks);
  const tickValsX = Array.from({ length: xTicks + 1 }, (_, i) => minX + (rangeX * i) / xTicks);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img">
      {tickValsY.map((tv, i) => {
        const y = toY(tv);
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke={colors.border} strokeWidth="0.5" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={colors.textMuted}>{formatNumber(tv)}</text>
          </g>
        );
      })}
      {tickValsX.map((tv, i) => {
        const x = toX(tv);
        return (
          <text key={i} x={x} y={h - padding.bottom + 18} textAnchor="middle" fontSize="10" fill={colors.textMuted}>{formatNumber(tv)}</text>
        );
      })}
      {trendLine && (
        <line
          x1={toX(minX)} y1={toY(trendLine.slope * minX + trendLine.intercept)}
          x2={toX(maxX)} y2={toY(trendLine.slope * maxX + trendLine.intercept)}
          stroke={colors.chartColors[1]} strokeWidth="2" strokeDasharray="5 3" opacity="0.7"
        />
      )}
      {data.map((d, i) => (
        <g key={i}>
          <circle
            cx={toX(d.x)} cy={toY(d.y)}
            r={hovered === i ? 6 : 4}
            fill={colors.primary}
            opacity={hovered === null || hovered === i ? 0.7 : 0.3}
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
          {hovered === i && (
            <g>
              <rect x={toX(d.x) - 50} y={toY(d.y) - 35} width="100" height="28" rx="4" fill={colors.text} opacity="0.9" />
              <text x={toX(d.x)} y={toY(d.y) - 21} textAnchor="middle" fontSize="11" fill={colors.surface} fontWeight="600">
                ({formatNumber(d.x)}, {formatNumber(d.y)})
              </text>
            </g>
          )}
        </g>
      ))}
      <line x1={padding.left} y1={padding.top + chartH} x2={w - padding.right} y2={padding.top + chartH} stroke={colors.border} strokeWidth="1" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartH} stroke={colors.border} strokeWidth="1" />
      {yLabel && <text x={15} y={h / 2} textAnchor="middle" fontSize="12" fill={colors.textMuted} transform={`rotate(-90, 15, ${h / 2})`}>{yLabel}</text>}
      {xLabel && <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="12" fill={colors.textMuted}>{xLabel}</text>}
    </svg>
  );
}

interface HistogramProps extends ChartProps {
  values: number[];
  bins?: number;
  xLabel?: string;
}

export function Histogram({ values, colors, bins = 15, xLabel }: HistogramProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (values.length === 0) return <p className="text-muted text-center py-8">No values to display</p>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binW = range / bins;
  const counts = Array(bins).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / binW);
    if (idx >= bins) idx = bins - 1;
    counts[idx]++;
  }
  // Counts are whole numbers, so keep the axis step at 1 or more
  const countStep = Math.max(1, Math.ceil(Math.max(...counts, 1) / 5));
  const countTicks = Math.ceil(Math.max(...counts, 1) / countStep);
  const maxCount = countStep * countTicks;

  const w = 800;
  const h = 400;
  const padding = { top: 20, right: 20, bottom: 60, left: 70 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const bw = chartW / bins;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img">
      {Array.from({ length: countTicks + 1 }, (_, i) => {
        const y = padding.top + chartH - (i / countTicks) * chartH;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke={colors.border} strokeWidth="0.5" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={colors.textMuted}>{countStep * i}</text>
          </g>
        );
      })}
      {counts.map((c, i) => {
        const bh = (c / maxCount) * chartH;
        const x = padding.left + i * bw;
        const y = padding.top + chartH - bh;
        return (
          <g key={i}>
            <rect
              x={x + 1} y={y} width={bw - 2} height={bh}
              fill={colors.primary}
              opacity={hovered === i ? 0.85 : 0.65}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              rx="2"
            />
            {hovered === i && (
              <g>
                <rect x={x + bw / 2 - 55} y={y - 30} width="110" height="24" rx="4" fill={colors.text} opacity="0.9" />
                <text x={x + bw / 2} y={y - 15} textAnchor="middle" fontSize="11" fill={colors.surface} fontWeight="600">
                  {formatNumber(min + i * binW)}–{formatNumber(min + (i + 1) * binW)}: {c}
                </text>
              </g>
            )}
          </g>
        );
      })}
      <line x1={padding.left} y1={padding.top + chartH} x2={w - padding.right} y2={padding.top + chartH} stroke={colors.border} strokeWidth="1" />
      <text x={padding.left} y={h - padding.bottom + 18} fontSize="10" fill={colors.textMuted}>{formatNumber(min)}</text>
      <text x={w - padding.right} y={h - padding.bottom + 18} textAnchor="end" fontSize="10" fill={colors.textMuted}>{formatNumber(max)}</text>
      {xLabel && <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="12" fill={colors.textMuted}>{xLabel}</text>}
    </svg>
  );
}

interface PieData {
  label: string;
  value: number;
}
interface PieChartProps extends ChartProps {
  data: PieData[];
  onSelect?: (label: string) => void;
}

export function PieChart({ data, colors, onSelect }: PieChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const w = 500;
  const h = 400;
  const cx = w / 2;
  const cy = h / 2;
  const r = 130;
  const innerR = 65;

  const visibleData = data.filter((_, i) => !hidden.has(i));
  const total = visibleData.reduce((a, d) => a + d.value, 0) || 1;
  let currentAngle = -Math.PI / 2;

  const segments = visibleData.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    return { ...d, start, end, pct: (d.value / total) * 100 };
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-sm h-auto" role="img">
        {segments.map((s, i) => {
          const originalIdx = data.findIndex((d) => d.label === s.label);
          const isHovered = hovered === originalIdx;
          const midAngle = (s.start + s.end) / 2;
          const offset = isHovered ? 6 : 0;
          const ox = Math.cos(midAngle) * offset;
          const oy = Math.sin(midAngle) * offset;

          const x1 = cx + ox + Math.cos(s.start) * r;
          const y1 = cy + oy + Math.sin(s.start) * r;
          const x2 = cx + ox + Math.cos(s.end) * r;
          const y2 = cy + oy + Math.sin(s.end) * r;
          const x1i = cx + ox + Math.cos(s.start) * innerR;
          const y1i = cy + oy + Math.sin(s.start) * innerR;
          const x2i = cx + ox + Math.cos(s.end) * innerR;
          const y2i = cy + oy + Math.sin(s.end) * innerR;
          const largeArc = s.end - s.start > Math.PI ? 1 : 0;

          const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1i} ${y1i} Z`;

          return (
            <g key={i}>
              <path
                d={path}
                fill={colors.chartColors[originalIdx % colors.chartColors.length]}
                opacity={isHovered ? 1 : 0.9}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHovered(originalIdx)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(s.label)}
              />
              {isHovered && (
                <text x={cx + Math.cos(midAngle) * (r + innerR) / 2} y={cy + Math.sin(midAngle) * (r + innerR) / 2} textAnchor="middle" fontSize="12" fill={colors.surface} fontWeight="700">
                  {s.pct.toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="13" fill={colors.textMuted}>Total</text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontSize="18" fill={colors.text} fontWeight="700">{formatNumber(total)}</text>
      </svg>
      <div className="flex flex-col gap-1.5 w-full max-w-xs">
        {data.map((d, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-3 py-1.5 rounded-xl cursor-pointer transition-all ${hovered === i ? 'surface-2' : ''} ${hidden.has(i) ? 'opacity-40' : ''}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              const next = new Set(hidden);
              if (next.has(i)) next.delete(i); else next.add(i);
              setHidden(next);
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.chartColors[i % colors.chartColors.length] }} />
              <span className="text-sm truncate">{d.label.length > 18 ? d.label.slice(0, 18) + '…' : d.label}</span>
            </div>
            <span className="text-sm font-medium">{((d.value / (data.reduce((a, x) => a + x.value, 0) || 1)) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BoxPlotProps extends ChartProps {
  data: { label: string; values: number[] }[];
  yLabel?: string;
  highlightIndices?: number[];
}

export function BoxPlot({ data, colors, yLabel }: BoxPlotProps) {
  const w = 800;
  const h = 400;
  const padding = { top: 20, right: 20, bottom: 60, left: 70 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const allVals = data.flatMap((d) => d.values);
  if (allVals.length === 0) return <p className="text-muted text-center py-8">No values to display</p>;
  const { min: minVal, max: maxVal, count: yTicks } = niceScale(Math.min(...allVals), Math.max(...allVals));
  const range = maxVal - minVal || 1;

  const toY = (v: number) => padding.top + chartH - ((v - minVal) / range) * chartH;
  const groupW = chartW / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img">
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = minVal + (range * i) / yTicks;
        const y = toY(v);
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={w - padding.right} y2={y} stroke={colors.border} strokeWidth="0.5" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={colors.textMuted}>{formatNumber(v)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        if (d.values.length === 0) return null;
        const sorted = [...d.values].sort((a, b) => a - b);
        const q1 = percentile(sorted, 25);
        const med = percentile(sorted, 50);
        const q3 = percentile(sorted, 75);
        const iqr = q3 - q1;
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;
        const whiskerLo = Math.max(sorted[0], lowerFence);
        const whiskerHi = Math.min(sorted[sorted.length - 1], upperFence);
        const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);

        const cx = padding.left + i * groupW + groupW / 2;
        const bw = groupW * 0.4;

        return (
          <g key={i}>
            {/* Whiskers */}
            <line x1={cx} y1={toY(whiskerLo)} x2={cx} y2={toY(q1)} stroke={colors.textMuted} strokeWidth="1" />
            <line x1={cx} y1={toY(q3)} x2={cx} y2={toY(whiskerHi)} stroke={colors.textMuted} strokeWidth="1" />
            <line x1={cx - bw / 3} y1={toY(whiskerLo)} x2={cx + bw / 3} y2={toY(whiskerLo)} stroke={colors.textMuted} strokeWidth="1.5" />
            <line x1={cx - bw / 3} y1={toY(whiskerHi)} x2={cx + bw / 3} y2={toY(whiskerHi)} stroke={colors.textMuted} strokeWidth="1.5" />
            {/* Box */}
            <rect x={cx - bw / 2} y={toY(q3)} width={bw} height={toY(q1) - toY(q3)} fill={colors.primary} opacity="0.2" stroke={colors.primary} strokeWidth="1.5" rx="3" />
            {/* Median line */}
            <line x1={cx - bw / 2} y1={toY(med)} x2={cx + bw / 2} y2={toY(med)} stroke={colors.primary} strokeWidth="2.5" />
            {/* Outliers */}
            {outliers.map((v, j) => (
              <circle key={j} cx={cx} cy={toY(v)} r="3" fill={colors.chartColors[1]} opacity="0.7" />
            ))}
            {/* Label */}
            <text x={cx} y={h - padding.bottom + 18} textAnchor="middle" fontSize="10" fill={colors.textMuted}>{d.label.length > 15 ? d.label.slice(0, 15) + '…' : d.label}</text>
          </g>
        );
      })}
      <line x1={padding.left} y1={padding.top + chartH} x2={w - padding.right} y2={padding.top + chartH} stroke={colors.border} strokeWidth="1" />
      {yLabel && <text x={15} y={h / 2} textAnchor="middle" fontSize="12" fill={colors.textMuted} transform={`rotate(-90, 15, ${h / 2})`}>{yLabel}</text>}
    </svg>
  );
}
