import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, concatMap, lastValueFrom } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Constants } from '../constants';
import autoTable, { Column } from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';


@Injectable({
  providedIn: 'root'
})

export class DownloadPdf {

  private baseUrl: string = environment.baseUrl;
  isView : boolean = false

  districtDisplayOrder: any[] = [];

  districtdepCurrdate: any[] = [];
  statedepCurrdate: any[] = [];
  subdivdepCurrdate: any[] = [];

  districtdepSeasondate: any[] = [];
  statedepSeasondate: any[] = [];
  subdivdepSeasondate: any[] = [];

  rows :any[][] = [];
  data: any;
  seasonPeriodDate: any;

  constructor(private http: HttpClient, private constants: Constants) {
  }

  convertToIndianDateFormat = (dateString: string) => dateString.split('-').reverse().join('-');

  async updateanddownloadpdf(){
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(this.data, this.seasonPeriodDate)
  }

  async updateanddownloadpdfFromDataEntry(){
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate)
  }

  async updateandViewpdf(){
    this.isView = true
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(this.data, this.seasonPeriodDate)
  }
  
  async updateandViewpdfFromDataEntry(){
    this.isView = true
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate)
  }








  async updateanddownloadpdfCustom(fromDate : any, toDate : any){
    console.log('custom date download', fromDate, toDate)
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(this.data, this.seasonPeriodDate)
  }



  

  async updateanddownloadpdfFromDataEntryCustom(fromDate : any, toDate : any){
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate)
  }

  async updateandViewpdfCustom(fromDate : any, toDate : any){
    this.isView = true
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(this.data, this.seasonPeriodDate)
  }

  async updateandViewpdfFromDataEntryCustom(fromDate : any, toDate : any){
    this.isView = true
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate)
  }









  
  
  async updateCurrDateData(data: any, seasonPeriodDate: any) {
    try {
      await lastValueFrom(
        this.fetchDistrictDisplayOrder().pipe(
          concatMap(displayOrder => {
            this.districtDisplayOrder = Array.isArray(displayOrder) ? displayOrder : (displayOrder.data ?? []);
            return this.fetchDistrictData(data);
          }),
          concatMap(districtData => {
            this.districtdepCurrdate = districtData.data;
            console.log('indownloading---->', this.districtdepCurrdate);
            return this.fetchStateData(data);
          }),
          concatMap(stateData => {
            this.statedepCurrdate = stateData.data;
            console.log('indownloading---->', this.statedepCurrdate);
            return this.fetchSubdivData(data);
          }),
          concatMap(subdiv => {
            this.subdivdepCurrdate = subdiv.data;
            console.log('indownloading---->', this.subdivdepCurrdate);
            return this.fetchDistrictData(seasonPeriodDate); // or any observable to complete the chain
          }),
          concatMap(seasondistrictData => {
            this.districtdepSeasondate = seasondistrictData.data;
            console.log('indownloading---->', this.districtdepSeasondate);
            return this.fetchStateData(seasonPeriodDate);
          }),    
          concatMap(seasonstateData => {
            this.statedepSeasondate = seasonstateData.data;
            console.log('indownloading---->', this.statedepSeasondate, this.subdivdepSeasondate);
            return this.fetchSubdivData(seasonPeriodDate);
          }),    
          concatMap(seasonstateData => {
            this.subdivdepSeasondate = seasonstateData.data;
            console.log('indownloading---->', this.subdivdepSeasondate);
            this.downloadPdf();
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }


  async updateCurrDateDataFromDataEntry(data: any, seasonPeriodDate: any) {

    console.log('updateCurrDateDataFromDataEntry DATA', data);
    try {
      await lastValueFrom(
        this.fetchDistrictDisplayOrder().pipe(
          concatMap(displayOrder => {
            this.districtDisplayOrder = Array.isArray(displayOrder) ? displayOrder : (displayOrder.data ?? []);
            return this.fetchDistrictDataFromDataEntry(data);
          }),
          concatMap(districtData => {
            this.districtdepCurrdate = districtData.data;
            console.log('indownloading---->', this.districtdepCurrdate);
            return this.fetchStateDataFromDataEntry(data);
          }),
          concatMap(stateData => {
            this.statedepCurrdate = stateData.data;
            console.log('indownloading---->', this.statedepCurrdate);
            return this.fetchSubdivDataFromDataEntry(data);
          }),
          concatMap(subdiv => {
            this.subdivdepCurrdate = subdiv.data;
            console.log('indownloading---->', this.subdivdepCurrdate);
            return this.fetchDistrictDataFromDataEntry(seasonPeriodDate); // or any observable to complete the chain
          }),
          concatMap(seasondistrictData => {
            this.districtdepSeasondate = seasondistrictData.data;
            console.log('indownloading---->', this.districtdepSeasondate);
            return this.fetchStateDataFromDataEntry(seasonPeriodDate);
          }),    
          concatMap(seasonstateData => {
            this.statedepSeasondate = seasonstateData.data;
            console.log('indownloading---->', this.statedepSeasondate, this.subdivdepSeasondate);
            return this.fetchSubdivDataFromDataEntry(seasonPeriodDate);
          }),    
          concatMap(seasonstateData => {
            this.subdivdepSeasondate = seasonstateData.data;
            console.log('indownloading---->', this.subdivdepSeasondate);
            this.downloadPdf();
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  fetchDistrictDataFromDataEntry(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchDistrictData`;
    return this.http.post<any>(url, data);
  }

  fetchStateDataFromDataEntry(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchStateData`;
    return this.http.post<any>(url, data);
  }

  fetchSubdivDataFromDataEntry(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchSubDivisionData`;
    return this.http.post<any>(url, data);
  }

  fetchDistrictData(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchDistrictDataFtp`;
    return this.http.post<any>(url, data);
  }

  fetchStateData(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchStateDataFtp`;
    return this.http.post<any>(url, data);
  }

  fetchSubdivData(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchSubDivisionDataFtp`;
    return this.http.post<any>(url, data);
  }

  fetchDistrictDisplayOrder(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/getDistrictDisplayOrder`);
  }

  getData(){
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
      { v: 'DISTRICTWISE RAINFALL DISTRIBUTION', t: 's', s: { font: { bold: true, sz: 13, color: { rgb: '993300' }, underline: true }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } },
      ...Array.from({ length: 9 }, () => blank()),
    ];

    // Row 2: blank spacer
    const row2 = Array.from({ length: 10 }, () => blank());

    // Row 3: outer border only on DAY/PERIOD groups (no inner vertical lines)
    const row3 = [
      styledCell('S.No.'),
      styledCell('MET.  SUBDIVISION/ UT', 'left'),
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
      styledCell('STATE/DISTRICT (NAME)', 'left'),
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
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },   // STATE/DISTRICT NAME B4:B5
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
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }




  
  public async downloadPdf(){

    console.log('ssssss', this.data.startDate, typeof this.data.startDate,  this.data.endDate, this.data.startDate==this.data.endDate);

    // Adjust season dates based on this.data.startDate to set the seasonal period
    const seasonRange = this.adjustSeasonForRange(this.data.startDate, this.data.endDate);
  
    // Set the season period start and end dates
     this.seasonPeriodDate.startDate = seasonRange.startDate;
     this.seasonPeriodDate.endDate = seasonRange.endDate;

     console.log(this.seasonPeriodDate)

    const columns1 = ['', '', 
      // {
      // content : this.data.startDate==this.data.endDate ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`:`DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`, colSpan:4
      // },

      {
        content: this.data.startDate === this.data.endDate ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`: `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`, 
         colSpan: 4
      },

      {
        content : `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} to ${(this.seasonPeriodDate.startDate, this.seasonPeriodDate.endDate)}`, colSpan:4
      },
      
    ]
    const columns1forexcel = ['', '',
    {
      content : this.data.startDate==this.data.endDate ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`:`DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`, colSpan:4
    }, '', '', '',    
    {
      content : `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} to ${(this.seasonPeriodDate.startDate, this.seasonPeriodDate.endDate)}`, colSpan:4
    }]

    const columns = ['S.No', 'MET.SUBDIVISION/UT/STATE/DISTRICT', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.'];

    this.loadTheRows();

    const thinBlack = {
      top:    { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left:   { style: 'thin', color: { rgb: '000000' } },
      right:  { style: 'thin', color: { rgb: '000000' } },
    };

    var newArr: any[][] = this.rows.map((subArr) => {
      const firstFill = (subArr[0] as any)?.styles?.fillColor;
      const isSubDiv  = Array.isArray(firstFill) && firstFill[0] === 72;   // [72,209,204]
      const isState   = Array.isArray(firstFill) && firstFill[0] === 238;  // [238,130,238]
      return subArr.map((item: any, colIdx: number) => {
        let content = typeof item === 'object' && item.hasOwnProperty('content') ? item.content : item;
        if ((colIdx === 4 || colIdx === 8) && content !== '' && content !== ' ' && content != null) {
          content = `${content}%`;
        }
        const cellFill  = item?.styles?.fillColor;
        const isHexFill = typeof cellFill === 'string' && cellFill.startsWith('#');
        const hAlign    = colIdx === 1 ? 'left' as const : 'center' as const;
        if (isSubDiv) {
          return { v: String(content ?? ''), t: 's', s: { fill: { fgColor: { rgb: 'FFFFFF' } }, border: thinBlack, font: { bold: true, sz: 9, color: { rgb: '0000FF' } }, alignment: { horizontal: hAlign, vertical: 'middle' as const } } };
        }
        if (isState) {
          return { v: String(content ?? ''), t: 's', s: { fill: { fgColor: { rgb: 'FFFFFF' } }, border: thinBlack, font: { bold: true, sz: 9, color: { rgb: 'FF00FF' } }, alignment: { horizontal: hAlign, vertical: 'middle' as const } } };
        }
        const fillHex = isHexFill ? cellFill.replace('#', '').toUpperCase() : 'FFFFFF';
        return { v: String(content ?? ''), t: 's', s: { fill: { fgColor: { rgb: fillHex } }, border: thinBlack, font: { bold: false, sz: 9, color: { rgb: '000000' } }, alignment: { horizontal: hAlign, vertical: 'middle' as const } } };
      });
    });


    let serialNumber = 1;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

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
    const imgData150 = '/assets/images/IMD150(BGR).png';
    doc.addImage(imgData150, 'PNG', imgX, marginTop, 15, 20);
    const imgData = '/assets/images/IMDlogo_Ipart-iris.png';
    doc.addImage(imgData, 'PNG', marginLeft, marginTop, 15, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Set font color to black
    const headingText = 'India Meteorological Department\nHydromet Division, New Delhi';
    const headingText1 = 'DISTRICT RAINFALL DISTRIBUTION';
    doc.text(headingText, marginLeft + 25, marginTop + 8); // Adjust position as needed
    doc.text(headingText1, marginLeft + 100, marginTop + 28);
    autoTable(doc, {
      head: [columns1, columns],
      body: this.rows,
      theme: 'striped',
      startY: marginTop + cellHeight + 25, // Adjust the vertical position below the image and heading
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
    const columns3 = ['CATEGORY', '% DEPARTURES OF RAINFALL', 'COLOUR CODE']; // Update with your second table column names
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
    autoTable(doc,{
      head: [columns2, columns3],
      body: rows2,
      theme: 'striped',
      didDrawCell: function (data: { cell: { text: any; x: number; y: number; width: any; height: any; }; }) {
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        doc.setDrawColor(0);
      },
    });
    const suffix    = this.constants.getDateSuffix(this.data.startDate, this.data.endDate);
    const dateLabel = this.constants.getExcelDateLabel(this.data.startDate, this.data.endDate);
    const filename  = `DISTRICT_RAINFALL_DISTRIBUTION_COUNTRY_INDIA_${suffix}.pdf`;
    const excelName = `DISTRICT_${dateLabel}`;

    if(this.isView){
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
    }else{
      const dayStart    = this.convertToIndianDateFormat(this.data.startDate);
      const dayEnd      = this.convertToIndianDateFormat(this.data.endDate);
      const periodStart = this.convertToIndianDateFormat(this.seasonPeriodDate.startDate);
      const periodEnd   = this.convertToIndianDateFormat(this.seasonPeriodDate.endDate);
      setTimeout(()=>{
        doc.save(filename);
        this.exportAsExcelFile(newArr, excelName, dayStart, dayEnd, periodStart, periodEnd);
        this.exportDistrictDistributionExcel(`DISTRICT_DIST_${dateLabel}`);
      },3000)
    }

    
  
  }

  getAdjustedEndDate(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    // If the start and end dates fall in different months
    if (start.getMonth() !== end.getMonth()) {
      // Get the last day of the start month
      const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  
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
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero for single-digit months
    const day = String(date.getDate()).padStart(2, '0'); // Add leading zero for single-digit days
  
    return `${year}-${month}-${day}`;
  }

  getSeason(startDate: any): string {
    // Ensure startDate is a Date object
    if (!(startDate instanceof Date)) {
      startDate = new Date(startDate);
    }
    
    // Check if startDate is a valid date after conversion
    if (isNaN(startDate.getTime())) {
      throw new Error("Invalid date format provided to getSeason");
    }
  
    const month = startDate.getMonth(); // January is 0, December is 11
  
    if (month >= 0 && month <= 1) {
      return 'Jan-Feb';
    } else if (month >= 2 && month <= 4) {
      return 'Mar-May';
    } else if (month >= 5 && month <= 8) {
      return 'Jun-Sep';
    } else if (month >= 9 && month <= 11) {
      return 'Oct-Dec';
    }
    return '';
  }

  parseDate(date: any): Date {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date;
    }
    
    // Attempt to parse if the date is a string
    if (typeof date === 'string') {
      // Use regular expression to validate the format YYYY-MM-DD
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (datePattern.test(date)) {
        return new Date(date);
      }
    }
  
    throw new Error("Invalid date format");
  }

  adjustSeasonForRange(startDate: any, endDate: any): { season: string, startDate: string, endDate: string } {
    // Parse and validate dates using the parseDate function

    console.log(startDate, endDate);
    startDate = this.parseDate(startDate);
    endDate = this.parseDate(endDate);
  
    console.log('startDate', startDate);
    console.log('endDate', endDate);
  
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

    if(seasonEndDate > endDate){
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

    // Group districts: subdiv_code -> state_code -> districts[]
    const groupedBySubDivision = this.districtdepCurrdate.reduce((acc: any, item: any) => {
      const sd = item.sub_division_code;
      const st = item.state_code;
      if (!acc[sd]) acc[sd] = {};
      if (!acc[sd][st]) acc[sd][st] = [];
      acc[sd][st].push(item);
      return acc;
    }, {});

    // Build order maps from districtDisplayOrder (now includes parent_group_order & parent_group_name)
    const parentGroupOrderMap  = new Map<string, number>();   // parent_group_name -> order
    const subdivOrderMap       = new Map<string, number>();   // subdiv_code        -> first display_order
    const stateOrderMap        = new Map<string, number>();   // subdiv_code_state  -> first display_order
    const districtOrderMap     = new Map<string, number>();   // district_code      -> display_order
    // Track which subdiv_codes belong to each parent group
    const parentGroupSubdivs   = new Map<string, Set<string>>();

    for (const row of this.districtDisplayOrder) {
      const sdKey  = String(row.subdiv_code);
      const pgName = row.parent_group_name ?? row.subdiv_name;
      const pgOrd  = row.parent_group_order ?? row.display_order;

      if (!parentGroupOrderMap.has(pgName)) parentGroupOrderMap.set(pgName, pgOrd);
      if (!parentGroupSubdivs.has(pgName)) parentGroupSubdivs.set(pgName, new Set());
      parentGroupSubdivs.get(pgName)!.add(sdKey);

      if (!subdivOrderMap.has(sdKey)) subdivOrderMap.set(sdKey, row.display_order);
      const stKey = `${row.subdiv_code}_${row.state_code}`;
      if (!stateOrderMap.has(stKey)) stateOrderMap.set(stKey, row.display_order);
      districtOrderMap.set(String(row.district_code), row.display_order);
    }

    // Sort parent groups by their order
    const sortedParentGroups = [...parentGroupOrderMap.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name);


    const subdivColorCode  = [72, 209, 204];
    const stateColorCode   = [238, 130, 238];

    for (const pgName of sortedParentGroups) {
      const subdivsInGroup = [...(parentGroupSubdivs.get(pgName) ?? [])]
        .filter(sd => groupedBySubDivision[sd])
        .sort((a, b) => (subdivOrderMap.get(a) ?? 999999) - (subdivOrderMap.get(b) ?? 999999));

      if (subdivsInGroup.length === 0) continue;

      // If this parent group spans multiple subdivisions it is a STATE parent
      // (e.g. UTTAR PRADESH covers East UP + West UP).
      // Add a state header row (same pink as all state rows) before the subdivisions.
      const isStateParent = subdivsInGroup.length > 1;
      if (isStateParent) {
        const pgStateDate   = this.statedepCurrdate.find((s: any) => s.state_name === pgName);
        const pgStateSeason = this.statedepSeasondate.find((s: any) => s.state_name === pgName);
        const pgDateCat     = this.constants.getColorAndCat(pgStateDate?.departure);
        const pgSeasonCat   = this.constants.getColorAndCat(pgStateSeason?.departure);
        this.rows.push([
          { content: '', styles: { fillColor: stateColorCode } },
          { content: pgName, styles: { fillColor: stateColorCode, fontStyle: 'bold' } },
          { content: pgStateDate?.actual_state_rainfall != null ? this.constants.trimToOneDecimals(pgStateDate.actual_state_rainfall) : ' ', styles: { fillColor: stateColorCode } },
          { content: pgStateDate ? this.constants.trimToOneDecimals(parseFloat(pgStateDate.rainfall_normal_value)) : ' ', styles: { fillColor: stateColorCode } },
          { content: pgStateDate?.departure != null ? this.constants.trimToZeroDecimals(pgStateDate.departure) : ' ', styles: { fillColor: stateColorCode } },
          { content: pgDateCat.Cat, styles: { fillColor: pgDateCat.color } },
          { content: pgStateSeason?.actual_state_rainfall != null ? this.constants.trimToOneDecimals(pgStateSeason.actual_state_rainfall) : ' ', styles: { fillColor: stateColorCode } },
          { content: pgStateSeason ? this.constants.trimToOneDecimals(parseFloat(pgStateSeason.rainfall_normal_value)) : ' ', styles: { fillColor: stateColorCode } },
          { content: pgStateSeason?.departure != null ? this.constants.trimToZeroDecimals(pgStateSeason.departure) : ' ', styles: { fillColor: stateColorCode } },
          { content: pgSeasonCat.Cat, styles: { fillColor: pgSeasonCat.color } },
        ]);
      }

      for (const subDivCode of subdivsInGroup) {
        const subdivisionDate   = this.subdivdepCurrdate.find((s: any) => subDivCode === s.s_code);
        const subdivisionSeason = this.subdivdepSeasondate.find((s: any) => subDivCode === s.s_code);
        if (!subdivisionDate || !subdivisionSeason) continue;

        const DateCat   = this.constants.getColorAndCat(subdivisionDate.departure);
        const SeasonCat = this.constants.getColorAndCat(subdivisionSeason.departure);

        this.rows.push([
          { content: '', styles: { fillColor: subdivColorCode } },
          { content: subdivisionDate.subdiv_name, styles: { fillColor: subdivColorCode } },
          { content: subdivisionDate.actual_subdiv_rainfall != null ? this.constants.trimToOneDecimals(subdivisionDate.actual_subdiv_rainfall) : ' ', styles: { fillColor: subdivColorCode } },
          { content: this.constants.trimToOneDecimals(parseFloat(subdivisionDate.rainfall_normal_value)), styles: { fillColor: subdivColorCode } },
          { content: subdivisionDate.departure != null ? this.constants.trimToZeroDecimals(subdivisionDate.departure) : ' ', styles: { fillColor: subdivColorCode } },
          { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
          { content: subdivisionSeason.actual_subdiv_rainfall != null ? this.constants.trimToOneDecimals(subdivisionSeason.actual_subdiv_rainfall) : ' ', styles: { fillColor: subdivColorCode } },
          { content: this.constants.trimToOneDecimals(parseFloat(subdivisionSeason.rainfall_normal_value)), styles: { fillColor: subdivColorCode } },
          { content: subdivisionSeason.departure != null ? this.constants.trimToZeroDecimals(subdivisionSeason.departure) : ' ', styles: { fillColor: subdivColorCode } },
          { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } },
        ]);

        const states = groupedBySubDivision[subDivCode];
        const sortedStates = Object.keys(states).sort((a, b) => {
          const minA = Math.min(...states[a].map((d: any) => districtOrderMap.get(String(d.district_code)) ?? 999999));
          const minB = Math.min(...states[b].map((d: any) => districtOrderMap.get(String(d.district_code)) ?? 999999));
          return minA - minB;
        });

        const isMultiState = sortedStates.length > 1;

        for (const stateCode of sortedStates) {
          const stateDate   = this.statedepCurrdate.find((s: any) => stateCode == s.state_code.toString());
          const stateSeason = this.statedepSeasondate.find((s: any) => stateCode == s.state_code.toString());
          if (!stateDate || !stateSeason) continue;

          const sDateCat   = this.constants.getColorAndCat(stateDate.departure);
          const sSeasonCat = this.constants.getColorAndCat(stateSeason.departure);

          // Only add a separate state header when the subdivision spans multiple states.
          // For single-state subdivisions the teal subdiv row already serves as the combined header.
          if (isMultiState) {
            this.rows.push([
              { content: '', styles: { fillColor: stateColorCode } },
              { content: stateDate.state_name, styles: { fillColor: stateColorCode } },
              { content: stateDate.actual_state_rainfall != null ? this.constants.trimToOneDecimals(stateDate.actual_state_rainfall) : ' ', styles: { fillColor: stateColorCode } },
              { content: this.constants.trimToOneDecimals(parseFloat(stateDate.rainfall_normal_value)), styles: { fillColor: stateColorCode } },
              { content: stateDate.departure != null ? this.constants.trimToZeroDecimals(stateDate.departure) : ' ', styles: { fillColor: stateColorCode } },
              { content: sDateCat.Cat, styles: { fillColor: sDateCat.color } },
              { content: stateSeason.actual_state_rainfall != null ? this.constants.trimToOneDecimals(stateSeason.actual_state_rainfall) : ' ', styles: { fillColor: stateColorCode } },
              { content: this.constants.trimToOneDecimals(parseFloat(stateSeason.rainfall_normal_value)), styles: { fillColor: stateColorCode } },
              { content: stateSeason.departure != null ? this.constants.trimToZeroDecimals(stateSeason.departure) : ' ', styles: { fillColor: stateColorCode } },
              { content: sSeasonCat.Cat, styles: { fillColor: sSeasonCat.color } },
            ]);
          }

          const districtsCurrDate = states[stateCode];
          const sortedDistricts = [...districtsCurrDate].sort((a: any, b: any) =>
            (districtOrderMap.get(String(a.district_code)) ?? 999999) -
            (districtOrderMap.get(String(b.district_code)) ?? 999999)
          );

          for (let i = 0; i < sortedDistricts.length; i++) {
            const districtDate   = sortedDistricts[i];
            const districtSeason = this.districtdepSeasondate.find((d: any) => d.district_code == districtDate.district_code);

            const dDateCat   = this.constants.getColorAndCat(districtDate.departure);
            const dSeasonCat = this.constants.getColorAndCat(districtSeason?.departure);

            this.rows.push([
              i + 1,
              districtDate.district_name,
              districtDate.actual_rainfall != null ? this.constants.trimToOneDecimals(districtDate.actual_rainfall) : ' ',
              this.constants.trimToOneDecimals(parseFloat(districtDate.normal_rainfall)),
              districtDate.departure != null ? this.constants.trimToZeroDecimals(districtDate.departure) : ' ',
              { content: dDateCat.Cat, styles: { fillColor: dDateCat.color } },
              districtSeason?.actual_rainfall != null ? this.constants.trimToOneDecimals(districtSeason.actual_rainfall) : ' ',
              this.constants.trimToOneDecimals(parseFloat(districtSeason?.normal_rainfall)),
              districtSeason?.departure != null ? this.constants.trimToZeroDecimals(districtSeason.departure) : ' ',
              { content: dSeasonCat.Cat, styles: { fillColor: dSeasonCat.color } },
            ]);
          }
        }
      }
    }
  }



  private countDepartureByState(): Array<{ state: string; state_code: number; counts: any }> {
    const stateNameMap = new Map<number, string>();
    for (const s of this.statedepCurrdate) {
      const sc = Number(s.state_code ?? s.new_state_code);
      stateNameMap.set(sc, s.state_name);
    }
    const grouped = new Map<number, number[]>();
    for (const d of this.districtdepCurrdate) {
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
    const blankCell = { v: '', t: 's', s: {} };
    const thin = {
      top:    { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left:   { style: 'thin', color: { rgb: '000000' } },
      right:  { style: 'thin', color: { rgb: '000000' } },
    };
    const titleCell = (v: string, sz = 11) => ({
      v, t: 's',
      s: { font: { bold: true, sz, underline: true }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true } },
    });
    const hdrCell = (v: string) => ({
      v, t: 's',
      s: { font: { bold: true, sz: 9 }, fill: { fgColor: { rgb: 'C8DCFF' } }, border: thin,
           alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true } },
    });
    const cell  = (v: any) => ({ v: String(v ?? ''), t: 's', s: { font: { bold: true, sz: 9 }, border: thin, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } });
    const lCell = (v: any) => ({ v: String(v ?? ''), t: 's', s: { font: { bold: true, sz: 9 }, border: thin, alignment: { horizontal: 'left'   as const, vertical: 'middle' as const } } });

    const periodLabel = `PERIOD :   ${this.convertToIndianDateFormat(this.data.startDate)}   TO   ${this.convertToIndianDateFormat(this.data.endDate)}`;
    const row1 = [titleCell('STATEWISE DISTRIBUTION OF NO. OF DISTRICTS', 12), ...Array(9).fill(blankCell)];
    const row2 = [titleCell('WITH LARGE EXCESS, EXCESS, NORMAL, DEFICIENT, LARGE DEFICIENT, NO RAINFALL AND NO DATA CATEGORY', 10), ...Array(9).fill(blankCell)];
    const row3 = Array(10).fill(blankCell);
    const row4 = [
      hdrCell('S.'), hdrCell('STATES'),
      { v: periodLabel, t: 's', s: { font: { bold: true, sz: 10 }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } },
      ...Array(7).fill(blankCell),
    ];
    const row5 = [hdrCell('NO.'), blankCell, hdrCell('LE'), hdrCell('E'), hdrCell('N'), hdrCell('D'), hdrCell('LD'), hdrCell('NR'), hdrCell('ND'), hdrCell('TOTAL')];

    XLSX.utils.sheet_add_aoa(ws, [row1], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(ws, [row2], { origin: 'A2' });
    XLSX.utils.sheet_add_aoa(ws, [row3], { origin: 'A3' });
    XLSX.utils.sheet_add_aoa(ws, [row4], { origin: 'A4' });
    XLSX.utils.sheet_add_aoa(ws, [row5], { origin: 'A5' });

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
      { v: 'TOTAL', t: 's', s: { font: { bold: true, sz: 9 }, border: thin, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } },
      cell(totals.LE), cell(totals.E), cell(totals.N), cell(totals.D),
      cell(totals.LD), cell(totals.NR), cell(totals.ND), cell(totals.Total),
    ]);

    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: { r: dataStartRow, c: 0 } });

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
      { s: { r: 3, c: 2 }, e: { r: 3, c: 9 } },
    ];
    ws['!cols'] = [
      { wch: 6 }, { wch: 32 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    ];
    ws['!rows'] = [{ hpt: 20 }, { hpt: 30 }, { hpt: 5 }, { hpt: 25 }, { hpt: 20 }];

    const wb: XLSX.WorkBook = { Sheets: { data: ws }, SheetNames: ['data'] };
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(buf, excelFileName);
  }

  // constants.getColorAndCat(departure: any) {

    

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