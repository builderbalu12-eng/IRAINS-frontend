**Block Rainfall Map**

The Block Rainfall Map page provides the finest-grained spatial view in iRAINS — drilling down to individual revenue blocks across India. It supports both Actual and Departure views, AWS time-granularity filters, and an AWS Coverage Stats panel that shows how many blocks have automated weather station data.

Accessible via: Home → Block Rainfall Monitoring Scheme, or from the Rainfall Map menu.

---

## Filter Panel

∙ **Region Filter (Multi-Select):** Select one or more broad geographic regions (e.g., East & North-East, North-West, South Peninsular, Central). Acts as the top of the hierarchy — all lower dropdowns filter based on region selection.
    → Step: Click the Region multi-select → check one or more regions → lower filters update.

∙ **MC Filter (Multi-Select):** Filter by Meteorological Centre. Populates based on selected Region(s).
    → Step: After selecting Region → click MC multi-select → check relevant MCs.

∙ **RMC Filter (Multi-Select):** Filter by Regional Meteorological Centre. Populates based on selected MC(s).
    → Step: After selecting MC → click RMC multi-select → check relevant RMCs.

∙ **State Filter (Multi-Select):** Select one or more states within the chosen Region/MC/RMC.
    → Step: Click State multi-select → check desired states.

∙ **District Filter (Multi-Select):** Narrows to districts within selected states.
    → Step: Click District multi-select → check desired districts.

∙ **Block Filter (Multi-Select):** Final level — select specific blocks within the chosen districts.
    → Step: Click Block multi-select → check desired blocks.

∙ **Date Input:** Select the date for which block-level data should be displayed.
    → Step: Click the Date field → type or pick a date.

∙ **Submit Button:** Applies all selected filters and loads the map.
    → Step: After setting all filters and date → click "Submit" → map loads with filtered block boundaries coloured.

<!-- INSERT SCREENSHOT: Filter panel with all dropdowns and submit button visible -->
(fig 5.1 : Block Rainfall Map — Filter Panel)

---

## Mode & Time Granularity

∙ **Actual / Departure Toggle:** Two buttons switch the map between:
    ∙ **Actual** — Shows raw rainfall in mm for each block.
    ∙ **Departure** — Shows % deviation from historical normal.
    → Step: Click "Actual" or "Departure" button → map colours and legend update.

∙ **Time Granularity Buttons (AWS Data):** Four buttons filter the time window for AWS station data fed into the block map:
    ∙ **15 Min** — Most recent 15-minute reading
    ∙ **1 Hour** — Last 1-hour cumulative
    ∙ **Daily** — Full-day total
    ∙ **Cumulative (Cumul.)** — Cumulative total from season start
    → Step: Click any time granularity button → block colours recalculate for that time window.

<!-- INSERT SCREENSHOT: Mode buttons and time granularity buttons highlighted, map showing coloured blocks -->
(fig 5.2 : Block Rainfall Map — Actual Mode, Daily Granularity)

---

## Map Display

∙ **Block Choropleth Map:** Each block on the map is colour-coded based on the active mode (Actual or Departure). The map header shows:
    ∙ IMD logo (left) and branding logo (right)
    ∙ "INDIA METEOROLOGICAL DEPARTMENT" title
    ∙ Date of the displayed data
    ∙ Map type title ("BLOCK WISE DEPARTURE RAINFALL MAP (mm)" or "BLOCK WISE RAINFALL MAP (mm)")
    ∙ Compass rose / direction arrow

∙ **Hover Popup on Block:** Moving the cursor over any block shows a popup with:
    ∙ Region, State, District, Block name
    ∙ Daily Rainfall (mm)
    ∙ Normal Rainfall (mm)
    ∙ Departure (%)

∙ **Legend:** Colour key panel on the map for the active mode (same colour scheme as the Dashboard map).

<!-- INSERT SCREENSHOT: Map with a block popup visible and the legend panel -->
(fig 5.3 : Block Rainfall Map — Block-Level Popup)

---

## Download Options

∙ **Map Download (JPEG):** Downloads the current map view as a high-quality JPEG image.
    → Step: Click "Map Download" button → JPEG file saves to your computer.

∙ **Map PDF Download:** Downloads the current map as a PDF document (landscape orientation).
    → Step: Click "Map PDF Download" button → PDF file saves to your computer.

∙ **Statistics Download:** Downloads the tabular data behind the map as an Excel (.xlsx) file, listing block-level rainfall values.
    → Step: Click "Statistics Download" button → .xlsx file saves to your computer.

∙ **Reset Position:** Resets the map pan and zoom to the default India view.
    → Step: Click "Reset Position" → map re-centres.

<!-- INSERT SCREENSHOT: Download button row highlighted below the map -->
(fig 5.4 : Block Rainfall Map — Download Options)

---

## AWS Coverage Stats Panel

∙ **Summary Badges:** Three badges at the top of the right-side panel show:
    ∙ Total AWS Stations count
    ∙ Total IMD Blocks in the database
    ∙ Active time filter (e.g., "Daily")

∙ **Per-Source Block Statistics Table:** A table lists each AWS data source (e.g., UP AWS, NHP AWS, Zomato AWS, Meghalaya AWS, Tamilnadu AWS, IITM Mumbai, etc.) with columns:
    ∙ AWS Source name
    ∙ Number of Stations
    ∙ Blocks covered by AWS data
    ∙ Blocks already in the IMD map
    ∙ New blocks (AWS data exists but not yet in the IMD block map)
    The table footer shows totals across all sources.

∙ **Pie Chart — Blocks by AWS Source:** A Highcharts pie chart visually shows the share of AWS-covered blocks contributed by each data source.

∙ **Horizontal Bar Chart — AWS vs IMD Coverage:** A bar chart per source compares how many blocks have AWS data versus how many of those are already captured in the IMD block map — highlights gaps in map coverage.

∙ **Comparison Summary Box:** Four key numbers at the bottom:
    ∙ Total IMD Blocks in DB
    ∙ Blocks with AWS data (all sources combined)
    ∙ Blocks already in the IMD map
    ∙ New blocks (AWS-only, not yet in IMD map)

<!-- INSERT SCREENSHOT: AWS Stats panel showing badges, table, and pie/bar charts -->
(fig 5.5 : Block Rainfall Map — AWS Coverage Stats Panel)
