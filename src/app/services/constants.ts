import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environment/environment";
import { DataService } from "../data.service";
import { color } from "highcharts";

@Injectable({
  providedIn: "root",
})
export class Constants {
  private GuestMode = "Unified"; //Data Entry

  private baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient, private dataservice: DataService) {}

  getGuestMode() {
    return this.GuestMode;
  }

  getFullSeasonForDate(dateStr: string): { startDate: string, endDate: string } {
    const date = new Date(dateStr);
    const month = date.getMonth();
    const year = date.getFullYear();
    const seasons = [
      { startMonth: 0, endMonth: 1 },
      { startMonth: 2, endMonth: 4 },
      { startMonth: 5, endMonth: 8 },
      { startMonth: 9, endMonth: 11 },
    ];
    const matched = seasons.find(s => month >= s.startMonth && month <= s.endMonth)!;
    const start = new Date(year, matched.startMonth, 1);
    const end   = new Date(year, matched.endMonth + 1, 0); // last day of season end month
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  getDateSuffix(startDate: string, endDate: string): string {
    if (startDate === endDate) return 'cd';
    const start = new Date(startDate);
    const end   = new Date(endDate);
    const days  = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) return 'm';
    return 'c';
  }

  getExcelDateLabel(startDate: string, endDate: string): string {
    if (startDate === endDate) {
      const [y, m, d] = startDate.split('-');
      return `${d}${m}${y}`;
    }
    const start  = new Date(startDate);
    const end    = new Date(endDate);
    const MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    const MON    = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `(${start.getDate()}-${end.getDate()}) ${MONTHS[start.getMonth()]} ${String(start.getFullYear()).slice(-2)}`;
    }
    const d1 = String(start.getDate()).padStart(2, '0');
    const d2 = String(end.getDate()).padStart(2, '0');
    const y1 = start.getFullYear();
    const y2 = end.getFullYear();
    if (y1 === y2) return `(${d1}${MON[start.getMonth()]}-${d2}${MON[end.getMonth()]}) ${y1}`;
    return `(${d1}${MON[start.getMonth()]}${y1}-${d2}${MON[end.getMonth()]}${y2})`;
  }

  truncateToOneDecimal(num: number | null): string | null {
    if (num === null || num === undefined) {
      return null; // Return null if the input is null or undefined
    }
    return (Math.floor(num * 10) / 10).toFixed(1); // Truncate and keep one decimal place
  }

  getRangeFromDateRange() {
    let EndDate: any;
    let StartDate: any;

    this.dataservice.fromAndToDate$.subscribe((value) => {
      const currentDate = new Date();
      const dd = String(currentDate.getDate()).padStart(2, "0");
      const mon = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
      const year = String(currentDate.getFullYear());
      const formatteddate = `${dd}-${mon}-${year}`;

      if (value) {
        let fromAndToDates = JSON.parse(value);
        StartDate = fromAndToDates.fromDate;
        EndDate = fromAndToDates.toDate;
      } else {
        StartDate = `${year}-${mon}-${dd}`;
        EndDate = `${year}-${mon}-${dd}`;
      }
    });
    return {
      startDate: StartDate,
      endDate: EndDate,
    };
  }

  getCurrentMonthSeasonFromAndTodateCustom(selectedEndDate: Date) {
    let date: any = selectedEndDate;
    // this.dataservice.fromAndToDate$.subscribe((value) => {
    //   if (value) {
    //     let fromAndToDates = JSON.parse(value);
    //     console.log('getCurrentMonthSeasonFromAndTodate1',fromAndToDates)
    //     date = fromAndToDates.toDate;
    //     date = new Date(date)
    //     console.log('getCurrentMonthSeasonFromAndTodate2',date)

    //     console.log('erer',date)
    //   }
    // });

    const seasons = [
      { startMonth: 0, endMonth: 1 }, // Jan-Feb
      { startMonth: 2, endMonth: 4 }, // Mar-May
      { startMonth: 5, endMonth: 8 }, // Jun-Sep
      { startMonth: 9, endMonth: 11 }, // Oct-Dec
    ];

    const month = date.getMonth();

    const matchedSeason: any = seasons.find(
      (season) => month >= season.startMonth && month <= season.endMonth
    );

    const startDate = new Date(date.getFullYear(), matchedSeason.startMonth, 1);

    const dd = String(startDate.getDate()).padStart(2, "0");
    const mon = String(startDate.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = String(startDate.getFullYear());
    const formatteddate1 = `${year}-${mon}-${dd}`;

    const currdd = String(date.getDate()).padStart(2, "0");
    const currmon = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const curryear = String(date.getFullYear());
    const formatteddate2 = `${curryear}-${currmon}-${currdd}`;

    console.log("getCurrentMonthSeasonFromAndTodate3", {
      startDate: formatteddate1,
      endDate: formatteddate2,
    });

    return {
      startDate: formatteddate1,
      endDate: formatteddate2,
    };
  }

  getCurrentMonthSeasonFromAndTodate(currDate: any) {
    let date: any = currDate;
    this.dataservice.fromAndToDate$.subscribe((value) => {
      if (value) {
        let fromAndToDates = JSON.parse(value);
        console.log("getCurrentMonthSeasonFromAndTodate1", fromAndToDates);
        date = fromAndToDates.toDate;
        date = new Date(date);
        console.log("getCurrentMonthSeasonFromAndTodate2", date);

        console.log("erer", date);
      }
    });

    const seasons = [
      { startMonth: 0, endMonth: 1 }, // Jan-Feb
      { startMonth: 2, endMonth: 4 }, // Mar-May
      { startMonth: 5, endMonth: 8 }, // Jun-Sep
      { startMonth: 9, endMonth: 11 }, // Oct-Dec
    ];

    const month = date.getMonth();

    const matchedSeason: any = seasons.find(
      (season) => month >= season.startMonth && month <= season.endMonth
    );

    const startDate = new Date(date.getFullYear(), matchedSeason.startMonth, 1);

    const dd = String(startDate.getDate()).padStart(2, "0");
    const mon = String(startDate.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = String(startDate.getFullYear());
    const formatteddate1 = `${year}-${mon}-${dd}`;

    const currdd = String(date.getDate()).padStart(2, "0");
    const currmon = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const curryear = String(date.getFullYear());
    const formatteddate2 = `${curryear}-${currmon}-${currdd}`;

    console.log("getCurrentMonthSeasonFromAndTodate3", {
      startDate: formatteddate1,
      endDate: formatteddate2,
    });

    return {
      startDate: formatteddate1,
      endDate: formatteddate2,
    };
  }

  getCurrentMonthSeasonFromAndToCurrentDate(currDate: any) {
    let date: any = currDate;
    const seasons = [
      { startMonth: 0, endMonth: 1 }, // Jan-Feb
      { startMonth: 2, endMonth: 4 }, // Mar-May
      { startMonth: 5, endMonth: 8 }, // Jun-Sep
      { startMonth: 9, endMonth: 11 }, // Oct-Dec
    ];

    const month = date.getMonth();

    const matchedSeason: any = seasons.find(
      (season) => month >= season.startMonth && month <= season.endMonth
    );

    const startDate = new Date(date.getFullYear(), matchedSeason.startMonth, 1);

    const dd = String(startDate.getDate()).padStart(2, "0");
    const mon = String(startDate.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = String(startDate.getFullYear());
    const formatteddate1 = `${year}-${mon}-${dd}`;

    const currdd = String(date.getDate()).padStart(2, "0");
    const currmon = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const curryear = String(date.getFullYear());
    const formatteddate2 = `${curryear}-${currmon}-${currdd}`;

    console.log("getCurrentMonthSeasonFromAndTodate3", {
      startDate: formatteddate1,
      endDate: formatteddate2,
    });

    return {
      startDate: formatteddate1,
      endDate: formatteddate2,
    };
  }

  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  getSeasonDates(season: string, year: number): { start: Date; end: Date } {
    let start: Date, end: Date;

    switch (season.toLowerCase()) {
      case "winter":
        start = new Date(year, 0, 1);
        end = new Date(year, 1, this.isLeapYear(year) ? 29 : 28);
        break;
      case "premonsoon":
        start = new Date(year, 2, 1);
        end = new Date(year, 4, 31);
        break;
      case "monsoon":
        start = new Date(year, 5, 1);
        end = new Date(year, 8, 30);
        break;
      case "postmonsoon":
        start = new Date(year, 9, 1);
        end = new Date(year, 11, 31);
        break;
      default:
        throw new Error(
          "Invalid season. Valid seasons are: winter, premonsoon, monsoon, postmonsoon."
        );
    }

    return { start, end };
  }

  getSeasonDatesUptoCurrentDate(
    season: string,
    year: number,
    effectiveDate: Date = new Date()
  ): { start: Date; end: Date } {
    let start: Date, end: Date;

    switch (season.toLowerCase()) {
      case "winter":
        start = new Date(year, 0, 1);
        end = new Date(year, 1, this.isLeapYear(year) ? 29 : 28);
        break;
      case "premonsoon":
        start = new Date(year, 2, 1);
        end = new Date(year, 4, 31);
        break;
      case "monsoon":
        start = new Date(year, 5, 1);
        end = new Date(year, 8, 30);
        break;
      case "postmonsoon":
        start = new Date(year, 9, 1);
        end = new Date(year, 11, 31);
        break;
      default:
        throw new Error(
          "Invalid season. Valid seasons are: winter, premonsoon, monsoon, postmonsoon."
        );
    }

    if (end > effectiveDate) {
      end = effectiveDate;
    }

    return { start, end };
  }

  getCurrentSeason(date: Date): string {
    const year = date.getFullYear();
  
    // Normalize input date to midnight
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
    // Define season boundaries and normalize to midnight
    const winterStart = new Date(year, 0, 1);
    winterStart.setHours(0, 0, 0, 0);
    const winterEnd = new Date(year, 1, this.isLeapYear(year) ? 29 : 28);
    winterEnd.setHours(23, 59, 59, 999);
  
    const premonsoonStart = new Date(year, 2, 1);
    premonsoonStart.setHours(0, 0, 0, 0);
    const premonsoonEnd = new Date(year, 4, 31);
    premonsoonEnd.setHours(23, 59, 59, 999);
  
    const monsoonStart = new Date(year, 5, 1);
    monsoonStart.setHours(0, 0, 0, 0);
    const monsoonEnd = new Date(year, 8, 30); // September 30
    monsoonEnd.setHours(23, 59, 59, 999);
  
    const postmonsoonStart = new Date(year, 9, 1);
    postmonsoonStart.setHours(0, 0, 0, 0);
    const postmonsoonEnd = new Date(year, 11, 31);
    postmonsoonEnd.setHours(23, 59, 59, 999);
  
  
    if (normalizedDate >= winterStart && normalizedDate <= winterEnd) {
      return 'Winter';
    } else if (normalizedDate >= premonsoonStart && normalizedDate <= premonsoonEnd) {
      return 'PreMonsoon';
    } else if (normalizedDate >= monsoonStart && normalizedDate <= monsoonEnd) {
      return 'Monsoon';
    } else if (normalizedDate >= postmonsoonStart && normalizedDate <= postmonsoonEnd) {
      return 'PostMonsoon';
    } else {
      throw new Error('Unable to determine the season for the given date.');
    }
  }

  getThursdayOnOrAfter(date: Date): Date {
    const dayOfWeek = date.getDay();
    const diff = dayOfWeek <= 4 ? 4 - dayOfWeek : 11 - dayOfWeek;
    const thursday = new Date(date);
    thursday.setDate(date.getDate() + diff);
    return thursday;
  }

  getWeeklyIntervals(
    season: string,
    year: number
  ): { startDate: any; endDate: any }[] {
    const { start, end } = this.getSeasonDates(season, year);

    const currentDate = new Date();

    // If the current date is within the season, adjust the season's end to the current date
    if (currentDate >= start && currentDate <= end) {
      end.setTime(currentDate.getTime());
    }

    let thursday = this.getThursdayOnOrAfter(start);

    const weeks: { startDate: string; endDate: string }[] = [];

    const firstWeekStartDate = this.formatDate(start);

    let oneDayBefore = new Date(thursday);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    const firstWeekEndDate = this.formatDate(oneDayBefore);

    weeks.push({ startDate: firstWeekStartDate, endDate: firstWeekEndDate });

    while (thursday <= end) {
      let weekStart = new Date(thursday);
      let weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      if (weekEnd > end) {
        weekEnd = new Date(end);
      }

      const weekStartDate = this.formatDate(weekStart);
      const weekEndDate = this.formatDate(weekEnd);

      weeks.push({ startDate: weekStartDate, endDate: weekEndDate });

      thursday.setDate(thursday.getDate() + 7);
    }

    return weeks;
  }

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }

  getWeeklyByCummulative(
    season: string,
    year: number
  ): { startDate: string; endDate: string }[] {
    const { start, end } = this.getSeasonDates(season, year);

    const currentDate = new Date();

    // If the current date is within the season, adjust the season's end to the current date
    if (currentDate >= start && currentDate <= end) {
      end.setTime(currentDate.getTime());
    }

    let thursday = this.getThursdayOnOrAfter(start);

    const cumulativeWeeks: { startDate: string; endDate: string }[] = [];

    // First week start is from the start of the season
    let firstWeekStartDate = this.formatDate(start);

    // First week end date (same logic as regular weekly calculation)
    let oneDayBefore = new Date(thursday);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    let firstWeekEndDate = this.formatDate(oneDayBefore);

    // Add first week (cumulative, so the start is the season start)
    cumulativeWeeks.push({
      startDate: firstWeekStartDate,
      endDate: firstWeekEndDate,
    });

    // Iterate through the season to calculate cumulative weeks
    while (thursday <= end) {
      let weekEnd = new Date(thursday);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Ensure the week's end does not go beyond the season's end
      if (weekEnd > end) {
        weekEnd = new Date(end);
      }

      // Format the week end date and add it to the list of cumulative weeks
      let weekEndDate = this.formatDate(weekEnd);

      // Push cumulative week (start date remains the same, but the end date extends)
      cumulativeWeeks.push({
        startDate: firstWeekStartDate,
        endDate: weekEndDate,
      });

      // Move to the next Thursday
      thursday.setDate(thursday.getDate() + 7);
    }

    console.log("cumulativeWeeks", cumulativeWeeks);

    return cumulativeWeeks;
  }

  // Example usage:
  // const seasonWeeks = getWeeklyIntervals('monsoon', 2024);
  // seasonWeeks.forEach((week, index) => {
  //   console.log(`Week ${index + 1}: ${week.start.toDateString()} - ${week.end.toDateString()}`);
  // });

  // Used in Maps
  getColorForRainfall(rainfall: any): string {
    // this functtion is only for departure
    let count = 0;

    if (rainfall == null || rainfall == undefined || rainfall == "NA") {
      return "#c0c0c0";
    }

    // make sure we should round off before identifying color
    const numericId = this.trimToZeroDecimals(rainfall);

    if (numericId > 59) {
      return "#0393ff";
    }
    if (numericId > 19 && numericId <= 59) {
      return "#69bef7";
    }
    if (numericId > -20 && numericId <= 19) {
      return "#68dd58";
    }
    if (numericId > -60 && numericId <= -20) {
      return "#fb4111";
    }
    if (numericId > -100 && numericId <= -60) {
      return "#ffff00";
    }

    if (numericId == -100) {
      return "#ffffff";
    } else {
      return "#c0c0c0";
    }
  }

  getActualColorForRainfall(data: any): string {
    let color = "";

    if (data == null || data == undefined || data == "NA" || data<0) {
      return "#c0c0c0";
    }
    if(data==0){
      color = "#FFFFFF";
    } else if (data >0 && data <= 2.4) {
      color = "#abf200";
    } else if (data > 2.4 && data <= 15.5) {
      color = "#03ff00";
    } else if (data > 15.5 && data <= 64.4) {
      color = "#03ffff"; // light blue
    } else if (data > 64.4 && data <= 115.5) {
      color = "#ffff00"; // yellow
    } else if (data > 115.5 && data <= 204.4) {
      color = "#ff8c00"; // orange
    } else if (data > 204.4) {
      color = "#ff0000";
    }

    return color;
  }

  getColorAndCat(departure: any) {
    // Used in Pdfs

    let color = "";
    let Cat = "";

    if (departure == null || departure == "NA" || departure == undefined) {
      return {
        color: "#c0c0c0",
        Cat: "ND",
      };
    }
    // make sure we should round off before identifying color
    departure = this.trimToZeroDecimals(departure);

    if (departure > 59) {
      Cat = "LE";
      color = "#0096ff";
    } else if (departure > 19 && departure <= 59) {
      Cat = "E";
      color = "#32c0f8";
    } else if (departure > -20 && departure <= +19) {
      Cat = "N";
      color = "#00cd5b";
    } else if (departure > -60 && departure <= -20) {
      Cat = "D";
      color = "#ff2700";
    } else if (departure > -100 && departure <= -60) {
      //Execptional case
      Cat = "LD";
      color = "#ffff20";
    } else if ((departure = -100)) {
      Cat = "NR";
      color = "#ffffff";
    }

    return {
      color: color,
      Cat: Cat,
    };
  }

  trimToOneDecimals(value: number): number {
    return Math.round(value * 10) / 10;
  }

  trimToZeroDecimals(num: number): number {
    if (num < -99 && num > -100) {
      return -99;
    }
    return Math.sign(num) * Math.round(Math.abs(num));
  }
}
