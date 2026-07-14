/**
 * Maps Angular router paths to backend `route_path` values used by Socket.IO rooms
 * and activity-log APIs. Fetch GET /api/v1/admin/realtime-config to override at runtime.
 */
export const ANGULAR_TO_BACKEND_ROUTE: Record<string, string> = {
  '/data-management/calculation-mode': '/data-management/calculation-mode',
  '/data-management/calculation-exclusion': '/data-management/calculation-exclusion',
  '/data-management/display-order': '/data-management/display-order',
  '/data-management/geojson': '/spatial-boundaries/geojson',
  '/data-management/geojson-upload': '/spatial-boundaries/geojson',
  '/data-management/country-management': '/data-management/normals/country',
  '/data-management/region-management': '/data-management/normals/region',
  '/data-management/state-management': '/data-management/normals/state',
  '/data-management/subdivision-management': '/data-management/normals/subdivision',
  '/data-management/district-management': '/data-management/normals/district',
  '/data-management/block-management': '/data-management/normals/block',
  '/data-management/review-and-publish': '/data-management/review-and-publish',
};

/** Page keys sent to POST /api/v1/admin/activity-log */
export const SPATIAL_PAGE_KEYS = {
  geojson: 'spatialGeojson',
  region: 'spatialRegion',
  state: 'spatialState',
  subdivision: 'spatialSubdivision',
  district: 'spatialDistrict',
  block: 'spatialBlock',
} as const;

export type SpatialPage = keyof typeof SPATIAL_PAGE_KEYS;

export const DISPLAY_ORDER_PAGE_KEY = 'displayOrder';

export const REVIEW_PUBLISH_PAGE_KEY = 'reviewPublish';

export type DisplayOrderEntityType = 'district' | 'state' | 'subdivision';

export const CALCULATION_PAGE_KEYS = {
  calcMode: 'calcMode',
  calcExclusion: 'calcExclusion',
} as const;

export type CalculationPage = keyof typeof CALCULATION_PAGE_KEYS;

export const SPATIAL_ROUTE_TO_PAGE: Record<string, SpatialPage> = {
  '/data-management/geojson': 'geojson',
  '/data-management/geojson-upload': 'geojson',
};

export const NORMALS_PAGE_KEYS = {
  country: 'normalsCountry',
  region: 'normalsRegion',
  state: 'normalsState',
  subdivision: 'normalsSubdivision',
  district: 'normalsDistrict',
  block: 'normalsBlock',
} as const;

export type NormalsPage = keyof typeof NORMALS_PAGE_KEYS;

export const NORMALS_ROUTE_TO_PAGE: Record<string, NormalsPage> = {
  '/data-management/country-management': 'country',
  '/data-management/region-management': 'region',
  '/data-management/state-management': 'state',
  '/data-management/subdivision-management': 'subdivision',
  '/data-management/district-management': 'district',
  '/data-management/block-management': 'block',
};

/** Angular path → activity-log page_key (used for realtime config lookups). */
export const REALTIME_PAGE_KEYS: Record<string, string> = {
  '/data-management/calculation-mode': CALCULATION_PAGE_KEYS.calcMode,
  '/data-management/calculation-exclusion': CALCULATION_PAGE_KEYS.calcExclusion,
  '/data-management/display-order': DISPLAY_ORDER_PAGE_KEY,
  '/data-management/review-and-publish': REVIEW_PUBLISH_PAGE_KEY,
  ...Object.fromEntries(
    Object.entries(SPATIAL_ROUTE_TO_PAGE).map(([route, page]) => [route, SPATIAL_PAGE_KEYS[page]]),
  ),
  ...Object.fromEntries(
    Object.entries(NORMALS_ROUTE_TO_PAGE).map(([route, page]) => [route, NORMALS_PAGE_KEYS[page]]),
  ),
};

export function normalizeAngularPath(url: string): string {
  const path = url.split('?')[0].split('#')[0];
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

export function backendRoutePath(angularPath: string): string | null {
  return ANGULAR_TO_BACKEND_ROUTE[normalizeAngularPath(angularPath)] ?? null;
}

export function isRealtimeAdminPage(angularPath: string): boolean {
  return backendRoutePath(angularPath) !== null;
}

/** Metadata for each of the 15 admin activity-log pages (matches backend PAGES). */
export interface AdminActivityPageMeta {
  page_key: string;
  module_name: string;
  category_name: string;
  page_name: string;
  route_path: string;
}

export const ADMIN_ACTIVITY_PAGES: AdminActivityPageMeta[] = [
  { page_key: 'calcMode', module_name: 'Data Management', category_name: 'Calculation', page_name: 'Calculation Mode', route_path: '/data-management/calculation-mode' },
  { page_key: 'calcExclusion', module_name: 'Data Management', category_name: 'Calculation', page_name: 'Calculation Exclusion', route_path: '/data-management/calculation-exclusion' },
  { page_key: 'displayOrder', module_name: 'Data Management', category_name: 'Display Order', page_name: 'Display Order', route_path: '/data-management/display-order' },
  { page_key: 'reviewPublish', module_name: 'Data Management', category_name: 'Station Data', page_name: 'Review & Publish', route_path: '/data-management/review-and-publish' },
  { page_key: 'spatialGeojson', module_name: 'Spatial Boundaries', category_name: 'GeoJSON', page_name: 'GeoJSON', route_path: '/spatial-boundaries/geojson' },
  { page_key: 'spatialRegion', module_name: 'Spatial Boundaries', category_name: 'Region', page_name: 'Region', route_path: '/spatial-boundaries/region' },
  { page_key: 'spatialState', module_name: 'Spatial Boundaries', category_name: 'State', page_name: 'State', route_path: '/spatial-boundaries/state' },
  { page_key: 'spatialSubdivision', module_name: 'Spatial Boundaries', category_name: 'Subdivision', page_name: 'Subdivision', route_path: '/spatial-boundaries/subdivision' },
  { page_key: 'spatialDistrict', module_name: 'Spatial Boundaries', category_name: 'District', page_name: 'District', route_path: '/spatial-boundaries/district' },
  { page_key: 'spatialBlock', module_name: 'Spatial Boundaries', category_name: 'Block', page_name: 'Block', route_path: '/spatial-boundaries/block' },
  { page_key: 'normalsCountry', module_name: 'Data Management', category_name: 'Normals', page_name: 'Country', route_path: '/data-management/normals/country' },
  { page_key: 'normalsRegion', module_name: 'Data Management', category_name: 'Normals', page_name: 'Region', route_path: '/data-management/normals/region' },
  { page_key: 'normalsState', module_name: 'Data Management', category_name: 'Normals', page_name: 'State', route_path: '/data-management/normals/state' },
  { page_key: 'normalsSubdivision', module_name: 'Data Management', category_name: 'Normals', page_name: 'Subdivision', route_path: '/data-management/normals/subdivision' },
  { page_key: 'normalsDistrict', module_name: 'Data Management', category_name: 'Normals', page_name: 'District', route_path: '/data-management/normals/district' },
  { page_key: 'normalsBlock', module_name: 'Data Management', category_name: 'Normals', page_name: 'Block', route_path: '/data-management/normals/block' },
];

export const DATA_MANAGEMENT_CATEGORIES = ['', 'Normals', 'Calculation', 'Display Order', 'Station Data'] as const;
export const SPATIAL_BOUNDARY_CATEGORIES = ['', 'GeoJSON', 'Region', 'State', 'Subdivision', 'District', 'Block'] as const;
