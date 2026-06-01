import { skip } from 'rxjs';
import {
  Component,
  Input,
  Renderer2,
  ElementRef,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import * as L from "leaflet";
import { HttpClient } from "@angular/common/http";
import * as htmlToImage from "html-to-image";
import { DataService } from "src/app/data.service";
import { CalculationsModeService } from 'src/app/services/calculationsMode.service';
import { DistrictService } from "src/app/services/district/district.service";
import { DownloadPdf } from "src/app/services/district/pdfdownload.service";
import jsPDF from "jspdf";
import { CountryService } from "src/app/services/country/country.service";
import { Constants } from "src/app/services/constants";

@Component({
  selector: "app-district-map",
  templateUrl: "./district-map.component.html",
  styleUrls: ["./district-map.component.css"],
})
export class DistrictMapComponent implements AfterViewInit {
  private modeSub?: any;
  districtdatacum: any[] = [];
  StartDate: any;
  EndDate: any;
  isLoading: any = false;
  countrydatacum: any;
  countryActual: any;
  countryNormal: any;
  countryDeparture: any;
  isBuffering: any = false;

  // downloadMapData
  // () {
  // this.downloadPdf$.updateanddownloadpdf()
  // }
  // // downloadMappdf() {
  // // this.downloadPdf$.updateanddownloadpdf()
  // // }
  async downloadMapData() {
    this.isLoading = true;
    try {
      this.isLoading = true;
      await this.downloadPdf$.updateanddownloadpdfFromDataEntry();
      this.isLoading = false;
    } catch (error) {
      console.error("Error downloading map data:", error);
    }
  }

  legendItems = [
    {
      color: "#0096ff",
      text: `Large Excess <br>[60% or more]`,
      fontSize: "9.3px",
    },
    { color: "#32c0f8", text: "Excess <br>[20 to 59]%", fontSize: "9.3px" },
    { color: "#00cd5b", text: "Normal <br>[-19 to 19]%", fontSize: "9.3px" },
    {
      color: "#ff2700",
      text: "Deficient <br>[-59 to -20]%",
      fontSize: "9.3px",
    },
    {
      color: "#ffff20",
      text: "Large Deficient <br>[-99 to -60]%",
      fontSize: "9.3px",
    },
    { color: "#ffffff", text: "No Rain <br>[-100]%", fontSize: "9.3px" },
    { color: "#c0c0c0", text: "No <br>Data", fontSize: "9.3px" },
  ];

  formatteddate: any;
  selectedDate: Date = new Date();
  inputValue: string = "";
  inputValue1: string = "";
  private initialZoom = 3.8;
  private map: L.Map = {} as L.Map;
  private stateLayers: { [key: string]: L.GeoJSON } = {}; // Store state layers by state name
  private districtLayer: L.GeoJSON | null = null;

  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private calcMode: CalculationsModeService,
    private renderer: Renderer2,
    private elRef: ElementRef,
    private district: DistrictService,
    private downloadPdf$: DownloadPdf,
    private countryService: CountryService,
    private constants: Constants
  ) {
    // var currentDate = new Date();
    // var dd = String(currentDate.getDate());
    // var mon = String(currentDate.getMonth());
    // var year = String(currentDate.getFullYear());
    // this.formatteddate = `${dd.padStart(2, '0')}-${mon.padStart(2, '0')}-${year}`;

    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mon = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = String(currentDate.getFullYear());
    this.formatteddate = `${dd}-${mon}-${year}`;

    this.dataService.fromAndToDate$.subscribe((value) => {
      if (value) {
        let fromAndToDates = JSON.parse(value);
        this.StartDate = fromAndToDates.fromDate;
        this.EndDate = fromAndToDates.toDate;
        // console.log(this.previousWeekWeeklyStartDate, this.previousWeekWeeklyEndDate);
      } else {
        this.StartDate = `${year}-${mon}-${dd}`;
        this.EndDate = `${year}-${mon}-${dd}`;
      }
      this.calculateInitialZoom();
      this.fetchBackend();
    });
  }

  convertToIndianDateFormat = (dateString: string) =>
    dateString.split("-").reverse().join("-");

  ngOnDestroy(): void {
    this.modeSub?.unsubscribe();
  }

  ngOnInit(): void {
    this.initMap()
    this.modeSub = this.calcMode.useAws$.pipe(skip(1)).subscribe(() => this.fetchBackend());
  }

  async fetchBackend() {
    this.isBuffering = true;
    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mon = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = String(currentDate.getFullYear());

    const data = {
      startDate: this.StartDate,
      endDate: this.EndDate,
    };
    console.log("Fetching district data with dates:", data);
    console.log("AWS mode enabled:", this.calcMode.isAwsEnabled);
    (this.calcMode.isAwsEnabled ? this.district.fetchDataWithAWS(data) : this.district.fetchData(data)).subscribe({
      next: (res) => {
        this.districtdatacum = res.data || [];
        console.log(
          "Fetched district data length:",
          this.districtdatacum.length
        );
        console.log(
          "Sample district data (first 5 entries):",
          this.districtdatacum.slice(0, 5)
        ); // Log first 5 entries
        if (this.districtdatacum.length === 0) {
          console.warn("Warning: districtdatacum is empty!");
        }
        this.loadGeoJSON(); // Trigger GeoJSON loading after data is fetched
        this.StartDate = this.convertToIndianDateFormat(this.StartDate);
        this.EndDate = this.convertToIndianDateFormat(this.EndDate);
        this.isBuffering = false;
      },
      error: (err) => {
        console.error("Error fetching district data:", err);
        this.isBuffering = false;
        this.districtdatacum = []; // Reset to empty array on error
        console.warn(
          "Loading GeoJSON with empty districtdatacum due to error."
        );
        this.loadGeoJSON(); // Attempt to load with empty data for debugging
      },
    });

    (this.calcMode.isAwsEnabled ? this.countryService.fetchDataWithAWS(data) : this.countryService.fetchData(data)).subscribe({
      next: (res) => {
        this.countrydatacum = res.data;
        this.countryActual = this.constants.trimToOneDecimals(
          this.countrydatacum[0].actual_rainfall
        );
        this.countryNormal = this.constants.trimToOneDecimals(
          parseFloat(this.countrydatacum[0].rainfall_normal_value)
        );
        this.countryDeparture = Math.round(this.countrydatacum[0].departure);
        console.log(
          "Country data:",
          this.countrydatacum,
          this.countryActual,
          this.countryDeparture,
          this.countryNormal
        );
      },
      error: (err) => {
        console.error("Error fetching country data:", err);
      },
    });
  }

  filter = (node: HTMLElement) => {
    const exclusionClasses = [
      "download",
      "downloadpdf",
      "leaflet-control-zoom",
      "leaflet-control-fullscreen",
      "leaflet-control-zoomin",
      "download-buttons",
      "download-buttons-2",
      "DownloadMaps",
      "ResetMap",
    ];
    return !exclusionClasses.some((classname) =>
      node.classList?.contains(classname)
    );
  };

  findMatchingData(id: number): any | null {
    console.log(
      "Searching for district code:",
      id,
      "in districtdatacum:",
      this.districtdatacum
    );
    const matchedData = this.districtdatacum?.find((data: any) => {
      const dataId =
        data.district_code?.toString() || data.districtCode?.toString(); // Try alternate key

      return dataId === id.toString();
    });
    console.log("Match found:", matchedData);
    return matchedData || null;
  }

  downloadMappdf() {
    this.downloadMapImage(true);
  }

  async downloadMapImage(downloadpdf: boolean) {
    if (this.isFullscreen()) {
      this.resetMap();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    this.isLoading = true;

    try {
      const mapElement = document.getElementById("map-district") as HTMLElement;
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
        link.download = "DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_cd.jpeg";
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
          link.download = "DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_cd.jpeg";
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
      pdf.save("DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_cd.pdf");
    };
  }

  

  // ngAfterViewInit(): void {
  // this.loadStateGeoJSON(); // Load state layer first
  // this.loadGeoJSON();
  // }
  async ngAfterViewInit(): Promise<void> {
    await this.loadStateGeoJSON(); // Wait for state GeoJSON to load
    this.loadGeoJSON();
  }

  private calculateInitialZoom(): void {
    const cardWidth = window.innerWidth * 0.9;
    const cardHeight = window.innerHeight * 0.7;
    this.initialZoom = this.calculateZoomLevel(cardWidth, cardHeight);
  }

  private calculateZoomLevel(width: number, height: number): number {
    const zoomLevel = Math.log2(Math.max(width, height) / 57);

    return zoomLevel;
  }

  @HostListener("window:resize")
  onWindowResize() {
    if (!this.isFullscreen()) {
      this.calculateInitialZoom();
      if (this.map) {
        this.map.setZoom(this.initialZoom);
        console.log("hii");
        this.map.setView([24, 81.9629], this.initialZoom);
      }
    }
  }

  resetMap(): void {
    this.map.setView([24, 80.9629], this.initialZoom + 0.3);
  }
  resetMapSmallScreen(): void {
    this.map.setView([24, 81.9629], this.initialZoom);
  }

  private initMap(): void {
    this.map = L.map("map-district", {
      center: [24, 81.9629],
      zoom: this.initialZoom,
      scrollWheelZoom: false,
      zoomSnap: 0.1,
      zoomDelta: 0.1,
      touchZoom: false,
    });

    this.map.removeControl(this.map.zoomControl);
    this.map.dragging.disable();

    this.map.on("fullscreenchange", () => {
      this.toggleLogoPosition(this.isFullscreen());
    });

    const fullscreenControl = new (L.Control as any).Fullscreen({
      title: {
        false: "View Fullscreen",
        true: "Exit Fullscreen",
      },
      content: '<i class="bi bi-arrows-fullscreen"></i>',
    });

    this.map.addControl(fullscreenControl);
  }
  // public isFullscreen(): boolean {
  // return !!(
  // document.fullscreenElement ||
  // document.fullscreenElement ||
  // document.fullscreenElement ||
  // document.fullscreenElement
  // );
  // }
  public isFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  private toggleLogoPosition(isFullscreen: boolean): void {
    const logoImage = this.elRef.nativeElement.querySelector(
      "#logoImage-district"
    );
    const Header = this.elRef.nativeElement.querySelector(
      "#middle-header-district"
    );
    const directionCompass = this.elRef.nativeElement.querySelector(
      "#compassArrow-district"
    );
    // const btn = this.elRef.nativeElement.querySelector('#all-btn-district');
    const resetButton = this.elRef.nativeElement.querySelector("#resetButton");

    let legendsColor = this.elRef.nativeElement.querySelector(
      "#leaflet-bottom-district"
    );
    const celebrations = this.elRef.nativeElement.querySelector(
      "#celebrations-district"
    );
    const country_val = this.elRef.nativeElement.querySelector(
      "#country_values_district_all_maps"
    );

    const borderRemove = this.elRef.nativeElement.querySelector(
      "#border-remove-district"
    );

    if (isFullscreen) {
      this.map.addControl(this.map.zoomControl);
      this.map.dragging.enable();
      this.map.scrollWheelZoom.enable(); // Enable mouse scroll zooming
      this.map.touchZoom.enable(); // Enable touch zooming

      this.map.setZoom(this.initialZoom + 0.3);

      this.map.setZoom(this.initialZoom + 0.3);
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

      this.map.setZoom(this.initialZoom);

      this.renderer.removeClass(borderRemove, "no-border");
      this.renderer.setStyle(borderRemove, "border", "2px solid black");

      this.map.setZoom(this.initialZoom);

      this.renderer.removeStyle(logoImage, "position");
      this.renderer.removeStyle(logoImage, "left");
      this.renderer.removeStyle(logoImage, "top");

      this.renderer.removeStyle(Header, "position");
      this.renderer.removeStyle(Header, "left");
      this.renderer.removeStyle(Header, "top");

      this.renderer.removeStyle(directionCompass, "position");
      this.renderer.removeStyle(directionCompass, "right");
      this.renderer.removeStyle(directionCompass, "top");

      this.renderer.removeStyle(celebrations, "position");
      this.renderer.removeStyle(celebrations, "right");
      this.renderer.removeStyle(celebrations, "top");
      this.renderer.removeStyle(celebrations, "width"); // Set the desired width in percentage
      this.renderer.removeStyle(celebrations, "height");

      this.renderer.removeStyle(legendsColor, "margin-left");
      this.renderer.removeStyle(legendsColor, "margin-right");
      // this.renderer.removeStyle(legendsColor, 'display');

      this.renderer.removeStyle(country_val, "position");
      this.renderer.removeStyle(country_val, "left");
      this.renderer.removeStyle(country_val, "top");

      this.renderer.removeStyle(resetButton, "position");
      this.renderer.removeStyle(resetButton, "left");
      this.renderer.removeStyle(resetButton, "top");
    }
  }

  private async loadStateGeoJSON(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get("assets/geojson/INDIA_STATE.json").subscribe({
        next: (res: any) => {
          console.log(
            "State GeoJSON loaded, number of features:",
            res.features.length
          );
          console.log("First feature properties:", res.features[0]?.properties);
          const stateLayer = L.geoJSON(res, {
            style: (feature: any) => ({
              fillOpacity: 0, // Transparent fill to avoid covering districts
              weight: 1, // Reduced to 1 for thinner borders (adjust as needed)
              color: "#000000", // Black color for state boundaries
              opacity: 1, // Fully opaque
            }),
            onEachFeature: (feature: any, layer: any) => {
              const stateName = feature.properties.state_name?.toLowerCase();
              console.log("Storing state:", stateName);
              if (stateName) {
                this.stateLayers[stateName] = layer;
              } else {
                console.warn(
                  "State name undefined for feature:",
                  feature.properties
                );
              }
              // Ensure each state feature is styled individually
              layer.setStyle({
                fillOpacity: 0,
                weight: 1, // Reduced to 1 for thinner borders (adjust as needed)
                color: "#000000",
                opacity: 1,
              });
            },
          }).addTo(this.map);
          stateLayer.setZIndex(1);  // keep state borders behind district layer so district gets mouse events
          console.log("State layers populated:", Object.keys(this.stateLayers));
          resolve();
        },
        error: (err) => {
          console.error("Error loading state GeoJSON:", err);
          reject(err);
        },
      });
    });
  }

  private loadGeoJSON(): void {
    this.http
      .get("assets/geojson/INDIA_DISTRICT.json")
      .subscribe((res: any) => {
        console.log(
          "District GeoJSON loaded, number of features:",
          res.features.length
        );
        console.log(
          "First district feature properties:",
          res.features[0]?.properties
        );
        if (this.districtLayer) {
          this.map.removeLayer(this.districtLayer); // Remove existing layer to avoid conflicts
        }
        this.districtLayer = L.geoJSON(res, {
          style: (feature: any) => {
            const id2 = feature.properties["district_c"];
            console.log("Processing district code from GeoJSON:", id2);
            const matchedData = this.findMatchingData(id2);
            let rainfall: any;
            if (matchedData && matchedData.departure != null) {
              rainfall = Math.round(matchedData.departure);
              console.log("Matched rainfall for district", id2, ":", rainfall);
            } else {
              rainfall = "NA";
              console.log(
                "No match or no departure for district code:",
                id2,
                "districtdatacum sample:",
                this.districtdatacum.slice(0, 2)
              );
            }
            const color =
              this.constants.getColorForRainfall(rainfall) || "#C0C0C0"; // Default to gray if no color
            console.log("Assigned color for rainfall", rainfall, ":", color);
            return {
              fillColor: color,
              weight: 0.4,
              opacity: 1,
              color: "black",
              fillOpacity: 1,
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            const state =
              feature.properties.state?.toLowerCase() ||
              feature.properties.State?.toLowerCase() ||
              feature.properties.state_name?.toLowerCase() ||
              feature.properties.ST_NM?.toLowerCase();
            console.log(
              "District state:",
              state,
              "Properties:",
              feature.properties
            );
            const id1 = feature.properties["district"];
            const id2 = feature.properties["district_c"];
            const matchedData = this.findMatchingData(id2);
            let rainfall: any;
            if (matchedData) {
              if (Number.isNaN(matchedData.actual_rainfall)) {
                rainfall = "NA";
              } else {
                rainfall = Math.round(matchedData.departure);
              }
            } else {
              rainfall = -100;
            }
            const dailyrainfall =
              matchedData &&
              matchedData.actual_rainfall !== null &&
              matchedData.actual_rainfall != undefined &&
              !Number.isNaN(matchedData.actual_rainfall)
                ? this.constants.trimToOneDecimals(
                    matchedData.actual_rainfall
                  ) + " mm"
                : "NA";
            const normalrainfall =
              matchedData && !Number.isNaN(matchedData.normal_rainfall)
                ? this.constants.trimToOneDecimals(
                    parseFloat(matchedData.normal_rainfall)
                  ) + " mm"
                : "NA";
            const popupContent = `
  <div style="background:white;padding:8px;font-family:Arial,sans-serif;min-width:190px;">
    <div style="color:#002467;font-weight:bold;font-size:13px;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:4px;">STATE: ${state || 'Unknown'}</div>
    <div style="color:#002467;font-weight:bold;font-size:13px;">DISTRICT: ${id1}</div>
    <div style="font-size:12px;margin-top:4px;"><b>Actual:</b> ${dailyrainfall}</div>
    <div style="font-size:12px;"><b>Normal:</b> ${normalrainfall}</div>
    <div style="font-size:12px;"><b>Departure:</b> ${rainfall ?? 'NA'}%</div>
    <div style="border-top:1px solid #eee;padding-top:4px;margin-top:4px;">
      <div style="font-size:11px;color:#555;"><b>IMD Stations:</b> ${matchedData?.station_details_count ?? 'NA'}</div>
      <div style="font-size:11px;color:#555;"><b>AWS Stations:</b> ${matchedData?.aws_station_count ?? 'NA'}</div>
      <div style="font-size:11px;color:#555;"><b>Total Stations:</b> ${matchedData?.total_station_count ?? 'NA'}</div>
                  <div style="font-size:11px;color:#555;"><b>IMD Rainfall Sum:</b> ${matchedData?.station_details_rainfall_sum != null ? matchedData.station_details_rainfall_sum.toFixed(1) + ' mm' : 'NA'}</div>
                  <div style="font-size:11px;color:#555;"><b>AWS Rainfall Sum:</b> ${matchedData?.aws_station_rainfall_sum != null ? matchedData.aws_station_rainfall_sum.toFixed(1) + ' mm' : 'NA'}</div>
    </div>
  </div>
  `;

            // Enable interactivity for the layer
            layer.options.interactive = true;

            layer.on('mouseover', () => {
              layer.bindTooltip(popupContent, { sticky: true, opacity: 0.95 }).openTooltip();
              const stateLayer = this.stateLayers[state];
              if (stateLayer) {
                stateLayer.setStyle({
                  weight: 5,
                  color: "#000000",
                  opacity: 1,
                  fillColor: "#FFFFFF",
                  fillOpacity: 0.1,
                });
                if (this.districtLayer) {
                  this.districtLayer.eachLayer((district: any) => {
                    const districtState =
                      district.feature.properties.state?.toLowerCase() ||
                      district.feature.properties.State?.toLowerCase() ||
                      district.feature.properties.state_name?.toLowerCase() ||
                      district.feature.properties.ST_NM?.toLowerCase();
                    district.setStyle({
                      fillOpacity: districtState === state ? 1 : 0.3,
                    });
                  });
                }
              } else {
                console.warn(`State layer not found for state: ${state}`);
              }
            });

            layer.on("mouseout", (e: any) => {
              console.log("Mouseout event triggered for district:", id1);
              layer.closeTooltip();
              const stateLayer = this.stateLayers[state];
              if (stateLayer) {
                stateLayer.setStyle({
                  weight: 3,
                  color: "#000000",
                  opacity: 1,
                  fillOpacity: 0,
                });
                if (this.districtLayer) {
                  this.districtLayer.eachLayer((district: any) => {
                    district.setStyle({
                      fillOpacity: 1,
                    });
                  });
                }
              }
            });
          },
        }).addTo(this.map);
        this.districtLayer.bringToBack();
        console.log(
          "District layer added, layer count:",
          this.districtLayer.getLayers().length
        );
        this.map.invalidateSize(); // Force map to recalculate layer positions
      });
  }

  getColorForRainfall1(rainfall: any): string {
    const numericId = Math.round(rainfall);
    let cat = "";
    let count = 0;

    if (rainfall == null || rainfall === " ") {
      return "#c0c0c0";
    }
    if (numericId >= 60) {
      cat = "LE";
      return "#0393ff";
    }
    if (numericId >= 20 && numericId < 60) {
      cat = "E";
      return "#69bef7";
    }
    if (numericId >= -19 && numericId < 20) {
      cat = "N";
      return "#68dd58";
    }
    if (numericId >= -59 && numericId < -19) {
      cat = "D";
      return "#fb4111";
    }
    if (numericId >= -99 && numericId < -59) {
      cat = "LD";
      return "#ffff00";
    }

    if (numericId == -100) {
      cat = "NR";
      count = count + 1;
      return "#ffffff";
    } else {
      cat = "ND";
      return "#c0c0c0";
    }
  }
}
