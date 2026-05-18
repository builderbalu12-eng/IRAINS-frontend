/**
 * Block Coverage Analysis Script
 * IMD source  → /api/v1/fetchBlockData           (block_name match, actual_rainfall field)
 * STATE AWS   → 10 individual state AWS daily endpoints
 *               (r.block ?? r.district match, r.total_rainfall ?? r.rainfall ?? r.daily_rainfall field)
 *
 * Run: node block-coverage-analysis.js [YYYY-MM-DD]
 * Default date: yesterday
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const XLSX  = require('xlsx');

const BASE_URL        = 'https://irainshydro.imd.gov.in:3000';
const INDIA_BLOCK_PATH = path.join(__dirname, 'src/assets/geojson/INDIA_BLOCK.json');

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
const DATE = process.argv[2] || getYesterday();
console.log(`\nAnalysis date: ${DATE}\n`);

// ── HTTP POST helper ──────────────────────────────────────────────────────────
function postJSON(urlPath, body) {
  return new Promise(resolve => {
    const payload = JSON.stringify(body);
    const urlObj  = new URL(BASE_URL + urlPath);
    const lib     = urlObj.protocol === 'https:' ? https : http;
    const req = lib.request(
      { hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname,
        method: 'POST', rejectUnauthorized: false,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
      res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({ data: [] }); } });
      }
    );
    req.on('error', () => resolve({ data: [] }));
    req.write(payload);
    req.end();
  });
}

// ── 10 individual STATE AWS daily sources (same order as AllAWSDataService) ──
const AWS_SOURCES = [
  { label: 'UP AWS',          path: '/api/v1/up-aws/daily' },
  { label: 'NHP AWS',         path: '/api/v1/nhp-aws/daily' },
  { label: 'Zomato AWS',      path: '/api/v1/zomato-aws/daily' },
  { label: 'Meghalaya AWS',   path: '/api/v1/meghalaya-aws/daily' },
  { label: 'Mizoram AWS',     path: '/api/v1/mizoram-aws/daily' },
  { label: 'Tamilnadu AWS',   path: '/api/v1/tamilnadu-aws/daily' },
  { label: 'Uttarakhand AWS', path: '/api/v1/uttarakhand-aws/daily' },
  { label: 'Telangana AWS',   path: '/api/v1/telangana-aws/daily' },
  { label: 'Karnataka AWS',   path: '/api/v1/karnataka-aws/daily' },
  { label: 'IITM Mumbai',     path: '/api/v1/iitm-mumbai/daily' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Load INDIA_BLOCK.json
  console.log('Loading INDIA_BLOCK.json...');
  const geoJson  = JSON.parse(fs.readFileSync(INDIA_BLOCK_PATH, 'utf8'));
  const features = geoJson.features;
  console.log(`  Total blocks in INDIA_BLOCK.json: ${features.length}`);

  // Known district/block names from INDIA_BLOCK.json (lower-cased, for AWS matching)
  const geoDistrictSet = new Set(
    features.map(f => (f.properties.district ?? '').toLowerCase().trim()).filter(Boolean)
  );
  const geoBlockNameSet = new Set(
    features.map(f => (f.properties.block_Name ?? '').toLowerCase().trim()).filter(Boolean)
  );

  // 2. Fetch IMD block data → matched by block_Name (exact, case-sensitive from component)
  console.log('\nFetching IMD block data...');
  const imdResp = await postJSON('/api/v1/fetchBlockData', { startDate: DATE, endDate: DATE });
  const imdData = (imdResp.data || []).filter(d => d.actual_rainfall != null);
  console.log(`  IMD records with actual_rainfall: ${imdData.length}`);

  // Build IMD lookup: block_name → record
  const imdByBlockName = new Map();
  for (const d of imdData) {
    if (d.block_name) imdByBlockName.set(d.block_name.trim(), d);
  }

  // 3. Fetch all 10 STATE AWS daily sources
  console.log('\nFetching STATE AWS sources (10 endpoints)...');
  const awsBody = { startDate: DATE, endDate: DATE };
  const awsResults = [];
  for (const src of AWS_SOURCES) {
    process.stdout.write(`  ${src.label.padEnd(18)}`);
    const resp = await postJSON(src.path, awsBody);
    const rows = resp.data || [];
    // Rainfall field: total_rainfall ?? rainfall ?? daily_rainfall
    const withData = rows.filter(r =>
      r.total_rainfall != null || r.rainfall != null || r.daily_rainfall != null
    );
    // Block/district name field: r.block ?? r.district (lower-cased)
    const uniqueBlockDistricts = new Set(
      withData.map(r => ((r.block ?? r.district) ?? '').toLowerCase().trim()).filter(Boolean)
    );
    // "In IMD Map" = how many of those districts/blocks are already in INDIA_BLOCK.json
    let inGeoJson = 0;
    uniqueBlockDistricts.forEach(name => {
      if (geoDistrictSet.has(name) || geoBlockNameSet.has(name)) inGeoJson++;
    });
    const newBlocks = uniqueBlockDistricts.size - inGeoJson;
    console.log(`stations: ${rows.length}, blocks/districts w/ data: ${uniqueBlockDistricts.size}, in IMD map: ${inGeoJson}, new: ${newBlocks}`);
    awsResults.push({ ...src, rows, withData, uniqueBlockDistricts, inGeoJson, newBlocks });
  }

  // Build combined AWS district→source lookup (lower-cased district/block → source label)
  // Priority: first AWS source that covers the district wins
  const awsByDistrictName = new Map(); // lower district/block name → { source, record }
  for (const src of awsResults) {
    for (const r of src.withData) {
      const key = ((r.block ?? r.district) ?? '').toLowerCase().trim();
      if (key && !awsByDistrictName.has(key)) {
        awsByDistrictName.set(key, { source: src.label, record: r });
      }
    }
  }

  // 4. Classify each of the 5961 INDIA_BLOCK.json blocks
  const rows = [];
  for (const f of features) {
    const p        = f.properties;
    const bName    = (p.block_Name  || '').trim();
    const dName    = (p.district    || '').toLowerCase().trim();
    const bNameLow = bName.toLowerCase();

    const imdMatch = imdByBlockName.get(bName);

    // AWS match: try block_Name first, then district name
    const awsMatch = awsByDistrictName.get(bNameLow) ?? awsByDistrictName.get(dName);

    let source, awsSource, actual;
    if (imdMatch) {
      source    = 'IMD';
      awsSource = '';
      actual    = imdMatch.actual_rainfall;
    } else if (awsMatch) {
      source    = 'STATE_AWS';
      awsSource = awsMatch.source;
      const r   = awsMatch.record;
      actual    = r.total_rainfall ?? r.rainfall ?? r.daily_rainfall;
    } else {
      source    = 'NO_DATA';
      awsSource = '';
      actual    = null;
    }

    rows.push({
      Region:    p.region   || '',
      RMC_MC:    p.RMC_MC   || '',
      State:     p.state    || '',
      District:  p.district || '',
      Block:     bName,
      BlockCode: p.block_code || '',
      Source:    source,
      AWSSource: awsSource,
      Actual:    actual !== null && actual !== undefined ? parseFloat(actual) : '',
    });
  }

  // ── 5. Country totals ─────────────────────────────────────────────────────
  const total       = rows.length;
  const imdCount    = rows.filter(r => r.Source === 'IMD').length;
  const awsCount    = rows.filter(r => r.Source === 'STATE_AWS').length;
  const noDataCount = rows.filter(r => r.Source === 'NO_DATA').length;

  console.log('\n=== COUNTRY TOTAL ===');
  console.log(`  Total in INDIA_BLOCK.json : ${total}`);
  console.log(`  From IMD (actual)         : ${imdCount}`);
  console.log(`  From STATE AWS (actual)   : ${awsCount}`);
  console.log(`  No Data (unmatched)       : ${noDataCount}`);

  // ── State-level summary ───────────────────────────────────────────────────
  const stateMap = {};
  for (const r of rows) {
    if (!stateMap[r.State]) stateMap[r.State] = { Region: r.Region, State: r.State, Total: 0, IMD: 0, STATE_AWS: 0, NO_DATA: 0 };
    stateMap[r.State].Total++;
    stateMap[r.State][r.Source]++;
  }
  const stateSummary = Object.values(stateMap).sort((a, b) => a.State.localeCompare(b.State));

  console.log('\n=== STATE-LEVEL SUMMARY ===');
  console.log('State'.padEnd(42) + 'Total'.padEnd(8) + 'IMD'.padEnd(8) + 'AWS'.padEnd(8) + 'NoData');
  for (const s of stateSummary) {
    console.log(s.State.padEnd(42) + String(s.Total).padEnd(8) + String(s.IMD).padEnd(8) + String(s.STATE_AWS).padEnd(8) + String(s.NO_DATA));
  }

  // ── District-level summary ────────────────────────────────────────────────
  const distMap = {};
  for (const r of rows) {
    const key = `${r.State}||${r.District}`;
    if (!distMap[key]) distMap[key] = { Region: r.Region, State: r.State, District: r.District, Total: 0, IMD: 0, STATE_AWS: 0, NO_DATA: 0 };
    distMap[key].Total++;
    distMap[key][r.Source]++;
  }
  const distSummary = Object.values(distMap).sort((a, b) => a.State.localeCompare(b.State) || a.District.localeCompare(b.District));

  // ── AWS per-source summary table (mirrors screenshot table) ──────────────
  const awsSourceSummary = awsResults.map(s => ({
    Source:          s.label,
    TotalStations:   s.rows.length,
    BlocksWithData:  s.uniqueBlockDistricts.size,
    InIMDMap:        s.inGeoJson,
    NewBlocks:       s.newBlocks,
  }));
  const awsTotals = {
    Source:         'TOTAL',
    TotalStations:  awsSourceSummary.reduce((a, s) => a + s.TotalStations, 0),
    BlocksWithData: awsSourceSummary.reduce((a, s) => a + s.BlocksWithData, 0),
    InIMDMap:       awsSourceSummary.reduce((a, s) => a + s.InIMDMap, 0),
    NewBlocks:      awsSourceSummary.reduce((a, s) => a + s.NewBlocks, 0),
  };

  // ── Build Excel ───────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // Sheet 1: Country Summary
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['Block Coverage Analysis — Actual Rainfall', `Date: ${DATE}`],
    [],
    ['', 'Total in INDIA_BLOCK.json', 'From IMD (Actual)', 'From STATE AWS (Actual)', 'No Data (Unmatched)'],
    ['INDIA (Country)', total, imdCount, awsCount, noDataCount],
  ]);
  ws1['!cols'] = [{ wch: 20 }, { wch: 28 }, { wch: 22 }, { wch: 26 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Country Summary');

  // Sheet 2: AWS Source Summary (mirrors the screenshot table)
  const awsHeaders = ['AWS Source', 'Total Stations', 'Blocks w/ AWS Data', 'In IMD Map (INDIA_BLOCK)', 'New Blocks (Not in IMD Map)'];
  const awsRows = awsSourceSummary.map(s => [s.Source, s.TotalStations, s.BlocksWithData, s.InIMDMap, s.NewBlocks]);
  awsRows.push([awsTotals.Source, awsTotals.TotalStations, awsTotals.BlocksWithData, awsTotals.InIMDMap, awsTotals.NewBlocks]);
  const ws2 = XLSX.utils.aoa_to_sheet([awsHeaders, ...awsRows]);
  ws2['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 26 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'AWS Source Summary');

  // Sheet 3: State Summary
  const stateHeaders = ['Region', 'State', 'Total in INDIA_BLOCK', 'From IMD (Actual)', 'From STATE AWS', 'No Data'];
  const stateRows = stateSummary.map(s => [s.Region, s.State, s.Total, s.IMD, s.STATE_AWS, s.NO_DATA]);
  stateRows.push(['', 'INDIA TOTAL',
    stateSummary.reduce((a, s) => a + s.Total, 0),
    stateSummary.reduce((a, s) => a + s.IMD, 0),
    stateSummary.reduce((a, s) => a + s.STATE_AWS, 0),
    stateSummary.reduce((a, s) => a + s.NO_DATA, 0),
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet([stateHeaders, ...stateRows]);
  ws3['!cols'] = [{ wch: 25 }, { wch: 38 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'State Summary');

  // Sheet 4: District Summary
  const distHeaders = ['Region', 'State', 'District', 'Total in INDIA_BLOCK', 'From IMD', 'From STATE AWS', 'No Data'];
  const distRows = distSummary.map(d => [d.Region, d.State, d.District, d.Total, d.IMD, d.STATE_AWS, d.NO_DATA]);
  distRows.push(['', '', 'INDIA TOTAL',
    distSummary.reduce((a, d) => a + d.Total, 0),
    distSummary.reduce((a, d) => a + d.IMD, 0),
    distSummary.reduce((a, d) => a + d.STATE_AWS, 0),
    distSummary.reduce((a, d) => a + d.NO_DATA, 0),
  ]);
  const ws4 = XLSX.utils.aoa_to_sheet([distHeaders, ...distRows]);
  ws4['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 35 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'District Summary');

  // Sheet 5: Block Detail — all 5961 blocks
  const detailHeaders = ['S.No', 'Region', 'RMC/MC', 'State', 'District', 'Block Name', 'Block Code', 'Source', 'AWS Sub-Source', 'Actual Rainfall (mm)'];
  const detailRows = rows.map((r, i) => [
    i + 1, r.Region, r.RMC_MC, r.State, r.District, r.Block, r.BlockCode, r.Source, r.AWSSource, r.Actual
  ]);
  const ws5 = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
  ws5['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 26 }, { wch: 32 }, { wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws5, 'Block Detail');

  const outFile = path.join(__dirname, `Block_Coverage_${DATE}.xlsx`);
  XLSX.writeFile(wb, outFile);
  console.log(`\nExcel saved: ${outFile}`);
}

main().catch(console.error);
