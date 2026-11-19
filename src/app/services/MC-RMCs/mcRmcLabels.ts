import { take } from 'rxjs';
import { DataService } from 'src/app/data.service';

/**
 * Names and dates shared by the MC/RMC pages (/all-maps for MC logins and the
 * "RAINFALL MAP MC and RMC" menu: state, subdivision and region maps).
 */

/** "RMC Chennai" -> "RMC CHENNAI". */
export const centreLabel = (name: any): string => String(name ?? '').trim().toUpperCase();

/** File-name tag from any parts: ("RMC Chennai", "Tamil Nadu") -> "RMC_CHENNAI_TAMIL_NADU". */
export const fileTag = (...parts: any[]): string =>
  parts
    .map((p) => String(p ?? '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, ''))
    .filter(Boolean)
    .join('_');

/** "2026-11-19" -> "19-11-2026". */
export const toIndianDate = (iso: string): string => (iso ? iso.split('-').reverse().join('-') : '');

/**
 * The range currently selected on /all-maps (the app-wide from/to date), or
 * null when nothing has been picked yet. Read once: these pages keep their own
 * date after that, changed with their own Submit button.
 */
export function selectedAllMapsRange(dataService: DataService): { fromDate: string; toDate: string } | null {
  let range: { fromDate: string; toDate: string } | null = null;
  dataService.fromAndToDate$.pipe(take(1)).subscribe((value) => {
    if (!value) return;
    try {
      const parsed = JSON.parse(value);
      if (parsed?.fromDate && parsed?.toDate) range = { fromDate: parsed.fromDate, toDate: parsed.toDate };
    } catch {
      // not a range; fall back to the current date
    }
  });
  return range;
}
