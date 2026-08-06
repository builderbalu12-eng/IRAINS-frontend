import { Component, OnInit, ViewChild } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import * as htmlToImage from "html-to-image";
import * as JSZip from "jszip";
import * as FileSaver from "file-saver";

import { RmuSheetBuilderService } from "../rmu-map-products/rmu-sheet-builder.service";
import { RmuSheetComponent } from "../rmu-map-products/rmu-sheet/rmu-sheet.component";
import { RmuStatewiseSheetComponent } from "../rmu-map-products/rmu-statewise-sheet/rmu-statewise-sheet.component";
import { RMU_LEVELS, RmuLevelKey } from "../rmu-map-products/rmu-map-levels";
import { RMU_MC_LIST } from "../rmu-map-products/rmu-mc-list";
import { RmuVariant } from "../rmu-map-products/rmu-sheet-builder.service";
import { DownloadPdf } from "src/app/services/district/pdfdownload.service";
import { DownloadPdf as BlockDownloadPdf } from "src/app/services/block/pdfdownload.service";
import { DownloadPdfStateDistrict } from "src/app/services/district/states/districtStatesDownload.service";
import { StateDownloadStatistics } from "src/app/services/state/statisticsdownload.service";
import { SubdivDownloadStatistics } from "src/app/services/subDivision/statisticsdownload.service";
import { RegionDownloadStatistics } from "src/app/services/region/downloadStatisticsRegion.service";
import { CountryDownloadStatistics } from "src/app/services/country/pdfStatisticsDownloadCountry.service";
import { StateService } from "src/app/services/state/state.service";
import { MapDataScheduleService } from "src/app/services/mapDataSchedule.service";
import { DownloadPdfRegionDistrict } from "src/app/services/district/regions/districtRegionsDownload.service";
import { MCRMCDownloadStatistics } from "src/app/services/MC-RMCs/mcRmc.pdfService";
import {
  DownloadCaptureService,
  CapturedFile,
} from "src/app/services/downloadCapture.service";
import {
  AllStatisticsService,
  DefaultSelectionItem,
} from "src/app/services/allStatistics.service";

export type StatScope = "DRMS" | "REGIONAL" | "BRMS" | "STATE" | "MC";

export interface StatRow {
  /** stable id, also the level key for the map sheets */
  key: string;
  label: string;
  scope: StatScope;
  /** an RMU map sheet exists for this row */
  hasMap: boolean;
  /** a pdf + excel statistics export exists for this row */
  hasDoc: boolean;
  mapSelected: boolean;
  docSelected: boolean;
}

export interface StatSection {
  key: StatScope;
  title: string;
  subtitle: string;
  icon: string;
  rows: StatRow[];
  expanded: boolean;
  /** long sections render as a compact grid instead of a full-width table */
  grid?: boolean;
}

/**
 * ALL STATISTICS — one console for every RMU product over a chosen date
 * range: preview any sheet, download them one at a time, or tick what you
 * want and pull the lot down in one go.
 *
 * UI ONLY at this stage. The selection model, the section/global select-all
 * logic and the preview switching are all live; the download handlers and the
 * preview renderer are stubs (see downloadsWired) and get wired to the RMU
 * sheet components and the existing pdf/excel services in the next step.
 */
@Component({
  selector: "app-all-statistics",
  templateUrl: "./all-statistics.component.html",
  styleUrls: ["./all-statistics.component.css"],
})
export class AllStatisticsComponent implements OnInit {
  readonly downloadsWired = true;

  /**
   * Departure or actual rainfall. Only the maps differ — the shading, legend
   * and labels — so the pdf/excel exports are the same on both tabs (the
   * /all-maps-actual pages call the same statistics services).
   */
  variant: RmuVariant = "DEPARTURE";

  setVariant(next: RmuVariant): void {
    this.variant = next;
  }

  /** the off-screen sheets used to render a map before capturing it */
  @ViewChild(RmuSheetComponent) sheet?: RmuSheetComponent;
  @ViewChild(RmuStatewiseSheetComponent) swSheet?: RmuStatewiseSheetComponent;

  /** bindings for the hidden country-format sheet */
  sheetVm: any = null;
  /** bindings for the hidden statewise sheet */
  swVm: any = null;
  labelFont = this.builder.labelFont;
  labelLine = this.builder.labelLine;
  swLabelFont = this.builder.swLabelFont;
  swLabelLine = this.builder.swLabelLine;

  /** which row is downloading right now, so the row can show a spinner */
  busyKey = "";
  batchTotal = 0;
  batchDone = 0;

  /** saving/loading the default tick state is live */
  savingSelection = false;
  loadingSelection = false;
  hasSavedSelection = false;

  /** what the pickers currently hold */
  fromDate = "";
  toDate = "";

  /**
   * The range Apply committed. Downloads use these, not the pickers, so
   * editing a date without pressing Apply cannot silently change what a
   * download produces.
   */
  appliedFrom = "";
  appliedTo = "";

  sections: StatSection[] = [
    {
      key: "DRMS",
      title: "DRMS",
      subtitle: "District Rainfall Monitoring Scheme — district through region",
      icon: "bi-map",
      expanded: true,
      rows: [
        this.row("DISTRICT", "District Rainfall Map", "DRMS"),
        this.row("STATE", "State Rainfall Map", "DRMS"),
        this.row("SUBDIVISION", "Subdivision Rainfall Map", "DRMS"),
        this.row("REGION", "Homogenous Region Rainfall Map", "DRMS"),
        this.row("COUNTRY", "Country Rainfall Map", "DRMS"),
      ],
    },
    {
      key: "REGIONAL",
      title: "Regional Districts",
      subtitle:
        "District departure sheet for each of the four homogenous regions",
      icon: "bi-bounding-box",
      expanded: true,
      rows: [
        this.row("REGION_CENTRAL", "Central India", "REGIONAL"),
        this.row("REGION_ENE", "East & North East India", "REGIONAL"),
        this.row("REGION_NW", "North West India", "REGIONAL"),
        this.row("REGION_SP", "South Peninsula", "REGIONAL"),
      ],
    },
    {
      key: "BRMS",
      title: "BRMS",
      subtitle: "Block Rainfall Monitoring Scheme",
      icon: "bi-grid-3x3",
      expanded: true,
      rows: [this.row("BLOCK", "Block Rainfall Map", "BRMS")],
    },
    {
      key: "MC",
      title: "MC / RMC Maps",
      subtitle: "District departure sheet for every meteorological centre",
      icon: "bi-broadcast-pin",
      expanded: true,
      grid: true,
      rows: RMU_MC_LIST.map((mc) => this.row(mc.name, mc.name, "MC")),
    },
    {
      key: "STATE",
      title: "State Maps",
      subtitle: "District rainfall departure sheet for every state",
      icon: "bi-pin-map",
      expanded: true,
      grid: true,
      rows: [],
    },
  ];

  statusMessage = "";

  constructor(
    private http: HttpClient,
    private allStats: AllStatisticsService,
    private builder: RmuSheetBuilderService,
    private districtDoc: DownloadPdf,
    private blockDoc: BlockDownloadPdf,
    private stateDistrictDoc: DownloadPdfStateDistrict,
    private stateDoc: StateDownloadStatistics,
    private subdivDoc: SubdivDownloadStatistics,
    private regionDoc: RegionDownloadStatistics,
    private countryDoc: CountryDownloadStatistics,
    private stateService: StateService,
    private regionDistrictDoc: DownloadPdfRegionDistrict,
    private mcDoc: MCRMCDownloadStatistics,
    private capture: DownloadCaptureService,
    private mapDataScheduleService: MapDataScheduleService
  ) {}

  ngOnInit(): void {
    // Held-back publish rule, same as every other map page: today only once
    // this role's data is published, otherwise yesterday.
    const loggedInUser = JSON.parse(localStorage.getItem("isAuthorised") || "{}");
    const role = loggedInUser?.data?.[0]?.mcorhq;

    const startWith = (effective: Date) => {
      this.toDate = this.isoDate(effective);
      this.fromDate = this.isoDate(effective);
      this.appliedFrom = this.fromDate;
      this.appliedTo = this.toDate;
    };

    if (role) {
      this.mapDataScheduleService.getEffectiveLatestDate(role).subscribe({
        next: (effective: Date) => startWith(effective),
        error: () => startWith(new Date()),
      });
    } else {
      startWith(new Date());
    }

    // loadStateRows fills the STATE section, so the saved ticks are applied
    // from inside its callback — otherwise the state rows do not exist yet.
    this.loadStateRows();
  }

  private row(key: string, label: string, scope: StatScope): StatRow {
    return {
      key,
      label,
      scope,
      hasMap: true,
      hasDoc: true,
      mapSelected: false,
      docSelected: false,
    };
  }

  /**
   * TEMPORARY: the state list is read off the district geojson so the section
   * renders something reviewable. On integration this switches to the API
   * (getAllStates) exactly like rmu-statewise-map does, names upper-cased.
   */
  private loadStateRows(): void {
    this.http.get("assets/geojson/INDIA_DISTRICT.json").subscribe({
      next: (res: any) => {
        const names: string[] = Array.from(
          new Set<string>(
            (res?.features || [])
              .map((f: any) => f?.properties?.state)
              .filter((n: any) => !!n)
          )
        ).sort();
        const section = this.sections.find((s) => s.key === "STATE");
        if (section) {
          section.rows = names.map((n) => this.row(n, n.toUpperCase(), "STATE"));
        }
        this.loadSavedSelection();
      },
      error: () => {
        // section stays empty; the DRMS/BRMS ticks can still be restored
        this.loadSavedSelection();
      },
    });
  }

  // ---- saved default selection -------------------------------------------
  /** apply whatever this user ticked last time they pressed Save Selection */
  private loadSavedSelection(): void {
    const username = this.allStats.currentUsername();
    if (!username) return;

    this.loadingSelection = true;
    this.allStats.getDefaultSelection(username).subscribe({
      next: (res: any) => {
        const saved: DefaultSelectionItem[] = res?.data || [];
        const byId = new Map<string, DefaultSelectionItem>();
        saved.forEach((it) => byId.set(`${it.scope}::${it.key}`, it));

        this.allRows.forEach((row) => {
          const hit = byId.get(`${row.scope}::${row.key}`);
          row.mapSelected = !!hit?.map;
          row.docSelected = !!hit?.doc;
        });

        this.hasSavedSelection = saved.length > 0;
        this.loadingSelection = false;
      },
      error: (err) => {
        console.error("[all-statistics] could not load saved selection", err);
        this.loadingSelection = false;
      },
    });
  }

  /** the current ticks, in the shape the API stores */
  private currentSelectionItems(): DefaultSelectionItem[] {
    return this.allRows
      .filter((r) => r.mapSelected || r.docSelected)
      .map((r) => ({
        scope: r.scope,
        key: r.key,
        map: r.mapSelected,
        doc: r.docSelected,
      }));
  }

  saveSelection(): void {
    const username = this.allStats.currentUsername();
    if (!username) {
      this.flash("Not signed in — cannot save a selection.");
      return;
    }

    const items = this.currentSelectionItems();
    this.savingSelection = true;
    this.allStats.saveDefaultSelection(username, items).subscribe({
      next: (res: any) => {
        this.hasSavedSelection = items.length > 0;
        this.savingSelection = false;
        this.flash(res?.message || "Selection saved");
      },
      error: (err) => {
        console.error("[all-statistics] save selection failed", err);
        this.savingSelection = false;
        this.flash("Could not save the selection.");
      },
    });
  }

  clearSavedSelection(): void {
    const username = this.allStats.currentUsername();
    if (!username) return;

    this.savingSelection = true;
    this.allStats.clearDefaultSelection(username).subscribe({
      next: () => {
        this.hasSavedSelection = false;
        this.savingSelection = false;
        this.flash("Saved selection cleared");
      },
      error: (err) => {
        console.error("[all-statistics] clear selection failed", err);
        this.savingSelection = false;
        this.flash("Could not clear the saved selection.");
      },
    });
  }

  // ---- selection ----------------------------------------------------------
  get allRows(): StatRow[] {
    return this.sections.reduce<StatRow[]>((acc, s) => acc.concat(s.rows), []);
  }

  get selectedMapCount(): number {
    return this.allRows.filter((r) => r.mapSelected).length;
  }

  get selectedDocCount(): number {
    return this.allRows.filter((r) => r.docSelected).length;
  }

  get totalSelected(): number {
    return this.selectedMapCount + this.selectedDocCount;
  }

  sectionMapsAll(section: StatSection): boolean {
    const rows = section.rows.filter((r) => r.hasMap);
    return rows.length > 0 && rows.every((r) => r.mapSelected);
  }

  sectionMapsSome(section: StatSection): boolean {
    const rows = section.rows.filter((r) => r.hasMap);
    return rows.some((r) => r.mapSelected) && !this.sectionMapsAll(section);
  }

  sectionDocsAll(section: StatSection): boolean {
    const rows = section.rows.filter((r) => r.hasDoc);
    return rows.length > 0 && rows.every((r) => r.docSelected);
  }

  sectionDocsSome(section: StatSection): boolean {
    const rows = section.rows.filter((r) => r.hasDoc);
    return rows.some((r) => r.docSelected) && !this.sectionDocsAll(section);
  }

  toggleSectionMaps(section: StatSection): void {
    const next = !this.sectionMapsAll(section);
    section.rows.filter((r) => r.hasMap).forEach((r) => (r.mapSelected = next));
  }

  toggleSectionDocs(section: StatSection): void {
    const next = !this.sectionDocsAll(section);
    section.rows.filter((r) => r.hasDoc).forEach((r) => (r.docSelected = next));
  }

  sectionSelectedCount(section: StatSection): number {
    return section.rows.filter((r) => r.mapSelected || r.docSelected).length;
  }

  selectEverything(): void {
    this.allRows.forEach((r) => {
      r.mapSelected = r.hasMap;
      r.docSelected = r.hasDoc;
    });
  }

  clearEverything(): void {
    this.allRows.forEach((r) => {
      r.mapSelected = false;
      r.docSelected = false;
    });
  }

  /** what a row will actually produce, shown in the table */
  outputHint(row: StatRow): string {
    const parts: string[] = [];
    if (this.mapAvailable(row)) parts.push("JPG");
    if (row.hasDoc) parts.push("PDF + XLSX");
    return parts.join("  ·  ") || "—";
  }

  /**
   * The statewise sheet is a departure product (StatewiseDistrictMap_iRAINS.py
   * has no actual variant), so its map is unavailable on the actual tab. Its
   * pdf/excel still is, because that export is variant independent.
   */
  mapAvailable(row: StatRow): boolean {
    if (!row.hasMap) return false;
    if (row.scope === "STATE" || row.scope === "MC") {
      return this.variant === "DEPARTURE";
    }
    return true;
  }

  /** the range shown next to the selection counters */
  get periodCaption(): string {
    if (!this.appliedCaption) return "";
    return this.appliedFrom === this.appliedTo
      ? `Date: ${this.appliedCaption}`
      : `Period: ${this.appliedCaption}`;
  }

  // ---- downloads ----------------------------------------------------------
  onApply(): void {
    this.appliedFrom = this.fromDate;
    this.appliedTo = this.toDate;
    this.flash(`Applied ${this.appliedCaption}`);
  }

  /** true while the pickers hold something Apply has not committed yet */
  get hasPendingDates(): boolean {
    return this.fromDate !== this.appliedFrom || this.toDate !== this.appliedTo;
  }

  /** the applied range, as printed on the page and on every sheet */
  get appliedCaption(): string {
    if (!this.appliedFrom || !this.appliedTo) return "";
    const d = (iso: string) => iso.split("-").reverse().join("-");
    return this.appliedFrom === this.appliedTo
      ? d(this.appliedTo)
      : `${d(this.appliedFrom)} to ${d(this.appliedTo)}`;
  }

  /** let Angular paint the off-screen sheet before html-to-image reads it */
  private settle(ms = 120): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private fileStamp(): string {
    return this.appliedFrom === this.appliedTo
      ? this.appliedFrom
      : `${this.appliedFrom}_${this.appliedTo}`;
  }

  /**
   * Render a row's sheet off-screen and return it as a JPEG data url.
   * The sheet is bound at scale 1 so the capture is the full 1000px layout
   * regardless of the viewport.
   */
  private async renderMap(row: StatRow): Promise<{ name: string; dataUrl: string } | null> {
    if (row.scope === "STATE" || row.scope === "MC") {
      this.swVm =
        row.scope === "MC"
          ? await this.builder.buildMc(row.key, this.appliedFrom, this.appliedTo)
          : await this.builder.buildStatewise(row.key, this.appliedFrom, this.appliedTo);
      await this.settle();
      const el = this.swSheet?.sheetRef?.nativeElement;
      if (!el) return null;
      const dataUrl = await htmlToImage.toJpeg(el, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        width: 1000 * 3,
        height: (this.swSheet!.sheetHeight) * 3,
        style: { transform: "scale(3)", transformOrigin: "top left" },
      });
      this.swVm = null;
      const scopeTag = row.scope === "MC" ? "mc_code" : "state_code";
      const safeKey = row.key.toUpperCase().replace(/[\\/:*?"<>|]/g, "_");
      return {
        name: `DISTRICT_RAINFALL_MAP_${scopeTag}_${safeKey}_${this.fileStamp()}.jpg`,
        dataUrl,
      };
    }

    this.sheetVm = await this.builder.buildLevel(
      row.key as RmuLevelKey,
      this.appliedFrom,
      this.appliedTo,
      this.variant
    );
    await this.settle();
    const el = this.sheet?.sheetRef?.nativeElement;
    if (!el) return null;
    const dataUrl = await htmlToImage.toJpeg(el, {
      quality: 0.95,
      backgroundColor: "#ffffff",
      width: 1000 * 4,
      height: (this.sheet!.sheetHeight) * 4,
      style: { transform: "scale(4)", transformOrigin: "top left" },
    });
    const suffix = this.variant === "ACTUAL" ? "_ACTUAL" : "";
    const name = `${this.sheetVm.config.fileName}${suffix}_${this.fileStamp()}.jpg`;
    this.sheetVm = null;
    return { name, dataUrl };
  }

  private saveDataUrl(name: string, dataUrl: string): void {
    const link = document.createElement("a");
    link.download = name;
    link.href = dataUrl;
    link.click();
  }

  async downloadMap(row: StatRow): Promise<void> {
    if (!this.mapAvailable(row)) {
      this.flash(`${row.label} has no actual-rainfall map.`);
      return;
    }
    this.busyKey = `${row.scope}::${row.key}`;
    try {
      const out = await this.renderMap(row);
      if (out) this.saveDataUrl(out.name, out.dataUrl);
      else this.flash(`Could not render the ${row.label} sheet.`);
    } catch (err) {
      console.error("[all-statistics] map download failed", row, err);
      this.flash(`Map download failed for ${row.label}.`);
    }
    this.busyKey = "";
  }

  /**
   * The existing per-level statistics services already save both the PDF and
   * the Excel in one call, so "pdf/excel" is a single invocation each.
   */
  private async runDocDownload(row: StatRow): Promise<void> {
    const unified =
      JSON.parse(localStorage.getItem("selectedMode") || "{}")?.selectedMode === "Unified";
    const from = this.appliedFrom;
    const to = this.appliedTo;

    if (row.scope === "MC") {
      return unified
        ? this.mcDoc.updateanddownloadpdfCustom(row.key, from, to)
        : this.mcDoc.updateanddownloadpdfFromDataEntryCustom(row.key, from, to);
    }

    if (row.scope === "STATE") {
      // this one needs the state_code, which only the state endpoint knows
      const res: any = await this.stateService
        .fetchData({ startDate: from, endDate: to })
        .toPromise();
      const match = (res?.data || []).find(
        (st: any) => String(st.state_name).trim().toUpperCase() === row.key.trim().toUpperCase()
      );
      if (!match) throw new Error(`No state_code for ${row.key}`);
      return unified
        ? this.stateDistrictDoc.updateanddownloadpdfCustom(from, to, match.state_code)
        : this.stateDistrictDoc.updateanddownloadpdfFromDataEntryCustom(from, to, match.state_code);
    }

    // the four regional sheets share one export, keyed by region name
    if (row.scope === "REGIONAL") {
      const region = RMU_LEVELS[row.key as RmuLevelKey]?.regionName;
      if (!region) throw new Error(`No region name for ${row.key}`);
      return unified
        ? this.regionDistrictDoc.updateanddownloadpdfCustom(region, from, to)
        : this.regionDistrictDoc.updateanddownloadpdfFromDataEntryCustom(region, from, to);
    }

    switch (row.key) {
      case "DISTRICT":
        return unified
          ? this.districtDoc.updateanddownloadpdfCustom(from, to)
          : this.districtDoc.updateanddownloadpdfFromDataEntryCustom(from, to);
      case "STATE":
        return unified
          ? this.stateDoc.updateanddownloadpdfCustom(from, to)
          : this.stateDoc.updateanddownloadpdfFromDataEntryCustom(from, to);
      case "SUBDIVISION":
        return unified
          ? this.subdivDoc.updateanddownloadpdfCustom(from, to)
          : this.subdivDoc.updateanddownloadpdfFromDataEntryCustom(from, to);
      case "REGION":
        return unified
          ? this.regionDoc.updateanddownloadpdfCustom(from, to)
          : this.regionDoc.updateanddownloadpdfFromDataEntryCustom(from, to);
      case "COUNTRY":
        return unified
          ? this.countryDoc.updateanddownloadpdfCustom(from, to)
          : this.countryDoc.updateanddownloadpdfFromDataEntryCustom(from, to);
      case "BLOCK":
        return unified
          ? this.blockDoc.updateanddownloadpdfCustom(from, to)
          : this.blockDoc.updateanddownloadpdfFromDataEntryCustom(from, to);
      default:
        throw new Error(`No pdf/excel export for ${row.key}`);
    }
  }

  async downloadDoc(row: StatRow): Promise<void> {
    this.busyKey = `${row.scope}::${row.key}`;
    try {
      await this.runDocDownload(row);
    } catch (err) {
      console.error("[all-statistics] pdf/excel download failed", row, err);
      this.flash(`PDF / Excel failed for ${row.label}.`);
    }
    this.busyKey = "";
  }

  /** everything ticked in one section */
  async downloadSection(section: StatSection): Promise<void> {
    await this.runBatch(section.rows.filter((r) => r.mapSelected || r.docSelected));
  }

  /** everything ticked anywhere */
  async downloadAll(): Promise<void> {
    await this.runBatch(this.allRows.filter((r) => r.mapSelected || r.docSelected));
  }

  /**
   * Downloads run one after another rather than in parallel: each map has to
   * occupy the single off-screen sheet while it is captured, and the pdf/excel
   * services each drive their own fetch + jsPDF pass.
   *
   * Everything is diverted into memory and delivered as one zip, sorted into
   * Maps / PDF / Excel folders, rather than dozens of separate downloads.
   */
  private async runBatch(rows: StatRow[]): Promise<void> {
    if (!rows.length) return;
    this.batchTotal = rows.reduce(
      (n, r) => n + (r.mapSelected ? 1 : 0) + (r.docSelected ? 1 : 0),
      0
    );
    this.batchDone = 0;

    this.capture.start();
    let collected: CapturedFile[] = [];
    try {
      for (const row of rows) {
        this.busyKey = `${row.scope}::${row.key}`;

        if (row.mapSelected && this.mapAvailable(row)) {
          try {
            const out = await this.renderMap(row);
            if (out) {
              this.capture.add(out.name, this.capture.dataUrlToBlob(out.dataUrl));
            }
          } catch (err) {
            console.error("[all-statistics] map failed in batch", row, err);
          }
          this.batchDone++;
        }

        if (row.docSelected) {
          try {
            await this.runDocDownload(row);
          } catch (err) {
            console.error("[all-statistics] pdf/excel failed in batch", row, err);
          }
          this.batchDone++;
        }
      }
    } finally {
      this.busyKey = "";
      collected = this.capture.stop();
    }

    await this.deliverZip(collected);

    this.batchTotal = 0;
    this.batchDone = 0;
  }

  /** Maps / PDF / Excel folders, by file extension */
  private folderFor(name: string): string {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png"].includes(ext)) return "Maps";
    if (ext === "pdf") return "PDF";
    if (["xlsx", "xls", "csv"].includes(ext)) return "Excel";
    return "Other";
  }

  private async deliverZip(files: CapturedFile[]): Promise<void> {
    if (!files.length) {
      this.flash("Nothing was produced — check the console for failures.");
      return;
    }

    const zip = new (JSZip as any)();
    const used = new Set<string>();

    for (const file of files) {
      let path = `${this.folderFor(file.name)}/${file.name}`;
      // two products can legitimately emit the same filename; keep both
      let n = 2;
      while (used.has(path)) {
        const dot = file.name.lastIndexOf(".");
        const stem = dot > 0 ? file.name.slice(0, dot) : file.name;
        const ext = dot > 0 ? file.name.slice(dot) : "";
        path = `${this.folderFor(file.name)}/${stem}_${n++}${ext}`;
      }
      used.add(path);
      zip.file(path, file.blob);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(blob, `ALL_STATISTICS_${this.fileStamp()}.zip`);
    this.flash(`${files.length} file(s) zipped.`);
  }

  private flash(message: string): void {
    this.statusMessage = message;
    setTimeout(() => (this.statusMessage = ""), 3500);
  }

  private isoDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${date.getFullYear()}-${m}-${d}`;
  }
}
