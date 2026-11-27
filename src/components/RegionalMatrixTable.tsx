import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import type { PsiSnapshot, RegionId, RegionOrNational } from '../types/psi';
import { getPm25BandMeta, getPsiBandMeta } from '../utils/neaScale';

interface RegionalMatrixTableProps {
  snapshot: PsiSnapshot;
  selectedRegion: RegionOrNational;
  onSelectRegion: (region: RegionOrNational) => void;
}

type SortKey = 'name' | 'psi24h' | 'pm25_1h' | 'pm10_24h' | 'delta3h';

export const RegionalMatrixTable: React.FC<RegionalMatrixTableProps> = ({
  snapshot,
  selectedRegion,
  onSelectRegion,
}) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('psi24h');
  const [sortAsc, setSortAsc] = useState(false);

  const regionOrder: RegionId[] = ['west', 'north', 'central', 'east', 'south'];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(key === 'name');
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = regionOrder
      .map((id) => snapshot.regions[id])
      .filter((r) => {
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.planningAreas.toLowerCase().includes(q) ||
          r.stationLabel.toLowerCase().includes(q)
        );
      });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortKey === 'delta3h') {
        cmp = a.delta3h - b.delta3h;
      } else {
        cmp = a.reading[sortKey] - b.reading[sortKey];
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [snapshot, query, sortKey, sortAsc]);

  return (
    <section
      aria-label="Regional Telemetry Matrix"
      className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#101624]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Regional Breakdown Matrix
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Click any region row to isolate its station data and advisory profile
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by town or region (e.g. Jurong)..."
            aria-label="Filter regions by town or planning area"
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            No monitoring regions match “{query}”
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Try searching for Jurong, Woodlands, Bishan, Tampines, or Marina Bay.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-[#0D121E] dark:text-slate-400">
                <th className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="inline-flex items-center gap-1 whitespace-nowrap hover:text-slate-900 dark:hover:text-white"
                  >
                    Region & Planning Areas
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('psi24h')}
                    className="inline-flex items-center gap-1 whitespace-nowrap hover:text-slate-900 dark:hover:text-white"
                  >
                    24h PSI
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('pm25_1h')}
                    className="inline-flex items-center gap-1 whitespace-nowrap hover:text-slate-900 dark:hover:text-white"
                  >
                    1h PM2.5
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('pm10_24h')}
                    className="inline-flex items-center gap-1 whitespace-nowrap hover:text-slate-900 dark:hover:text-white"
                  >
                    PM10 (24h)
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">Wind</th>
                <th className="px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('delta3h')}
                    className="inline-flex items-center gap-1 whitespace-nowrap hover:text-slate-900 dark:hover:text-white"
                  >
                    3h Delta
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((r) => {
                const isSelected = selectedRegion === r.id;
                const psiMeta = getPsiBandMeta(r.reading.psi24h);
                const pmMeta = getPm25BandMeta(r.reading.pm25_1h);
                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectRegion(isSelected ? 'national' : r.id)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-slate-100/90 dark:bg-slate-800/70'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {r.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {r.planningAreas}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {r.reading.psi24h}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`font-medium ${psiMeta.textClass}`}>
                        <span aria-hidden="true">{psiMeta.glyph}</span>{' '}
                        {psiMeta.band}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {r.reading.pm25_1h}{' '}
                      <span className="text-[11px] text-slate-400">µg/m³</span>
                      <div className={`font-sans text-[11px] ${pmMeta.textClass}`}>
                        {pmMeta.band}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {r.reading.pm10_24h}{' '}
                      <span className="text-[11px] text-slate-400">µg/m³</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {r.wind.directionLabel} {r.wind.speedKmh} km/h
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium tabular-nums text-slate-800 dark:text-slate-200">
                      {r.delta3h > 0 ? `+${r.delta3h}` : r.delta3h} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
