import { Injectable, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, concatMap, lastValueFrom } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Constants } from '../constants';
import autoTable, { Column } from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { RegionService } from '../region/region.service';
import { StateService } from './state.service';
import { CountryService } from '../country/country.service';

@Injectable({
  providedIn: 'root'
})

export class StateDownloadStatistics {
  isView : boolean = false
  private baseUrl: string = environment.baseUrl;

  statedepCurrdate: any[] = [];
  regiondepCurrdate: any[] = [];
  countrydepCurrdate: any[] = [];

  statedepSeasondate: any[] = [];
  regiondepSeasondate: any[] = [];
  countrydepSeasondate: any[] = [];

  rows :any[][] = [];
  data: any;
  seasonPeriodDate: any;

  constructor(
    private http: HttpClient,
    private constants: Constants,
    private regionService: RegionService,
    private stateservice: StateService,
    private countryService: CountryService
  ) {}

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



    
 
  async updateCurrDateData(data:any, seasonPeriodDate:any ){
    try{
      await lastValueFrom(
        this.stateservice.fetchDataFtp(data).pipe(
          concatMap(stateData => {
            this.statedepCurrdate = stateData.data;
            console.log('indownloading---->',this.statedepCurrdate)
            return this.regionService.fetchDataFtp(data);
          }),
          concatMap(region => {
            this.regiondepCurrdate = region.data;
            console.log('indownloading---->',this.regiondepCurrdate)
            return this.stateservice.fetchDataFtp(seasonPeriodDate);
          }),
          concatMap(seasonstateData => {
            this.statedepSeasondate = seasonstateData.data;
            console.log('indownloading---->',this.statedepSeasondate)
            return this.regionService.fetchDataFtp(seasonPeriodDate);
          }),
          concatMap(seasonregionData => {
            this.regiondepSeasondate = seasonregionData.data;
            console.log('indownloading---->', this.regiondepSeasondate)
            return this.countryService.fetchDataFtp(data);
          }),
          concatMap(countryData => {
            this.countrydepCurrdate = countryData.data;
            return this.countryService.fetchDataFtp(seasonPeriodDate);
          }),
          concatMap(seasonCountryData => {
            this.countrydepSeasondate = seasonCountryData.data;
            this.downloadPdf();
            return EMPTY;
          }),
        )
      );
    }

    catch (error) {
      console.error('Error fetching data:', error);
    }



    
    // this.stateservice.fetchDataFtp(data).pipe(
    //   concatMap(stateData => {
    //     this.statedepCurrdate = stateData.data;
    //     console.log('indownloading---->',this.statedepCurrdate)
    //     return this.regionService.fetchDataFtp(data);
    //   }),
    //   concatMap(region => {
    //     this.regiondepCurrdate = region.data;
    //     console.log('indownloading---->',this.regiondepCurrdate)
    //     return this.stateservice.fetchDataFtp(seasonPeriodDate); // or any observable to complete the chain
    //   }),

    //   concatMap(seasonstateData => {
    //     this.statedepSeasondate = seasonstateData.data;
    //     console.log('indownloading---->',this.statedepSeasondate)

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


   
  async updateCurrDateDataFromDataEntry(data:any, seasonPeriodDate:any ){
    try{
      await lastValueFrom(
        this.stateservice.fetchData(data).pipe(
          concatMap(stateData => {
            this.statedepCurrdate = stateData.data;
            console.log('indownloading---->',this.statedepCurrdate)
            return this.regionService.fetchData(data);
          }),
          concatMap(region => {
            this.regiondepCurrdate = region.data;
            console.log('indownloading---->',this.regiondepCurrdate)
            return this.stateservice.fetchData(seasonPeriodDate);
          }),
          concatMap(seasonstateData => {
            this.statedepSeasondate = seasonstateData.data;
            console.log('indownloading---->',this.statedepSeasondate)
            return this.regionService.fetchData(seasonPeriodDate);
          }),
          concatMap(seasonregionData => {
            this.regiondepSeasondate = seasonregionData.data;
            console.log('indownloading---->', this.regiondepSeasondate)
            return this.countryService.fetchData(data);
          }),
          concatMap(countryData => {
            this.countrydepCurrdate = countryData.data;
            return this.countryService.fetchData(seasonPeriodDate);
          }),
          concatMap(seasonCountryData => {
            this.countrydepSeasondate = seasonCountryData.data;
            this.downloadPdf();
            return EMPTY;
          }),
        )
      );
    }

    catch (error) {
      console.error('Error fetching data:', error);
    }



    
    // this.stateservice.fetchDataFtp(data).pipe(
    //   concatMap(stateData => {
    //     this.statedepCurrdate = stateData.data;
    //     console.log('indownloading---->',this.statedepCurrdate)
    //     return this.regionService.fetchDataFtp(data);
    //   }),
    //   concatMap(region => {
    //     this.regiondepCurrdate = region.data;
    //     console.log('indownloading---->',this.regiondepCurrdate)
    //     return this.stateservice.fetchDataFtp(seasonPeriodDate); // or any observable to complete the chain
    //   }),

    //   concatMap(seasonstateData => {
    //     this.statedepSeasondate = seasonstateData.data;
    //     console.log('indownloading---->',this.statedepSeasondate)

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


  

  exportAsExcelFile(json: any[], excelFileName: string, columns: any, columns1: any): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);
    
    // Define the range of cells you want to merge
    const startCell = 'C1'; // Start cell for the first merge
    const endCell = 'F1'; // End cell for the first merge
    const startCell1 = 'G1'; // Start cell for the second merge
    const endCell1 = 'J1'; // End cell for the second merge

    // Merge the cells
    worksheet['!merges'] = [
        { s: XLSX.utils.decode_cell(startCell), e: XLSX.utils.decode_cell(endCell) },
        { s: XLSX.utils.decode_cell(startCell1), e: XLSX.utils.decode_cell(endCell1) }
    ];

    // Add the first header row (with merged cells)
    XLSX.utils.sheet_add_aoa(worksheet, [columns1], { origin: 'A1' });

    // Add the second header row
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: 'A2' });

    // Adjust the starting point for the data rows
    XLSX.utils.sheet_add_json(worksheet, json, { origin: 'A3', skipHeader: true });

    // Create the workbook and add the worksheet
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    
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

    console.log(this.data.startDate, this.data.endDate, 'Manu Test');

    const columns1 = ['', '', 
      {
        // content : this.data.startDate==this.data.endDate ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`:`DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`, colSpan:4

        content: this.data.startDate === this.data.endDate 
        ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`
        : `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.getAdjustedEndDate(this.data.startDate, this.data.endDate)}`, 
      colSpan: 4
      },
      {
        content : `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`, colSpan:4
      },
    ]
    const columns1forexcel = ['', '',
    {
      content : this.data.startDate==this.data.endDate ? `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}`:`DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`, colSpan:4
    }, '', '', '',    
    {
      content : `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`, colSpan:4
    }]

    const columns = ['S.No', 'METEOROLOGICAL STATES', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.'];

        
    this.loadTheRows();


    var newArr = this.rows.map((subArr) => {
      return subArr.map((item:any) => {
        console.log('itemmmmmm,', item)
        if (typeof item === 'object' && item.hasOwnProperty('content')) {
          return item.content;
        }
        return item;
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
    const headingText1 = 'STATE-WISE RAINFALL (MM) DISTRIBUTION';
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

    this.addCategoryTable(doc);

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
    const filename = `DISTRIBUTION_STATE_INDIA_cd.pdf`;

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

    const categoryExcelRows: any[][] = [
      [],
      ['CATEGORYWISE NO. OF STATES & % AREA (STATE) OF THE COUNTRY'],
      [],
      ['CATEGORY', dayLabelExcel, '', periodLabelExcel, ''],
      ['', 'NO. OF STATES', 'STATE % AREA OF COUNTRY', 'NO. OF STATES', 'STATE % AREA OF COUNTRY'],
      ...['LE', 'E', 'N', 'D', 'LD', 'NR'].map(cat => [
        catLabelsExcel[cat],
        dayS[cat].count,
        `${dayS[cat].area}%`,
        periodS[cat].count,
        `${periodS[cat].area}%`,
      ]),
    ];

    if(this.isView){
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
    }else{
      setTimeout(()=>{
        doc.save(filename);
        this.exportAsExcelFile(
          [...newArr, ...categoryExcelRows],
          `DISTRICT_RAINFALL_DISTRIBUTION_STATE_INDIA_cd`,
          columns,
          newcolumns1
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
  


  // Standard IMD state area as % of India's total land area (keyed by state_name uppercase)
  private readonly stateAreaPct: Record<string, number> = {
    'RAJASTHAN':                                    10.4,
    'MADHYA PRADESH':                                9.4,
    'MAHARASHTRA':                                   9.4,
    'UTTAR PRADESH':                                 7.4,
    'GUJARAT':                                       6.0,
    'KARNATAKA':                                     5.8,
    'ANDHRA PRADESH':                                4.9,
    'ODISHA':                                        4.6,
    'CHHATTISGARH':                                  4.1,
    'TAMIL NADU':                                    4.0,
    'TELANGANA':                                     3.6,
    'J & K':                                         3.3,
    'LADAKH':                                        3.3,
    'BIHAR':                                         2.9,
    'WEST BENGAL':                                   2.7,
    'ARUNACHAL PRADESH':                             2.5,
    'ASSAM':                                         2.3,
    'JHARKHAND':                                     2.3,
    'HIMACHAL PRADESH':                              1.7,
    'UTTARAKHAND':                                   1.6,
    'PUNJAB':                                        1.5,
    'HARYANA':                                       1.3,
    'KERALA':                                        1.1,
    'MEGHALAYA':                                     0.7,
    'MANIPUR':                                       0.7,
    'MIZORAM':                                       0.6,
    'NAGALAND':                                      0.5,
    'TRIPURA':                                       0.3,
    'SIKKIM':                                        0.2,
    'DELHI':                                         0.2,
    'A & N ISLANDS':                                 0.2,
    'DADRA & NAGAR HAVELI AND DAMAN & DIU':          0.1,
    'GOA':                                           0.1,
    'CHANDIGARH':                                    0.0,
    'LAKSHADWEEP':                                   0.0,
    'PUDUCHERRY':                                    0.0,
  };

  private buildCategoryStats() {
    const cats = ['LE', 'E', 'N', 'D', 'LD', 'NR'] as const;
    type CatKey = typeof cats[number];

    const makeEmpty = (): Record<CatKey, { count: number; area: number }> =>
      Object.fromEntries(cats.map(c => [c, { count: 0, area: 0 }])) as any;

    const day    = makeEmpty();
    const period = makeEmpty();

    const totalArea = Object.values(this.stateAreaPct).reduce((s, a) => s + a, 0);

    for (const item of this.statedepCurrdate) {
      const cat = this.constants.getColorAndCat(item.departure).Cat as CatKey;
      if (cats.includes(cat)) {
        day[cat].count++;
        const name = (item.state_name ?? '').trim().toUpperCase();
        day[cat].area += this.stateAreaPct[name] ?? 0;
      }
    }

    for (const item of this.statedepSeasondate) {
      const cat = this.constants.getColorAndCat(item.departure).Cat as CatKey;
      if (cats.includes(cat)) {
        period[cat].count++;
        const name = (item.state_name ?? '').trim().toUpperCase();
        period[cat].area += this.stateAreaPct[name] ?? 0;
      }
    }

    for (const k of cats) {
      day[k].area    = Math.round((day[k].area    / totalArea) * 100);
      period[k].area = Math.round((period[k].area / totalArea) * 100);
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
      content: 'CATEGORYWISE NO. OF STATES & % AREA (STATE) OF THE COUNTRY',
      colSpan: 5,
      styles: { halign: 'center' as const, fontStyle: 'bold' as const },
    }];

    const header1 = [
      { content: 'CATEGORY',    rowSpan: 2, styles: { halign: 'center' as const, valign: 'middle' as const } },
      { content: dayLabel,      colSpan: 2, styles: { halign: 'center' as const } },
      { content: periodLabel,   colSpan: 2, styles: { halign: 'center' as const } },
    ];

    const header2 = [
      { content: 'NO. OF\nSTATES',                  styles: { halign: 'center' as const } },
      { content: 'STATE\n% AREA OF COUNTRY',         styles: { halign: 'center' as const } },
      { content: 'NO. OF\nSTATES',                  styles: { halign: 'center' as const } },
      { content: 'STATE\n% AREA OF COUNTRY',         styles: { halign: 'center' as const } },
    ];

    const catLabels: Record<string, string> = {
      LE: 'LARGE EXCESS', E: 'EXCESS', N: 'NORMAL',
      D: 'DEFICIENT', LD: 'LARGE DEFICIENT', NR: 'NO RAIN',
    };

    const dayS    = stats.day    as Record<string, { count: number; area: number }>;
    const periodS = stats.period as Record<string, { count: number; area: number }>;

    const rows = ['LE', 'E', 'N', 'D', 'LD', 'NR'].map(cat => [
      catLabels[cat],
      dayS[cat].count,
      `${dayS[cat].area}%`,
      periodS[cat].count,
      `${periodS[cat].area}%`,
    ]);

    const startY = (doc as any).lastAutoTable.finalY + 10;

    autoTable(doc, {
      head: [titleRow, header1, header2],
      body: rows,
      startY,
      margin: { left: 10 },
      styles: { fontSize: 7, halign: 'center' },
      headStyles: { halign: 'center', fillColor: [200, 220, 255] },
      didDrawCell: function (data: { cell: { x: number; y: number; width: any; height: any } }) {
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
        doc.setDrawColor(0);
      },
    });
  }

  private loadTheRows() {
    // Group by Subdivision and then State
    this.rows = []
    console.log('started', this.rows)
    const groupedByRegion = this.statedepCurrdate.reduce((acc, item) => {
        const region = item.region_code;
        const state = item.state_code;

        if (!acc[region]) {
            acc[region] = {};
        }

        if (!acc[region][state]) {
            acc[region][state] = [];
        }
        
        acc[region][state].push(item);
        return acc;
    }, {});

    // Sort subdivisions
    // const regionNames = this.regiondepCurrdate.map((x:any)=> {
    //   [x.r_code, x.name]
    // })
    // const sortedRegions = Object.keys(groupedByRegion).sort((a, b) => a.localeCompare(b));
    // console.group('heygeyye', sortedRegions)


    const regionNames = this.regiondepCurrdate.map((x: any) => [x.r_code, x.name]);
    const codeToRegionNameMap = new Map(regionNames.map(([code, name]) => [code, name]));

    // Sort the groupedByRegion keys based on the region names
    const sortedRegions = Object.keys(groupedByRegion).sort((a, b) => {
        const nameA = codeToRegionNameMap.get(a) || '';
        const nameB = codeToRegionNameMap.get(b) || '';
        return nameA.localeCompare(nameB);
    });

    console.group('heygeyye', sortedRegions);


    let subdivColorCode = [72, 209, 204];
    let stateColorCode = [255,255,255];

    for (const regionCode of sortedRegions) {
        // Find subdivision data
        const regionDate = this.regiondepCurrdate.find(region => regionCode === region.r_code);
        const regionSeason = this.regiondepSeasondate.find(region => regionCode === region.r_code);

        const DateCat = this.constants.getColorAndCat(regionDate.departure);
        const SeasonCat = this.constants.getColorAndCat(regionSeason.departure);

        // Add Subdivision Row
        this.rows.push([
            { content: '', styles: { fillColor: subdivColorCode } },
            { content: `REGION : ${regionDate.name.toUpperCase()}`, styles: { fillColor: subdivColorCode } },
            { content: regionDate.actual_rainfall != null ? this.constants.trimToOneDecimals(regionDate.actual_rainfall) : ' ', styles: { fillColor: subdivColorCode } },
            { content: this.constants.trimToOneDecimals(parseFloat(regionDate.rainfall_normal_value)), styles: { fillColor: subdivColorCode } },
            { content: regionDate.departure != null ? this.constants.trimToZeroDecimals(regionDate.departure) : ' ', styles: { fillColor: subdivColorCode } },
            { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
            { content: regionSeason.actual_rainfall != null ? this.constants.trimToOneDecimals(regionSeason.actual_rainfall) : ' ', styles: { fillColor: subdivColorCode } },
            { content: this.constants.trimToOneDecimals(parseFloat(regionSeason.rainfall_normal_value)), styles: { fillColor: subdivColorCode } },
            { content: regionSeason.departure != null ? this.constants.trimToZeroDecimals(regionSeason.departure) : ' ', styles: { fillColor: subdivColorCode } },
            { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } }
        ]);

        // Process States within each Subdivision
        const states = groupedByRegion[regionCode];
        const sortedStates = Object.keys(states).sort((a, b) => a.localeCompare(b));

        let index = 1;
        for (const stateCode of sortedStates) {
            // Find state data
            const stateDate = this.statedepCurrdate.find(state => stateCode == state.state_code.toString());
            const stateSeason = this.statedepSeasondate.find(state => stateCode == state.state_code.toString());

            const DateCat = this.constants.getColorAndCat(stateDate.departure);
            const SeasonCat = this.constants.getColorAndCat(stateSeason.departure);

            // Add State Row
            this.rows.push([
                { content: index++, styles: { fillColor: stateColorCode } },
                { content: `${stateDate.state_name}`, styles: { fillColor: stateColorCode } },
                { content: stateDate.actual_state_rainfall != null ? this.constants.trimToOneDecimals(stateDate.actual_state_rainfall) : ' ', styles: { fillColor: stateColorCode } },
                { content: this.constants.trimToOneDecimals(parseFloat(stateDate.rainfall_normal_value)), styles: { fillColor: stateColorCode } },
                { content: stateDate.departure != null ? this.constants.trimToZeroDecimals(stateDate.departure) : ' ', styles: { fillColor: stateColorCode } },
                { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
                { content: stateSeason.actual_state_rainfall != null ? this.constants.trimToOneDecimals(stateSeason.actual_state_rainfall) : ' ', styles: { fillColor: stateColorCode } },
                { content: this.constants.trimToOneDecimals(parseFloat(stateSeason.rainfall_normal_value)), styles: { fillColor: stateColorCode } },
                { content: stateSeason.departure != null ? this.constants.trimToZeroDecimals(stateSeason.departure) : ' ', styles: { fillColor: stateColorCode } },
                { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } }
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

    console.log(this.rows)
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