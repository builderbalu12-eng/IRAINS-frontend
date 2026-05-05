**Station Statistics**

The Station Statistics page is a deep-dive tool for exploring individual station data on an interactive map. Each station marker on the map can be clicked to see a 30-day rainfall chart and surrounding station comparison. Users can also filter the map by station type, rainfall category, or draw a custom polygon to select stations within an area.

Access: HQ, MC, and SP users.

---

## Step 1 — Set Date and Load the Map

∙ **Date Picker:** Select the date for which station-level data should be displayed on the map. Defaults to today.
    → Step: Click the date input → pick a date → the map markers update for that date.

<!-- INSERT SCREENSHOT: Map loaded with station markers coloured by rainfall category, date picker visible at top -->
(fig 6.1 : Station Statistics — Map with Station Markers)

---

## Step 2 — Filter Stations

∙ **Cascading Hierarchy Filters:** Narrow down which stations appear on the map:
    ∙ Region (multi-select)
    ∙ MC (multi-select, disabled if RMC is selected)
    ∙ RMC (multi-select, disabled if MC is selected)
    ∙ State (multi-select)
    ∙ District (multi-select)
    ∙ Station (multi-select — pick specific stations)
    → Step: Select from Region → MC or RMC → State → District → Station (any level, no need to fill all) → apply filters → map re-renders showing only matching stations.

∙ **Station Type Toggle (AWS / ORG / ARG):** Three checkboxes that show or hide stations by their instrument type. Check all three to show everything, uncheck any to hide that type.
    ∙ AWS — Automatic Weather Station
    ∙ ORG — Ordinary Raingauge
    ∙ ARG — Automatic Recording Gauge
    → Step: Check or uncheck any type toggle → map markers for that type appear or disappear instantly.

∙ **Rainfall Category Toggles:** Checkboxes for each rainfall intensity band. Uncheck a category to hide stations that fall in that range:
    ∙ Very Light (0.001 mm – 2.4 mm)
    ∙ Light (>2.4 mm – 15.5 mm)
    ∙ Moderate (>15.5 mm – 64.4 mm)
    ∙ Heavy (>64.4 mm – 115.5 mm)
    ∙ Very Heavy (>115.5 mm – 204.4 mm)
    ∙ Extremely Heavy (>204.4 mm)
    ∙ Zero Rainfall (0 mm)
    → Step: Uncheck any category → stations in that rainfall band disappear from the map.

<!-- INSERT SCREENSHOT: Filter panel showing station type checkboxes and rainfall category toggles side by side -->
(fig 6.2 : Station Statistics — Station Type and Rainfall Category Filters)

---

## Step 3 — Explore a Station (More Info Popup)

∙ **Click a Station Marker:** Clicking any marker on the map opens a popup with two action buttons: **More Info** and **Compare**.

∙ **More Info:** Opens a detailed panel for that station showing:
    ∙ Station name, ID, type, district, state
    ∙ Today's rainfall and normal values
    ∙ A **30-day daily rainfall line chart** (Highcharts) — Actual vs Normal for the past 30 days
    → Step: Click a marker → click "More Info" → panel appears with the 30-day chart.

<!-- INSERT SCREENSHOT: Station popup with More Info button, and the detail panel open showing the 30-day chart -->
(fig 6.3 : Station Statistics — Station Detail and 30-Day Rainfall Chart)

---

## Step 4 — Compare with Surrounding Stations

∙ **Compare (from marker popup):** Opens a comparison view centred on the selected station. Shows all surrounding stations within a configurable radius.
    → Step: Click a marker → click "Compare" → the comparison panel opens.

∙ **Radius Slider:** Adjusts the search radius (in km) for surrounding stations. Moving the slider updates the surrounding station list and map circle in real time.
    → Step: Drag the radius slider left (smaller area) or right (larger area) → list updates.

∙ **Surrounding Stations Table:** Lists all stations found within the radius. Columns:
    ∙ Select (checkbox)
    ∙ Station Name
    ∙ State
    ∙ Distance (km from the selected station)
    ∙ Rainfall (mm)
    → Step: Check the checkbox next to one or more surrounding stations → they are added to the comparison chart below.

∙ **Comparison Chart:** A Highcharts line chart shows 30-day rainfall trends for the selected station alongside any checked surrounding stations. Each station appears as a separate coloured line.
    → Step: Check stations in the table → chart re-draws with all selected stations' lines overlaid.

<!-- INSERT SCREENSHOT: Comparison panel with radius slider, surrounding stations table with checkboxes, and multi-line comparison chart -->
(fig 6.4 : Station Statistics — Compare with Surrounding Stations)

---

## Step 5 — Plot Area (Polygon Selection)

∙ **Plot Area Button:** Activates free-hand polygon drawing mode on the map. Draw a shape around any group of stations to select all stations inside that polygon.
    → Step: Click "Plot Area" → click on the map to place polygon vertices → close the shape by clicking the first point again → all stations inside the polygon are selected and listed.

∙ **Top N Stations Input:** A number input (range 1–50) that limits the display to the top N stations by rainfall within the selected polygon or current filter.
    → Step: Type a number (e.g., 10) in the Top N input → the table updates to show only the top 10 stations by rainfall.

<!-- INSERT SCREENSHOT: Map with a polygon drawn around a set of stations and the Top-N input field visible -->
(fig 6.5 : Station Statistics — Plot Area Polygon and Top N Selection)

---

## Step 6 — Download Charts

∙ **Chart Download (Highcharts menu):** Every chart (30-day, comparison) has a Highcharts export button (≡ icon, top-right of chart). Click it to download the chart as:
    ∙ PNG image
    ∙ JPEG image
    ∙ PDF document
    ∙ SVG vector graphic
    → Step: Click the ≡ icon on any chart → select the format → file downloads.

∙ **Print Chart:** The same Highcharts menu also includes a "Print" option to send the chart directly to a printer.

∙ **Map Image Download:** A separate button downloads the current map view (with markers) as a PNG image.
    → Step: Click "Map Download" → map image saves to your computer.

<!-- INSERT SCREENSHOT: Highcharts export menu open on a chart showing PNG, JPEG, PDF, SVG, and Print options -->
(fig 6.6 : Station Statistics — Chart Export Options)
