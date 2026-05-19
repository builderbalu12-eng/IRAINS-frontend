# GeoJSON Management — Feature Reference

**Component:** `geojson-management.component` (District & Block tabs)  
**Location:** `src/app/main/data-management/geojson-management/`  
**Backend:** `POST /api/v1/geojson/upload` · `GET /api/v1/geojson/:folder` · `GET /api/v1/geojson/:folder/:fileName`

---

## Two Tabs

| Tab | Upload File | DB Folder | Purpose |
|---|---|---|---|
| District | `INDIA_DISTRICT.json` | `root` | Source file that auto-derives all geographic levels |
| Block | `INDIA_BLOCK.json` | `root` | All-India block boundaries, upload only |

---

## District Tab — Step 1: Upload & Validate

### Required Fields (16)
The District tab enforces that the uploaded GeoJSON has all of these property keys. Missing fields are shown as red badges and the Upload button is disabled.

```
region       region_cod    subdivisio    subdivis_1
state        state_code    district      district_c
block        block_code    country       area_sqkm
area_sqmi    abb           RMC_MC        RMC_MC_ID
```

### Preview
- Full Leaflet map (no feature cap — all features rendered)
- Scroll wheel zoom enabled
- Hover over any polygon → attribute tooltip shows all properties
- Map auto-fits to bounds on load
- Right panel shows all GeoJSON fields with sample values; required fields highlighted green

---

## District Tab — Step 2: Derived Files

Uploading a valid `INDIA_DISTRICT.json` (all 16 fields present) auto-generates ~117 derived files **in the browser** — no backend needed for generation.

### How Derivation Works
One pass groups features by `region`, `state`, `subdivisio`, and `RMC_MC`.  
All-India files use `toMultiPolygonFeature()` — polygon rings are concatenated into a MultiPolygon instantly (no dissolve, no Turf.js, no wait time).

### Derived File Groups

| Group | Count | File Name Pattern | DB Folder |
|---|---|---|---|
| All-India | 4 | `INDIA_COUNTRY.json`, `INDIA_REGION.json`, `INDIA_STATE.json`, `INDIA_SUB_DIVISION.json` | `root` |
| Per Region | ~4 | `{REGION_NAME}.json` | `regions` |
| Per State | ~36 | `ST_{STATE_NAME}.json` | `state` |
| Per Subdivision | ~36 | `SD_{SUBDIV_NAME}.json` | `subdivision` |
| Per MC/RMC | ~80 | `{RMC_MC value with underscores}.json` | `mcrmcs` |

### Derived Panel UI
- **Left accordion** — 5 collapsible groups, each showing file name, feature count, and status icons
- **Right panel** — shared Leaflet preview map; click any file in the list to preview it
- **Per-file actions**: Upload to DB (↑), Download as .json (↓)
- **Group upload**: "↑ All" button on each group header uploads every pending file in that group sequentially
- **Top-right "Upload All to DB"** — uploads every derived file across all groups
- Status icons: spinner (uploading) → green tick (success) → red exclamation (error)

---

## Compare Mode

Available on any tab after uploading a file **whose name matches a file already in the DB**.  
The "Compare" button appears in the preview card header only when a match exists.

### How to Use
1. Upload a file (e.g. updated `INDIA_DISTRICT.json`)
2. If the same file exists in DB, "Compare" button appears in the card header
3. Click **Compare** → fetches the DB version → shows comparison
4. Toggle between **Overlay** and **Side by Side** views
5. Click **Preview** to go back to normal preview mode

### Overlay View
Single Leaflet map with both versions layered:
- **DB version** — red outlines (`#dc2626`), red fill (`#fca5a5`)
- **New upload** — blue outlines (`#2563eb`), blue fill (`#93c5fd`)
- Floating legend bottom-right
- Hover tooltips on both layers

### Side-by-Side View
Two Leaflet maps rendered next to each other:
- **Left map** — DB version (red)
- **Right map** — New upload (blue)
- **Synchronized** — panning or zooming either map moves the other in real time
- Hover tooltips on both maps

### Stats Bar
Shown in both views:
```
[ Overlay | Side by Side ]    DB: 746    New: 751    +5
```
Delta badge is green if new file has more features, red if fewer.

---

## Map Behaviour (All Maps)

| Behaviour | Setting |
|---|---|
| Scroll wheel zoom | Enabled |
| Attribution control | Hidden |
| Tile layer | OpenStreetMap |
| Fit on load | `fitBounds` with 20px padding, called after `invalidateSize` |
| Hover tooltip | Sticky, all non-null properties in a formatted table |
| Map reuse | Derived preview map is a single instance; layer swapped on file select |

---

## File Structure

```
geojson-management/
├── geojson-management.component.ts    ← all logic
├── geojson-management.component.html  ← template
├── geojson-management.component.css   ← styles
└── GEOJSON_MANAGEMENT.md              ← this file
```

## Key Interfaces (TypeScript)

```typescript
interface GeoFile {
  id, file_name, display_name, feature_count, version,
  source, is_validated, created_at, updated_at
}

interface DerivedFile {
  fileName, folder, group, groupKey,
  geojson,           // FeatureCollection
  featureCount,
  status: 'pending' | 'uploading' | 'success' | 'error',
  msg
}
```

## Key State

```typescript
// Per-tab state (keyed by tab.key)
files, loading, uploadFile, uploading, uploadMsg, uploadErr,
dragOver, features, props, geomType, previewMaps, missingFields,
uploadedGeoJson, previewMode, compareView, compareGeo,
compareLoading, compareErr, overlayMaps, sideLeftMaps, sideRightMaps

// Derived files (district only)
derivedFiles, selectedDerived, derivedMap, derivedGeoLayer, generating
```

---

## Backend Folders

| Folder | Contents |
|---|---|
| `root` | `INDIA_DISTRICT.json`, `INDIA_BLOCK.json`, `INDIA_COUNTRY.json`, `INDIA_REGION.json`, `INDIA_STATE.json`, `INDIA_SUB_DIVISION.json` |
| `regions` | Per-region files (e.g. `SOUTH_PENINSULA.json`) |
| `state` | Per-state files (e.g. `ST_KERALA.json`) |
| `subdivision` | Per-subdivision files (e.g. `SD_KERALA___MAHE.json`) |
| `mcrmcs` | Per-MC/RMC files (e.g. `MC_THIRVANTHAPURAM.json`) |
