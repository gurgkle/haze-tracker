export type RegionId = 'west' | 'north' | 'central' | 'east' | 'south';

export type RegionOrNational = RegionId | 'national';

export type PsiBand =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous';

export type Pm25Band = 'Normal' | 'Elevated' | 'High' | 'Very High';

export type ScenarioId = 'baseline' | 'moderate' | 'unhealthy' | 'severe';

export interface PollutantSubIndices {
  pm25: number;
  pm10: number;
  o3: number;
  co: number;
  so2: number;
  no2: number;
}

export interface PollutantReadings {
  psi24h: number;
  pm25_24h: number;
  pm25_1h: number;
  pm10_24h: number;
  o3_8h_max: number;
  co_8h_max: number;
  so2_24h: number;
  no2_1h_max: number;
  subIndices: PollutantSubIndices;
}

export interface WindVector {
  directionLabel: string;
  bearingDeg: number;
  speedKmh: number;
}

export interface RegionTelemetry {
  id: RegionId;
  name: string;
  planningAreas: string;
  stationLabel: string;
  lat: number;
  lng: number;
  reading: PollutantReadings;
  wind: WindVector;
  delta3h: number;
  dominantPollutant: string;
}

export interface HourlyRegionValue {
  psi24h: number;
  pm25_1h: number;
}

export interface HourlyPoint {
  hourLabel: string;
  timestampIso: string;
  regions: Record<RegionOrNational, HourlyRegionValue>;
}

export interface PsiSnapshot {
  timestampIso: string;
  updatedLabel: string;
  sourceLabel: string;
  isLiveApi: boolean;
  scenarioId: ScenarioId;
  national: PollutantReadings & {
    delta3h: number;
    dominantPollutant: string;
    wind: WindVector;
  };
  regions: Record<RegionId, RegionTelemetry>;
  hourly24h: HourlyPoint[];
}

export interface NeaRegionRecord {
  west: number;
  east: number;
  central: number;
  south: number;
  north: number;
  national?: number;
}

export interface NeaReadingItem {
  timestamp: string;
  update_timestamp?: string;
  updateTimestamp?: string;
  updatedTimestamp?: string;
  readings: {
    psi_twenty_four_hourly: NeaRegionRecord;
    psi_three_hourly?: NeaRegionRecord;
    pm25_twenty_four_hourly?: NeaRegionRecord;
    pm25_sub_index?: NeaRegionRecord;
    pm10_twenty_four_hourly?: NeaRegionRecord;
    pm10_sub_index?: NeaRegionRecord;
    o3_eight_hour_max?: NeaRegionRecord;
    o3_sub_index?: NeaRegionRecord;
    co_eight_hour_max?: NeaRegionRecord;
    co_sub_index?: NeaRegionRecord;
    so2_twenty_four_hourly?: NeaRegionRecord;
    so2_sub_index?: NeaRegionRecord;
    no2_one_hour_max?: NeaRegionRecord;
    no2_sub_index?: NeaRegionRecord;
  };
}

export interface NeaApiPayload {
  items?: NeaReadingItem[];
  code?: number;
  errorMsg?: string;
  data?: {
    regionMetadata?: Array<{
      name: string;
      labelLocation: { latitude: number; longitude: number };
    }>;
    items: NeaReadingItem[];
  };
}

export interface ApiHealthResponse {
  ok: boolean;
  status: string;
  service: string;
  endpoint: string;
  upstreamStatus: 'not_checked' | 'reachable' | 'degraded';
  latencyMs: number | null;
  timestamp: string;
}

