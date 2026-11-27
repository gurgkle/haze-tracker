import type { Pm25Band, PsiBand } from '../types/psi';

export interface PsiBandMeta {
  band: PsiBand;
  rangeLabel: string;
  glyph: string;
  textClass: string;
  mutedBgClass: string;
  borderClass: string;
  hex: string;
  hexLight: string;
  description: string;
}

export function getPsiBandMeta(psi: number): PsiBandMeta {
  if (psi <= 50) {
    return {
      band: 'Good',
      rangeLabel: '0–50',
      glyph: '●',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      mutedBgClass: 'bg-emerald-500/10 dark:bg-emerald-400/15',
      borderClass: 'border-emerald-200 dark:border-emerald-800/70',
      hex: '#059669',
      hexLight: '#10B981',
      description: 'Air quality is satisfactory with negligible particulate risk.',
    };
  }
  if (psi <= 100) {
    return {
      band: 'Moderate',
      rangeLabel: '51–100',
      glyph: '◆',
      textClass: 'text-sky-700 dark:text-sky-400',
      mutedBgClass: 'bg-sky-500/10 dark:bg-sky-400/15',
      borderClass: 'border-sky-200 dark:border-sky-800/70',
      hex: '#0284C7',
      hexLight: '#38BDF8',
      description: 'Acceptable air quality; unusually sensitive individuals should monitor symptoms.',
    };
  }
  if (psi <= 200) {
    return {
      band: 'Unhealthy',
      rangeLabel: '101–200',
      glyph: '▲',
      textClass: 'text-amber-700 dark:text-amber-400',
      mutedBgClass: 'bg-amber-500/12 dark:bg-amber-400/15',
      borderClass: 'border-amber-200 dark:border-amber-800/70',
      hex: '#D97706',
      hexLight: '#F59E0B',
      description: 'Transboundary haze present; prolonged outdoor exertion should be reduced.',
    };
  }
  if (psi <= 300) {
    return {
      band: 'Very Unhealthy',
      rangeLabel: '201–300',
      glyph: '■',
      textClass: 'text-orange-700 dark:text-orange-400',
      mutedBgClass: 'bg-orange-500/12 dark:bg-orange-400/15',
      borderClass: 'border-orange-200 dark:border-orange-800/70',
      hex: '#EA580C',
      hexLight: '#FB923C',
      description: 'Significant haze concentration; avoid strenuous outdoor activity.',
    };
  }
  return {
    band: 'Hazardous',
    rangeLabel: '>300',
    glyph: '✖',
    textClass: 'text-rose-700 dark:text-rose-400',
    mutedBgClass: 'bg-rose-500/12 dark:bg-rose-400/15',
    borderClass: 'border-rose-200 dark:border-rose-800/70',
    hex: '#DC2626',
    hexLight: '#F87171',
    description: 'Hazardous air quality; remain indoors with air filtration active.',
  };
}

export interface Pm25BandMeta {
  band: Pm25Band;
  bandNumber: string;
  rangeLabel: string;
  textClass: string;
  hex: string;
}

export function getPm25BandMeta(pm25_1h: number): Pm25BandMeta {
  if (pm25_1h <= 55) {
    return {
      band: 'Normal',
      bandNumber: 'Band I',
      rangeLabel: '0–55 µg/m³',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      hex: '#059669',
    };
  }
  if (pm25_1h <= 150) {
    return {
      band: 'Elevated',
      bandNumber: 'Band II',
      rangeLabel: '56–150 µg/m³',
      textClass: 'text-amber-700 dark:text-amber-400',
      hex: '#D97706',
    };
  }
  if (pm25_1h <= 250) {
    return {
      band: 'High',
      bandNumber: 'Band III',
      rangeLabel: '151–250 µg/m³',
      textClass: 'text-orange-700 dark:text-orange-400',
      hex: '#EA580C',
    };
  }
  return {
    band: 'Very High',
    bandNumber: 'Band IV',
    rangeLabel: '>250 µg/m³',
    textClass: 'text-rose-700 dark:text-rose-400',
    hex: '#DC2626',
  };
}

export interface AdvisoryRow {
  audience: string;
  guidance: string;
  actionLevel: string;
}

export function getNeaHealthAdvisories(psi: number, pm25_1h: number): AdvisoryRow[] {
  if (psi <= 50 && pm25_1h <= 55) {
    return [
      {
        audience: 'General Public',
        actionLevel: 'Normal Activity',
        guidance: 'Continue normal outdoor activities, commuting, and exercise without restriction.',
      },
      {
        audience: 'Vulnerable Groups',
        actionLevel: 'Normal Activity',
        guidance: 'Elderly, children, pregnant women, and respiratory patients may carry on normal routines.',
      },
      {
        audience: 'Outdoor Sports & Schools',
        actionLevel: 'Unrestricted',
        guidance: 'Full outdoor physical education, CCAs, and competitive training permitted.',
      },
      {
        audience: 'Mask & Indoor Filtration',
        actionLevel: 'Not Required',
        guidance: 'Natural ventilation is recommended; air purifiers and N95 respirators are unnecessary.',
      },
    ];
  }

  if (psi <= 100 && pm25_1h <= 55) {
    return [
      {
        audience: 'General Public',
        actionLevel: 'Normal Activity',
        guidance: 'Normal activities may continue. Check hourly 1-hr PM2.5 readings before long outdoor sessions.',
      },
      {
        audience: 'Vulnerable Groups',
        actionLevel: 'Monitor Symptoms',
        guidance: 'Those with asthma, COPD, or heart conditions should keep rescue medication accessible.',
      },
      {
        audience: 'Outdoor Sports & Schools',
        actionLevel: 'Standard Pacing',
        guidance: 'Schedule hydration breaks during intense afternoon training.',
      },
      {
        audience: 'Mask & Indoor Filtration',
        actionLevel: 'Optional',
        guidance: 'Surgical masks do not filter fine PM2.5 haze particles; keep an N95 spare if sensitive.',
      },
    ];
  }

  if (psi <= 200 || pm25_1h <= 150) {
    return [
      {
        audience: 'General Public',
        actionLevel: 'Reduce Prolonged Exertion',
        guidance: 'Cut back on prolonged or strenuous outdoor exertion, especially if eye or throat irritation occurs.',
      },
      {
        audience: 'Vulnerable Groups',
        actionLevel: 'Minimise Outdoor Exposure',
        guidance: 'Elderly, children, pregnant women, and cardio-respiratory patients should stay indoors.',
      },
      {
        audience: 'Outdoor Sports & Schools',
        actionLevel: 'Move Indoors',
        guidance: 'Shift physical education and outdoor sports to sheltered indoor halls.',
      },
      {
        audience: 'Mask & Indoor Filtration',
        actionLevel: 'HEPA Indoors / N95 Outside',
        guidance: 'Close windows, run HEPA air purifiers, and wear a properly fitted N95 mask for extended outdoor transit.',
      },
    ];
  }

  if (psi <= 300 || pm25_1h <= 250) {
    return [
      {
        audience: 'General Public',
        actionLevel: 'Avoid Outdoor Exertion',
        guidance: 'Avoid prolonged or strenuous outdoor physical exertion; keep outdoor trips brief.',
      },
      {
        audience: 'Vulnerable Groups',
        actionLevel: 'Remain Indoors',
        guidance: 'Stay indoors with doors and windows sealed. Seek medical attention if breathless.',
      },
      {
        audience: 'Outdoor Sports & Schools',
        actionLevel: 'Suspend Outdoor Activity',
        guidance: 'Cancel all outdoor school activities, field sports, and non-essential outdoor work.',
      },
      {
        audience: 'Mask & Indoor Filtration',
        actionLevel: 'N95 Recommended',
        guidance: 'Wear a well-fitted N95 respirator whenever outdoors for more than a few minutes; run air purifiers continuously.',
      },
    ];
  }

  return [
    {
      audience: 'General Public',
      actionLevel: 'Minimise All Outdoor Activity',
      guidance: 'Remain indoors wherever possible and avoid physical exertion even indoors if unconditioned.',
    },
    {
      audience: 'Vulnerable Groups',
      actionLevel: 'Strict Indoor Shelter',
      guidance: 'Remain indoors with air conditioning in recirculation mode and HEPA filtration.',
    },
    {
      audience: 'Outdoor Sports & Schools',
      actionLevel: 'Full Suspension',
      guidance: 'Follow MOH/MOE advisories for school closures and workplace outdoor stop-work orders.',
    },
    {
      audience: 'Mask & Indoor Filtration',
      actionLevel: 'N95 Mandatory Outdoors',
      guidance: 'Fit-checked N95 mask required for any essential outdoor exposure; seal door/window gaps.',
    },
  ];
}
