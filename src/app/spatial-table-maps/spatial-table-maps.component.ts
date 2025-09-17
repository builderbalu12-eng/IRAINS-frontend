import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Renderer2,
  ElementRef,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import * as L from "leaflet";
import { HttpClient } from "@angular/common/http";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

@Component({
  selector: "app-spatial-table-maps",
  templateUrl: "./spatial-table-maps.component.html",
  styleUrls: ["./spatial-table-maps.component.css"],
})
export class SpatialTableMapsComponent implements OnChanges {
  @Input() mapType: "subdivision" | "state" = "subdivision";
  @Input() startDate!: string;
  @Input() endDate!: string;

  @Input() tableData: any[] = [];
  private map!: L.Map;
  private geojsonLayer!: L.GeoJSON;

  private initialZoom = 4.8955;
  private defaultFontSizeonMap = 8;
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private elRef: ElementRef,
    private renderer: Renderer2
  ) {}

  public isFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      document.fullscreenElement ||
      document.fullscreenElement ||
      document.fullscreenElement
    );
  }

  @HostListener("window:resize")
  onWindowResize() {
    if (!this.isFullscreen()) {
      this.calculateInitialZoom();
      if (this.map) {
        this.map.setZoom(this.initialZoom);
        this.map.setView([24, 81.9629], this.initialZoom);
      }
    }
  }

  legendItems = [
    {
      color: "#03ff3f",
      text: `Isolated <br>[<= 25%]`,
      fontSize: "12px",
    },
    {
      color: "#00683a",
      text: "Scattered <br>[>=26% to <=50%]%",
      fontSize: "12px",
    },
    {
      color: "#00fcf1",
      text: "Fairly Widespread <br>[>=51% to <=75%]%",
      fontSize: "12px",
    },
    {
      color: "#3400f6",
      text: "Widespread <br>[>=76% to <=100%]%",
      fontSize: "12px",
    },
    {
      color: "#c0c0c0",
      text: "No Data",
      fontSize: "12px",
    },
  ];

  private calculateInitialZoom(): void {
    const cardWidth = window.innerWidth * 0.8;
    const cardHeight = window.innerHeight * 0.7;
    this.initialZoom = this.calculateZoomLevel(cardWidth, cardHeight);
    this.defaultFontSizeonMap = this.initialZoom * 2;
  }

  private calculateZoomLevel(width: number, height: number): number {
    const zoomLevel = Math.log2(Math.max(width, height) / 59);

    return zoomLevel;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["tableData"] && this.tableData.length > 0) {
      this.loadGeoJsonAndApplyData(true);
    }
  }
  ngAfterViewInit(): void {
    this.loadGeoJsonAndApplyData(false);
  }

  private initMap(): void {
    if (this.map) {
      return; // prevent re-init
    }

    this.map = L.map("map-subdivision", {
      center: [22.5, 81.9629], // India center
      zoom: this.initialZoom, // use your initial zoom
      scrollWheelZoom: false,
      zoomSnap: 0.9,
      zoomDelta: 0.1,
      touchZoom: false,
      dragging: false,
    });

    // Remove default zoom control
    this.map.removeControl(this.map.zoomControl);

    // Fullscreen toggle
    this.map.on("fullscreenchange", () => {
      this.toggleLogoPosition(this.isFullscreen());
    });

    // const fullscreenControl = new (L.Control as any).Fullscreen({
    //   title: {
    //     false: "View Fullscreen",
    //     true: "Exit Fullscreen",
    //   },
    //   content: '<i class="bi bi-arrows-fullscreen"></i>',
    // });

    // this.map.addControl(fullscreenControl);
  }

  filter = (node: HTMLElement) => {
    const exclusionClasses = [
      "download",
      "downloadpdf",
      "leaflet-control-zoom",
      "leaflet-control-fullscreen",
      "leaflet-control-zoomin",
      "ResetMap",
      "DownloadMaps",
      "download-buttons",
    ];
    return !exclusionClasses.some((classname) =>
      node.classList?.contains(classname)
    );
  };

  resetMap(): void {
    this.map.setView([24, 80.9629], this.initialZoom + 0.3);
  }
  downloadMappdf() {
    this.downloadMapImage(true);
  }

  resetMapSmallScreen(): void {
    this.map.setView([24, 81.9629], this.initialZoom);
  }

  generatePDF(imageDataUrl: string) {
    const pdf = new jsPDF("landscape"); // Using landscape for better aspect ratio match

    const image = new Image();
    image.src = imageDataUrl;
    image.onload = () => {
      const imgProps = pdf.getImageProperties(imageDataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate the aspect ratio
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const aspectRatio = imgWidth / imgHeight;

      let newImgWidth = pdfWidth;
      let newImgHeight = pdfWidth / aspectRatio;

      if (newImgHeight > pdfHeight) {
        newImgHeight = pdfHeight;
        newImgWidth = pdfHeight * aspectRatio;
      }

      // Center the image in the PDF page
      const xOffset = (pdfWidth - newImgWidth) / 2;
      const yOffset = (pdfHeight - newImgHeight) / 2;

      pdf.addImage(
        imageDataUrl,
        "JPEG",
        xOffset,
        yOffset,
        newImgWidth,
        newImgHeight
      );
      pdf.save("SUBDIVISION_RAINFALL_MAP_COUNTRY_INDIA_cd.pdf");
    };
  }

  async downloadMapImage(downloadpdf: boolean) {
    if (this.isFullscreen()) {
      this.resetMap();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.isLoading = true;

    try {
      const mapElement = document.getElementById(
        "map-subdivision"
      ) as HTMLElement;
      if (!mapElement) {
        throw new Error("Map element not found");
      }
      const scale = 8;
      const originalWidth = mapElement.clientWidth;
      const originalHeight = mapElement.clientHeight;
      const width = originalWidth * scale;
      const height = originalHeight * scale;

      if (!this.isFullscreen()) {
        const dataUrl = await htmlToImage.toJpeg(mapElement, {
          quality: 0.95,
          filter: this.filter,
          width: width,
          height: height,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          },
        });

        const link = document.createElement("a");
        link.download = "SUBDIVISION_RAINFALL_MAP_COUNTRY_INDIA_cd.jpeg";
        link.href = dataUrl;

        if (downloadpdf) {
          this.generatePDF(dataUrl);
        } else {
          link.click();
        }
      } else {
        const cropWidth = 1200 * scale; // Width of the cropped area in the center
        const cropHeight = originalHeight + 1155 * scale; //1140
        const cropX = (width - cropWidth) / 2 + 2000; // Centered horizontally
        const cropY = 0; // Starting at the top

        // Create a temporary canvas to crop the image
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cropWidth;
        tempCanvas.height = cropHeight;
        const tempContext = tempCanvas.getContext("2d");

        const dataUrl = await htmlToImage.toJpeg(mapElement, {
          quality: 0.95,
          filter: this.filter,
          width: width,
          height: height,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: `${width}px`,
            height: `${height}px`,
          },
        });

        // Load the captured image onto the temporary canvas
        const image = new Image();
        image.src = dataUrl;
        image.onload = () => {
          // Draw the central portion of the scaled image onto the temporary canvas
          tempContext?.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          );

          // Convert the cropped canvas back to a data URL
          const croppedDataUrl = tempCanvas.toDataURL("image/jpeg", 0.95);

          // Trigger download
          const link = document.createElement("a");
          link.download = "SUBDIVISION_RAINFALL_MAP_COUNTRY_INDIA_cd.jpeg";
          link.href = croppedDataUrl;

          if (downloadpdf) {
            this.generatePDF(croppedDataUrl);
          } else {
            link.click();
          }
        };
      }
    } catch (error) {
      console.error("Error downloading map image:", error);
    }
    this.isLoading = false;
  }

  private toggleLogoPosition(isFullscreen: boolean): void {
    const logoImage = this.elRef.nativeElement.querySelector("#logoImage2");
    const Header = this.elRef.nativeElement.querySelector(
      "#middle-header-subdiv"
    );
    const directionCompass = this.elRef.nativeElement.querySelector(
      "#compassArrow-subdiv"
    );
    // const btn = this.elRef.nativeElement.querySelector('#all-btn-subdiv')
    const resetButton = this.elRef.nativeElement.querySelector("#resetButton");

    const legendsColor = this.elRef.nativeElement.querySelector(
      "#leaflet-bottom-subdiv"
    );
    const celebrations = this.elRef.nativeElement.querySelector(
      "#celebrations-subdiv"
    );
    const country_val = this.elRef.nativeElement.querySelector(
      "#country_values_subdivision_allmaps"
    );

    const borderRemove = this.elRef.nativeElement.querySelector(
      "#border-remove-subdiv"
    );

    if (isFullscreen) {
      // this.map.addControl(this.map.zoomControl);
      // this.map.dragging.enable();

      this.map.addControl(this.map.zoomControl);
      this.map.dragging.enable();
      this.map.scrollWheelZoom.enable(); // Enable mouse scroll zooming
      this.map.touchZoom.enable(); // Enable touch zooming
      this.loadGeoJsonAndApplyData(true);
      this.map.setZoom(this.initialZoom + 0.3);

      this.map.setZoom(this.initialZoom + 0.3);
      this.defaultFontSizeonMap = (this.initialZoom + 1) * 2;
      this.loadGeoJsonAndApplyData(true);

      this.renderer.setStyle(logoImage, "position", "absolute");
      this.renderer.setStyle(logoImage, "left", "26%");
      this.renderer.setStyle(logoImage, "top", "3.25%");

      this.renderer.setStyle(Header, "position", "absolute");
      this.renderer.setStyle(Header, "left", "10%");
      this.renderer.setStyle(Header, "top", "5%");

      this.renderer.setStyle(directionCompass, "position", "absolute");
      this.renderer.setStyle(directionCompass, "right", "40%");
      this.renderer.setStyle(directionCompass, "top", "20%");

      // this.renderer.setStyle(btn, 'position', 'absolute');
      // this.renderer.setStyle(btn, 'right', '10%');
      // this.renderer.setStyle(btn, 'top', '5%');

      this.renderer.setStyle(legendsColor, "margin-left", "28%");
      this.renderer.setStyle(legendsColor, "margin-right", "20%");

      this.renderer.setStyle(celebrations, "position", "absolute");
      this.renderer.setStyle(celebrations, "right", "30%");
      this.renderer.setStyle(celebrations, "top", "5%");
      this.renderer.setStyle(celebrations, "width", "20%"); // Set the desired width in percentage
      this.renderer.setStyle(celebrations, "height", "auto");
      this.renderer.setStyle(celebrations, "zoom", "100%");

      this.renderer.setStyle(country_val, "position", "absolute");
      this.renderer.setStyle(country_val, "left", "53%");
      this.renderer.setStyle(country_val, "top", "65%");

      this.renderer.setStyle(resetButton, "position", "absolute");
      this.renderer.setStyle(resetButton, "left", "50.7%");
      this.renderer.setStyle(resetButton, "top", "5%");

      if (isFullscreen && borderRemove) {
        this.renderer.addClass(borderRemove, "no-border");
      }
    } else {
      // this.map.removeControl(this.map.zoomControl);
      // this.map.dragging.disable();

      this.map.removeControl(this.map.zoomControl);
      this.map.dragging.disable();
      this.map.scrollWheelZoom.disable(); // Disable mouse scroll zooming
      this.map.touchZoom.disable(); // Disable touch zooming
      this.loadGeoJsonAndApplyData(false);
      this.map.setZoom(this.initialZoom);

      this.renderer.removeClass(borderRemove, "no-border");
      this.renderer.setStyle(borderRemove, "border", "2px solid black");

      this.map.setZoom(this.initialZoom);
      this.defaultFontSizeonMap = this.initialZoom * 2;
      this.loadGeoJsonAndApplyData(false);

      this.renderer.removeStyle(logoImage, "position");
      this.renderer.removeStyle(logoImage, "left");
      this.renderer.removeStyle(logoImage, "top");

      this.renderer.removeStyle(Header, "position");
      this.renderer.removeStyle(Header, "left");
      this.renderer.removeStyle(Header, "top");

      this.renderer.removeStyle(directionCompass, "position");
      this.renderer.removeStyle(directionCompass, "right");
      this.renderer.removeStyle(directionCompass, "top");

      // this.renderer.removeStyle(btn, 'position');
      // this.renderer.removeStyle(btn, 'right');
      // this.renderer.removeStyle(btn, 'top');

      this.renderer.removeStyle(legendsColor, "margin-left");
      this.renderer.removeStyle(legendsColor, "margin-right");

      this.renderer.removeStyle(celebrations, "position");
      this.renderer.removeStyle(celebrations, "right");
      this.renderer.removeStyle(celebrations, "top");
      this.renderer.removeStyle(celebrations, "width");
      this.renderer.removeStyle(celebrations, "height");

      this.renderer.removeStyle(country_val, "position");
      this.renderer.removeStyle(country_val, "left");
      this.renderer.removeStyle(country_val, "top");

      this.renderer.removeStyle(resetButton, "position");
      this.renderer.removeStyle(resetButton, "left");
      this.renderer.removeStyle(resetButton, "top");
    }
  }

  private loadGeoJsonAndApplyData(isFullScreen: boolean): void {
    this.initMap();

    // 👇 Pick the correct file based on mapType
    const geoJsonFile =
      this.mapType === "state"
        ? "assets/geojson/INDIA_STATE.json"
        : "assets/geojson/INDIA_SUB_DIVISION.json";

    this.http.get<any>(geoJsonFile).subscribe((data) => {
      if (this.geojsonLayer) {
        this.map.removeLayer(this.geojsonLayer);
      }

      this.geojsonLayer = L.geoJSON(data, {
        style: (feature: any) => {
          let nameField: string;
          let codeField: number | string;

          if (this.mapType === "state") {
            // ⚠️ double-check this field in your INDIA_STATE.json (could be STNAME or ST_NM)
            nameField = feature.properties.state_name;
            codeField = feature.properties.state_code;
          } else {
            nameField = feature.properties.subdivisio;
            codeField = feature.properties.SubDiv_Cod;
          }

          // ✅ Matching logic
          const matched = this.tableData.find((row) =>
            this.mapType === "state"
              ? row.state_name?.toLowerCase().trim() ===
                nameField?.toLowerCase().trim()
              : row.id === codeField ||
                row.subdivision_name?.toLowerCase().trim() ===
                  nameField?.toLowerCase().trim()
          );

          const category = matched?.category || "Unknown";

          return {
            color: "#333",
            weight: 1,
            fillColor: this.getCategoryColor(category),
            fillOpacity: 0.6,
          };
        },
        onEachFeature: (feature, layer) => {
          let nameField: string;
          let codeField: number | string;

          if (this.mapType === "state") {
            nameField = feature.properties.state_name;
            codeField = feature.properties.state_code;
          } else {
            nameField = feature.properties.subdivisio;
            codeField = feature.properties.SubDiv_Cod;
          }

          // ✅ Same matching logic for popup
          const matched = this.tableData.find((row) =>
            this.mapType === "state"
              ? row.state_name?.toLowerCase().trim() ===
                nameField?.toLowerCase().trim()
              : row.id === codeField ||
                row.subdivision_name?.toLowerCase().trim() ===
                  nameField?.toLowerCase().trim()
          );

          const category = matched?.category || "N/A";
          const stations = matched?.total_stations ?? "-";
          const reported = matched?.station_reported_rainfall ?? "-";
          const perc = matched?.percentage ?? "-";

          layer.bindPopup(
            `<strong>${nameField}</strong><br/>
             Total Stations: ${stations}<br/>
             Reported Stations: ${reported}<br/>
             Percentage: ${perc}%<br/>
             <strong>Category: ${category}</strong>`
          );
        },
      });

      this.geojsonLayer.addTo(this.map);
      // this.map.fitBounds(this.geojsonLayer.getBounds());
      this.map.setView([22, 80.5], this.initialZoom);
    });
  }

  private getCategoryColor(category: string): string {
    switch (category) {
      case "Isolated":
        return "#03ff3f";
      case "Scattered":
        return "#00683a";
      case "Fairly Widespread":
        return "#00fcf1";
      case "Widespread":
        return "#3400f6";
      default:
        return "#ccc";
    }
  }
}
