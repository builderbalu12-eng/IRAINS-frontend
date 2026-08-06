import { Component, HostListener, OnInit, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import * as htmlToImage from "html-to-image";

import { RmuMapGeoService } from "../rmu-map-geo.service";
import { RmuStatewiseSheetComponent } from "../rmu-statewise-sheet/rmu-statewise-sheet.component";
import { DistrictService } from "src/app/services/district/district.service";
import { getStateService } from "src/app/services/state/getState.service";
import { CalculationsModeService } from "src/app/services/calculationsMode.service";
import { MapDataScheduleService } from "src/app/services/mapDataSchedule.service";

interface DistrictShape {
  path: string;
  fill: string;
  labelX: number;
  labelY: number;
  name: string;
  departure: string;
}

/**
 * STATE WISE DISTRICT RAINFALL DEPARTURE MAP — the browser port of
 * StatewiseDistrictMap_iRAINS.py, which prints one sheet per state.
 *
 * Reference output: PRODUCTS/state format/DISTRICT_RAINFALL_MAP_state_code_*_c.jpg
 *
 * The state list and every district name come from the API, upper-cased for
 * the sheet — nothing about either is hardcoded here. The geojson is only the
 * source of geometry; features are matched to API rows on the district code.
 */
@Component({
  selector: "app-rmu-statewise-map",
  templateUrl: "./rmu-statewise-map.component.html",
  styleUrls: ["./rmu-statewise-map.component.css"],
})
export class RmuStatewiseMapComponent implements OnInit {
  /**
   * The python labels at fontsize 12 on a 12in/300dpi figure. That is 50px of
   * a 3600px render, but savefig(bbox_inches="tight") then crops the figure
   * down to its content, so the label ends up a much larger fraction of the
   * drawn map — measured against the printed sheets it is ~2.3% of the map
   * width, i.e. 23 units in the projection's 1000 unit space.
   */
  private static readonly LABEL_FONT = 23;

  /**
   * StatewiseDistrictMap_iRAINS.py has its own palette — close to the country
   * sheets but not the same hexes, so it is kept separate on purpose.
   */
  private static readonly COLORS = {
    largeExcess: "#0099ff",
    excess: "#66cbff",
    normal: "#5de360",
    deficient: "#ff5a00",
    largeDeficient: "#ffff00",
    noRain: "#ffffff",
    noData: "#c0c0c0",
  };

  readonly legendItems = [
    { color: RmuStatewiseMapComponent.COLORS.largeExcess, text: "Large Excess [ 60% or more]" },
    { color: RmuStatewiseMapComponent.COLORS.excess, text: "Excess [ 20% to 59%]" },
    { color: RmuStatewiseMapComponent.COLORS.normal, text: "Normal [-19% to 19%]" },
    { color: RmuStatewiseMapComponent.COLORS.deficient, text: "Deficient [-59% to -20%]" },
    { color: RmuStatewiseMapComponent.COLORS.largeDeficient, text: "Large Deficient [-99% to -60%]" },
    { color: RmuStatewiseMapComponent.COLORS.noRain, text: "No Rain  [-100%]" },
    { color: RmuStatewiseMapComponent.COLORS.noData, text: "No Data" },
  ];

  fromDate = "";
  toDate = "";
  isLoading = false;
  isDownloading = false;

  /** every state the API knows about, in the API's own spelling */
  states: string[] = [];
  selectedState = "";

  shapes: DistrictShape[] = [];
  viewBox = "0 0 1000 1000";
  labelFont = RmuStatewiseMapComponent.LABEL_FONT;
  labelLine = RmuStatewiseMapComponent.LABEL_FONT * 1.2;
  periodLabel = "";
  sheetScale = 1;

  get titleText(): string {
    return `DISTRICT RAINFALL DEPARTURE MAP - ${(this.selectedState || "").toUpperCase()}`;
  }

  /** the rendered sheet, for html-to-image */
  @ViewChild(RmuStatewiseSheetComponent) sheet?: RmuStatewiseSheetComponent;

  private geojson: any = null;
  private rows: any[] = [];

  constructor(
    private http: HttpClient,
    private geo: RmuMapGeoService,
    private districtService: DistrictService,
    private stateListService: getStateService,
    private calcMode: CalculationsModeService,
    private mapDataScheduleService: MapDataScheduleService
  ) {}

  ngOnInit(): void {
    this.updateSheetScale();

    // Held-back rule, same as the other map pages: today only once this
    // role's data is published, otherwise yesterday.
    const loggedInUser = JSON.parse(localStorage.getItem("isAuthorised") || "{}");
    const role = loggedInUser?.data?.[0]?.mcorhq;

    const start = (effective: Date) => {
      this.fromDate = this.isoDate(effective);
      this.toDate = this.isoDate(effective);
      this.loadStates();
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
    const available = Math.min(window.innerWidth - 60, 1000);
    this.sheetScale = Math.max(0.3, available / 1000);
  }

  onSubmit(): void {
    this.fetchData();
  }

  onStateChange(): void {
    this.buildMap();
  }

  // ---- data ---------------------------------------------------------------
  /** state list straight from the API; the geojson is only a fallback */
  private loadStates(): void {
    this.stateListService.fetchData().subscribe({
      next: (res: any) => {
        const names = (res?.data || [])
          .map((row: any) => row?.state_name ?? row?.state ?? row?.name)
          .filter((n: any) => !!n)
          .map((n: string) => String(n).trim());
        this.states = Array.from(new Set<string>(names)).sort();
        if (!this.selectedState && this.states.length) {
          this.selectedState = this.states[0];
          this.buildMap();
        }
      },
      error: (err) => {
        console.error("[rmu-statewise-map] state list fetch failed", err);
        this.statesFromGeojson();
      },
    });
  }

  private statesFromGeojson(): void {
    if (!this.geojson) return;
    const names = (this.geojson.features || [])
      .map((f: any) => f?.properties?.state)
      .filter((n: any) => !!n);
    this.states = Array.from(new Set<string>(names)).sort();
    if (!this.selectedState && this.states.length) {
      this.selectedState = this.states[0];
      this.buildMap();
    }
  }

  private loadGeojsonThenData(): void {
    this.isLoading = true;
    this.http.get("assets/geojson/INDIA_DISTRICT.json").subscribe({
      next: (res: any) => {
        this.geojson = res;
        if (!this.states.length) this.statesFromGeojson();
        this.fetchData();
      },
      error: (err) => {
        console.error("[rmu-statewise-map] could not load INDIA_DISTRICT.json", err);
        this.isLoading = false;
      },
    });
  }

  private district$(payload: any): Observable<any> {
    const selectedMode = JSON.parse(localStorage.getItem("selectedMode") || "{}");
    if (selectedMode?.selectedMode === "Unified") {
      return this.districtService.fetchDataFtp(payload);
    }
    return this.calcMode.isAwsEnabled
      ? this.districtService.fetchDataWithAWS(payload)
      : this.districtService.fetchData(payload);
  }

  private fetchData(): void {
    if (!this.geojson) {
      this.loadGeojsonThenData();
      return;
    }
    this.isLoading = true;

    this.district$({ startDate: this.fromDate, endDate: this.toDate }).subscribe({
      next: (res: any) => {
        this.rows = res?.data || [];
        this.buildMap();
        this.isLoading = false;
      },
      error: (err) => {
        console.error("[rmu-statewise-map] district data fetch failed", err);
        this.rows = [];
        this.buildMap();
        this.isLoading = false;
      },
    });

    // python: "Day: dd-mm-yyyy" for a single date, otherwise a period
    this.periodLabel =
      this.fromDate === this.toDate
        ? `Day: ${this.geo.indianDate(this.toDate)}`
        : `Period: ${this.geo.indianDate(this.fromDate)} To ${this.geo.indianDate(
            this.toDate
          )}`;
  }

  /** StatewiseDistrictMap_iRAINS.py's own bins, on the rounded DepF value */
  private colorFor(dep: number): string {
    const C = RmuStatewiseMapComponent.COLORS;
    if (dep >= 60) return C.largeExcess;
    if (dep >= 20) return C.excess;
    if (dep >= -19) return C.normal;
    if (dep >= -59) return C.deficient;
    if (dep >= -99) return C.largeDeficient;
    if (dep === -100) return C.noRain;
    return C.noData;
  }

  // ---- rendering ----------------------------------------------------------
  private buildMap(): void {
    if (!this.geojson || !this.selectedState) return;

    const wanted = this.selectedState.trim().toUpperCase();
    const features = (this.geojson.features || []).filter(
      (f: any) =>
        this.geo.hasGeometry(f) &&
        String(f?.properties?.state || "").trim().toUpperCase() === wanted
    );

    if (!features.length) {
      this.shapes = [];
      return;
    }

    // No buffer: the python fits the state's own extent to the frame. The 0.9
    // is StatewiseDistrictMap_iRAINS.py's deliberate vertical squash
    // (new_height = ... * scale_factor * 0.9).
    const proj = this.geo.buildProjection(features, 0, 0, 0.9);
    this.viewBox = `0 0 ${proj.vbWidth} ${proj.vbHeight.toFixed(2)}`;

    const byCode = new Map<string, any>();
    for (const row of this.rows) {
      if (row?.district_code !== undefined && row?.district_code !== null) {
        byCode.set(String(row.district_code).trim(), row);
      }
    }

    this.shapes = features.map((feature: any) => {
      const shape = this.geo.buildShape(feature, proj);
      const row = byCode.get(String(shape.props.district_c).trim());

      const rawDep = row?.departure;
      const dep =
        rawDep === null || rawDep === undefined || rawDep === "" || isNaN(Number(rawDep))
          ? -999
          : Math.round(Number(rawDep));

      // Name comes from the API row; the geojson name is only a fallback for
      // districts the API did not return. Upper-cased either way.
      const name = String(
        row?.district_name ?? shape.props.district ?? ""
      ).toUpperCase();

      return {
        path: shape.path,
        fill: this.colorFor(dep),
        labelX: shape.cx,
        labelY: shape.cy,
        name,
        departure: String(dep),
      };
    });
  }

  // ---- download -----------------------------------------------------------
  async downloadImage(): Promise<void> {
    const sheet = this.sheet?.sheetRef?.nativeElement;
    if (!sheet) return;

    this.isDownloading = true;
    try {
      const scale = 3; // 3000px wide against the 2400px printed product
      const dataUrl = await htmlToImage.toJpeg(sheet, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        width: 1000 * scale,
        height: (this.sheet?.sheetHeight || 1400) * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        },
      });
      const link = document.createElement("a");
      const state = (this.selectedState || "STATE").toUpperCase();
      link.download = `DISTRICT_RAINFALL_MAP_state_code_${state}_${this.fromDate}_${this.toDate}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("[rmu-statewise-map] download failed", err);
    }
    this.isDownloading = false;
  }

  private isoDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${date.getFullYear()}-${m}-${d}`;
  }
}
