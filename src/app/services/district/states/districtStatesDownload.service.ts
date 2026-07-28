import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, concatMap, lastValueFrom } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Constants } from '../../constants';
import autoTable, { Column } from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';
import { CalculationsModeService } from 'src/app/services/calculationsMode.service';


@Injectable({
  providedIn: 'root'
})

export class DownloadPdfStateDistrict {

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
    selectedStateCode: any;

  constructor(private http: HttpClient, private constants: Constants, private calcMode: CalculationsModeService) {
  }

  convertToIndianDateFormat = (dateString: string) => dateString.split('-').reverse().join('-');

  async updateanddownloadpdf(state_code : any){
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(this.data, this.seasonPeriodDate, state_code)
  }

  async updateanddownloadpdfFromDataEntry(state_code : any){
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate, state_code)
  }

  async updateandViewpdf(state_code : any){
    this.isView = true
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(this.data, this.seasonPeriodDate, state_code)
  }
  
  async updateandViewpdfFromDataEntry(state_code : any){
    this.isView = true
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate, state_code)
  }








  async updateanddownloadpdfCustom(fromDate : any, toDate : any, state_code : any){
    console.log('custom date download', fromDate, toDate)
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(this.data, this.seasonPeriodDate, state_code)
  }



  

  async updateanddownloadpdfFromDataEntryCustom(fromDate : any, toDate : any, state_code : any){
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate, state_code)
  }

  async updateandViewpdfCustom(fromDate : any, toDate : any, state_code : any){
    this.isView = true
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateData(this.data, this.seasonPeriodDate, state_code)
  }

  async updateandViewpdfFromDataEntryCustom(fromDate : any, toDate : any, state_code : any){
    this.isView = true
    const currDate = new Date();
    // this.data = this.constants.getRangeFromDateRange();
    this.data  = {
      startDate : fromDate, // 2024-09-18 format
      endDate : toDate
    }
    
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodateCustom(new Date(toDate));
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate, state_code)
  }









  
  
  async updateCurrDateData(data: any, seasonPeriodDate: any, state_code : any) {


    this.selectedStateCode = state_code


    
    try {
      await lastValueFrom(
        this.fetchDistrictData(data).pipe(  
          concatMap(districtData => {
            this.districtdepCurrdate = districtData.data;
            console.log('data type check', typeof state_code, state_code)
            this.districtdepCurrdate = this.districtdepCurrdate.filter((x: any) => x.state_code === state_code);
            console.log('indownloading---->', this.districtdepCurrdate);
            return this.fetchStateData(data);
          }),
          concatMap(stateData => {
            this.statedepCurrdate = stateData.data;
            this.statedepCurrdate = this.statedepCurrdate.filter((x: any) => x.state_code === state_code);
            console.log('indownloading---->', this.statedepCurrdate);
            return this.fetchDistrictData(seasonPeriodDate);;
          }),
        //   concatMap(subdiv => {
        //     this.subdivdepCurrdate = subdiv.data;
        //     console.log('indownloading---->', this.subdivdepCurrdate);
        //     return this.fetchDistrictData(seasonPeriodDate); // or any observable to complete the chain
        //   }),
          concatMap(seasondistrictData => {
            this.districtdepSeasondate = seasondistrictData.data;
            this.districtdepSeasondate = this.districtdepSeasondate.filter((x: any) => x.state_code === state_code);
            console.log('indownloading---->', this.districtdepSeasondate);
            return this.fetchStateData(seasonPeriodDate);
          }),    
          concatMap(seasonstateData => {
            this.statedepSeasondate = seasonstateData.data;
            this.statedepSeasondate = this.statedepSeasondate.filter((x: any) => x.state_code === state_code);

            console.log('indownloading---->', this.statedepSeasondate, this.subdivdepSeasondate);
            this.downloadPdf();
            return EMPTY;
          }),    
        //   concatMap(seasonstateData => {
        //     this.subdivdepSeasondate = seasonstateData.data;
        //     console.log('indownloading---->', this.subdivdepSeasondate);
        //     this.downloadPdf();
        //     return EMPTY;
        //   })
        )
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }


  async updateCurrDateDataFromDataEntry(data: any, seasonPeriodDate: any, state_code : any) {

    this.selectedStateCode = state_code

    console.log('updateCurrDateDataFromDataEntry DATA', data);
    try {
      await lastValueFrom(
        (this.calcMode.isAwsEnabled ? this.fetchDistrictDataWithAWS(data) : this.fetchDistrictDataFromDataEntry(data)).pipe(
          concatMap(districtData => {
            this.districtdepCurrdate = districtData.data;
            this.districtdepCurrdate = this.districtdepCurrdate.filter((x: any) => x.state_code === state_code);
            console.log('indownloading---->', this.districtdepCurrdate);
            return (this.calcMode.isAwsEnabled ? this.fetchStateDataWithAWS(data) : this.fetchStateDataFromDataEntry(data));
          }),
          concatMap(stateData => {
            this.statedepCurrdate = stateData.data;
            console.log('indownloading---->', this.statedepCurrdate);
            return (this.calcMode.isAwsEnabled ? this.fetchSubdivDataWithAWS(data) : this.fetchSubdivDataFromDataEntry(data));
          }),
          concatMap(subdiv => {
            this.subdivdepCurrdate = subdiv.data;
            console.log('indownloading---->', this.subdivdepCurrdate);
            return (this.calcMode.isAwsEnabled ? this.fetchDistrictDataWithAWS(seasonPeriodDate) : this.fetchDistrictDataFromDataEntry(seasonPeriodDate)); // or any observable to complete the chain
          }),
          concatMap(seasondistrictData => {
            this.districtdepSeasondate = seasondistrictData.data;
            this.districtdepSeasondate = this.districtdepSeasondate.filter((x: any) => x.state_code === state_code);

            console.log('indownloading---->', this.districtdepSeasondate);
            return (this.calcMode.isAwsEnabled ? this.fetchStateDataWithAWS(seasonPeriodDate) : this.fetchStateDataFromDataEntry(seasonPeriodDate));
          }),
          concatMap(seasonstateData => {
            this.statedepSeasondate = seasonstateData.data;
            console.log('indownloading---->', this.statedepSeasondate, this.subdivdepSeasondate);
            return (this.calcMode.isAwsEnabled ? this.fetchSubdivDataWithAWS(seasonPeriodDate) : this.fetchSubdivDataFromDataEntry(seasonPeriodDate));
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

  fetchDistrictDataWithAWS(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchDistrictDataWithAWS`;
    return this.http.post<any>(url, data);
  }

  fetchStateDataFromDataEntry(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchStateData`;
    return this.http.post<any>(url, data);
  }

  fetchStateDataWithAWS(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchStateDataWithAWS`;
    return this.http.post<any>(url, data);
  }

  fetchSubdivDataFromDataEntry(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchSubDivisionData`;
    return this.http.post<any>(url, data);
  }

  fetchSubdivDataWithAWS(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchSubDivisionDataWithAWS`;
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
      { v: 'DISTRICT RAINFALL DISTRIBUTION', t: 's', s: { font: { bold: true, sz: 13, color: { rgb: '993300' }, underline: true }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } },
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

    // Generate the Excel file
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Save the file
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

    console.log('ssssss', this.data.startDate, typeof this.data.startDate,  this.data.endDate, this.data.startDate==this.data.endDate)

    const columns1 = ['', '', 
      // {
      // content : this.data.startDate==this.data.endDate ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`:`DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`, colSpan:4
      // },

      {
        content: this.data.startDate === this.data.endDate 
        ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`
        : `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.getAdjustedEndDate(this.data.startDate, this.data.endDate)}`, 
         colSpan: 4
      },

      {
        content : `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`, colSpan:4
      },
      
    ]
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
      const isState   = Array.isArray(firstFill) && firstFill[0] === 238;  // [238,130,238]
      return subArr.map((item: any, colIdx: number) => {
        let content = typeof item === 'object' && item.hasOwnProperty('content') ? item.content : item;
        if ((colIdx === 4 || colIdx === 8) && content !== '' && content !== ' ' && content != null) {
          content = `${content}%`;
        }
        const cellFill  = item?.styles?.fillColor;
        const isHexFill = typeof cellFill === 'string' && cellFill.startsWith('#');
        const hAlign    = colIdx === 1 ? 'left' as const : 'center' as const;
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
    // DISTRIBUTION_COUNTRY_INDIA_cd.pdf
    const filename = `DISTRIBUTION_DISTRICT_INDIA_cd.pdf`;

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
        this.exportAsExcelFile(newArr, `DISTRICT_RAINFALL_DISTRIBUTION_COUNTRY_INDIA_cd`, dayStart, dayEnd, periodStart, periodEnd);
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

  private loadTheRows() {
    console.log('hiii')
    // Group by Subdivision and then State
    this.rows = []
    // const groupedBySubDivision = this.districtdepCurrdate.reduce((acc, item) => {
    //     const subDivision = item.sub_division_code;
    //     const subDivName = item.subdiv_name;
    //     const state = item.state_code;

    //     if (!acc[subDivision]) {
    //         acc[subDivision] = {};
    //     }

    //     if (!acc[subDivision][state]) {
    //         acc[subDivision][state] = [];
    //     }
        
    //     acc[subDivision][state].push(item);
    //     return acc;
    // }, {});

    // const subdivNames = this.subdivdepCurrdate.map((x:any)=> [x.s_code, x.subdiv_name])


    // const sortedSubDivisions = Object.keys(groupedBySubDivision).sort((a, b) => a.localeCompare(b));
    // console.group('heygeyye', groupedBySubDivision, sortedSubDivisions, subdivNames)
    // Create a mapping of codes to names



    // const codeToNameMap = new Map(subdivNames.map(([code, name]) => [code, name]));
    // const sortedSubDivisions = Object.keys(groupedBySubDivision).sort((a, b) => {
    //     const nameA = codeToNameMap.get(a) || '';
    //     const nameB = codeToNameMap.get(b) || '';
    //     return nameA.localeCompare(nameB);
    // });

    // console.group('heygeyye', groupedBySubDivision, sortedSubDivisions, subdivNames);
    // let subdivColorCode = [72, 209, 204];
    let stateColorCode = [238, 130, 238];

    // for (const subDivCode of sortedSubDivisions) {

    //     const subdivisionDate = this.subdivdepCurrdate.find(subdiv => subDivCode === subdiv.s_code);
    //     const subdivisionSeason = this.subdivdepSeasondate.find(subdiv => subDivCode === subdiv.s_code);

    //     const DateCat = this.getColorAndCat(subdivisionDate.departure);
    //     const SeasonCat = this.getColorAndCat(subdivisionSeason.departure);

    //     this.rows.push([
    //         { content: '', styles: { fillColor: subdivColorCode } },
    //         { content: `SUBDIVISION : ${subdivisionDate.subdiv_name}`, styles: { fillColor: subdivColorCode } },
    //         { content: subdivisionDate.actual_subdiv_rainfall != null ? this.constants.trimToOneDecimals(subdivisionDate.actual_subdiv_rainfall) : ' ', styles: { fillColor: subdivColorCode } },
    //         { content: this.constants.trimToOneDecimals(parseFloat(subdivisionDate.rainfall_normal_value)), styles: { fillColor: subdivColorCode } },
    //         { content: subdivisionDate.departure != null ? Math.round(subdivisionDate.departure) : ' ', styles: { fillColor: subdivColorCode } },
    //         { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
    //         { content: subdivisionSeason.actual_subdiv_rainfall != null ? this.constants.trimToOneDecimals(subdivisionSeason.actual_subdiv_rainfall) : ' ', styles: { fillColor: subdivColorCode } },
    //         { content: this.constants.trimToOneDecimals(parseFloat(subdivisionSeason.rainfall_normal_value)), styles: { fillColor: subdivColorCode } },
    //         { content: subdivisionSeason.departure != null ? Math.round(subdivisionSeason.departure) : ' ', styles: { fillColor: subdivColorCode } },
    //         { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } }
    //     ]);

    //     const states = groupedBySubDivision[subDivCode];
    //     const sortedStates = Object.keys(states).sort((a, b) => a.localeCompare(b));

        // for (const stateCode of state_code) {
            const stateCode = this.selectedStateCode
            const stateDate = this.statedepCurrdate.find(state => stateCode == state.state_code.toString());
            const stateSeason = this.statedepSeasondate.find(state => stateCode == state.state_code.toString());

            console.log('stateDate.departure', stateDate, this.selectedStateCode)

            const DateCat = this.getColorAndCat(stateDate.departure);
            const SeasonCat = this.getColorAndCat(stateSeason.departure);

            this.rows.push([
                { content: '', styles: { fillColor: stateColorCode } },
                { content: `STATE : ${stateDate.state_name}`, styles: { fillColor: stateColorCode } },
                { content: stateDate.actual_state_rainfall != null ? this.constants.trimToOneDecimals(stateDate.actual_state_rainfall) : ' ', styles: { fillColor: stateColorCode } },
                { content: this.constants.trimToOneDecimals(parseFloat(stateDate.rainfall_normal_value)), styles: { fillColor: stateColorCode } },
                { content: stateDate.departure != null ? Math.round(stateDate.departure) : ' ', styles: { fillColor: stateColorCode } },
                { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
                { content: stateSeason.actual_state_rainfall != null ? this.constants.trimToOneDecimals(stateSeason.actual_state_rainfall) : ' ', styles: { fillColor: stateColorCode } },
                { content: this.constants.trimToOneDecimals(parseFloat(stateSeason.rainfall_normal_value)), styles: { fillColor: stateColorCode } },
                { content: stateSeason.departure != null ? Math.round(stateSeason.departure) : ' ', styles: { fillColor: stateColorCode } },
                { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } }
            ]);

            // Sort Districts within each State
            // const districtsCurrDate = states[stateCode];
            const sortedDistrictsCurrDate = this.districtdepCurrdate.sort((a:any, b:any) => a.district_name.localeCompare(b.district_name));

            for (let i = 0; i < sortedDistrictsCurrDate.length; i++) {
                const districtDate = sortedDistrictsCurrDate[i];
                const districtSeason = this.districtdepSeasondate.find(district => district.district_code == districtDate.district_code);

                const DateCat = this.getColorAndCat(districtDate.departure);
                const SeasonCat = this.getColorAndCat(districtSeason?.departure);

                // Add District Row
                this.rows.push([
                    i + 1,
                    districtDate.district_name,
                    districtDate.actual_rainfall != null ? this.constants.trimToOneDecimals(districtDate.actual_rainfall) : ' ',
                    this.constants.trimToOneDecimals(parseFloat(districtDate.normal_rainfall)),
                    districtDate.departure != null ? Math.round(districtDate.departure) : ' ',
                    { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
                    districtSeason?.actual_rainfall != null ? this.constants.trimToOneDecimals(districtSeason.actual_rainfall) : ' ',
                    this.constants.trimToOneDecimals(parseFloat(districtSeason?.normal_rainfall)),
                    districtSeason?.departure != null ? Math.round(districtSeason.departure) : ' ',
                    { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } }
                ]);
            }



            console.log('final rows', this.rows)
        
    }



  getColorAndCat(departure: any) {

    let color = ''
    let Cat = ''

    if(departure==null){
      return {
        color:'#c0c0c0',
        Cat : 'ND'
      }
    }

    if(departure>=60){
      Cat = 'LE'
      color = '#0096ff'
    }
    else if(departure >= 20 && departure <= 59){
      Cat = 'E'
      color = '#32c0f8'
    }    
    else if(departure >= -19 &&  departure<= +19){
      Cat = 'N'
      color = '#00cd5b'
    }    
    else if(departure>= -59 && departure <= -20){
      Cat = 'D'
      color = '#ff2700'
    }    
    else if(departure >= -99 && departure<= -60){
      Cat = 'LD'
      color = '#ffff20'
    }    
    else if(departure= -100){
      Cat = 'NR'
      color = '#ffffff'
    }

    return {
      color : color,
      Cat : Cat
    };
  }
}