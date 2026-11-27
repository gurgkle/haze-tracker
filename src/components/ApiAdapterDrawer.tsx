import React, { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { fetchApiHealth, parseNeaApiPayload } from '../services/psiService';
import type { ApiHealthResponse, NeaApiPayload, PsiSnapshot } from '../types/psi';

interface ApiAdapterDrawerProps {
  open: boolean;
  onClose: () => void;
  isLiveMode: boolean;
  isCustomPayloadActive: boolean;
  onFetchLive: () => Promise<void>;
  onApplyCustomSnapshot: (snapshot: PsiSnapshot) => void;
  onResetToScenarios: () => void;
}

const SAMPLE_DATA_GOV_V2_JSON = `{
  "code": 0,
  "errorMsg": "",
  "data": {
    "items": [
      {
        "timestamp": "2026-11-26T19:00:00+08:00",
        "updatedTimestamp": "2026-11-26T19:05:00+08:00",
        "readings": {
          "psi_twenty_four_hourly": {
            "west": 94,
            "east": 72,
            "central": 84,
            "south": 88,
            "north": 76,
            "national": 83
          },
          "pm25_twenty_four_hourly": {
            "west": 36,
            "east": 24,
            "central": 31,
            "south": 33,
            "north": 26,
            "national": 30
          },
          "pm10_twenty_four_hourly": {
            "west": 54,
            "east": 38,
            "central": 46,
            "south": 49,
            "north": 41,
            "national": 46
          }
        }
      }
    ]
  }
}`;

export const ApiAdapterDrawer: React.FC<ApiAdapterDrawerProps> = ({
  open,
  onClose,
  isLiveMode,
  isCustomPayloadActive,
  onFetchLive,
  onApplyCustomSnapshot,
  onResetToScenarios,
}) => {
  const [jsonInput, setJsonInput] = useState(SAMPLE_DATA_GOV_V2_JSON);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [healthResult, setHealthResult] = useState<ApiHealthResponse | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);

  if (!open) return null;

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonInput) as NeaApiPayload;
      const snapshot = parseNeaApiPayload(
        parsed,
        'Custom JSON Payload · Data.gov.sg Adapter'
      );
      setErrorMsg(null);
      onApplyCustomSnapshot(snapshot);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to parse JSON payload against Data.gov.sg v2 schema.'
      );
    }
  };

  const handleRunHealthCheck = async () => {
    setCheckingHealth(true);
    setErrorMsg(null);
    try {
      const res = (await fetchApiHealth(true)) as ApiHealthResponse;
      setHealthResult(res);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Health check request failed.'
      );
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleTriggerLiveFetch = async () => {
    setFetchingLive(true);
    setErrorMsg(null);
    try {
      await onFetchLive();
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to fetch /api/psi.'
      );
    } finally {
      setFetchingLive(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-adapter-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0E1422]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="api-adapter-title"
              className="font-display text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Data.gov.sg Serverless API Adapter
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Serverless routes at <code className="font-mono">/api/psi</code> and{' '}
              <code className="font-mono">/api/health</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close API Adapter drawer"
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-xs">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              Connected Serverless Routes
            </div>
            <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
              <li>
                GET /api/psi → https://api-open.data.gov.sg/v2/real-time/api/psi
              </li>
              <li>
                GET /api/health → Service &amp; upstream readiness probe
              </li>
            </ul>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerLiveFetch}
                disabled={fetchingLive}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${fetchingLive ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                {fetchingLive ? 'Fetching Live PSI...' : 'Pull Live Data (/api/psi)'}
              </button>

              <button
                type="button"
                onClick={handleRunHealthCheck}
                disabled={checkingHealth}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {checkingHealth ? 'Checking...' : 'Check /api/health'}
              </button>
            </div>

            {healthResult && (
              <div className="mt-3 rounded border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <div>
                  status: {healthResult.status} · upstream:{' '}
                  {healthResult.upstreamStatus}
                  {healthResult.latencyMs !== null
                    ? ` (${healthResult.latencyMs} ms)`
                    : ''}
                </div>
                <div className="mt-0.5 text-slate-500">
                  checked: {healthResult.timestamp}
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="nea-json-tester"
              className="block font-semibold text-slate-800 dark:text-slate-200"
            >
              Test Custom Data.gov.sg v2 Payload
            </label>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Override live data temporarily with a custom Data.gov.sg v2 JSON response
              to verify UI thresholds.
            </p>
            <textarea
              id="nea-json-tester"
              rows={14}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              spellCheck={false}
              className="mt-2.5 w-full rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {errorMsg && (
              <p className="mt-2 font-medium text-rose-600 dark:text-rose-400">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          {isCustomPayloadActive ? (
            <button
              type="button"
              onClick={() => {
                onResetToScenarios();
                onClose();
              }}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Revert to Scenarios
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {isLiveMode
                ? 'Active source: /api/psi'
                : 'Active source: Local scenario preview'}
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Apply Payload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
