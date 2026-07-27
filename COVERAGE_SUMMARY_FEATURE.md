# Data Coverage Summary — Feature Handoff / Rebuild Notes

> Status: **All changes discarded.** This document is the full record so the feature can be rebuilt later.
> Branch it was originally built on: `balu_develop` (both repos).

## What the feature is

On the **Review and Publish** page, add a "Data Coverage Summary" section showing, for each of 6 admin levels — **Block, District, State, Subdivision, Region, Country** — three numbers side by side:

1. **GeoJSON Total** — total count of that entity across India, per the reference GeoJSON file (the "universe").
2. **DB Count** — how many of those entities have actual (non-null) rainfall data in the DB for a selected date range (IMD + AWS combined).
3. **Mapped Count** — how many of the DB entities (#2) have a matching GeoJSON feature (code-based intersection between DB entity codes and GeoJSON feature codes).

Confirmed UX decisions:
- DB Count is **dynamic** (tied to a date range, not a static "known to DB" count).
- UI is a **plain compact summary table** (6 rows × [Level, GeoJSON Total, DB Count, Mapped Count]) — not the pie-chart / sidebar style used on the all-maps page.
- The widget has its **own independent date-range picker** (start/end), defaulting to today.

---

## Repos & paths

- Backend: `iru-irains-backend` (Node/Express/Postgres, single `pg.Client` in `connection.js`)
- Frontend: `frontend Dec 1` (Angular, monolithic `app.module.ts`, no standalone components)

---

## Backend implementation

### New file: `controllers/geojsonFeatureCache.js`

Reads GeoJSON metadata from the `geojson_store` table (JSONB blobs, up to ~8MB for blocks). In-memory cache keyed by `folder:file_name`, invalidated by `version`. Cheap version lookup on every call; only extracts feature codes (server-side via `jsonb_array_elements`) on a cache miss.

```js
const client = require('../connection');

// key: `${folder}:${fileName}` -> { version, featureCount, codes: Set<string> }
const cache = new Map();

async function getGeojsonMetaAndCodes(folder, fileName, codeProp) {
    const verRes = await client.query(
        `SELECT version, feature_count
           FROM geojson_store
          WHERE folder = $1 AND file_name = $2 AND is_active = TRUE
          ORDER BY version DESC
          LIMIT 1`,
        [folder, fileName]
    );
    if (!verRes.rows.length) {
        throw new Error(`GeoJSON not found or not seeded: ${folder}/${fileName}`);
    }
    const { version, feature_count: featureCount } = verRes.rows[0];

    if (!codeProp) {
        return { featureCount, codes: new Set() };
    }

    const key = `${folder}:${fileName}`;
    const cached = cache.get(key);
    if (cached && cached.version === version) {
        return { featureCount, codes: cached.codes };
    }

    const extractRes = await client.query(
        `SELECT DISTINCT (feature -> 'properties' ->> $3) AS code
           FROM geojson_store, jsonb_array_elements(geojson -> 'features') AS feature
          WHERE folder = $1 AND file_name = $2 AND version = $4`,
        [folder, fileName, codeProp, version]
    );
    const codes = new Set(
        extractRes.rows
            .map(r => (r.code == null ? null : String(r.code).trim()))
            .filter(c => c)
    );
    cache.set(key, { version, featureCount, codes });
    return { featureCount, codes };
}

async function getGeojsonMeta(folder, fileName) {
    const { featureCount } = await getGeojsonMetaAndCodes(folder, fileName, null);
    return { featureCount };
}

module.exports = { getGeojsonMetaAndCodes, getGeojsonMeta };
```

### New file: `controllers/CoverageSummaryController.js`

Reuses the 6 existing exported functions from `controllers/AwsInclusiveControllers.js` (`fetchBlockWithAWS`, `fetchDistrictWithAWS`, `fetchStateWithAWS`, `fetchSubDivisionWithAWS`, `fetchRegionWithAWS`, `fetchCountryWithAWS`) — no new rainfall SQL. **Field names differ per level** (verified by reading that file); a per-level config drives everything. Per-level `try/catch` so a level missing from `geojson_store` returns `null` instead of failing the whole request.

```js
const moment = require('moment');
const {
    fetchBlockWithAWS,
    fetchDistrictWithAWS,
    fetchStateWithAWS,
    fetchSubDivisionWithAWS,
    fetchRegionWithAWS,
    fetchCountryWithAWS,
} = require('./AwsInclusiveControllers');
const { getGeojsonMetaAndCodes } = require('./geojsonFeatureCache');

const resolveDates = (startDate, endDate) => {
    const today = moment().format('YYYY-MM-DD');
    if (!startDate && !endDate) return { startDate: today, endDate: today };
    if (!startDate) return { startDate: endDate, endDate };
    if (!endDate)   return { startDate, endDate: startDate };
    return { startDate, endDate };
};

const GEOJSON_FOLDER = 'root';

// Field names differ per level in AwsInclusiveControllers.js's returned rows —
// keep that mapping explicit rather than assuming a uniform shape.
const LEVELS = [
    { level: 'block',       label: 'Block',       fetchFn: fetchBlockWithAWS,       codeField: 'block_code',    actualField: 'actual_rainfall',       geojsonFile: 'INDIA_BLOCK.json',        geojsonProp: 'block_code'  },
    { level: 'district',    label: 'District',    fetchFn: fetchDistrictWithAWS,    codeField: 'district_code', actualField: 'actual_rainfall',       geojsonFile: 'INDIA_DISTRICT.json',     geojsonProp: 'district_c'  },
    { level: 'state',       label: 'State',       fetchFn: fetchStateWithAWS,       codeField: 'state_code',    actualField: 'actual_state_rainfall', geojsonFile: 'INDIA_STATE.json',        geojsonProp: 'state_code'  },
    { level: 'subdivision', label: 'Subdivision', fetchFn: fetchSubDivisionWithAWS, codeField: 's_code',        actualField: 'actual_subdiv_rainfall',geojsonFile: 'INDIA_SUB_DIVISION.json', geojsonProp: 'SubDiv_Cod'  },
    { level: 'region',      label: 'Region',       fetchFn: fetchRegionWithAWS,      codeField: 'r_code',        actualField: 'actual_rainfall',       geojsonFile: 'INDIA_REGIONS.json',      geojsonProp: 'region_cod'  },
    { level: 'country',     label: 'Country',      fetchFn: fetchCountryWithAWS,     codeField: null,            actualField: 'actual_rainfall',       geojsonFile: 'INDIA_COUNTRY.json',      geojsonProp: null          },
];

async function computeLevelCoverage(cfg, startDate, endDate) {
    const rows = await cfg.fetchFn(startDate, endDate);

    // GeoJSON availability is independent of DB data — a level missing from
    // geojson_store (not yet seeded) shouldn't take down the other levels.
    let featureCount = null;
    let geojsonCodes = new Set();
    let geojsonError = null;
    try {
        const meta = await getGeojsonMetaAndCodes(GEOJSON_FOLDER, cfg.geojsonFile, cfg.geojsonProp);
        featureCount = meta.featureCount;
        geojsonCodes = meta.codes;
    } catch (err) {
        geojsonError = `GeoJSON not seeded: ${cfg.geojsonFile}`;
    }

    if (cfg.level === 'country') {
        const hasData = rows.length > 0 && rows[0][cfg.actualField] != null;
        return {
            level: cfg.level, label: cfg.label,
            geojsonTotal: featureCount,
            dbCount: hasData ? 1 : 0,
            mappedCount: geojsonError ? null : (hasData ? 1 : 0),
            geojsonError,
        };
    }

    const dbRowsWithData = rows.filter(r => r[cfg.actualField] != null);
    const dbCodes = dbRowsWithData.map(r => String(r[cfg.codeField]).trim());
    const mappedCount = geojsonError
        ? null
        : dbCodes.reduce((n, c) => n + (geojsonCodes.has(c) ? 1 : 0), 0);

    return {
        level: cfg.level, label: cfg.label,
        geojsonTotal: featureCount,
        dbCount: dbRowsWithData.length,
        mappedCount,
        geojsonError,
    };
}

exports.getCoverageSummary = async (req, res) => {
    try {
        let { startDate, endDate } = req.body;
        ({ startDate, endDate } = resolveDates(startDate, endDate));
        if (moment(startDate).isAfter(endDate)) {
            return res.status(400).json({ success: false, message: "startDate must be <= endDate" });
        }
        const data = await Promise.all(LEVELS.map(cfg => computeLevelCoverage(cfg, startDate, endDate)));
        res.status(200).json({
            success: true, message: "Coverage summary fetched successfully",
            startDate, endDate, data,
        });
    } catch (error) {
        console.error("[COVERAGE SUMMARY] getCoverageSummary:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
```

### New file: `routes/coverageSummaryRoutes.js`

```js
const express = require("express");
const router = express.Router();
const { getCoverageSummary } = require("../controllers/CoverageSummaryController");

router.post("/coverage-summary", getCoverageSummary);

module.exports = router;
```

### Edit: `index.js` (2 additive lines)

- Require line, next to the other route requires (after `topRainfallStationsRoutes`):
  ```js
  const coverageSummaryRoutes = require("./routes/coverageSummaryRoutes");
  ```
- Mount line, next to the other `app.use("/api/v1/", ...)` mounts (after `topRainfallStationsRoutes`):
  ```js
  app.use("/api/v1/", coverageSummaryRoutes);
  ```

Endpoint: `POST /api/v1/coverage-summary`, body `{ startDate?, endDate? }` (defaults to today).

---

## Frontend implementation

### New file: `src/app/services/coverageSummary.service.ts`

```ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({ providedIn: 'root' })
export class CoverageSummaryService {
  private baseUrl = environment.baseUrl;
  constructor(private http: HttpClient) {}

  getCoverageSummary(startDate: string, endDate: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/coverage-summary`, { startDate, endDate });
  }
}
```

### Edit: `review-and-publish.component.ts`

- Import + interface:
  ```ts
  import { CoverageSummaryService } from 'src/app/services/coverageSummary.service';

  interface CoverageRow {
    level: string; label: string; geojsonTotal: number; dbCount: number; mappedCount: number;
  }
  ```
- Class fields:
  ```ts
  coverageStartDate: string = this.getTodayStr();
  coverageEndDate: string = this.getTodayStr();
  loadingCoverage: boolean = false;
  coverageMessage: string = '';
  coverageMessageType: 'success' | 'error' = 'success';
  coverageRows: CoverageRow[] = [];
  ```
- Inject `private coverageSummaryService: CoverageSummaryService` in the constructor.
- In `ngOnInit()`, after the existing loads: `this.loadCoverageSummary();`
- Methods:
  ```ts
  private getTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  loadCoverageSummary(): void {
    this.loadingCoverage = true;
    this.coverageMessage = '';
    this.coverageSummaryService.getCoverageSummary(this.coverageStartDate, this.coverageEndDate).subscribe({
      next: (res) => { this.coverageRows = res.data || []; this.loadingCoverage = false; },
      error: () => {
        this.loadingCoverage = false;
        this.coverageMessageType = 'error';
        this.coverageMessage = 'Failed to load data coverage summary. Please try again.';
      }
    });
  }
  ```

### Edit: `review-and-publish.component.html`

Append inside `.rp-left-col`, after the "Public & SP Settings" grid (before the column's closing `</div>`):

```html
<!-- ── Data Coverage Summary ──────────────────────────────── -->
<div class="rp-role-header">
  <h3><i class="bi bi-map me-2"></i>Data Coverage Summary</h3>
  <p class="rp-subtitle">
    GeoJSON universe vs. DB entities with rainfall data vs. GeoJSON-mapped entities, per admin level.
  </p>
</div>

<div class="rp-card">
  <div class="rp-coverage-daterange-row">
    <div class="rp-field">
      <label>Start Date</label>
      <input type="date" class="rp-coverage-date-input" [(ngModel)]="coverageStartDate">
    </div>
    <div class="rp-field">
      <label>End Date</label>
      <input type="date" class="rp-coverage-date-input" [(ngModel)]="coverageEndDate">
    </div>
    <button class="rp-save-btn" [disabled]="loadingCoverage" (click)="loadCoverageSummary()">Refresh</button>
  </div>

  <div *ngIf="loadingCoverage" class="rp-loading small">
    <i class="bi bi-arrow-repeat spin me-2"></i> Loading coverage summary...
  </div>

  <div *ngIf="coverageMessage" class="rp-message small" [class.error]="coverageMessageType === 'error'">
    <i class="bi bi-exclamation-triangle-fill"></i> {{ coverageMessage }}
  </div>

  <div class="rp-coverage-table-wrap" *ngIf="!loadingCoverage && coverageRows.length">
    <table class="rp-rainfall-table">
      <thead>
        <tr>
          <th>Admin Level</th><th>GeoJSON Total</th><th>DB Count</th><th>Mapped Count</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of coverageRows">
          <td>{{ r.label }}</td>
          <td>{{ r.geojsonTotal }}</td>
          <td>{{ r.dbCount }}</td>
          <td>{{ r.mappedCount }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Edit: `review-and-publish.component.css`

Append:

```css
/* ── Data Coverage Summary ───────────────────────────────────────────── */
.rp-coverage-daterange-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.2rem;
}
.rp-coverage-daterange-row .rp-field { margin-bottom: 0; flex: 1; }
.rp-coverage-date-input {
  width: 100%;
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.9rem;
  color: #333;
  box-sizing: border-box;
}
.rp-coverage-table-wrap { overflow-x: auto; }
```

---

## Reference data (verified from the real files in `src/assets/geojson/`)

| Level | File | Features | Code property | Sample value | Type |
|---|---|---|---|---|---|
| Block | `INDIA_BLOCK.json` | 5961 | `block_code` | `'4050500104'` | string |
| District | `INDIA_DISTRICT.json` | 746 | `district_c` | `40404007` | number |
| State | `INDIA_STATE.json` | 36 | `state_code` | `201` | number |
| Subdivision | `INDIA_SUB_DIVISION.json` | 36 | `SubDiv_Cod` | `'401'` | string |
| Region | `INDIA_REGIONS.json` | 4 | `region_cod` | `1` | number |
| Country | `INDIA_COUNTRY.json` | 1 | (n/a) | — | — |

Code JSON types are inconsistent across files → always normalize with `String(code).trim()` on both sides before comparing. DB code columns are Postgres `numeric`/`bigint`.

---

## BLOCKERS / prerequisites before this works (important)

The feature is **code-complete but was non-functional** against the DB as seeded, because of upstream GeoJSON data problems. Fix these first:

### 1. `geojson_store` must hold the REAL files, not the derived ones

The GeoJSON Management "District" tab has a **derived-files generator** (`generateDistrictDerived` in `geojson-management.component.ts`) that is **broken two ways**:

- **`toMultiPolygonFeature()` never dissolves geometry** — it just concatenates every district's polygons. So the derived `INDIA_COUNTRY.json` / `INDIA_REGION.json` / `INDIA_STATE.json` / `INDIA_SUB_DIVISION.json` all carry ALL 746 district borders internally (988 polygons each). Feature COUNT is right (1/4/36/36) but the shapes render every district on the country/region/state maps. Real dissolve needs turf.js `union` or PostGIS `ST_Union` — not implemented.
- **Code properties are dropped** — derived features only get a name (`{state: "KERALA"}`), NOT the code (`state_code`, `SubDiv_Cod`, `region_cod`). This is what makes coverage's `mappedCount` return **0** for State/Subdivision/Region: the cache extracts a code property that doesn't exist → empty set.

**Fix (recommended): bypass the derive flow.** Upload the six REAL files from `src/assets/geojson/` via the plain **Upload** button (top of each tab), NOT the derived-files section. The real files are correctly dissolved AND have correct code properties. Block tab → `INDIA_BLOCK.json`; District tab → `INDIA_DISTRICT.json`; the other four go through either tab (all `folder: 'root'`).

### 2. Filename collision: `INDIA_REGION.json` vs `INDIA_REGIONS.json`

DB was seeded (by the broken derive) with `INDIA_REGION.json` (singular). The real file is `INDIA_REGIONS.json` (plural) — which the controller config expects. Uploading the real plural file will NOT auto-deactivate the singular one (different filename). Manually deactivate the bogus row:

```sql
-- inspect first
SELECT id, folder, file_name, feature_count, version, is_active
FROM geojson_store WHERE folder='root' AND file_name='INDIA_REGION.json';

-- then, after INDIA_REGIONS.json is uploaded successfully:
UPDATE geojson_store SET is_active = FALSE, updated_at = NOW()
WHERE folder='root' AND file_name='INDIA_REGION.json';
```

### 3. Block & District were NOT stored at all

As of last check, `geojson_store` had only Country / Region(bogus) / State / Subdivision rows. `INDIA_BLOCK.json` and `INDIA_DISTRICT.json` were never uploaded → coverage returns `geojsonTotal: null` for those two levels until they are.

### 4. OPEN RISK: state/subdivision code scheme may not match the DB

`INDIA_STATE.json` uses `state_code` like BIHAR → `203`, but `INDIA_DISTRICT.json` uses `20303` for the same state, and `normal_district_details.new_state_code` (what `fetchStateWithAWS` returns as `state_code`) is a third scheme. If the GeoJSON `state_code` doesn't equal the DB `state_code`, State `mappedCount` stays 0 even after a clean upload. **This needs a real DB comparison to confirm** — could not verify (no DB access from the build environment). Same caution for Subdivision (`SubDiv_Cod` vs `subdiv_code`) and Region (`region_cod` vs `region_code`).

Suggested debugging aid when rebuilding: add a `sampleUnmatchedCodes` field to each row in the response (a few DB codes NOT found in the GeoJSON set) so the mismatch is visible instead of guessed.

---

## Verification checklist (when rebuilt)

1. Seed check:
   ```sql
   SELECT file_name, feature_count, version, is_active
   FROM geojson_store WHERE folder='root' AND is_active=true ORDER BY file_name;
   ```
   Expect counts 1 / 4 / 36 / 36 / 746 / 5961 for Country / Regions / State / Subdivision / District / Block.
2. Backend curl:
   ```bash
   curl -sX POST http://localhost:3000/api/v1/coverage-summary \
     -H "Content-Type: application/json" -d '{}' | jq
   ```
   Expect 6 rows, `dbCount >= mappedCount` for every non-country level; watch for `mappedCount: 0` on State/Subdivision/Region (the code-scheme mismatch, item 4 above).
3. Frontend: `ng serve`, open Review & Publish, confirm the new card renders below "Public & SP Settings", dates default to today, Refresh updates numbers, backend-down shows the error state.

---

## Files touched (all discarded)

Backend:
- NEW `controllers/geojsonFeatureCache.js`
- NEW `controllers/CoverageSummaryController.js`
- NEW `routes/coverageSummaryRoutes.js`
- EDIT `index.js` (2 lines)

Frontend:
- NEW `src/app/services/coverageSummary.service.ts`
- EDIT `src/app/main/data-management/review-and-publish/review-and-publish.component.ts`
- EDIT `.../review-and-publish.component.html`
- EDIT `.../review-and-publish.component.css`

Original plan file (may still exist): `~/.claude/plans/in-the-review-and-noble-pretzel.md`
