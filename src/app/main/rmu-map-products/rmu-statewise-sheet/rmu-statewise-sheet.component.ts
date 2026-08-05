import { Component, ElementRef, Input, ViewChild } from "@angular/core";

/** one projected district, ready to draw */
export interface RmuStatewiseShape {
  path: string;
  fill: string;
  labelX: number;
  labelY: number;
  name: string;
  departure: string;
}

/**
 * The statewise district departure sheet (StatewiseDistrictMap_iRAINS.py), as
 * a presentational component. Data comes from RmuSheetBuilderService; both the
 * standalone page and the ALL STATISTICS console render through this.
 */
@Component({
  selector: "app-rmu-statewise-sheet",
  templateUrl: "./rmu-statewise-sheet.component.html",
  styleUrls: ["./rmu-statewise-sheet.component.css"],
})
export class RmuStatewiseSheetComponent {
  @Input() title = "";
  @Input() periodLabel = "";
  @Input() shapes: RmuStatewiseShape[] = [];
  @Input() viewBox = "0 0 1000 1000";
  @Input() labelFont = 23;
  @Input() labelLine = 23 * 1.2;
  @Input() scale = 1;
  @Input() loading = false;

  /** the element to hand to html-to-image */
  @ViewChild("sheet", { static: true }) sheetRef!: ElementRef<HTMLElement>;

  readonly legendItems = [
    { color: "#0099ff", text: "Large Excess [ 60% or more]" },
    { color: "#66cbff", text: "Excess [ 20% to 59%]" },
    { color: "#5de360", text: "Normal [-19% to 19%]" },
    { color: "#ff5a00", text: "Deficient [-59% to -20%]" },
    { color: "#ffff00", text: "Large Deficient [-99% to -60%]" },
    { color: "#ffffff", text: "No Rain  [-100%]" },
    { color: "#c0c0c0", text: "No Data" },
  ];

  /** the template's own height; 1000 x 1400 is the 2400x3360 sheet */
  get sheetHeight(): number {
    return 1400;
  }
}
