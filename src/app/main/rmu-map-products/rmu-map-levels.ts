/**
 * Per-level configuration for the RMU map products.
 *
 * One sheet layout (rmu-map.component.*) serves every aggregation level; only
 * the geometry, the data source and the labelling change, and all of that
 * lives here. Titles, buffers and label offsets that exist in
 * irainsmap2.0.py are copied from it verbatim — see the notes on each level.
 */

export type RmuLevelKey =
  | "COUNTRY"
  | "REGION"
  | "SUBDIVISION"
  | "STATE"
  | "DISTRICT"
  | "BLOCK"
  | "REGION_CENTRAL"
  | "REGION_ENE"
  | "REGION_NW"
  | "REGION_SP";

export interface RmuLevelConfig {
  /** headline printed under the IMD header strip */
  title: string;
  /**
   * The python drops the title font for the longer headings (fontsize 15 for
   * "STATE RAINFALL MAP", 9.5-11 for "DISTRICT DEPARTURE RAINFALL MAP- SOUTH
   * PENINSULA"); without that a long title runs into the 150 logo.
   */
  titleFontSize?: number;
  /** file name used by the download button */
  fileName: string;
  geojson: string;
  /** geojson property holding the code that joins to the API rows */
  featureKey: string;
  /** geojson property holding the display name */
  nameKey: string;
  /** candidate API fields holding that same code (first one present wins) */
  dataKeys: string[];
  /** candidate API fields for actual / normal rainfall */
  actualKeys: string[];
  normalKeys: string[];
  /** `Act (Dep%) / Abb / Nor` at each centroid, or a bare choropleth */
  labels: boolean;
  /** the ALL INDIA actual/normal/departure box — the python omits it on the
   *  district sheet, so density-heavy levels omit it here too */
  allIndia: boolean;
  /** python buffer_x / buffer_y (negative = the view grows) */
  bufferX: number;
  bufferY: number;
  /** svg stroke for the polygon outlines, in projection units */
  strokeWidth: number;
  /** `Abb` column overrides, keyed by the geojson name */
  abbreviations?: { [name: string]: string };
  /** python annotate() offsets in points, keyed by the geojson name */
  offsets?: { [name: string]: [number, number] };
  /** the region these districts belong to, for the pdf/excel export */
  regionName?: string;
}

/** STATE SHEET.xlsx `Abb` column */
const STATE_ABBREVIATIONS: { [name: string]: string } = {
  "ANDAMAN & NICOBAR ISLANDS (UT)": "A & N islands",
  "ANDHRA PRADESH": "Andhra Pradesh",
  "ARUNACHAL PRADESH": "Arunachal Pradesh",
  ASSAM: "Assam",
  BIHAR: "Bihar",
  "CHANDIGARH (UT)": "Chd(UT)",
  CHHATTISGARH: "Chhatisgarh",
  "DADRA & NAGAR HAVELI AND DAMAN & DIU (UT)": "D&NH and DD(UT)",
  "DELHI (UT)": "Delhi(UT)",
  GOA: "Goa",
  GUJARAT: "Gujarat",
  HARYANA: "Haryana",
  "HIMACHAL PRADESH": "Himachal Pradesh",
  "JAMMU & KASHMIR (UT)": "J&K(UT)",
  JHARKHAND: "Jharkhand",
  KARNATAKA: "Karnataka",
  KERALA: "Kerala",
  "LADAKH (UT)": "Ladakh(UT)",
  "LAKSHADWEEP (UT)": "Lakshadweep(UT)",
  "MADHYA PRADESH": "Madhya Pradesh",
  MAHARASHTRA: "Maharashtra",
  MANIPUR: "Manipur",
  MEGHALAYA: "Meghalaya",
  MIZORAM: "Mizoram",
  NAGALAND: "Nagaland",
  ODISHA: "Odisha",
  "PUDUCHERRY (UT)": "Puducherry(UT)",
  PUNJAB: "Punjab",
  RAJASTHAN: "Rajasthan",
  SIKKIM: "Sikkim",
  TAMILNADU: "Tamil Nadu",
  TELANGANA: "Telangana",
  TRIPURA: "Tripura",
  "UTTAR PRADESH": "Uttar Pradesh",
  UTTARAKHAND: "Uttarakhand",
  "WEST BENGAL": "West Bengal",
};

/** daily_state_map() annotate offsets */
const STATE_OFFSETS: { [name: string]: [number, number] } = {
  KARNATAKA: [-8, 0],
  MIZORAM: [0, -15],
  "DELHI (UT)": [15, -10],
  PUNJAB: [-20, 0],
  "PUDUCHERRY (UT)": [15, -5],
  "WEST BENGAL": [0, -20],
  "DADRA & NAGAR HAVELI AND DAMAN & DIU (UT)": [-10, -3],
  TAMILNADU: [0, -30],
  GOA: [-15, 0],
  MEGHALAYA: [0, -5],
  NAGALAND: [15, 0],
  TRIPURA: [-13, -5],
  MANIPUR: [0, -5],
};

/** SUBDIVISION SHEET.xlsx `Abb` column, keyed by the geojson subdivisio */
const SUBDIV_ABBREVIATIONS: { [name: string]: string } = {
  "ANDAMAN & NICOBAR ISLANDS": "A & N ISLAND",
  "ARUNACHAL PRADESH": "ARUNACHAL PRADESH",
  "ASSAM & MEGHALAYA": "ASSAM & MEGHALAYA",
  BIHAR: "BIHAR",
  CHHATTISGARH: "CHHATTISGARH",
  "COASTAL ANDHRA PRADESH & YANAM": "COASTAL A. P& YANAM",
  "COASTAL KARNATAKA": "COASTAL KARNATAKA",
  "DELHI, HARYANA AND CHANDIGARH": "HAR. CHD & DELHI",
  "EAST MADHYA PRADESH": "EAST M.P",
  "EAST RAJASTHAN": "EAST RAJASTHAN",
  "EAST UTTAR PRADESH": "EAST U.P",
  "GANGETIC WEST BENGAL": "GANGETIC WB",
  "GUJARAT REGION": "GUJARAT",
  "HIMACHAL PRADESH": "HIMACHAL PRADESH",
  "JAMMU & KASHMIR AND LADAKH": "J & K AND LADAKH",
  JHARKHAND: "JHARKHAND",
  "KERALA & MAHE": "KEARALA &MAHE",
  "KONKAN & GOA": "KONKAN & GOA",
  LAKSHADWEEP: "LAKSHADWEEP",
  "MADHYA MAHARASHTRA": "M. MAHARASHTRA",
  MARATHWADA: "MARATHWADA",
  NMMT: "NMMT",
  "NORTHERN INTERIOR KARNATAKA": "N. I. KARNATAKA",
  ODISHA: "ODISHA",
  PUNJAB: "PUNJAB",
  RAYALSEEMA: "RAYALASEEMA",
  "SAURASHTRA & KUTCH": "SAURASHTRA & KUTCH",
  "SHWB & SIKKIM": "SHWB&SIKKIM",
  "SOUTHERN INTERIOR KARNATAKA": "S. I. KARNATAKA",
  "TAMILNADU, PUDUCHERRY & KARAIKAL": "TAMIL., PUDU. & KARAIKAL",
  TELANGANA: "TELANGANA",
  UTTARAKHAND: "UTTARAKHAND",
  VIDARBHA: "VIDARBHA",
  "WEST MADHYA PRADESH": "WEST M.P",
  "WEST RAJASTHAN": "WEST RAJ.",
  "WEST UTTAR PRADESH": "WEST U.P",
};

/** daily_subdiv_map() annotate offsets (python names use " AND " for " & ") */
const SUBDIV_OFFSETS: { [name: string]: [number, number] } = {
  "SHWB & SIKKIM": [2, 15],
  "COASTAL ANDHRA PRADESH & YANAM": [10, 0],
  "COASTAL KARNATAKA": [-15, 0],
  "SOUTHERN INTERIOR KARNATAKA": [0, -10],
  "KONKAN & GOA": [-25, 0],
  "MADHYA MAHARASHTRA": [0, -10],
  "GUJARAT REGION": [5, -8],
  "WEST MADHYA PRADESH": [0, -10],
  "SAURASHTRA & KUTCH": [-15, 0],
  "KERALA & MAHE": [0, -20],
  "GANGETIC WEST BENGAL": [0, -10],
};

export const RMU_LEVELS: { [key in RmuLevelKey]: RmuLevelConfig } = {
  COUNTRY: {
    title: "COUNTRY RAINFALL MAP",
    fileName: "COUNTRY_RAINFALL_MAP_COUNTRY_INDIA",
    geojson: "assets/geojson/INDIA_COUNTRY.json",
    featureKey: "object_id",
    nameKey: "name",
    dataKeys: [],
    actualKeys: ["actual_rainfall"],
    normalKeys: ["rainfall_normal_value", "normal_rainfall"],
    labels: false,
    allIndia: true,
    bufferX: -0.18,
    bufferY: -0.25,
    strokeWidth: 0.7,
  },

  REGION: {
    title: "HOMOGENOUS REGION RAINFALL MAP",
    titleFontSize: 21,
    fileName: "REGION_RAINFALL_MAP_COUNTRY_INDIA",
    geojson: "assets/geojson/INDIA_REGIONS.json",
    featureKey: "region_cod",
    nameKey: "region_nam",
    dataKeys: ["region_code", "region_cod"],
    actualKeys: ["actual_region_rainfall", "actual_rainfall"],
    normalKeys: ["rainfall_normal_value", "normal_rainfall"],
    labels: true,
    allIndia: true,
    bufferX: -0.18,
    bufferY: -0.25,
    strokeWidth: 0.7,
  },

  SUBDIVISION: {
    // daily_subdiv_map()
    title: "SUBDIVISIONAL RAINFALL MAP",
    fileName: "SUBDIVISION_RAINFALL_MAP_COUNTRY_INDIA",
    geojson: "assets/geojson/INDIA_SUB_DIVISION.json",
    featureKey: "SubDiv_Cod",
    nameKey: "subdivisio",
    dataKeys: ["s_code", "subdiv_code", "sub_div_code"],
    actualKeys: ["actual_subdiv_rainfall", "actual_rainfall"],
    normalKeys: ["rainfall_normal_value", "normal_rainfall"],
    labels: true,
    allIndia: true,
    bufferX: -0.18,
    bufferY: -0.24,
    strokeWidth: 0.7,
    abbreviations: SUBDIV_ABBREVIATIONS,
    offsets: SUBDIV_OFFSETS,
  },

  STATE: {
    // daily_state_map()
    title: "STATE RAINFALL MAP",
    fileName: "STATE_RAINFALL_MAP_COUNTRY_INDIA",
    geojson: "assets/geojson/INDIA_STATE.json",
    featureKey: "state_code",
    nameKey: "state_name",
    dataKeys: ["state_code"],
    actualKeys: ["actual_state_rainfall", "actual_rainfall"],
    normalKeys: ["rainfall_normal_value", "normal_rainfall"],
    labels: true,
    allIndia: true,
    bufferX: -0.18,
    bufferY: -0.25,
    strokeWidth: 0.7,
    abbreviations: STATE_ABBREVIATIONS,
    offsets: STATE_OFFSETS,
  },

  DISTRICT: {
    // daily_district_map() — 746 polygons, no annotations in the python
    title: "DISTRICT RAINFALL MAP",
    fileName: "DISTRICT_RAINFALL_MAP_COUNTRY_INDIA",
    geojson: "assets/geojson/INDIA_DISTRICT.json",
    featureKey: "district_c",
    nameKey: "district",
    dataKeys: ["district_code"],
    actualKeys: ["actual_rainfall"],
    normalKeys: ["normal_rainfall", "rainfall_normal_value"],
    labels: false,
    allIndia: false,
    bufferX: -0.18,
    bufferY: -0.24,
    strokeWidth: 0.7,
  },

  // ---- the four regional district sheets -------------------------------
  // daily_ce_map / daily_ene_map / daily_sp_map frame with buffer_x = 0 and
  // buffer_y = -0.50 (x untouched, y grown 50% each side). daily_nw_map is
  // the odd one out: it grows x by 15% and y by 25%. Titles carry the
  // python's own smaller font sizes so they clear the 150 logo.
  REGION_CENTRAL: {
    title: "DISTRICT DEPARTURE RAINFALL MAP - CENTRAL INDIA",
    titleFontSize: 21,
    fileName: "DISTRICT_RAINFALL_MAP_REGION_CODE_CENTRAL INDIA",
    geojson: "assets/geojson/regions/C_India.json",
    featureKey: "district_c",
    nameKey: "district",
    dataKeys: ["district_code"],
    actualKeys: ["actual_rainfall"],
    normalKeys: ["normal_rainfall", "rainfall_normal_value"],
    labels: false,
    allIndia: false,
    bufferX: 0,
    bufferY: -0.5,
    strokeWidth: 0.7,
    regionName: "CENTRAL INDIA",
  },

  REGION_ENE: {
    title: "DISTRICT DEPARTURE RAINFALL MAP - EAST & NORTH EAST INDIA",
    titleFontSize: 18,
    fileName: "DISTRICT_RAINFALL_MAP_REGION_CODE_EAST AND NORTH EAST INDIA",
    geojson: "assets/geojson/regions/EAST_AND_NORTH_EAST_INDIA.json",
    featureKey: "district_c",
    nameKey: "district",
    dataKeys: ["district_code"],
    actualKeys: ["actual_rainfall"],
    normalKeys: ["normal_rainfall", "rainfall_normal_value"],
    labels: false,
    allIndia: false,
    bufferX: 0,
    bufferY: -0.5,
    strokeWidth: 0.7,
    regionName: "EAST AND NORTH EAST INDIA",
  },

  REGION_NW: {
    title: "DISTRICT DEPARTURE RAINFALL MAP - NORTH WEST INDIA",
    titleFontSize: 21,
    fileName: "DISTRICT_RAINFALL_MAP_REGION_CODE_NORTH WEST INDIA",
    geojson: "assets/geojson/regions/NORTH_WEST_INDIA.json",
    featureKey: "district_c",
    nameKey: "district",
    dataKeys: ["district_code"],
    actualKeys: ["actual_rainfall"],
    normalKeys: ["normal_rainfall", "rainfall_normal_value"],
    labels: false,
    allIndia: false,
    bufferX: -0.15,
    bufferY: -0.25,
    strokeWidth: 0.7,
    regionName: "NORTH WEST INDIA",
  },

  REGION_SP: {
    title: "DISTRICT DEPARTURE RAINFALL MAP - SOUTH PENINSULA",
    titleFontSize: 18,
    fileName: "DISTRICT_RAINFALL_MAP_REGION_CODE_SOUTH PENINSULA",
    geojson: "assets/geojson/regions/SOUTH_PENINSULA.json",
    featureKey: "district_c",
    nameKey: "district",
    dataKeys: ["district_code"],
    actualKeys: ["actual_rainfall"],
    normalKeys: ["normal_rainfall", "rainfall_normal_value"],
    labels: false,
    allIndia: false,
    bufferX: 0,
    bufferY: -0.5,
    strokeWidth: 0.7,
    regionName: "SOUTH PENINSULA",
  },

  BLOCK: {
    // no python equivalent; 5961 polygons so the outline has to be finer or
    // the sheet turns into a black mesh at this size
    title: "BLOCK RAINFALL MAP",
    fileName: "BLOCK_RAINFALL_MAP_COUNTRY_INDIA",
    geojson: "assets/geojson/INDIA_BLOCK.json",
    featureKey: "block_code",
    nameKey: "block_Name",
    dataKeys: ["block_code"],
    actualKeys: ["actual_rainfall"],
    normalKeys: ["normal_rainfall", "rainfall_normal_value"],
    labels: false,
    allIndia: false,
    bufferX: -0.18,
    bufferY: -0.24,
    strokeWidth: 0.25,
  },
};
