**Yearly Station Statistics**

The Yearly Station Statistics page lets MC and RMC users pull daily rainfall data for all their stations across a custom date range and download it as a single formatted Excel file. It is designed for generating unified station data files for annual or seasonal reporting — one row per station, one column per day in the selected range.

Access: HQ, MC, and SP users.

---

## Step 1 — Select Date Range

∙ **From Date:** Click the "From Date" input → pick or type the start date of the period you want to export.

∙ **To Date:** Click the "To Date" input → pick or type the end date. The To Date must be the same as or after the From Date.

<!-- INSERT SCREENSHOT: From Date and To Date input fields at the top of the Yearly Station Statistics page -->
(fig 7.1 : Yearly Station Statistics — Date Range Inputs)

---

## Step 2 — Apply Station Filters

∙ **Region (Multi-Select):** Filter by broad geographic region. For MC/RMC users, this is pre-scoped to their jurisdiction.
    → Step: Click Region multi-select → check desired regions.

∙ **MC (Multi-Select):** Filter by Meteorological Centre.
    → Step: After selecting Region → click MC multi-select → check desired MCs.

∙ **RMC (Multi-Select):** Filter by Regional Meteorological Centre.
    → Step: After selecting MC → click RMC multi-select → check desired RMCs.

∙ **State (Multi-Select):** Filter by state within the chosen MC/RMC.
    → Step: Click State multi-select → check desired states.

∙ **District (Multi-Select):** Final filter — narrow to specific districts within selected states.
    → Step: Click District multi-select → check desired districts.

∙ **Filter / Apply Button:** Applies all selected filters and loads matching station data into the table.
    → Step: Click "Filter" or "Apply" → the station data table populates below.

<!-- INSERT SCREENSHOT: Filter panel showing Region, MC, RMC, State, District multi-selects and the Apply/Filter button -->
(fig 7.2 : Yearly Station Statistics — Filter Panel)

---

## Step 3 — View Station Data Table

The table shows one row per station and one column per date in the selected range. This lets you scan rainfall values for every station across the entire period at a glance.

∙ **Table Columns:**
    ∙ State Name
    ∙ District Name
    ∙ Station Name
    ∙ Station ID
    ∙ Latitude
    ∙ Longitude
    ∙ One column per date in the selected range — each cell contains the rainfall value (mm) for that station on that day

∙ **Missing Data Indicator:** Cells with no data are shown as **−999.9** (the IMD no-data sentinel value). In the downloaded Excel file these cells are highlighted in red for easy identification.

<!-- INSERT SCREENSHOT: Station data table with station metadata columns on the left and date columns extending to the right, some cells showing -999.9 -->
(fig 7.3 : Yearly Station Statistics — Station Data Table with Date Columns)

---

## Step 4 — Download the Data

∙ **Download Sample File:** Before downloading your data, you can download a sample Excel file showing the expected column format and data structure. Useful for understanding the layout before sharing with external parties.
    → Step: Click "Download Sample File" → a sample `.xlsx` saves to your computer.

∙ **Download Rainfall Data Excel:** Downloads the full filtered dataset as a formatted Excel file.
    → Filename format: `IMD_Station_Data_[region]_[fromdate]_to_[todate].xlsx`
    → The Excel file includes:
        ∙ A title row with the report name and filter criteria
        ∙ Date range and generation timestamp
        ∙ Important notes section (explains that −999.9 = no data recorded)
        ∙ Column headers with styled formatting
        ∙ Data rows with alternating row colours
        ∙ Red cell highlighting for any −999.9 (missing data) values
    → Step: Click "Download Rainfall Data Excel" → formatted `.xlsx` file saves to your computer.

<!-- INSERT SCREENSHOT: Download Sample File and Download Rainfall Data Excel buttons highlighted, and a preview of the downloaded Excel showing the title, notes, and red-highlighted missing data cells -->
(fig 7.4 : Yearly Station Statistics — Download Options and Excel Format Preview)
