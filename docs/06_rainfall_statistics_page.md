**Rainfall Statistics**

The Rainfall Statistics pages generate and download tabular rainfall data for a chosen date range and geographic level. Instead of a visual map, these pages produce structured spreadsheet (.xlsx) reports — ideal for HQ, MC, and RMC users who need raw numbers for analysis or record-keeping.

Available stat pages (accessible from the Rainfall Map menu):
    ∙ Daily State Statistics
    ∙ Daily Subdivision Statistics
    ∙ Daily District Statistics
    ∙ Daily Region (Homogenous) Statistics
    ∙ Daily Country Statistics
    ∙ Weekly variants of all the above

---

∙ **From Date (Start Date):** Select the beginning of the date range for which statistics should be generated.
    → Step: Click the "From Date" input field → type a date in DD/MM/YYYY format or use the date-picker calendar to select a date.

∙ **To Date (End Date):** Select the end of the date range.
    → Step: Click the "To Date" input field → pick or type the end date.
    Note: The system validates that "To Date" is not earlier than "From Date". If an invalid range is entered, the View button will not trigger a download.

∙ **Date Validation:** An automatic check prevents illogical date ranges (To Date < From Date). A validation message appears if the range is invalid, prompting correction before proceeding.

∙ **View / Submit Button:** After setting both dates, click "View" to trigger the statistics generation. A loading spinner appears on the button while the server processes the request. Once complete, the report file downloads automatically.
    → Step: Set From Date → Set To Date → Click "View" → wait for spinner to finish → .xlsx file downloads to your computer.

<!-- INSERT SCREENSHOT: Statistics page showing From Date, To Date inputs, and the View button with spinner -->
(fig 6.1 : Rainfall Statistics Page — Date Range and View Button)

---

## Available Statistic Levels

∙ **Daily State Statistics** (`/daily-state-rf-distribution`): Reports rainfall per state for each day in the selected range. Columns include State name, Actual (mm), Normal (mm), Departure (%).

∙ **Daily Subdivision Statistics** (`/daily-subdivision-rf-distribution`): Reports rainfall per IMD meteorological subdivision for each day in the range.

∙ **Daily District Statistics** (`/daily-district-rf-distribution`): The most granular daily report — one row per district per day. Suitable for district-level analysis or cross-referencing with ground data.

∙ **Daily Region / Homogenous Statistics** (`/daily-homogenous-rf-distribution`): Aggregates rainfall into IMD's broad homogenous regions (East & North-East, North-West, South Peninsular, Central India, etc.).

∙ **Daily Country Statistics** (`/daily-country-rf-distribution`): Single-row-per-day summary for the entire country. Gives a macro-level view of all-India rainfall vs normal.

∙ **Weekly Variants:** Weekly versions of State, Subdivision, District, Region, and Country statistics are available under the same menu — same interface, same steps, but the output aggregates values by week instead of by day.
    → Step to access: Navigate to the relevant Weekly statistics page from the menu → set date range → click View → download weekly aggregated .xlsx.

<!-- INSERT SCREENSHOT: Downloaded .xlsx opened in Excel showing State statistics table with Actual, Normal, Departure columns -->
(fig 6.2 : Rainfall Statistics — Sample Downloaded Report)

---

∙ **Download Format:** All reports download as `.xlsx` (Excel) files compatible with Microsoft Excel, LibreOffice Calc, and Google Sheets. File names typically include the statistic level and date range for easy identification.

∙ **Who Uses This Page:**
    ∙ **HQ Users** — For national-level reporting and verification.
    ∙ **MC / RMC Users** — For regional data submission checks and local analysis.
    ∙ **Guest Users** — Statistics download may be restricted; contact HQ for access.
