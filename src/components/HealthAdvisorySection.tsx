import React from 'react';
import type { PsiSnapshot, RegionOrNational } from '../types/psi';
import { getNeaHealthAdvisories, getPsiBandMeta } from '../utils/neaScale';

interface HealthAdvisorySectionProps {
  snapshot: PsiSnapshot;
  selectedRegion: RegionOrNational;
}

const NEA_BAND_REFERENCE = [
  {
    range: '0–50',
    band: 'Good',
    glyph: '●',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    summary: 'Clean air conditions',
  },
  {
    range: '51–100',
    band: 'Moderate',
    glyph: '◆',
    colorClass: 'text-sky-700 dark:text-sky-400',
    summary: 'Mild haze possible',
  },
  {
    range: '101–200',
    band: 'Unhealthy',
    glyph: '▲',
    colorClass: 'text-amber-700 dark:text-amber-400',
    summary: 'Limit prolonged outdoor exertion',
  },
  {
    range: '201–300',
    band: 'Very Unhealthy',
    glyph: '■',
    colorClass: 'text-orange-700 dark:text-orange-400',
    summary: 'Avoid outdoor exertion',
  },
  {
    range: '>300',
    band: 'Hazardous',
    glyph: '✖',
    colorClass: 'text-rose-700 dark:text-rose-400',
    summary: 'Remain indoors with filtration',
  },
];

export const HealthAdvisorySection: React.FC<HealthAdvisorySectionProps> = ({
  snapshot,
  selectedRegion,
}) => {
  const activeReading =
    selectedRegion === 'national'
      ? snapshot.national
      : snapshot.regions[selectedRegion].reading;
  const scopeLabel =
    selectedRegion === 'national'
      ? 'Singapore National Aggregate'
      : `${snapshot.regions[selectedRegion].name} Region`;

  const psiMeta = getPsiBandMeta(activeReading.psi24h);
  const advisories = getNeaHealthAdvisories(
    activeReading.psi24h,
    activeReading.pm25_1h
  );

  return (
    <section
      id="health-guide"
      aria-label="NEA Health Advisory and Reference Scale"
      className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#101624]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            NEA Health & Activity Advisory
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Calibrated to {scopeLabel} · 24h PSI{' '}
            <span className="font-mono tabular-nums">{activeReading.psi24h}</span> ·
            1h PM2.5{' '}
            <span className="font-mono tabular-nums">{activeReading.pm25_1h}</span>{' '}
            µg/m³
          </p>
        </div>

        <div className={`text-sm font-semibold ${psiMeta.textClass}`}>
          <span aria-hidden="true">{psiMeta.glyph}</span> {psiMeta.band} (
          <span className="font-mono tabular-nums">{psiMeta.rangeLabel}</span>)
        </div>
      </div>

      {/* Action Matrix */}
      <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-slate-800">
        {advisories.slice(0, 2).map((row) => (
          <div key={row.audience} className="p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {row.audience}
              </h3>
              <span className={`text-xs font-medium ${psiMeta.textClass}`}>
                {row.actionLevel}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {row.guidance}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 divide-y divide-slate-200 border-t border-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-slate-800 dark:border-slate-800">
        {advisories.slice(2, 4).map((row) => (
          <div key={row.audience} className="p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {row.audience}
              </h3>
              <span className={`text-xs font-medium ${psiMeta.textClass}`}>
                {row.actionLevel}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {row.guidance}
            </p>
          </div>
        ))}
      </div>

      {/* NEA PSI Scale Reference */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-[#0D121E]">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Singapore NEA 24-Hour PSI Classification Scale
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {NEA_BAND_REFERENCE.map((item) => {
            const isCurrent = item.band === psiMeta.band;
            return (
              <div
                key={item.band}
                className={`rounded-md border px-3 py-2.5 transition-colors ${
                  isCurrent
                    ? 'border-slate-900 bg-white dark:border-slate-200 dark:bg-slate-800/90'
                    : 'border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40'
                }`}
              >
                <div className={`text-xs font-semibold ${item.colorClass}`}>
                  <span aria-hidden="true">{item.glyph}</span> {item.band}
                </div>
                <div className="mt-0.5 font-mono text-xs font-medium tabular-nums text-slate-900 dark:text-slate-100">
                  PSI {item.range}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {item.summary}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
