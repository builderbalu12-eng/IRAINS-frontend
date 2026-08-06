/**
 * The one colour scale for the ARG/AWS real-time page.
 *
 * Every quantity this page paints — accumulated depth, per-slot rainfall, rain
 * rate — is classified on the IMD bands below, copied from
 * station-statistics-page/rainfall-bands.ts so the two pages cannot disagree
 * about a station.
 *
 * Earlier revisions carried two further scales: mm/hr bands for the rain-rate
 * view and per-slot mm bands derived from them. Those thresholds had no source
 * — they were invented here — and they reused IMD's Light / Moderate / Heavy
 * wording for cuts that had nothing to do with IMD's definitions, so the same
 * word meant two different things on one screen. They are gone. One scale, one
 * meaning: the same colour is the same number of millimetres wherever it
 * appears.
 *
 * The cost is that sub-daily views sit low on a scale built for 24-hour totals,
 * since a 15-minute slot rarely clears 2.4 mm. That is a true statement about
 * the data, and preferable to a scale nobody can cite.
 */

export interface Band {
  key: string;
  label: string;
  range: string;
  color: string;
  /** Lower bound, exclusive. */
  min: number;
  /** Upper bound, inclusive. */
  max: number;
  /** When set, matches this value exactly (used for the zero band). */
  exact?: number;
}

/**
 * Accumulated depth over the AWS day — the standard IMD classification, same
 * thresholds and same fills as the Station Statistics legend.
 */
export const DEPTH_BANDS: readonly Band[] = [
  { key: 'zero',           label: 'Zero Rainfall',   range: '0 mm',             color: '#ffffff', min: 0,     max: 0, exact: 0 },
  { key: 'veryLight',      label: 'Very Light',      range: '0.1 – 2.4 mm',     color: '#AAF200', min: 0,     max: 2.4 },
  { key: 'light',          label: 'Light',           range: '2.5 – 15.5 mm',    color: '#00FF00', min: 2.4,   max: 15.5 },
  { key: 'moderate',       label: 'Moderate',        range: '15.6 – 64.4 mm',   color: '#00FFFF', min: 15.5,  max: 64.4 },
  { key: 'heavy',          label: 'Heavy',           range: '64.5 – 115.5 mm',  color: '#FFFF00', min: 64.4,  max: 115.5 },
  { key: 'veryHeavy',      label: 'Very Heavy',      range: '115.6 – 204.4 mm', color: '#FF8C00', min: 115.5, max: 204.4 },
  { key: 'extremelyHeavy', label: 'Extremely Heavy', range: '> 204.4 mm',       color: '#FF0000', min: 204.4, max: Number.POSITIVE_INFINITY },
];

/** Fill for a station that has not reported by the scrubbed slot. */
export const NO_REPORT_COLOR = '#c3cbd6';

/**
 * Index of the band `value` falls into, or -1 when the reading is unusable.
 * Returning an index rather than the band itself lets the map skip a
 * `setStyle` call when a marker's band has not changed between slots.
 */
export function bandIndex(bands: readonly Band[], value: number): number {
  if (!Number.isFinite(value) || value < 0) return -1;
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    if (b.exact !== undefined ? value === b.exact : value > b.min && value <= b.max) return i;
  }
  return -1;
}
