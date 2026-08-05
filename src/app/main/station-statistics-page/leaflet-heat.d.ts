/**
 * Minimal typings for `leaflet.heat`, which ships no `.d.ts` and has no
 * `@types` package. Declaring the two members we actually use keeps the call
 * sites type-checked instead of casting the whole of `L` to `any`.
 */
import 'leaflet';

declare module 'leaflet' {
  /** [lat, lng, intensity] — intensity is expected in the range 0..1. */
  type HeatLatLngTuple = [number, number, number];

  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    /** Peak intensity. Points at or above this render as the top gradient stop. */
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  interface HeatLayer extends Layer {
    setLatLngs(latlngs: HeatLatLngTuple[]): this;
    addLatLng(latlng: HeatLatLngTuple): this;
    setOptions(options: HeatMapOptions): this;
    redraw(): this;
  }

  function heatLayer(
    latlngs: HeatLatLngTuple[],
    options?: HeatMapOptions
  ): HeatLayer;
}
