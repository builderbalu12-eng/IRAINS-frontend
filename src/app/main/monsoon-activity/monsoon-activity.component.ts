import {
  Component,
  Renderer2,
  ElementRef,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import * as L from "leaflet";
import { HttpClient } from "@angular/common/http";
import * as htmlToImage from "html-to-image";
import { DataService } from "src/app/data.service";
import { SubdivisionService } from "src/app/services/subDivision/subDivision.service";
import { SubdivDownloadStatistics } from "src/app/services/subDivision/statisticsdownload.service";
import jsPDF from "jspdf";
import { CountryService } from "src/app/services/country/country.service";
import { Constants } from "src/app/services/constants";
import { MonsoonActivityService } from "src/app/services/subDivision/monsoonActivityDownlaod.service";

@Component({
  selector: 'app-monsoon-activity',
  templateUrl: './monsoon-activity.component.html',
  styleUrls: ['./monsoon-activity.component.css']
})
export class MonsoonActivityComponent {

  isLoading: boolean = false;
  today: string;
  fromDate: string;
  selectedMode: any;
  formatteddate: string;

  private initialZoom = 4.8;
  private defaultFontSizeonMap = 8;
  private map: L.Map = {} as L.Map;

  // Monsoon Activity Data
  monsoonMapData: { [key: string]: any } = {};
  monsoonTableData: any[] = [];

  // Monsoon Activity Legend
  legendItems = [
    { color: "#ff0000", text: "Vigorous", fontSize: "9.3px" },
    { color: "#ff9900", text: "Active", fontSize: "9.3px" },
    { color: "#00ff00", text: "Normal", fontSize: "9.3px" },
    { color: "#ffff00", text: "Weak", fontSize: "9.3px" },
    { color: "#999999", text: "Subdued", fontSize: "9.3px" },
    { color: "#c0c0c0", text: "No Data", fontSize: "9.3px" },
  ];

  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private renderer: Renderer2,
    private elRef: ElementRef,
    private subdivisionService: SubdivisionService,
    private downlaodStatistics: SubdivDownloadStatistics,
    private countryService: CountryService,
    private constants: Constants,
    private monsoonActivityService : MonsoonActivityService
  ) {
    // Set today's date (December 22, 2025 as per context)
    const currentDate = new Date();
    this.today = this.formatDate(currentDate);
    this.fromDate = this.today;

    // Default formatted date for display
    this.formatteddate = this.convertToIndianDateFormat(this.today);
    this.setFromAndToDate()



    // Subscribe to external date changes (if any)
    // this.dataService.fromAndToDate$.subscribe((value) => {
    //   if (value) {
    //     const dates = JSON.parse(value);
    //     this.fromDate = dates.fromDate || this.today;
    //     this.fetchMonsoonActivity();
    //   }
    // });

  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  convertToIndianDateFormat(dateString: string): string {
    return dateString.split("-").reverse().join("-");
  }

  // Fetch Monsoon Activity using POST with { date: "YYYY-MM-DD" }
  async fetchMonsoonActivity() {
    this.isLoading = true;
    try {
      // Use selected date or fallback to today
      const selectedDate = this.fromDate || this.today;

      const payload = {
        date: selectedDate
      };
      const response: any = await this.subdivisionService
        .fetchMonsoonActivitySubDivisions(payload)
        .toPromise();

      if (response && response.success && response.data) {
        this.monsoonMapData = response.data;

        // Prepare sorted table data
        this.monsoonTableData = Object.keys(response.data)
          .map(key => ({
            code: key,
            ...response.data[key]
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        // Update displayed date
        this.formatteddate = this.convertToIndianDateFormat(selectedDate);
      } else {
        console.warn("Invalid or empty response:", response);
        this.monsoonTableData = [];
        this.monsoonMapData = {};
      }
    } catch (error) {
      console.error("Error fetching monsoon activity:", error);
      this.monsoonTableData = [];
      this.monsoonMapData = {};
    } finally {
      this.isLoading = false;
      this.loadGeoJSON(false);
    }
  }

  // Triggered when user selects a new date
  setFromAndToDate() {
    this.fetchMonsoonActivity();
  }

  filter = (node: HTMLElement) => {
    const exclusionClasses = [
      "download", "downloadpdf", "leaflet-control-zoom", "leaflet-control-fullscreen",
      "leaflet-control-zoomin", "ResetMap", "DownloadMaps", "download-buttons",
    ];
    return !exclusionClasses.some((classname) => node.classList?.contains(classname));
  };

  findMatchingData(id: number): any | null {
    const codeStr = id.toString();
    return this.monsoonMapData[codeStr] || null;
  }

  private getActivityColor(activity: string | undefined): string {
    switch (activity) {
      case "Vigorous": return "#ff0000";
      case "Active":   return "#ff9900";
      case "Normal":   return "#00ff00";
      case "Weak":     return "#ffff00";
      case "Subdued":  return "#999999";
      default:         return "#c0c0c0";
    }
  }

  private calculateInitialZoom(): void {
    const cardWidth = window.innerWidth * 0.9;
    const cardHeight = window.innerHeight * 0.7;
    this.initialZoom = Math.log2(Math.max(cardWidth, cardHeight) / 57);
    this.defaultFontSizeonMap = this.initialZoom * 2.33;
  }

  @HostListener("window:resize")
  onWindowResize() {
    if (!this.isFullscreen()) {
      this.calculateInitialZoom();
      if (this.map) {
        this.map.setZoom(this.initialZoom);
        this.map.setView([24, 80.9629], this.initialZoom);
      }
    }
  }

  resetMap(): void {
    this.map.setView([24, 80.9629], this.initialZoom + 1);
  }

  resetMapSmallScreen(): void {
    this.map.setView([24, 80.9629], this.initialZoom);
  }

  downloadMappdf() {
    this.downloadMapImage(true);
  }

  async downloadMapImage(downloadpdf: boolean) {
    if (this.isFullscreen()) {
      this.resetMap();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isLoading = true;
    try {
      const mapElement = document.getElementById("map-subdivisionNavbar") as HTMLElement;
      if (!mapElement) throw new Error("Map element not found");

      const scale = 8;
      const originalWidth = mapElement.clientWidth;
      const originalHeight = mapElement.clientHeight;
      const width = originalWidth * scale;
      const height = originalHeight * scale;

      const dataUrl = await htmlToImage.toJpeg(mapElement, {
        quality: 0.95,
        filter: this.filter,
        width: width,
        height: height,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${originalWidth}px`,
          height: `${originalHeight}px`,
        },
      });

      if (!this.isFullscreen()) {
        const link = document.createElement("a");
        link.download = "MONSOON_ACTIVITY_MAP_INDIA.jpeg";
        link.href = dataUrl;
        downloadpdf ? this.generatePDF(dataUrl) : link.click();
      } else {
        const cropWidth = 1200 * scale;
        const cropHeight = originalHeight + 1155 * scale;
        const cropX = (width - cropWidth) / 2 + 2000;
        const cropY = 0;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cropWidth;
        tempCanvas.height = cropHeight;
        const tempContext = tempCanvas.getContext("2d");

        const image = new Image();
        image.src = dataUrl;
        image.onload = () => {
          tempContext?.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          const croppedDataUrl = tempCanvas.toDataURL("image/jpeg", 0.95);
          const link = document.createElement("a");
          link.download = "MONSOON_ACTIVITY_MAP_INDIA.jpeg";
          link.href = croppedDataUrl;
          downloadpdf ? this.generatePDF(croppedDataUrl) : link.click();
        };
      }
    } catch (error) {
      console.error("Error downloading map image:", error);
    } finally {
      this.isLoading = false;
    }
  }

  generatePDF(imageDataUrl: string) {
    const pdf = new jsPDF("landscape");
    const image = new Image();
    image.src = imageDataUrl;
    image.onload = () => {
      const imgProps = pdf.getImageProperties(imageDataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const aspectRatio = imgProps.width / imgProps.height;

      let newImgWidth = pdfWidth;
      let newImgHeight = pdfWidth / aspectRatio;
      if (newImgHeight > pdfHeight) {
        newImgHeight = pdfHeight;
        newImgWidth = pdfHeight * aspectRatio;
      }

      const xOffset = (pdfWidth - newImgWidth) / 2;
      const yOffset = (pdfHeight - newImgHeight) / 2;

      pdf.addImage(imageDataUrl, "JPEG", xOffset, yOffset, newImgWidth, newImgHeight);
      pdf.save("MONSOON_ACTIVITY_MAP_INDIA.pdf");
    };
  }

  async downloadMapData() {
    this.isLoading = true;
    try {
      if (this.selectedMode?.selectedMode === "Unified") {
        await this.downlaodStatistics.updateanddownloadpdfCustom(this.fromDate, this.fromDate);
      } else {
        await this.downlaodStatistics.updateanddownloadpdfFromDataEntryCustom(this.fromDate, this.fromDate);
      }
    } catch (error) {
      console.error("Error downloading statistics:", error);
    } finally {
      this.isLoading = false;
    }
  }

  ngOnInit() {
    this.initMap();
    this.calculateInitialZoom();
    // this.setFromAndToDate()
    // this.fetchMonsoonActivity(); // Load today's data on start
  }

  ngAfterViewInit(): void {
    // Map already initialized
  }

  private initMap(): void {
    this.map = L.map("map-subdivisionNavbar", {
      center: [24, 81.9629],
      zoom: this.initialZoom,
      scrollWheelZoom: false,
      zoomSnap: 0.1,
      zoomDelta: 0.1,
      zoomControl: false,
      doubleClickZoom: false,
      boxZoom: false,
      touchZoom: false,
    });

    this.map.removeControl(this.map.zoomControl);
    this.map.dragging.disable();

    this.map.on("fullscreenchange", () => {
      this.toggleLogoPosition(this.isFullscreen());
    });

    const fullscreenControl = new (L.Control as any).Fullscreen({
      title: { false: "View Fullscreen", true: "Exit Fullscreen" },
      content: '<i class="bi bi-arrows-fullscreen"></i>',
    });
    this.map.addControl(fullscreenControl);
  }

  public isFullscreen(): boolean {
    return !!(document.fullscreenElement);
  }

  private toggleLogoPosition(isFullscreen: boolean): void {
    const logoImage = this.elRef.nativeElement.querySelector("#logoImage2Navbar");
    const Header = this.elRef.nativeElement.querySelector("#middle-header-subdivNavbar");
    const directionCompass = this.elRef.nativeElement.querySelector("#compassArrow-subdivNavbar");
    const resetButton = this.elRef.nativeElement.querySelector("#resetButtonNavbar");
    const legendsColor = this.elRef.nativeElement.querySelector("#leaflet-bottom-subdivNavbar");
    const celebrations = this.elRef.nativeElement.querySelector("#celebrations-subdivNavbar");
    const country_val = this.elRef.nativeElement.querySelector("#country_values_subdivision_allmapsNavbar");

    if (isFullscreen) {
      this.map.addControl(this.map.zoomControl);
      this.map.dragging.enable();
      this.map.setZoom(this.initialZoom + 1);
      this.defaultFontSizeonMap = (this.initialZoom + 1) * 2;
      this.loadGeoJSON(true);

      this.renderer.setStyle(logoImage, "position", "absolute");
      this.renderer.setStyle(logoImage, "left", "26%");
      this.renderer.setStyle(logoImage, "top", "3.25%");
      this.renderer.setStyle(Header, "position", "absolute");
      this.renderer.setStyle(Header, "left", "10%");
      this.renderer.setStyle(Header, "top", "5%");
      this.renderer.setStyle(directionCompass, "position", "absolute");
      this.renderer.setStyle(directionCompass, "right", "40%");
      this.renderer.setStyle(directionCompass, "top", "20%");
      this.renderer.setStyle(legendsColor, "margin-left", "28%");
      this.renderer.setStyle(legendsColor, "margin-right", "20%");
      this.renderer.setStyle(celebrations, "position", "absolute");
      this.renderer.setStyle(celebrations, "right", "30%");
      this.renderer.setStyle(celebrations, "top", "5%");
      this.renderer.setStyle(celebrations, "width", "20%");
      this.renderer.setStyle(celebrations, "height", "auto");
      this.renderer.setStyle(celebrations, "zoom", "100%");
      this.renderer.setStyle(country_val, "position", "absolute");
      this.renderer.setStyle(country_val, "left", "53%");
      this.renderer.setStyle(country_val, "top", "65%");
      this.renderer.setStyle(resetButton, "position", "absolute");
      this.renderer.setStyle(resetButton, "left", "42.7%");
      this.renderer.setStyle(resetButton, "top", "5%");
    } else {
      this.map.removeControl(this.map.zoomControl);
      this.map.dragging.disable();
      this.map.setZoom(this.initialZoom);
      this.defaultFontSizeonMap = this.initialZoom * 2;
      this.loadGeoJSON(false);

      const elements = [logoImage, Header, directionCompass, legendsColor, celebrations, country_val, resetButton];
      const styles = ["position", "left", "top", "right", "margin-left", "margin-right", "width", "height", "zoom"];
      elements.forEach(el => {
        if (el) styles.forEach(style => this.renderer.removeStyle(el, style));
      });
    }
  }

  private loadGeoJSON(isFullScreen: boolean): void {
    this.http.get("assets/geojson/INDIA_SUB_DIVISION.json").subscribe((res: any) => {
      L.geoJSON(res, {
        style: (feature: any) => {
          const id2 = feature.properties["SubDiv_Cod"];
          const matchedData = this.findMatchingData(id2);
          const color = this.getActivityColor(matchedData?.activity);

          return {
            fillColor: color,
            weight: 1,
            opacity: 0.3,
            color: "black",
            fillOpacity: 1,
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          let id1 = feature.properties["subdivisio"];
          const id2 = feature.properties["SubDiv_Cod"];
          const matchedData = this.findMatchingData(id2);
          const activityText = matchedData ? matchedData.activity : "NA";

          let center = {
            lat: feature.properties["lat"],
            lng: feature.properties["lng"],
          };

          // Your original subdivision-specific label adjustments
          if (id1 === "ARUNACHAL PRADESH") { center.lat = 28; center.lng = 96.5; }
          if (id1 === "ASSAM & MEGHALAYA") { center.lat = 26.5; center.lng = 93.9; }
          if (id1 === "NMMT") { center.lat = 23.5; center.lng = 94; }
          if (id1 === "SHWB & SIKKIM") { center.lat = 27.5; center.lng = 89.5; }
          if (id1 === "GANGETIC WEST BENGAL") { center.lat = 22.5; center.lng = 89; }
          if (id1 === "JHARKHAND") { center.lat = 23; center.lng = 86; }
          if (id1 === "BIHAR") { center.lat = 25.5; center.lng = 87; }
          if (id1 === "EAST UTTAR PRADESH") { center.lat = 27.2; center.lng = 82.8; }
          if (id1 === "WEST UTTAR PRADESH") { center.lat = 28; center.lng = 80; }
          if (id1 === "UTTARAKHAND") { center.lat = 30.8; center.lng = 80.3; }
          if (id1 === "DELHI, HARYANA AND CHANDIGARH") { center.lat = 28.8; center.lng = 77.1; }
          if (id1 === "PUNJAB") { center.lat = 31.3; center.lng = 76.5; }
          if (id1 === "HIMACHAL PRADESH") { center.lat = 32.7; center.lng = 78.3; }
          if (id1 === "JAMMU & KASHMIR AND LADAKH") { center.lat = 34; center.lng = 77.5; }
          if (id1 === "WEST RAJASTHAN") { center.lat = 27; center.lng = 73.5; }
          if (id1 === "EAST RAJASTHAN") { center.lat = 26.4; center.lng = 76; }
          if (id1 === "ODISHA") { center.lat = 20.5; center.lng = 85.7; }
          if (id1 === "WEST MADHYA PRADESH") { center.lat = 24; center.lng = 78; }
          if (id1 === "EAST MADHYA PRADESH") { center.lat = 23.9; center.lng = 81.5; }
          if (id1 === "GUJARAT REGION") { center.lat = 23.5; center.lng = 73.8; }
          if (id1 === "SAURASHTRA & KUTCH") { center.lat = 23; center.lng = 71.3; }
          if (id1 === "KONKAN & GOA") { center.lat = 19.5; center.lng = 74; }
          if (id1 === "MADHYA MAHARASHTRA") { center.lat = 17.9; center.lng = 75.3; }
          if (id1 === "MARATHWADA") { center.lat = 19.7; center.lng = 77; }
          if (id1 === "VIDARBHA") { center.lat = 21; center.lng = 79; }
          if (id1 === "CHHATTISGARH") { center.lat = 22; center.lng = 83; }
          if (id1 === "ANDAMAN & NICOBAR ISLANDS") { center.lat = 9.8; center.lng = 94; }
          if (id1 === "COASTAL ANDHRA PRADESH & YANAM") { center.lat = 15.5; center.lng = 82.5; }
          if (id1 === "TELANGANA") { center.lat = 17.5; center.lng = 80; }
          if (id1 === "RAYALSEEMA") { center.lat = 15; center.lng = 79; }
          if (id1 === "TAMILNADU, PUDUCHERRY & KARAIKAL") { center.lat = 11.1; center.lng = 80; }
          if (id1 === "COASTAL KARNATAKA") { center.lat = 15; center.lng = 74.7; }
          if (id1 === "NORTHERN INTERIOR KARNATAKA") { center.lat = 16.5; center.lng = 77; }
          if (id1 === "SOUTHERN INTERIOR KARNATAKA") { center.lat = 13.5; center.lng = 78; }
          if (id1 === "KERALA & MAHE") { center.lat = 10.4; center.lng = 77; }
          if (id1 === "LAKSHADWEEP") { center.lat = 10.8; center.lng = 73.5; }

          if (center.lat && center.lng) {
            const labelId = `label-${id2}`;
            const existingLabel = document.getElementById(labelId);
            if (existingLabel) existingLabel.remove();

            L.marker([center.lat, center.lng], {
              icon: L.divIcon({
                className: "state-label",
                html: `
                  <div id="${labelId}" style="font-size: ${this.defaultFontSizeonMap}px; font-weight: 1000; color: #002467; text-align: center; white-space: nowrap;">
                    <div>${id1}</div>
                    <div>${activityText}</div>
                  </div>
                `,
                iconSize: isFullScreen ? [200, 20] : [150, 20],
              }),
            }).addTo(this.map);
          }
        },
      }).addTo(this.map);
    });
  }


  async downloadMonsoonActivityTable() {
    this.isLoading = true;
    try {
      if (this.monsoonTableData.length === 0) {
        alert("No monsoon activity data available to download for the selected date.");
        return;
      }

      // Use the dedicated service to download PDF + Excel
      await this.monsoonActivityService.downloadMonsoonActivityPdf(
        this.monsoonTableData,
        this.fromDate || this.today
      );

      console.log("Monsoon activity statistics downloaded successfully (PDF + Excel)");

    } catch (error) {
      console.error("Error downloading monsoon activity table:", error);
      alert("Failed to download statistics. Please try again.");
    } finally {
      this.isLoading = false;
    }
  }
}