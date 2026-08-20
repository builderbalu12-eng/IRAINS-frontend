import { Injectable } from '@angular/core';
import { EMPTY, Observable, concatMap, lastValueFrom } from 'rxjs';
import { Constants } from '../constants';
import autoTable from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';
import { CalculationsModeService } from 'src/app/services/calculationsMode.service';
import { BlockService } from './BlockService.service';

@Injectable({
  providedIn: 'root'
})
export class DownloadPdf {
  isView: boolean = false;

  blockDataCurrdate: any[] = [];
  blockDataSeasondate: any[] = [];
  rows: any[][] = [];
  data: any;
  seasonPeriodDate: any;

  constructor(
    private constants: Constants,
    private calcMode: CalculationsModeService,
    private blockService: BlockService
  ) {}

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
    // Send only startDate and endDate, as API does not support filters
    const payload = {
      startDate: data.startDate,
      endDate: data.endDate
    };
    return this.calcMode.isAwsEnabled
      ? this.blockService.fetchDataWithAWS(payload)
      : this.blockService.fetchData(payload);
  }

  fetchBlockDataFromDataEntry(data: any): Observable<any> {
    // Send only startDate and endDate, as API does not support filters
    const payload = {
      startDate: data.startDate,
      endDate: data.endDate
    };
    return this.calcMode.isAwsEnabled
      ? this.blockService.fetchDataWithAWS(payload)
      : this.blockService.fetchData(payload);
  }

  exportAsExcelFile(
    dataRows: any[][],
    excelFileName: string,
    dayStart: string,
    dayEnd: string,
    periodStart: string,
    periodEnd: string
  ): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);
    const blank = () => ({ v: '', t: 's', s: {} });
    const mkBorder = (left = true, right = true, top = true, bottom = true) => ({
      top:    top    ? { style: 'thin', color: { rgb: '000000' } } : undefined,
      bottom: bottom ? { style: 'thin', color: { rgb: '000000' } } : undefined,
      left:   left   ? { style: 'thin', color: { rgb: '000000' } } : undefined,
      right:  right  ? { style: 'thin', color: { rgb: '000000' } } : undefined,
    });
    const styledCell = (v: string, align: 'center' | 'left' = 'center', border = mkBorder()) => ({
      v, t: 's', s: {
        font: { bold: true, sz: 10, color: { rgb: '993300' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        border,
        alignment: { horizontal: align, vertical: 'middle' as const, wrapText: true },
      }
    });

    // Row 1: Title — dark brown, underlined, merged A1:J1
    const row1 = [
      { v: 'BLOCKWISE RAINFALL DISTRIBUTION', t: 's', s: { font: { bold: true, sz: 13, color: { rgb: '993300' }, underline: true }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } },
      ...Array.from({ length: 9 }, () => blank()),
    ];

    // Row 2: blank spacer
    const row2 = Array.from({ length: 10 }, () => blank());

    // Row 3: outer border only on DAY/PERIOD groups (no inner vertical lines)
    const row3 = [
      styledCell('S.No.'),
      styledCell('STATE/DISTRICT/BLOCK', 'left'),
      styledCell('DAY :',      'center', mkBorder(true,  false, true, true)),
      styledCell(dayStart,     'center', mkBorder(false, false, true, true)),
      styledCell('TO',         'center', mkBorder(false, false, true, true)),
      styledCell(dayEnd,       'center', mkBorder(false, true,  true, true)),
      styledCell('PERIOD :',   'center', mkBorder(true,  false, true, true)),
      styledCell(periodStart,  'center', mkBorder(false, false, true, true)),
      styledCell('TO',         'center', mkBorder(false, false, true, true)),
      styledCell(periodEnd,    'center', mkBorder(false, true,  true, true)),
    ];

    // Row 4: full border on every cell
    const row4 = [
      blank(),
      styledCell('STATE/DISTRICT/BLOCK (NAME)', 'left'),
      styledCell('ACTUAL'),  styledCell('NORMAL'),  styledCell('% DEP.'),  styledCell('CAT.'),
      styledCell('ACTUAL'),  styledCell('NORMAL'),  styledCell('% DEP.'),  styledCell('CAT.'),
    ];

    // Row 5: full border on every cell
    const row5 = [
      blank(), blank(),
      styledCell('(mm)'), styledCell('(mm)'), styledCell(''), styledCell(''),
      styledCell('(mm)'), styledCell('(mm)'), styledCell(''), styledCell(''),
    ];

    XLSX.utils.sheet_add_aoa(ws, [row1], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(ws, [row2], { origin: 'A2' });
    XLSX.utils.sheet_add_aoa(ws, [row3], { origin: 'A3' });
    XLSX.utils.sheet_add_aoa(ws, [row4], { origin: 'A4' });
    XLSX.utils.sheet_add_aoa(ws, [row5], { origin: 'A5' });
    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A6' });

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },   // Title A1:J1
      { s: { r: 2, c: 0 }, e: { r: 4, c: 0 } },   // S.No A3:A5
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },   // STATE/DISTRICT/BLOCK NAME B4:B5
    ];
    ws['!cols'] = [
      { wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
    ];
    ws['!rows'] = [{ hpt: 25 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, { hpt: 15 }];

    const workbook: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ['data'] };
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

    const columns = ['S.No', 'STATE/DISTRICT/BLOCK', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.'];

    this.loadTheRows();

    if (this.isView) {
      // On-page table view: data is already populated on this.rows /
      // this.data / this.seasonPeriodDate for the component to read —
      // skip PDF/Excel generation entirely. Without this, the later
      // `if (this.isView) { window.open(pdfUrl) }` branch at the end of
      // this method still fires and pops the generated PDF into a new
      // tab on every view-mode call (e.g. the block actual map page's
      // right-panel stats refresh).
      this.isView = false;
      return;
    }

    const thinBlack = {
      top:    { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left:   { style: 'thin', color: { rgb: '000000' } },
      right:  { style: 'thin', color: { rgb: '000000' } },
    };

    const newArr: any[][] = this.rows.map((subArr) => {
      const firstFill = (subArr[0] as any)?.styles?.fillColor;
      const isState    = Array.isArray(firstFill) && firstFill[0] === 238;  // [238,130,238]
      const isDistrict = Array.isArray(firstFill) && firstFill[0] === 72;   // [72,209,204]
      return subArr.map((item: any, colIdx: number) => {
        let content = typeof item === 'object' && item.hasOwnProperty('content') ? item.content : item;
        if ((colIdx === 4 || colIdx === 8) && content !== '' && content !== ' ' && content != null) {
          content = `${content}%`;
        }
        const cellFill  = item?.styles?.fillColor;
        const isHexFill = typeof cellFill === 'string' && cellFill.startsWith('#');
        const hAlign    = colIdx === 1 ? 'left' as const : 'center' as const;
        const fillHex = isHexFill ? cellFill.replace('#', '').toUpperCase() : 'FFFFFF';
        let cellStyle;
        if (isState) {
          cellStyle = { fill: { fgColor: { rgb: 'FFFFFF' } }, border: thinBlack, font: { bold: true, sz: 9, color: { rgb: 'FF00FF' } }, alignment: { horizontal: hAlign, vertical: 'middle' as const } };
        } else if (isDistrict) {
          cellStyle = { fill: { fgColor: { rgb: 'FFFFFF' } }, border: thinBlack, font: { bold: true, sz: 9, color: { rgb: '0000FF' } }, alignment: { horizontal: hAlign, vertical: 'middle' as const } };
        } else {
          cellStyle = { fill: { fgColor: { rgb: fillHex } }, border: thinBlack, font: { bold: false, sz: 9, color: { rgb: '000000' } }, alignment: { horizontal: hAlign, vertical: 'middle' as const } };
        }
        // Blocks print departure to one decimal, so keep that in the sheet too.
        const isDep = colIdx === 4 || colIdx === 8;
        const numeric = this.constants.excelNumericCell(item, 1, isDep ? '%' : '');
        if (numeric) return { ...numeric, s: cellStyle };
        return { v: String(content ?? ''), t: 's', s: cellStyle };
      });
    });

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

    const suffix = this.constants.getDateSuffix(this.data.startDate, this.data.endDate);
    const filename = `DISTRIBUTION_BLOCK_INDIA_${suffix}.pdf`;

    const isSingleDate = this.data.startDate === this.data.endDate;
    let excelName: string;
    if (isSingleDate) {
      const [y, m, d] = this.data.startDate.split('-');
      excelName = `BLOCKWISE_${d}${m}${y}`;
    } else {
      const s = new Date(this.data.startDate);
      const e = new Date(this.data.endDate);
      const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const MON    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const d1 = String(s.getDate()).padStart(2, '0');
      const d2 = String(e.getDate()).padStart(2, '0');
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        excelName = `BLOCKWISE (${d1}-${d2}) ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
      } else if (s.getFullYear() === e.getFullYear()) {
        excelName = `BLOCKWISE (${d1}${MON[s.getMonth()]}-${d2}${MON[e.getMonth()]}) ${s.getFullYear()}`;
      } else {
        excelName = `BLOCKWISE (${d1}${MON[s.getMonth()]}${s.getFullYear()}-${d2}${MON[e.getMonth()]}${e.getFullYear()})`;
      }
    }

    if (this.isView) {
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
    } else {
      const dayStart    = this.convertToIndianDateFormat(this.data.startDate);
      const dayEnd      = this.convertToIndianDateFormat(this.data.endDate);
      const periodStart = this.convertToIndianDateFormat(this.seasonPeriodDate.startDate);
      const periodEnd   = this.convertToIndianDateFormat(this.seasonPeriodDate.endDate);
      setTimeout(() => {
        doc.save(filename);
        this.exportAsExcelFile(newArr, excelName, dayStart, dayEnd, periodStart, periodEnd);
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

    // Cumulative season-to-date: PERIOD should run from the season's start
    // up to the selected date, not all the way to the season's calendar end.
    if (seasonEndDate > endDate) {
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
            { content: blockDate.actual_rainfall != null ? this.constants.trimToOneDecimals(blockDate.actual_rainfall) : '', xlRaw: blockDate.actual_rainfall },
            { content: blockDate.normal_rainfall != null ? this.constants.trimToOneDecimals(blockDate.normal_rainfall) : '', xlRaw: blockDate.normal_rainfall },
            { content: blockDate.departure != null ? this.constants.trimToOneDecimals(blockDate.departure) : '', xlRaw: blockDate.departure },
            { content: dateCat.Cat, styles: { fillColor: dateCat.color } },
            { content: blockSeason?.actual_rainfall != null ? this.constants.trimToOneDecimals(blockSeason.actual_rainfall) : '', xlRaw: blockSeason?.actual_rainfall },
            { content: blockSeason?.normal_rainfall != null ? this.constants.trimToOneDecimals(blockSeason.normal_rainfall) : '', xlRaw: blockSeason?.normal_rainfall },
            { content: blockSeason?.departure != null ? this.constants.trimToOneDecimals(blockSeason.departure) : '', xlRaw: blockSeason?.departure },
            { content: seasonCat.Cat, styles: { fillColor: seasonCat.color } }
          ]);
        }
      }
    }
  }
}