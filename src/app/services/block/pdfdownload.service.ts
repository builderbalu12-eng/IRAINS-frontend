import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, concatMap, lastValueFrom } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Constants } from '../constants';
import autoTable from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class DownloadPdf {
  private baseUrl: string = environment.baseUrl;
  isView: boolean = false;

  blockDataCurrdate: any[] = [];
  blockDataSeasondate: any[] = [];
  rows: any[][] = [];
  data: any;
  seasonPeriodDate: any;

  constructor(private http: HttpClient, private constants: Constants) {}

  convertToIndianDateFormat = (dateString: string) => dateString.split('-').reverse().join('-');

  async updateanddownloadpdf() {
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(this.data, this.seasonPeriodDate);
  }

  async updateanddownloadpdfFromDataEntry() {
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate);
  }

  async updateandViewpdf() {
    this.isView = true;
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(this.data, this.seasonPeriodDate);
  }

  async updateandViewpdfFromDataEntry() {
    this.isView = true;
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate);
  }

  async updateanddownloadpdfCustom(fromDate: any, toDate: any, filters: any = {}) {
    const currDate = new Date();
    this.data = {
      startDate: fromDate,
      endDate: toDate,
      filters
    };
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(this.data, this.seasonPeriodDate);
  }

  async updateanddownloadpdfFromDataEntryCustom(fromDate: any, toDate: any, filters: any = {}) {
    const currDate = new Date();
    this.data = {
      startDate: fromDate,
      endDate: toDate,
      filters
    };
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate);
  }

  async updateandViewpdfCustom(fromDate: any, toDate: any, filters: any = {}) {
    this.isView = true;
    const currDate = new Date();
    this.data = {
      startDate: fromDate,
      endDate: toDate,
      filters
    };
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(this.data, this.seasonPeriodDate);
  }

  async updateandViewpdfFromDataEntryCustom(fromDate: any, toDate: any, filters: any = {}) {
    this.isView = true;
    const currDate = new Date();
    this.data = {
      startDate: fromDate,
      endDate: toDate,
      filters
    };
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate);
  }

  async updateCurrDateData(data: any, seasonPeriodDate: any) {
    try {
      await lastValueFrom(
        this.fetchBlockData(data).pipe(
          concatMap(blockData => {
            this.blockDataCurrdate = blockData.data;
            console.log('blockDataCurrdate---->', this.blockDataCurrdate);
            return this.fetchBlockData({ startDate: seasonPeriodDate.startDate, endDate: seasonPeriodDate.endDate });
          }),
          concatMap(seasonBlockData => {
            this.blockDataSeasondate = seasonBlockData.data;
            console.log('blockDataSeasondate---->', this.blockDataSeasondate);
            this.downloadPdf();
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error('Error fetching block data:', error);
    }
  }

  async updateCurrDateDataFromDataEntry(data: any, seasonPeriodDate: any) {
    try {
      await lastValueFrom(
        this.fetchBlockDataFromDataEntry(data).pipe(
          concatMap(blockData => {
            this.blockDataCurrdate = blockData.data;
            console.log('blockDataCurrdate---->', this.blockDataCurrdate);
            return this.fetchBlockDataFromDataEntry({ startDate: seasonPeriodDate.startDate, endDate: seasonPeriodDate.endDate });
          }),
          concatMap(seasonBlockData => {
            this.blockDataSeasondate = seasonBlockData.data;
            console.log('blockDataSeasondate---->', this.blockDataSeasondate);
            this.downloadPdf();
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error('Error fetching block data:', error);
    }
  }

  fetchBlockData(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchBlockData`;
    // Send only startDate and endDate, as API does not support filters
    const payload = {
      startDate: data.startDate,
      endDate: data.endDate
    };
    return this.http.post<any>(url, payload);
  }

  fetchBlockDataFromDataEntry(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchBlockData`;
    // Send only startDate and endDate, as API does not support filters
    const payload = {
      startDate: data.startDate,
      endDate: data.endDate
    };
    return this.http.post<any>(url, payload);
  }

  exportAsExcelFile(json: any[], excelFileName: string, columns: any, columns1: any): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);
    const startCell = 'C1';
    const endCell = 'F1';
    const startCell1 = 'G1';
    const endCell1 = 'J1';

    worksheet['!merges'] = [
      { s: XLSX.utils.decode_cell(startCell), e: XLSX.utils.decode_cell(endCell) },
      { s: XLSX.utils.decode_cell(startCell1), e: XLSX.utils.decode_cell(endCell1) }
    ];

    XLSX.utils.sheet_add_aoa(worksheet, [columns1], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: 'A2' });
    XLSX.utils.sheet_add_json(worksheet, json, { origin: 'A3', skipHeader: true });

    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }

  public async downloadPdf() {
    const seasonRange = this.adjustSeasonForRange(this.data.startDate, this.data.endDate);
    this.seasonPeriodDate.startDate = seasonRange.startDate;
    this.seasonPeriodDate.endDate = seasonRange.endDate;

    const columns1 = ['', '',
      {
        content: this.data.startDate === this.data.endDate ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}` : `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`,
        colSpan: 4
      },
      {
        content: `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`,
        colSpan: 4
      }
    ];

    const columns1forexcel = ['', '',
      this.data.startDate === this.data.endDate ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}` : `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`,
      '', '', '',
      `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`
    ];

    const columns = ['S.No', 'STATE/DISTRICT/BLOCK', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.'];

    this.loadTheRows();

    const newArr = this.rows.map((subArr) => {
      return subArr.map((item: any) => {
        return typeof item === 'object' && item.hasOwnProperty('content') ? item.content : item;
      });
    });

    const newcolumns1 = columns1forexcel;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const marginLeft = 10;
    const marginTop = 10;
    const cellHeight = 8;
    const pageWidth = doc.internal.pageSize.getWidth();
    const imgWidth = 15;
    const imgMargin = 10;
    const imgX = pageWidth - imgWidth - imgMargin;
    const imgData150 = '/assets/images/IMD150(BGR).png';
    doc.addImage(imgData150, 'PNG', imgX, marginTop, 15, 20);
    const imgData = '/assets/images/IMDlogo_Ipart-iris.png';
    doc.addImage(imgData, 'PNG', marginLeft, marginTop, 15, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const headingText = 'India Meteorological Department\nHydromet Division, New Delhi';
    const headingText1 = 'BLOCK RAINFALL DISTRIBUTION';
    doc.text(headingText, marginLeft + 25, marginTop + 8);
    doc.text(headingText1, marginLeft + 100, marginTop + 28);
    autoTable(doc, {
      head: [columns1, columns],
      body: this.rows,
      theme: 'striped',
      startY: marginTop + cellHeight + 25,
      margin: { left: marginLeft },
      styles: { fontSize: 7 },
      headStyles: { halign: 'center' },
      didDrawCell: function (data: { cell: { text: any; x: number; y: number; width: any; height: any; }; }) {
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        doc.setDrawColor(0);
      },
      didParseCell: function (data: any) {
        data.cell.styles.fontStyle = 'bold';
      }
    });

    const columns2 = ['', 'LEGEND', ''];
    const columns3 = ['CATEGORY', '% DEPARTURES OF RAINFALL', 'COLOUR CODE'];
    const rows2 = [
      ['Large Excess\n(LE or L.Excess)', '>= 60%', { content: '', styles: { fillColor: '#0096ff' } }],
      ['Excess (E)', '>= 20% and <= 59%', { content: '', styles: { fillColor: '#32c0f8' } }],
      ['Normal (N)', '>= -19% and <= +19%', { content: '', styles: { fillColor: '#00cd5b' } }],
      ['Deficient (D)', '>= -59% and <= -20%', { content: '', styles: { fillColor: '#ff2700' } }],
      ['Large Deficient\n(LD or L.Deficient)', '>= -99% and <= -60%', { content: '', styles: { fillColor: '#ffff20' } }],
      ['No Rain(NR)', '= -100%', { content: '', styles: { fillColor: '#ffffff' } }],
      ['Not Available', 'ND', { content: '', styles: { fillColor: '#c0c0c0' } }],
      ['Note : ', { content: 'The rainfall values are rounded off up to one place of decimal.', colSpan: 2 }]
    ];

    doc.addPage();
    autoTable(doc, {
      head: [columns2, columns3],
      body: rows2,
      theme: 'striped',
      didDrawCell: function (data: { cell: { text: any; x: number; y: number; width: any; height: any; }; }) {
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        doc.setDrawColor(0);
      },
    });

    const filename = `DISTRIBUTION_BLOCK_INDIA_cd.pdf`;

    if (this.isView) {
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
    } else {
      setTimeout(() => {
        doc.save(filename);
        this.exportAsExcelFile(newArr, `BLOCK_RAINFALL_DISTRIBUTION_COUNTRY_INDIA_cd`, columns, newcolumns1);
      }, 3000);
    }
  }

  getAdjustedEndDate(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start.getMonth() !== end.getMonth()) {
      const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const lastDayOfMonthStr = this.formatDate(lastDayOfMonth);
      return this.convertToIndianDateFormat(lastDayOfMonthStr);
    }
    return this.convertToIndianDateFormat(endDate);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getSeason(startDate: any): string {
    if (!(startDate instanceof Date)) {
      startDate = new Date(startDate);
    }
    if (isNaN(startDate.getTime())) {
      throw new Error("Invalid date format provided to getSeason");
    }
    const month = startDate.getMonth();
    if (month >= 0 && month <= 1) return 'Jan-Feb';
    else if (month >= 2 && month <= 4) return 'Mar-May';
    else if (month >= 5 && month <= 8) return 'Jun-Sep';
    else if (month >= 9 && month <= 11) return 'Oct-Dec';
    return '';
  }

  parseDate(date: any): Date {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date;
    }
    if (typeof date === 'string') {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (datePattern.test(date)) {
        return new Date(date);
      }
    }
    throw new Error("Invalid date format");
  }

  adjustSeasonForRange(startDate: any, endDate: any): { season: string, startDate: string, endDate: string } {
    startDate = this.parseDate(startDate);
    endDate = this.parseDate(endDate);
    const season = this.getSeason(startDate);
    let seasonStartDate: Date;
    let seasonEndDate: Date;

    switch (season) {
      case 'Jan-Feb':
        seasonStartDate = new Date(startDate.getFullYear(), 0, 1);
        seasonEndDate = new Date(startDate.getFullYear(), 1, 28);
        break;
      case 'Mar-May':
        seasonStartDate = new Date(startDate.getFullYear(), 2, 1);
        seasonEndDate = new Date(startDate.getFullYear(), 4, 31);
        break;
      case 'Jun-Sep':
        seasonStartDate = new Date(startDate.getFullYear(), 5, 1);
        seasonEndDate = new Date(startDate.getFullYear(), 8, 30);
        break;
      case 'Oct-Dec':
        seasonStartDate = new Date(startDate.getFullYear(), 9, 1);
        seasonEndDate = new Date(startDate.getFullYear(), 11, 31);
        break;
      default:
        seasonStartDate = startDate;
        seasonEndDate = endDate;
    }

    return {
      season,
      startDate: this.formatDate(seasonStartDate),
      endDate: this.formatDate(seasonEndDate),
    };
  }

  private loadTheRows() {
    this.rows = [];
  
    // Apply filters if provided
    const filters = this.data.filters || {};
    const filteredCurrDate = this.blockDataCurrdate.filter(item => {
      return (
        (!filters.region_code || filters.region_code.length === 0 || filters.region_code.includes(item.region_code.toString())) &&
        (!filters.centre || filters.centre.length === 0 || filters.centre.includes(`${item.centre_type} ${item.centre_name}`)) &&
        (!filters.state_code || filters.state_code.length === 0 || filters.state_code.includes(item.state_code.toString())) &&
        (!filters.district_code || filters.district_code.length === 0 || filters.district_code.includes(item.district_code.toString())) &&
        (!filters.block_code || filters.block_code.length === 0 || filters.block_code.includes(item.block_code.toString()))
      );
    });
  
    const filteredSeasonDate = this.blockDataSeasondate.filter(item => {
      return (
        (!filters.region_code || filters.region_code.length === 0 || filters.region_code.includes(item.region_code.toString())) &&
        (!filters.centre || filters.centre.length === 0 || filters.centre.includes(`${item.centre_type} ${item.centre_name}`)) &&
        (!filters.state_code || filters.state_code.length === 0 || filters.state_code.includes(item.state_code.toString())) &&
        (!filters.district_code || filters.district_code.length === 0 || filters.district_code.includes(item.district_code.toString())) &&
        (!filters.block_code || filters.block_code.length === 0 || filters.block_code.includes(item.block_code.toString()))
      );
    });
  
    const groupedByState = filteredCurrDate.reduce((acc, item) => {
      const stateCode = item.state_code.toString();
      const districtCode = item.district_code.toString();
      if (!acc[stateCode]) {
        acc[stateCode] = {};
      }
      if (!acc[stateCode][districtCode]) {
        acc[stateCode][districtCode] = [];
      }
      acc[stateCode][districtCode].push(item);
      return acc;
    }, {});
  
    const sortedStates = Object.keys(groupedByState).sort((a, b) => {
      const stateA = filteredCurrDate.find(item => item.state_code.toString() === a)?.state_name || '';
      const stateB = filteredCurrDate.find(item => item.state_code.toString() === b)?.state_name || '';
      return stateA.localeCompare(stateB);
    });
  
    let stateColorCode = [238, 130, 238];
    let districtColorCode = [72, 209, 204];
  
    for (const stateCode of sortedStates) {
      const stateData = filteredCurrDate.find(item => item.state_code.toString() === stateCode);
      if (!stateData) continue;
      this.rows.push([
        { content: '', styles: { fillColor: stateColorCode } },
        { content: `STATE: ${stateData.state_name}`, styles: { fillColor: stateColorCode } },
        { content: '', styles: { fillColor: stateColorCode } },
        { content: '', styles: { fillColor: stateColorCode } },
        { content: '', styles: { fillColor: stateColorCode } },
        { content: '', styles: { fillColor: stateColorCode } },
        { content: '', styles: { fillColor: stateColorCode } },
        { content: '', styles: { fillColor: stateColorCode } },
        { content: '', styles: { fillColor: stateColorCode } },
        { content: '', styles: { fillColor: stateColorCode } }
      ]);
  
      const districts = groupedByState[stateCode];
      const sortedDistricts = Object.keys(districts).sort((a, b) => {
        const districtA = filteredCurrDate.find(item => item.district_code.toString() === a)?.district_name || '';
        const districtB = filteredCurrDate.find(item => item.district_code.toString() === b)?.district_name || '';
        return districtA.localeCompare(districtB);
      });
  
      for (const districtCode of sortedDistricts) {
        const districtData = filteredCurrDate.find(item => item.district_code.toString() === districtCode);
        if (!districtData) continue;
        this.rows.push([
          { content: '', styles: { fillColor: districtColorCode } },
          { content: `DISTRICT: ${districtData.district_name}`, styles: { fillColor: districtColorCode } },
          { content: '', styles: { fillColor: districtColorCode } },
          { content: '', styles: { fillColor: districtColorCode } },
          { content: '', styles: { fillColor: districtColorCode } },
          { content: '', styles: { fillColor: districtColorCode } },
          { content: '', styles: { fillColor: districtColorCode } },
          { content: '', styles: { fillColor: districtColorCode } },
          { content: '', styles: { fillColor: districtColorCode } },
          { content: '', styles: { fillColor: districtColorCode } }
        ]);
  
        const blocksCurrDate = districts[districtCode];
        const sortedBlocksCurrDate = blocksCurrDate.sort((a: any, b: any) => a.block_name.localeCompare(b.block_name));
  
        for (let i = 0; i < sortedBlocksCurrDate.length; i++) {
          const blockDate = sortedBlocksCurrDate[i];
          const blockSeason = filteredSeasonDate.find(block => block.block_code === blockDate.block_code);
          const dateCat = this.constants.getColorAndCat(blockDate.departure);
          const seasonCat = this.constants.getColorAndCat(blockSeason?.departure || null);
  
          this.rows.push([
            i + 1,
            blockDate.block_name,
            blockDate.actual_rainfall != null ? this.constants.trimToOneDecimals(blockDate.actual_rainfall) : '',
            blockDate.normal_rainfall != null ? this.constants.trimToOneDecimals(blockDate.normal_rainfall) : '',
            blockDate.departure != null ? this.constants.trimToOneDecimals(blockDate.departure) : '',
            { content: dateCat.Cat, styles: { fillColor: dateCat.color } },
            blockSeason?.actual_rainfall != null ? this.constants.trimToOneDecimals(blockSeason.actual_rainfall) : '',
            blockSeason?.normal_rainfall != null ? this.constants.trimToOneDecimals(blockSeason.normal_rainfall) : '',
            blockSeason?.departure != null ? this.constants.trimToOneDecimals(blockSeason.departure) : '',
            { content: seasonCat.Cat, styles: { fillColor: seasonCat.color } }
          ]);
        }
      }
    }
  }
}