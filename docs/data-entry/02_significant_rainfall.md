**Significant Rainfall**

The Significant Rainfall page lets HQ, MC, and RMC users quickly identify and export stations that recorded rainfall above a specified threshold on a given day. Instead of scanning the full station list, you define a minimum (or range) value and the system returns only the stations that meet it — across any combination of regions.

Access: HQ, MC, and SP users.

---

## Step 1 — Choose Filter Type (Range Mode)

∙ **No Range Toggle:** Shows all stations that recorded any rainfall above a single entered threshold on the selected date.
    → Step: Click the "No Range" toggle button to activate this mode.

∙ **Custom Range Toggle:** Shows only stations where rainfall falls **between** a From value and a To value on the selected date.
    → Step: Click the "Custom Range" toggle button to activate this mode.

<!-- INSERT SCREENSHOT: The two toggle buttons "No Range" and "Custom Range" at the top of the filter panel, one highlighted as active -->
(fig 2.1 : Significant Rainfall — Range Mode Toggle)

---

## Step 2 — Select Date

∙ **Date Picker:** Choose the day for which significant rainfall data should be shown. Defaults to today.
    → Step: Click the "Select Date" field → pick or type the date → the rest of the filters apply to this date.

---

## Step 3 — Enter Rainfall Threshold

∙ **No Range Mode — Single Threshold:** One number input labelled "Enter Rainfall Range". All stations at or above this value will be returned.
    → Step: Type the minimum rainfall value (e.g., 65 for heavy rainfall).

∙ **Custom Range Mode — From and To:** Two number inputs. Stations with rainfall **between** From and To (inclusive) are returned.
    → Step: Type the lower bound in "From" → type the upper bound in "To".

∙ **Unit Selector (mm / cm):** A dropdown next to the threshold input lets you switch the unit. The table results will display in the selected unit.
    → Step: Click the unit dropdown → select "mm" or "cm" → threshold inputs and table column both reflect the chosen unit.

---

## Step 4 — Select Regions

∙ **Region Multi-Checkbox Dropdown:** Filter results to one or more of the four broad IMD regions:
    ∙ Central India
    ∙ East and North-East India
    ∙ North-West India
    ∙ South Peninsular India
    → Step: Click the Region dropdown → check one or more regions → uncheck to remove. Leave all unchecked to include all regions.

<!-- INSERT SCREENSHOT: Filter panel showing date picker, threshold input with unit dropdown, and region multi-checkbox open -->
(fig 2.2 : Significant Rainfall — Filter Panel with Region Selection Open)

---

## Step 5 — Submit and View Results

∙ **Submit Button:** Applies all filters and fetches matching station data.
    → Step: Click "Submit" → table populates with stations meeting the threshold on the selected date. A loading indicator appears while data fetches.

∙ **Results Table:** Each row is a station that recorded significant rainfall. Columns:
    ∙ Met Subdivision — the IMD meteorological subdivision
    ∙ District Name — the administrative district
    ∙ Station Name — the station identifier
    ∙ Rainfall — the recorded value in the selected unit (mm or cm), sortable by clicking the column header

<!-- INSERT SCREENSHOT: Results table with rows of stations showing Subdivision, District, Station Name, and Rainfall values -->
(fig 2.3 : Significant Rainfall — Results Table)

---

## Step 6 — Download Results

∙ **Download (XLSX):** Exports the current results table as an Excel spreadsheet. Disabled if the table is empty (no results).
    → Step: Click "Download" → `.xlsx` file saves to your computer.

∙ **Download Doc (PDF):** Exports the results as a formatted PDF document suitable for official distribution. Disabled if the table is empty.
    → Step: Click "Download Doc" → PDF file saves to your computer.

<!-- INSERT SCREENSHOT: Download and Download Doc buttons highlighted below the table -->
(fig 2.4 : Significant Rainfall — Download Options)
