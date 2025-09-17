import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { SpatialDistributionService } from "../services/spatialDistribution/spatial-distribution.service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

@Component({
  selector: "app-spatial-table",
  templateUrl: "./spatial-table.component.html",
  styleUrls: ["./spatial-table.component.css"],
})
export class SpatialTableComponent implements OnInit {
  displayedColumns: string[] = [
    "name", // 👈 will show subdivision_name or state_name dynamically
    "total_stations",
    "station_reported_rainfall",
    "percentage",
    "category",
  ];
  dataSource = new MatTableDataSource<any>([]);
  loading = true;

  // Modes
  mode: "date" | "period" | "daywise" = "period";

  // 👇 NEW: Subdivision / State toggle
  viewMode: "subdivision" | "state" = "subdivision";

  // Date values
  selectedDate: string = "";
  startDate: string = "";
  endDate: string = "";

  originalData: any[] = [];
  private categorySorted = false;

  // 🔹 Daywise support
  daywiseGrouped: Record<string, any[]> = {};
  daywiseDates: string[] = [];
  currentDayIndex: number = 0;

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
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    this.startDate = lastWeek.toISOString().split("T")[0];
    this.endDate = today.toISOString().split("T")[0];

    // fetch initial period data
    this.fetchPeriodData(this.startDate, this.endDate, "period");
  }

  // 🔹 Switch mode (date / period / daywise)
  setMode(selected: "date" | "period" | "daywise") {
    this.mode = selected;
    this.dataSource.data = []; // clear table
    this.originalData = [];
    this.categorySorted = false;
  }

  // 🔹 NEW: Switch viewMode (subdivision / state)
  setViewMode(mode: "subdivision" | "state") {
    this.viewMode = mode;
    this.dataSource.data = [];
    this.originalData = [];
    this.categorySorted = false;

    // refetch with new mode
    if (this.mode === "period") {
      this.fetchPeriodData(this.startDate, this.endDate, "period");
    } else if (this.mode === "daywise") {
      this.fetchDaywiseData(this.startDate, this.endDate);
    }
  }

  // 🔹 Single date
  fetchData(date?: string, mode: string = "date") {
    if (!date) return;
    this.loading = true;

    const apiCall =
      this.viewMode === "subdivision"
        ? this.spatialService.getSpatialDistribution(date, mode)
        : this.spatialService.getSpatialDistributionState(date, mode); // 👈 state API

    apiCall.subscribe({
      next: (res) => {
        this.originalData = [...res.data];
        this.dataSource.data = res.data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
        this.categorySorted = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  // 🔹 Period
  fetchPeriodData(start: string, end: string, mode: string = "period") {
    if (!start || !end) return;
    this.loading = true;

    const apiCall =
      this.viewMode === "subdivision"
        ? this.spatialService.getSpatialDistributionPeriod(start, end, mode)
        : this.spatialService.getSpatialDistributionStatePeriod(
            start,
            end,
            mode
          ); // 👈 state API

    apiCall.subscribe({
      next: (res) => {
        this.originalData = [...res.data];
        this.dataSource.data = res.data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loading = false;
        this.categorySorted = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  // 🔹 Daywise
  fetchDaywiseData(start: string, end: string) {
    if (!start || !end) return;
    this.loading = true;

    const apiCall =
      this.viewMode === "subdivision"
        ? this.spatialService.getSpatialDistributionPeriod(
            start,
            end,
            "daywise"
          )
        : this.spatialService.getSpatialDistributionStatePeriod(
            start,
            end,
            "daywise"
          ); // 👈 state API

    apiCall.subscribe({
      next: (res) => {
        this.daywiseGrouped = res.data;
        this.daywiseDates = Object.keys(this.daywiseGrouped).sort();
        this.currentDayIndex = 0;
        this.updateDaywiseTable();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  updateDaywiseTable() {
    if (this.daywiseDates.length === 0) return;
    const currentDate = this.daywiseDates[this.currentDayIndex];
    const rows = this.daywiseGrouped[currentDate] || [];

    this.originalData = [...rows];
    this.dataSource.data = rows;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.categorySorted = false;
  }

  // 🔹 Navigation
  previousDay() {
    if (this.currentDayIndex > 0) {
      this.currentDayIndex--;
      this.updateDaywiseTable();
    }
  }

  nextDay() {
    if (this.currentDayIndex < this.daywiseDates.length - 1) {
      this.currentDayIndex++;
      this.updateDaywiseTable();
    }
  }

  // 🔹 Current day label
  get currentDay(): string {
    return this.daywiseDates[this.currentDayIndex] || "";
  }

  // 🔹 Search filter
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  // 🔹 Category sorting
  sortByCategory() {
    if (this.categorySorted) {
      this.dataSource.data = [...this.originalData];
    } else {
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
    this.categorySorted = !this.categorySorted;
  }

  getImageDimensions(src: string): Promise<{ w: number; h: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.src = src;
    });
  }
  private formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  async downloadPDF() {
    const doc = new jsPDF();

    const primaryColor: [number, number, number] = [41, 128, 185];
    const secondaryColor: [number, number, number] = [100, 100, 100];

    const width = doc.internal.pageSize.getWidth();
    const marginTop = 5;

    // 🔹 Logo paths
    const leftLogo = "/assets/images/IMDlogo_Ipart-iris.png";
    const rightLogo = "/assets/images/IMD150(BGR).png";

    // 🔹 Get natural dimensions
    const leftDim = await this.getImageDimensions(leftLogo);
    const rightDim = await this.getImageDimensions(rightLogo);

    // 🔹 Different heights
    const leftLogoHeight = 24; // ⬅️ bigger
    const rightLogoHeight = 20; // ⬅️ smaller

    // 🔹 Maintain aspect ratio
    const leftLogoWidth = (leftDim.w / leftDim.h) * leftLogoHeight;
    const rightLogoWidth = (rightDim.w / rightDim.h) * rightLogoHeight;

    // ✅ Add Left Logo (bigger)
    doc.addImage(leftLogo, "PNG", 10, marginTop, leftLogoWidth, leftLogoHeight);

    // ✅ Add Right Logo (smaller)
    doc.addImage(
      rightLogo,
      "PNG",
      width - rightLogoWidth - 10,
      marginTop,
      rightLogoWidth,
      rightLogoHeight
    );

    // ✅ Title in the center
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Spatial Distribution Overview", width / 2, 33, {
      align: "center",
    });

    // Subheading (date/period/daywise)
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont("helvetica", "normal");

    // if (this.mode === "period") {
    //   doc.text(`Period: ${this.startDate} to ${this.endDate}`, 14, 42);
    // } else if (this.mode === "daywise") {
    //   doc.text(`Date: ${this.currentDay}`, 14, 42);
    // } else {
    //   doc.text(`Date: ${this.selectedDate || "All Dates"}`, 14, 42);
    // }

    if (this.mode === "period") {
      doc.text(
        `Period: ${this.formatDate(this.startDate)} to ${this.formatDate(
          this.endDate
        )}`,
        14,
        42
      );
    } else if (this.mode === "daywise") {
      doc.text(`Date: ${this.formatDate(this.currentDay)}`, 14, 42);
    } else {
      doc.text(
        `Date: ${
          this.selectedDate ? this.formatDate(this.selectedDate) : "All Dates"
        }`,
        14,
        42
      );
    }

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 36, width - 14, 36);

    // 🔹 Prepare table data
    // let tableData: any[] = [];
    // if (this.mode === "daywise") {
    //   const currentDate = this.daywiseDates[this.currentDayIndex];
    //   const rows = this.daywiseGrouped[currentDate] || [];
    //   tableData = rows.map((row: any, i: number) => [
    //     i + 1,
    //     row.subdivision_name,
    //     row.total_stations,
    //     row.station_reported_rainfall,
    //     row.percentage + "%",
    //     row.category,
    //   ]);
    // } else {
    //   tableData = this.dataSource.data.map((row: any, i: number) => [
    //     i + 1,
    //     row.subdivision_name,
    //     row.total_stations,
    //     row.station_reported_rainfall,
    //     row.percentage + "%",
    //     row.category,
    //   ]);
    // }
    let tableData: any[] = [];
    if (this.mode === "daywise") {
      const currentDate = this.daywiseDates[this.currentDayIndex];
      const rows = this.daywiseGrouped[currentDate] || [];
      tableData = rows.map((row: any, i: number) => [
        i + 1,
        this.viewMode === "state" ? row.state_name : row.subdivision_name,
        row.total_stations,
        row.station_reported_rainfall,
        row.percentage + "%",
        row.category,
      ]);
    } else {
      tableData = this.dataSource.data.map((row: any, i: number) => [
        i + 1,
        this.viewMode === "state" ? row.state_name : row.subdivision_name,
        row.total_stations,
        row.station_reported_rainfall,
        row.percentage + "%",
        row.category,
      ]);
    }
    console.log(tableData);
    // 🔹 Table
    autoTable(doc, {
      startY: 45,
      head: [
        [
          "S. No.",
          this.viewMode === "state" ? "State" : "Subdivision",
          "Total Stations",
          "Stations Reported Rainfall",
          "Percentage",
          "Category",
        ],
      ],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 12 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const category = String(data.cell.raw || "");
          const categoryColors: Record<string, [number, number, number]> = {
            Isolated: [3, 255, 63],
            Scattered: [0, 104, 58],
            "Fairly Widespread": [0, 252, 241],
            Widespread: [52, 0, 246],
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

    // ✅ Category summary
    const categoryCounts: Record<string, number> = {
      Isolated: 0,
      Scattered: 0,
      "Fairly Widespread": 0,
      Widespread: 0,
    };
    tableData.forEach((row: any) => {
      if (row[5] && categoryCounts[row[5]] !== undefined) {
        categoryCounts[row[5]]++;
      }
    });

    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Category Summary", 12, y);
    doc.setFont("helvetica", "normal");
    y += 6;

    const categoryColors: Record<string, number[]> = {
      Isolated: [3, 255, 63],
      Scattered: [0, 104, 58],
      "Fairly Widespread": [0, 252, 241],
      Widespread: [52, 0, 246],
    };

    let x = 16;
    Object.keys(categoryCounts).forEach((cat) => {
      const color = categoryColors[cat];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.circle(x, y - 1.5, 3, "F");
      x += 5;
      doc.setTextColor(0, 0, 0);
      doc.text(`${categoryCounts[cat]} ${cat}`, x, y);
      x += 43;
    });

    // ✅ File save
    const fileName =
      this.mode === "period"
        ? `Spatial_Distribution_${this.startDate}_to_${this.endDate}.pdf`
        : this.mode === "daywise"
        ? `Spatial_Distribution_${this.currentDay}.pdf`
        : `Spatial_Distribution_${this.selectedDate}.pdf`;

    // ✅ New Page for Notes + Classification
    doc.addPage();

    const wi = doc.internal.pageSize.getWidth();
    const he = doc.internal.pageSize.getHeight();

    // 🔹 Page Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, wi, 30, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Sources & Notes", 14, 20);

    // 🔹 Divider Line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 32, wi - 14, 32);

    // 🔹 Notes Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);

    const margin = 14;
    let currentY = 40;

    const notes = [
      "All measurements are validated and updated daily based on the station reports.",
      "Percentages indicate the proportion of stations reporting rainfall above the threshold.",
      "Category distribution (Isolated, Scattered, Fairly Widespread, Widespread) is computed based on total stations reporting rainfall.",
    ];

    const bulletColors: [number, number, number][] = [
      [41, 128, 185],
      [41, 128, 185],
      [41, 128, 185],
    ];

    // ✅ Render notes
    notes.forEach((note, index) => {
      doc.setFillColor(...bulletColors[index]);
      doc.circle(margin + 2, currentY - 2, 2.5, "F");

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(note, margin + 10, currentY, {
        maxWidth: width - margin * 2 - 10,
      });

      currentY += 10;
    });

    currentY += 10; // spacing after notes

    // 🔹 Classification Table
    const rows2 = [
      ["Isolated", "<= 25%", { content: "", styles: { fillColor: "#03ff3f" } }],
      [
        "Scattered",
        ">=26% and <=50%",
        { content: "", styles: { fillColor: "#00683a" } },
      ],
      [
        "Fairly Widespread",
        ">=51% and <=75%",
        { content: "", styles: { fillColor: "#00fcf1" } },
      ],
      [
        "Widespread",
        ">=76% and <=100%",
        { content: "", styles: { fillColor: "#3400f6" } },
      ],
    ];

    autoTable(doc, {
      head: [["Category", "Criteria", "Color"]],
      body: rows2,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "center" },
        2: { halign: "center" },
      },
      startY: currentY,
    });

    doc.save(fileName);
  }
}
