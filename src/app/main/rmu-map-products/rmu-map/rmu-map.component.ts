import { Component, HostListener, OnInit, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";
import * as htmlToImage from "html-to-image";

import { RmuMapGeoService, RmuProjection } from "../rmu-map-geo.service";
import { RmuSheetComponent } from "../rmu-sheet/rmu-sheet.component";
import { RMU_LEVELS, RmuLevelConfig, RmuLevelKey } from "../rmu-map-levels";
import { DistrictService } from "src/app/services/district/district.service";
import { StateService } from "src/app/services/state/state.service";
import { SubdivisionService } from "src/app/services/subDivision/subDivision.service";
import { RegionService } from "src/app/services/region/region.service";
import { CountryService } from "src/app/services/country/country.service";
import { BlockService } from "src/app/services/block/BlockService.service";
import { CalculationsModeService } from "src/app/services/calculationsMode.service";
import { MapDataScheduleService } from "src/app/services/mapDataSchedule.service";

interface RmuShapeView {
  path: string;
  fill: string;
  labelX: number;
  labelY: number;
  actual: string;
  normal: string;
  departure: string;
  abb: string;
}

/**
 * The RMU map sheet, for every aggregation level.
 *
 * The layout is a 1:1 trace of the printed products in PRODUCTS/District
 * format/ (see the component css); the level comes from the route's
 * `data.level` and everything level-specific lives in rmu-map-levels.ts.
 *
 * These maps deliberately do not use Leaflet: the python originals are
 * matplotlib figures drawn in raw lon/lat, so RmuMapGeoService reproduces
 * that projection instead (web mercator would change every shape).
 */
@Component({
  selector: "app-rmu-map",
  templateUrl: "./rmu-map.component.html",
  styleUrls: ["./rmu-map.component.css"],
})
export class RmuMapComponent implements OnInit {
  /**
   * The python annotates at fontsize 5.5pt on an 8.29in figure and offsets
   * text by N typographic points. In the units of the projection (1000
   * across) that is a 9.7 unit font and 1.27 units per point.
   */
  private static readonly LABEL_FONT = 9.7;
  private static readonly POINT = 1.27;

  level: RmuLevelKey = "STATE";
  config: RmuLevelConfig = RMU_LEVELS.STATE;

  fromDate = "";
  toDate = "";
  isLoading = false;
  isDownloading = false;

  shapes: RmuShapeView[] = [];
  viewBox = "0 0 1000 1270";
  labelFont = RmuMapComponent.LABEL_FONT;
  labelLine = RmuMapComponent.LABEL_FONT * 1.2; // matplotlib linespacing
  legendItems = this.geo.legendItems;

  periodLabel = "";
  /** `{actual}   {normal}      {dep}%` — the python's literal-space layout */
  allIndiaLine = "";

  /** css scale that fits the fixed 1000px sheet into the viewport */
  sheetScale = 1;

  /** the rendered sheet, for html-to-image */
  @ViewChild(RmuSheetComponent) sheet?: RmuSheetComponent;

  private geojson: any = null;
  private rows: any[] = [];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private geo: RmuMapGeoService,
    private districtService: DistrictService,
    private stateService: StateService,
    private subdivisionService: SubdivisionService,
    private regionService: RegionService,
    private countryService: CountryService,
    private blockService: BlockService,
    private calcMode: CalculationsModeService,
    private mapDataScheduleService: MapDataScheduleService
  ) {}

  ngOnInit(): void {
    this.updateSheetScale();

    // A different level means different geometry and a different endpoint, so
    // react to param changes rather than only reading them once.
    this.route.data.subscribe((data) => {
      this.level = (data["level"] as RmuLevelKey) || "STATE";
      this.config = RMU_LEVELS[this.level];
      this.geojson = null;
      this.shapes = [];
      this.resolveDatesThenLoad();
    });
  }

  private resolveDatesThenLoad(): void {
    if (this.fromDate && this.toDate) {
      this.loadGeojsonThenData();
      return;
    }

    // Same held-back-date rule the other map pages use: today only once this
    // role's data is published, otherwise yesterday.
    const loggedInUser = JSON.parse(localStorage.getItem("isAuthorised") || "{}");
    const role = loggedInUser?.data?.[0]?.mcorhq;

    const start = (effective: Date) => {
      this.fromDate = this.isoDate(effective);
      this.toDate = this.isoDate(effective);
      this.loadGeojsonThenData();
    };

    if (role) {
      this.mapDataScheduleService.getEffectiveLatestDate(role).subscribe({
        next: (effective: Date) => start(effective),
        error: () => start(new Date()),
      });
    } else {
      start(new Date());
    }
  }

  @HostListener("window:resize")
  updateSheetScale(): void {
    // 1000px sheet + a little breathing room on either side
    const available = Math.min(window.innerWidth - 60, 1000);
    this.sheetScale = Math.max(0.3, available / 1000);
  }

  onSubmit(): void {
    this.fetchData();
  }

  // ---- data ---------------------------------------------------------------
  private loadGeojsonThenData(): void {
    this.isLoading = true;
    const url = this.config.geojson;
    this.http.get(url).subscribe({
      next: (res: any) => {
        this.geojson = res;
        this.fetchData();
      },
      error: (err) => {
        console.error(`[rmu-map] could not load ${url}`, err);
        this.isLoading = false;
      },
    });
  }

  /** the level's own endpoint, honouring Unified / AWS / data-entry mode */
  private levelData$(payload: any): Observable<any> {
    const selectedMode = JSON.parse(localStorage.getItem("selectedMode") || "{}");
    const unified = selectedMode?.selectedMode === "Unified";
    const aws = this.calcMode.isAwsEnabled;

    switch (this.level) {
      case "DISTRICT":
        return unified
          ? this.districtService.fetchDataFtp(payload)
          : aws
          ? this.districtService.fetchDataWithAWS(payload)
          : this.districtService.fetchData(payload);
      case "SUBDIVISION":
        return unified
          ? this.subdivisionService.fetchDataFtp(payload)
          : aws
          ? this.subdivisionService.fetchDataWithAWS(payload)
          : this.subdivisionService.fetchData(payload);
      case "REGION":
        return unified
          ? this.regionService.fetchDataFtp(payload)
          : aws
          ? this.regionService.fetchDataWithAWS(payload)
          : this.regionService.fetchData(payload);
      case "COUNTRY":
        return unified
          ? this.countryService.fetchDataFtp(payload)
          : aws
          ? this.countryService.fetchDataWithAWS(payload)
          : this.countryService.fetchData(payload);
      case "BLOCK":
        return unified
          ? this.blockService.fetchDataFtp(payload)
          : aws
          ? this.blockService.fetchDataWithAWS(payload)
          : this.blockService.fetchData(payload);
      case "STATE":
      default:
        return unified
          ? this.stateService.fetchDataFtp(payload)
          : aws
          ? this.stateService.fetchDataWithAWS(payload)
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

  private fetchData(): void {
    if (!this.geojson) {
      this.loadGeojsonThenData();
      return;
    }
    this.isLoading = true;
    const payload = { startDate: this.fromDate, endDate: this.toDate };

    this.levelData$(payload).subscribe({
      next: (res: any) => {
        this.rows = res?.data || [];
        this.buildMap();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(`[rmu-map] ${this.level} data fetch failed`, err);
        this.rows = [];
        this.buildMap();
        this.isLoading = false;
      },
    });

    if (this.config.allIndia) {
      this.country$(payload).subscribe({
        next: (res: any) => {
          const row = res?.data?.[0];
          const act = this.geo.oneDecimal(row?.actual_rainfall);
          const nor = this.geo.oneDecimal(row?.rainfall_normal_value);
          const dep = this.geo.toInt(row?.departure);
          this.allIndiaLine = `${act}   ${nor}      ${dep}%`;
        },
        error: () => {
          this.allIndiaLine = "";
        },
      });
    }

    this.periodLabel =
      this.fromDate === this.toDate
        ? `Date:${this.geo.indianDate(this.toDate)}`
        : `Period: ${this.geo.indianDate(this.fromDate)} to ${this.geo.indianDate(
            this.toDate
          )}`;
  }

  /** first API field that actually carries a value */
  private pick(row: any, keys: string[]): any {
    if (!row) return null;
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
        return row[key];
      }
    }
    return null;
  }

  // ---- rendering ----------------------------------------------------------
  private buildMap(): void {
    const cfg = this.config;
    const all: any[] = this.geojson.features || [];
    // geometry: null features would break the path builder — see
    // RmuMapGeoService.hasGeometry()
    const features = all.filter((f) => this.geo.hasGeometry(f));
    if (features.length !== all.length) {
      console.warn(
        `[rmu-map] ${this.level}: ${all.length - features.length} feature(s) in ` +
          `${cfg.geojson} have no geometry and are not drawn`
      );
    }
    const proj: RmuProjection = this.geo.buildProjection(
      features,
      cfg.bufferX,
      cfg.bufferY
    );
    this.viewBox = `0 0 ${proj.vbWidth} ${proj.vbHeight.toFixed(2)}`;

    // Which API field carries the join code — probed once against a real row
    // because the endpoints are not consistent about it (s_code, region_code,
    // district_code ...).
    const codeKey =
      cfg.dataKeys.find((k) => this.rows.some((r) => r?.[k] !== undefined)) ||
      cfg.dataKeys[0];

    const byCode = new Map<string, any>();
    for (const row of this.rows) {
      if (codeKey && row?.[codeKey] !== undefined && row?.[codeKey] !== null) {
        byCode.set(String(row[codeKey]).trim(), row);
      }
    }

    this.shapes = features.map((feature: any) => {
      const shape = this.geo.buildShape(feature, proj);
      const name: string = shape.props[cfg.nameKey];
      const code = shape.props[cfg.featureKey];

      // COUNTRY has a single feature and a single row, so there is nothing to
      // join on — take the one row straight.
      const row = cfg.dataKeys.length
        ? byCode.get(String(code).trim())
        : this.rows[0];

      // python: Dep is written to the sheet as a rounded int, then binned
      const rawDep = row?.departure;
      const dep =
        rawDep === null || rawDep === undefined || rawDep === "" || isNaN(Number(rawDep))
          ? -999
          : Math.round(Number(rawDep));

      const [ox, oy] = cfg.offsets?.[name] || [3, 3];

      return {
        path: shape.path,
        fill: this.geo.colorForDeparture(dep),
        labelX: shape.cx + ox * RmuMapComponent.POINT,
        labelY: shape.cy - oy * RmuMapComponent.POINT,
        actual: this.geo.oneDecimal(this.pick(row, cfg.actualKeys)),
        normal: this.geo.oneDecimal(this.pick(row, cfg.normalKeys)),
        departure: String(dep),
        abb: cfg.abbreviations?.[name] || name,
      };
    });
  }

  /** first label line: `2.1 (-18%)` */
  actualLine(shape: RmuShapeView): string {
    return `${shape.actual} (${shape.departure}%)`;
  }

  // ---- download -----------------------------------------------------------
  async downloadImage(): Promise<void> {
    const sheet = this.sheet?.sheetRef?.nativeElement;
    if (!sheet) return;

    this.isDownloading = true;
    try {
      const scale = 4; // 4000px wide, close to the 3958px printed product
      const dataUrl = await htmlToImage.toJpeg(sheet, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        width: 1000 * scale,
        height: (this.sheet?.sheetHeight || 1261) * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        },
      });
      const link = document.createElement("a");
      link.download = `${this.config.fileName}_${this.fromDate}_${this.toDate}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("[rmu-map] download failed", err);
    }
    this.isDownloading = false;
  }

  private isoDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${date.getFullYear()}-${m}-${d}`;
  }
}
