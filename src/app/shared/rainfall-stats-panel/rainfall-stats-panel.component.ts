import { Component, Input } from '@angular/core';

export interface RainfallCategoryStats {
  day: Record<string, { count: number; area: number }>;
  period: Record<string, { count: number; area: number }>;
}

// Right-panel statistics table used next to a rainfall map (mirrors the
// tables on /daily-*-rf-distribution). Each map page runs its own
// service-specific loadStats() and feeds the normalized result in via
// these @Inputs — this component only renders it, so the same skeleton
// loader / table markup / fixed-height-to-match-the-map-card behaviour
// isn't duplicated per page.
@Component({
  selector: 'app-rainfall-stats-panel',
  templateUrl: './rainfall-stats-panel.component.html',
  styleUrls: ['./rainfall-stats-panel.component.css'],
})
export class RainfallStatsPanelComponent {
  @Input() title: string = 'STATISTICS';
  @Input() entityLabel: string = '';
  @Input() loading: boolean = false;
  @Input() showTable: boolean = false;
  @Input() dayLabel: string = '';
  @Input() periodLabel: string = '';
  @Input() rows: any[][] = [];
  @Input() categoryStats: RainfallCategoryStats | null = null;

  readonly categoryOrder = ['LE', 'E', 'N', 'D', 'LD', 'NR'];
  readonly categoryLabels: Record<string, string> = {
    LE: 'Large Excess', E: 'Excess', N: 'Normal',
    D: 'Deficient', LD: 'Large Deficient', NR: 'No Rain',
  };
  readonly skeletonRows = Array(40).fill(0);

  cellContent(cell: any): any {
    return cell && typeof cell === 'object' && 'content' in cell ? cell.content : cell;
  }

  cellStyle(cell: any): { [key: string]: string } {
    const fill = cell?.styles?.fillColor;
    if (Array.isArray(fill)) {
      return { 'background-color': `rgb(${fill[0]}, ${fill[1]}, ${fill[2]})` };
    }
    if (typeof fill === 'string') {
      return { 'background-color': fill };
    }
    return {};
  }
}




