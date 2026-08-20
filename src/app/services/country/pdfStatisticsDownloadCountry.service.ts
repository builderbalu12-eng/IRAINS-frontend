import { CalculationsModeService } from 'src/app/services/calculationsMode.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, concatMap, lastValueFrom } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Constants } from '../constants';
import autoTable, { Column } from 'jspdf-autotable';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx-js-style';
import * as FileSaver from 'file-saver';
import { RegionService } from '../region/region.service';
import { CountryService } from './country.service';


@Injectable({
  providedIn: 'root'
})

export class CountryDownloadStatistics {

  private baseUrl: string = environment.baseUrl;
  isView : boolean = false;

  countrydepCurrdate: any[] = [];
  countrydepSeasondate: any[] = [];

  rows :any[][] = [];
  data: any;
  seasonPeriodDate: any;

  constructor(
    private calcMode: CalculationsModeService,private http: HttpClient, private constants: Constants, private counrtryService : CountryService) {
  }

  convertToIndianDateFormat = (dateString: string) => dateString.split('-').reverse().join('-');

  async updateanddownloadpdf(){
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    await this.updateCurrDateData(this.data, this.seasonPeriodDate)
  }


  async updateandViewpdf(){
    this.isView = true
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










  


  async updateCurrDateData(data:any, seasonPeriodDate:any ){

    try{
      await lastValueFrom(
        this.counrtryService.fetchDataFtp(data).pipe(
          concatMap(country => {
            this.countrydepCurrdate = country.data;
            console.log('indownloading---->',this.countrydepCurrdate)
            return this.counrtryService.fetchDataFtp(seasonPeriodDate);
          }),
    
          concatMap(seasoncountryData => {
            this.countrydepSeasondate = seasoncountryData.data;
            console.log('indownloading---->', this.countrydepSeasondate)
            this.downloadPdf()
            return EMPTY
          }),
    
        )
      )
    } catch (error) {
        console.error('Error fetching data:', error);
    }




    // this.counrtryService.fetchDataFtp(data).pipe(
    //   concatMap(country => {
    //     this.countrydepCurrdate = country.data;
    //     console.log('indownloading---->',this.countrydepCurrdate)
    //     return this.counrtryService.fetchDataFtp(seasonPeriodDate);
    //   }),

    //   concatMap(seasoncountryData => {
    //     this.countrydepSeasondate = seasoncountryData.data;
    //     console.log('indownloading---->', this.countrydepSeasondate)
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
        (this.calcMode.isAwsEnabled ? this.counrtryService.fetchDataWithAWS(data) : this.counrtryService.fetchData(data)).pipe(
          concatMap(country => {
            this.countrydepCurrdate = country.data;
            console.log('indownloading---->',this.countrydepCurrdate)
            return (this.calcMode.isAwsEnabled ? this.counrtryService.fetchDataWithAWS(seasonPeriodDate) : this.counrtryService.fetchData(seasonPeriodDate));
          }),
    
          concatMap(seasoncountryData => {
            this.countrydepSeasondate = seasoncountryData.data;
            console.log('indownloading---->', this.countrydepSeasondate)
            this.downloadPdf()
            return EMPTY
          }),
    
        )
      )
    } catch (error) {
        console.error('Error fetching data:', error);
    }




    // this.counrtryService.fetchDataFtp(data).pipe(
    //   concatMap(country => {
    //     this.countrydepCurrdate = country.data;
    //     console.log('indownloading---->',this.countrydepCurrdate)
    //     return this.counrtryService.fetchDataFtp(seasonPeriodDate);
    //   }),

    //   concatMap(seasoncountryData => {
    //     this.countrydepSeasondate = seasoncountryData.data;
    //     console.log('indownloading---->', this.countrydepSeasondate)
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
      { v: 'COUNTRY RAINFALL DISTRIBUTION', t: 's', s: { font: { bold: true, sz: 13, color: { rgb: '993300' }, underline: true }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } },
      ...Array.from({ length: 9 }, () => blank()),
    ];

    // Row 2: blank spacer
    const row2 = Array.from({ length: 10 }, () => blank());

    // Row 3: outer border only on DAY/PERIOD groups (no inner vertical lines)
    const row3 = [
      styledCell('S.No.'),
      styledCell('COUNTRY', 'left'),
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
      styledCell('COUNTRY NAME', 'left'),
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
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },   // COUNTRY NAME B4:B5
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
    
    const columns = ['S.No', 'COUNTRY', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.'];

    this.loadTheRows();

    if (this.isView) {
      // On-page table view: data is already populated on this.rows /
      // this.data / this.seasonPeriodDate for the component to read —
      // skip PDF/Excel generation entirely.
      this.isView = false;
      return;
    }

    const thinBlack = {
      top:    { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left:   { style: 'thin', color: { rgb: '000000' } },
      right:  { style: 'thin', color: { rgb: '000000' } },
    };

    var newArr: any[][] = this.rows.map((subArr) => {
      return subArr.map((item: any, colIdx: number) => {
        let content = typeof item === 'object' && item.hasOwnProperty('content') ? item.content : item;
        if ((colIdx === 4 || colIdx === 8) && content !== '' && content !== ' ' && content != null) {
          content = `${content}%`;
        }
        const cellFill  = item?.styles?.fillColor;
        const isHexFill = typeof cellFill === 'string' && cellFill.startsWith('#');
        const fillHex   = isHexFill ? cellFill.replace('#', '').toUpperCase() : 'FFFFFF';
        const hAlign    = colIdx === 1 ? 'left' as const : 'center' as const;
        const cellStyle = {
          fill: { fgColor: { rgb: fillHex } },
          border: thinBlack,
          font: { bold: true, sz: 9, color: { rgb: '000000' } },
          alignment: { horizontal: hAlign, vertical: 'middle' as const },
        };
        const isDep = colIdx === 4 || colIdx === 8;
        const numeric = this.constants.excelNumericCell(item, isDep ? 0 : 1);
        if (numeric) return { ...numeric, s: cellStyle };
        return { v: String(content ?? ''), t: 's', s: cellStyle };
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
    const headingText1 = 'COUNTRY RAINFALL DISTRIBUTION';
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
    const filename = `DISTRIBUTION_COUNTRY_INDIA_cd.pdf`;


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
        this.exportAsExcelFile(newArr, `COUNTRY_RAINFALL_DISTRIBUTION_INDIA_cd`, dayStart, dayEnd, periodStart, periodEnd);
      },3000)
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

    this.rows = []

    let countryColorCode = [255,255,255];

    let index = 1;

        // Find subdivision data
    const countryDate = this.countrydepCurrdate[0];
    const countrySeason = this.countrydepSeasondate[0];

    const DateCat = this.constants.getColorAndCat(countryDate.departure);
    const SeasonCat = this.constants.getColorAndCat(countrySeason.departure);

    // Add Subdivision Row
    this.rows.push([
        { content: index++, styles: { fillColor: countryColorCode } },
        { content: `${countryDate.name.toUpperCase()}`, styles: { fillColor: countryColorCode } },
        { content: countryDate.actual_rainfall != null ? this.constants.trimToOneDecimals(countryDate.actual_rainfall) : ' ', xlRaw: countryDate.actual_rainfall, styles: { fillColor: countryColorCode } },
        { content: countryDate.rainfall_normal_value, xlRaw: countryDate.rainfall_normal_value, styles: { fillColor: countryColorCode } },
        { content: countryDate.departure != null ? this.constants.trimToZeroDecimals(countryDate.departure) : ' ', xlRaw: countryDate.departure, xlPct: true, styles: { fillColor: countryColorCode } },
        { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
        { content: countrySeason.actual_rainfall != null ? this.constants.trimToOneDecimals(countrySeason.actual_rainfall) : ' ', xlRaw: countrySeason.actual_rainfall, styles: { fillColor: countryColorCode } },
        { content: countrySeason.rainfall_normal_value, xlRaw: countrySeason.rainfall_normal_value, styles: { fillColor: countryColorCode } },
        { content: countrySeason.departure != null ? this.constants.trimToZeroDecimals(countrySeason.departure) : ' ', xlRaw: countrySeason.departure, xlPct: true, styles: { fillColor: countryColorCode } },
        { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } }
    ]);
    

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