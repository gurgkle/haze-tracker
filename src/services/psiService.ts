import type {
  HourlyPoint,
  NeaApiPayload,
  PollutantReadings,
  PsiSnapshot,
  RegionId,
  RegionOrNational,
  RegionTelemetry,
  ScenarioId,
  WindVector,
} from '../types/psi';

export interface ScenarioMeta {
  id: ScenarioId;
  label: string;
  shortDesc: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'baseline',
    label: 'Clear Day',
    shortDesc: 'Typical inter-monsoon baseline (PSI 41–48)',
  },
  {
    id: 'moderate',
    label: 'Moderate Haze',
    shortDesc: 'Early SW monsoon smoke drift (PSI 71–89)',
  },
  {
    id: 'unhealthy',
    label: 'Unhealthy Spike',
    shortDesc: 'Active transboundary plume (PSI 129–164)',
  },
  {
    id: 'severe',
    label: 'Severe Haze',
    shortDesc: 'Dense regional smoke event (PSI 212–254)',
  },
];

export const REGION_DIRECTORY: Record<
  RegionId,
  {
    name: string;
    planningAreas: string;
    stationLabel: string;
    lat: number;
    lng: number;
  }
> = {
  west: {
    name: 'West',
    planningAreas: 'Jurong West, Tuas, Choa Chu Kang, Clementi',
    stationLabel: 'Jurong West & Nanyang Ave',
    lat: 1.3496,
    lng: 103.7063,
  },
  north: {
    name: 'North',
    planningAreas: 'Woodlands, Yishun, Sembawang, Mandai',
    stationLabel: 'Woodlands Regional Hub',
    lat: 1.4382,
    lng: 103.789,
  },
  central: {
    name: 'Central',
    planningAreas: 'Toa Payoh, Bishan, Orchard, Novena',
    stationLabel: 'Bishan & Toa Payoh Central',
    lat: 1.3521,
    lng: 103.8498,
  },
  east: {
    name: 'East',
    planningAreas: 'Tampines, Pasir Ris, Bedok, Changi',
    stationLabel: 'Tampines & Changi Coast',
    lat: 1.3526,
    lng: 103.9447,
  },
  south: {
    name: 'South',
    planningAreas: 'Marina Bay, Bukit Merah, Queenstown, Sentosa',
    stationLabel: 'Marina South & HarbourFront',
    lat: 1.2816,
    lng: 103.829,
  },
};

function buildReadings(
  psi24h: number,
  pm25_1h: number,
  scaleFactor: number
): PollutantReadings {
  const pm25_24h = Math.max(8, Math.round(pm25_1h * 0.88));
  const pm25Sub = psi24h;
  const pm10Sub = Math.round(psi24h * 0.68);
  const pm10_24h = Math.round(pm25_24h * 1.48);
  const o3Sub = Math.min(95, Math.round(22 + scaleFactor * 16));
  const o3_8h_max = Math.round(38 + scaleFactor * 26);
  const coSub = Math.min(35, Math.round(7 + scaleFactor * 4));
  const co_8h_max = Number((0.42 + scaleFactor * 0.25).toFixed(2));
  const so2Sub = Math.min(48, Math.round(8 + scaleFactor * 6));
  const so2_24h = Math.round(11 + scaleFactor * 9);
  const no2_1h_max = Math.round(24 + scaleFactor * 14);
  const no2Sub = Math.min(55, Math.round(12 + scaleFactor * 7));

  return {
    psi24h,
    pm25_24h,
    pm25_1h,
    pm10_24h,
    o3_8h_max,
    co_8h_max,
    so2_24h,
    no2_1h_max,
    subIndices: {
      pm25: pm25Sub,
      pm10: pm10Sub,
      o3: o3Sub,
      co: coSub,
      so2: so2Sub,
      no2: no2Sub,
    },
  };
}

function findDominantPollutant(r: PollutantReadings): string {
  const entries: Array<[string, number]> = [
    ['PM2.5', r.subIndices.pm25],
    ['PM10', r.subIndices.pm10],
    ['O₃', r.subIndices.o3],
    ['SO₂', r.subIndices.so2],
    ['NO₂', r.subIndices.no2],
    ['CO', r.subIndices.co],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function generateHourlySeries(
  currentRegionalPsi: Record<RegionOrNational, number>,
  currentRegionalPm25: Record<RegionOrNational, number>,
  amplitude: number,
  driftSlope: number
): HourlyPoint[] {
  const now = new Date();
  const points: HourlyPoint[] = [];

  for (let i = 23; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 3600 * 1000);
    const hour = dt.getHours();
    const hourLabel = `${String(hour).padStart(2, '0')}:00`;
    const progress = (23 - i) / 23;
    const diurnal = Math.sin((progress * Math.PI * 2) - 0.8) * amplitude;
    const regions = {} as Record<RegionOrNational, { psi24h: number; pm25_1h: number }>;

    (Object.keys(currentRegionalPsi) as RegionOrNational[]).forEach((key, idx) => {
      if (i === 0) {
        regions[key] = {
          psi24h: currentRegionalPsi[key],
          pm25_1h: currentRegionalPm25[key],
        };
      } else {
        const phaseOffset = Math.cos(progress * 5 + idx * 0.9) * (amplitude * 0.35);
        const historicShift = (1 - progress) * driftSlope;
        const psiVal = Math.max(
          18,
          Math.round(currentRegionalPsi[key] - historicShift + diurnal + phaseOffset)
        );
        const pmVal = Math.max(
          6,
          Math.round(
            currentRegionalPm25[key] -
              historicShift * 0.85 +
              diurnal * 1.15 +
              phaseOffset * 1.2
          )
        );
        regions[key] = { psi24h: psiVal, pm25_1h: pmVal };
      }
    });

    points.push({
      hourLabel,
      timestampIso: dt.toISOString(),
      regions,
    });
  }

  return points;
}

interface ScenarioSeed {
  psi: Record<RegionId, number>;
  pm25_1h: Record<RegionId, number>;
  delta3h: Record<RegionId, number>;
  wind: Record<RegionId, WindVector>;
  scaleFactor: number;
  amplitude: number;
  driftSlope: number;
}

const SCENARIO_SEEDS: Record<ScenarioId, ScenarioSeed> = {
  baseline: {
    psi: { west: 46, north: 42, central: 44, east: 41, south: 45 },
    pm25_1h: { west: 15, north: 12, central: 14, east: 11, south: 14 },
    delta3h: { west: -2, north: -1, central: 0, east: -3, south: -1 },
    wind: {
      west: { directionLabel: 'ESE', bearingDeg: 112, speedKmh: 11 },
      north: { directionLabel: 'ESE', bearingDeg: 118, speedKmh: 10 },
      central: { directionLabel: 'E', bearingDeg: 98, speedKmh: 12 },
      east: { directionLabel: 'E', bearingDeg: 92, speedKmh: 15 },
      south: { directionLabel: 'ESE', bearingDeg: 110, speedKmh: 14 },
    },
    scaleFactor: 0.4,
    amplitude: 3,
    driftSlope: -2,
  },
  moderate: {
    psi: { west: 89, north: 74, central: 79, east: 71, south: 81 },
    pm25_1h: { west: 42, north: 31, central: 36, east: 28, south: 38 },
    delta3h: { west: 8, north: 5, central: 6, east: 3, south: 7 },
    wind: {
      west: { directionLabel: 'SSW', bearingDeg: 204, speedKmh: 14 },
      north: { directionLabel: 'SW', bearingDeg: 218, speedKmh: 12 },
      central: { directionLabel: 'SSW', bearingDeg: 200, speedKmh: 13 },
      east: { directionLabel: 'S', bearingDeg: 186, speedKmh: 11 },
      south: { directionLabel: 'SSW', bearingDeg: 202, speedKmh: 16 },
    },
    scaleFactor: 1.0,
    amplitude: 6,
    driftSlope: 16,
  },
  unhealthy: {
    psi: { west: 164, north: 136, central: 143, east: 129, south: 151 },
    pm25_1h: { west: 118, north: 84, central: 96, east: 78, south: 104 },
    delta3h: { west: 19, north: 12, central: 15, east: 9, south: 17 },
    wind: {
      west: { directionLabel: 'SSW', bearingDeg: 208, speedKmh: 19 },
      north: { directionLabel: 'SW', bearingDeg: 220, speedKmh: 16 },
      central: { directionLabel: 'SSW', bearingDeg: 205, speedKmh: 18 },
      east: { directionLabel: 'SSW', bearingDeg: 198, speedKmh: 15 },
      south: { directionLabel: 'SSW', bearingDeg: 206, speedKmh: 21 },
    },
    scaleFactor: 1.75,
    amplitude: 11,
    driftSlope: 38,
  },
  severe: {
    psi: { west: 254, north: 218, central: 226, east: 212, south: 238 },
    pm25_1h: { west: 214, north: 172, central: 186, east: 164, south: 198 },
    delta3h: { west: 28, north: 21, central: 24, east: 18, south: 26 },
    wind: {
      west: { directionLabel: 'SW', bearingDeg: 215, speedKmh: 22 },
      north: { directionLabel: 'SW', bearingDeg: 224, speedKmh: 19 },
      central: { directionLabel: 'SSW', bearingDeg: 210, speedKmh: 21 },
      east: { directionLabel: 'SSW', bearingDeg: 202, speedKmh: 18 },
      south: { directionLabel: 'SW', bearingDeg: 214, speedKmh: 24 },
    },
    scaleFactor: 2.6,
    amplitude: 16,
    driftSlope: 64,
  },
};

export function formatSgtTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    const formatted = new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return `${formatted} SGT`;
  } catch {
    return iso;
  }
}

export function getSnapshotForScenario(scenarioId: ScenarioId): PsiSnapshot {
  const seed = SCENARIO_SEEDS[scenarioId];
  const nowIso = new Date().toISOString();

  const regions = {} as Record<RegionId, RegionTelemetry>;
  const regionIds: RegionId[] = ['west', 'north', 'central', 'east', 'south'];

  regionIds.forEach((id) => {
    const meta = REGION_DIRECTORY[id];
    const reading = buildReadings(
      seed.psi[id],
      seed.pm25_1h[id],
      seed.scaleFactor
    );
    regions[id] = {
      id,
      name: meta.name,
      planningAreas: meta.planningAreas,
      stationLabel: meta.stationLabel,
      lat: meta.lat,
      lng: meta.lng,
      reading,
      wind: seed.wind[id],
      delta3h: seed.delta3h[id],
      dominantPollutant: findDominantPollutant(reading),
    };
  });

  const nationalPsi = Math.max(...regionIds.map((id) => seed.psi[id]));
  const avgPsi = Math.round(
    regionIds.reduce((sum, id) => sum + seed.psi[id], 0) / regionIds.length
  );
  const nationalPm25 = Math.round(
    regionIds.reduce((sum, id) => sum + seed.pm25_1h[id], 0) / regionIds.length
  );
  const nationalReading = buildReadings(avgPsi, nationalPm25, seed.scaleFactor);
  // Show range or peak-aligned national reading; NEA reports national as a range or aggregate
  nationalReading.psi24h = avgPsi;
  const nationalDelta = Math.round(
    regionIds.reduce((sum, id) => sum + seed.delta3h[id], 0) / regionIds.length
  );

  const hourly24h = generateHourlySeries(
    {
      ...seed.psi,
      national: avgPsi,
    },
    {
      ...seed.pm25_1h,
      national: nationalPm25,
    },
    seed.amplitude,
    seed.driftSlope
  );

  return {
    timestampIso: nowIso,
    updatedLabel: formatSgtTimestamp(nowIso),
    sourceLabel: `Local Preview · ${
      SCENARIOS.find((s) => s.id === scenarioId)?.label ?? 'Baseline'
    } (Peak ${nationalPsi})`,
    isLiveApi: false,
    scenarioId,
    national: {
      ...nationalReading,
      delta3h: nationalDelta,
      dominantPollutant: findDominantPollutant(nationalReading),
      wind: seed.wind.central,
    },
    regions,
    hourly24h,
  };
}

/**
 * Adapter function ready for connecting to Singapore's NEA / Data.gov.sg PSI API:
 * e.g. GET https://api.data.gov.sg/v1/environment/psi
 */
export function parseNeaApiPayload(payload: NeaApiPayload): PsiSnapshot {
  if (!payload?.items?.length) {
    throw new Error('Invalid NEA payload: missing items array.');
  }

  const latest = payload.items[0];
  const r = latest.readings;
  if (!r?.psi_twenty_four_hourly) {
    throw new Error('Invalid NEA payload: missing psi_twenty_four_hourly.');
  }

  const regionIds: RegionId[] = ['west', 'north', 'central', 'east', 'south'];
  const regions = {} as Record<RegionId, RegionTelemetry>;

  const psiMap = {} as Record<RegionOrNational, number>;
  const pm25Map = {} as Record<RegionOrNational, number>;

  regionIds.forEach((id) => {
    const meta = REGION_DIRECTORY[id];
    const psiVal = Number(r.psi_twenty_four_hourly[id] ?? 0);
    const pm25_24h = Number(r.pm25_twenty_four_hourly?.[id] ?? Math.round(psiVal * 0.45));
    const pm25_1h = Math.round(pm25_24h * 1.12);
    const reading: PollutantReadings = {
      psi24h: psiVal,
      pm25_24h,
      pm25_1h,
      pm10_24h: Number(r.pm10_twenty_four_hourly?.[id] ?? Math.round(pm25_24h * 1.45)),
      o3_8h_max: Number(r.o3_eight_hour_max?.[id] ?? 42),
      co_8h_max: Number(r.co_eight_hour_max?.[id] ?? 0.5),
      so2_24h: Number(r.so2_twenty_four_hourly?.[id] ?? 12),
      no2_1h_max: Number(r.no2_one_hour_max?.[id] ?? 26),
      subIndices: {
        pm25: Number(r.pm25_sub_index?.[id] ?? psiVal),
        pm10: Number(r.pm10_sub_index?.[id] ?? Math.round(psiVal * 0.7)),
        o3: Number(r.o3_sub_index?.[id] ?? 24),
        co: Number(r.co_sub_index?.[id] ?? 8),
        so2: Number(r.so2_sub_index?.[id] ?? 10),
        no2: Math.round(Number(r.no2_one_hour_max?.[id] ?? 26) * 0.5),
      },
    };

    psiMap[id] = psiVal;
    pm25Map[id] = pm25_1h;

    regions[id] = {
      id,
      name: meta.name,
      planningAreas: meta.planningAreas,
      stationLabel: meta.stationLabel,
      lat: meta.lat,
      lng: meta.lng,
      reading,
      wind: SCENARIO_SEEDS.moderate.wind[id],
      delta3h: 0,
      dominantPollutant: findDominantPollutant(reading),
    };
  });

  const nationalPsi =
    r.psi_twenty_four_hourly.national ??
    Math.round(regionIds.reduce((acc, id) => acc + psiMap[id], 0) / regionIds.length);
  const nationalPm25 = Math.round(
    regionIds.reduce((acc, id) => acc + pm25Map[id], 0) / regionIds.length
  );
  psiMap.national = nationalPsi;
  pm25Map.national = nationalPm25;

  const nationalReading = buildReadings(nationalPsi, nationalPm25, nationalPsi / 80);
  const timestampIso = latest.update_timestamp || latest.timestamp || new Date().toISOString();

  return {
    timestampIso,
    updatedLabel: formatSgtTimestamp(timestampIso),
    sourceLabel: 'Custom JSON Payload · NEA Adapter',
    isLiveApi: true,
    scenarioId: 'moderate',
    national: {
      ...nationalReading,
      delta3h: 0,
      dominantPollutant: findDominantPollutant(nationalReading),
      wind: SCENARIO_SEEDS.moderate.wind.central,
    },
    regions,
    hourly24h: generateHourlySeries(psiMap, pm25Map, 5, 10),
  };
}
