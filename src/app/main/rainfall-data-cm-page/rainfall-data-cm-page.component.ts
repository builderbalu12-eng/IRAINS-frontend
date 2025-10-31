import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { jsPDF } from "jspdf";
import { Router } from "@angular/router";
import { DataService } from "src/app/data.service";
import * as FileSaver from "file-saver";
import { format } from "date-fns";
import { FetchStationDataService } from "src/app/services/station/station.service";
import { SubdivisionService } from "src/app/services/subDivision/subDivision.service";

@Component({
  selector: "app-rainfall-data-cm-page",
  templateUrl: "./rainfall-data-cm-page.component.html",
  styleUrls: ["./rainfall-data-cm-page.component.css"],
})
export class RainfallDataCmPageComponent implements OnInit {
  loggedInUser: any;
  date: string = String(new Date().getDate());
  month: string = String(
    (new Date().getMonth() + 1).toString().length == 1
      ? "0" + (new Date().getMonth() + 1)
      : new Date().getMonth() + 1
  );
  year: string = "2024";
  sortedData: any[] = [];
  filteredStations: any[] = [];
  filteredItems: any[] = [];
  filterDate: string = "";
  mcName: string = "";
  filterRainfall: number = 0;
  selectedUnit: string = "mm"; // Added to track selected unit
  filteredDataForRainfall: any[] = [];
  existingstationdata: any[] = [];
  tempfilteredStations: any[] = [];
  regionList: any[] = [];
  selectedDate: Date = new Date();
  fromDate: Date = new Date();
  toDate: Date = new Date();
  selectedFile: File | null = null;
  sortDirection: "asc" | "desc" = "asc";
  sortKey: string = "";
  enteredDate: string = "";
  isLoading: boolean = false;
  stationData: any[] = [];
  centreType: string = "";
  centreName: string = "";
  fromRange: number | null = null;
  toRange: number | null = null;
  selectedRegionCode: string = "";

  isCustomRange: boolean = false;
  predefinedRange: string = "";

  minRange: number | null = null;
  maxRange: number | null = null;

  regions = [
    { code: "1", name: "CENTRAL INDIA" },
    { code: "2", name: "EAST AND NORTH EAST INDIA" },
    { code: "3", name: "NORTH WEST INDIA" },
    { code: "4", name: "SOUTH PENINSULA" },
  ];

  selectedRegionCodes: string[] = [];

  customRangeUnit: "mm" | "cm" = "mm"; // Default to mm

  constructor(
    private router: Router,
    private http: HttpClient,
    private dataService: DataService,
    private fetchStationDataService: FetchStationDataService,
    private subdivservice : SubdivisionService
  ) {
    // this.setDateMonth();
    // this.getAllDaysInMonth();
  }

  ngOnInit(): void {
    // this.getAllData();

    let loggedInUser: any = localStorage.getItem("isAuthorised");
    this.loggedInUser = JSON.parse(loggedInUser);
    // console.log(this.loggedInUser);

    const regex = /^(RMC|MC)\s(\w+)/;
    const match = this.loggedInUser.data[0].name.match(regex);
    // console.log('match', match)

    if (match) {
      this.centreType = match[1];
      this.centreName = match[2];
    }

    const today = new Date();
    this.filterDate = today.toISOString().substring(0, 10); // Format: YYYY-MM-DD
    this.fetchStationData(this.enteredDate);
  }

  onDateChange(event: any): void {
    console.log("event.target.value", event.target.value);
    this.enteredDate = event.target.value;
    this.fetchStationData(this.enteredDate);
  }

  fetchStationData(date: any): void {
    this.isLoading = true;

    const selectedMode = localStorage.getItem("selectedMode");
    const parsedSelectedMode = JSON.parse(selectedMode ?? "");
    console.log("parsedSelectedMode", parsedSelectedMode.selectedMode);

    if (parsedSelectedMode.selectedMode != "Unified") {
      this.fetchStationDataService.fetchStationData(date ?? "").subscribe(
        (response: any) => {
          this.stationData = response?.data;
          this.isLoading = false;
          console.log("Data fetched successfully:", this.stationData);
        },
        (error: any) => {
          this.isLoading = false;
          console.error("Error fetching data:", error);
        }
      );
    }
  }

  goBack() {
    window.history.back();
  }

  exportAsXLSX(): void {
    console.log(this.filteredItems);
    this.exportAsExcelFile(this.sampleFile(), "Significant_RainFall_Data");
    // this.exportAsExcelFile(this.filteredStations, 'export-to-excel');
  }

  downloadDoc(): void {
    if (this.filteredItems.length === 0) {
      alert("No data available to download.");
      return;
    }
  
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 14;
    const marginRight = 14;
    const logoSize = 18;
    const lineHeight = 5;
    const maxLineWidth = pageWidth - marginLeft - marginRight;
  
    const logoCenter = 'assets/images/IMDlogo_Ipart-iris.png';
    const logoLeft = 'assets/images/IMD150(BGR).png';
    const logoRight = 'assets/images/logoimage.png';
  
    const loadImage = (path: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve('');
        img.src = path;
      });
    };
  
    /* -------------------------------------------------------------
     *  Decide which data set we will print
     * ------------------------------------------------------------- */
    const buildPdf = (dataForPdf: any[]) => {
      Promise.all([
        loadImage(logoLeft),
        loadImage(logoCenter),
        loadImage(logoRight)
      ]).then(([imgLeft, imgCenter, imgRight]) => {
        let yPosition = 15;
  
        // === LOGOS ===
        const logoY = yPosition;
        const logoXLeft = marginLeft;
        const logoXCenter = pageWidth / 2 - logoSize / 2;
        const logoXRight = pageWidth - marginRight - logoSize;
  
        if (imgLeft) doc.addImage(imgLeft, 'PNG', logoXLeft, logoY, logoSize, logoSize);
        if (imgCenter) doc.addImage(imgCenter, 'PNG', logoXCenter, logoY, logoSize, logoSize);
        if (imgRight) doc.addImage(imgRight, 'PNG', logoXRight, logoY, logoSize, logoSize);
  
        yPosition += logoSize + 4;
  
        // === HEADER TEXT ===
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        const headerLines = [
          "BHARAT SARAKAR",
          "BHARAT MAUSAM VIGYAN VIBHAG",
          "GOVERNMENT OF INDIA",
          "INDIA METEOROLOGICAL DEPARTMENT"
        ];
        headerLines.forEach(line => {
          doc.text(line, pageWidth / 2, yPosition, { align: "center" });
          yPosition += lineHeight;
        });
        yPosition += 4;
  
        // === TITLE ===
        doc.setFontSize(14);
        doc.text("SUMMARY OF WEATHER", pageWidth / 2, yPosition, { align: "center" });
        yPosition += 8;
  
        // === SUBTITLE ===
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("CHIEF AMOUNTS OF RAINFALL IN CM.", pageWidth / 2, yPosition, { align: "center" });
        yPosition += 12;
  
        // === GROUP DATA BY SUBDIVISION ===
        const groupedData = dataForPdf.reduce((acc: { [key: string]: any[] }, item) => {
          const subdiv = item.subdiv_name;
          if (!acc[subdiv]) acc[subdiv] = [];
          acc[subdiv].push(item);
          return acc;
        }, {});
  
        const sortedSubdivisions = Object.keys(groupedData).sort();
  
        const selectedDate = new Date(this.filterDate);
        const day = selectedDate.getDate().toString().padStart(2, "0");
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
        const year = selectedDate.getFullYear();
        const dateStr = `${day}/${month}/${year}`;
  
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
  
        for (const subdiv of sortedSubdivisions) {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
  
          // Subdivision name
          doc.setFont("helvetica", "bold");
          doc.text(subdiv.toUpperCase(), marginLeft, yPosition);
          yPosition += 6;
  
          // Date line
          doc.setFont("helvetica", "normal");
          doc.text(`${dateStr}:`, marginLeft, yPosition);
          yPosition += lineHeight;
  
          // Stations (sorted by rainfall, shown in cm)
          const sortedStations = groupedData[subdiv]
            .sort((a, b) => a.data - b.data)
            .map(s => ({
              text: `${s.station_name} (dist ${s.district_name}) ${Math.round(s.data / 10)}`,
              isLast: false
            }));
  
          if (sortedStations.length > 0) {
            sortedStations[sortedStations.length - 1].isLast = true;
          }
  
          let currentLine = "";
          for (const station of sortedStations) {
            const separator = station.isLast ? "" : ", ";
            const testLine = currentLine
              ? `${currentLine} ${station.text}${separator}`
              : `${station.text}${separator}`;
  
            const splitTest = doc.splitTextToSize(testLine, maxLineWidth);
            if (splitTest.length > 1 || (currentLine && doc.getTextWidth(testLine) > maxLineWidth)) {
              if (currentLine) {
                const wrapped = doc.splitTextToSize(currentLine.trim(), maxLineWidth);
                wrapped.forEach((txt: any) => {
                  if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; }
                  doc.text(txt, marginLeft + 8, yPosition);
                  yPosition += lineHeight;
                });
              }
              currentLine = `${station.text}${separator}`;
            } else {
              currentLine = testLine;
            }
          }
  
          if (currentLine) {
            const wrapped = doc.splitTextToSize(currentLine.trim(), maxLineWidth);
            wrapped.forEach((txt: any) => {
              if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; }
              doc.text(txt, marginLeft + 8, yPosition);
              yPosition += lineHeight;
            });
          }
  
          yPosition += 4; // space after subdivision
        }
  
        // === SAVE ===
        doc.save(`Rainfall_Summary_${dateStr}.pdf`);
      }).catch(err => {
        console.error("Error loading images:", err);
        alert("Failed to load logos. Generating document without images.");
      });
    };
  
    /* -------------------------------------------------------------
     *  Centre-type logic
     * ------------------------------------------------------------- */
    const centreIsMC = this.centreType?.toUpperCase() === 'MC';
  
    if (!centreIsMC) {
      // NOT an MC → show **everything** that passed the UI filters
      buildPdf(this.filteredItems);
      return;
    }
  
    // ----> It IS an MC → filter by met_centre
    const centreFullName = `${this.centreType} ${this.centreName}`.trim().toUpperCase();
  
    this.subdivservice.fetchmetWiseSubDivisions().subscribe({
      next: (meta: any) => {
        const allowedSubdivCodes = new Set(
          meta.data
            .filter((m: any) => m.met_centre?.trim().toUpperCase() === centreFullName)
            .map((m: any) => m.subdiv_code)
        );
  
        const dataForPdf = this.filteredItems.filter(item =>
          allowedSubdivCodes.has(item.subdiv_code)
        );
  
        if (dataForPdf.length === 0) {
          alert("No stations found for your MC.");
          return;
        }
  
        buildPdf(dataForPdf);
      },
      error: (err) => {
        console.error("Failed to fetch subdivision metadata:", err);
        alert("Could not determine allowed subdivisions. PDF not generated.");
      }
    });
  }
  // Fallback method if images fail to load
  private generateDocWithoutImages(
    dateStr: string, doc: jsPDF, pageWidth: number, pageHeight: number,
    marginLeft: number, lineHeight: number, maxLineWidth: number
  ) {
    let yPosition = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
  
    const headerLines = [
      "BHARAT SARAKAR",
      "BHARAT MAUSAM VIGYAN VIBHAG",
      "GOVERNMENT OF INDIA",
      "INDIA METEOROLOGICAL DEPARTMENT"
    ];
  
    headerLines.forEach(line => {
      doc.text(line, pageWidth / 2, yPosition, { align: "center" });
      yPosition += lineHeight;
    });
  
    yPosition += 6;
    doc.setFontSize(14);
    doc.text("SUMMARY OF WEATHER", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;
  
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("CHIEF AMOUNTS OF RAINFALL IN CM.", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 12;
  
    // ... [rest of data logic same as above]
    // (Copy the data grouping & printing logic here if needed)
  }

  exportAsExcelFile(json: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
    console.log("worksheet", worksheet);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ["data"],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const EXCEL_EXTENSION = ".xlsx";
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }

  sampleFile() {
    let data: any[] = [];
    this.filteredItems.forEach((x) => {
      // Convert data to cm if the selected unit is cm
      let convertedData = this.selectedUnit === "cm" ? x.data / 10 : x.data;

      let station: any = {
        Metsubdivision: x.subdiv_name,
        Station_Name: x.station_name,
        District_Name: x.district_name,
        // Use the selected unit to determine the key
        [this.selectedUnit === "mm" ? "Rainfall_mm" : "Rainfall_cm"]:
          convertedData,
      };

      data.push(station);
      console.log("station", station);
    });
    return data;
  }
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  showMessage(elementRef: any) {
    const value = elementRef.value.trim();
    const regex = /^\d+(\.\d)?$|^\d+(\.\d)?$/;
    if (regex.test(value)) {
      elementRef.style.background = "";
    } else {
      elementRef.style.background = "red";
      // alert("Please enter a valid number with only one decimal place");
    }
    if (Number(elementRef.value) > 100) {
      elementRef.style.background = "red";
      alert("Rainfall is greater than 100mm");
    } else {
      elementRef.style.background = "";
    }
  }

  sortData(key: string) {
    this.sortKey = key;
    this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    this.filteredItems.sort((a, b) => {
      const isAsc = this.sortDirection === "asc";
      return (a[key] < b[key] ? -1 : 1) * (isAsc ? 1 : -1);
    });
  }

  validateRainfall() {
    if (this.filterRainfall < 0) {
      this.filterRainfall = 0; // Reset to 0 if the value is negative
      alert("Rainfall value cannot be below 0");
    }
  }

  setRangeMode(customRange: boolean): void {
    this.isCustomRange = customRange;
    this.filterRainfall = 0; // Reset manual input
    this.predefinedRange = ""; // Reset predefined range selection
  }

  onRangeSelect(): void {
    // Parse and store min and max values from selected range
    const [min, max] = this.predefinedRange.split("-").map(Number);
    this.minRange = min;
    this.maxRange = max;
  }

  onCustomRangeUnitChange(unit: "mm" | "cm"): void {
    this.customRangeUnit = unit;
    this.selectedUnit = unit; // Update the selectedUnit for the table header
    console.log(`Custom range unit changed to: ${unit}`);
  }

  // filterData(): void {
  //   if (this.isCustomRange) {
  //     if (this.fromRange === null || this.toRange === null) {
  //       alert("Please enter both 'From' and 'To' range values.");
  //       return;
  //     }
  //     if (this.fromRange >= this.toRange) {
  //       alert("Invalid range: 'From' value should be less than 'To' value.");
  //       return;
  //     }
  //   }

  //   const min = this.isCustomRange ? this.fromRange! : 0;
  //   const max = this.isCustomRange ? this.toRange! : Number.MAX_SAFE_INTEGER;

  //   this.filteredItems = this.stationData.filter(station => {
  //     let rainfall = this.selectedUnit === 'cm' ? station.data / 10 : station.data;
  //     return rainfall >= min && rainfall <= max;
  //   });

  //   console.log(this.filteredItems);
  //   if (this.filteredItems.length === 0) {
  //     alert("No data available for the selected range.");
  //   }
  // }

  // Display string for dropdown button
  get selectedRegionsDisplay(): string {
    if (this.selectedRegionCodes.length === 0) {
      return "Select Region(s)";
    }
    return this.selectedRegionCodes
      .map((code) => this.regions.find((r) => r.code === code)?.name)
      .filter((name) => !!name)
      .join(", ");
  }

  // Checkbox change handler
  onRegionCheckboxChange(event: any) {
    const value = event.target.value;
    if (event.target.checked) {
      if (!this.selectedRegionCodes.includes(value)) {
        this.selectedRegionCodes.push(value);
      }
    } else {
      this.selectedRegionCodes = this.selectedRegionCodes.filter(
        (v) => v !== value
      );
    }
    console.log("Selected Region Codes:", this.selectedRegionCodes);
  }
  get selectedRegionsDisplayShort(): string {
    const count = this.selectedRegionCodes.length;
    if (count === 0) return "Select Region(s)";
    if (count <= 2) {
      // show names if 1 or 2 selected
      return this.selectedRegionCodes
        .map((code) => this.regions.find((r) => r.code === code)?.name)
        .filter((name) => !!name)
        .join(", ");
    }
    // show summary if more than 2 selected
    return `${count} regions selected`;
  }

  // filterData(): void {
  //   if (this.isCustomRange) {
  //     if (this.fromRange === null || this.toRange === null) {
  //       alert("Please enter both 'From' and 'To' range values.");
  //       return;
  //     }
  //     if (this.fromRange >= this.toRange) {
  //       alert("Invalid range: 'From' value should be less than 'To' value.");
  //       return;
  //     }

  //     const minRange =
  //       this.customRangeUnit === "cm"
  //         ? (this.fromRange ?? 0) * 10
  //         : this.fromRange ?? 0;
  //     const maxRange =
  //       this.customRangeUnit === "cm"
  //         ? (this.toRange ?? Number.MAX_SAFE_INTEGER) * 10
  //         : this.toRange ?? Number.MAX_SAFE_INTEGER;

  //     this.filteredItems = this.stationData.filter((station) => {
  //       const rainfall = station.data; // Data is in mm by default
  //       return rainfall >= minRange && rainfall <= maxRange;
  //     });
  //   } else {
  //     const minRnage =
  //       this.selectedUnit === "cm"
  //         ? (this.filterRainfall ?? 0) * 10
  //         : this.filterRainfall ?? 0;
  //     this.filteredItems = this.stationData.filter((station) => {
  //       const rainfall = station.data; // Data is in mm by default
  //       return rainfall >= minRnage;
  //     });
  //   }

  //   console.log(this.filteredItems);
  //   if (this.filteredItems.length === 0) {
  //     alert("No data available for the selected range.");
  //   }
  // }

  filterData(): void {
    let minRange = 0;
    let maxRange = Number.MAX_SAFE_INTEGER;

    // Determine rainfall range
    if (this.isCustomRange) {
      if (this.fromRange === null || this.toRange === null) {
        alert("Please enter both 'From' and 'To' range values.");
        return;
      }
      if (this.fromRange >= this.toRange) {
        alert("Invalid range: 'From' value should be less than 'To' value.");
        return;
      }

      minRange =
        this.customRangeUnit === "cm" ? this.fromRange * 10 : this.fromRange;
      maxRange =
        this.customRangeUnit === "cm" ? this.toRange * 10 : this.toRange;
    } else {
      minRange =
        this.selectedUnit === "cm"
          ? (this.filterRainfall ?? 0) * 10
          : this.filterRainfall ?? 0;
      maxRange = Number.MAX_SAFE_INTEGER;
    }

    // Filter data based on rainfall and region
    this.filteredItems = this.stationData.filter((station) => {
      const rainfall = station.data; // in mm
      const rainfallOk = rainfall >= minRange && rainfall <= maxRange;

      // Region filter: only if user selected any region(s)
      const regionOk =
        this.selectedRegionCodes.length > 0
          ? this.selectedRegionCodes.includes(station.region_code)
          : true;

      return rainfallOk && regionOk;
    });

    console.log("Filtered Items:", this.filteredItems);

    if (this.filteredItems.length === 0) {
      alert("No data available for the selected range/region.");
    }
  }
}