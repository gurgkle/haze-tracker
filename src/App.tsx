import { useCallback, useEffect, useMemo, useState } from 'react';
import { Moon, RefreshCw, Sun } from 'lucide-react';
import { ApiAdapterDrawer } from './components/ApiAdapterDrawer';
import { HealthAdvisorySection } from './components/HealthAdvisorySection';
import { RegionalMatrixTable } from './components/RegionalMatrixTable';
import { RegionInspector } from './components/RegionInspector';
import { type MapMetricLayer, SingaporeMap } from './components/SingaporeMap';
import { TopBar } from './components/TopBar';
import { TrendChart24h } from './components/TrendChart24h';
import {
  fetchLivePsiSnapshot,
  getSnapshotForScenario,
  SCENARIOS,
} from './services/psiService';
import type {
  PsiSnapshot,
  RegionId,
  RegionOrNational,
  ScenarioId,
} from './types/psi';
import { getPsiBandMeta } from './utils/neaScale';

const REGION_STRIP_ORDER: RegionOrNational[] = [
  'national',
  'west',
  'north',
  'central',
  'east',
  'south',
];

export default function App() {
  const [dataMode, setDataMode] = useState<'live' | 'scenario' | 'custom'>('live');
  const [scenarioId, setScenarioId] = useState<ScenarioId>('moderate');
  const [liveSnapshot, setLiveSnapshot] = useState<PsiSnapshot | null>(null);
  const [customSnapshot, setCustomSnapshot] = useState<PsiSnapshot | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(true);
  const [liveError, setLiveError] = useState<string | null>(null);

  const [selectedRegion, setSelectedRegion] =
    useState<RegionOrNational>('national');
  const [metricLayer, setMetricLayer] = useState<MapMetricLayer>('psi24h');
  const [showWindVectors, setShowWindVectors] = useState<boolean>(true);
  const [apiDrawerOpen, setApiDrawerOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const loadLivePsi = useCallback(async () => {
    setIsLoadingLive(true);
    setLiveError(null);
    try {
      const next = await fetchLivePsiSnapshot();
      setLiveSnapshot(next);
      setDataMode('live');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to fetch live PSI readings from /api/psi.';
      setLiveError(message);
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    void loadLivePsi();
  }, [loadLivePsi]);

  const snapshot = useMemo(() => {
    if (dataMode === 'custom' && customSnapshot) return customSnapshot;
    if (dataMode === 'live' && liveSnapshot) return liveSnapshot;
    return getSnapshotForScenario(scenarioId);
  }, [dataMode, customSnapshot, liveSnapshot, scenarioId]);

  const handleSelectScenario = (id: ScenarioId) => {
    setCustomSnapshot(null);
    setScenarioId(id);
    setDataMode('scenario');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100">
      <TopBar onOpenApiDrawer={() => setApiDrawerOpen(true)} />

      <main className="mx-auto max-w-[1380px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero Overview & Workspace Controls */}
        <section
          id="overview"
          aria-label="Singapore Air Quality Overview"
          className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end dark:border-slate-800"
        >
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-950 [text-wrap:balance] sm:text-3xl dark:text-white">
              Singapore Air Quality & PSI Monitor
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono tabular-nums">
                {snapshot.updatedLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {isLoadingLive && !liveSnapshot
                  ? 'Connecting to /api/psi...'
                  : snapshot.sourceLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span>NEA 24-Hr PSI & 1-Hr PM2.5 (µg/m³)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Data Source & Scenario Switcher */}
            <div
              role="group"
              aria-label="Data source and scenario selector"
              className="flex flex-wrap items-center rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-[#101624]"
            >
              <button
                type="button"
                onClick={() => void loadLivePsi()}
                title="Fetch live Singapore PSI from Data.gov.sg via /api/psi"
                className={`whitespace-nowrap shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  dataMode === 'live'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Live API
              </button>

              {SCENARIOS.map((sc) => {
                const active = dataMode === 'scenario' && scenarioId === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSelectScenario(sc.id)}
                    title={sc.shortDesc}
                    className={`whitespace-nowrap shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void loadLivePsi()}
              disabled={isLoadingLive}
              aria-label="Refresh live PSI data"
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:bg-[#101624] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingLive ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {isLoadingLive ? 'Syncing' : 'Refresh'}
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={
                isDark ? 'Switch to light mode' : 'Switch to dark mode'
              }
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#101624] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  Dark
                </>
              )}
            </button>
          </div>
        </section>

        {/* Non-blocking live feed error notice */}
        {liveError && dataMode === 'live' && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <div>
              <span className="font-semibold">Live API fallback active:</span>{' '}
              {liveError} Showing local preview values until connection succeeds.
            </div>
            <button
              type="button"
              onClick={() => void loadLivePsi()}
              className="whitespace-nowrap shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-100"
            >
              Retry Live Fetch
            </button>
          </div>
        )}

        {/* Full-Width 6-Sector Quick Selector Strip */}
        <section
          aria-label="Regional PSI Summary Strip"
          className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0 dark:divide-slate-800 dark:border-slate-800 dark:bg-[#101624]"
        >
          {REGION_STRIP_ORDER.map((id) => {
            const isNational = id === 'national';
            const label = isNational
              ? 'National'
              : snapshot.regions[id as RegionId].name;
            const psi = isNational
              ? snapshot.national.psi24h
              : snapshot.regions[id as RegionId].reading.psi24h;
            const pm25 = isNational
              ? snapshot.national.pm25_1h
              : snapshot.regions[id as RegionId].reading.pm25_1h;
            const meta = getPsiBandMeta(psi);
            const active = selectedRegion === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedRegion(id)}
                aria-pressed={active}
                className={`flex flex-col items-start px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-slate-900 dark:focus-visible:outline-slate-100 ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      active
                        ? 'text-slate-200 dark:text-slate-700'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      active
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    PM2.5 {pm25}
                  </span>
                </div>

                <div className="mt-1.5 flex w-full items-baseline justify-between gap-2">
                  <span className="font-mono text-2xl font-bold tabular-nums">
                    {psi}
                  </span>
                  <span
                    className={`text-[11px] font-medium whitespace-nowrap ${
                      active ? 'text-white dark:text-slate-900' : meta.textClass
                    }`}
                  >
                    <span aria-hidden="true">{meta.glyph}</span> {meta.band}
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Primary Focal Split Console: Map + Region Inspector */}
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <div className="flex flex-col lg:col-span-8">
            <SingaporeMap
              regions={snapshot.regions}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              metricLayer={metricLayer}
              onChangeMetricLayer={setMetricLayer}
              showWindVectors={showWindVectors}
              onToggleWindVectors={() => setShowWindVectors((prev) => !prev)}
            />
          </div>

          <div className="flex flex-col lg:col-span-4">
            <RegionInspector
              snapshot={snapshot}
              selectedRegion={selectedRegion}
            />
          </div>
        </div>

        {/* 24-Hour Trajectory Chart */}
        <TrendChart24h
          hourly24h={snapshot.hourly24h}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
        />

        {/* Regional Comparison Table */}
        <RegionalMatrixTable
          snapshot={snapshot}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
        />

        {/* NEA Health & Activity Advisory */}
        <HealthAdvisorySection
          snapshot={snapshot}
          selectedRegion={selectedRegion}
        />
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0B0F19]">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8 dark:text-slate-400">
          <div>
            SG HazeWatch · Singapore Regional PSI & Haze Monitor · Data.gov.sg v2
            Serverless Proxy
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setApiDrawerOpen(true)}
              className="font-medium text-slate-700 hover:text-slate-950 hover:underline underline-offset-4 dark:text-slate-300 dark:hover:text-white"
            >
              API Diagnostics
            </button>
            <a
              href="#overview"
              className="font-medium text-slate-700 hover:text-slate-950 hover:underline underline-offset-4 dark:text-slate-300 dark:hover:text-white"
            >
              Back to Top
            </a>
          </div>
        </div>
      </footer>

      <ApiAdapterDrawer
        open={apiDrawerOpen}
        onClose={() => setApiDrawerOpen(false)}
        isLiveMode={dataMode === 'live'}
        isCustomPayloadActive={dataMode === 'custom'}
        onFetchLive={loadLivePsi}
        onApplyCustomSnapshot={(snap) => {
          setCustomSnapshot(snap);
          setDataMode('custom');
        }}
        onResetToScenarios={() => {
          setCustomSnapshot(null);
          setDataMode('scenario');
        }}
      />
    </div>
  );
}
