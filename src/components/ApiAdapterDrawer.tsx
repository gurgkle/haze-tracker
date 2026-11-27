import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { NeaApiPayload, PsiSnapshot } from '../types/psi';
import { parseNeaApiPayload } from '../services/psiService';

interface ApiAdapterDrawerProps {
  open: boolean;
  onClose: () => void;
  isCustomPayloadActive: boolean;
  onApplyCustomSnapshot: (snapshot: PsiSnapshot) => void;
  onResetToScenarios: () => void;
}

const SAMPLE_NEA_JSON = `{
  "items": [
    {
      "timestamp": "2026-11-26T19:00:00+08:00",
      "update_timestamp": "2026-11-26T19:05:00+08:00",
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
}`;

export const ApiAdapterDrawer: React.FC<ApiAdapterDrawerProps> = ({
  open,
  onClose,
  isCustomPayloadActive,
  onApplyCustomSnapshot,
  onResetToScenarios,
}) => {
  const [jsonInput, setJsonInput] = useState(SAMPLE_NEA_JSON);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonInput) as NeaApiPayload;
      const snapshot = parseNeaApiPayload(parsed);
      setErrorMsg(null);
      onApplyCustomSnapshot(snapshot);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to parse JSON payload against NEA schema.'
      );
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
              NEA / Data.gov.sg API Adapter
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Frontend schema adapter ready for live Singapore PSI endpoints
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
              Integration Point: <code className="font-mono">src/services/psiService.ts</code>
            </div>
            <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-300">
              This UI is decoupled behind <code className="font-mono">PsiSnapshot</code> and{' '}
              <code className="font-mono">parseNeaApiPayload()</code>. When you are ready to
              wire your backend or direct polling, fetch from{' '}
              <code className="font-mono">https://api.data.gov.sg/v1/environment/psi</code>{' '}
              and pass the JSON response into <code className="font-mono">parseNeaApiPayload()</code>.
            </p>
          </div>

          <div>
            <label
              htmlFor="nea-json-tester"
              className="block font-semibold text-slate-800 dark:text-slate-200"
            >
              Test NEA JSON Payload Locally
            </label>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              Edit or paste a payload matching Singapore Data.gov.sg PSI structure to hydrate
              all charts, map stations, and advisories immediately.
            </p>
            <textarea
              id="nea-json-tester"
              rows={15}
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
              No external network requests active
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
