**Verification — HQ**

The Verification HQ page gives HQ (Head Quarters) and SP users a national view of data entry and verification progress across all MC and RMC centres. It operates in two modes: **Daily** (one date, all centres) and **Range / Cumulative** (a date span with a transposed multi-date view). HQ can verify stations directly and download formatted Excel reports.

Access: HQ and SP users only.

---

## Step 1 — Choose View Mode (Daily or Range)

∙ **Daily Tab:** Shows a single date's summary — how many stations each MC/RMC has updated and verified.
    → Step: Click the "Daily" tab at the top of the page (default on load).

∙ **Range Tab (Cumulative):** Shows a date-range summary with one column per date, letting you see daily progress across multiple days side by side.
    → Step: Click the "Range" tab.

<!-- INSERT SCREENSHOT: Daily and Range tab buttons at the top of the Verification HQ page, one tab active -->
(fig 4.1 : Verification HQ — Daily vs Range Tab Selection)

---

## Step 2a — Daily Mode: Select Date and Load

∙ **Date Input:** Pick the date to review. Defaults to today.
    → Step: Click the date field → pick a date.

∙ **Submit Button:** Loads the daily MC/RMC summary for the selected date.
    → Step: Click "Submit" → the MC/RMC summary table loads.

∙ **MC/RMC Summary Table (Daily):** One row per MC or RMC centre. Columns:
    ∙ S.No
    ∙ MC or RMC — centre name
    ∙ Total Stations — total stations under that centre
    ∙ Updated Stations — click the number to drill into that centre's updated stations
    ∙ Not Updated Stations — click the number to drill in
    ∙ Verified Stations — click the number to drill in
    ∙ Not Verified Stations — click the number to drill in
    → Step: Click any number in a row → a station-level detail table appears below showing that centre's stations in that category.

<!-- INSERT SCREENSHOT: Daily MC/RMC summary table with clickable count numbers in each column -->
(fig 4.2 : Verification HQ — Daily Summary Table)

∙ **Station Detail Table (after drill-down):** Shows individual stations for the selected MC/RMC and category. Columns: S.No, District/State, Station Name, Station ID, Rainfall (mm), Verified Time (if verified), Status.

∙ **Sort Columns:** Click any column header in the detail table to sort ascending/descending.

---

## Step 2b — Range Mode: Select Date Range and Load

∙ **From Date and To Date:** Pick the start and end of the period to review.
    → Step: Click "From Date" → pick start date → click "To Date" → pick end date.

∙ **Load Button:** Fetches cumulative data for the selected range.
    → Step: Click "Load" → the transposed cumulative table loads.

∙ **Cumulative Transposed Table:** Rows = MC/RMC centres. Columns = one group per date in the range, each group containing sub-columns: Updated, Not Updated, Verified, Not Verified. This gives a complete cross-date view of progress.

∙ **Column Visibility Filter Buttons:** Four buttons above the table let you hide/show column groups across all dates:
    ∙ **All** — show all sub-columns
    ∙ **Updated** — show only Updated sub-columns
    ∙ **Not Updated** — show only Not Updated sub-columns
    ∙ **Verified** — show only Verified sub-columns
    ∙ **Not Verified** — show only Not Verified sub-columns
    → Step: Click any filter button → the table re-renders showing only those columns.

<!-- INSERT SCREENSHOT: Cumulative transposed table with date column groups and the filter buttons (All, Updated, Not Updated, Verified, Not Verified) visible above -->
(fig 4.3 : Verification HQ — Cumulative Range Table with Column Filter Buttons)

---

## Step 3 — Verify Stations (both modes)

∙ **Verify Selected:** In the station detail table, check the checkbox next to individual station rows → click "Verify Selected" to verify just those stations.
    → Step: Check checkboxes → click "Verify Selected".

∙ **Verify All:** Verifies every station currently visible in the detail table at once.
    → Step: Click "Verify All" → all visible stations are marked verified.

<!-- INSERT SCREENSHOT: Station detail table with checkboxes and Verify Selected / Verify All buttons -->
(fig 4.4 : Verification HQ — Verify Actions)

---

## Step 4 — Download Excel Reports

Three download options are available depending on which mode and table is active:

∙ **Download Excel (Daily):** Downloads the daily MC/RMC summary table as a styled Excel file.
    → Filename: `Daily_Stations_Data.xlsx`
    → Step: Click "Download Excel" in Daily mode → file saves.

∙ **Download Transposed Excel (Range):** Downloads the multi-date transposed cumulative table as an Excel file with merged column group headers.
    → Filename: `Cumulative_Transposed_[startdate]_to_[enddate].xlsx`
    → Step: Click "Download Transposed Excel" in Range mode → file saves.

∙ **Download Cumulative Excel (Range):** Downloads the raw cumulative data (non-transposed format) as a separate Excel file.
    → Filename: `Cumulative_[startdate]_to_[enddate].xlsx`
    → Step: Click "Download Cumulative Excel" in Range mode → file saves.

<!-- INSERT SCREENSHOT: The three download buttons highlighted, showing which mode each belongs to -->
(fig 4.5 : Verification HQ — Three Download Options)
