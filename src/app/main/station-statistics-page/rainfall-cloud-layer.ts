import * as L from 'leaflet';

/**
 * A synthetic cloud layer whose density is driven by observed station rainfall.
 *
 * IMPORTANT: nothing here is observed cloud. It is a rendering of raingauge
 * totals that happens to look like cloud, and the UI labels it as simulated for
 * exactly that reason — on a meteorological product a photographic-looking
 * cloud can be misread as satellite truth.
 *
 * Two stages:
 *   1. `buildCloudField` splats every station into a coarse geographic grid, so
 *      the expensive interpolation happens once per filter change rather than
 *      per pixel.
 *   2. The layer samples that grid per tile and multiplies it by fractal noise,
 *      which is what turns a smooth blob into something with billowed edges.
 */

/** Cell size of the interpolation grid, in degrees. */
const CELL_DEG = 0.2;
/** Station influence radius, in degrees. */
const SPLAT_DEG = 0.9;
/** Rainfall (mm) treated as fully opaque cloud. */
const SATURATION_MM = 64.4;

export interface CloudField {
  minLat: number;
  minLng: number;
  cols: number;
  rows: number;
  /** Normalised 0..1 density, row-major. */
  data: Float32Array;
}

export interface CloudStation {
  lat: number;
  lng: number;
  /** Rainfall in mm. Missing/zero readings should not be passed in. */
  value: number;
}

/**
 * Builds the density grid by additively splatting a Gaussian per station.
 *
 * Splatting is O(stations x kernel) rather than the O(cells x stations) an
 * inverse-distance pass over every cell would cost — with ~5000 stations that
 * is the difference between instant and multi-second.
 */
export function buildCloudField(stations: CloudStation[]): CloudField | null {
  if (!stations.length) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const s of stations) {
    if (s.lat < minLat) minLat = s.lat;
    if (s.lat > maxLat) maxLat = s.lat;
    if (s.lng < minLng) minLng = s.lng;
    if (s.lng > maxLng) maxLng = s.lng;
  }

  // Pad so cloud can extend past the outermost stations rather than ending
  // in a hard straight edge at the bounding box.
  minLat -= SPLAT_DEG;
  maxLat += SPLAT_DEG;
  minLng -= SPLAT_DEG;
  maxLng += SPLAT_DEG;

  const cols = Math.max(1, Math.ceil((maxLng - minLng) / CELL_DEG));
  const rows = Math.max(1, Math.ceil((maxLat - minLat) / CELL_DEG));
  if (cols * rows > 4_000_000) return null;

  const data = new Float32Array(cols * rows);
  const radiusCells = Math.ceil(SPLAT_DEG / CELL_DEG);
  const sigma = radiusCells / 2;
  const twoSigmaSq = 2 * sigma * sigma;

  for (const s of stations) {
    const intensity = Math.min(1, s.value / SATURATION_MM);
    if (intensity <= 0) continue;

    const cx = (s.lng - minLng) / CELL_DEG;
    const cy = (s.lat - minLat) / CELL_DEG;
    const x0 = Math.max(0, Math.floor(cx - radiusCells));
    const x1 = Math.min(cols - 1, Math.ceil(cx + radiusCells));
    const y0 = Math.max(0, Math.floor(cy - radiusCells));
    const y1 = Math.min(rows - 1, Math.ceil(cy + radiusCells));

    for (let y = y0; y <= y1; y++) {
      const dy = y - cy;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const distSq = dx * dx + dy * dy;
        if (distSq > radiusCells * radiusCells) continue;
        const idx = y * cols + x;
        const weight = Math.exp(-distSq / twoSigmaSq) * intensity;
        // Max rather than sum: two adjacent light stations should not add up
        // to a heavy-rain cloud.
        if (weight > data[idx]) data[idx] = weight;
      }
    }
  }

  return { minLat, minLng, cols, rows, data };
}

// ------------------------------------------------------------------- noise --

/** Deterministic 32-bit hash, so clouds are stable across pans and redraws. */
function hash2(x: number, y: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** Fractional Brownian motion — stacked octaves give the billowed structure. */
function fbm(x: number, y: number, octaves: number): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// ------------------------------------------------------------------- layer --

/** Tile pixels are computed at 1/4 scale then upscaled; the browser's smoothing
 *  is what gives the soft edges, and it cuts the per-tile work by 16x. */
const SUB = 4;
/** Noise cells per degree of longitude at the base octave. */
const NOISE_SCALE = 4;

export class RainfallCloudLayer extends L.GridLayer {
  private field: CloudField | null = null;

  setField(field: CloudField | null): void {
    this.field = field;
    this.redraw();
  }

  protected override createTile(coords: L.Coords): HTMLElement {
    const size = this.getTileSize();
    const tile = document.createElement('canvas');
    tile.width = size.x;
    tile.height = size.y;

    const ctx = tile.getContext('2d');
    if (!ctx || !this.field) return tile;

    const field = this.field;
    const w = Math.max(1, Math.floor(size.x / SUB));
    const h = Math.max(1, Math.floor(size.y / SUB));
    const buffer = ctx.createImageData(w, h);
    const px = buffer.data;

    const scale = size.x * Math.pow(2, coords.z);
    // More octaves as you zoom in, so detail appears rather than the same
    // blobs simply getting bigger.
    const octaves = Math.min(7, Math.max(3, coords.z - 1));

    for (let y = 0; y < h; y++) {
      const worldY = coords.y * size.y + (y + 0.5) * SUB;
      const n = Math.PI - (2 * Math.PI * worldY) / scale;
      const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
      const gy = (lat - field.minLat) / CELL_DEG;

      for (let x = 0; x < w; x++) {
        const worldX = coords.x * size.x + (x + 0.5) * SUB;
        const lng = (worldX / scale) * 360 - 180;
        const gx = (lng - field.minLng) / CELL_DEG;

        const density = sampleBilinear(field, gx, gy);
        const out = (y * w + x) * 4;
        if (density <= 0.01) {
          px[out + 3] = 0;
          continue;
        }

        const noise = fbm(lng * NOISE_SCALE, lat * NOISE_SCALE, octaves);
        // Thresholding noise against density is what produces ragged cloud
        // edges; a straight multiply would just give uniform haze.
        let alpha = (noise + density * 1.35 - 0.92) * 3.2;
        alpha = alpha <= 0 ? 0 : alpha >= 1 ? 1 : alpha;

        // Denser cloud shades slightly grey, which reads as depth.
        const shade = 255 - 45 * density;
        px[out] = shade;
        px[out + 1] = shade;
        px[out + 2] = Math.min(255, shade + 6);
        px[out + 3] = Math.round(alpha * 235);
      }
    }

    // Paint the small buffer, then let the browser upscale it smoothly.
    const scratch = document.createElement('canvas');
    scratch.width = w;
    scratch.height = h;
    scratch.getContext('2d')!.putImageData(buffer, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(scratch, 0, 0, size.x, size.y);

    return tile;
  }
}

function sampleBilinear(field: CloudField, gx: number, gy: number): number {
  if (gx < 0 || gy < 0 || gx > field.cols - 1 || gy > field.rows - 1) return 0;

  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(field.cols - 1, x0 + 1);
  const y1 = Math.min(field.rows - 1, y0 + 1);
  const fx = gx - x0;
  const fy = gy - y0;

  const a = field.data[y0 * field.cols + x0];
  const b = field.data[y0 * field.cols + x1];
  const c = field.data[y1 * field.cols + x0];
  const d = field.data[y1 * field.cols + x1];

  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
