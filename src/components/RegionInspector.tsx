import React from 'react';
import type { PsiSnapshot, RegionOrNational } from '../types/psi';
import { getPm25BandMeta, getPsiBandMeta } from '../utils/neaScale';

interface RegionInspectorProps {
  snapshot: PsiSnapshot;
  selectedRegion: RegionOrNational;
}

export const RegionInspector: React.FC<RegionInspectorProps> = ({
  snapshot,
  selectedRegion,
}) => {
  const isNational = selectedRegion === 'national';
  const regionData = isNational ? null : snapshot.regions[selectedRegion];

  const reading = regionData ? regionData.reading : snapshot.national;
  const title = regionData ? `${regionData.name} Region` : 'Singapore National';
  const subtitle = regionData
    ? regionData.stationLabel
    : 'Islandwide 5-Region Aggregate';
  const planningAreas = regionData
    ? regionData.planningAreas
    : 'West · North · Central · East · South';
  const delta3h = regionData ? regionData.delta3h : snapshot.national.delta3h;
  const wind = regionData ? regionData.wind : snapshot.national.wind;
  const dominantPollutant = regionData
    ? regionData.dominantPollutant
    : snapshot.national.dominantPollutant;

  const psiMeta = getPsiBandMeta(reading.psi24h);
  const pm25Meta = getPm25BandMeta(reading.pm25_1h);

  const subIndexRows = [
    {
      label: 'PM2.5',
      subIndex: reading.subIndices.pm25,
      rawValue: `${reading.pm25_24h} µg/m³`,
      basis: '24h mean',
    },
    {
      label: 'PM10',
      subIndex: reading.subIndices.pm10,
      rawValue: `${reading.pm10_24h} µg/m³`,
      basis: '24h mean',
    },
    {
      label: 'Ozone (O₃)',
      subIndex: reading.subIndices.o3,
      rawValue: `${reading.o3_8h_max} µg/m³`,
      basis: '8h max',
    },
    {
      label: 'SO₂',
      subIndex: reading.subIndices.so2,
      rawValue: `${reading.so2_24h} µg/m³`,
      basis: '24h mean',
    },
    {
      label: 'NO₂',
      subIndex: reading.subIndices.no2,
      rawValue: `${reading.no2_1h_max} µg/m³`,
      basis: '1h max',
    },
    {
      label: 'CO',
      subIndex: reading.subIndices.co,
      rawValue: `${reading.co_8h_max.toFixed(2)} mg/m³`,
      basis: '8h max',
    },
  ];

  const maxBarScale = Math.max(200, reading.psi24h + 20);

  return (
    <aside
      aria-label="Selected Region Telemetry Inspector"
      className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#101624]"
    >
      <div>
        {/* Sector Header */}
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {title} · {subtitle}
          </div>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {planningAreas}
          </p>
        </div>

        {/* Primary PSI & 1h PM2.5 Readout */}
        <div className="px-5 py-5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                24-Hour PSI
              </div>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span className="font-mono text-5xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
                  {reading.psi24h}
                </span>
                <span className="font-mono text-xs uppercase text-slate-400">
                  Index
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className={`text-sm font-semibold ${psiMeta.textClass}`}>
                <span aria-hidden="true">{psiMeta.glyph}</span> {psiMeta.band}
              </div>
              <div className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                Band {psiMeta.rangeLabel}
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {psiMeta.description}
          </p>

          {/* Compact 2x2 Secondary Metrics */}
          <div className="mt-5 grid grid-cols-2 divide-x divide-y divide-slate-200 border border-slate-200 rounded-md dark:divide-slate-800 dark:border-slate-800">
            <div className="px-3.5 py-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                1-Hr PM2.5
              </div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {reading.pm25_1h}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  µg/m³
                </span>
              </div>
              <div className={`text-[11px] font-medium ${pm25Meta.textClass}`}>
                {pm25Meta.bandNumber} · {pm25Meta.band}
              </div>
            </div>

            <div className="px-3.5 py-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                3-Hr Trend
              </div>
              <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {delta3h > 0 ? `+${delta3h}` : delta3h} pts
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {delta3h > 2
                  ? 'Rising concentration'
                  : delta3h < -2
                    ? 'Clearing trend'
                    : 'Steady level'}
              </div>
            </div>

            <div className="px-3.5 py-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Surface Wind
              </div>
              <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {wind.directionLabel} {wind.speedKmh}
                <span className="ml-1 text-[11px] font-normal text-slate-400">
                  km/h
                </span>
              </div>
              <div className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                Bearing {wind.bearingDeg}°
              </div>
            </div>

            <div className="px-3.5 py-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Primary Driver
              </div>
              <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 dark:text-slate-100">
                {dominantPollutant}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Highest sub-index
              </div>
            </div>
          </div>
        </div>

        {/* 6-Pollutant Sub-Index Table */}
        <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Pollutant Sub-Indices
            </h3>
            <span className="font-mono text-[11px] text-slate-400">
              Sub-Index / Conc.
            </span>
          </div>

          <div className="space-y-2.5">
            {subIndexRows.map((item) => {
              const pct = Math.min(100, Math.round((item.subIndex / maxBarScale) * 100));
              const itemMeta = getPsiBandMeta(item.subIndex);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.label}{' '}
                      <span className="text-[11px] font-normal text-slate-400">
                        · {item.basis}
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      <span className="font-semibold">{item.subIndex}</span>
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">
                        /
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.rawValue}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${Math.max(4, pct)}%`,
                        backgroundColor: itemMeta.hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        PSI is determined by the highest 24h sub-index among all 6 monitored pollutants.
      </div>
    </aside>
  );
};
