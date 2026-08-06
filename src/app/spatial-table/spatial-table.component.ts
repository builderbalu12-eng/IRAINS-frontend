import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { SpatialDistributionService } from "../services/spatialDistribution/spatial-distribution.service";
import { SubdivisionService } from "src/app/services/subDivision/subDivision.service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { StateService } from "../services/state/state.service";
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
  // Daywise is a single day, so it gets its own model rather than reusing the
  // period range — sharing them meant switching modes carried the other mode's
  // dates across.
  singleDate: string = "";
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
  loggedInUser: any;
  centreType: string = "";
  centreName: string = "";
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild("tableContent", { static: false }) tableContent!: ElementRef;
  constructor(
    private spatialService: SpatialDistributionService,
    private subdivservice: SubdivisionService,
    private stateservice: StateService
  ) {}
  ngOnInit() {
    let loggedInUser: any = localStorage.getItem("isAuthorised");
    this.loggedInUser = JSON.parse(loggedInUser);
    const regex = /^(RMC|MC)\s(\w+)/;
    const match = this.loggedInUser.data[0].name.match(regex);
    if (match) {
      this.centreType = match[1];
      this.centreName = match[2];
    }
    this.seedDefaultDates();
    // fetch initial period data
    this.fetchPeriodData(this.startDate, this.endDate, "period");
  }
  // 🔹 Switch mode (date / period / daywise)
  setMode(selected: "date" | "period" | "daywise") {
    this.mode = selected;
    this.dataSource.data = []; // clear table
    this.originalData = [];
    this.categorySorted = false;
    // Daywise state belongs to the previous mode — stale dates here leave the
    // day stepper pointing at days the new result set doesn't contain.
    this.daywiseGrouped = {};
    this.daywiseDates = [];
    this.currentDayIndex = 0;

    // Refetch for the newly selected mode, mirroring setViewMode() below.
    // Without this the toggle only blanked the table and nothing reloaded, so
    // switching to Period/Daywise looked like it had hung. startDate/endDate
    // are already seeded in ngOnInit, so there is always a range to fetch.
    if (!this.startDate || !this.endDate) {
      this.seedDefaultDates();
    }
    if (selected === "period") {
      this.fetchPeriodData(this.startDate, this.endDate, "period");
    } else if (selected === "daywise") {
      // Daywise always reopens on today, per request — a single day, not a range.
      this.singleDate = this.todayLocal();
      this.fetchSingleDay(this.singleDate);
    }
  }

  // Daywise fetch for one day: the API is range-based, so pass the same date as
  // both bounds and let it group that single day.
  fetchSingleDay(date: string) {
    if (!date) return;
    this.fetchDaywiseData(date, date);
  }

  private todayLocal(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Last 7 days, built from the local calendar date. toISOString() is UTC, so
  // in IST every load before 05:30 rolled the range back by a day.
  private seedDefaultDates() {
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    this.startDate = fmt(lastWeek);
    this.endDate = fmt(today);
    this.singleDate = fmt(today); // daywise opens on today
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
      // Daywise is driven by singleDate, not the period range.
      this.fetchSingleDay(this.singleDate || this.todayLocal());
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

  private abbreviatePeriod(start: Date, end: Date): string {
    const sMonth = (start.getMonth() + 1).toString();
    const sDay = start.getDate().toString();
    const eDay = end.getDate().toString();
    const year = end.getFullYear().toString();
    let abbrev = `${sMonth}/${sDay}-${eDay}/${year}`;
    if (start.getMonth() !== end.getMonth()) {
      const eMonth = (end.getMonth() + 1).toString();
      abbrev = `${sMonth}/${sDay}-${eMonth}/${eDay}/${year}`;
    }
    return abbrev;
  }

  downloadPDF() {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
  
    doc.setFont("helvetica");
    doc.setFontSize(11);
  
    // === Determine Dates ===
    let startD: Date, endD: Date;
    if (this.mode === "date") {
      startD = endD = new Date(this.selectedDate);
    } else if (this.mode === "daywise") {
      startD = endD = new Date(this.currentDay);
    } else {
      startD = new Date(this.startDate);
      endD = new Date(this.endDate);
    }
  
    const formatDate = (d: Date) => {
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}/${d.getFullYear()}`;
    };
  
    const datedStr = formatDate(endD);
    const periodFrom = formatDate(startD);
    const periodTo = formatDate(endD);
    const tableDate = startD.getTime() === endD.getTime() ? formatDate(startD) : `${formatDate(startD)} - ${formatDate(endD)}`;
    const isPeriodMode = startD.getTime() !== endD.getTime();
    const abbrevPeriod = this.abbreviatePeriod(startD, endD);
  
    // const centreFullName = `${this.centreType} ${this.centreName}`.toUpperCase();
  
    /* -------------------------------------------------------------
     *  Build PDF
     * ------------------------------------------------------------- */
    const buildPdf = (dataForPdf: any[]) => {
      let y = margin;
  
      // === HEADER LINE 1 ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("T/P MESSAGE", margin, y);
      doc.text(`DATED ${datedStr}`, pageWidth / 2, y, { align: 'center' });
      doc.text("PRIORITY YOU", pageWidth - margin, y, { align: 'right' });
      y += 8;
  
      // === FROM / TO ===
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("FROM :", margin, y);
      doc.text(centreFullName, margin + 18, y);
      y += 7;
  
      doc.text("TO :", margin, y);
      doc.text("DGM HYDROMET, NEW DELHI", margin + 18, y);
      y += 10;
  
      // === MF-08(B) LINE ===
      doc.setFont("helvetica", "bold");
      doc.text("MF-08(B)", margin, y);
      doc.text(`DATED ${datedStr}`, pageWidth / 2, y, { align: 'center' });
      y += 8;
  
      // === AAA LINE ===
      doc.text(`${this.viewMode.toUpperCase()}WISE DISTRIBUTION OF`, margin, y);
      y += 7;
      doc.text("RAINFALL AND THE MONSOON ACTIVITY FOR THE PERIOD FROM", margin, y);
      y += 7;
  
      // === PERIOD DATES ===
      doc.text(periodFrom, margin, y);
      doc.text("TO", pageWidth / 2 - 10, y, { align: 'center' });
      doc.text(periodTo, pageWidth / 2 + 10, y);
      doc.text("FOLLOWS:", pageWidth - margin, y, { align: 'right' });
      y += 12;
  
      // === TABLE USING autoTable ===
      const tableData = dataForPdf.map(item => {
        const name = (this.viewMode === "state" ? item.state_name : item.subdivision_name).toUpperCase();
        const dateCell = isPeriodMode 
          ? `${name}/${abbrevPeriod}` 
          : `${name}/${tableDate}`;
        return [
          dateCell,
          item.category.toUpperCase()
        ];
      });

      autoTable(doc, {
        head: [[`${this.viewMode.toUpperCase()}`, 'RAINFALL DISTRIBUTION']],
        body: tableData,
        startY: y,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2, font: "helvetica" },
        headStyles: {
          fontStyle: 'bold',
          halign: 'center',
          textColor: [0, 0, 0],
          lineWidth: 0.3,
          lineColor: [0, 0, 0]
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'normal' },
          1: { halign: 'center', fontStyle: 'normal' }
        },
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - 2 * margin
      });
  
      const finalY = (doc as any).lastAutoTable.finalY + 15;
  
      // === AUTHORIZED SECTION ===
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("AUTHORISED FOR IMMEDIATE CLEARANCE", margin, finalY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Post Copy in confirmation to Director General of Meteorology (Hydromet), New Delhi - 110003.",
        margin,
        finalY + 8
      );
  
      // === SIGNATURE ===
      doc.setFontSize(11);
      doc.text("SIG. (", margin, finalY + 18);
      doc.text(")", margin + 40, finalY + 18);
      doc.text("for DIRECTOR/DDGM", pageWidth - margin, finalY + 18, { align: 'right' });
  
      // === CENTRE NAME & MF-08(B) ===
      doc.setFont("helvetica", "bold");
      doc.text(centreFullName, margin, finalY + 26);
      doc.text("MF-08(B)", margin, finalY + 32);
  
      // === FOOTER ===
      const footerDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text(footerDate, margin, pageHeight - 8);
        doc.text(`${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      }
  
      // Save
      const fileName = `Spatial_Distribution_${datedStr.replace(/\//g, "-")}.pdf`;
      doc.save(fileName);
    };
  
    /* -------------------------------------------------------------
     *  Centre-type logic (filter by MC)
     * ------------------------------------------------------------- */
    const centreIsMC = this.centreType?.toUpperCase() === "MC";
    const centreFullName = `${this.centreType} ${this.centreName}`.trim().toUpperCase();
  
    if (!centreIsMC) {
      buildPdf(this.dataSource.data);
      return;
    }
  
    const fetchMeta = this.viewMode === "subdivision"
      ? this.subdivservice.fetchmetWiseSubDivisions()
      : this.stateservice.fetchMetWiseStates();
  
    fetchMeta.subscribe({
      next: (meta: any) => {
        const allowedNames = new Set(
          meta.data
            .filter((m: any) => m.met_centre?.trim().toUpperCase() === centreFullName)
            .map((m: any) =>
              (this.viewMode === "subdivision" ? m.subdiv_name : m.state_name).toUpperCase()
            )
        );
  
        const dataForPdf = this.dataSource.data.filter((item) =>
          allowedNames.has(
            (this.viewMode === "subdivision" ? item.subdivision_name : item.state_name).toUpperCase()
          )
        );
  
        if (dataForPdf.length === 0) {
          alert("No data found for your MC.");
          return;
        }
  
        buildPdf(dataForPdf);
      },
      error: (err: any) => {
        console.error("Failed to fetch metadata:", err);
        alert("Could not determine allowed subdivisions/states. PDF not generated.");
      },
    });
  }
}