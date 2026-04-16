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
import { DistrictService } from "src/app/services/district/district.service";
import { DownloadPdf } from "src/app/services/block/pdfdownload.service";
import jsPDF from "jspdf";
import { CountryService } from "src/app/services/country/country.service";
import { Constants } from "src/app/services/constants";

import { getRegionService } from "src/app/services/region/getregion.service";
import { CenterService } from "src/app/services/centre/centre.service";
import { getStateService } from "src/app/services/state/getState.service";
import { getDistrictService } from "src/app/services/district/getdistrict.service";
import { getBlockService } from "src/app/services/block/getblock.service";
import { BlockService } from "src/app/services/block/BlockService.service";
@Component({
  selector: 'app-block-actual-rainfall-map-daily-main-page-pubic',
  templateUrl: './block-actual-rainfall-map-daily-main-page-pubic.component.html',
  styleUrls: ['./block-actual-rainfall-map-daily-main-page-pubic.component.css']
})
export class BlockActualRainfallMapDailyMainPagePubicComponent {

  blockdatacum: any[] = [];
  StartDate: any;
  EndDate: any;
  countrydatacum: any;
  countryActual: any;
  countryNormal: any;
  countryDeparture: any;
  isLoading = false;
  selecteddatamode: any = "Actual";

  today: any;

  fromDate: any = this.formatDate(new Date());
  toDate: any = this.formatDate(new Date());
  selectedMode: any;
  selectedRegion: any;
  regions: any[] | undefined;
  regionName: any;
  // selectedMC: any;
  // centersMC1: any[] | undefined;
  // mcDisabled: any = false;
  // selectedRMC: any;
  // centersRMC1: any[] | undefined;
  // rmcDisabled: any = false;
  selectedState: any;
  filterStates: any[] | undefined;
  filterDistrict: any[] | undefined;
  centersMC: any[] = [];
  centersRMC: any[] = [];
  states: any[] = [];
  districts: any[] = [];
  blocks: any[] = [];

  selectedMCData: any[] = [];
  selectedRMCData: any[] = [];
  selectedStateData: any[] = [];
  selectedDistrictData: any[] = [];

  private geoJsonLayer: L.GeoJSON | null = null; // Store the GeoJSON layer
  private geoJsonData: any; // Store the full GeoJSON data
  filterBlocks: any[] | undefined;
  selectedBlockData: any;

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero based
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }

  // async downloadMapData() {
  //   this.isLoading = true;
  //   try {
  //     this.isLoading = true;
  //     this.isLoading = true;
  //     if(this.selectedMode.selectedMode == 'Unified'){
  //       await this.downloadPdf$.updateanddownloadpdfCustom(this.fromDate, this.fromDate);
  //     }else{
  //       await this.downloadPdf$.updateanddownloadpdfCustom(this.fromDate, this.fromDate);
  //     }
  //             this.isLoading = false;
  //   } catch (error) {
  //     console.error("Error downloading map data:", error);
  //   }
  // }

  selectDataMode(mode: string) {
    this.selecteddatamode = mode;
    let data = {
      selecteddatamode: mode,
    };
    this.dataService.setDataMode(JSON.stringify(data));
  }

  async downloadMapData() {
    this.isLoading = true;
    try {
      // Prepare filter parameters
      const filters: any = {
        // region_code: this.selectedRegion?.map((r: any) => r.toString()) || [],
        // centre: [
        //   ...(this.selectedMC?.map(
        //     (mc: any) => `${mc.centre_type} ${mc.centre_name}`
        //   ) || []),
        //   ...(this.selectedRMC?.map(
        //     (rmc: any) => `${rmc.centre_type} ${rmc.centre_name}`
        //   ) || []),
        // ],
        state_code:
          this.selectedState?.map((s: any) => s.state_code.toString()) || [],
        district_code:
          this.selectedDistrictData?.map((d: any) =>
            d.district_code.toString()
          ) || [],
        block_code:
          this.selectedBlockData?.map((b: any) => b.block_code.toString()) ||
          [],
      };

      // Call the DownloadPdf service with filters
      await this.downloadPdf$.updateanddownloadpdfCustom(
        this.fromDate,
        this.toDate,
        filters
      );
      this.isLoading = false;
    } catch (error) {
      console.error("Error downloading map data:", error);
      this.isLoading = false;
    }
  }

  legendItems = [
    {
      color: "#F5F5F5",
      text: `Zero Rainfall <br>[0]`,
      fontSize: "9.3px",
    },
    {
      color: "#277620",
      text: `Very light to light <br>[0 to 15.5]mm`,
      fontSize: "11.6px",
    },
    {
      color: "#1f9ee7",
      text: "Moderate <br>[15.6 to 64.4]mm",
      fontSize: "11.6px",
    },
    {
      color: "#f3e821",
      text: "Heavy <br>[64.5 to 115.5]mm",
      fontSize: "11.6px",
    },
    {
      color: "#ff8b00",
      text: "Very Heavy <br>[115.6 to 204.4]mm",
      fontSize: "11.6px",
    },
    {
      color: "#da1b1e",
      text: "Extremely Heavy <br>[>=204.5]mm",
      fontSize: "11.6px",
    },
    {
      color: "#c0c0c0",
      text: "No Data",
      fontSize: "11.6px",
    },
  ];

  formatteddate: any;
  selectedDate: Date = new Date();
  inputValue: string = "";
  inputValue1: string = "";
  private initialZoom = 3.8;
  private map: L.Map = {} as L.Map;

  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private renderer: Renderer2,
    private elRef: ElementRef,
    // private district: DistrictService,
    private block: BlockService,
    private downloadPdf$: DownloadPdf,
    private countryService: CountryService,
    private constants: Constants,
    private regionService: getRegionService,
    // private centerService: CenterService,
    private getStateService: getStateService,
    private getDistrictService: getDistrictService,
    private getBlockService: getBlockService
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

  // onRegionChange(): void {
  //   console.log("Selected Region:", this.selectedRegion);

  //   // Clear all dependent dropdown selections
  //   this.selectedMC = [];
  //   this.selectedRMC = [];
  //   this.selectedState = [];
  //   this.selectedDistrictData = [];
  //   this.selectedBlockData = [];

  //   // Reset dependent dropdown data
  //   this.centersMC1 = [];
  //   this.centersRMC1 = [];
  //   this.filterStates = [];
  //   this.filterDistrict = [];
  //   this.filterBlocks = [];

  //   // Enable MC and RMC dropdowns
  //   this.mcDisabled = false;
  //   this.rmcDisabled = false;

  //   if (this.selectedRegion && this.selectedRegion.length > 0) {
  //     // Filter MCs based on selected Region
  //     const filteredCentersMC = this.centersMC[0]?.filter((center: any) =>
  //       this.selectedRegion.includes(center.region_code)
  //     );
  //     this.centersMC1 = filteredCentersMC || [];
  //     console.log("Filtered MCs:", this.centersMC1);

  //     // Filter RMCs based on selected Region
  //     const filteredCentersRMC = this.centersRMC[0]?.filter((center: any) =>
  //       this.selectedRegion.includes(center.region_code)
  //     );
  //     this.centersRMC1 = filteredCentersRMC || [];
  //     console.log("Filtered RMCs:", this.centersRMC1);

  //     // Update States based on Region (since no MC or RMC is selected yet)
  //     this.updateStatesByRegion();

  //     // Update the map
  //     this.updateMap();
  //   } else {
  //     // If no Region selected, reset to full datasets
  //     this.centersMC1 = this.centersMC[0] || [];
  //     this.centersRMC1 = this.centersRMC[0] || [];
  //     this.filterStates = this.states[0]?.data || [];
  //     this.filterDistrict = this.districts[0]?.data || [];
  //     this.filterBlocks = this.blocks[0]?.data || [];
  //     this.updateMap();
  //   }
  // }

  // Helper method to update States based on Region
  private updateStatesByRegion(): void {
    if (this.selectedRegion.length > 0) {
      const regionCodes = this.selectedRegion.map((r: any) => r.toString());
      const filteredStates = this.states[0]?.data.filter((state: any) =>
        regionCodes.includes(state.region_code?.toString())
      );
      this.filterStates = filteredStates || [];
      console.log("Filtered States by Region:", this.filterStates);

      // Update Districts based on filtered States
      this.updateDistrictsByStates();
    }
  }

  // Helper method to update Districts based on States
  private updateDistrictsByStates(): void {
    if (this.filterStates && this.filterStates.length > 0) {
      const stateCodes = this.filterStates.map((state: any) =>
        state.state_code.toString()
      );
      const filteredDistricts = this.districts[0]?.data.filter(
        (district: any) => stateCodes.includes(district.state_code?.toString())
      );
      this.filterDistrict = filteredDistricts || [];
      console.log("Filtered Districts by States:", this.filterDistrict);

      // Update Blocks based on filtered Districts
      this.updateBlocksByDistricts();
    } else {
      this.filterDistrict = [];
      this.filterBlocks = [];
    }
  }

  // Helper method to update Blocks based on Districts
  private updateBlocksByDistricts(): void {
    if (this.filterDistrict && this.filterDistrict.length > 0) {
      const districtCodes = this.filterDistrict.map((district: any) =>
        district.district_code.toString()
      );
      const filteredBlocks = this.blocks[0]?.data.filter((block: any) =>
        districtCodes.includes(block.district_code?.toString())
      );
      this.filterBlocks = filteredBlocks || [];
      console.log("Filtered Blocks by Districts:", this.filterBlocks);
    } else {
      this.filterBlocks = [];
    }
  }

  // Updated onMcChange to respect MC selection
  // onMcChange(event: any): void {
  //   this.selectedMCData = event.value;
  //   console.log("Selected MC:", this.selectedMCData);

  //   // Disable RMC dropdown if MC is selected
  //   this.rmcDisabled = this.selectedMC.length > 0;

  //   // Clear dependent dropdowns
  //   this.selectedRMC = [];
  //   this.selectedState = [];
  //   this.selectedDistrictData = [];
  //   this.selectedBlockData = [];
  //   this.filterStates = [];
  //   this.filterDistrict = [];
  //   this.filterBlocks = [];

  //   if (this.selectedMC.length > 0) {
  //     // Filter States based on selected MC
  //     const filteredStates = this.states[0]?.data.filter((state: any) =>
  //       this.selectedMC.some((mc: any) => mc.centre_name === state.centre_name)
  //     );
  //     this.filterStates = filteredStates || [];
  //     console.log("Filtered States by MC:", this.filterStates);

  //     // Update Districts based on filtered States
  //     this.updateDistrictsByStates();
  //   } else {
  //     // If MC is cleared, fall back to Region-based filtering
  //     this.updateStatesByRegion();
  //   }

  //   // Update the map
  //   this.updateMap();
  // }

  // Updated onRMcChange to respect RMC selection
  // onRMcChange(event: any): void {
  //   this.selectedRMCData = event.value;
  //   console.log("Selected RMC:", this.selectedRMCData);

  //   // Disable MC dropdown if RMC is selected
  //   this.mcDisabled = this.selectedRMC.length > 0;

  //   // Clear dependent dropdowns
  //   this.selectedMC = [];
  //   this.selectedState = [];
  //   this.selectedDistrictData = [];
  //   this.selectedBlockData = [];
  //   this.filterStates = [];
  //   this.filterDistrict = [];
  //   this.filterBlocks = [];

  //   if (this.selectedRMC.length > 0) {
  //     // Filter States based on selected RMC
  //     const filteredStates = this.states[0]?.data.filter((state: any) =>
  //       this.selectedRMC.some(
  //         (rmc: any) => rmc.centre_name === state.centre_name
  //       )
  //     );
  //     this.filterStates = filteredStates || [];
  //     console.log("Filtered States by RMC:", this.filterStates);

  //     // Update Districts based on filtered States
  //     this.updateDistrictsByStates();
  //   } else {
  //     // If RMC is cleared, fall back to Region-based filtering
  //     this.updateStatesByRegion();
  //   }

  //   // Update the map
  //   this.updateMap();
  // }

  // Updated onStateChange
  onStateChange(event: any): void {
    this.selectedState = event.value || [];
    
    this.selectedDistrictData = [];
    this.selectedBlockData = [];
    this.filterDistrict = [];
    this.filterBlocks = [];
  
    if (this.selectedState.length > 0) {
      const stateCodes = this.selectedState.map((s: any) => s.state_code.toString());
      this.filterDistrict = this.districts[0]?.data.filter((d: any) =>
        stateCodes.includes(d.state_code?.toString())
      ) || [];
    } else {
      // If user clears all states → show all districts (optional behavior)
      this.filterDistrict = this.districts[0]?.data || [];
    }
  
    this.updateMap();
  }

  // Updated onDistrictChange
  onDistrictChange(event: any): void {
    this.selectedDistrictData = event.value;
    console.log("Selected Districts:", this.selectedDistrictData);

    // Clear dependent dropdowns
    this.selectedBlockData = [];
    this.filterBlocks = [];

    if (this.selectedDistrictData.length > 0) {
      // Filter Blocks based on selected Districts
      const filteredBlocks = this.blocks[0]?.data.filter((block: any) =>
        this.selectedDistrictData.some(
          (district: any) => district.district_code === block.district_code
        )
      );
      this.filterBlocks = filteredBlocks || [];
      console.log("Filtered Blocks by Districts:", this.filterBlocks);
    }

    // Update the map
    this.updateMap();
  }

  // Updated onBlockChange
  onBlockChange(event: any): void {
    this.selectedBlockData = event.value;
    console.log("Selected Blocks:", this.selectedBlockData);

    // Update the map
    this.updateMap();
  }
  async fetchBackend() {
    let selectedMode: any = localStorage.getItem("selectedMode");
    this.selectedMode = JSON.parse(selectedMode);
    console.log("this.selected mOde", this.selectedMode);

    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const mon = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = String(currentDate.getFullYear());

    const data = {
      startDate: this.fromDate,
      endDate: this.fromDate,
    };

    if (this.selectedMode.selectedMode == "Unified") {
      this.block.fetchDataFtp(data).subscribe((res) => {
        this.blockdatacum = res.data;
        console.log("fbdudusdubsudbsud", res.data);
        this.loadGeoJSON();
        this.StartDate = this.convertToIndianDateFormat(this.StartDate);
        this.EndDate = this.convertToIndianDateFormat(this.EndDate);
      });
      this.countryService.fetchData(data).subscribe((res) => {
        this.countrydatacum = res.data;
        this.countryActual = this.constants.trimToOneDecimals(
          this.countrydatacum[0].actual_rainfall
        );
        this.countryNormal = this.constants.trimToOneDecimals(
          parseFloat(this.countrydatacum[0].rainfall_normal_value)
        );
        this.countryDeparture = Math.round(this.countrydatacum[0].departure);
        console.log(
          "country dep data",
          this.countrydatacum,
          this.countryActual,
          this.countryDeparture,
          this.countryNormal
        );
      });
    } else {
      this.block.fetchData(data).subscribe((res) => {
        this.blockdatacum = res.data;
        console.log("fbdudusdubsudbsud", res.data);
        this.loadGeoJSON();
        this.StartDate = this.convertToIndianDateFormat(this.StartDate);
        this.EndDate = this.convertToIndianDateFormat(this.EndDate);
      });
      this.countryService.fetchData(data).subscribe((res) => {
        this.countrydatacum = res.data;
        this.countryActual = this.constants.trimToOneDecimals(
          this.countrydatacum[0].actual_rainfall
        );
        this.countryNormal = this.constants.trimToOneDecimals(
          parseFloat(this.countrydatacum[0].rainfall_normal_value)
        );
        this.countryDeparture = Math.round(this.countrydatacum[0].departure);
        console.log(
          "country dep data",
          this.countrydatacum,
          this.countryActual,
          this.countryDeparture,
          this.countryNormal
        );
      });
    }
  }

  filter = (node: HTMLElement) => {
    const exclusionClasses = [
      "download",
      "downloadpdf",
      "leaflet-control-zoom",
      "leaflet-control-fullscreen",
      "leaflet-control-zoomin",
      "download-buttons",
      "DownloadMaps",
      "ResetMap",
    ];
    return !exclusionClasses.some((classname) =>
      node.classList?.contains(classname)
    );
  };

  findMatchingData(id: number): any | null {
    const matchedData = this.blockdatacum?.find((data: any) => {
      // console.log(data.block_code, id.toString())
      return data.block_code === id.toString();
    });
    if (matchedData) {
      return matchedData;
    } else {
      return null;
    }
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
      const mapElement = document.getElementById(
        "block-actual-main"
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

  // async downloadMapImage() {
  // try {
  // const mapElement = document.getElementById('block-actual-main') as HTMLElement;
  // if (!mapElement) {
  // throw new Error('Map element not found');
  // }
  // const scale = 8;
  // const originalWidth = mapElement.clientWidth;
  // const originalHeight = mapElement.clientHeight;
  // const width = originalWidth * scale;
  // const height = originalHeight * scale;

  // // Set dimensions for the cropped area
  // const cropWidth = 1200 * scale; // Width of the cropped area in the center
  // const cropHeight = originalHeight+1175 * scale; // Full height
  // const cropX = ((width - cropWidth) / 2)+500; // Centered horizontally
  // const cropY = 0; // Starting at the top

  // // Create a temporary canvas to crop the image
  // const tempCanvas = document.createElement('canvas');
  // tempCanvas.width = cropWidth;
  // tempCanvas.height = cropHeight;
  // const tempContext = tempCanvas.getContext('2d');

  // const dataUrl = await htmlToImage.toJpeg(mapElement, {
  // quality: 0.95,
  // filter: this.filter,
  // width: width,
  // height: height,
  // style: {
  // transform: `scale(${scale})`,
  // transformOrigin: 'top left',
  // width: `${width}px`,
  // height: `${height}px`
  // }
  // });

  // // Load the captured image onto the temporary canvas
  // const image = new Image();
  // image.src = dataUrl;
  // image.onload = () => {
  // // Draw the central portion of the scaled image onto the temporary canvas
  // tempContext?.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  // // Convert the cropped canvas back to a data URL
  // const croppedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);

  // // Trigger download
  // const link = document.createElement('a');
  // link.download = 'DISTRICT_RAINFALL_MAP_COUNTRY_INDIA_cd.jpeg';
  // link.href = croppedDataUrl;
  // link.click();
  // };
  // } catch (error) {
  // console.error('Error downloading map image:', error);
  // }
  // }

  fetchRegionData() {
    this.regionService.fetchData().subscribe(
      (response: any) => {
        console.log("Region data:", response);
        // Ensure response.data contains the expected array structure
        if (response && response.data) {
          this.regions = response.data.map((region: any) => ({
            label: region.region_name,
            value: region.region_code,
          }));
          // console.log('Formatted regions:', this.regions);
        } else {
          console.error("Unexpected response format:", response);
          alert("Data is not coming in the expected format");
        }
      },
      (error: any) => {
        console.error("Error fetching region data:", error);
        alert("Data is not coming");
      }
    );
  }

  // MC Data
  // getAllMCData(): void {
  //   this.centerService.fetchData("MC").subscribe(
  //     (response: any) => {
  //       console.log("getAllMCData", response);
  //       this.centersMC.push(response.data);
  //       console.log("this.centersMC", this.centersMC);
  //     },
  //     (error: any) => {
  //       console.error("Error fetching center details:", error);
  //     }
  //   );
  // }

  // RMC Data
  // getAllRMCData(): void {
  //   this.centerService.fetchData("RMC").subscribe(
  //     (response: any) => {
  //       console.log("getAllRMCData", response);
  //       this.centersRMC.push(response.data);
  //       console.log("this.centersRMC", this.centersRMC);
  //     },
  //     (error: any) => {
  //       console.error("Error fetching center details:", error);
  //     }
  //   );
  // }

  // Get all States
  getAllStates(): void {
    this.getStateService.fetchData().subscribe(
      (response: any) => {
        console.log("All states", response);
        this.states.push(response);
        console.log("states", this.states);
      },
      (error: any) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

  getAllDistricts(): void {
    this.getDistrictService.fetchData().subscribe(
      (response: any) => {
        console.log("All Districts", response);
        this.districts.push(response);
        console.log("Districts", this.districts);
      },
      (error: any) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

  getAllBlocks(): void {
    this.getBlockService.fetchData().subscribe(
      (response: any) => {
        console.log("All Blocks", response);
        this.blocks.push(response);
        console.log("Blocks", this.blocks);
      },
      (error: any) => {
        console.error("Error fetching center details:", error);
      }
    );
  }

ngOnInit() {
  this.initMap();

  // NO Region / MC / RMC fetching anymore
  // this.fetchRegionData();
  // this.getAllMCData();
  // this.getAllRMCData();

  this.getAllStates();
  this.getAllDistricts();
  this.getAllBlocks();

  // NEW: After data loads → show full India by default
  setTimeout(() => {
    this.initializeFullView();
  }, 1000);   // give time for http calls to finish
}

private initializeFullView() {
  // Show ALL states by default → full map of India
  this.filterStates = this.states[0]?.data || [];

  // No specific filters selected at start
  this.selectedState = [];
  this.selectedDistrictData = [];
  this.selectedBlockData = [];

  // Render full map
  this.updateMap();

  // Also load initial data (rainfall etc.)
  this.setFromAndToDate();   // or this.fetchBackend() if you prefer
}
  ngAfterViewInit(): void {
    this.loadGeoJSON();
  }

  setFromAndToDate() {
    let data = {
      fromDate: this.fromDate,
      toDate: this.fromDate,
    };
    this.formatteddate = this.fromDate.split("-").reverse().join("-");
    this.calculateInitialZoom();
    this.fetchBackend();
    // this.dataService.setfromAndToDate(JSON.stringify(data));
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
    this.map.setView([24, 80.9629], this.initialZoom + 1);
  }

  resetMapSmallScreen(): void {
    this.map.setView([24, 81.9629], this.initialZoom);
  }

  // private initMap(): void {
  //   this.map = L.map("block-actual-main", {
  //     center: [24, 81.9629],
  //     zoom: this.initialZoom,
  //     scrollWheelZoom: false,
  //     zoomSnap: 0.1,
  //     zoomDelta: 0.1,
  //   });

  //   this.map.removeControl(this.map.zoomControl);
  //   this.map.dragging.disable();

  //   this.map.on("fullscreenchange", () => {
  //     this.toggleLogoPosition(this.isFullscreen());
  //   });

  //   const fullscreenControl = new (L.Control as any).Fullscreen({
  //     title: {
  //       false: "View Fullscreen",
  //       true: "Exit Fullscreen",
  //     },
  //     content: '<i class="bi bi-arrows-fullscreen"></i>',
  //   });

  //   this.map.addControl(fullscreenControl);
  // }

  private initMap(): void {
    this.map = L.map("block-actual-main", {
      center: [24, 81.9629],
      zoom: this.initialZoom,
      scrollWheelZoom: false,
      zoomSnap: 0.1,
      zoomDelta: 0.1,
      touchZoom: true, // Explicitly disable touch zoom initially
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
    this.map.scrollWheelZoom.enable();
    this.map.touchZoom.enable();
  }
  public isFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      document.fullscreenElement ||
      document.fullscreenElement ||
      document.fullscreenElement
    );
  }

  private toggleLogoPosition(isFullscreen: boolean): void {
    const logoImage = this.elRef.nativeElement.querySelector(
      "#logoImage-pan_india"
    );
    const Header = this.elRef.nativeElement.querySelector(
      "#middle-header-panindia"
    );
    const directionCompass = this.elRef.nativeElement.querySelector(
      "#compassArrow-pan-india"
    );
    // const btn = this.elRef.nativeElement.querySelector('#all-btn-panindia');
    const resetButton = this.elRef.nativeElement.querySelector(
      "#resetButton-panindia"
    );

    let legendsColor = this.elRef.nativeElement.querySelector(
      "#leaflet-bottom-pan-india"
    );
    const celebrations = this.elRef.nativeElement.querySelector(
      "#celebrations-pan-india"
    );
    const country_val = this.elRef.nativeElement.querySelector(
      "#country_values-pan-india"
    );
    const spinner = this.elRef.nativeElement.querySelector("#loading-message");

    const borderRemove = this.elRef.nativeElement.querySelector(
      "#border-remove-panindia"
    );

    if (isFullscreen) {
      this.map.addControl(this.map.zoomControl);
      this.map.dragging.enable();

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

      // this.renderer.setStyle(btn, 'position', 'absolute');
      // this.renderer.setStyle(btn, 'right', '5%');
      // this.renderer.setStyle(btn, 'top', '5%');

      this.renderer.setStyle(legendsColor, "margin-left", "28%");
      this.renderer.setStyle(legendsColor, "margin-right", "20%");
      // this.renderer.setStyle(legendsColor, 'display', 'flex');

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
      this.map.removeControl(this.map.zoomControl);
      this.map.dragging.disable();

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

      // this.renderer.removeStyle(btn, 'position');
      // this.renderer.removeStyle(btn, 'right');
      // this.renderer.removeStyle(btn, 'top');

      this.renderer.removeStyle(celebrations, "position");
      this.renderer.removeStyle(celebrations, "right");
      this.renderer.removeStyle(celebrations, "top");
      this.renderer.removeStyle(celebrations, "width");
      this.renderer.removeStyle(celebrations, "height");

      this.renderer.removeStyle(legendsColor, "margin-left");
      this.renderer.removeStyle(legendsColor, "margin-right");

      this.renderer.removeStyle(country_val, "position");
      this.renderer.removeStyle(country_val, "left");
      this.renderer.removeStyle(country_val, "top");

      this.renderer.removeStyle(resetButton, "position");
      this.renderer.removeStyle(resetButton, "left");
      this.renderer.removeStyle(resetButton, "top");
    }
  }
  // assets/geojson/regions/EAST_AND_NORTH_EAST_INDIA.json
  private loadGeoJSON(): void {
    this.http.get("assets/geojson/INDIA_BLOCK.json").subscribe((res: any) => {
      this.geoJsonData = res; // Store the full GeoJSON data
      // this.updateMap()
      console.log("india", res);
      this.geoJsonLayer = L.geoJSON(res, {
        style: (feature: any) => {
          const id2 = feature.properties["block_code"];
          const matchedData = this.findMatchingData(id2);
          console.log("matched data", matchedData);
          let rainfall: any;

          if (matchedData?.departure != null) {
            rainfall = matchedData.departure;
          } else {
            rainfall = "NA";
          }
          const dailyrainfall =
            matchedData &&
            matchedData.actual_rainfall !== null &&
            matchedData.actual_rainfall != undefined &&
            !Number.isNaN(matchedData.actual_rainfall)
              ? this.constants.trimToOneDecimals(matchedData.actual_rainfall)
              : "NA";
          console.log(dailyrainfall);

          const color = this.constants.getActualColorForRainfall(dailyrainfall);

          return {
            fillColor: color,
            weight: 1,
            opacity: 1.5,
            color: "black",
            fillOpacity: 100,
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          const state = feature.properties.state;
          const district = feature.properties["district"];
          const region = feature.properties["region"];
          const block = feature.properties["block_Name"];
          const id2 = feature.properties["block_code"];
          const matchedData = this.findMatchingData(id2);
          let rainfall: any;

          if (matchedData?.departure != null) {
            rainfall = this.constants.trimToZeroDecimals(matchedData.departure);
          } else {
            rainfall = "NA";
          }

          const dailyrainfall =
            matchedData &&
            matchedData.actual_rainfall !== null &&
            matchedData.actual_rainfall != undefined &&
            !Number.isNaN(matchedData.actual_rainfall)
              ? this.constants.trimToOneDecimals(matchedData.actual_rainfall)
              : "NA";
          const normalrainfall =
            matchedData && !Number.isNaN(matchedData.normal_rainfall)
              ? this.constants.trimToOneDecimals(
                  parseFloat(matchedData.normal_rainfall)
                ) + " mm"
              : "NA";
          const popupContent = `
                    <div style="background-color: white; padding: 5px; font-family: Arial, sans-serif;">
                    <div style="color: #002467; font-weight: bold; font-size: 13px;">REGION: ${region}</div>
                    <div style="color: #002467; font-weight: bold; font-size: 13px;">STATE: ${state}</div>
                    <div style="color: #002467; font-weight: bold; font-size: 13px;">DISTRICT: ${district}</div>
                    <div style="color: #002467; font-weight: bold; font-size: 13px;">BLOCK: ${block}</div>
                    <div style="color: #002467; font-weight: bold; font-size: 13px;">DAILY RAINFALL: ${dailyrainfall}</div>
                    </div>
                `;
          layer.bindPopup(popupContent);
          layer.on("mouseover", () => {
            layer.openPopup();
          });
          layer.on("mouseout", () => {
            layer.closePopup();
          });
        },
      }).addTo(this.map);
    });

    // this.http.get('assets/geojson/INDIA_STATE.json').subscribe(
    // (stateRes: any) => {
    // const stateLayer = L.geoJSON(stateRes, {
    // style: {
    // weight: 1,
    // opacity: 100,
    // color: 'black',
    // fillOpacity: 0
    // }

    // }).
    // addTo(this.map);
    // })

    console.log("loading is successful");
  }

  // Load and store the full GeoJSON data
  // private loadGeoJSON(): void {
  //   this.http.get('assets/geojson/INDIA_BLOCK.json').subscribe((res: any) => {
  //     this.geoJsonData = res; // Store the full GeoJSON data
  //     this.updateMap(); // Render the initial map
  //     console.log('GeoJSON loading successful');
  //   });
  // }

  // Update the map based on dropdown selections
  private updateMap(): void {
    // Clear previous GeoJSON layers
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.GeoJSON) {
        this.map.removeLayer(layer);
      }
    });
    this.geoJsonLayer = null;
  
    // Safety check: do we have GeoJSON data?
    if (!this.geoJsonData || !this.geoJsonData.features || this.geoJsonData.features.length === 0) {
      console.warn("No GeoJSON data available yet");
      this.map.setView([20.5937, 78.9629], 5); // Center of India
      return;
    }
  
    // Filter features based on user selections (only apply if something is selected)
    const filteredFeatures = this.geoJsonData.features.filter((feature: any) => {
      const props = feature.properties;
  
      // -------------------------------
      // STATE FILTER
      // -------------------------------
      if (this.selectedState?.length > 0) {
        const selectedStateCodes = this.selectedState.map((s: any) => s.state_code?.toString().trim());
  
        // IMPORTANT: Match your actual GeoJSON property name!
        // Common variations: state_code, STATE_CODE, st_code, state_cd, etc.
        const featureStateCode = (
          props.state_code ||
          props.STATE_CODE ||
          props.st_code ||
          props.state_cd ||
          ""
        ).toString().trim();
  
        if (!selectedStateCodes.includes(featureStateCode)) {
          return false;
        }
      }
  
      // -------------------------------
      // DISTRICT FILTER
      // -------------------------------
      if (this.selectedDistrictData?.length > 0) {
        const selectedDistrictCodes = this.selectedDistrictData.map((d: any) =>
          d.district_code?.toString().trim()
        );
  
        // Match your GeoJSON property (you used district_c in previous code)
        const featureDistrictCode = (
          props.district_c ||
          props.district_code ||
          props.DISTRICT_CODE ||
          ""
        ).toString().trim();
  
        if (!selectedDistrictCodes.includes(featureDistrictCode)) {
          return false;
        }
      }
  
      // -------------------------------
      // BLOCK FILTER
      // -------------------------------
      if (this.selectedBlockData?.length > 0) {
        const selectedBlockCodes = this.selectedBlockData.map((b: any) =>
          b.block_code?.toString().trim()
        );
  
        const featureBlockCode = props.block_code?.toString().trim() || "";
  
        if (!selectedBlockCodes.includes(featureBlockCode)) {
          return false;
        }
      }
  
      // If passed all active filters → keep this feature
      return true;
    });
  
    // If nothing matches → show warning and reset view
    if (filteredFeatures.length === 0) {
      console.warn("No blocks match the current filters");
      this.map.setView([20.5937, 78.9629], 5);
      return;
    }
  
    // Create valid GeoJSON FeatureCollection for Leaflet
    const filteredGeoJson: any = {
      type: "FeatureCollection",
      features: filteredFeatures,
    };
  
    // Add the filtered layer to the map
    this.geoJsonLayer = L.geoJSON(filteredGeoJson, {
      // ================= YOUR STYLE FUNCTION =================
      style: (feature: any) => {
        const id2 = feature.properties["block_code"];
        const matchedData = this.findMatchingData(id2);
  
        let rainfall: any = "NA";
        if (matchedData?.actual_rainfall != null && !isNaN(matchedData.actual_rainfall)) {
          rainfall = this.constants.trimToOneDecimals(matchedData.actual_rainfall);
        }
  
        const color = this.constants.getActualColorForRainfall(rainfall);
  
        return {
          fillColor: color,
          weight: 1,
          opacity: 1,
          color: "black",
          fillOpacity: 0.8,
        };
      },
  
      // ================= YOUR POPUP / INTERACTION =================
      onEachFeature: (feature: any, layer: any) => {
        const props = feature.properties;
        const state = props.state || "NA";
        const district = props.district || "NA";
        const region = props.region || "NA";
        const block = props.block_Name || props.block_name || "NA";
  
        const id2 = props["block_code"];
        const matchedData = this.findMatchingData(id2);
  
        const dailyrainfall =
          matchedData && !isNaN(matchedData.actual_rainfall)
            ? this.constants.trimToOneDecimals(matchedData.actual_rainfall)
            : "NA";
  
        const popupContent = `
          <div style="background-color: white; padding: 8px; font-family: Arial, sans-serif; min-width: 220px;">
            <div style="color: #002467; font-weight: bold; font-size: 13px;">REGION: ${region}</div>
            <div style="color: #002467; font-weight: bold; font-size: 13px;">STATE: ${state}</div>
            <div style="color: #002467; font-weight: bold; font-size: 13px;">DISTRICT: ${district}</div>
            <div style="color: #002467; font-weight: bold; font-size: 13px;">BLOCK: ${block}</div>
            <div style="color: #002467; font-weight: bold; font-size: 13px;">DAILY RAINFALL: ${dailyrainfall} mm</div>
          </div>
        `;
  
        layer.bindPopup(popupContent);
  
        layer.on("mouseover", () => layer.openPopup());
        layer.on("mouseout", () => layer.closePopup());
      },
    }).addTo(this.map);
  
    // Fit map to the filtered area (with some padding)
    const bounds = this.geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, {
        padding: [60, 60],   // nice margin around filtered area
        maxZoom: 10,
        animate: true,
      });
    } else {
      // Fallback: whole India
      this.map.setView([20.5937, 78.9629], 5);
    }
  
    console.log(`Map updated — ${filteredFeatures.length} blocks shown`);
  }

  getColorForRainfall1(rainfall: any): string {
    if (rainfall == null || rainfall == " ") {
      return "#c0c0c0";
    }
    const numericId = Math.round(rainfall);
    console.log("color", numericId);
    let cat = "";
    let count = 0;

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

