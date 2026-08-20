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

export class McWiseSubdivDownloadStatistics {

  private baseUrl: string = environment.baseUrl;
  isView : boolean = false

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

  async updateanddownloadpdf(subdivCodes:any){
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(subdivCodes, this.data, this.seasonPeriodDate)
  }

  async updateanddownloadpdfFromDataEntry(subdivCodes:any){
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(subdivCodes, this.data, this.seasonPeriodDate)
  }

  async updateandViewpdf(subdivCodes:any){
        const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(subdivCodes, this.data, this.seasonPeriodDate, true)
  }
  
  async updateandViewpdfFromDataEntry(subdivCodes:any){
        const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(subdivCodes, this.data, this.seasonPeriodDate, true)
  }








  async updateanddownloadpdfCustom(subdivCodes:any,fromDate : any, toDate : any){
    console.log('custom date download', fromDate, toDate)
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(subdivCodes, this.data, this.seasonPeriodDate)
  }



  

  async updateanddownloadpdfFromDataEntryCustom(subdivCodes:any,fromDate : any, toDate : any){
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(subdivCodes, this.data, this.seasonPeriodDate)
  }

  async updateandViewpdfCustom(subdivCodes:any,fromDate : any, toDate : any){
        const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(subdivCodes, this.data, this.seasonPeriodDate, true)
  }

  async updateandViewpdfFromDataEntryCustom(subdivCodes:any,fromDate : any, toDate : any){
        const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(subdivCodes, this.data, this.seasonPeriodDate, true)
  }









  
  
  async updateCurrDateData(subdivCodes:any, data: any, seasonPeriodDate: any, viewOnly: boolean = false) {
    try {
      await lastValueFrom(
        this.fetchDistrictData(data).pipe(
          concatMap(districtData => {
            this.districtdepCurrdate = districtData.data;
            this.districtdepCurrdate = this.districtdepCurrdate.filter((x:any)=>{
              return subdivCodes.has(Number(x.sub_division_code))
            })
            console.log('indownloading---->', this.districtdepCurrdate);
            return this.fetchSubdivData(data);
          }),
  
          concatMap(subdiv => {
            this.subdivdepCurrdate = subdiv.data;
            this.subdivdepCurrdate = this.subdivdepCurrdate.filter((x:any)=>{
              return subdivCodes.has(Number(x.s_code))
            })
            console.log('indownloading---->', this.subdivdepCurrdate);
            return this.fetchDistrictData(seasonPeriodDate); // or any observable to complete the chain
          }),
          concatMap(seasondistrictData => {
            this.districtdepSeasondate = seasondistrictData.data;
            this.districtdepSeasondate = this.districtdepSeasondate.filter((x:any)=>{
              return subdivCodes.has(Number(x.sub_division_code))
            })
            console.log('indownloading---->', this.districtdepSeasondate);
            return this.fetchSubdivData(seasonPeriodDate);
          }),    
 
          concatMap(seasonstateData => {
            this.subdivdepSeasondate = seasonstateData.data;
            this.subdivdepSeasondate = this.subdivdepSeasondate.filter((x:any)=>{
              return subdivCodes.has(Number(x.s_code))
            })
            console.log('indownloading---->', this.subdivdepSeasondate);
            this.downloadPdf(viewOnly);
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }


  async updateCurrDateDataFromDataEntry(subdivCodes:any, data: any, seasonPeriodDate: any, viewOnly: boolean = false) {

    console.log('updateCurrDateDataFromDataEntry DATA', data);
    try {
      await lastValueFrom(
        this.fetchDistrictDataFromDataEntry(data).pipe(
          concatMap(districtData => {
            this.districtdepCurrdate = districtData.data;
            this.districtdepCurrdate = this.districtdepCurrdate.filter((x:any)=>{
              return subdivCodes.has(Number(x.sub_division_code))
            })
            console.log('indownloading---->', this.districtdepCurrdate);
            return this.fetchSubdivDataFromDataEntry(data);
          }),

          concatMap(subdiv => {
            this.subdivdepCurrdate = subdiv.data;
            this.subdivdepCurrdate = this.subdivdepCurrdate.filter((x:any)=>{
              return subdivCodes.has(Number(x.s_code))
            })
            console.log('indownloading---->', this.subdivdepCurrdate);
            return this.fetchDistrictDataFromDataEntry(seasonPeriodDate); // or any observable to complete the chain
          }),
          concatMap(seasondistrictData => {
            this.districtdepSeasondate = seasondistrictData.data;
            this.districtdepSeasondate = this.districtdepSeasondate.filter((x:any)=>{
              return subdivCodes.has(Number(x.sub_division_code))
            })
            console.log('indownloading---->', this.districtdepSeasondate);
            return this.fetchSubdivDataFromDataEntry(seasonPeriodDate);
          }),    
   
          concatMap(seasonstateData => {
            this.subdivdepSeasondate = seasonstateData.data;
            this.subdivdepSeasondate = this.subdivdepSeasondate.filter((x:any)=>{
              return subdivCodes.has(Number(x.s_code))
            })
            console.log('indownloading---->', this.subdivdepSeasondate);
            this.downloadPdf(viewOnly);
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
      { v: 'SUBDIVISIONWISE DISTRICT RAINFALL DISTRIBUTION', t: 's', s: { font: { bold: true, sz: 13, color: { rgb: '993300' }, underline: true }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } },
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
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },   // name column B4:B5
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




  
  public async downloadPdf(viewOnly: boolean = false){

    console.log('ssssss', this.data.startDate, typeof this.data.startDate,  this.data.endDate, this.data.startDate==this.data.endDate);

    // Adjust season dates based on this.data.startDate to set the seasonal period
      const seasonRange = this.adjustSeasonForRange(this.data.startDate, this.data.endDate);
  
    // Set the season period start and end dates
      this.seasonPeriodDate.startDate = seasonRange.startDate;
      this.seasonPeriodDate.endDate = seasonRange.endDate;

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

    if (viewOnly) {
      // On-page table view (right-hand stats panel): this.rows / this.data /
      // this.seasonPeriodDate are already populated for the component to read,
      // so skip PDF/Excel generation entirely.
      //
      // Passed per call rather than via the shared this.isView field: this
      // service is providedIn: 'root', so that field is shared state. A view
      // call that set it and never reached here left it true, and the next
      // "Statistics Download" click then hit this guard and silently produced
      // no file. A parameter cannot leak between calls.
      return;
    }

    // Styled cells for the Excel sheet, matching the all-India districts export
    // in /all-maps: thin black borders, CAT. cells keeping their category
    // colour, % suffix on the departure columns, name column left-aligned.
    const thinBlack = {
      top:    { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left:   { style: 'thin', color: { rgb: '000000' } },
      right:  { style: 'thin', color: { rgb: '000000' } },
    };

    var newArr: any[][] = this.rows.map((subArr) => {
      const firstFill = (subArr[0] as any)?.styles?.fillColor;
      const isGroupRow = Array.isArray(firstFill) && firstFill[0] === 72;
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
        if (isGroupRow) {
          cellStyle = { fill: { fgColor: { rgb: 'FFFFFF' } }, border: thinBlack, font: { bold: true, sz: 9, color: { rgb: '0000FF' } }, alignment: { horizontal: hAlign, vertical: 'middle' as const } };
        } else {
          cellStyle = { fill: { fgColor: { rgb: fillHex } }, border: thinBlack, font: { bold: false, sz: 9, color: { rgb: '000000' } }, alignment: { horizontal: hAlign, vertical: 'middle' as const } };
        }
        const isDep = colIdx === 4 || colIdx === 8;
        const numeric = this.constants.excelNumericCell(item, isDep ? 0 : 1);
        if (numeric) return { ...numeric, s: cellStyle };
        return { v: String(content ?? ''), t: 's', s: cellStyle };
      });
    });

    

    var newcolumns1 = columns1forexcel.map((item) => {
      if (typeof item === 'object' && item.hasOwnProperty('content')) {
        return item.content;
      }
      return item;
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
      body: this.constants.withDeparturePercent(this.rows),
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
    // DISTRIBUTION_COUNTRY_INDIA_cd.pdf
    const filename = `DISTRIBUTION_DISTRICT_INDIA_cd.pdf`;

    if(this.isView){
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
    }else{
      setTimeout(()=>{
        doc.save(filename);
        this.exportAsExcelFile(
          newArr,
          `MC_SUBDIVWISE_RAINFALL_DISTRIBUTION`,
          this.convertToIndianDateFormat(this.data.startDate),
          this.convertToIndianDateFormat(this.data.endDate),
          this.convertToIndianDateFormat(this.seasonPeriodDate.startDate),
          this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)
        );
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
  
    return {
      season,
      startDate: this.formatDate(seasonStartDate),
      endDate: this.formatDate(seasonEndDate),
    };
  }


  private loadTheRows() {
    // Group by Subdivision only, without state
    this.rows = [];
    const groupedBySubDivision = this.districtdepCurrdate.reduce((acc, item) => {
        const subDivision = item.sub_division_code;
        const subDivName = item.subdiv_name;

        if (!acc[subDivision]) {
            acc[subDivision] = [];
        }
        
        acc[subDivision].push(item);
        return acc;
    }, {});

    // Create a mapping of codes to subdivision names
    const subdivNames = this.subdivdepCurrdate.map((x: any) => [x.s_code, x.subdiv_name]);
    const codeToNameMap = new Map(subdivNames.map(([code, name]) => [code, name]));
    
    // Sort subdivisions by name
    const sortedSubDivisions = Object.keys(groupedBySubDivision).sort((a, b) => {
        const nameA = codeToNameMap.get(a) || '';
        const nameB = codeToNameMap.get(b) || '';
        return nameA.localeCompare(nameB);
    });

    let subdivColorCode = [72, 209, 204];

    for (const subDivCode of sortedSubDivisions) {
        // String(...) on both sides: subDivCode comes from Object.keys(), which
        // always yields strings, while s_code comes back from the API as a
        // number — so a strict === never matched, find() returned undefined and
        // the .departure read below threw, aborting loadTheRows() with rows
        // half-built. That empties the stats panel and makes the Statistics
        // Download produce nothing. The district loop below already compares
        // loosely, which is why only the subdivision lookup broke.
        const subdivisionDate = this.subdivdepCurrdate.find(subdiv => String(subDivCode) === String(subdiv.s_code));
        const subdivisionSeason = this.subdivdepSeasondate.find(subdiv => String(subDivCode) === String(subdiv.s_code));

        // A subdivision with no matching row in either dataset can't be
        // rendered; skip it rather than throwing and losing every remaining row.
        if (!subdivisionDate || !subdivisionSeason) {
          continue;
        }

        const DateCat = this.constants.getColorAndCat(subdivisionDate.departure);
        const SeasonCat = this.constants.getColorAndCat(subdivisionSeason.departure);

        // Add subdivision row
        this.rows.push([
            { content: '', styles: { fillColor: subdivColorCode } },
            { content: `SUBDIVISION : ${subdivisionDate.subdiv_name}`, styles: { fillColor: subdivColorCode } },
            { content: subdivisionDate.actual_subdiv_rainfall != null ? this.constants.trimToOneDecimals(subdivisionDate.actual_subdiv_rainfall) : ' ', xlRaw: subdivisionDate.actual_subdiv_rainfall, styles: { fillColor: subdivColorCode } },
            { content: this.constants.trimToOneDecimals(parseFloat(subdivisionDate.rainfall_normal_value)), xlRaw: subdivisionDate.rainfall_normal_value, styles: { fillColor: subdivColorCode } },
            { content: subdivisionDate.departure != null ? this.constants.trimToZeroDecimals(subdivisionDate.departure) : ' ', xlRaw: subdivisionDate.departure, xlPct: true, styles: { fillColor: subdivColorCode } },
            { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
            { content: subdivisionSeason.actual_subdiv_rainfall != null ? this.constants.trimToOneDecimals(subdivisionSeason.actual_subdiv_rainfall) : ' ', xlRaw: subdivisionSeason.actual_subdiv_rainfall, styles: { fillColor: subdivColorCode } },
            { content: this.constants.trimToOneDecimals(parseFloat(subdivisionSeason.rainfall_normal_value)), xlRaw: subdivisionSeason.rainfall_normal_value, styles: { fillColor: subdivColorCode } },
            { content: subdivisionSeason.departure != null ? this.constants.trimToZeroDecimals(subdivisionSeason.departure) : ' ', xlRaw: subdivisionSeason.departure, xlPct: true, styles: { fillColor: subdivColorCode } },
            { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } }
        ]);

        // Get districts for the subdivision and sort them
        const districts = groupedBySubDivision[subDivCode];
        const sortedDistricts = districts.sort((a: any, b: any) => a.district_name.localeCompare(b.district_name));

        for (let i = 0; i < sortedDistricts.length; i++) {
            const districtDate = sortedDistricts[i];
            const districtSeason = this.districtdepSeasondate.find(district => district.district_code == districtDate.district_code);

            const DateCat = this.constants.getColorAndCat(districtDate.departure);
            const SeasonCat = this.constants.getColorAndCat(districtSeason?.departure);

            // Add district row
            this.rows.push([
                i + 1,
                districtDate.district_name,
                { content: districtDate.actual_rainfall != null ? this.constants.trimToOneDecimals(districtDate.actual_rainfall) : ' ', xlRaw: districtDate.actual_rainfall },
                { content: this.constants.trimToOneDecimals(parseFloat(districtDate.normal_rainfall)), xlRaw: districtDate.normal_rainfall },
                { content: districtDate.departure != null ? this.constants.trimToZeroDecimals(districtDate.departure) : ' ', xlRaw: districtDate.departure, xlPct: true },
                { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
                { content: districtSeason?.actual_rainfall != null ? this.constants.trimToOneDecimals(districtSeason.actual_rainfall) : ' ', xlRaw: districtSeason?.actual_rainfall },
                { content: this.constants.trimToOneDecimals(parseFloat(districtSeason?.normal_rainfall)), xlRaw: districtSeason?.normal_rainfall },
                { content: districtSeason?.departure != null ? this.constants.trimToZeroDecimals(districtSeason.departure) : ' ', xlRaw: districtSeason?.departure, xlPct: true },
                { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } }
            ]);
        }
    }
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