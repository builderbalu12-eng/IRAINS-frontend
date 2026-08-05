/**
 * Single source of truth for rainfall classification.
 *
 * Previously the same thresholds were spelled out three separate times — in the
 * marker-icon picker, in the sidebar filter, and in the legend labels — and they
 * disagreed at the boundaries (icons used `> 0`, the filter used `>= 0.1`). A
 * station reporting 0.05mm therefore got a Very Light marker but was dropped by
 * the filter. Everything now derives from this table.
 *
 * Bands are lower-exclusive / upper-inclusive, except ZERO which is an exact
 * match. That leaves no gap between 0 and 0.1: any positive trace value lands in
 * VERY_LIGHT. Labels still read "0.1" because observations are recorded to one
 * decimal place and that is the convention users expect.
 */

/** Sentinel the API uses for "station reported nothing". */
export const NO_DATA = -999.9;

export interface RainfallBand {
  /** Stable key, also used as the ngModel/tracking identity. */
  key: string;
  /** Sidebar label. */
  label: string;
  /** Inclusive-of-upper range text shown next to the label. */
  range: string;
  /** Fill for both the legend swatch and the map marker — one value, one truth. */
  color: string;
  /** Lower bound, exclusive (ignored when `exact` is set). */
  min: number;
  /** Upper bound, inclusive (ignored when `exact` is set). */
  max: number;
  /** When set, the band matches this value exactly. */
  exact?: number;
}

export const RAINFALL_BANDS: readonly RainfallBand[] = [
  {
    key: 'zero',
    label: 'Zero Rainfall',
    range: '0 mm',
    // White, not grey: zero is the most common reading on a dry day and a dark
    // fill let it swamp the map. The dark hairline keeps it legible.
    color: '#ffffff',
    min: 0,
    max: 0,
    exact: 0,
  },
  {
    key: 'veryLight',
    label: 'Very Light',
    range: '0.1 – 2.4 mm',
    color: '#AAF200',
    min: 0,
    max: 2.4,
  },
  {
    key: 'light',
    label: 'Light',
    range: '2.5 – 15.5 mm',
    color: '#00FF00',
    min: 2.4,
    max: 15.5,
  },
  {
    key: 'moderate',
    label: 'Moderate',
    range: '15.6 – 64.4 mm',
    color: '#00FFFF',
    min: 15.5,
    max: 64.4,
  },
  {
    key: 'heavy',
    label: 'Heavy',
    range: '64.5 – 115.5 mm',
    color: '#FFFF00',
    min: 64.4,
    max: 115.5,
  },
  {
    key: 'veryHeavy',
    label: 'Very Heavy',
    range: '115.6 – 204.4 mm',
    color: '#FF8C00',
    min: 115.5,
    max: 204.4,
  },
  {
    key: 'extremelyHeavy',
    label: 'Extremely Heavy',
    range: '> 204.4 mm',
    color: '#FF0000',
    min: 204.4,
    max: Number.POSITIVE_INFINITY,
  },
];

/**
 * Returns the band a reading falls into, or `null` for missing/invalid values.
 * Missing readings are deliberately not forced into a band — previously they
 * fell through to the Extremely Heavy default and would have rendered as red
 * markers if the caller's guard were ever removed.
 */
export function bandFor(value: unknown): RainfallBand | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n === NO_DATA || n < 0) {
    return null;
  }
  return (
    RAINFALL_BANDS.find((b) =>
      b.exact !== undefined ? n === b.exact : n > b.min && n <= b.max
    ) ?? null
  );
}

/** True when a reading is the "no observation" sentinel or otherwise unusable. */
export function isMissing(value: unknown): boolean {
  const n = typeof value === 'number' ? value : Number(value);
  return !Number.isFinite(n) || n === NO_DATA || n < 0;
}
