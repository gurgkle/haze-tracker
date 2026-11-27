import React, { useRef, useState } from 'react';
import { Compass, RotateCcw, Wind } from 'lucide-react';
import type { RegionId, RegionOrNational, RegionTelemetry } from '../types/psi';
import { getPm25BandMeta, getPsiBandMeta } from '../utils/neaScale';

export type MapMetricLayer = 'psi24h' | 'pm25_1h';

interface SingaporeMapProps {
  regions: Record<RegionId, RegionTelemetry>;
  selectedRegion: RegionOrNational;
  onSelectRegion: (region: RegionOrNational) => void;
  metricLayer: MapMetricLayer;
  onChangeMetricLayer: (layer: MapMetricLayer) => void;
  showWindVectors: boolean;
  onToggleWindVectors: () => void;
}

interface StationAnchor {
  id: RegionId;
  x: number;
  y: number;
  haloRx: number;
  haloRy: number;
  labelAlign: 'left' | 'right' | 'center';
}

const STATION_ANCHORS: StationAnchor[] = [
  { id: 'west', x: 188, y: 244, haloRx: 122, haloRy: 92, labelAlign: 'center' },
  { id: 'north', x: 374, y: 124, haloRx: 118, haloRy: 74, labelAlign: 'center' },
  { id: 'central', x: 454, y: 248, haloRx: 94, haloRy: 74, labelAlign: 'center' },
  { id: 'east', x: 660, y: 230, haloRx: 120, haloRy: 84, labelAlign: 'center' },
  { id: 'south', x: 422, y: 360, haloRx: 108, haloRy: 64, labelAlign: 'center' },
];

// Accurate Singapore island silhouette & offshore islands in an 880x520 geographic projection
// Longitude range: 103.600°E (x=40) to 104.040°E (x=840)
// Latitude range: 1.480°N (y=36) to 1.210°N (y=486)
const MAINLAND_PATH =
  'M 64 252 L 72 224 L 90 198 L 116 176 L 146 154 L 182 140 L 214 126 L 244 102 L 278 86 L 318 76 L 352 68 L 386 72 L 422 86 L 456 96 L 486 114 L 514 134 L 548 142 L 584 150 L 622 158 L 656 172 L 692 180 L 726 196 L 758 214 L 772 238 L 764 264 L 742 280 L 710 292 L 672 302 L 628 310 L 584 322 L 542 338 L 502 356 L 474 374 L 444 388 L 412 396 L 380 390 L 350 374 L 314 358 L 278 346 L 242 344 L 204 342 L 166 346 L 128 358 L 98 370 L 74 362 L 64 334 L 68 292 Z';

const JURONG_ISLAND_PATH =
  'M 134 384 L 168 372 L 214 374 L 248 392 L 244 416 L 204 426 L 154 420 L 128 404 Z';

const SENTOSA_PATH =
  'M 382 414 L 412 408 L 444 418 L 434 434 L 396 432 Z';

const PULAU_UBIN_PATH =
  'M 578 112 L 614 102 L 654 108 L 670 124 L 640 134 L 594 130 Z';

const PULAU_TEKONG_PATH =
  'M 690 100 L 732 90 L 774 104 L 780 134 L 744 154 L 704 148 L 686 124 Z';

const REGION_DIVIDERS = [
  // West / North-Central boundary
  'M 278 86 L 298 168 L 326 244 L 314 358',
  // North / Central boundary
  'M 298 168 L 392 178 L 486 164 L 548 142',
  // Central / East boundary
  'M 548 142 L 540 230 L 542 338',
  // Central / South boundary
  'M 326 296 L 424 304 L 542 308',
];

function coordsFromSvgPoint(x: number, y: number): { lat: string; lng: string } {
  const lng = 103.6 + ((x - 40) / 800) * 0.44;
  const lat = 1.48 - ((y - 36) / 450) * 0.27;
  return {
    lat: `${Math.max(1.18, Math.min(1.52, lat)).toFixed(4)}° N`,
    lng: `${Math.max(103.56, Math.min(104.08, lng)).toFixed(4)}° E`,
  };
}

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  regions,
  selectedRegion,
  onSelectRegion,
  metricLayer,
  onChangeMetricLayer,
  showWindVectors,
  onToggleWindVectors,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string }>({
    lat: '1.3521° N',
    lng: '103.8198° E',
  });
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((e.clientX - rect.left) / rect.width) * 880;
    const y = ((e.clientY - rect.top) / rect.height) * 520;
    setCursorCoords(coordsFromSvgPoint(x, y));
  };

  return (
    <section
      id="regional-map"
      aria-label="Singapore Regional PSI Map"
      className="flex flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#101624]"
    >
      {/* Map Canvas Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Singapore Atmospheric Station Map
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Select a region marker to inspect station sub-indices and local wind drift
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Map overlay metric"
            className="flex items-center rounded-md bg-slate-100 p-0.5 dark:bg-slate-800/80"
          >
            <button
              type="button"
              onClick={() => onChangeMetricLayer('psi24h')}
              className={`whitespace-nowrap shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                metricLayer === 'psi24h'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              24h PSI
            </button>
            <button
              type="button"
              onClick={() => onChangeMetricLayer('pm25_1h')}
              className={`whitespace-nowrap shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                metricLayer === 'pm25_1h'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              1h PM2.5
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleWindVectors}
            aria-pressed={showWindVectors}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              showWindVectors
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Wind className="h-3.5 w-3.5" aria-hidden="true" />
            Wind Vectors
          </button>

          {selectedRegion !== 'national' && (
            <button
              type="button"
              onClick={() => onSelectRegion('national')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              All Regions
            </button>
          )}
        </div>
      </div>

      {/* SVG Map Viewport */}
      <div className="relative flex-1 overflow-hidden bg-slate-50/70 dark:bg-[#0B101B]">
        <svg
          ref={svgRef}
          viewBox="0 0 880 520"
          role="img"
          aria-label="Interactive map of Singapore showing five monitoring regions"
          onMouseMove={handleMouseMove}
          className="h-full w-full min-h-[340px] cursor-crosshair select-none"
        >
          <defs>
            <pattern
              id="sg-grid"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.6"
                className="text-slate-200/80 dark:text-slate-800/70"
              />
            </pattern>

            <clipPath id="sg-land-clip">
              <path d={MAINLAND_PATH} />
              <path d={JURONG_ISLAND_PATH} />
              <path d={SENTOSA_PATH} />
              <path d={PULAU_UBIN_PATH} />
              <path d={PULAU_TEKONG_PATH} />
            </clipPath>

            {STATION_ANCHORS.map((anchor) => {
              const region = regions[anchor.id];
              const hex =
                metricLayer === 'psi24h'
                  ? getPsiBandMeta(region.reading.psi24h).hexLight
                  : getPm25BandMeta(region.reading.pm25_1h).hex;
              return (
                <radialGradient
                  key={`grad-${anchor.id}`}
                  id={`plume-${anchor.id}`}
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop offset="0%" stopColor={hex} stopOpacity="0.42" />
                  <stop offset="65%" stopColor={hex} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={hex} stopOpacity="0" />
                </radialGradient>
              );
            })}
          </defs>

          {/* Coordinate grid backdrop */}
          <rect width="880" height="520" fill="url(#sg-grid)" />

          {/* Subtle Straits labels */}
          <text
            x="375"
            y="54"
            textAnchor="middle"
            className="fill-slate-400/80 font-mono text-[10px] tracking-[0.2em] uppercase dark:fill-slate-600"
          >
            Straits of Johor
          </text>
          <text
            x="565"
            y="476"
            textAnchor="middle"
            className="fill-slate-400/80 font-mono text-[10px] tracking-[0.2em] uppercase dark:fill-slate-600"
          >
            Singapore Strait
          </text>

          {/* Landmass base fill */}
          <g className="fill-slate-200/75 stroke-slate-300 dark:fill-slate-800/90 dark:stroke-slate-700">
            <path d={MAINLAND_PATH} strokeWidth="1.5" strokeLinejoin="round" />
            <path d={JURONG_ISLAND_PATH} strokeWidth="1.2" strokeLinejoin="round" />
            <path d={SENTOSA_PATH} strokeWidth="1.2" strokeLinejoin="round" />
            <path d={PULAU_UBIN_PATH} strokeWidth="1.2" strokeLinejoin="round" />
            <path d={PULAU_TEKONG_PATH} strokeWidth="1.2" strokeLinejoin="round" />
          </g>

          {/* Atmospheric particulate plume clipped inside Singapore landmass */}
          <g clipPath="url(#sg-land-clip)">
            {STATION_ANCHORS.map((anchor) => (
              <ellipse
                key={`halo-${anchor.id}`}
                cx={anchor.x}
                cy={anchor.y}
                rx={anchor.haloRx * 1.45}
                ry={anchor.haloRy * 1.45}
                fill={`url(#plume-${anchor.id})`}
              />
            ))}

            {/* Regional sector dividers */}
            {REGION_DIVIDERS.map((d, idx) => (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke="currentColor"
                strokeDasharray="4 4"
                strokeWidth="1.1"
                className="text-slate-400/70 dark:text-slate-600/80"
              />
            ))}
          </g>

          {/* Subtle coastal outline re-stroke for crisp edges */}
          <g className="pointer-events-none fill-none stroke-slate-400/70 dark:stroke-slate-600">
            <path d={MAINLAND_PATH} strokeWidth="1.4" strokeLinejoin="round" />
            <path d={JURONG_ISLAND_PATH} strokeWidth="1.1" strokeLinejoin="round" />
            <path d={SENTOSA_PATH} strokeWidth="1.1" strokeLinejoin="round" />
            <path d={PULAU_UBIN_PATH} strokeWidth="1.1" strokeLinejoin="round" />
            <path d={PULAU_TEKONG_PATH} strokeWidth="1.1" strokeLinejoin="round" />
          </g>

          {/* Causeway & Second Link subtle markers */}
          <line
            x1="340"
            y1="68"
            x2="340"
            y2="46"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-slate-400/60 dark:text-slate-600"
          />
          <line
            x1="92"
            y1="200"
            x2="66"
            y2="180"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-400/60 dark:text-slate-600"
          />

          {/* Interactive Station Nodes */}
          {STATION_ANCHORS.map((anchor) => {
            const region = regions[anchor.id];
            const isSelected = selectedRegion === anchor.id;
            const isHovered = hoveredRegion === anchor.id;
            const value =
              metricLayer === 'psi24h'
                ? region.reading.psi24h
                : region.reading.pm25_1h;
            const psiMeta = getPsiBandMeta(region.reading.psi24h);
            const pmMeta = getPm25BandMeta(region.reading.pm25_1h);
            const accentHex =
              metricLayer === 'psi24h' ? psiMeta.hex : pmMeta.hex;

            // Wind arrow direction (meteorological wind blows FROM bearingDeg; arrow points where wind is going)
            const flowDeg = (region.wind.bearingDeg + 180) % 360;

            return (
              <g
                key={anchor.id}
                transform={`translate(${anchor.x}, ${anchor.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${region.name} region: ${
                  metricLayer === 'psi24h'
                    ? `24-hour PSI ${region.reading.psi24h} (${psiMeta.band})`
                    : `1-hour PM2.5 ${region.reading.pm25_1h} micrograms per cubic meter (${pmMeta.band})`
                }`}
                aria-pressed={isSelected}
                onClick={() =>
                  onSelectRegion(isSelected ? 'national' : anchor.id)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRegion(isSelected ? 'national' : anchor.id);
                  }
                }}
                onMouseEnter={() => setHoveredRegion(anchor.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-pointer focus:outline-none"
              >
                {/* Invisible hit target >= 64px */}
                <circle r="38" fill="transparent" />

                {/* Selection ring */}
                {(isSelected || isHovered) && (
                  <circle
                    r={isSelected ? 34 : 30}
                    fill="none"
                    stroke={accentHex}
                    strokeWidth={isSelected ? '2' : '1.2'}
                    strokeDasharray={isSelected ? undefined : '3 3'}
                    opacity={isSelected ? 0.95 : 0.7}
                  />
                )}

                {/* Wind vector arrow orbiting station */}
                {showWindVectors && (
                  <g transform={`rotate(${flowDeg})`}>
                    <line
                      x1="0"
                      y1="-30"
                      x2="0"
                      y2="-46"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="text-slate-600 dark:text-slate-300"
                    />
                    <polygon
                      points="0,-51 -4,-43 4,-43"
                      className="fill-slate-700 dark:fill-slate-200"
                    />
                  </g>
                )}

                {/* Station readout plate */}
                <rect
                  x="-32"
                  y="-24"
                  width="64"
                  height="48"
                  rx="8"
                  className={
                    isSelected
                      ? 'fill-slate-900 stroke-slate-900 dark:fill-white dark:stroke-white'
                      : 'fill-white/95 stroke-slate-300 dark:fill-slate-900/95 dark:stroke-slate-700'
                  }
                  strokeWidth="1.25"
                />

                {/* Top color hairline inside station plate */}
                <rect
                  x="-24"
                  y="-19"
                  width="48"
                  height="3"
                  rx="1.5"
                  fill={accentHex}
                />

                {/* Numeric readout */}
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  className={`font-mono text-[18px] font-bold tabular-nums ${
                    isSelected
                      ? 'fill-white dark:fill-slate-900'
                      : 'fill-slate-900 dark:fill-slate-100'
                  }`}
                >
                  {value}
                </text>

                {/* Region label */}
                <text
                  x="0"
                  y="18"
                  textAnchor="middle"
                  className={`font-sans text-[10px] font-semibold tracking-wide uppercase ${
                    isSelected
                      ? 'fill-slate-300 dark:fill-slate-600'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {region.name}
                </text>

                {/* Wind speed tag below plate when wind vectors active */}
                {showWindVectors && (
                  <text
                    x="0"
                    y="38"
                    textAnchor="middle"
                    className="fill-slate-600 font-mono text-[9.5px] font-medium tabular-nums dark:fill-slate-400"
                  >
                    {region.wind.directionLabel} {region.wind.speedKmh} km/h
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Bottom Canvas Overlay: Legend & Live Coordinate Probe */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white/90 px-5 py-2.5 text-xs dark:border-slate-800 dark:bg-[#0E1422]/90">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {metricLayer === 'psi24h' ? 'NEA PSI Scale:' : '1h PM2.5 Scale:'}
            </span>
            {metricLayer === 'psi24h' ? (
              <>
                <span className="font-mono tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400">●</span>{' '}
                  0–50 Good
                </span>
                <span className="font-mono tabular-nums">
                  <span className="text-sky-600 dark:text-sky-400">◆</span>{' '}
                  51–100 Moderate
                </span>
                <span className="font-mono tabular-nums">
                  <span className="text-amber-600 dark:text-amber-400">▲</span>{' '}
                  101–200 Unhealthy
                </span>
                <span className="font-mono tabular-nums">
                  <span className="text-orange-600 dark:text-orange-400">■</span>{' '}
                  201–300 Very Unhealthy
                </span>
                <span className="font-mono tabular-nums">
                  <span className="text-rose-600 dark:text-rose-400">✖</span>{' '}
                  &gt;300 Hazardous
                </span>
              </>
            ) : (
              <>
                <span className="font-mono tabular-nums">
                  <span className="text-emerald-600 dark:text-emerald-400">●</span>{' '}
                  0–55 Normal
                </span>
                <span className="font-mono tabular-nums">
                  <span className="text-amber-600 dark:text-amber-400">▲</span>{' '}
                  56–150 Elevated
                </span>
                <span className="font-mono tabular-nums">
                  <span className="text-orange-600 dark:text-orange-400">■</span>{' '}
                  151–250 High
                </span>
                <span className="font-mono tabular-nums">
                  <span className="text-rose-600 dark:text-rose-400">✖</span>{' '}
                  &gt;250 Very High
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            <Compass className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>
              {cursorCoords.lat}, {cursorCoords.lng}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
