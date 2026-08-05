import { Injectable } from "@angular/core";

/**
 * Geometry helpers for the RMU map products (the browser port of
 * irainsmap2.0.py / StatewiseDistrictMap_iRAINS.py).
 *
 * These maps are NOT Leaflet maps. The python originals are matplotlib
 * figures: the shapefile is drawn with raw lon/lat as x/y (no web-mercator),
 * so the only way to get the same shapes is to reproduce what
 * GeoDataFrame.plot() does:
 *
 *   1. take total_bounds of the merged frame,
 *   2. widen the view by the buffer factors in the python (negative buffer
 *      = expand),
 *   3. draw with aspect = 1/cos(mean latitude)  <-- geopandas does this for
 *      any geographic CRS, it is what keeps India from looking squashed.
 *
 * Everything here works in that "matplotlib axes" space and emits SVG path
 * data, so the component can just drop the paths into an <svg>.
 */

export interface RmuProjection {
  /** viewBox width in svg user units (always PROJECTION_WIDTH) */
  vbWidth: number;
  /** viewBox height in svg user units */
  vbHeight: number;
  /** lon -> svg x */
  x(lon: number): number;
  /** lat -> svg y */
  y(lat: number): number;
}

export interface RmuShape {
  /** the feature's properties, untouched */
  props: any;
  /** svg path data for the whole geometry (all rings / all parts) */
  path: string;
  /** area weighted centroid, already projected — matches shapely .centroid */
  cx: number;
  cy: number;
}

/** svg user units across the full projected view */
const PROJECTION_WIDTH = 1000;

@Injectable({ providedIn: "root" })
export class RmuMapGeoService {
  // ---------------------------------------------------------------- colours
  /**
   * Exactly the palette + bin edges of the python:
   *   categories = [-999, -100, -99, -59.9, -19.9, 20, 60, inf]
   *   colors     = ['#c0c0c0','#ffffff','#FFFF01','#F94112','#68DE58','#69BEF7','#0594FF']
   * pd.cut(..., right=False) so every bin is [low, high).
   */
  colorForDeparture(departure: number | null | undefined): string {
    if (departure === null || departure === undefined || isNaN(departure as number)) {
      return "#c0c0c0"; // -999 / no data
    }
    const d = departure as number;
    if (d >= 60) return "#0594FF"; // large excess
    if (d >= 20) return "#69BEF7"; // excess
    if (d >= -19.9) return "#68DE58"; // normal
    if (d >= -59.9) return "#F94112"; // deficient
    if (d >= -99) return "#FFFF01"; // large deficient
    if (d >= -100) return "#ffffff"; // no rain
    return "#c0c0c0"; // no data
  }

  /**
   * Actual rainfall (mm) bands, matching Constants.getActualColorForRainfall
   * and the legend on the /all-maps-actual pages. Zero uses the legend's
   * #F5F5F5 rather than pure white so the band is visible on the sheet.
   */
  colorForActual(mm: number | null | undefined): string {
    if (mm === null || mm === undefined || isNaN(mm as number) || (mm as number) < 0) {
      return "#c0c0c0"; // no data
    }
    const v = mm as number;
    if (v === 0) return "#F5F5F5";
    if (v <= 2.4) return "#abf200";
    if (v <= 15.5) return "#03ff00";
    if (v <= 64.4) return "#03ffff";
    if (v <= 115.5) return "#ffff00";
    if (v <= 204.4) return "#ff8c00";
    return "#ff0000";
  }

  /** the actual-rainfall legend, as printed on /all-maps-actual */
  readonly actualLegendItems = [
    { color: "#F5F5F5", text: "Zero Rainfall [0]" },
    { color: "#abf200", text: "Very Light [0.001 to 2.4mm]" },
    { color: "#03ff00", text: "Light [>2.4 to 15.5mm]" },
    { color: "#03ffff", text: "Moderate [>15.5 to 64.4mm]" },
    { color: "#ffff00", text: "Heavy [>64.4 to 115.5mm]" },
    { color: "#ff8c00", text: "Very Heavy [>115.5 to 204.4mm]" },
    { color: "#ff0000", text: "Extremely Heavy [>204.4mm]" },
    { color: "#c0c0c0", text: "No Data" },
  ];

  /** the legend strip printed at the bottom of every RMU product */
  readonly legendItems = [
    { color: "#0594FF", text: "Large Excess [ 60% or more]" },
    { color: "#69BEF7", text: "Excess [ 20% to 59%]" },
    { color: "#68DE58", text: "Normal [-19% to 19%]" },
    { color: "#F94112", text: "Deficient [-59% to -20%]" },
    { color: "#FFFF01", text: "Large Deficient [-99% to -60%]" },
    { color: "#ffffff", text: "No Rain  [-100%]" },
    { color: "#c0c0c0", text: "No Data" },
  ];

  // ------------------------------------------------------------- projection
  /**
   * @param features   geojson features to fit
   * @param bufferX    python `buffer_x` factor (-0.18 on the country maps).
   *                   Negative = view grows, same sign convention as the py.
   * @param bufferY    python `buffer_y` factor (-0.25 on the state map)
   * @param squashY    extra vertical scale on top of the cos(lat) aspect.
   *                   StatewiseDistrictMap_iRAINS.py pastes its maps at
   *                   `new_height = ... * 0.9`, so the statewise sheets pass
   *                   0.9 here; everything else leaves it at 1.
   */
  buildProjection(
    features: any[],
    bufferX: number,
    bufferY: number,
    squashY = 1
  ): RmuProjection {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const f of features) {
      if (!this.hasGeometry(f)) continue;
      this.eachCoord(f.geometry, (lon, lat) => {
        if (lon < minX) minX = lon;
        if (lon > maxX) maxX = lon;
        if (lat < minY) minY = lat;
        if (lat > maxY) maxY = lat;
      });
    }

    const w = maxX - minX;
    const h = maxY - minY;
    // ax.set_xlim(xmin + buffer_x, xmax - buffer_x) with a negative factor
    const x0 = minX + w * bufferX;
    const x1 = maxX - w * bufferX;
    const y0 = minY + h * bufferY;
    const y1 = maxY - h * bufferY;

    // geopandas: ax.set_aspect(1 / cos(mean_lat)) for a geographic CRS
    const meanLat = (minY + maxY) / 2;
    const aspect = squashY / Math.cos((meanLat * Math.PI) / 180);

    const vbWidth = PROJECTION_WIDTH;
    const vbHeight = (vbWidth * ((y1 - y0) * aspect)) / (x1 - x0);

    return {
      vbWidth,
      vbHeight,
      x: (lon: number) => ((lon - x0) / (x1 - x0)) * vbWidth,
      y: (lat: number) => vbHeight - ((lat - y0) / (y1 - y0)) * vbHeight,
    };
  }

  /**
   * Not every feature in the shipped geojson has geometry — INDIA_DISTRICT.json
   * currently has DARJEELING (20711002) with `geometry: null`, which would
   * otherwise take the whole sheet down. Callers filter on this.
   */
  hasGeometry(feature: any): boolean {
    return !!feature?.geometry?.coordinates?.length;
  }

  /** feature -> svg path + projected centroid */
  buildShape(feature: any, proj: RmuProjection): RmuShape {
    const g = feature.geometry;
    const polygons: number[][][][] =
      g.type === "Polygon" ? [g.coordinates] : g.coordinates;

    let path = "";
    for (const poly of polygons) {
      for (const ring of poly) {
        for (let i = 0; i < ring.length; i++) {
          const px = proj.x(ring[i][0]).toFixed(2);
          const py = proj.y(ring[i][1]).toFixed(2);
          path += (i === 0 ? "M" : "L") + px + " " + py;
        }
        path += "Z";
      }
    }

    const c = this.centroid(polygons);
    return {
      props: feature.properties,
      path,
      cx: proj.x(c[0]),
      cy: proj.y(c[1]),
    };
  }

  /**
   * Area weighted centroid over every part, holes subtracted — same result as
   * shapely's `.centroid`, which is what the python annotates on.
   */
  private centroid(polygons: number[][][][]): [number, number] {
    let area = 0, cx = 0, cy = 0;
    for (const poly of polygons) {
      for (let r = 0; r < poly.length; r++) {
        const ring = poly[r];
        let a = 0, x = 0, y = 0;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
          a += cross;
          x += (ring[j][0] + ring[i][0]) * cross;
          y += (ring[j][1] + ring[i][1]) * cross;
        }
        a = a / 2;
        if (a === 0) continue;
        x = x / (6 * a);
        y = y / (6 * a);
        // ring 0 is the shell, the rest are holes: |a| for the shell,
        // -|a| for holes, so holes pull the centroid the right way.
        const signed = r === 0 ? Math.abs(a) : -Math.abs(a);
        area += signed;
        cx += x * signed;
        cy += y * signed;
      }
    }
    if (area === 0) return [0, 0];
    return [cx / area, cy / area];
  }

  private eachCoord(geometry: any, fn: (lon: number, lat: number) => void): void {
    const polygons: number[][][][] =
      geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    for (const poly of polygons) {
      for (const ring of poly) {
        for (const pt of ring) fn(pt[0], pt[1]);
      }
    }
  }

  // ------------------------------------------------------------ formatting
  /** python format_to_1_decimal — always one decimal, blank when missing */
  oneDecimal(value: any): string {
    if (value === null || value === undefined || value === "") return "";
    const n = Number(value);
    return isNaN(n) ? "" : n.toFixed(1);
  }

  /** python format_to_int — rounded, blank when missing */
  toInt(value: any): string {
    if (value === null || value === undefined || value === "") return "";
    const n = Number(value);
    return isNaN(n) ? "" : String(Math.round(n));
  }

  /** dd-mm-yyyy, the only date format these products use */
  indianDate(iso: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}-${m}-${y}`;
  }
}
