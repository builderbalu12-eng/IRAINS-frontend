import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY, Observable, concatMap, lastValueFrom } from "rxjs";
import { environment } from "src/environment/environment";
import { Constants } from "../constants";
import autoTable, { Column } from "jspdf-autotable";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx-js-style";
import * as FileSaver from "file-saver";
import { RegionService } from "../region/region.service";
import { StateService } from "../state/state.service";
import { DistrictService } from "../district/district.service";

@Injectable({
  providedIn: "root",
})
export class RegionDownloadStatistics {
  private baseUrl: string = environment.baseUrl;
  isView: boolean = false;

  regiondepCurrdate: any[] = [];
  regiondepSeasondate: any[] = [];
  districtDepCurrdate: any[] = [];
  statedepCurrdate: any[] = [];

  rows: any[][] = [];
  data: any;
  seasonPeriodDate: any;

  constructor(
    private http: HttpClient,
    private constants: Constants,
    private regionService: RegionService,
    private stateService: StateService,
    private districtService: DistrictService
  ) {}

  convertToIndianDateFormat = (dateString: string) =>
    dateString.split("-").reverse().join("-");

  async updateanddownloadpdf() {
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate =
      this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(this.data, this.seasonPeriodDate);
  }

  async updateandViewpdf() {
    this.isView = true;
    console.log("erere");
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate =
      this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(this.data, this.seasonPeriodDate);
  }

  async updateanddownloadpdfFromDataEntry() {
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate =
      this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(
      this.data,
      this.seasonPeriodDate
    );
  }

  async updateandViewpdfFromDataEntry() {
    this.isView = true;
    console.log("erere");
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate =
      this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(
      this.data,
      this.seasonPeriodDate
    );
  }

  async updateanddownloadpdfCustom(fromDate: any, toDate: any) {
    console.log("custom date download", fromDate, toDate);
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data = {
      startDate: fromDate, // 2024-09-18 format
      endDate: toDate,
    };

    this.seasonPeriodDate =
      this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(this.data, this.seasonPeriodDate);
  }

  async updateanddownloadpdfFromDataEntryCustom(fromDate: any, toDate: any) {
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data = {
      startDate: fromDate, // 2024-09-18 format
      endDate: toDate,
    };

    this.seasonPeriodDate =
      this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(
      this.data,
      this.seasonPeriodDate
    );
  }

  async updateandViewpdfCustom(fromDate: any, toDate: any) {
    this.isView = true;
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data = {
      startDate: fromDate, // 2024-09-18 format
      endDate: toDate,
    };

    this.seasonPeriodDate =
      this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(this.data, this.seasonPeriodDate);
  }

  async updateandViewpdfFromDataEntryCustom(fromDate: any, toDate: any) {
    this.isView = true;
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data = {
      startDate: fromDate, // 2024-09-18 format
      endDate: toDate,
    };

    this.seasonPeriodDate =
      this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(
      this.data,
      this.seasonPeriodDate
    );
  }

  async updateCurrDateData(data: any, seasonPeriodDate: any) {
    try {
      await lastValueFrom(
        this.regionService.fetchDataFtp(data).pipe(
          concatMap((region) => {
            this.regiondepCurrdate = region.data;
            console.log("indownloading---->", this.regiondepCurrdate);
            return this.regionService.fetchDataFtp(seasonPeriodDate);
          }),
          concatMap((seasonregionData) => {
            this.regiondepSeasondate = seasonregionData.data;
            return this.stateService.fetchDataFtp(data);
          }),
          concatMap((stateData) => {
            this.statedepCurrdate = stateData.data ?? [];
            return this.districtService.fetchDataFtp(data);
          }),
          concatMap((districtData) => {
            this.districtDepCurrdate = districtData.data ?? [];
            this.downloadPdf();
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    // this.regionService.fetchDataFtp(data).pipe(
    //   concatMap(region => {
    //     this.regiondepCurrdate = region.data;
    //     console.log('indownloading---->',this.regiondepCurrdate)
    //     return this.regionService.fetchDataFtp(seasonPeriodDate);
    //   }),

    //   concatMap(seasonregionData => {
    //     this.regiondepSeasondate = seasonregionData.data;
    //     console.log('indownloading---->', this.regiondepSeasondate)
    //     this.downloadPdf()
    //     return EMPTY
    //   }),

    // ).subscribe(
    //   () => { },
    //   (error:any) => console.error('Error fetching data:', error)
    // );
  }

  async updateCurrDateDataFromDataEntry(data: any, seasonPeriodDate: any) {
    try {
      await lastValueFrom(
        this.regionService.fetchData(data).pipe(
          concatMap((region) => {
            this.regiondepCurrdate = region.data;
            console.log("indownloading---->", this.regiondepCurrdate);
            return this.regionService.fetchData(seasonPeriodDate);
          }),
          concatMap((seasonregionData) => {
            this.regiondepSeasondate = seasonregionData.data;
            return this.stateService.fetchData(data);
          }),
          concatMap((stateData) => {
            this.statedepCurrdate = stateData.data ?? [];
            return this.districtService.fetchData(data);
          }),
          concatMap((districtData) => {
            this.districtDepCurrdate = districtData.data ?? [];
            this.downloadPdf();
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    // this.regionService.fetchDataFtp(data).pipe(
    //   concatMap(region => {
    //     this.regiondepCurrdate = region.data;
    //     console.log('indownloading---->',this.regiondepCurrdate)
    //     return this.regionService.fetchDataFtp(seasonPeriodDate);
    //   }),

    //   concatMap(seasonregionData => {
    //     this.regiondepSeasondate = seasonregionData.data;
    //     console.log('indownloading---->', this.regiondepSeasondate)
    //     this.downloadPdf()
    //     return EMPTY
    //   }),

    // ).subscribe(
    //   () => { },
    //   (error:any) => console.error('Error fetching data:', error)
    // );
  }

  exportAsExcelFile(
    json: any[],
    excelFileName: string,
    columns: any,
    columns1: any
  ): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);

    // Define the range of cells you want to merge
    const startCell = "C1"; // Start cell for the first merge
    const endCell = "F1"; // End cell for the first merge
    const startCell1 = "G1"; // Start cell for the second merge
    const endCell1 = "J1"; // End cell for the second merge

    // Merge the cells
    worksheet["!merges"] = [
      {
        s: XLSX.utils.decode_cell(startCell),
        e: XLSX.utils.decode_cell(endCell),
      },
      {
        s: XLSX.utils.decode_cell(startCell1),
        e: XLSX.utils.decode_cell(endCell1),
      },
    ];

    // Add the first header row (with merged cells)
    XLSX.utils.sheet_add_aoa(worksheet, [columns1], { origin: "A1" });

    // Add the second header row
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: "A2" });

    // Adjust the starting point for the data rows
    XLSX.utils.sheet_add_json(worksheet, json, {
      origin: "A3",
      skipHeader: true,
    });

    // Create the workbook and add the worksheet
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ["data"],
    };

    // Generate the Excel file
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Save the file
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

  public async downloadPdf() {
    const columns1 = [
      "",
      "",
      {
        // content :this.data.startDate==this.data.endDate ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`:`DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`, colSpan:4

        content:
          this.data.startDate === this.data.endDate
            ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`
            : `DAY: ${this.convertToIndianDateFormat(
                this.data.startDate
              )} to ${this.getAdjustedEndDate(
                this.data.startDate,
                this.data.endDate
              )}`,
        colSpan: 4,
      },
      {
        content: `PERIOD: ${this.convertToIndianDateFormat(
          this.seasonPeriodDate.startDate
        )} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`,
        colSpan: 4,
      },
    ];
    const columns1forexcel = [
      "",
      "",
      {
        content:
          this.data.startDate == this.data.endDate
            ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`
            : `DAY: ${this.convertToIndianDateFormat(
                this.data.startDate
              )} to ${this.convertToIndianDateFormat(this.data.endDate)}`,
        colSpan: 4,
      },
      "",
      "",
      "",
      {
        content: `PERIOD: ${this.convertToIndianDateFormat(
          this.seasonPeriodDate.startDate
        )} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`,
        colSpan: 4,
      },
    ];

    const columns = [
      "S.No",
      "REGION",
      "ACTUAL(mm)",
      "NORMAL(mm)",
      "%DEP.",
      "CAT.",
      "ACTUAL(mm)",
      "NORMAL(mm)",
      "%DEP.",
      "CAT.",
    ];

    this.loadTheRows();

    var newArr = this.rows.map((subArr) => {
      return subArr.map((item: any, colIdx: number) => {
        let val = typeof item === "object" && item.hasOwnProperty("content") ? item.content : item;
        if ((colIdx === 4 || colIdx === 8) && val !== '' && val !== ' ' && val != null) {
          val = `${val}%`;
        }
        return val;
      });
    });

    var newcolumns1 = columns1forexcel.map((item) => {
      if (typeof item === "object" && item.hasOwnProperty("content")) {
        return item.content;
      }
      return item;
    });

    let serialNumber = 1;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const tableWidth = 180;
    const cellWidth = 36;
    const cellHeight = 8;
    const marginLeft = 10;
    const marginTop = 10;
    const fontSize = 10;
    const options: any = {
      startY: marginTop,
      margin: { left: marginLeft },
    };
    const pageWidth = doc.internal.pageSize.getWidth();
    const imgWidth = 15;
    const imgMargin = 10;
    const imgX = pageWidth - imgWidth - imgMargin;
    const imgData150 = "/assets/images/IMD150(BGR).png";
    doc.addImage(imgData150, "PNG", imgX, marginTop, 15, 20);
    const imgData = "/assets/images/IMDlogo_Ipart-iris.png";
    doc.addImage(imgData, "PNG", marginLeft, marginTop, 15, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Set font color to black
    const headingText =
      "India Meteorological Department\nHydromet Division, New Delhi";
    const headingText1 = "REGION-WISE RAINFALL DISTRIBUTION";
    doc.text(headingText, marginLeft + 25, marginTop + 8); // Adjust position as needed
    doc.text(headingText1, marginLeft + 100, marginTop + 28);
    autoTable(doc, {
      head: [columns1, columns],
      body: this.rows,
      theme: "striped",
      startY: marginTop + cellHeight + 25, // Adjust the vertical position below the image and heading
      margin: { left: marginLeft },
      styles: { fontSize: 7 },
      headStyles: { halign: "center" },
      didDrawCell: function (data: {
        cell: { text: any; x: number; y: number; width: any; height: any };
      }) {
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        doc.setDrawColor(0);
      },
      didParseCell: function (data: any) {
        data.cell.styles.fontStyle = "bold";
      },
    });

    const columns2 = ["", "LEGEND", ""];
    const columns3 = ["CATEGORY", "% DEPARTURES OF RAINFALL", "COLOUR CODE"]; // Update with your second table column names
    const rows2 = [
      [
        "Large Excess\n(LE or L.Excess)",
        ">= 60%",
        { content: "", styles: { fillColor: "#0096ff" } },
      ],
      [
        "Excess (E)",
        ">= 20% and <= 59%",
        { content: "", styles: { fillColor: "#32c0f8" } },
      ],
      [
        "Normal (N)",
        ">= -19% and <= +19%",
        { content: "", styles: { fillColor: "#00cd5b" } },
      ],
      [
        "Deficient (D)",
        ">= -59% and <= -20%",
        { content: "", styles: { fillColor: "#ff2700" } },
      ],
      [
        "Large Deficient\n(LD or L.Deficient)",
        ">= -99% and <= -60%",
        { content: "", styles: { fillColor: "#ffff20" } },
      ],
      [
        "No Rain(NR)",
        "= -100%",
        { content: "", styles: { fillColor: "#ffffff" } },
      ],
      [
        "Not Available",
        "ND",
        { content: "", styles: { fillColor: "#c0c0c0" } },
      ],
      [
        "Note : ",
        {
          content:
            "The rainfall values are rounded off up to one place of decimal.",
          colSpan: 2,
        },
      ],
    ];

    doc.addPage();
    autoTable(doc, {
      head: [columns2, columns3],
      body: rows2,
      theme: "striped",
      didDrawCell: function (data: {
        cell: { text: any; x: number; y: number; width: any; height: any };
      }) {
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        doc.setDrawColor(0);
      },
    });
    const suffix = this.constants.getDateSuffix(this.data.startDate, this.data.endDate);
    const dateLabel = this.constants.getExcelDateLabel(this.data.startDate, this.data.endDate);
    const filename = `REGION_RAINFALL_DISTRIBUTION_COUNTRY_INDIA_${suffix}.pdf`;
    const isSingleDate = this.data.startDate === this.data.endDate;
    let excelName: string;
    if (isSingleDate) {
      const [y, m, d] = this.data.startDate.split('-');
      excelName = `REGION_${d}${m}${y}`;
    } else {
      const s = new Date(this.data.startDate);
      const e = new Date(this.data.endDate);
      const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const MON    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const d1 = String(s.getDate()).padStart(2, '0');
      const d2 = String(e.getDate()).padStart(2, '0');
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        excelName = `REGION (${d1}-${d2}) ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
      } else if (s.getFullYear() === e.getFullYear()) {
        excelName = `REGION (${d1}${MON[s.getMonth()]}-${d2}${MON[e.getMonth()]}) ${s.getFullYear()}`;
      } else {
        excelName = `REGION (${d1}${MON[s.getMonth()]}${s.getFullYear()}-${d2}${MON[e.getMonth()]}${e.getFullYear()})`;
      }
    }

    if (this.isView) {
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
    } else {
      setTimeout(() => {
        doc.save(filename);
        this.exportAsExcelFile(newArr, excelName, columns, newcolumns1);
        this.exportDistrictDistributionExcel(`DISTRICT_DIST_REGION_${dateLabel}`);
      }, 3000);
    }
  }

  getAdjustedEndDate(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // If the start and end dates fall in different months
    if (start.getMonth() !== end.getMonth()) {
      // Get the last day of the start month
      const lastDayOfMonth = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0
      );

      // Ensure the lastDayOfMonth is correct by explicitly constructing the date string
      const lastDayOfMonthStr = this.formatDate(lastDayOfMonth);

      return this.convertToIndianDateFormat(lastDayOfMonthStr);
    }

    // If they are in the same month, return the original end date
    return this.convertToIndianDateFormat(endDate);
  }

  /**
   * Helper function to format Date object as 'YYYY-MM-DD' without timezone issues
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Add leading zero for single-digit months
    const day = String(date.getDate()).padStart(2, "0"); // Add leading zero for single-digit days

    return `${year}-${month}-${day}`;
  }

  private loadTheRows() {
    this.rows = [];
    const groupedByRegion = this.regiondepCurrdate.reduce((acc, item) => {
      const region = item.r_code;

      // Initialize the array for this region if it doesn't exist
      if (!acc[region]) {
        acc[region] = [];
      }

      // Add the item to the corresponding region array
      acc[region].push(item);
      return acc;
    }, {});
    const sortedRegions = Object.keys(groupedByRegion).sort((a, b) =>
      a.localeCompare(b)
    );
    console.group("heygeyye", sortedRegions);

    let regionColorCode = [255, 255, 255];

    let index = 1;

    for (const regionCode of sortedRegions) {
      // Find subdivision data
      const regionDate = this.regiondepCurrdate.find(
        (region) => regionCode === region.r_code
      );
      const regionSeason = this.regiondepSeasondate.find(
        (region) => regionCode === region.r_code
      );

      const DateCat = this.constants.getColorAndCat(regionDate.departure);
      const SeasonCat = this.constants.getColorAndCat(regionSeason.departure);

      // Add Subdivision Row
      this.rows.push([
        { content: index++, styles: { fillColor: regionColorCode } },
        {
          content: `${regionDate.name.toUpperCase()}`,
          styles: { fillColor: regionColorCode },
        },
        {
          content:
            regionDate.actual_rainfall != null
              ? this.constants.trimToOneDecimals(regionDate.actual_rainfall)
              : " ",
          styles: { fillColor: regionColorCode },
        },
        {
          content: this.constants.trimToOneDecimals(
            parseFloat(regionDate.rainfall_normal_value)
          ),
          styles: { fillColor: regionColorCode },
        },
        {
          content:
            regionDate.departure != null
              ? this.constants.trimToZeroDecimals(regionDate.departure)
              : " ",
          styles: { fillColor: regionColorCode },
        },
        { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
        {
          content:
            regionSeason.actual_rainfall != null
              ? this.constants.trimToOneDecimals(regionSeason.actual_rainfall)
              : " ",
          styles: { fillColor: regionColorCode },
        },
        {
          content: this.constants.trimToOneDecimals(
            parseFloat(regionSeason.rainfall_normal_value)
          ),
          styles: { fillColor: regionColorCode },
        },
        {
          content:
            regionSeason.departure != null
              ? this.constants.trimToZeroDecimals(regionSeason.departure)
              : " ",
          styles: { fillColor: regionColorCode },
        },
        { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } },
      ]);
    }

    console.log(this.rows);
  }

  private countDepartureByState(): Array<{ state: string; state_code: number; counts: any }> {
    const stateNameMap = new Map<number, string>();
    for (const s of this.statedepCurrdate) {
      const sc = Number(s.state_code ?? s.new_state_code);
      stateNameMap.set(sc, s.state_name);
    }
    const grouped = new Map<number, number[]>();
    for (const d of this.districtDepCurrdate) {
      const sc = Number(d.state_code ?? d.new_state_code);
      if (!sc) continue;
      if (!grouped.has(sc)) grouped.set(sc, []);
      grouped.get(sc)!.push(Number(d.departure));
    }
    return [...grouped.entries()].map(([sc, departures]) => {
      const counts = { LE: 0, E: 0, N: 0, D: 0, LD: 0, NR: 0, ND: 0, Total: 0 };
      for (const dep of departures) {
        if (dep >= 60) counts.LE++;
        else if (dep >= 20) counts.E++;
        else if (dep >= -19) counts.N++;
        else if (dep >= -59) counts.D++;
        else if (dep >= -99) counts.LD++;
        else if (dep === -100) counts.NR++;
        else counts.ND++;
      }
      counts.Total = counts.LE + counts.E + counts.N + counts.D + counts.LD + counts.NR + counts.ND;
      return { state: stateNameMap.get(sc) ?? `State ${sc}`, state_code: sc, counts };
    }).sort((a, b) => a.state.localeCompare(b.state));
  }

  exportDistrictDistributionExcel(excelFileName: string): void {
    const stateRows = this.countDepartureByState();
    if (!stateRows.length) return;

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);
    const blankCell = { v: "", t: "s", s: {} };
    const thin = {
      top:    { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left:   { style: "thin", color: { rgb: "000000" } },
      right:  { style: "thin", color: { rgb: "000000" } },
    };
    const titleCell = (v: string, sz = 11) => ({
      v, t: "s",
      s: { font: { bold: true, sz, underline: true }, alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true } },
    });
    const hdrCell = (v: string) => ({
      v, t: "s",
      s: { font: { bold: true, sz: 9 }, fill: { fgColor: { rgb: "C8DCFF" } }, border: thin,
           alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true } },
    });
    const cell  = (v: any) => ({ v: String(v ?? ""), t: "s", s: { font: { bold: true, sz: 9 }, border: thin, alignment: { horizontal: "center" as const, vertical: "middle" as const } } });
    const lCell = (v: any) => ({ v: String(v ?? ""), t: "s", s: { font: { bold: true, sz: 9 }, border: thin, alignment: { horizontal: "left"   as const, vertical: "middle" as const } } });

    const periodLabel = `PERIOD :   ${this.convertToIndianDateFormat(this.data.startDate)}   TO   ${this.convertToIndianDateFormat(this.data.endDate)}`;
    const row1 = [titleCell("STATEWISE DISTRIBUTION OF NO. OF DISTRICTS", 12), ...Array(9).fill(blankCell)];
    const row2 = [titleCell("WITH LARGE EXCESS, EXCESS, NORMAL, DEFICIENT, LARGE DEFICIENT, NO RAINFALL AND NO DATA CATEGORY", 10), ...Array(9).fill(blankCell)];
    const row3 = Array(10).fill(blankCell);
    const row4 = [
      hdrCell("S."), hdrCell("STATES"),
      { v: periodLabel, t: "s", s: { font: { bold: true, sz: 10 }, alignment: { horizontal: "center" as const, vertical: "middle" as const } } },
      ...Array(7).fill(blankCell),
    ];
    const row5 = [hdrCell("NO."), blankCell, hdrCell("LE"), hdrCell("E"), hdrCell("N"), hdrCell("D"), hdrCell("LD"), hdrCell("NR"), hdrCell("ND"), hdrCell("TOTAL")];

    XLSX.utils.sheet_add_aoa(ws, [row1], { origin: "A1" });
    XLSX.utils.sheet_add_aoa(ws, [row2], { origin: "A2" });
    XLSX.utils.sheet_add_aoa(ws, [row3], { origin: "A3" });
    XLSX.utils.sheet_add_aoa(ws, [row4], { origin: "A4" });
    XLSX.utils.sheet_add_aoa(ws, [row5], { origin: "A5" });

    const totals = stateRows.reduce((acc, r) => {
      acc.LE += r.counts.LE; acc.E += r.counts.E; acc.N += r.counts.N; acc.D += r.counts.D;
      acc.LD += r.counts.LD; acc.NR += r.counts.NR; acc.ND += r.counts.ND; acc.Total += r.counts.Total;
      return acc;
    }, { LE: 0, E: 0, N: 0, D: 0, LD: 0, NR: 0, ND: 0, Total: 0 });

    const dataStartRow = 5;
    const dataRows: any[][] = stateRows.map((r, i) => [
      cell(i + 1), lCell(r.state),
      cell(r.counts.LE), cell(r.counts.E), cell(r.counts.N), cell(r.counts.D),
      cell(r.counts.LD), cell(r.counts.NR), cell(r.counts.ND), cell(r.counts.Total),
    ]);
    dataRows.push([
      blankCell,
      { v: "TOTAL", t: "s", s: { font: { bold: true, sz: 9 }, border: thin, alignment: { horizontal: "center" as const, vertical: "middle" as const } } },
      cell(totals.LE), cell(totals.E), cell(totals.N), cell(totals.D),
      cell(totals.LD), cell(totals.NR), cell(totals.ND), cell(totals.Total),
    ]);

    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: { r: dataStartRow, c: 0 } });

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 3, c: 9 } },
    ];
    ws["!cols"] = [
      { wch: 6 }, { wch: 32 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    ];
    ws["!rows"] = [{ hpt: 20 }, { hpt: 30 }, { hpt: 5 }, { hpt: 25 }, { hpt: 20 }];

    const wb: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ["data"] };
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    this.saveAsExcelFile(buf, excelFileName);
  }

  // getColorAndCat(departure: any) {

  //   let color = ''
  //   let Cat = ''

  //   if(departure==null){
  //     return {
  //       color:'#c0c0c0',
  //       Cat : 'ND'
  //     }
  //   }

  //   if(departure>=60){
  //     Cat = 'LE'
  //     color = '#0096ff'
  //   }
  //   else if(departure >= 20 && departure <= 59){
  //     Cat = 'E'
  //     color = '#32c0f8'
  //   }
  //   else if(departure >= -19 &&  departure<= +19){
  //     Cat = 'N'
  //     color = '#00cd5b'
  //   }
  //   else if(departure>= -59 && departure <= -20){
  //     Cat = 'D'
  //     color = '#ff2700'
  //   }
  //   else if(departure >= -99 && departure<= -60){
  //     Cat = 'LD'
  //     color = '#ffff20'
  //   }
  //   else if(departure= -100){
  //     Cat = 'NR'
  //     color = '#ffffff'
  //   }

  //   return {
  //     color : color,
  //     Cat : Cat
  //   };
  // }
}
