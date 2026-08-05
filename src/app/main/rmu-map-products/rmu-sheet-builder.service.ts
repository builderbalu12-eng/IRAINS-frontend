import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, firstValueFrom } from "rxjs";

import { RmuMapGeoService, RmuProjection } from "./rmu-map-geo.service";
import { RMU_LEVELS, RmuLevelConfig, RmuLevelKey } from "./rmu-map-levels";
import { RMU_MC_LIST } from "./rmu-mc-list";
import { RmuSheetShape } from "./rmu-sheet/rmu-sheet.component";
import { RmuStatewiseShape } from "./rmu-statewise-sheet/rmu-statewise-sheet.component";
import { DistrictService } from "src/app/services/district/district.service";
import { StateService } from "src/app/services/state/state.service";
import { SubdivisionService } from "src/app/services/subDivision/subDivision.service";
import { RegionService } from "src/app/services/region/region.service";
import { CountryService } from "src/app/services/country/country.service";
import { BlockService } from "src/app/services/block/BlockService.service";
import { CalculationsModeService } from "src/app/services/calculationsMode.service";

export type RmuVariant = "DEPARTURE" | "ACTUAL";

export interface RmuSheetVm {
  config: RmuLevelConfig;
  shapes: RmuSheetShape[];
  viewBox: string;
  periodLabel: string;
  allIndiaLine: string;
  variant: RmuVariant;
  /** the title as printed, which differs between the two variants */
  title: string;
  legend: { color: string; text: string }[];
}

export interface RmuStatewiseVm {
  title: string;
  shapes: RmuStatewiseShape[];
  viewBox: string;
  periodLabel: string;
}

/** the statewise sheet's own palette (StatewiseDistrictMap_iRAINS.py) */
const SW_COLORS = {
  largeExcess: "#0099ff",
  excess: "#66cbff",
  normal: "#5de360",
  deficient: "#ff5a00",
  largeDeficient: "#ffff00",
  noRain: "#ffffff",
  noData: "#c0c0c0",
};

/**
 * Builds a ready-to-render sheet view model for any level, or for one state,
 * without needing the map page on screen. This is what lets ALL STATISTICS
 * render sheets off-screen and capture them.
 *
 * Geojson responses are cached for the lifetime of the service — a batch
 * download would otherwise refetch INDIA_BLOCK.json (8.7 MB) per item.
 */
@Injectable({ providedIn: "root" })
export class RmuSheetBuilderService {
  private static readonly LABEL_FONT = 9.7;
  private static readonly POINT = 1.27;
  private static readonly SW_LABEL_FONT = 23;
  private static readonly SW_SQUASH = 0.9;

  private geojsonCache = new Map<string, any>();

  constructor(
    private http: HttpClient,
    private geo: RmuMapGeoService,
    private districtService: DistrictService,
    private stateService: StateService,
    private subdivisionService: SubdivisionService,
    private regionService: RegionService,
    private countryService: CountryService,
    private blockService: BlockService,
    private calcMode: CalculationsModeService
  ) {}

  readonly labelFont = RmuSheetBuilderService.LABEL_FONT;
  readonly labelLine = RmuSheetBuilderService.LABEL_FONT * 1.2;
  readonly swLabelFont = RmuSheetBuilderService.SW_LABEL_FONT;
  readonly swLabelLine = RmuSheetBuilderService.SW_LABEL_FONT * 1.2;

  private async geojson(url: string): Promise<any> {
    const hit = this.geojsonCache.get(url);
    if (hit) return hit;
    const res = await firstValueFrom(this.http.get<any>(url));
    this.geojsonCache.set(url, res);
    return res;
  }

  private periodLabel(from: string, to: string): string {
    return from === to
      ? `Date:${this.geo.indianDate(to)}`
      : `Period: ${this.geo.indianDate(from)} to ${this.geo.indianDate(to)}`;
  }

  /** the level's endpoint, honouring Unified / AWS / data-entry mode */
  private levelData$(level: RmuLevelKey, payload: any): Observable<any> {
    const selectedMode = JSON.parse(localStorage.getItem("selectedMode") || "{}");
    const unified = selectedMode?.selectedMode === "Unified";
    const aws = this.calcMode.isAwsEnabled;

    switch (level) {
      // the four regional sheets draw district geometry, so they read the
      // district endpoint — without these cases they fell through to the
      // STATE branch below and every district came back unmatched (grey)
      case "REGION_CENTRAL":
      case "REGION_ENE":
      case "REGION_NW":
      case "REGION_SP":
      case "DISTRICT":
        return unified ? this.districtService.fetchDataFtp(payload)
          : aws ? this.districtService.fetchDataWithAWS(payload)
          : this.districtService.fetchData(payload);
      case "SUBDIVISION":
        return unified ? this.subdivisionService.fetchDataFtp(payload)
          : aws ? this.subdivisionService.fetchDataWithAWS(payload)
          : this.subdivisionService.fetchData(payload);
      case "REGION":
        return unified ? this.regionService.fetchDataFtp(payload)
          : aws ? this.regionService.fetchDataWithAWS(payload)
          : this.regionService.fetchData(payload);
      case "COUNTRY":
        return unified ? this.countryService.fetchDataFtp(payload)
          : aws ? this.countryService.fetchDataWithAWS(payload)
          : this.countryService.fetchData(payload);
      case "BLOCK":
        return unified ? this.blockService.fetchDataFtp(payload)
          : aws ? this.blockService.fetchDataWithAWS(payload)
          : this.blockService.fetchData(payload);
      case "STATE":
      default:
        return unified ? this.stateService.fetchDataFtp(payload)
          : aws ? this.stateService.fetchDataWithAWS(payload)
          : this.stateService.fetchData(payload);
    }
  }

  private country$(payload: any): Observable<any> {
    const selectedMode = JSON.parse(localStorage.getItem("selectedMode") || "{}");
    if (selectedMode?.selectedMode === "Unified") {
      return this.countryService.fetchDataFtp(payload);
    }
    return this.calcMode.isAwsEnabled
      ? this.countryService.fetchDataWithAWS(payload)
      : this.countryService.fetchData(payload);
  }

  private pick(row: any, keys: string[]): any {
    if (!row) return null;
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
    }
    return null;
  }

  /**
   * One of the six country-format sheets.
   *
   * `variant` only changes the map itself — the shading, the legend strip and
   * the label lines. The sheet furniture is identical, and the pdf/excel
   * exports are the same either way (the /all-maps-actual pages call the same
   * statistics services the departure pages do).
   */
  async buildLevel(
    level: RmuLevelKey,
    from: string,
    to: string,
    variant: RmuVariant = "DEPARTURE"
  ): Promise<RmuSheetVm> {
    const cfg = RMU_LEVELS[level];
    const geojson = await this.geojson(cfg.geojson);
    const payload = { startDate: from, endDate: to };

    let rows: any[] = [];
    try {
      const res: any = await firstValueFrom(this.levelData$(level, payload));
      rows = res?.data || [];
    } catch (err) {
      console.error(`[rmu-sheet-builder] ${level} data fetch failed`, err);
    }

    let allIndiaLine = "";
    if (cfg.allIndia) {
      try {
        const res: any = await firstValueFrom(this.country$(payload));
        const row = res?.data?.[0];
        allIndiaLine =
          `${this.geo.oneDecimal(row?.actual_rainfall)}   ` +
          `${this.geo.oneDecimal(row?.rainfall_normal_value)}      ` +
          `${this.geo.toInt(row?.departure)}%`;
      } catch {
        allIndiaLine = "";
      }
    }

    const features = (geojson?.features || []).filter((f: any) => this.geo.hasGeometry(f));
    const proj: RmuProjection = this.geo.buildProjection(features, cfg.bufferX, cfg.bufferY);

    const codeKey =
      cfg.dataKeys.find((k) => rows.some((r) => r?.[k] !== undefined)) || cfg.dataKeys[0];
    const byCode = new Map<string, any>();
    for (const row of rows) {
      if (codeKey && row?.[codeKey] !== undefined && row?.[codeKey] !== null) {
        byCode.set(String(row[codeKey]).trim(), row);
      }
    }

    const shapes: RmuSheetShape[] = features.map((feature: any) => {
      const shape = this.geo.buildShape(feature, proj);
      const name: string = shape.props[cfg.nameKey];
      const code = shape.props[cfg.featureKey];
      const row = cfg.dataKeys.length ? byCode.get(String(code).trim()) : rows[0];

      const rawDep = row?.departure;
      const dep =
        rawDep === null || rawDep === undefined || rawDep === "" || isNaN(Number(rawDep))
          ? -999
          : Math.round(Number(rawDep));

      const actualMm = Number(this.pick(row, cfg.actualKeys));
      const [ox, oy] = cfg.offsets?.[name] || [3, 3];
      return {
        path: shape.path,
        fill:
          variant === "ACTUAL"
            ? this.geo.colorForActual(isNaN(actualMm) ? null : actualMm)
            : this.geo.colorForDeparture(dep),
        labelX: shape.cx + ox * RmuSheetBuilderService.POINT,
        labelY: shape.cy - oy * RmuSheetBuilderService.POINT,
        actual: this.geo.oneDecimal(this.pick(row, cfg.actualKeys)),
        normal: this.geo.oneDecimal(this.pick(row, cfg.normalKeys)),
        departure: String(dep),
        abb: cfg.abbreviations?.[name] || name,
      };
    });

    return {
      config: cfg,
      shapes,
      viewBox: `0 0 ${proj.vbWidth} ${proj.vbHeight.toFixed(2)}`,
      periodLabel: this.periodLabel(from, to),
      allIndiaLine,
      variant,
      title:
        variant === "ACTUAL"
          ? cfg.title.replace("RAINFALL MAP", "ACTUAL RAINFALL MAP")
          : cfg.title,
      legend: variant === "ACTUAL" ? this.geo.actualLegendItems : this.geo.legendItems,
    };
  }

  private swColorFor(dep: number): string {
    if (dep >= 60) return SW_COLORS.largeExcess;
    if (dep >= 20) return SW_COLORS.excess;
    if (dep >= -19) return SW_COLORS.normal;
    if (dep >= -59) return SW_COLORS.deficient;
    if (dep >= -99) return SW_COLORS.largeDeficient;
    if (dep === -100) return SW_COLORS.noRain;
    return SW_COLORS.noData;
  }

  /** the district departure sheet for one MC / RMC */
  async buildMc(mcName: string, from: string, to: string): Promise<RmuStatewiseVm> {
    const entry = RMU_MC_LIST.find((m) => m.name === mcName);
    const title = `DISTRICT RAINFALL DEPARTURE MAP - ${mcName.toUpperCase()}`;
    const periodLabel =
      from === to
        ? `Day: ${this.geo.indianDate(to)}`
        : `Period: ${this.geo.indianDate(from)} To ${this.geo.indianDate(to)}`;

    if (!entry) {
      console.error(`[rmu-sheet-builder] unknown MC ${mcName}`);
      return { title, shapes: [], viewBox: "0 0 1000 1000", periodLabel };
    }

    // The MC files are already district level and pre-filtered to that centre,
    // so every feature in the file belongs on the sheet.
    const geojson = await this.geojson(entry.geojson);
    const features = (geojson?.features || []).filter((f: any) => this.geo.hasGeometry(f));
    const rows = await this.districtRows(from, to);
    return this.districtDepartureSheet(title, periodLabel, features, rows);
  }

  /** the district rows for a date range */
  private async districtRows(from: string, to: string): Promise<any[]> {
    try {
      const res: any = await firstValueFrom(
        this.levelData$("DISTRICT", { startDate: from, endDate: to })
      );
      return res?.data || [];
    } catch (err) {
      console.error("[rmu-sheet-builder] district data fetch failed", err);
      return [];
    }
  }

  /**
   * Shared by the statewise and MC sheets: both are the same product, a
   * district departure map over whatever set of districts is handed in.
   */
  private districtDepartureSheet(
    title: string,
    periodLabel: string,
    features: any[],
    rows: any[]
  ): RmuStatewiseVm {
    if (!features.length) {
      return { title, shapes: [], viewBox: "0 0 1000 1000", periodLabel };
    }

    const proj = this.geo.buildProjection(features, 0, 0, RmuSheetBuilderService.SW_SQUASH);

    const byCode = new Map<string, any>();
    for (const row of rows) {
      if (row?.district_code !== undefined && row?.district_code !== null) {
        byCode.set(String(row.district_code).trim(), row);
      }
    }

    const shapes: RmuStatewiseShape[] = features.map((feature: any) => {
      const shape = this.geo.buildShape(feature, proj);
      const row = byCode.get(String(shape.props.district_c).trim());

      const rawDep = row?.departure;
      const dep =
        rawDep === null || rawDep === undefined || rawDep === "" || isNaN(Number(rawDep))
          ? -999
          : Math.round(Number(rawDep));

      // Name comes from the API row; the geojson name is only a fallback.
      const name = String(row?.district_name ?? shape.props.district ?? "").toUpperCase();

      return {
        path: shape.path,
        fill: this.swColorFor(dep),
        labelX: shape.cx,
        labelY: shape.cy,
        name,
        departure: String(dep),
      };
    });

    return {
      title,
      shapes,
      viewBox: `0 0 ${proj.vbWidth} ${proj.vbHeight.toFixed(2)}`,
      periodLabel,
    };
  }

  /** the district departure sheet for one state */
  async buildStatewise(stateName: string, from: string, to: string): Promise<RmuStatewiseVm> {
    const geojson = await this.geojson("assets/geojson/INDIA_DISTRICT.json");
    const rows = await this.districtRows(from, to);
    const wanted = String(stateName).trim().toUpperCase();
    const features = (geojson?.features || []).filter(
      (f: any) =>
        this.geo.hasGeometry(f) &&
        String(f?.properties?.state || "").trim().toUpperCase() === wanted
    );

    const title = `DISTRICT RAINFALL DEPARTURE MAP - ${wanted}`;
    const periodLabel =
      from === to
        ? `Day: ${this.geo.indianDate(to)}`
        : `Period: ${this.geo.indianDate(from)} To ${this.geo.indianDate(to)}`;

    return this.districtDepartureSheet(title, periodLabel, features, rows);
  }
}
