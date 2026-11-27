import React, { useMemo, useRef, useState } from 'react';
import type { HourlyPoint, RegionOrNational } from '../types/psi';

interface TrendChart24hProps {
  hourly24h: HourlyPoint[];
  selectedRegion: RegionOrNational;
  onSelectRegion: (region: RegionOrNational) => void;
}

const SERIES_META: Array<{
  id: RegionOrNational;
  label: string;
  color: string;
  dashed?: boolean;
}> = [
  { id: 'national', label: 'National', color: '#0F172A', dashed: true },
  { id: 'west', label: 'West', color: '#D97706' },
  { id: 'north', label: 'North', color: '#0284C7' },
  { id: 'central', label: 'Central', color: '#059669' },
  { id: 'east', label: 'East', color: '#7C3AED' },
  { id: 'south', label: 'South', color: '#E11D48' },
];

export const TrendChart24h: React.FC<TrendChart24hProps> = ({
  hourly24h,
  selectedRegion,
  onSelectRegion,
}) => {
  const [metric, setMetric] = useState<'psi24h' | 'pm25_1h'>('psi24h');
  const [visibleSeries, setVisibleSeries] = useState<
    Record<RegionOrNational, boolean>
  >({
    national: true,
    west: true,
    north: true,
    central: true,
    east: true,
    south: true,
  });
  const [hoverIdx, setHoverIdx] = useState<number>(hourly24h.length - 1);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const activeIdx = Math.min(Math.max(0, hoverIdx), hourly24h.length - 1);

  const toggleSeries = (id: RegionOrNational) => {
    setVisibleSeries((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const anyVisible = Object.values(next).some(Boolean);
      return anyVisible ? next : prev;
    });
  };

  const chartBounds = useMemo(() => {
    let maxVal = metric === 'psi24h' ? 110 : 65;
    hourly24h.forEach((pt) => {
      SERIES_META.forEach((s) => {
        if (visibleSeries[s.id]) {
          const val = pt.regions[s.id][metric];
          if (val > maxVal) maxVal = val;
        }
      });
    });
    const yMax = Math.ceil((maxVal * 1.15) / 25) * 25;
    return { yMin: 0, yMax };
  }, [hourly24h, metric, visibleSeries]);

  const width = 920;
  const height = 270;
  const padLeft = 46;
  const padRight = 22;
  const padTop = 18;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(1, hourly24h.length - 1)) * plotW;

  const getY = (val: number) => {
    const ratio = (val - chartBounds.yMin) / (chartBounds.yMax - chartBounds.yMin);
    return padTop + plotH - ratio * plotH;
  };

  const thresholds =
    metric === 'psi24h'
      ? [
          { value: 50, label: '50 Good', color: '#059669' },
          { value: 100, label: '100 Moderate', color: '#0284C7' },
          { value: 200, label: '200 Unhealthy', color: '#D97706' },
          { value: 300, label: '300 Very Unhealthy', color: '#DC2626' },
        ]
      : [
          { value: 55, label: '55 Normal', color: '#059669' },
          { value: 150, label: '150 Elevated', color: '#D97706' },
          { value: 250, label: '250 High', color: '#DC2626' },
        ];

  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || !hourly24h.length) return;
    const rect = svg.getBoundingClientRect();
    const xSvg = ((e.clientX - rect.left) / rect.width) * width;
    const norm = Math.min(1, Math.max(0, (xSvg - padLeft) / plotW));
    const idx = Math.round(norm * (hourly24h.length - 1));
    setHoverIdx(idx);
  };

  const activePoint = hourly24h[activeIdx];

  return (
    <section
      id="trends"
      aria-label="24-Hour Atmospheric Trend"
      className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#101624]"
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            24-Hour Regional Trajectory
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Move across the chart to inspect hourly readings across all five NEA sectors
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Segmented Switch */}
          <div
            role="group"
            aria-label="Trend metric"
            className="flex items-center rounded-md bg-slate-100 p-0.5 dark:bg-slate-800/80"
          >
            <button
              type="button"
              onClick={() => setMetric('psi24h')}
              className={`whitespace-nowrap shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                metric === 'psi24h'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              24h PSI
            </button>
            <button
              type="button"
              onClick={() => setMetric('pm25_1h')}
              className={`whitespace-nowrap shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                metric === 'pm25_1h'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              1h PM2.5 (µg/m³)
            </button>
          </div>
        </div>
      </div>

      {/* Region Filter Strip + Active Crosshair Readout */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-slate-50/70 px-5 py-2.5 dark:border-slate-800/80 dark:bg-[#0D121E]">
        <div className="flex flex-wrap items-center gap-1.5">
          {SERIES_META.map((s) => {
            const active = visibleSeries[s.id];
            const isSelected = selectedRegion === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSeries(s.id)}
                onDoubleClick={() => onSelectRegion(s.id)}
                aria-pressed={active}
                title="Click to toggle line · Double-click to focus region"
                className={`inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                  active
                    ? isSelected
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    : 'border-transparent bg-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                <span
                  className="inline-block h-2 w-2 rounded-xs"
                  style={{
                    backgroundColor: active ? s.color : 'currentColor',
                    opacity: active ? 1 : 0.35,
                  }}
                />
                <span>{s.label}</span>
                {active && activePoint && (
                  <span className="font-mono text-[11px] tabular-nums opacity-80">
                    {activePoint.regions[s.id][metric]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activePoint && (
          <div className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
            Time: <span className="font-semibold text-slate-900 dark:text-white">{activePoint.hourLabel} SGT</span>
          </div>
        )}
      </div>

      {/* SVG Line Plot */}
      <div className="px-3 py-4 sm:px-5">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="24-hour air quality trend chart"
          tabIndex={0}
          onMouseMove={handlePointerMove}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setHoverIdx((i) => Math.max(0, i - 1));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setHoverIdx((i) => Math.min(hourly24h.length - 1, i + 1));
            }
          }}
          className="h-[260px] w-full cursor-crosshair select-none focus:outline-none"
        >
          {/* Horizontal grid ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const val = Math.round(
              chartBounds.yMin + t * (chartBounds.yMax - chartBounds.yMin)
            );
            const y = getY(val);
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-100 dark:text-slate-800"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px] tabular-nums dark:fill-slate-500"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* NEA Threshold Reference Lines */}
          {thresholds
            .filter((th) => th.value <= chartBounds.yMax)
            .map((th) => {
              const y = getY(th.value);
              return (
                <g key={th.value}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke={th.color}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.55"
                  />
                  <text
                    x={width - padRight - 4}
                    y={y - 4}
                    textAnchor="end"
                    fill={th.color}
                    className="font-mono text-[9.5px] font-medium"
                  >
                    {th.label}
                  </text>
                </g>
              );
            })}

          {/* X-axis hourly labels (every 3 hours) */}
          {hourly24h.map((pt, idx) => {
            if (idx % 3 !== 0 && idx !== hourly24h.length - 1) return null;
            const x = getX(idx);
            return (
              <text
                key={pt.timestampIso}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-400 font-mono text-[10px] tabular-nums dark:fill-slate-500"
              >
                {pt.hourLabel}
              </text>
            );
          })}

          {/* Series Polylines */}
          {SERIES_META.map((s) => {
            if (!visibleSeries[s.id]) return null;
            const pathD = hourly24h
              .map((pt, idx) => {
                const x = getX(idx);
                const y = getY(pt.regions[s.id][metric]);
                return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
              })
              .join(' ');
            const isFocused = selectedRegion === s.id;
            const strokeColor =
              s.id === 'national' ? undefined : s.color;

            return (
              <path
                key={s.id}
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isFocused ? 2.6 : s.id === 'national' ? 2 : 1.6}
                strokeDasharray={s.dashed ? '5 4' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                className={
                  s.id === 'national'
                    ? 'stroke-slate-900 dark:stroke-slate-100'
                    : undefined
                }
                opacity={
                  selectedRegion !== 'national' && !isFocused && s.id !== 'national'
                    ? 0.45
                    : 0.95
                }
              />
            );
          })}

          {/* Interactive Crosshair & Snap Points */}
          {activePoint && (
            <g>
              <line
                x1={getX(activeIdx)}
                y1={padTop}
                x2={getX(activeIdx)}
                y2={padTop + plotH}
                stroke="currentColor"
                strokeWidth="1"
                className="text-slate-400 dark:text-slate-500"
              />
              {SERIES_META.map((s) => {
                if (!visibleSeries[s.id]) return null;
                const cx = getX(activeIdx);
                const cy = getY(activePoint.regions[s.id][metric]);
                return (
                  <circle
                    key={`pt-${s.id}`}
                    cx={cx}
                    cy={cy}
                    r={selectedRegion === s.id ? 4.5 : 3.2}
                    fill={s.id === 'national' ? '#0F172A' : s.color}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className={
                      s.id === 'national' ? 'dark:fill-white dark:stroke-slate-900' : ''
                    }
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </section>
  );
};
