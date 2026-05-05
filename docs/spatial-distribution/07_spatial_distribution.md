**Spatial Distribution**

The Spatial Distribution section shows how widely rainfall is spread across India — not just how much fell, but **where** it fell and how many stations reported it. It has two halves: **three map views** (Daily, Weekly, Cumulative) that colour-code districts by departure from normal, and one **Table view** that classifies every subdivision/state into coverage categories (Isolated → Widespread) with day-by-day navigation.

Available pages (from the menu):
    ∙ District Daily Spatial Map (`/district-daily-spatial`)
    ∙ Weekly District Spatial Map (`/weekly-daily-spatial`)
    ∙ Cumulative District Spatial Map (`/cummulative-daily-spatial`)
    ∙ Spatial Distribution Table (`/spatial-table`)

---

## 1. District Daily Spatial Map

Shows district-wise rainfall departure from normal for a single selected day, rendered as a colour-coded heat map over India.

**Step-by-step:**

∙ **Step 1 — Select Date:** Click the "Select Date" input field at the top of the page → type or pick the date you want to view.

∙ **Step 2 — Submit:** Click the "Submit" button → the map fetches data and redraws all district colours for that date. A loading spinner appears while data loads.

∙ **Step 3 — Read the Map:** Each district is filled with a colour based on its departure from historical normal:
    ∙ Blue (`#0096ff`) — Large Excess (60% or more above normal)
    ∙ Cyan (`#32c0f8`) — Excess (20% to 59% above normal)
    ∙ Green (`#00cd5b`) — Normal (−19% to +19%)
    ∙ Red (`#ff2700`) — Deficient (−59% to −20%)
    ∙ Yellow (`#ffff20`) — Large Deficient (−99% to −60%)
    ∙ White — No Rain (−100%)
    ∙ Grey — No Data

∙ **Step 4 — Read the Legend:** The legend panel at the bottom of the map lists each category with its colour box and range. Use it to interpret the map colours.

∙ **Step 5 — Check India Summary Table:** Below the map (or inside the fullscreen view), a small table shows the all-India aggregated values:
    ∙ Actual (mm) — orange cell
    ∙ Normal (mm) — white cell
    ∙ % Departure — green cell

∙ **Step 6 — Fullscreen (optional):** Click the fullscreen icon (↗↙ arrows) to expand the map to full screen. In fullscreen mode: pan and zoom are enabled, the India summary table repositions to the corner. Click "Reset Position" to re-centre India at any time.

∙ **Step 7 — Download:**
    ∙ Click **"Map Download"** → saves the current map as a high-resolution JPEG.
    ∙ Click **"Map PDF Download"** → saves the map as a landscape A4 PDF.
    ∙ Click **"Statistics Download"** → saves the district-level data as an .xlsx (Excel) file.
    ∙ Click **"Reset Position"** → re-centres the map to default India view without downloading.

<!-- INSERT SCREENSHOT: Daily spatial map with date input, submit button, coloured districts, legend, and India summary table visible -->
(fig 7.1 : District Daily Spatial Map — Date Selected and Map Loaded)

<!-- INSERT SCREENSHOT: Download button row highlighted -->
(fig 7.2 : District Daily Spatial Map — Download Options)

---

## 2. Weekly District Spatial Map

Same district-level departure map as Daily, but the date input is replaced by a **week selector dropdown** — letting you view the aggregate rainfall pattern for any calendar week.

**Step-by-step:**

∙ **Step 1 — Open Week Selector:** Click the week dropdown at the top of the page. The list is organised by month groups (e.g., "January", "February", etc.).

∙ **Step 2 — Pick a Week:** Each option in the dropdown shows: **"Week X (DD-MM-YYYY – DD-MM-YYYY)"** — the week number and its exact start and end dates. Click the week you want. The page auto-selects the most recent available week on first load.

∙ **Step 3 — Submit:** Click the "Submit" button → the map reloads with the selected week's aggregate departure data. Districts are coloured using the same departure colour scheme as the Daily map.

∙ **Step 4 — Read and Interact:** All map interactions are identical to the Daily map — hover tooltip, legend, India summary table, fullscreen mode, and download buttons work the same way.

∙ **Step 5 — Download:** Same four download buttons: Map Download (JPEG), Map PDF Download, Statistics Download (.xlsx), Reset Position.

<!-- INSERT SCREENSHOT: Weekly map page showing the week dropdown open with month groups and week options listed -->
(fig 7.3 : Weekly District Spatial Map — Week Selector Dropdown Open)

<!-- INSERT SCREENSHOT: Weekly map loaded with a week selected and districts coloured -->
(fig 7.4 : Weekly District Spatial Map — Map Loaded for Selected Week)

---

## 3. Cumulative District Spatial Map

Shows the **accumulated** departure from normal over a user-defined date range (From Date → To Date), rather than a single day or week. Useful for monitoring seasonal or multi-week rainfall shortfalls or excesses.

**Step-by-step:**

∙ **Step 1 — Select From Date:** Click the "From Date" input → type or pick the start date of your period.

∙ **Step 2 — Select To Date:** Click the "To Date" input → type or pick the end date. The To Date must be on or after the From Date.

∙ **Step 3 — Submit:** Click the "Submit" button → the map fetches cumulative data for the selected range and colours each district based on cumulative departure over that period.

∙ **Step 4 — Read the Map:** Colour scheme and legend are identical to Daily and Weekly maps (departure-based). The India summary table shows cumulative Actual, Normal, and % Departure for the whole country over the selected period.

∙ **Step 5 — Fullscreen and Download:** Same fullscreen toggle and four download buttons (JPEG / PDF / .xlsx / Reset Position) as the other spatial maps.

<!-- INSERT SCREENSHOT: Cumulative map page with From Date and To Date filled in, submit button highlighted, and map showing cumulative departure colours -->
(fig 7.5 : Cumulative District Spatial Map — Date Range and Map)

---

## 4. Spatial Distribution Table

A detailed tabular view of rainfall **coverage** — how many stations reported rainfall in each subdivision or state, and what category of spatial spread that represents. Includes a live map that mirrors the table data.

**Step-by-step:**

### 4a — Choose Geographic Level

∙ **Step 1 — Toggle Subdivision / State:** At the top of the page, two toggle buttons switch the entire page (table + map) between:
    ∙ **Subdivision** — IMD meteorological subdivisions (finer level)
    ∙ **State** — State-level aggregation
    → Click "Subdivision" or "State" → table and map reload for that level.

<!-- INSERT SCREENSHOT: Toggle buttons "Subdivision" and "State" at top of table page, one highlighted as active -->
(fig 7.6 : Spatial Distribution Table — Subdivision / State Toggle)

---

### 4b — Choose View Mode (Period or Daywise)

∙ **Step 2 — Select Period Mode:** Click the **"Period"** button (top-right of controls) to view aggregated totals across a date range. Best for summary reports.

∙ **Step 3 — Select Daywise Mode:** Click the **"Daywise"** button to view data day-by-day within a date range, with Prev/Next navigation.

---

### 4c — Set Date Range and Load Data

∙ **Step 4 — Enter Start Date:** Click the "Start Date" input → pick or type the beginning date.

∙ **Step 5 — Enter End Date:** Click the "End Date" input → pick or type the end date.

∙ **Step 6 — Submit:** Click the "Submit" button → the table and map populate with data for the chosen mode and date range.

<!-- INSERT SCREENSHOT: Date inputs (Start Date, End Date), Submit button, and Period/Daywise mode buttons visible together -->
(fig 7.7 : Spatial Distribution Table — Date Range Controls and Mode Buttons)

---

### 4d — Navigate Days (Daywise Mode Only)

∙ **Step 7 — Navigate with Prev / Next:** When in Daywise mode, three controls appear above the table:
    ∙ **← Prev** button — go to the previous day (disabled on the first day of the range)
    ∙ **Current Date** display — shows the active day in DD-MM-YYYY format
    ∙ **Next →** button — go to the next day (disabled on the last day of the range)
    → Click Prev or Next → table and map instantly update for that day without reloading the page.

<!-- INSERT SCREENSHOT: Daywise navigation bar with Prev button, date display, and Next button highlighted -->
(fig 7.8 : Spatial Distribution Table — Daywise Navigation)

---

### 4e — Read and Interact with the Table

∙ **Step 8 — Search:** Type any subdivision or state name in the search box (magnifying glass icon, top-left) → the table filters in real time to matching rows.

∙ **Step 9 — Sort Columns:** Click any column header to sort the table by that column. Click again to reverse the sort order. Sortable columns:
    ∙ Name (Subdivision or State name)
    ∙ Total Stations
    ∙ Stations Reported Rainfall
    ∙ Percentage (% of stations that reported)
    ∙ Category

∙ **Step 10 — Filter by Category:** Click the funnel icon in the "Category" column header to sort by category order: Isolated → Scattered → Fairly Widespread → Widespread.

∙ **Understanding the Category column — what each category means:**
    ∙ **Isolated** (≤25% of stations reported) — green badge — Rain was very localised; most stations recorded nothing.
    ∙ **Scattered** (26%–50% of stations) — dark green badge — Rain fell in patches; less than half of stations reported.
    ∙ **Fairly Widespread** (51%–75% of stations) — cyan badge — More than half the area received rain.
    ∙ **Widespread** (76%–100% of stations) — blue badge — Rain was across nearly the entire subdivision/state.

<!-- INSERT SCREENSHOT: Table with all columns visible — Name, Total Stations, Stations Reported, Percentage, Category badges. One row hovered or highlighted. -->
(fig 7.9 : Spatial Distribution Table — Data Columns and Category Badges)

∙ **Step 11 — Paginate:** Use the pagination bar at the bottom of the table to move between pages of results (shows page size selector and page navigation arrows).

---

### 4f — Read the Spatial Map (below the table)

∙ **Step 12 — View the Map:** Below the table, a live map auto-renders subdivisions or states coloured by their category — matching the table data exactly. Colours:
    ∙ Bright Green (`#03ff3f`) — Isolated
    ∙ Dark Green (`#00683a`) — Scattered
    ∙ Cyan (`#00fcf1`) — Fairly Widespread
    ∙ Blue (`#3400f6`) — Widespread
    ∙ Grey — No Data

∙ **Step 13 — Click a Region on the Map:** Clicking any coloured subdivision or state on the map shows a popup with:
    ∙ Subdivision / State name
    ∙ Total Stations
    ∙ Reported Stations
    ∙ Percentage (%)
    ∙ Category

<!-- INSERT SCREENSHOT: Spatial map below the table with colour-coded subdivisions and a popup open on a clicked region -->
(fig 7.10 : Spatial Distribution Table — Live Map with Popup)

---

### 4g — Download PDF

∙ **Step 14 — Download PDF:** Click the **"⬇️ PDF"** button (top-right of the table controls) → the system generates an official T/P Message report (IMD format MF-08B) and downloads it as:
    `Spatial_Distribution_DD-MM-YYYY.pdf`
    The PDF includes: header with date, table of all subdivisions/states with their category, and an authorization/signature section. For MC/RMC users, the PDF is automatically filtered to only include subdivisions within their operational jurisdiction.

<!-- INSERT SCREENSHOT: PDF download button highlighted, and a sample of the downloaded PDF shown -->
(fig 7.11 : Spatial Distribution Table — PDF Download Output)
