import { Component, ElementRef, Input, ViewChild } from "@angular/core";
import { RmuMapGeoService } from "../rmu-map-geo.service";

/** one projected feature, ready to draw */
export interface RmuSheetShape {
  path: string;
  fill: string;
  labelX: number;
  labelY: number;
  actual: string;
  normal: string;
  departure: string;
  abb: string;
}

/**
 * The country-format RMU sheet, as a presentational component.
 *
 * Everything here is a 1:1 trace of the printed products (see the component
 * css). It holds no data logic on purpose: RmuSheetBuilderService produces the
 * view model, and both the standalone map page and the ALL STATISTICS console
 * render it through this one component so the pixel-tuned layout lives in a
 * single place.
 */
@Component({
  selector: "app-rmu-sheet",
  templateUrl: "./rmu-sheet.component.html",
  styleUrls: ["./rmu-sheet.component.css"],
})
export class RmuSheetComponent {
  @Input() title = "";
  @Input() titleFontSize = 29;
  @Input() periodLabel = "";
  @Input() shapes: RmuSheetShape[] = [];
  @Input() viewBox = "0 0 1000 1270";
  @Input() labelFont = 9.7;
  @Input() labelLine = 9.7 * 1.2;
  @Input() showLabels = true;
  @Input() showAllIndia = true;
  @Input() allIndiaLine = "";
  @Input() strokeWidth = 0.7;
  /** css scale applied to the fixed 1000px sheet */
  @Input() scale = 1;
  @Input() loading = false;
  /** departure sheets print Act (Dep%) / Abb / Nor; actual sheets drop the
   *  departure and normal lines and just print the rainfall */
  @Input() variant: "DEPARTURE" | "ACTUAL" = "DEPARTURE";
  /** defaults to the departure legend; actual sheets pass their own */
  @Input() legend: { color: string; text: string }[] | null = null;

  /** the element to hand to html-to-image */
  @ViewChild("sheet", { static: true }) sheetRef!: ElementRef<HTMLElement>;

  get legendItems(): { color: string; text: string }[] {
    return this.legend || this.geo.legendItems;
  }

  constructor(private geo: RmuMapGeoService) {}

  /** the printed product's own height; 1000 x 1261 is the 3958x4992 sheet */
  get sheetHeight(): number {
    return 1261;
  }

  /** first label line: `2.1 (-18%)` on departure sheets, `2.1` on actual */
  actualLine(shape: RmuSheetShape): string {
    return this.variant === "ACTUAL"
      ? shape.actual
      : `${shape.actual} (${shape.departure}%)`;
  }

  /** the normal-rainfall line only belongs on a departure sheet */
  get showNormalLine(): boolean {
    return this.variant !== "ACTUAL";
  }
}
