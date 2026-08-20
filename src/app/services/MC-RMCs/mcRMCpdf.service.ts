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
export class MCRMCDownloadStatistics {

  private baseUrl: string = environment.baseUrl;
  isView: boolean = false;

  districtdepCurrdate: any[] = [];
  districtdepSeasondate: any[] = [];

  rows: any[][] = [];
  data: any;
  seasonPeriodDate: any;
  selectedMCName: any;
  mcDistricts: any; // Can be Set or Array

  constructor(private http: HttpClient, private constants: Constants) {}

  convertToIndianDateFormat = (dateString: string) => dateString.split('-').reverse().join('-');

  async updateanddownloadpdf(mcRmcName: any) {
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    this.mcDistricts = mcRmcName;
    await this.updateCurrDateData(this.data, this.seasonPeriodDate, mcRmcName);
  }

  async updateanddownloadpdfFromDataEntry(mcRmcName: any) {
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    this.mcDistricts = mcRmcName;
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate, mcRmcName);
  }

  // View-only variants: populate this.rows / this.data / this.seasonPeriodDate
  // for the on-page right-hand stats panel and generate NO files.
  //
  // "View" is threaded through as an explicit `viewOnly` argument rather than
  // via the shared this.isView field. This service is providedIn: 'root', so
  // that field is shared state — and the map components call loadStats() from
  // inside loadGeoJSON()'s HTTP callback, which runs several times per page
  // load. With a consumable flag, two overlapping view calls raced: the first
  // reset it, the second then saw it as false and silently saved the PDF and
  // Excel on refresh. A parameter is per-call, so it cannot race.
  async updateandViewpdf(mcRmcName: any) {
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    this.mcDistricts = mcRmcName;
    await this.updateCurrDateData(this.data, this.seasonPeriodDate, mcRmcName, true);
  }

  async updateandViewpdfFromDataEntry(mcRmcName: any) {
    const currDate = new Date();
    this.data = this.constants.getRangeFromDateRange();
    this.seasonPeriodDate = this.constants.getCurrentMonthSeasonFromAndTodate(currDate);
    this.mcDistricts = mcRmcName;
    await this.updateCurrDateDataFromDataEntry(this.data, this.seasonPeriodDate, mcRmcName, true);
  }

  async updateCurrDateData(data: any, seasonPeriodDate: any, mcRmcName: any, viewOnly: boolean = false) {
    try {
      this.selectedMCName = mcRmcName;
      
      await lastValueFrom(
        this.fetchDistrictData(data).pipe(
          concatMap(districtData => {
            console.log('All districts data:', districtData.data);
            console.log('MC Districts to filter:', this.mcDistricts);
            
            // Filter district data based on MC districts
            this.districtdepCurrdate = this.filterDistrictsByMC(districtData.data);
            console.log('Filtered MC districts current date:', this.districtdepCurrdate);
            
            return this.fetchDistrictData(seasonPeriodDate);
          }),
          concatMap(seasonDistrictData => {
            // Filter season district data based on MC districts
            this.districtdepSeasondate = this.filterDistrictsByMC(seasonDistrictData.data);
            console.log('Filtered MC districts season date:', this.districtdepSeasondate);

            this.downloadPdf(viewOnly);
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error('Error fetching MC district data:', error);
    }
  }

  async updateCurrDateDataFromDataEntry(data: any, seasonPeriodDate: any, mcRmcName: any, viewOnly: boolean = false) {
    try {
      this.selectedMCName = mcRmcName;
      
      await lastValueFrom(
        this.fetchDistrictDataFromDataEntry(data).pipe(
          concatMap(districtData => {
            console.log('All districts data from data entry:', districtData.data);
            console.log('MC Districts to filter:', this.mcDistricts);
            
            // Filter district data based on MC districts
            this.districtdepCurrdate = this.filterDistrictsByMC(districtData.data);
            console.log('Filtered MC districts current date from data entry:', this.districtdepCurrdate);
            
            return this.fetchDistrictDataFromDataEntry(seasonPeriodDate);
          }),
          concatMap(seasonDistrictData => {
            // Filter season district data based on MC districts
            this.districtdepSeasondate = this.filterDistrictsByMC(seasonDistrictData.data);
            console.log('Filtered MC districts season date from data entry:', this.districtdepSeasondate);

            this.downloadPdf(viewOnly);
            return EMPTY;
          })
        )
      );
    } catch (error) {
      console.error('Error fetching MC district data from data entry:', error);
    }
  }

  // Enhanced filtering method with better logging
  private filterDistrictsByMC(allDistricts: any[]): any[] {
    console.log('Starting filter with districts count:', allDistricts.length);
    console.log('MC Districts filter set:', this.mcDistricts);

    if (!this.mcDistricts) {
      console.log('No MC districts filter provided, returning all districts');
      return allDistricts;
    }

    // Convert mcDistricts to array if it's a Set
    let mcDistrictsArray: any[];
    if (this.mcDistricts instanceof Set) {
      mcDistrictsArray = Array.from(this.mcDistricts);
    } else if (Array.isArray(this.mcDistricts)) {
      mcDistrictsArray = this.mcDistricts;
    } else {
      console.log('MC Districts is not Set or Array, returning all districts');
      return allDistricts;
    }

    console.log('MC Districts as array:', mcDistrictsArray);

    if (mcDistrictsArray.length === 0) {
      console.log('MC districts array is empty, returning all districts');
      return allDistricts;
    }

    // Filter based on district_code matching
    const filtered = allDistricts.filter(district => {
      const districtCode = district.district_code;
      const isIncluded = mcDistrictsArray.includes(districtCode) || 
                        mcDistrictsArray.includes(districtCode.toString()) ||
                        mcDistrictsArray.includes(parseInt(districtCode));
      
      if (isIncluded) {
        console.log(`Including district: ${district.district_name} (${districtCode})`);
      }
      
      return isIncluded;
    });

    console.log(`Filtered ${filtered.length} districts out of ${allDistricts.length} total districts`);
    return filtered;
  }

  fetchDistrictDataFromDataEntry(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchDistrictData`;
    return this.http.post<any>(url, data);
  }

  fetchDistrictData(data: any): Observable<any> {
    const url = `${this.baseUrl}/api/v1/fetchDistrictDataFtp`;
    return this.http.post<any>(url, data);
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
      { v: 'MC/RMC DISTRICT RAINFALL DISTRIBUTION', t: 's', s: { font: { bold: true, sz: 13, color: { rgb: '993300' }, underline: true }, alignment: { horizontal: 'center' as const, vertical: 'middle' as const } } },
      ...Array.from({ length: 9 }, () => blank()),
    ];

    // Row 2: blank spacer
    const row2 = Array.from({ length: 10 }, () => blank());

    // Row 3: outer border only on DAY/PERIOD groups (no inner vertical lines)
    const row3 = [
      styledCell('S.No.'),
      styledCell('MC/RMC DISTRICTS', 'left'),
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
      styledCell('DISTRICT (NAME)', 'left'),
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
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }

  public async downloadPdf(viewOnly: boolean = false) {
    // On-page stats panel: this.rows is all the caller needs, so build it and
    // stop. Deliberately ahead of the empty-districts alert() below — the
    // panel refreshes on every page load, and it must never pop an alert or
    // save a file without the user pressing "Statistics Download".
    if (viewOnly) {
      this.loadTheRows();
      return;
    }

    console.log('Generating MC/RMC Districts PDF', this.data.startDate, this.data.endDate);
    console.log('Rows to be included in PDF:', this.districtdepCurrdate.length);

    // If no districts are filtered, show a message
    if (this.districtdepCurrdate.length === 0) {
      console.error('No districts found for MC/RMC filter');
      alert('No districts found for the selected MC/RMC filter');
      return;
    }

    const columns1 = ['', '', 
      {
        content: this.data.startDate === this.data.endDate ? 
          `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}` : 
          `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`, 
        colSpan: 4
      },
      {
        content: `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`, 
        colSpan: 4
      }
    ];

    const columns1forexcel = ['', '',
      {
        content: this.data.startDate === this.data.endDate ? 
          `DAY: ${this.convertToIndianDateFormat(this.data.startDate)}` : 
          `DAY: ${this.convertToIndianDateFormat(this.data.startDate)} to ${this.convertToIndianDateFormat(this.data.endDate)}`, 
        colSpan: 4
      }, '', '', '',    
      {
        content: `PERIOD: ${this.convertToIndianDateFormat(this.seasonPeriodDate.startDate)} to ${this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)}`, 
        colSpan: 4
      }
    ];

    const columns = ['S.No', 'MC/RMC DISTRICTS', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.', 'ACTUAL(mm)', 'NORMAL(mm)', '%DEP.', 'CAT.'];

    this.loadTheRows();

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
      return subArr.map((item: any, colIdx: number) => {
        let content = typeof item === 'object' && item.hasOwnProperty('content') ? item.content : item;
        if ((colIdx === 4 || colIdx === 8) && content !== '' && content !== ' ' && content != null) {
          content = `${content}%`;
        }
        const cellFill  = item?.styles?.fillColor;
        const isHexFill = typeof cellFill === 'string' && cellFill.startsWith('#');
        const hAlign    = colIdx === 1 ? 'left' as const : 'center' as const;
        const fillHex = isHexFill ? cellFill.replace('#', '').toUpperCase() : 'FFFFFF';
        const cellStyle = { fill: { fgColor: { rgb: fillHex } }, border: thinBlack, font: { bold: false, sz: 9, color: { rgb: '000000' } }, alignment: { horizontal: hAlign, vertical: 'middle' as const } };
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
    const headingText1 = 'MC/RMC DISTRICTS RAINFALL DISTRIBUTION';
    doc.text(headingText, marginLeft + 25, marginTop + 8);
    doc.text(headingText1, marginLeft + 90, marginTop + 28);
    
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

    const filename = `DISTRIBUTION_MCRMC_DISTRICTS_INDIA_cd.pdf`;

    if (this.isView) {
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl);
    } else {
      setTimeout(() => {
        doc.save(filename);
        this.exportAsExcelFile(
          newArr,
          `MCRMC_DISTRICTWISE_RAINFALL_DISTRIBUTION`,
          this.convertToIndianDateFormat(this.data.startDate),
          this.convertToIndianDateFormat(this.data.endDate),
          this.convertToIndianDateFormat(this.seasonPeriodDate.startDate),
          this.convertToIndianDateFormat(this.seasonPeriodDate.endDate)
        );
      }, 3000);
    }
  }

  private loadTheRows() {
    this.rows = [];
    console.log('Loading rows with districts:', this.districtdepCurrdate.length);

    const sortedMCDistricts = this.districtdepCurrdate.sort((a: any, b: any) => 
      a.district_name.localeCompare(b.district_name)
    );

    for (let i = 0; i < sortedMCDistricts.length; i++) {
      const districtDate = sortedMCDistricts[i];
      const districtSeason = this.districtdepSeasondate.find(district => 
        district.district_code == districtDate.district_code
      );

      const DateCat = this.getColorAndCat(districtDate.departure);
      const SeasonCat = this.getColorAndCat(districtSeason?.departure);

      this.rows.push([
        i + 1,
        districtDate.district_name,
        { content: districtDate.actual_rainfall != null ? parseFloat(districtDate.actual_rainfall).toFixed(1) : ' ', xlRaw: districtDate.actual_rainfall },
        { content: parseFloat(districtDate.normal_rainfall).toFixed(1), xlRaw: districtDate.normal_rainfall },
        { content: districtDate.departure != null ? Math.round(parseFloat(districtDate.departure)) : ' ', xlRaw: districtDate.departure },
        { content: DateCat.Cat, styles: { fillColor: DateCat.color } },
        { content: districtSeason?.actual_rainfall != null ? parseFloat(districtSeason.actual_rainfall).toFixed(1) : ' ', xlRaw: districtSeason?.actual_rainfall },
        { content: parseFloat(districtSeason?.normal_rainfall || '0').toFixed(1), xlRaw: districtSeason?.normal_rainfall ?? 0 },
        { content: districtSeason?.departure != null ? Math.round(parseFloat(districtSeason.departure)) : ' ', xlRaw: districtSeason?.departure },
        { content: SeasonCat.Cat, styles: { fillColor: SeasonCat.color } }
      ]);
    }
    
    console.log('Generated rows:', this.rows.length);
  }

  getColorAndCat(departure: any) {
    let color = '';
    let Cat = '';

    if (departure == null) {
      return {
        color: '#c0c0c0',
        Cat: 'ND'
      };
    }

    const dep = parseFloat(departure);

    if (dep >= 60) {
      Cat = 'LE';
      color = '#0096ff';
    } else if (dep >= 20 && dep <= 59) {
      Cat = 'E';
      color = '#32c0f8';
    } else if (dep >= -19 && dep <= 19) {
      Cat = 'N';
      color = '#00cd5b';
    } else if (dep >= -59 && dep <= -20) {
      Cat = 'D';
      color = '#ff2700';
    } else if (dep >= -99 && dep <= -60) {
      Cat = 'LD';
      color = '#ffff20';
    } else if (dep === -100) {
      Cat = 'NR';
      color = '#ffffff';
    }

    return {
      color: color,
      Cat: Cat
    };
  }
}
