import {
  Component,
  Renderer2,
  ElementRef,
  OnInit,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

const proj4 = require("proj4").default || require("proj4");

declare const L: any;

proj4.defs(
  "EPSG:7755",
  "+proj=lcc +lat_0=24 +lon_0=80 +lat_1=12.472955 +lat_2=35.172804 " +
    "+x_0=4000000 +y_0=4000000 +datum=WGS84 +units=m +no_defs"
);

@Component({
  selector: "app-ganga-river-basin",
  templateUrl: "./ganga-river-basin.component.html",
  styleUrls: ["./ganga-river-basin.component.css"],
})
export class GangaRiverBasinComponent implements OnInit, AfterViewInit {
  isLoading = false;

  private initialZoom          = 5;
  private defaultFontSizeonMap = 8;
  private map: any             = null;
  private geoJsonLayer: any    = null;
  private zoomControl: any     = null;

  // ── Raw GeoJSON stored once ─────────────────────────────────────────────────
  private allFeatures: any[]   = [];

  // ── Dropdown state ──────────────────────────────────────────────────────────
  allBasins: string[]      = [];
  selectedBasin: string    = "";
  allSubbasins: string[]   = [];
  selectedSubbasin: string = "All";

  // ── Table & stats ───────────────────────────────────────────────────────────
  tableData: any[] = [];
  totalBasinArea   = 0;
  totalSubbasins   = 0;
  mapTitle         = "";

  legendItems = [
    { color: "#08306b", text: "Very Large (>5000 km²)", fontSize: "9.3px" },
    { color: "#2171b5", text: "Large (2000–5000 km²)",  fontSize: "9.3px" },
    { color: "#6baed6", text: "Medium (500–2000 km²)",  fontSize: "9.3px" },
    { color: "#c6dbef", text: "Small (<500 km²)",        fontSize: "9.3px" },
    { color: "#cccccc", text: "No Data",                 fontSize: "9.3px" },
  ];

  constructor(
    private http: HttpClient,
    private renderer: Renderer2,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.calculateInitialZoom();
    this.initMap();
    this.loadGeoJSONOnce();
  }

  ngAfterViewInit(): void {}

  // ── Load GeoJSON once, then build dropdowns ─────────────────────────────────
  private loadGeoJSONOnce(): void {
    this.isLoading = true;
    this.http.get("assets/geojson/river_basin/Basin_boundary.json").subscribe(
      (res: any) => {
        this.allFeatures = res.features || [];

        // ── Dynamically extract all unique basins from data ──────────────────
        const basinSet = new Set<string>();
        this.allFeatures.forEach((f) => {
          const b = f.properties?.BASIN;
          if (b && b.trim() !== "") basinSet.add(b.trim());
        });
        this.allBasins = Array.from(basinSet).sort();

        // Default to first basin
        this.selectedBasin = this.allBasins[0] || "";
        this.updateSubbasinDropdown();
        this.renderMap();
        this.isLoading = false;
      },
      (err) => {
        console.error("GeoJSON load error:", err);
        this.isLoading = false;
      }
    );
  }

  // ── When basin dropdown changes ─────────────────────────────────────────────
  onBasinChange(): void {
    this.selectedSubbasin = "All";
    this.updateSubbasinDropdown();
    this.renderMap();
  }

  // ── When subbasin dropdown changes ──────────────────────────────────────────
  onSubbasinChange(): void {
    this.renderMap();
  }

  // ── Build subbasin list from features for selected basin ─────────────────────
  private updateSubbasinDropdown(): void {
    const subbasinSet = new Set<string>();
    this.allFeatures
      .filter((f) => f.properties?.BASIN === this.selectedBasin)
      .forEach((f) => {
        const s = f.properties?.SUBBASIN || f.properties?.Name;
        if (s && s.trim() !== "") subbasinSet.add(s.trim());
      });
    this.allSubbasins = Array.from(subbasinSet).sort();
  }

  // ── Filter features based on dropdowns ─────────────────────────────────────
  private getFilteredFeatures(): any[] {
    return this.allFeatures.filter((f) => {
      const basinMatch = f.properties?.BASIN === this.selectedBasin;
      if (!basinMatch) return false;

      if (this.selectedSubbasin === "All") return true;

      const sub = f.properties?.SUBBASIN || f.properties?.Name || "";
      return sub.trim() === this.selectedSubbasin;
    });
  }

  private renderMap(isFullScreen = false): void {
    // Update title
    this.mapTitle =
      this.selectedSubbasin === "All"
        ? `${this.selectedBasin.toUpperCase()} RIVER BASIN MAP`
        : `${this.selectedSubbasin.toUpperCase()} SUBBASIN MAP`;

    // Clear old layer + labels
    if (this.geoJsonLayer) {
      this.map.removeLayer(this.geoJsonLayer);
      this.geoJsonLayer = null;
    }
    document.querySelectorAll('[id^="label-basin-"]').forEach((el) => el.remove());

    const filtered = this.getFilteredFeatures();

    if (filtered.length === 0) {
      console.warn("No features found for selected basin/subbasin");
      this.tableData      = [];
      this.totalSubbasins = 0;
      this.totalBasinArea = 0;
      return;
    }

    // ── Build table ──────────────────────────────────────────────────────────
    this.tableData = filtered
      .map((f) => ({
        name:     f.properties?.SUBBASIN || f.properties?.Name || "Unknown",
        area:     f.properties?.AREA_SQKM || 0,
        fmo:      f.properties?.FMO || "-",
        objectId: f.properties?.OBJECTID || 0,
        lat:      f.properties?.lat  || 0,
        lon:      f.properties?.lon  || 0,
        basin:    f.properties?.BASIN || "",
        category: this.getAreaCategory(f.properties?.AREA_SQKM || 0),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    this.totalSubbasins = this.tableData.length;
    this.totalBasinArea = this.tableData.reduce((sum, r) => sum + r.area, 0);

    // ── Reproject + render ───────────────────────────────────────────────────
    const geojson     = { type: "FeatureCollection", features: filtered };
    const reprojected = this.reprojectGeoJSON(geojson);

    this.geoJsonLayer = L.geoJSON(reprojected, {
      style: (feature: any) => ({
        fillColor:   this.getAreaColor(feature.properties?.AREA_SQKM || 0),
        weight:      1.5,
        opacity:     0.9,
        color:       "#002467",
        fillOpacity: 0.85,
      }),
      onEachFeature: (feature: any, layer: any) => {
        const name = feature.properties?.SUBBASIN || feature.properties?.Name || "";
        const area = feature.properties?.AREA_SQKM || 0;
        const fmo  = feature.properties?.FMO || "";
        const lat  = feature.properties?.lat;
        const lng  = feature.properties?.lon;

        layer.bindTooltip(
          `<strong>${name}</strong><br>
           Area: ${area.toFixed(1)} km²<br>
           FMO: ${fmo}`,
          { sticky: true, className: "basin-tooltip" }
        );

        // Label marker — lat/lon in properties are already WGS84
        if (lat && lng) {
          const labelId  = `label-basin-${feature.properties?.OBJECTID}`;
          const existing = document.getElementById(labelId);
          if (existing) existing.remove();

          L.marker([lat, lng], {
            icon: L.divIcon({
              className: "state-label",
              html: `<div id="${labelId}" style="
                  font-size:   ${this.defaultFontSizeonMap}px;
                  font-weight: 700;
                  color:       #002467;
                  text-align:  center;
                  white-space: nowrap;">
                  ${name}
                </div>`,
              iconSize: isFullScreen ? [200, 20] : [150, 20],
            }),
          }).addTo(this.map);
        }
      },
    }).addTo(this.map);

    // ── Auto-fit bounds — padding accounts for header + buttons + legend overlay
    if (this.geoJsonLayer?.getBounds().isValid()) {
      this.map.fitBounds(this.geoJsonLayer.getBounds(), {
        paddingTopLeft:     isFullScreen ? [60,  220] : [120, 180],
        paddingBottomRight: isFullScreen ? [60,  130] : [20,  110],
      });
    }
  }



  // ── Color & category helpers ────────────────────────────────────────────────
  private getAreaColor(area: number): string {
    if (!area || area === 0) return "#cccccc";
    if (area > 5000)         return "#08306b";
    if (area > 2000)         return "#2171b5";
    if (area > 500)          return "#6baed6";
    return "#c6dbef";
  }

  getAreaCategory(area: number): string {
    if (!area || area === 0) return "No Data";
    if (area > 5000)         return "Very Large";
    if (area > 2000)         return "Large";
    if (area > 500)          return "Medium";
    return "Small";
  }

  getCategoryBadgeClass(cat: string): string {
    const map: { [k: string]: string } = {
      "Very Large": "badge-very-large",
      "Large":      "badge-large",
      "Medium":     "badge-medium",
      "Small":      "badge-small",
    };
    return map[cat] || "badge-nodata";
  }

  // ── Zoom & resize ───────────────────────────────────────────────────────────
  private calculateInitialZoom(): void {
    const w = window.innerWidth  * 0.9;
    const h = window.innerHeight * 0.7;
    this.initialZoom          = Math.log2(Math.max(w, h) / 57);
    this.defaultFontSizeonMap = this.initialZoom * 2.33;
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    if (!this.isFullscreen()) {
      this.calculateInitialZoom();
    }
  }

  resetMapSmallScreen(): void {
    if (this.geoJsonLayer?.getBounds().isValid()) {
      this.map.fitBounds(this.geoJsonLayer.getBounds(), { padding: [30, 30] });
    }
  }

  public isFullscreen(): boolean { return !!document.fullscreenElement; }

  // ── Fullscreen toggle ───────────────────────────────────────────────────────
  private toggleLogoPosition(fs: boolean): void {
    const logo      = this.elRef.nativeElement.querySelector("#logoImageGanga");
    const header    = this.elRef.nativeElement.querySelector("#middle-header-ganga");
    const compass   = this.elRef.nativeElement.querySelector("#compassArrow-ganga");
    const resetBtn  = this.elRef.nativeElement.querySelector("#resetButtonGanga");
    const legend    = this.elRef.nativeElement.querySelector("#leaflet-bottom-ganga");
    const celebrate = this.elRef.nativeElement.querySelector("#celebrations-ganga");

    if (fs) {
      this.zoomControl = L.control.zoom();
      this.map.addControl(this.zoomControl);
      this.map.dragging.enable();
      this.defaultFontSizeonMap = (this.initialZoom + 1) * 2;
      this.renderMap(true);

      this.renderer.setStyle(logo,      "position", "absolute");
      this.renderer.setStyle(logo,      "left",     "26%");
      this.renderer.setStyle(logo,      "top",      "3.25%");
      this.renderer.setStyle(header,    "position", "absolute");
      this.renderer.setStyle(header,    "left",     "10%");
      this.renderer.setStyle(header,    "top",      "5%");
      this.renderer.setStyle(compass,   "position", "absolute");
      this.renderer.setStyle(compass,   "right",    "40%");
      this.renderer.setStyle(compass,   "top",      "20%");
      this.renderer.setStyle(legend,    "margin-left",  "28%");
      this.renderer.setStyle(legend,    "margin-right", "20%");
      this.renderer.setStyle(celebrate, "position", "absolute");
      this.renderer.setStyle(celebrate, "right",    "30%");
      this.renderer.setStyle(celebrate, "top",      "5%");
      this.renderer.setStyle(celebrate, "width",    "20%");
      this.renderer.setStyle(resetBtn,  "position", "absolute");
      this.renderer.setStyle(resetBtn,  "left",     "42.7%");
      this.renderer.setStyle(resetBtn,  "top",      "5%");
    } else {
      if (this.zoomControl) {
        this.map.removeControl(this.zoomControl);
        this.zoomControl = null;
      }
      this.map.dragging.disable();
      this.defaultFontSizeonMap = this.initialZoom * 2;
      this.renderMap(false);

      const allEls = [logo, header, compass, legend, celebrate, resetBtn];
      const styles = ["position","left","top","right","margin-left","margin-right","width","height","zoom"];
      allEls.forEach((el) => {
        if (el) styles.forEach((s) => this.renderer.removeStyle(el, s));
      });
    }
  }

  // ── Downloads ───────────────────────────────────────────────────────────────
  filter = (node: HTMLElement) => {
    const excl = ["download","downloadpdf","leaflet-control-zoom",
                  "leaflet-control-fullscreen","download-buttons"];
    return !excl.some((c) => node.classList?.contains(c));
  };

  downloadMappdf(): void { this.downloadMapImage(true); }

  async downloadMapImage(downloadpdf: boolean): Promise<void> {
    this.isLoading = true;
    try {
      const el = document.getElementById("map-ganga-basin") as HTMLElement;
      if (!el) throw new Error("Map element not found");
      const scale = 8, ow = el.clientWidth, oh = el.clientHeight;
      const dataUrl = await htmlToImage.toJpeg(el, {
        quality: 0.95, filter: this.filter,
        width:  ow * scale, height: oh * scale,
        style: {
          transform: `scale(${scale})`, transformOrigin: "top left",
          width: `${ow}px`, height: `${oh}px`,
        },
      });
      if (downloadpdf) {
        this.generatePDF(dataUrl);
      } else {
        const link     = document.createElement("a");
        link.download  = `${this.selectedBasin}_BASIN_MAP.jpeg`;
        link.href      = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      this.isLoading = false;
    }
  }

  generatePDF(imageDataUrl: string): void {
    const pdf   = new jsPDF("landscape");
    const image = new Image();
    image.src   = imageDataUrl;
    image.onload = () => {
      const props = pdf.getImageProperties(imageDataUrl);
      const pw    = pdf.internal.pageSize.getWidth();
      const ph    = pdf.internal.pageSize.getHeight();
      const ratio = props.width / props.height;
      let w = pw, h = pw / ratio;
      if (h > ph) { h = ph; w = ph * ratio; }
      pdf.addImage(imageDataUrl, "JPEG", (pw - w) / 2, (ph - h) / 2, w, h);
      pdf.save(`${this.selectedBasin}_BASIN_MAP.pdf`);
    };
  }

  downloadTableCSV(): void {
    const headers = ["Subbasin","Basin","Area (km²)","FMO","Category"];
    const rows    = this.tableData.map((r) => [
      r.name, r.basin, r.area.toFixed(2), r.fmo, r.category,
    ]);
    const csv  = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href  = URL.createObjectURL(blob);
    link.download = `${this.selectedBasin}_SUBBASINS.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }


  // ── Map Init ────────────────────────────────────────────────────────────────
private initMap(): void {
  this.map = L.map("map-ganga-basin", {
    center:          [25.5, 83],
    zoom:            this.initialZoom,
    scrollWheelZoom: false,
    zoomSnap:        0.1,
    zoomDelta:       0.1,
    zoomControl:     false,
    doubleClickZoom: false,
    boxZoom:         false,
    touchZoom:       false,
  });

  this.map.dragging.disable();

  const fullscreenControl = new L.Control.Fullscreen({
    title:   { false: "View Fullscreen", true: "Exit Fullscreen" },
    content: '<i class="bi bi-arrows-fullscreen"></i>',
  });
  this.map.addControl(fullscreenControl);

  this.map.on("fullscreenchange", () => {
    this.toggleLogoPosition(this.isFullscreen());
  });
}

// ── Reproject EPSG:7755 → WGS84 ─────────────────────────────────────────────
private reprojectGeoJSON(geojson: any): any {
  const projectCoord = (coord: number[]) =>
    (proj4 as any)("EPSG:7755", "WGS84", [coord[0], coord[1]]);

  const transformRing = (ring: number[][]) => ring.map(projectCoord);

  return {
    ...geojson,
    features: geojson.features.map((f: any) => {
      const geom = f.geometry;
      let newCoords: any;

      if (geom.type === "Polygon") {
        newCoords = geom.coordinates.map(transformRing);
      } else if (geom.type === "MultiPolygon") {
        newCoords = geom.coordinates.map((poly: any) =>
          poly.map(transformRing)
        );
      } else {
        newCoords = geom.coordinates;
      }

      return { ...f, geometry: { ...geom, coordinates: newCoords } };
    }),
  };
}


}
