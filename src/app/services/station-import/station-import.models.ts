/**
 * Shapes for the Station Master Import page (Data Management → Master File).
 *
 * These are the contract the backend will implement: `PreviewResponse` from
 * POST /station-import/preview, `ApplyResult` from POST /station-import/apply,
 * `NetworkOverview` from GET /station-import/overview. Station codes travel as
 * strings because they are 13 digits — fine as a JS number today, but a string
 * can't be silently rounded anywhere along the way.
 */

/** The two tables a station can live in. sARG/sAWS rows go to aws_station_details. */
export type StationTable = 'station_details' | 'aws_station_details';

export type Severity = 'error' | 'warning';

export type ChangeField = 'station_name' | 'latitude' | 'longitude' | 'block_name' | 'centre' | 'station_type';

/** A station as it will be (or already is) stored. */
export interface StationRow {
  /** Excel row number (header is row 1); null for rows that only exist in the database. */
  rowNumber: number | null;
  stationCode: string;
  stationName: string;
  /** As stored: ARG/AWS for sARG/sAWS rows. */
  stationType: string;
  /** As written in the file: sARG stays sARG. */
  stationTypeOld: string;
  table: StationTable;
  districtCode: string;
  districtName: string;
  blockCode: string;
  blockName: string;
  /** "MC LUCKNOW" — centre_type and centre_name joined, as the rest of the app shows it. */
  centre: string;
  latitude: number | null;
  longitude: number | null;
  flag: number;
  /** aws_mapping_id.id for sARG/sAWS rows (the file's `abbrevited` column). */
  awsId: string | null;
  /** aws_mapping_id.source_table, derived from the state. */
  awsSource: string | null;
  warnings: string[];
  /** Invented row in the sample data; never set by the real API. */
  example?: boolean;
}

/** One field that differs between the file and the database for an existing station. */
export interface FieldChange {
  rowNumber: number;
  stationCode: string;
  stationName: string;
  table: StationTable;
  centre: string;
  latitude: number | null;
  longitude: number | null;
  field: ChangeField;
  dbValue: string;
  fileValue: string;
}

/** An existing station whose active flag differs between the file and the database. */
export interface FlagChange {
  rowNumber: number;
  stationCode: string;
  stationName: string;
  table: StationTable;
  districtName: string;
  centre: string;
  latitude: number | null;
  longitude: number | null;
  dbFlag: number;
  fileFlag: number;
  /** Set when turning this on would clash with something, e.g. a re-coded station. */
  note: string | null;
}

/** A rule a file row broke. Errors stop the row; warnings are informational. */
export interface RowIssue {
  rowNumber: number;
  stationCode: string;
  stationName: string;
  centre: string;
  severity: Severity;
  rule: string;
  message: string;
}

export interface PreviewResponse {
  isSample: boolean;
  generatedAt: string;
  file: { rowCount: number; districtCount: number };
  db: { stationDetails: number; awsStationDetails: number; districts: number };
  /** Last date that already has -999.9 rows; new stations are seeded up to here. */
  seedHorizon: string;
  newStations: StationRow[];
  fieldChanges: FieldChange[];
  flagChanges: FlagChange[];
  /** In the database but not in the file. Report only — never switched off by an import. */
  missingFromFile: StationRow[];
  issues: RowIssue[];
  unchangedCount: number;
}

export interface ApplyRequest {
  activationDate: string;
  newStationCodes: string[];
  fieldChanges: { stationCode: string; field: ChangeField }[];
  flagChangeCodes: string[];
}

export interface ApplyResult {
  isSample: boolean;
  appliedAt: string;
  inserted: { stationDetails: number; awsStationDetails: number; awsMappingId: number; dailyRows: number };
  updatedFields: number;
  flagsChanged: number;
  stationLogs: number;
  skipped: RowIssue[];
}

export interface NetworkOverview {
  isSample: boolean;
  asOf: string;
  totals: { stations: number; active: number; inactive: number; districts: number; blocks: number; centres: number };
  byType: { type: string; table: StationTable; active: number; inactive: number }[];
  byCentre: { centre: string; imdActive: number; stateActive: number; inactive: number }[];
  byRegion: { region: string; imdActive: number; stateActive: number }[];
  normals: { year: number; districtsWithNormals: number; districts: number; activeBlocksWithNormals: number; activeBlocks: number };
  dailyRows: { oldestKept: string; horizon: string; rowsPerDay: number };
}

/**
 * Days of -999.9 rows a new station gets: activation date through the horizon,
 * both inclusive. A start after the horizon still gets its own day.
 */
export function seedDayCount(start: string, horizon: string): number {
  const toUtc = (d: string): number => {
    const [y, m, day] = d.split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  if (!start || !horizon) return 0;
  const days = Math.round((toUtc(horizon) - toUtc(start)) / 86_400_000) + 1;
  return Math.max(1, days);
}
