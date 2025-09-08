import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { SpatialDistributionService } from "../services/spatialDistribution/spatial-distribution.service";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

@Component({
  selector: "app-spatial-table",
  templateUrl: "./spatial-table.component.html",
  styleUrls: ["./spatial-table.component.css"],
})
export class SpatialTableComponent implements OnInit {
  displayedColumns: string[] = [
    "subdivision_name",
    "total_stations",
    "station_reported_rainfall",
    "percentage",
    "category",
  ];
  dataSource = new MatTableDataSource<any>([]);
  loading = true;

  // 🔹 Single-day
  selectedDate: string = "";

  // 🔹 Period
  isPeriodMode: boolean = false;
  startDate: string = "";
  endDate: string = "";
  originalData: any[] = [];
  private categorySorted = false; // toggle flag

  // Category sorting order
  private categoryOrder: Record<string, number> = {
    Isolated: 1,
    Scattered: 2,
    "Fairly Widespread": 3,
    Widespread: 4,
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild("tableContent", { static: false }) tableContent!: ElementRef;

  constructor(private spatialService: SpatialDistributionService) {}

  ngOnInit() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    this.selectedDate = yesterday.toISOString().split("T")[0];
    this.fetchData(this.selectedDate);
  }

  // ngOnInit() {
  //   const yesterday = new Date();
  //   yesterday.setDate(yesterday.getDate() - 1);

  //   this.selectedDate = yesterday.toISOString().split("T")[0];
  //   this.fetchData(this.selectedDate);

  //   // ✅ custom sorting for category
  //   this.dataSource.sortingDataAccessor = (item, property) => {
  //     if (property === "category") {
  //       const order: Record<string, number> = {
  //         Isolated: 1,
  //         Scattered: 2,
  //         "Fairly Widespread": 3,
  //         Widespread: 4,
  //       };

  //       return order[item.category as keyof typeof order] ?? 5;
  //     }
  //     return (item as any)[property];
  //   };
  // }

  // 🔹 Toggle between single-day & period mode
  toggleMode() {
    this.isPeriodMode = !this.isPeriodMode;
    if (!this.isPeriodMode) {
      // Reset period values when going back to single-day
      this.startDate = "";
      this.endDate = "";
      this.fetchData(this.selectedDate);
    }
  }

  // 🔹 Fetch for single date
  // fetchData(date?: string) {
  //   this.loading = true;
  //   this.spatialService.getSpatialDistribution(date).subscribe({
  //     next: (res) => {
  //       this.dataSource.data = res.data;
  //       this.dataSource.paginator = this.paginator;
  //       this.dataSource.sort = this.sort;
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.loading = false;
  //     },
  //   });
  // }

  // // 🔹 Fetch for period
  // fetchPeriodData(start: string, end: string) {
  //   if (!start || !end) return;
  //   this.loading = true;
  //   this.spatialService.getSpatialDistributionPeriod(start, end).subscribe({
  //     next: (res) => {
  //       this.dataSource.data = res.data;
  //       this.dataSource.paginator = this.paginator;
  //       this.dataSource.sort = this.sort;
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.loading = false;
  //     },
  //   });
  // }

  // 🔹 Fetch for single date
  fetchData(date?: string) {
    this.loading = true;
    this.spatialService.getSpatialDistribution(date).subscribe({
      next: (res) => {
        this.originalData = [...res.data]; // keep a copy
        this.dataSource.data = res.data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
        this.categorySorted = false; // reset toggle
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  // 🔹 Fetch for period
  fetchPeriodData(start: string, end: string) {
    if (!start || !end) return;
    this.loading = true;
    this.spatialService.getSpatialDistributionPeriod(start, end).subscribe({
      next: (res) => {
        this.originalData = [...res.data]; // keep a copy
        this.dataSource.data = res.data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
        this.categorySorted = false; // reset toggle
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  // 🔹 Toggle category sorting
  sortByCategory() {
    if (this.categorySorted) {
      // Restore original order
      this.dataSource.data = [...this.originalData];
    } else {
      // Apply custom sort
      this.dataSource.data = [...this.dataSource.data].sort((a, b) => {
        const orderA =
          this.categoryOrder[a.category as keyof typeof this.categoryOrder] ??
          99;
        const orderB =
          this.categoryOrder[b.category as keyof typeof this.categoryOrder] ??
          99;
        return orderA - orderB;
      });
    }
    this.categorySorted = !this.categorySorted; // toggle state
  }

  // 🔹 Download PDF (works for both modes)
  downloadPDF() {
    const doc = new jsPDF();

    // // Header
    // doc.setFontSize(16);
    // doc.text("Spatial Distribution Overview", 14, 20);
    // doc.setFontSize(10);

    // if (this.isPeriodMode) {
    //   doc.text(`Period: ${this.startDate} → ${this.endDate}`, 14, 28);
    // } else {
    //   doc.text(`Date: ${this.selectedDate || "All Dates"}`, 14, 28);
    // }

    const primaryColor: [number, number, number] = [41, 128, 185];
    const secondaryColor: [number, number, number] = [100, 100, 100];

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Spatial Distribution Overview", 14, 17);

    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "normal");

    if (this.isPeriodMode) {
      doc.text(`Period: ${this.startDate} → ${this.endDate}`, 14, 32);
    } else {
      doc.text(`Date: ${this.selectedDate || "All Dates"}`, 14, 32);
    }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 36, doc.internal.pageSize.getWidth() - 14, 36);

    // Table
    autoTable(doc, {
      startY: 35,
      head: [
        [
          "S. No.",
          "Subdivision",
          "Total Stations",
          "Stations Reported Rainfall",
          "Percentage",
          "Category",
        ],
      ],
      body: this.dataSource.data.map((row: any, i: number) => [
        i + 1, // 🔹 Serial No.
        row.subdivision_name,
        row.total_stations,
        row.station_reported_rainfall,
        row.percentage + "%",
        row.category,
      ]),
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 12 },

      // 🔹 Dynamic coloring for category column
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          // ⬅️ index changed (Category is now 5)
          const category = String(data.cell.raw || "");

          // Category colors
          const categoryColors: Record<string, [number, number, number]> = {
            Isolated: [220, 53, 69],
            Scattered: [255, 165, 0],
            "Fairly Widespread": [255, 193, 7],
            Widespread: [40, 167, 69],
          };

          if (category && categoryColors[category]) {
            data.cell.styles.fillColor = categoryColors[category];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.halign = "center";
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    // ✅ Category summary counts
    const categoryCounts: Record<string, number> = {
      Isolated: 0,
      Scattered: 0,
      "Fairly Widespread": 0,
      Widespread: 0,
    };

    this.dataSource.data.forEach((row: any) => {
      if (row.category && categoryCounts[row.category] !== undefined) {
        categoryCounts[row.category]++;
      }
    });

    // Position after the table
    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Category Summary", 12, y);
    doc.setFont("helvetica", "normal");
    y += 6;

    // Category colors (same as frontend badges)
    const categoryColors: Record<string, number[]> = {
      Isolated: [220, 53, 69], // red
      Scattered: [255, 165, 0], // orange
      "Fairly Widespread": [255, 193, 7], // yellow
      Widespread: [40, 167, 69], // green
    };

    // 🔹 Print all categories in a single row
    let x = 16;
    Object.keys(categoryCounts).forEach((cat) => {
      const color = categoryColors[cat];
      doc.setFillColor(color[0], color[1], color[2]);

      // Draw dot
      doc.circle(x, y - 1.5, 3, "F");
      x += 5;

      // Write text next to dot
      doc.setTextColor(0, 0, 0);
      doc.text(`${categoryCounts[cat]} ${cat}`, x, y);
      x += 43; // spacing for next category
    });

    // ------------------- NEW PAGE: SOURCES / NOTES -------------------
    doc.addPage();

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Background header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, width, 30, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Sources & Notes", 14, 20);

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 32, width - 14, 32);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    const margin = 14;
    let currentY = 40;

    // Notes with colored bullet points
    const notes = [
      "This spatial distribution data is provided by the Hydromet Department.",
      "All measurements are validated and updated daily based on the station reports.",
      "Percentages indicate the proportion of stations reporting rainfall above the threshold.",
      "Category distribution (Isolated, Scattered, Fairly Widespread, Widespread) is computed based on total stations reporting rainfall.",
      "This report is intended for professional and official use; accuracy depends on the source data.",
    ];

    const bulletColors: [number, number, number][] = [
      [41, 128, 185], // blue
      [41, 128, 185], // blue
      [41, 128, 185], // blue
      [41, 128, 185], // blue
      [41, 128, 185], // blue
    ];

    notes.forEach((note, index) => {
      // Draw bullet circle
      doc.setFillColor(...bulletColors[index]);
      doc.circle(margin + 2, currentY - 2, 2.5, "F");

      // Write note text
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(note, margin + 10, currentY, {
        maxWidth: width - margin * 2 - 10,
      });
      currentY += 10; // spacing between points
    });

    const fileName = this.isPeriodMode
      ? `Spatial_Distribution_${this.startDate}_to_${this.endDate}.pdf`
      : `Spatial_Distribution_${this.selectedDate}.pdf`;

    doc.save(fileName);
  }
}
