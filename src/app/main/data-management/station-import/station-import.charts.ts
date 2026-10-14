import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import { NetworkOverview, PreviewResponse } from 'src/app/services/station-import/station-import.models';

/** One palette for the page: charts, map markers, tiles and legends all use these. */
export const SI_COLORS = {
  imd: '#1f4e9c',
  state: '#0f8b8d',
  inactive: '#c5ccd6',
  new: '#1e8e4e',
  change: '#c27c00',
  flag: '#6a4fc9',
  missing: '#7d8797',
  error: '#c62828',
  ink: '#002467',
  muted: '#5b6675',
  grid: '#e7ebf0',
} as const;

const BASE: Highcharts.Options = {
  title: { text: '' },
  credits: { enabled: false },
  exporting: { enabled: false },
  chart: { backgroundColor: 'transparent', style: { fontFamily: 'inherit' }, spacing: [8, 8, 8, 8] },
  legend: {
    itemStyle: { color: SI_COLORS.muted, fontSize: '11px', fontWeight: '500' },
    symbolRadius: 2,
  },
  tooltip: { shared: true, borderRadius: 6, borderWidth: 0, shadow: true, backgroundColor: '#ffffff' },
};

const axisLabels = { style: { color: SI_COLORS.muted, fontSize: '11px' } };

const fmt = (n: number): string => n.toLocaleString('en-IN');

/** Active stations per centre, IMD network and State AWS stacked; inactive as a third band. */
export function buildCentreChart(o: NetworkOverview): Chart {
  const rows = [...o.byCentre].sort((a, b) => b.imdActive + b.stateActive - (a.imdActive + a.stateActive));
  return new Chart({
    ...BASE,
    chart: { ...BASE.chart, type: 'bar', height: rows.length * 19 + 70 },
    xAxis: {
      categories: rows.map((r) => r.centre.replace(/^(RMC|MC) /, '$1 ')),
      labels: { ...axisLabels, style: { ...axisLabels.style, fontSize: '10.5px' } },
      lineColor: SI_COLORS.grid,
      tickLength: 0,
    },
    yAxis: {
      title: { text: '' },
      gridLineColor: SI_COLORS.grid,
      labels: axisLabels,
      stackLabels: { enabled: true, style: { color: SI_COLORS.muted, fontSize: '10px', fontWeight: '500', textOutline: 'none' } },
    },
    plotOptions: { bar: { stacking: 'normal', borderWidth: 0, pointPadding: 0.08, groupPadding: 0.06, borderRadius: 2 } },
    series: [
      { type: 'bar', name: 'IMD network (active)', color: SI_COLORS.imd, data: rows.map((r) => r.imdActive) },
      { type: 'bar', name: 'State AWS (active)', color: SI_COLORS.state, data: rows.map((r) => r.stateActive) },
      { type: 'bar', name: 'Inactive (flag 0)', color: SI_COLORS.inactive, data: rows.map((r) => r.inactive) },
    ],
  });
}

/** Station types, coloured by the table they live in. */
export function buildTypeChart(o: NetworkOverview): Chart {
  const rows = [...o.byType];
  return new Chart({
    ...BASE,
    chart: { ...BASE.chart, type: 'column', height: 250 },
    xAxis: {
      categories: rows.map((r) => r.type),
      labels: { ...axisLabels, style: { ...axisLabels.style, fontFamily: 'monospace' } },
      lineColor: SI_COLORS.grid,
      tickLength: 0,
    },
    yAxis: { title: { text: '' }, gridLineColor: SI_COLORS.grid, labels: axisLabels },
    legend: { enabled: false },
    tooltip: {
      ...BASE.tooltip,
      shared: false,
      formatter: function (this: Highcharts.TooltipFormatterContextObject) {
        const r = rows[this.point.index];
        const where = r.table === 'aws_station_details' ? 'aws_station_details' : 'station_details';
        return `<b>${r.type}</b> · ${where}<br/>Active: <b>${fmt(r.active)}</b><br/>Inactive: ${fmt(r.inactive)}`;
      },
    },
    plotOptions: { column: { stacking: 'normal', borderWidth: 0, borderRadius: 3, pointPadding: 0.06, groupPadding: 0.08 } },
    series: [
      {
        type: 'column',
        name: 'Active',
        data: rows.map((r) => ({ y: r.active, color: r.table === 'aws_station_details' ? SI_COLORS.state : SI_COLORS.imd })),
        dataLabels: {
          enabled: true,
          style: { color: SI_COLORS.muted, fontSize: '10px', fontWeight: '500', textOutline: 'none' },
          formatter: function (this: Highcharts.PointLabelObject) {
            const r = rows[this.point.index];
            return fmt(r.active + r.inactive);
          },
          crop: false,
          overflow: 'allow',
          y: -2,
        },
      },
      { type: 'column', name: 'Inactive', color: SI_COLORS.inactive, data: rows.map((r) => r.inactive) },
    ],
  });
}

/** Active stations per homogeneous region. */
export function buildRegionChart(o: NetworkOverview): Chart {
  const rows = o.byRegion;
  return new Chart({
    ...BASE,
    chart: { ...BASE.chart, type: 'bar', height: 200 },
    xAxis: {
      categories: rows.map((r) => titleCase(r.region)),
      labels: axisLabels,
      lineColor: SI_COLORS.grid,
      tickLength: 0,
    },
    yAxis: { title: { text: '' }, gridLineColor: SI_COLORS.grid, labels: axisLabels, reversedStacks: false },
    plotOptions: { bar: { stacking: 'normal', borderWidth: 0, borderRadius: 2, pointPadding: 0.1, groupPadding: 0.08 } },
    series: [
      { type: 'bar', name: 'IMD network', color: SI_COLORS.imd, data: rows.map((r) => r.imdActive) },
      { type: 'bar', name: 'State AWS', color: SI_COLORS.state, data: rows.map((r) => r.stateActive) },
    ],
  });
}

/** Rows per station type in the uploaded file — read in the browser, before any server call. */
export function buildFileTypeChart(rows: { type: string; count: number; sType: boolean }[]): Chart {
  return new Chart({
    ...BASE,
    chart: { ...BASE.chart, type: 'column', height: 190 },
    xAxis: {
      categories: rows.map((r) => r.type),
      labels: { ...axisLabels, style: { ...axisLabels.style, fontFamily: 'monospace' } },
      lineColor: SI_COLORS.grid,
      tickLength: 0,
    },
    yAxis: { title: { text: '' }, gridLineColor: SI_COLORS.grid, labels: axisLabels },
    legend: { enabled: false },
    tooltip: { ...BASE.tooltip, shared: false, pointFormat: '<b>{point.y}</b> rows' },
    plotOptions: {
      column: {
        borderWidth: 0,
        borderRadius: 3,
        pointPadding: 0.06,
        groupPadding: 0.08,
        dataLabels: { enabled: true, style: { color: SI_COLORS.muted, fontSize: '10px', fontWeight: '500', textOutline: 'none' } },
      },
    },
    series: [
      {
        type: 'column',
        name: 'Rows',
        data: rows.map((r) => ({ y: r.count, color: r.sType ? SI_COLORS.state : SI_COLORS.imd })),
      },
    ],
  });
}

/** Which centres the preview touches, so the right MC/RMC can be contacted before applying. */
export function buildImpactByCentreChart(p: PreviewResponse): Chart | null {
  type Bucket = { newCount: number; change: number; flag: number; missing: number; error: number };
  const byCentre = new Map<string, Bucket>();
  const bump = (centre: string, key: keyof Bucket): void => {
    const b = byCentre.get(centre) ?? { newCount: 0, change: 0, flag: 0, missing: 0, error: 0 };
    b[key] += 1;
    byCentre.set(centre, b);
  };
  p.newStations.forEach((r) => bump(r.centre, 'newCount'));
  p.fieldChanges.forEach((r) => bump(r.centre, 'change'));
  p.flagChanges.forEach((r) => bump(r.centre, 'flag'));
  p.missingFromFile.forEach((r) => bump(r.centre, 'missing'));
  p.issues.filter((i) => i.severity === 'error').forEach((r) => bump(r.centre, 'error'));
  if (byCentre.size === 0) return null;

  const total = (b: Bucket): number => b.newCount + b.change + b.flag + b.missing + b.error;
  const rows = [...byCentre.entries()].sort((a, b) => total(b[1]) - total(a[1]));

  return new Chart({
    ...BASE,
    chart: { ...BASE.chart, type: 'bar', height: Math.max(220, rows.length * 26 + 80) },
    xAxis: { categories: rows.map(([c]) => c), labels: axisLabels, lineColor: SI_COLORS.grid, tickLength: 0 },
    yAxis: {
      title: { text: '' },
      gridLineColor: SI_COLORS.grid,
      labels: axisLabels,
      allowDecimals: false,
      reversedStacks: false,
      stackLabels: { enabled: true, style: { color: SI_COLORS.muted, fontSize: '10px', fontWeight: '500', textOutline: 'none' } },
    },
    plotOptions: { bar: { stacking: 'normal', borderWidth: 0, borderRadius: 2, pointPadding: 0.1, groupPadding: 0.08 } },
    series: [
      { type: 'bar', name: 'New', color: SI_COLORS.new, data: rows.map(([, b]) => b.newCount || null) },
      { type: 'bar', name: 'Field changes', color: SI_COLORS.change, data: rows.map(([, b]) => b.change || null) },
      { type: 'bar', name: 'Flag changes', color: SI_COLORS.flag, data: rows.map(([, b]) => b.flag || null) },
      { type: 'bar', name: 'Missing from file', color: SI_COLORS.missing, data: rows.map(([, b]) => b.missing || null) },
      { type: 'bar', name: 'Errors', color: SI_COLORS.error, data: rows.map(([, b]) => b.error || null) },
    ],
  });
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
