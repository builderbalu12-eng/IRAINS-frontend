import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environment/environment';

/**
 * ARG / AWS cumulative + real-time analytics API.
 *
 * Backed by controllers/scripts/aws/awsRealtimeAnalytics.js. Every method
 * unwraps the `{ success, message, data }` envelope the backend uses so
 * callers only ever see the payload.
 *
 * Two daily networks are in play throughout, tagged by `network`:
 *   'state' — aws_station_details / aws_station_daily_data, the only one with
 *             15-minute observations behind it.
 *   'imd'   — station_details / station_daily_data, ARG and AWS types only,
 *             one total per station per day and nothing sub-daily.
 * station_code is unique only WITHIN a network, so anything keyed by station
 * must key on `network + station_code`.
 */

/** Which daily network a station belongs to. */
export type AwsNetworkKey = 'state' | 'imd';

export interface AwsNetworkInfo {
  key: AwsNetworkKey;
  label: string;
  short: string;
  details_table: string;
  daily_table: string;
  /** True only for 'state': it alone can be replayed in 15-minute slots. */
  sub_daily: boolean;
  /** Station types the network is restricted to, or null for no restriction. */
  station_types: string[] | null;
  stations: number;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AwsSourceInfo {
  key: string;
  label: string;
  short: string;
  table: string;
  has_coordinates: boolean;
  live_states: string[];
  live_districts: string[];
}

export interface AwsFilters {
  aws_today: string;
  states: Array<{ state_code: string; state_name: string; region_name: string }>;
  districts_by_state: Record<string, Array<{ district_code: string; district_name: string }>>;
  station_types: Array<{
    station_type: string;
    stations: number;
    /** The same count split by network, e.g. { state: 2394, imd: 655 }. */
    by_network: Partial<Record<AwsNetworkKey, number>>;
  }>;
  networks: AwsNetworkInfo[];
  sources: AwsSourceInfo[];
}

/** One real-time table's feed health and its bridge into the cumulative store. */
export interface AwsSourceHealth {
  key: string;
  label: string;
  short: string;
  table: string;
  rain_column: string;
  has_coordinates: boolean;
  has_state: boolean;
  has_block: boolean;
  rows_window: number;
  stations_window: number;
  rows_today: number;
  stations_today: number;
  slots_today: number;
  slot_completeness_pct: number;
  raining_today: number;
  max_rain_today: number | null;
  last_obs_ist: string | null;
  lag_minutes: number | null;
  registered_in_mapping: number;
  mapped_station_codes: number;
  dangling_mappings: number;
  stations_mapped: number;
  stations_unmapped: number;
  mapping_coverage_pct: number | null;
  feeds_cumulative_store: boolean;
}

export interface AwsSourceHealthResponse {
  date: string;
  window: { from: string; to: string; days: number };
  generated_at_ist: string;
  sources: AwsSourceHealth[];
  totals: {
    stations_window: number;
    stations_today: number;
    stations_mapped: number;
    stations_unmapped: number;
    raining_today: number;
    rows_today: number;
    sources_total: number;
    sources_mapped: number;
    sources_unmapped: number;
    mapping_coverage_pct: number | null;
  };
  cumulative_store: {
    rows_stored: number;
    rows_with_data: number;
    rows_no_data: number;
    rows_raining: number;
    stations_registered: number;
    store_completeness_pct: number | null;
  };
}

export interface AwsUnmappedStation {
  source_key: string;
  source_label: string;
  station_id: string;
  station_name: string;
  state_name: string | null;
  district_name: string | null;
  block_name: string | null;
  latitude: number | null;
  longitude: number | null;
  observations: number;
  days_seen: number;
  peak_rainfall: number | null;
  last_obs_ist: string | null;
}

export interface AwsSlot {
  index: number;
  /** IST clock only, "HH:mm". */
  label: string;
  /** Absolute start of the slot, "YYYY-MM-DD HH:mm", in each zone. */
  ist: string;
  utc: string;
  /**
   * True from 00:00 IST onward — those slots carry the day's own label date.
   * A rainfall day is named for the date it ENDS on, so the earlier slots
   * (08:30 → 23:45) fall on the previous calendar day.
   */
  onLabelDate: boolean;
}

export interface AwsTimelineStation {
  source_key: string;
  source_label: string;
  station_id: string;
  station_name: string;
  state_name: string | null;
  district_name: string | null;
  block_name: string | null;
  station_type: string | null;
  latitude: number | null;
  longitude: number | null;
  coord_source: 'source' | 'mapped' | null;
  station_code: string | null;
  mapped: boolean;
  day_total: number | null;
  slots_reported: number;
  slot_completeness_pct: number;
  max_temp: number | null;
  min_temp: number | null;
  avg_rh: number | null;
  max_wind: number | null;
  /** Cumulative rainfall at each of the 96 slots; null where nothing arrived. */
  cum: Array<number | null>;
}

export interface AwsTimeline {
  date: string;
  day_start_ist: string;
  slot_minutes: number;
  slots: AwsSlot[];
  stations: AwsTimelineStation[];
  per_slot: Array<{
    index: number;
    reporting: number;
    raining: number;
    sum_cum: number;
    max_cum: number;
    avg_cum: number;
  }>;
  meta: {
    sources: string[];
    stations_total: number;
    stations_plotted: number;
    stations_without_coordinates: number;
    stations_mapped: number;
    stations_unmapped: number;
    count_by_source: Record<string, number>;
  };
}

export interface AwsCumulativeStation {
  network: AwsNetworkKey;
  network_short: string;
  network_label: string;
  /** False for IMD — no 15-minute curve exists, so none is offered. */
  sub_daily: boolean;
  station_code: string;
  station_name: string;
  latitude: number | null;
  longitude: number | null;
  district_name: string | null;
  district_code: string | null;
  state_name: string | null;
  state_code: string | null;
  region_name: string | null;
  block_name: string | null;
  station_type: string | null;
  centre_name: string | null;
  days_total: number;
  days_reported: number;
  days_missing: number;
  reporting_pct: number;
  rain_days: number;
  dry_days: number;
  total_rainfall: number | null;
  mean_daily: number | null;
  mean_rain_day: number | null;
  sd_daily: number | null;
  cv_pct: number | null;
  max_daily: number | null;
  median_daily: number | null;
  p95_daily: number | null;
  peak_date: string | null;
  longest_wet_spell: number;
  longest_spell_total: number | null;
  spell_start: string | null;
  spell_end: string | null;
  peak_share_pct: number | null;
}

export interface AwsCumulativeDay {
  collection_date: string;
  stations_total: number;
  stations_reporting: number;
  stations_raining: number;
  sum_rainfall: number | null;
  avg_rainfall: number | null;
  avg_rain_station: number | null;
  max_rainfall: number | null;
  median_rainfall: number | null;
  reporting_pct: number;
}

export interface AwsRollup {
  code: string | null;
  name: string;
  stations: number;
  stations_reporting: number;
  sum_rainfall: number | null;
  avg_rainfall: number | null;
  max_rainfall: number | null;
  median_rainfall: number | null;
  avg_rain_days: number | null;
}

/** One selected network's slice of the window, for the comparison strip. */
export interface AwsNetworkSummary {
  key: AwsNetworkKey;
  label: string;
  short: string;
  daily_table: string;
  details_table: string;
  sub_daily: boolean;
  stations_total: number;
  stations_reporting: number;
  stations_silent: number;
  reporting_pct: number;
  total_rainfall: number;
  mean_station_total: number | null;
  mean_rain_days: number | null;
  max_daily: number | null;
  wettest_station: AwsCumulativeStation | null;
}

export interface AwsCumulative {
  range: { startDate: string; endDate: string; days: number };
  summary: {
    stations_total: number;
    stations_reporting: number;
    stations_silent: number;
    network_reporting_pct: number;
    total_rainfall: number;
    mean_station_total: number;
    wettest_station: AwsCumulativeStation | null;
    wettest_day: AwsCumulativeDay | null;
    peak_station_day: AwsCumulativeStation | null;
  };
  networks: AwsNetworkSummary[];
  stations: AwsCumulativeStation[];
  daily: AwsCumulativeDay[];
  states: AwsRollup[];
  districts: AwsRollup[];
  centres: AwsRollup[];
}

export interface AwsStationSeries {
  station: {
    network: AwsNetworkKey;
    network_label: string;
    network_short: string;
    /** False for IMD; `live` is then always null. */
    sub_daily: boolean;
    daily_table: string;
    station_code: string;
    station_name: string;
    station_type: string | null;
    centre_name: string | null;
    latitude: number | null;
    longitude: number | null;
    block_name: string | null;
    district_name: string | null;
    state_name: string | null;
    region_name: string | null;
    subdiv_name: string | null;
    activation_date: string | null;
    live_sources: Array<{ source_id: string; source_table: string; source_label: string }>;
  };
  range: { startDate: string; endDate: string };
  series: Array<{ collection_date: string; value: number | null; missing: boolean; cumulative: number }>;
  stats: {
    days_total: number;
    days_reported: number;
    days_missing: number;
    rain_days: number;
    total: number;
    mean: number | null;
    sd: number | null;
    max: number | null;
    median: number | null;
    p90: number | null;
    p95: number | null;
  };
  live: {
    date: string;
    source_key: string;
    source_label: string;
    source_id: string;
    slots: AwsSlot[];
    cum: Array<number | null>;
  } | null;
}

/**
 * One station's stored total for a single AWS day.
 *
 * This is how a daily-only network reaches the Live map: it cannot join the
 * 15-minute scrubber, but its 24-hour figure for the same day can be drawn
 * alongside it. Stations that filed nothing come back with `day_total: null`
 * rather than being dropped, so the map can show them as silent.
 */
export interface AwsDailyStation {
  network: AwsNetworkKey;
  network_short: string;
  network_label: string;
  station_code: string;
  station_name: string;
  station_type: string | null;
  centre_name: string | null;
  block_name: string | null;
  latitude: number | null;
  longitude: number | null;
  district_code: string | null;
  district_name: string | null;
  state_name: string | null;
  state_code: string | null;
  day_total: number | null;
  reported: boolean;
}

export interface AwsDailyStations {
  date: string;
  networks: AwsNetworkKey[];
  stations: AwsDailyStation[];
  meta: {
    /** Keyed only by the networks the request asked for — hence Partial. */
    by_network: Partial<Record<AwsNetworkKey, {
      label: string;
      short: string;
      sub_daily: boolean;
      stations_total: number;
      stations_reporting: number;
      stations_raining: number;
      stations_plotted: number;
      max_total: number | null;
    }>>;
    stations_total: number;
    stations_reporting: number;
    stations_plotted: number;
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AwsRealtimeService {
  private readonly base = `${environment.baseUrl}/api/v1/aws-realtime`;

  constructor(private http: HttpClient) {}

  fetchFilters(date?: string): Observable<AwsFilters> {
    return this.post<AwsFilters>('/filters', { date });
  }

  fetchSourceHealth(date?: string, lookbackDays = 7): Observable<AwsSourceHealthResponse> {
    return this.post<AwsSourceHealthResponse>('/sources', { date, lookbackDays });
  }

  fetchUnmapped(body: { date?: string; lookbackDays?: number; sources?: string[]; limit?: number }):
    Observable<{ window: any; truncated: boolean; count_by_source: Record<string, number>; stations: AwsUnmappedStation[] }> {
    return this.post('/unmapped-stations', body);
  }

  fetchTimeline(body: {
    date?: string;
    sources?: string[];
    state?: string | null;
    district?: string | null;
    requireCoords?: boolean;
  }): Observable<AwsTimeline> {
    return this.post<AwsTimeline>('/timeline', body);
  }

  fetchCumulative(body: {
    startDate: string;
    endDate: string;
    stateCodes?: number[];
    districtCodes?: number[];
    stationType?: string | null;
    /** Omitted or empty means every network. */
    networks?: AwsNetworkKey[];
  }): Observable<AwsCumulative> {
    return this.post<AwsCumulative>('/cumulative', body);
  }

  /** `network` narrows the lookup; without it both are tried in registry order. */
  fetchStationSeries(body: {
    stationCode: string | number;
    startDate: string;
    endDate: string;
    network?: AwsNetworkKey | null;
  }): Observable<AwsStationSeries> {
    return this.post<AwsStationSeries>('/station-series', body);
  }

  fetchDailyStations(body: { date?: string; networks?: AwsNetworkKey[] }):
    Observable<AwsDailyStations> {
    return this.post<AwsDailyStations>('/daily-stations', body);
  }

  private post<T>(path: string, body: any): Observable<T> {
    return this.http
      .post<{ success: boolean; message: string; data: T }>(`${this.base}${path}`, body)
      .pipe(map((r) => r.data));
  }
}
