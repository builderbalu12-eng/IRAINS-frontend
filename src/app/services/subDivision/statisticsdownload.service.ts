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
import { SubdivisionService } from "./subDivision.service";
import { CountryService } from "../country/country.service";

@Injectable({
  providedIn: "root",
})
export class SubdivDownloadStatistics {
  private baseUrl: string = environment.baseUrl;
  isView: boolean = false;

  subdivdepCurrdate: any[] = [];
  regiondepCurrdate: any[] = [];
  countrydepCurrdate: any[] = [];

  subdivdepSeasondate: any[] = [];
  regiondepSeasondate: any[] = [];
  countrydepSeasondate: any[] = [];

  rows: any[][] = [];
  data: any;
  seasonPeriodDate: any;

  constructor(
    private http: HttpClient,
    private constants: Constants,
    private regionService: RegionService,
    private subdivservice: SubdivisionService,
    private countryService: CountryService
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

  // async updateCurrDateData(data: any, seasonPeriodDate: any) {
  //   try {
  //     await lastValueFrom(
  //       this.fetchDistrictData(data).pipe(
  //         concatMap(districtData => {
  //           this.districtdepCurrdate = districtData.data;
  //           console.log('indownloading---->', this.districtdepCurrdate);
  //           return this.fetchStateData(data);
  //         }),
  //         concatMap(stateData => {
  //           this.statedepCurrdate = stateData.data;
  //           console.log('indownloading---->', this.statedepCurrdate);
  //           return this.fetchSubdivData(data);
  //         }),
  //         concatMap(subdiv => {
  //           this.subdivdepCurrdate = subdiv.data;
  //           console.log('indownloading---->', this.subdivdepCurrdate);
  //           return this.fetchDistrictData(seasonPeriodDate); // or any observable to complete the chain
  //         }),
  //         concatMap(seasondistrictData => {
  //           this.districtdepSeasondate = seasondistrictData.data;
  //           console.log('indownloading---->', this.districtdepSeasondate);
  //           return this.fetchStateData(seasonPeriodDate);
  //         }),
  //         concatMap(seasonstateData => {
  //           this.statedepSeasondate = seasonstateData.data;
  //           console.log('indownloading---->', this.statedepSeasondate, this.subdivdepSeasondate);
  //           return this.fetchSubdivData(seasonPeriodDate);
  //         }),
  //         concatMap(seasonstateData => {
  //           this.subdivdepSeasondate = seasonstateData.data;
  //           console.log('indownloading---->', this.subdivdepSeasondate);
  //           this.downloadPdf();
  //           return EMPTY;
  //         })
  //       )
  //     );
  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //   }
  // }

  async updateCurrDateData(data: any, seasonPeriodDate: any) {
    try {
      await lastValueFrom(
        this.subdivservice.fetchDataFtp(data).pipe(
          concatMap((subdiv) => {
            this.subdivdepCurrdate = subdiv.data;
            console.log("indownloading---->", this.subdivdepCurrdate);
            return this.regionService.fetchDataFtp(data);
          }),

          concatMap((region) => {
            this.regiondepCurrdate = region.data;
            console.log("indownloading---->", this.regiondepCurrdate);
            return this.subdivservice.fetchDataFtp(seasonPeriodDate);
          }),

          concatMap((seasonsubdivData) => {
            this.subdivdepSeasondate = seasonsubdivData.data;
            console.log("indownloading---->", this.subdivdepSeasondate);
            return this.regionService.fetchDataFtp(seasonPeriodDate);
          }),

          concatMap((seasonregionData) => {
            this.regiondepSeasondate = seasonregionData.data;
            console.log("indownloading---->", this.regiondepSeasondate);
            return this.countryService.fetchDataFtp(data);
          }),

          concatMap((countryData) => {
            this.countrydepCurrdate = countryData.data;
            return this.countryService.fetchDataFtp(seasonPeriodDate);
          }),

          concatMap((seasonCountryData) => {
            this.countrydepSeasondate = seasonCountryData.data;
            return this.subdivservice.fetchAreaPercentages();
          }),

          concatMap((areaData) => {
            this.subdivAreaMap = new Map(
              areaData.data.map((r: any) => [Number(r.subdiv_code), Number(r.area_percentage)])
            );
            this.downloadPdf();
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    // this.subdivservice.fetchDataFtp(data).pipe(
    //   concatMap(subdiv => {
    //     this.subdivdepCurrdate = subdiv.data;
    //     console.log('indownloading---->',this.subdivdepCurrdate)
    //     return this.regionService.fetchDataFtp(data);
    //   }),

    //   concatMap(region => {
    //     this.regiondepCurrdate = region.data;
    //     console.log('indownloading---->',this.regiondepCurrdate)
    //     return this.subdivservice.fetchDataFtp(seasonPeriodDate); // or any observable to complete the chain
    //   }),

    //   concatMap(seasonsubdivData => {
    //     this.subdivdepSeasondate = seasonsubdivData.data;
    //     console.log('indownloading---->',this.subdivdepSeasondate)
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
        this.subdivservice.fetchData(data).pipe(
          concatMap((subdiv) => {
            this.subdivdepCurrdate = subdiv.data;
            console.log("indownloading---->", this.subdivdepCurrdate);
            return this.regionService.fetchData(data);
          }),

          concatMap((region) => {
            this.regiondepCurrdate = region.data;
            console.log("indownloading---->", this.regiondepCurrdate);
            return this.subdivservice.fetchData(seasonPeriodDate);
          }),

          concatMap((seasonsubdivData) => {
            this.subdivdepSeasondate = seasonsubdivData.data;
            console.log("indownloading---->", this.subdivdepSeasondate);
            return this.regionService.fetchData(seasonPeriodDate);
          }),

          concatMap((seasonregionData) => {
            this.regiondepSeasondate = seasonregionData.data;
            console.log("indownloading---->", this.regiondepSeasondate);
            return this.countryService.fetchData(data);
          }),

          concatMap((countryData) => {
            this.countrydepCurrdate = countryData.data;
            return this.countryService.fetchData(seasonPeriodDate);
          }),

          concatMap((seasonCountryData) => {
            this.countrydepSeasondate = seasonCountryData.data;
            return this.subdivservice.fetchAreaPercentages();
          }),

          concatMap((areaData) => {
            this.subdivAreaMap = new Map(
              areaData.data.map((r: any) => [Number(r.subdiv_code), Number(r.area_percentage)])
            );
            this.downloadPdf();
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    // this.subdivservice.fetchDataFtp(data).pipe(
    //   concatMap(subdiv => {
    //     this.subdivdepCurrdate = subdiv.data;
    //     console.log('indownloading---->',this.subdivdepCurrdate)
    //     return this.regionService.fetchDataFtp(data);
    //   }),

    //   concatMap(region => {
    //     this.regiondepCurrdate = region.data;
    //     console.log('indownloading---->',this.regiondepCurrdate)
    //     return this.subdivservice.fetchDataFtp(seasonPeriodDate); // or any observable to complete the chain
    //   }),

    //   concatMap(seasonsubdivData => {
    //     this.subdivdepSeasondate = seasonsubdivData.data;
    //     console.log('indownloading---->',this.subdivdepSeasondate)
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
    dataRows: any[][],
    categoryRows: any[][],
    excelFileName: string,
    columns: any[],     // row 4: blank, blank, ACTUAL, NORMAL, ...
    columns1: any[],    // row 3: S.No, METEOROLOGICAL, DAY label, PERIOD label
    title: string       // e.g. "SUBDIVISION-WISE RAINFALL (MM) DISTRIBUTION"
  ): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);

    const redBorder = {
      top:    { style: 'medium', color: { rgb: 'C0000B' } },
      bottom: { style: 'medium', color: { rgb: 'C0000B' } },
      left:   { style: 'medium', color: { rgb: 'C0000B' } },
      right:  { style: 'medium', color: { rgb: 'C0000B' } },
    };
    const blankCell = { v: '', t: 's', s: {} };

    // Row 1: Title — red bold, merged A1:J1
    const titleRow = [
      { v: title, t: 's', s: {
        font: { bold: true, sz: 12, color: { rgb: 'C0000B' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      }},
      ...Array(9).fill(blankCell),
    ];

    // Row 2: blank
    const blankRow = Array(10).fill(blankCell);

    // Row 3: S.No + METEOROLOGICAL + DAY/PERIOD labels
    const hdrStyle3 = {
      font: { bold: true, sz: 9, color: { rgb: '000000' } },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      border: redBorder,
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    };
    const styledColumns1 = columns1.map((v: any) => ({ v: String(v ?? ''), t: 's', s: hdrStyle3 }));

    // Row 4: blank A-B + ACTUAL/NORMAL/etc
    const styledColumns = columns.map((v: any) => ({ v: String(v ?? ''), t: 's', s: hdrStyle3 }));

    // Merges
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },   // Title A1:J1
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },   // S.No A3:A4
      { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },   // METEOROLOGICAL B3:B4
      { s: { r: 2, c: 2 }, e: { r: 2, c: 5 } },   // DAY C3:F3
      { s: { r: 2, c: 6 }, e: { r: 2, c: 9 } },   // PERIOD G3:J3
    ];

    XLSX.utils.sheet_add_aoa(worksheet, [titleRow],       { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(worksheet, [blankRow],       { origin: 'A2' });
    XLSX.utils.sheet_add_aoa(worksheet, [styledColumns1], { origin: 'A3' });
    XLSX.utils.sheet_add_aoa(worksheet, [styledColumns],  { origin: 'A4' });
    XLSX.utils.sheet_add_aoa(worksheet, dataRows,         { origin: 'A5' });

    // Category section: starts after title(1)+blank(1)+headers(2)+data rows
    const catStartRow = 4 + dataRows.length; // 0-indexed
    XLSX.utils.sheet_add_aoa(worksheet, categoryRows, { origin: { r: catStartRow, c: 0 } });

    const cm = catStartRow;
    const catMerges = [
      { s: { r: cm + 1, c: 0 }, e: { r: cm + 1, c: 9 } },  // title
      { s: { r: cm + 3, c: 1 }, e: { r: cm + 3, c: 4 } },  // DAY label
      { s: { r: cm + 3, c: 6 }, e: { r: cm + 3, c: 9 } },  // PERIOD label
      { s: { r: cm + 4, c: 1 }, e: { r: cm + 4, c: 2 } },  // NO.OF SUBDIV day
      { s: { r: cm + 4, c: 3 }, e: { r: cm + 4, c: 4 } },  // %AREA day
      { s: { r: cm + 4, c: 6 }, e: { r: cm + 4, c: 7 } },  // NO.OF SUBDIV period
      { s: { r: cm + 4, c: 8 }, e: { r: cm + 4, c: 9 } },  // %AREA period
      ...Array.from({ length: 6 }, (_, i) => [
        { s: { r: cm + 5 + i, c: 1 }, e: { r: cm + 5 + i, c: 2 } },
        { s: { r: cm + 5 + i, c: 3 }, e: { r: cm + 5 + i, c: 4 } },
        { s: { r: cm + 5 + i, c: 6 }, e: { r: cm + 5 + i, c: 7 } },
        { s: { r: cm + 5 + i, c: 8 }, e: { r: cm + 5 + i, c: 9 } },
      ]).flat(),
    ];
    worksheet['!merges'] = [...worksheet['!merges'], ...catMerges];

    worksheet['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 8  }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 8  },
    ];
    worksheet['!rows'] = [{ hpt: 25 }, { hpt: 5 }, { hpt: 35 }, { hpt: 25 }];

    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private rgbToHex(rgb: number[]): string {
    return rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
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
        // content:
        //   this.data.startDate == this.data.endDate
        //     ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`
        //     : `DAY: ${this.convertToIndianDateFormat(
        //         this.data.startDate
        //       )} to ${this.convertToIndianDateFormat(this.data.endDate)}`,
        // colSpan: 4,

        content: this.data.startDate === this.data.endDate 
        ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`
        : `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.getAdjustedEndDate(this.data.startDate, this.data.endDate)}`, 
      colSpan: 4
      
      },
      {
        content: `PERIOD: ${this.convertToIndianDateFormat(
          this.seasonPeriodDate.startDate
        )} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`,
        colSpan: 4,
      },
    ];
    const columns1forexcel = [
      'S.\nNO.',
      'METEOROLOGICAL\nSUBDIVISIONS',
      {
        content: this.data.startDate === this.data.endDate
          ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`
          : `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} TO ${this.getAdjustedEndDate(this.data.startDate, this.data.endDate)}`,
        colSpan: 4,
      },
      '', '', '',
      {
        content: `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} TO ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`,
        colSpan: 4,
      },
      '', '', '',
    ];

    const columns = [
      "S.No",
      "METEOROLOGICAL SUBDIVISIONS",
      "ACTUAL(mm)",
      "NORMAL(mm)",
      "%DEP.",
      "CAT.",
      "ACTUAL(mm)",
      "NORMAL(mm)",
      "%DEP.",
      "CAT.",
    ];

    const columnsForExcel = ['', '', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.'];

    this.loadTheRows();

    const redBorder = {
      top:    { style: 'medium', color: { rgb: 'C0000B' } },
      bottom: { style: 'medium', color: { rgb: 'C0000B' } },
      left:   { style: 'medium', color: { rgb: 'C0000B' } },
      right:  { style: 'medium', color: { rgb: 'C0000B' } },
    };
    const thinBlack = {
      top:    { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left:   { style: 'thin', color: { rgb: '000000' } },
      right:  { style: 'thin', color: { rgb: '000000' } },
    };

    var newArr: any[][] = this.rows.map((subArr) => {
      // Detect row type from first cell's fillColor
      const firstFill = subArr[0]?.styles?.fillColor;
      const isRegion  = Array.isArray(firstFill) && firstFill[0] === 72;   // [72,209,204] teal
      const isCountry = Array.isArray(firstFill) && firstFill[0] === 180;  // [180,180,180] gray

      return subArr.map((item: any, colIdx: number) => {
        let content = typeof item === 'object' && item.hasOwnProperty('content') ? item.content : item;
        if ((colIdx === 4 || colIdx === 8) && content !== '' && content !== ' ' && content != null) {
          content = `${content}%`;
        }
        const cellFill = item?.styles?.fillColor;

        if (isRegion || isCountry) {
          // Region / Country rows: white fill, blue bold text, red border
          return {
            v: String(content ?? ''),
            t: 's',
            s: {
              fill: { fgColor: { rgb: 'FFFFFF' } },
              border: redBorder,
              font: { bold: true, sz: 9, color: { rgb: '0070C0' } },
              alignment: { horizontal: 'center', vertical: 'middle' },
            },
          };
        }

        // Subdivision rows: keep CAT cell color, white for others
        const isHexFill = typeof cellFill === 'string' && cellFill.startsWith('#');
        const fillHex   = isHexFill ? cellFill.replace('#', '').toUpperCase() : 'FFFFFF';
        return {
          v: String(content ?? ''),
          t: 's',
          s: {
            fill: { fgColor: { rgb: fillHex } },
            border: thinBlack,
            font: { bold: true, sz: 9, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
          },
        };
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
    const headingText1 = "SUBDIVISION-WISE RAINFALL (MM) DISTRIBUTION";
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

    this.addCategoryTable(doc);

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
    // DISTRIBUTION_COUNTRY_INDIA_cd.pdf
    const suffix  = this.constants.getDateSuffix(this.data.startDate, this.data.endDate);
    const dateLabel = this.constants.getExcelDateLabel(this.data.startDate, this.data.endDate);
    const filename  = `SUBDIVISION_RAINFALL_DISTRIBUTION_COUNTRY_INDIA_${suffix}.pdf`;
    const excelName = `SUBDIV_${dateLabel}`;

    // Build category rows for Excel
    const catStats = this.buildCategoryStats();
    const dayS    = catStats.day    as Record<string, { count: number; area: number }>;
    const periodS = catStats.period as Record<string, { count: number; area: number }>;
    const catLabelsExcel: Record<string, string> = {
      LE: 'LARGE EXCESS', E: 'EXCESS', N: 'NORMAL',
      D: 'DEFICIENT', LD: 'LARGE DEFICIENT', NR: 'NO RAIN',
    };
    const dayLabelExcel = this.data.startDate === this.data.endDate
      ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`
      : `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} TO ${this.getAdjustedEndDate(this.data.startDate, this.data.endDate)}`;
    const periodLabelExcel = `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} TO ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`;

    const catThinBorder = {
      top:    { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left:   { style: 'thin', color: { rgb: '000000' } },
      right:  { style: 'thin', color: { rgb: '000000' } },
    };
    const catHdrStyle = (extra: any = {}) => ({
      font: { bold: true, sz: 9, color: { rgb: '000000' }, ...extra.font },
      fill: { fgColor: { rgb: 'C8DCFF' } },
      border: catThinBorder,
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    });
    const catDataCell = (v: any) => ({
      v: String(v), t: 's',
      s: { border: catThinBorder, alignment: { horizontal: 'center' as const, vertical: 'middle' as const }, font: { bold: true, sz: 9 } },
    });
    const blankCell = { v: '', t: 's', s: {} };
    const blankRow = Array(10).fill(blankCell);

    const categoryExcelRows: any[][] = [
      blankRow,
      [
        { v: 'CATEGORYWISE NO. OF SUBDIVISIONS & % AREA (SUBDIVISIONAL) OF THE COUNTRY', t: 's',
          s: { font: { bold: true, sz: 10, color: { rgb: 'C0000B' } }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } },
        ...Array(9).fill(blankCell),
      ],
      blankRow,
      // DAY label spans B-E (cols 1-4), PERIOD label spans G-J (cols 6-9)
      [blankCell,
       { v: dayLabelExcel, t: 's', s: catHdrStyle() },
       blankCell, blankCell, blankCell,
       blankCell,
       { v: periodLabelExcel, t: 's', s: catHdrStyle() },
       blankCell, blankCell, blankCell],
      // column headers: A=CATEGORY, B-C=NO.OF SUBDIV, D-E=%AREA, F=blank, G-H=NO.OF SUBDIV, I-J=%AREA
      [{ v: 'CATEGORY', t: 's', s: catHdrStyle() },
       { v: 'NO. OF\nSUBDIVISIONS', t: 's', s: catHdrStyle() },
       blankCell,
       { v: 'SUBDIVISIONAL\n% AREA OF COUNTRY', t: 's', s: catHdrStyle() },
       blankCell,
       blankCell,
       { v: 'NO. OF\nSUBDIVISIONS', t: 's', s: catHdrStyle() },
       blankCell,
       { v: 'SUBDIVISIONAL\n% AREA OF COUNTRY', t: 's', s: catHdrStyle() },
       blankCell],
      // 6 data rows
      ...['LE', 'E', 'N', 'D', 'LD', 'NR'].map(cat => [
        { v: catLabelsExcel[cat], t: 's', s: { border: catThinBorder, font: { bold: true, sz: 9 }, alignment: { horizontal: 'left' as const, vertical: 'middle' as const } } },
        catDataCell(dayS[cat].count),
        blankCell,
        catDataCell(`${dayS[cat].area}%`),
        blankCell,
        blankCell,
        catDataCell(periodS[cat].count),
        blankCell,
        catDataCell(`${periodS[cat].area}%`),
        blankCell,
      ]),
    ];

    if (this.isView) {
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
    } else {
      setTimeout(() => {
        doc.save(filename);
        this.exportAsExcelFile(
          newArr,
          categoryExcelRows,
          excelName,
          columnsForExcel,
          newcolumns1,
          'SUBDIVISION-WISE RAINFALL (MM) DISTRIBUTION'
        );
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

  // Populated at runtime from GET /api/v1/getSubdivisionAreaPercentages
  private subdivAreaMap: Map<number, number> = new Map();

  private buildCategoryStats() {
    const cats = ['LE', 'E', 'N', 'D', 'LD', 'NR'] as const;
    type CatKey = typeof cats[number];

    const makeEmpty = (): Record<CatKey, { count: number; area: number }> =>
      Object.fromEntries(cats.map(c => [c, { count: 0, area: 0 }])) as any;

    const day    = makeEmpty();
    const period = makeEmpty();

    for (const item of this.subdivdepCurrdate) {
      const cat = this.constants.getColorAndCat(item.departure).Cat as CatKey;
      if (cats.includes(cat)) {
        day[cat].count++;
        day[cat].area += this.subdivAreaMap.get(Number(item.s_code)) ?? 0;
      }
    }

    for (const item of this.subdivdepSeasondate) {
      const cat = this.constants.getColorAndCat(item.departure).Cat as CatKey;
      if (cats.includes(cat)) {
        period[cat].count++;
        period[cat].area += this.subdivAreaMap.get(Number(item.s_code)) ?? 0;
      }
    }

    // area values from API are already in %, just round
    for (const k of cats) {
      day[k].area    = Math.round(day[k].area);
      period[k].area = Math.round(period[k].area);
    }

    return { day, period };
  }

  private addCategoryTable(doc: jsPDF) {
    const stats = this.buildCategoryStats();

    const dayLabel = this.data.startDate === this.data.endDate
      ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`
      : `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} TO ${this.getAdjustedEndDate(this.data.startDate, this.data.endDate)}`;

    const periodLabel = `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} TO ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`;

    const titleRow = [{
      content: 'CATEGORYWISE NO. OF SUBDIVISIONS & % AREA (SUBDIVISIONAL) OF THE COUNTRY',
      colSpan: 5,
      styles: { halign: 'center' as const, fontStyle: 'bold' as const },
    }];

    const header1 = [
      { content: 'CATEGORY', rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: dayLabel,    colSpan: 2, styles: { halign: 'center' as const } },
      { content: periodLabel, colSpan: 2, styles: { halign: 'center' as const } },
    ];

    const header2 = [
      { content: 'NO. OF\nSUBDIVISIONS',          styles: { halign: 'center' as const } },
      { content: 'SUBDIVISIONAL\n% AREA OF COUNTRY', styles: { halign: 'center' as const } },
      { content: 'NO. OF\nSUBDIVISIONS',          styles: { halign: 'center' as const } },
      { content: 'SUBDIVISIONAL\n% AREA OF COUNTRY', styles: { halign: 'center' as const } },
    ];

    const catLabels: Record<string, string> = {
      LE: 'LARGE EXCESS', E: 'EXCESS', N: 'NORMAL',
      D: 'DEFICIENT', LD: 'LARGE DEFICIENT', NR: 'NO RAIN',
    };

    const dayStats    = stats.day    as Record<string, { count: number; area: number }>;
    const periodStats = stats.period as Record<string, { count: number; area: number }>;

    const rows = ['LE', 'E', 'N', 'D', 'LD', 'NR'].map(cat => [
      catLabels[cat],
      dayStats[cat].count,
      `${dayStats[cat].area}%`,
      periodStats[cat].count,
      `${periodStats[cat].area}%`,
    ]);

    const startY = (doc as any).lastAutoTable.finalY + 10;

    autoTable(doc, {
      head: [titleRow, header1, header2],
      body: rows,
      startY,
      margin: { left: 10 },
      styles: { fontSize: 7, halign: 'center', textColor: [0, 0, 0] },
      headStyles: { halign: 'center', fillColor: [200, 220, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      didDrawCell: function (data: { cell: { x: number; y: number; width: any; height: any } }) {
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
      },
    });
  }

  private loadTheRows() {
    this.rows = [];
    // Group by Subdivision and then State
    console.log("started", this.rows);
    const groupedByRegion = this.subdivdepCurrdate.reduce((acc, item) => {
      const region = item.region_code;
      const subdiv = item.s_code;

      if (!acc[region]) {
        acc[region] = {};
      }

      if (!acc[region][subdiv]) {
        acc[region][subdiv] = [];
      }

      acc[region][subdiv].push(item);
      return acc;
    }, {});

    const sortedRegions = Object.keys(groupedByRegion).sort((a, b) =>
      a.localeCompare(b)
    );
    console.group("heygeyye", sortedRegions);
    console.log(
      "printing subdivs",
      this.subdivdepCurrdate,
      this.subdivdepSeasondate
    );

    let subdivColorCode = [72, 209, 204];
    let stateColorCode = [255, 255, 255];

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
        { content: "", styles: { fillColor: subdivColorCode } },
        {
          content: `REGION : ${regionDate.name.toUpperCase()}`,
          styles: { fillColor: subdivColorCode },
        },
        {
          content:
            regionDate.actual_rainfall != null
              ? this.constants.trimToOneDecimals(regionDate.actual_rainfall)
              : " ",
          styles: { fillColor: subdivColorCode },
        },
        {
          content: this.constants.trimToOneDecimals(
            parseFloat(regionDate.rainfall_normal_value)
          ),
          styles: { fillColor: subdivColorCode },
        },
        {
          content:
            regionDate.departure != null
              ? this.constants.trimToZeroDecimals(regionDate.departure)
              : " ",
          styles: { fillColor: subdivColorCode },
        },
        { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
        {
          content:
            regionSeason.actual_rainfall != null
              ? this.constants.trimToOneDecimals(regionSeason.actual_rainfall)
              : " ",
          styles: { fillColor: subdivColorCode },
        },
        {
          content: this.constants.trimToOneDecimals(
            parseFloat(regionSeason.rainfall_normal_value)
          ),
          styles: { fillColor: subdivColorCode },
        },
        {
          content:
            regionSeason.departure != null
              ? this.constants.trimToZeroDecimals(regionSeason.departure)
              : " ",
          styles: { fillColor: subdivColorCode },
        },
        { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } },
      ]);

      // Process States within each Subdivision
      const subdivs = groupedByRegion[regionCode];
      const sortedsubdivs = Object.keys(subdivs).sort((a, b) =>
        a.localeCompare(b)
      );

      let index = 1;
      for (const subdivCode of sortedsubdivs) {
        const subdivDate = this.subdivdepCurrdate.find(
          (subdiv) => subdivCode == subdiv.s_code.toString()
        );
        const subdivSeason = this.subdivdepSeasondate.find(
          (subdiv) => subdivCode == subdiv.s_code.toString()
        );

        const DateCat = this.constants.getColorAndCat(subdivDate.departure);
        const SeasonCat = this.constants.getColorAndCat(
          subdivSeason.departure
        );




        console.log("printing subdivs", subdivDate.subdiv_name);

        // Add State Row
        this.rows.push([
          { content: index++, styles: { fillColor: stateColorCode } },
          {
            content: `${subdivDate.subdiv_name}`,
            styles: { fillColor: stateColorCode },
          },
          {
            content:
              subdivDate.actual_subdiv_rainfall != null
                ? this.constants.trimToOneDecimals(
                    subdivDate.actual_subdiv_rainfall
                  )
                : " ",
            styles: { fillColor: stateColorCode },
          },
          {
            content: this.constants.trimToOneDecimals(
              parseFloat(subdivDate.rainfall_normal_value)
            ),
            styles: { fillColor: stateColorCode },
          },
          {
            content:
              subdivDate.departure != null
                ? this.constants.trimToZeroDecimals(subdivDate.departure)
                : " ",
            styles: { fillColor: stateColorCode },
          },
          { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
          {
            content:
              subdivSeason.actual_subdiv_rainfall != null
                ? this.constants.trimToOneDecimals(
                    subdivSeason.actual_subdiv_rainfall
                  )
                : " ",
            styles: { fillColor: stateColorCode },
          },
          {
            content: this.constants.trimToOneDecimals(
              parseFloat(subdivSeason.rainfall_normal_value)
            ),
            styles: { fillColor: stateColorCode },
          },
          {
            content:
              subdivSeason.departure != null
                ? this.constants.trimToZeroDecimals(subdivSeason.departure)
                : " ",
            styles: { fillColor: stateColorCode },
          },
          { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } },
        ]);
      }
    }
    // COUNTRY AS A WHOLE — last row
    if (this.countrydepCurrdate?.length && this.countrydepSeasondate?.length) {
      const countryColorCode = [180, 180, 180];
      const countryDate   = this.countrydepCurrdate[0];
      const countrySeason = this.countrydepSeasondate[0];
      const cDateCat   = this.constants.getColorAndCat(countryDate.departure);
      const cSeasonCat = this.constants.getColorAndCat(countrySeason.departure);

      this.rows.push([
        { content: '', styles: { fillColor: countryColorCode } },
        { content: 'COUNTRY AS A WHOLE', styles: { fillColor: countryColorCode, fontStyle: 'bold' } },
        { content: countryDate.actual_rainfall != null ? this.constants.trimToOneDecimals(countryDate.actual_rainfall) : ' ', styles: { fillColor: countryColorCode } },
        { content: this.constants.trimToOneDecimals(parseFloat(countryDate.rainfall_normal_value)), styles: { fillColor: countryColorCode } },
        { content: countryDate.departure != null ? this.constants.trimToZeroDecimals(countryDate.departure) : ' ', styles: { fillColor: countryColorCode } },
        { content: cDateCat.Cat,   styles: { fillColor: cDateCat.color } },
        { content: countrySeason.actual_rainfall != null ? this.constants.trimToOneDecimals(countrySeason.actual_rainfall) : ' ', styles: { fillColor: countryColorCode } },
        { content: this.constants.trimToOneDecimals(parseFloat(countrySeason.rainfall_normal_value)), styles: { fillColor: countryColorCode } },
        { content: countrySeason.departure != null ? this.constants.trimToZeroDecimals(countrySeason.departure) : ' ', styles: { fillColor: countryColorCode } },
        { content: cSeasonCat.Cat, styles: { fillColor: cSeasonCat.color } },
      ]);
    }

    console.log(this.rows);
  }

  // getColorAndCat(departure: any) {
  //   let color = "";
  //   let Cat = "";
  //   if (departure == null) {
  //     return {
  //       color: "#c0c0c0",
  //       Cat: "ND",
  //     };
  //   }
  //   if (departure >= 60) {
  //     Cat = "LE";
  //     color = "#0096ff";
  //   } else if (departure >= 20 && departure <= 59) {
  //     Cat = "E";
  //     color = "#32c0f8";
  //   } else if (departure >= -19 && departure <= +19) {
  //     Cat = "N";
  //     color = "#00cd5b";
  //   } else if (departure >= -59 && departure <= -20) {
  //     Cat = "D";
  //     color = "#ff2700";
  //   } else if (departure >= -99 && departure <= -60) {
  //     Cat = "LD";
  //     color = "#ffff20";
  //   } else if ((departure = -100)) {
  //     Cat = "NR";
  //     color = "#ffffff";
  //   }

  //   return {
  //     color: color,
  //     Cat: Cat,
  //   };
  // }


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







