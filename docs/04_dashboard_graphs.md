**Dashboard Analysis Graphs**

The Analysis Graphs section (accessible via the "Statistics" toggle button in the top nav) provides two powerful modes for deeper rainfall exploration: **Comparison Mode** for side-by-side geographic comparison, and **Graph Mode** for time-series analysis with custom date ranges or season filters.

---

## Comparison Mode

∙ **Activating Comparison Mode:** Click the "Compare" or "Statistics" toggle button in the navigation bar. The map panel shrinks and a comparison interface appears alongside it.

∙ **Date Range Selection:** Two date pickers appear — "Start Date" and "End Date". Select the period you want to compare across locations.
    → Step: Click Start Date → pick date → click End Date → pick date.

∙ **Actual / Departure Toggle:** A toggle switch lets you choose whether the comparison shows raw Actual rainfall (mm) or Departure from normal (%). Toggle before or after selecting locations.

∙ **Level Selection (Radio Buttons):** Choose the geographic level for comparison:
    ∙ State
    ∙ Subdivision
    → Step: Click the desired radio button → available locations list updates.

∙ **Location Checkboxes (3-Selection Rule):** Check boxes appear for all available locations at the chosen level. You must select **exactly 3 locations** to activate the comparison chart. The system enforces this limit — a fourth selection is blocked until one is unchecked.
    → Step: Check 3 locations → comparison chart auto-renders → uncheck one to swap in another.

∙ **Comparison Chart:** A Highcharts chart renders side-by-side bars (or lines) for the 3 selected locations over the chosen date range, making it easy to contrast rainfall between regions visually.

<!-- INSERT SCREENSHOT: Comparison mode with 3 locations checked and the side-by-side chart visible -->
(fig 4.1 : Dashboard — Comparison Mode Chart)

---

## Graph Mode — Custom Date Range

∙ **Activating Graph Mode:** Inside the Statistics/Graphs panel, select the "Custom" mode tab or radio button.

∙ **Unit Toggle (mm / cm):** A toggle switches the y-axis unit between millimetres (mm) and centimetres (cm). All chart values rescale instantly.
    → Step: Click "mm" or "cm" toggle → chart y-axis updates.

∙ **Custom Date Pickers:** Choose the analysis period using the Start Date and End Date material date-pickers.
    → Step: Click Start Date field → pick date from calendar → repeat for End Date → chart refreshes.

∙ **Rainfall Filter Buttons:** Quick-filter buttons let you highlight or isolate days with rainfall above a threshold:
    ∙ **10 mm** — Light rain threshold
    ∙ **50 mm** — Heavy rain threshold
    ∙ **100 mm** — Very heavy threshold
    ∙ **200 mm** — Extremely heavy threshold
    ∙ **>300 mm** — Exceptional events
    → Step: Click any threshold button → chart filters to show only days meeting or exceeding that value.

∙ **Custom Min / Max Range:** Two number inputs let you specify a precise range (e.g., 25 mm to 80 mm) to isolate days within that band.
    → Step: Type a value in the "Min" box → type a value in the "Max" box → chart updates.

∙ **Time-Series Chart:** A Highcharts column + line chart plots Actual rainfall (columns) and Normal rainfall (line) over the selected date range. Highcharts export button (top-right of chart) lets you download the chart as PNG/SVG/PDF.

<!-- INSERT SCREENSHOT: Custom mode graph with date range selected and a filter button active -->
(fig 4.2 : Dashboard Graphs — Custom Date Range Mode)

---

## Graph Mode — Season Analysis

∙ **Activating Season Mode:** Inside the Graph panel, select the "Season" mode tab or radio button.

∙ **Season Dropdown:** Select one of four meteorological seasons:
    ∙ Winter (January – February)
    ∙ Pre-Monsoon (March – May)
    ∙ Monsoon / SW Monsoon (June – September)
    ∙ Post-Monsoon (October – December)
    → Step: Click the season dropdown → select a season.

∙ **Year Multi-Select:** A multi-select picker lists the last 10 available years. Select one or more years to overlay seasonal rainfall for comparison across years.
    → Step: Click the year selector → check the years you want → chart renders one series per selected year.

∙ **Season Chart:** The chart shows seasonal total rainfall per selected year as grouped bars or lines, with Normal as a reference line — ideal for spotting anomalous monsoon or winter seasons.

<!-- INSERT SCREENSHOT: Season mode graph with multiple years selected and overlaid bars -->
(fig 4.3 : Dashboard Graphs — Season Analysis Mode)
