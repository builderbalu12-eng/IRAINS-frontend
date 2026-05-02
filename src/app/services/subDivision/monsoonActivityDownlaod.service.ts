import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY, Observable, concatMap, lastValueFrom } from "rxjs";
import { environment } from "src/environment/environment";
import { Constants } from "../constants";
import autoTable from "jspdf-autotable"; // Note: import as default
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import { RegionService } from "../region/region.service";
import { SubdivisionService } from "./subDivision.service";

@Injectable({
  providedIn: "root",
})
export class MonsoonActivityService {
  private baseUrl: string = environment.baseUrl;
  isView: boolean = false;

  subdivdepCurrdate: any[] = [];
  regiondepCurrdate: any[] = [];

  subdivdepSeasondate: any[] = [];
  regiondepSeasondate: any[] = [];

  rows: any[][] = [];
  data: any;
  seasonPeriodDate: any;

  constructor(
    private http: HttpClient,
    private constants: Constants,
    private regionService: RegionService,
    private subdivservice: SubdivisionService
  ) {}

  saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const EXCEL_EXTENSION = ".xlsx";
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE,
    });
    FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
  }

  convertToIndianDateFormat = (dateString: string) =>
    dateString.split("-").reverse().join("-");

 
  async downloadMonsoonActivityPdf(tableData: any[], selectedDate: string) {
    const formattedDate = this.convertToIndianDateFormat(selectedDate);

    // Header rows
    // const head1 = [
    //   "",
    //   `Subdivision-wise Monsoon Activity on ${formattedDate}`,
    //   "", "", "", "", "", ""
    // ];

    const columns = [
      "S.No",
      "Subdivision",
      "Activity",
    //   "Spatial Distribution",
      "Actual (mm)",
      "Normal (mm)",
      "Ratio (R)",
    //   "Status"
    ];

    // Table body
    const body = tableData.map((item, index) => [
      index + 1,
      item.name || "",
      item.activity || "No Data",
    //   item.spatial || "-",
      item.avg_actual != null ? Number(item.avg_actual).toFixed(1) : "-",
      item.normal != null ? Number(item.normal).toFixed(1) : "-",
      item.R != null ? Number(item.R).toFixed(2) : "-",
    //   item.reason || "-"
    ]);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const imgWidth = 15;

    // Add logos
    doc.addImage("/assets/images/IMDlogo_Ipart-iris.png", "PNG", margin, margin, imgWidth, 20);
    doc.addImage("/assets/images/IMD150(BGR).png", "PNG", pageWidth - imgWidth - margin, margin, imgWidth, 20);

    // Titles
    doc.setFontSize(14);
    doc.text("India Meteorological Department, New Delhi", pageWidth / 2, margin + 8, { align: "center" });

    doc.setFontSize(12);
    doc.text("MONSOON ACTIVITY MAP - SUBDIVISION WISE STATISTICS", pageWidth / 2, margin + 16, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Date: ${formattedDate}`, pageWidth / 2, margin + 22, { align: "center" });

    // Main Table
    autoTable(doc, {
      head: [columns],
      body: body,
      startY: margin + 30,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [255, 165, 0], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [240, 248, 255] },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "left" },
        2: { halign: "center", fontStyle: "bold" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
        6: { halign: "center" },
        7: { halign: "center" }
      },
      didParseCell: (data: any) => {
        // Color the Activity column
        if (data.column.index === 2 && data.cell.text.length > 0) {
          const activity = data.cell.text[0];
          switch (activity) {
            case "Vigorous":
              data.cell.styles.fillColor = [255, 0, 0];
              data.cell.styles.textColor = [255, 255, 255];
              break;
            case "Active":
              data.cell.styles.fillColor = [255, 153, 0];
              data.cell.styles.textColor = [0, 0, 0];
              break;
            case "Normal":
              data.cell.styles.fillColor = [0, 255, 0];
              data.cell.styles.textColor = [255, 255, 255];
              break;
            case "Weak":
              data.cell.styles.fillColor = [255, 255, 0];
              data.cell.styles.textColor = [0, 0, 0];
              break;
            case "Subdued":
              data.cell.styles.fillColor = [153, 153, 153];
              data.cell.styles.textColor = [255, 255, 255];
              break;
            default:
              data.cell.styles.fillColor = [255, 165, 0];
              data.cell.styles.textColor = [0, 0, 0];
              break;
          }
        }
      }
    });

    // Legend Section
    const legendStartY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.text("Legend:", margin, legendStartY);

    const legendBody = [
      ["Vigorous", ""],
      ["Active", ""],
      ["Normal", ""],
      ["Weak", ""],
      ["Subdued", ""],
      ["No Data", ""]
    ];

    autoTable(doc, {
      body: legendBody,
      startY: legendStartY + 6,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 60, halign: "left" },
        1: { cellWidth: 30, halign: "center" }
      },
      didParseCell: (data: any) => {
        if (data.column.index === 1) {
          const colors: [number, number, number][] = [
            [255, 0, 0],       // Vigorous
            [255, 153, 0],     // Active
            [0, 255, 0],       // Normal
            [255, 255, 0],     // Weak
            [153, 153, 153],  // Subdued
            [192, 192, 192]   // No Data
          ];
          data.cell.styles.fillColor = colors[data.row.index];
          data.cell.text = ["■"]; // Solid square symbol
          data.cell.styles.textColor = [0, 0, 0];
        }
      }
    });

    // Save PDF
    const pdfFilename = `Monsoon_Activity_Subdivisions_${selectedDate}.pdf`;
    doc.save(pdfFilename);

    // Export Excel
    // this.exportMonsoonActivityAsExcel(tableData, selectedDate);
  }

  async downloadMonsoonActivityDistrictPdf(tableData: any[], selectedDate: string) {
    const formattedDate = this.convertToIndianDateFormat(selectedDate);

    const columns = ["S.No", "District", "Activity", "Actual (mm)", "Normal (mm)", "Ratio (R)"];

    const body = tableData.map((item, index) => [
      index + 1,
      item.name || "",
      item.activity || "No Data",
      item.avg_actual != null ? Number(item.avg_actual).toFixed(1) : "-",
      item.normal != null ? Number(item.normal).toFixed(1) : "-",
      item.R != null ? Number(item.R).toFixed(2) : "-",
    ]);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const imgWidth = 15;

    doc.addImage("/assets/images/IMDlogo_Ipart-iris.png", "PNG", margin, margin, imgWidth, 20);
    doc.addImage("/assets/images/IMD150(BGR).png", "PNG", pageWidth - imgWidth - margin, margin, imgWidth, 20);

    doc.setFontSize(14);
    doc.text("India Meteorological Department, New Delhi", pageWidth / 2, margin + 8, { align: "center" });
    doc.setFontSize(12);
    doc.text("MONSOON ACTIVITY MAP - DISTRICT WISE STATISTICS", pageWidth / 2, margin + 16, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Date: ${formattedDate}`, pageWidth / 2, margin + 22, { align: "center" });

    autoTable(doc, {
      head: [columns],
      body: body,
      startY: margin + 30,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [255, 165, 0], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [240, 248, 255] },
      columnStyles: {
        0: { halign: "center" }, 1: { halign: "left" }, 2: { halign: "center", fontStyle: "bold" },
        3: { halign: "center" }, 4: { halign: "center" }, 5: { halign: "center" }
      },
      didParseCell: (data: any) => {
        if (data.column.index === 2 && data.cell.text.length > 0) {
          const activity = data.cell.text[0];
          const colorMap: { [k: string]: [number, number, number] } = {
            Vigorous: [255, 0, 0], Active: [255, 153, 0], Normal: [0, 255, 0],
            Weak: [255, 255, 0], Subdued: [153, 153, 153]
          };
          if (colorMap[activity]) {
            data.cell.styles.fillColor = colorMap[activity];
            data.cell.styles.textColor = activity === 'Active' || activity === 'Weak' ? [0, 0, 0] : [255, 255, 255];
          }
        }
      }
    });

    doc.save(`Monsoon_Activity_Districts_${selectedDate}.pdf`);
  }

  private exportMonsoonActivityAsExcel(tableData: any[], selectedDate: string) {
    const formattedDate = this.convertToIndianDateFormat(selectedDate);

    const excelData = tableData.map((item, index) => ({
      "S.No": index + 1,
      Subdivision: item.name || "",
      Activity: item.activity || "No Data",
      "Spatial Distribution": item.spatial || "-",
      "Actual (mm)": item.avg_actual != null ? Number(item.avg_actual).toFixed(1) : "-",
      "Normal (mm)": item.normal != null ? Number(item.normal).toFixed(1) : "-",
      "Ratio (R)": item.R != null ? Number(item.R).toFixed(2) : "-",
      Status: item.reason || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Add title rows above the table
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["India Meteorological Department, New Delhi"],
        ["MONSOON ACTIVITY MAP - SUBDIVISION WISE STATISTICS"],
        [`Date: ${formattedDate}`],
        [] // empty row
      ],
      { origin: "A1" }
    );

    // Add table data starting from row 5
    XLSX.utils.sheet_add_json(worksheet, excelData, { origin: "A5", skipHeader: false });

    const workbook = { Sheets: { "Monsoon Activity": worksheet }, SheetNames: ["Monsoon Activity"] };
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    const excelFilename = `Monsoon_Activity_Subdivisions_${selectedDate}.xlsx`;
    this.saveAsExcelFile(excelBuffer, excelFilename);
  }
}