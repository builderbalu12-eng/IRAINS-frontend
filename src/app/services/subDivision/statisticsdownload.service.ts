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
            return this.subdivservice.fetchDisplayOrder();
          }),

          concatMap((orderData) => {
            this.subdivDisplayOrder = Array.isArray(orderData) ? orderData : (orderData.data ?? []);
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
            return this.subdivservice.fetchDisplayOrder();
          }),

          concatMap((orderData) => {
            this.subdivDisplayOrder = Array.isArray(orderData) ? orderData : (orderData.data ?? []);
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
    columns: any[],
    columns1: any[],
    title: string,
    regionRowIndices: number[] = [],
    countryRowIndex: number | null = null
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
      font: { bold: true, sz: 10, color: { rgb: 'C0000B' } },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      border: redBorder,
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    };
    const styledColumns1 = columns1.map((v: any) => ({ v: String(v ?? ''), t: 's', s: hdrStyle3 }));

    // Row 4: blank A-B + ACTUAL/NORMAL/etc
    const styledColumns = columns.map((v: any) => ({ v: String(v ?? ''), t: 's', s: hdrStyle3 }));

    // Region merges: A:B name, E:F dep% day, I:J dep% period
    const regionMerges = regionRowIndices.flatMap(i => [
      { s: { r: 4 + i, c: 0 }, e: { r: 4 + i, c: 1 } },
      { s: { r: 4 + i, c: 4 }, e: { r: 4 + i, c: 5 } },
      { s: { r: 4 + i, c: 8 }, e: { r: 4 + i, c: 9 } },
    ]);
    const countryMerges = countryRowIndex !== null ? [
      { s: { r: 4 + countryRowIndex, c: 0 }, e: { r: 4 + countryRowIndex, c: 1 } },
      { s: { r: 4 + countryRowIndex, c: 4 }, e: { r: 4 + countryRowIndex, c: 5 } },
      { s: { r: 4 + countryRowIndex, c: 8 }, e: { r: 4 + countryRowIndex, c: 9 } },
    ] : [];

    // Merges
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },   // Title A1:J1
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },   // S.No A3:A4
      { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },   // METEOROLOGICAL B3:B4
      { s: { r: 2, c: 2 }, e: { r: 2, c: 5 } },   // DAY C3:F3
      { s: { r: 2, c: 6 }, e: { r: 2, c: 9 } },   // PERIOD G3:J3
      ...regionMerges,
      ...countryMerges,
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
      { s: { r: cm + 1, c: 0 }, e: { r: cm + 1, c: 9 } },   // title A:J
      { s: { r: cm + 3, c: 0 }, e: { r: cm + 5, c: 1 } },   // CATEGORY A:B across rows cm+3–cm+5
      { s: { r: cm + 4, c: 2 }, e: { r: cm + 5, c: 3 } },   // NO. OF SUBDIVISIONS day C:D across rows cm+4–cm+5
      { s: { r: cm + 4, c: 4 }, e: { r: cm + 5, c: 5 } },   // %AREA day E:F across rows cm+4–cm+5
      { s: { r: cm + 4, c: 6 }, e: { r: cm + 5, c: 7 } },   // NO. OF SUBDIVISIONS period G:H across rows cm+4–cm+5
      { s: { r: cm + 4, c: 8 }, e: { r: cm + 5, c: 9 } },   // %AREA period I:J across rows cm+4–cm+5
      ...Array.from({ length: 6 }, (_, i) => [
        { s: { r: cm + 6 + i, c: 0 }, e: { r: cm + 6 + i, c: 1 } },   // category name A:B
        { s: { r: cm + 6 + i, c: 2 }, e: { r: cm + 6 + i, c: 3 } },   // count day C:D
        { s: { r: cm + 6 + i, c: 4 }, e: { r: cm + 6 + i, c: 5 } },   // area% day E:F
        { s: { r: cm + 6 + i, c: 6 }, e: { r: cm + 6 + i, c: 7 } },   // count period G:H
        { s: { r: cm + 6 + i, c: 8 }, e: { r: cm + 6 + i, c: 9 } },   // area% period I:J
      ]).flat(),
    ];
    worksheet['!merges'] = [...worksheet['!merges'], ...catMerges];

    worksheet['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 8  }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 8  },
    ];
    worksheet['!rows'] = [{ hpt: 25 }, { hpt: 20 }, { hpt: 35 }, { hpt: 25 }];

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

        content: `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`,
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
        content: `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} TO ${this.convertToIndianDateFormat(this.data.endDate)}`,
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

    var newArr: any[][] = [];
    const regionRowIndices: number[] = [];
    let countryRowIndex: number | null = null;

    const getContent = (item: any) =>
      typeof item === 'object' && item.hasOwnProperty('content') ? item.content : item;

    for (const subArr of this.rows) {
      const firstFill = subArr[0]?.styles?.fillColor;
      const isRegion  = Array.isArray(firstFill) && firstFill[0] === 72;
      const isCountry = Array.isArray(firstFill) && firstFill[0] === 180;

      if (isRegion) {
        const rawName = getContent(subArr[1]);
        const regionName = String(rawName ?? '').replace(/^REGION\s*:\s*/i, '');
        const mkRStyle = () => ({
          fill: { fgColor: { rgb: 'FFFFFF' } },
          border: {
            top:    { style: 'thin', color: { rgb: '873300' } },
            bottom: { style: 'thin', color: { rgb: '873300' } },
            left:   { style: 'thin', color: { rgb: '873300' } },
            right:  { style: 'thin', color: { rgb: '873300' } },
          },
          font: { bold: true, sz: 10, color: { rgb: '0000FF' } },
          alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        });
        const depDay    = getContent(subArr[4]);
        const depPeriod = getContent(subArr[8]);
        regionRowIndices.push(newArr.length);
        newArr.push([
          { v: regionName, t: 's', s: { ...mkRStyle(), alignment: { horizontal: 'left' as const, vertical: 'middle' as const } } },
          { v: '', t: 's', s: mkRStyle() },
          { v: String(getContent(subArr[2]) ?? ''), t: 's', s: mkRStyle() },
          { v: String(getContent(subArr[3]) ?? ''), t: 's', s: mkRStyle() },
          { v: depDay != null && depDay !== ' ' ? `${depDay}%` : '', t: 's', s: mkRStyle() },
          { v: '', t: 's', s: mkRStyle() },
          { v: String(getContent(subArr[6]) ?? ''), t: 's', s: mkRStyle() },
          { v: String(getContent(subArr[7]) ?? ''), t: 's', s: mkRStyle() },
          { v: depPeriod != null && depPeriod !== ' ' ? `${depPeriod}%` : '', t: 's', s: mkRStyle() },
          { v: '', t: 's', s: mkRStyle() },
        ]);
        continue;
      }

      if (isCountry) {
        const mkCStyle = () => ({
          fill: { fgColor: { rgb: 'FFFFFF' } },
          border: {
            top:    { style: 'medium', color: { rgb: 'C0000B' } },
            bottom: { style: 'medium', color: { rgb: 'C0000B' } },
            left:   { style: 'medium', color: { rgb: 'C0000B' } },
            right:  { style: 'medium', color: { rgb: 'C0000B' } },
          },
          font: { bold: true, sz: 9, color: { rgb: '0000FF' } },
          alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        });
        const depDay    = getContent(subArr[4]);
        const depPeriod = getContent(subArr[8]);
        countryRowIndex = newArr.length;
        newArr.push([
          { v: 'COUNTRY AS A WHOLE', t: 's', s: { ...mkCStyle(), alignment: { horizontal: 'left' as const, vertical: 'middle' as const } } },
          { v: '', t: 's', s: mkCStyle() },
          { v: String(getContent(subArr[2]) ?? ''), t: 's', s: mkCStyle() },
          { v: String(getContent(subArr[3]) ?? ''), t: 's', s: mkCStyle() },
          { v: depDay != null && depDay !== ' ' ? `${depDay}%` : '', t: 's', s: mkCStyle() },
          { v: '', t: 's', s: mkCStyle() },
          { v: String(getContent(subArr[6]) ?? ''), t: 's', s: mkCStyle() },
          { v: String(getContent(subArr[7]) ?? ''), t: 's', s: mkCStyle() },
          { v: depPeriod != null && depPeriod !== ' ' ? `${depPeriod}%` : '', t: 's', s: mkCStyle() },
          { v: '', t: 's', s: mkCStyle() },
        ]);
        continue;
      }

      // Normal subdivision rows
      newArr.push(subArr.map((item: any, colIdx: number) => {
        let content = getContent(item);
        if ((colIdx === 4 || colIdx === 8) && content !== '' && content !== ' ' && content != null) {
          content = `${content}%`;
        }
        const cellFill  = item?.styles?.fillColor;
        const isHexFill = typeof cellFill === 'string' && cellFill.startsWith('#');
        const fillHex   = isHexFill ? cellFill.replace('#', '').toUpperCase() : 'FFFFFF';
        return {
          v: String(content ?? ''), t: 's',
          s: {
            fill: { fgColor: { rgb: fillHex } },
            border: thinBlack,
            font: { bold: true, sz: 9, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
          },
        };
      }));
    }

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
    const suffix = this.constants.getDateSuffix(this.data.startDate, this.data.endDate);
    const filename = `SUBDIVISION_RAINFALL_DISTRIBUTION_COUNTRY_INDIA_${suffix}.pdf`;
    const isSingleDate = this.data.startDate === this.data.endDate;
    let excelName: string;
    if (isSingleDate) {
      const [y, m, d] = this.data.startDate.split('-');
      excelName = `SUBDIV_${d}${m}${y}`;
    } else {
      const s = new Date(this.data.startDate);
      const e = new Date(this.data.endDate);
      const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const MON    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const d1 = String(s.getDate()).padStart(2, '0');
      const d2 = String(e.getDate()).padStart(2, '0');
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        excelName = `SUBDIV (${d1}-${d2}) ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
      } else if (s.getFullYear() === e.getFullYear()) {
        excelName = `SUBDIV (${d1}${MON[s.getMonth()]}-${d2}${MON[e.getMonth()]}) ${s.getFullYear()}`;
      } else {
        excelName = `SUBDIV (${d1}${MON[s.getMonth()]}${s.getFullYear()}-${d2}${MON[e.getMonth()]}${e.getFullYear()})`;
      }
    }

    // Build category rows for Excel
    const catStats = this.buildCategoryStats();
    const dayS    = catStats.day    as Record<string, { count: number; area: number }>;
    const periodS = catStats.period as Record<string, { count: number; area: number }>;
    const catLabelsExcel: Record<string, string> = {
      LE: 'LARGE EXCESS', E: 'EXCESS', N: 'NORMAL',
      D: 'DEFICIENT', LD: 'LARGE DEFICIENT', NR: 'NO RAIN',
    };
    const catDayStart    = this.convertToIndianDateFormat(this.data.startDate);
    const catDayEnd      = this.convertToIndianDateFormat(this.data.endDate);
    const catPeriodStart = this.convertToIndianDateFormat(this.seasonPeriodDate.startDate);
    const catPeriodEnd   = this.convertToIndianDateFormat(this.seasonPeriodDate.endDate);

    const catThinBorder = {
      top:    { style: 'thin', color: { rgb: '873300' } },
      bottom: { style: 'thin', color: { rgb: '873300' } },
      left:   { style: 'thin', color: { rgb: '873300' } },
      right:  { style: 'thin', color: { rgb: '873300' } },
    };
    const catHdrStyle = () => ({
      font: { bold: true, sz: 9, color: { rgb: '993300' } },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      border: catThinBorder,
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    });
    const catDataCell = (v: any) => ({
      v: String(v), t: 's',
      s: { border: catThinBorder, alignment: { horizontal: 'center' as const, vertical: 'middle' as const }, font: { bold: true, sz: 9, color: { rgb: '993300' } } },
    });
    const blankCell = { v: '', t: 's', s: {} };
    const blankRow = Array(10).fill(blankCell);

    const mkCatB = (l = true, r = true, t = true, b = true): any => ({
      top:    t ? { style: 'thin', color: { rgb: '873300' } } : undefined,
      bottom: b ? { style: 'thin', color: { rgb: '873300' } } : undefined,
      left:   l ? { style: 'thin', color: { rgb: '873300' } } : undefined,
      right:  r ? { style: 'thin', color: { rgb: '873300' } } : undefined,
    });
    const catDateCell = (v: string, border: any = catThinBorder) => ({
      v, t: 's',
      s: { border, font: { bold: true, sz: 9, color: { rgb: '993300' } }, fill: { fgColor: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } },
    });

    const categoryExcelRows: any[][] = [
      blankRow,
      [
        { v: 'CATEGORYWISE NO. OF SUBDIVISIONS & % AREA (SUBDIVISIONAL) OF THE COUNTRY', t: 's',
          s: { font: { bold: true, sz: 10, color: { rgb: '993300' }, underline: true }, alignment: { horizontal: 'left' as const, vertical: 'middle' as const } } },
        ...Array(9).fill(blankCell),
      ],
      blankRow,
      // cm+3: CATEGORY (A:B, vertical merge cm+3–cm+5) | date cells C–J (outer border only per group)
      [{ v: 'CATEGORY', t: 's', s: { ...catHdrStyle(), alignment: { horizontal: 'left' as const, vertical: 'middle' as const, wrapText: true } } },
       blankCell,
       catDateCell('DAY :',        mkCatB(true,  false, true, true)),
       catDateCell(catDayStart,    mkCatB(false, false, true, true)),
       catDateCell('TO',           mkCatB(false, false, true, true)),
       catDateCell(catDayEnd,      mkCatB(false, true,  true, true)),
       catDateCell('PERIOD :',     mkCatB(true,  false, true, true)),
       catDateCell(catPeriodStart, mkCatB(false, false, true, true)),
       catDateCell('TO',           mkCatB(false, false, true, true)),
       catDateCell(catPeriodEnd,   mkCatB(false, true,  true, true))],
      // cm+4: NO. OF SUBDIVISIONS C:D (merged cm+4–cm+5) | %AREA E:F (merged cm+4–cm+5) | same for G:H and I:J
      [blankCell, blankCell,
       { v: 'NO. OF SUBDIVISIONS', t: 's', s: catHdrStyle() },
       blankCell,
       { v: 'SUBDIVISIONAL\n% AREA OF COUNTRY', t: 's', s: catHdrStyle() },
       blankCell,
       { v: 'NO. OF SUBDIVISIONS', t: 's', s: catHdrStyle() },
       blankCell,
       { v: 'SUBDIVISIONAL\n% AREA OF COUNTRY', t: 's', s: catHdrStyle() },
       blankCell],
      // cm+5: blank row (covered by merges)
      Array(10).fill(blankCell),
      ...['LE', 'E', 'N', 'D', 'LD', 'NR'].map(cat => [
        { v: catLabelsExcel[cat], t: 's', s: { border: catThinBorder, font: { bold: true, sz: 9, color: { rgb: '993300' } }, alignment: { horizontal: 'left' as const, vertical: 'middle' as const } } },
        blankCell,
        catDataCell(String(dayS[cat].count)),
        blankCell,
        catDataCell(`${dayS[cat].area}%`),
        blankCell,
        catDataCell(String(periodS[cat].count)),
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
          'SUBDIVISION-WISE RAINFALL (MM) DISTRIBUTION',
          regionRowIndices,
          countryRowIndex
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
  private subdivDisplayOrder: any[] = [];

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

    // Adjust largest category so total sums to exactly 100
    const dayTotal = cats.reduce((s, k) => s + day[k].area, 0);
    if (dayTotal !== 0 && dayTotal !== 100) {
      const largest = cats.reduce((a, b) => day[a].area >= day[b].area ? a : b);
      day[largest].area += 100 - dayTotal;
    }

    const periodTotal = cats.reduce((s, k) => s + period[k].area, 0);
    if (periodTotal !== 0 && periodTotal !== 100) {
      const largest = cats.reduce((a, b) => period[a].area >= period[b].area ? a : b);
      period[largest].area += 100 - periodTotal;
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

    const regionMinOrder = new Map<number, number>();
    const subdivOrderMap = new Map<number, number>();
    for (const item of this.subdivDisplayOrder) {
      subdivOrderMap.set(Number(item.subdiv_code), Number(item.display_order));
      const existing = regionMinOrder.get(Number(item.region_code));
      if (existing === undefined || Number(item.display_order) < existing) {
        regionMinOrder.set(Number(item.region_code), Number(item.display_order));
      }
    }
    const sortedRegions = Object.keys(groupedByRegion).sort((a, b) => {
      return (regionMinOrder.get(Number(a)) ?? 9999) - (regionMinOrder.get(Number(b)) ?? 9999);
    });
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
      const sortedsubdivs = Object.keys(subdivs).sort((a, b) => {
        return (subdivOrderMap.get(Number(a)) ?? 9999) - (subdivOrderMap.get(Number(b)) ?? 9999);
      });

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







