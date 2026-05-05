**Data Entry**

The Data Entry page is where MC and RMC users input daily rainfall values for every station under their jurisdiction, and where HQ users can manage the full station database. It is the primary data-input point for the iRAINS system — all maps, statistics, and reports downstream depend on the values entered here.

Access: MC and HQ users only.

---

## Filters — Select Stations to Work With

∙ **Region (HQ only, Multi-Select):** HQ users can filter across regions. MC/RMC users see only their own region automatically.
    → Step: Click the Region multi-select → check one or more regions.

∙ **MC / RMC Name:** For MC/RMC users this is a read-only display of their own centre. HQ users see a multi-select dropdown to choose any MC or RMC.
    → Step (HQ): Click the MC/RMC multi-select → check desired centres.

∙ **States (Multi-Select):** Narrows the station list to selected states within the chosen MC/RMC.
    → Step: Click State multi-select → check desired states.

∙ **Districts (Multi-Select):** Further narrows to districts within selected states.
    → Step: Click District multi-select → check desired districts.

∙ **Date:** The date for which rainfall values should be entered or viewed. MC users cannot select dates older than 60 days. Future dates are blocked for all users.
    → Step: Click the date input → pick or type a date (DD/MM/YYYY format).

∙ **Submit Button:** Loads all stations matching the selected filters for the chosen date.
    → Step: After setting filters and date → click "Submit" → the station table loads below.

<!-- INSERT SCREENSHOT: Filter panel with Region, MC, State, District dropdowns and date input, Submit button highlighted -->
(fig 1.1 : Data Entry — Filter Panel)

---

## Station Table — Entering Rainfall Values

The table shows one row per station. Rainfall values can be edited directly in the table without opening any dialog.

∙ **Table Columns:**
    ∙ S.No — row sequence number
    ∙ District Name — the district the station belongs to
    ∙ Station ID — unique IMD station code
    ∙ Station Name — human-readable name
    ∙ Rainfall — an editable input field showing the current value (in mm). Enter the day's rainfall here.
    ∙ Type — coloured badge showing station type: **AWS** (automated weather station), **ORG** (ordinary raingauge), or **ARG** (automatic recording gauge)
    ∙ New/Old — badge showing whether the station is newly activated or existing
    ∙ Lat° N — latitude (4 decimal places)
    ∙ Lng° E — longitude (4 decimal places)
    ∙ Year of Activation — date the station was commissioned
    ∙ Action — Edit and Delete buttons (HQ users only)

∙ **Inline Rainfall Edit:** Click directly inside the "Rainfall" cell for any station and type the rainfall value in mm. The value saves automatically on change.
    → Step: Click the Rainfall input for a station → type the mm value → press Tab or Enter to move to the next row.

∙ **Enter Key Navigation:** Pressing Enter in a Rainfall input automatically moves the cursor to the next station's Rainfall field — allowing fast row-by-row data entry without using the mouse.

∙ **Reset Button (per row):** Each rainfall input has a small reset icon. Clicking it clears the entered value for that station and reverts to blank/zero.
    → Step: Click the reset icon next to a Rainfall cell → value clears.

∙ **Download Button:** Downloads the current table (all visible stations and their rainfall values for the selected date) as a formatted `.xlsx` file. Disabled if the table is empty.
    → Step: Click "Download" → Excel file saves to your computer.

<!-- INSERT SCREENSHOT: Station table with Rainfall input fields, Type badges, and Action column visible -->
(fig 1.2 : Data Entry — Station Table with Inline Rainfall Editing)

---

## Add / Edit / Delete Stations (HQ Only)

∙ **Add Station Button:** Opens the "Add New Station" modal. HQ users can create new stations in the database.
    → Step: Click "Add Station" (above the table) → fill in the form → click "Add Station" to save.

    Fields in the Add Station modal:
    ∙ Station Name (text, required)
    ∙ Station ID (text, required)
    ∙ MC or RMC (radio: MC / RMC) — which centre this station belongs to
    ∙ Centre Name (text) — the specific MC or RMC name
    ∙ Type (radio: AWS / ORG / ARG)
    ∙ New / Old (radio: NEW / OLD)
    ∙ Lat° N (number, 4 decimal places)
    ∙ Lng° E (number, 4 decimal places)
    ∙ Year of Activation (date picker)
    → Buttons: **Add Station** (saves) | **Close** (cancels)

∙ **Edit Station (Action column):** Click the Edit button in a station's row to open the Edit Station modal pre-filled with that station's details.
    → Step: Click "Edit" in the Action column of the target row → update fields → click "Update" to save.

    Fields in the Edit Station modal: same as Add Station modal, minus the Station ID (cannot change).
    → Buttons: **Update** (saves changes) | **Cancel** (discards)

∙ **Delete Station (Action column):** Click the Delete button in a station's row. A confirmation modal appears showing the station name.
    → Step: Click "Delete" in the Action column → confirmation modal appears → click "Confirm" to permanently delete, or "Cancel" to abort.

<!-- INSERT SCREENSHOT: "Add New Station" modal with all fields visible -->
(fig 1.3 : Data Entry — Add New Station Modal)

---

## Bulk File Upload Options

∙ **Upload Rainfall (Bulk):** Upload a CSV or XLSX file containing rainfall values for multiple stations at once. A sample file (PDF) showing the required column format can be downloaded first.
    → Step: Click "Download Sample" next to Upload Rainfall → open the sample PDF to see the required format → prepare your file → click the Upload Rainfall file input → select your CSV/XLSX → values populate into the table.
    Note: Empty cells in the upload file are converted to −999.9 (no-data sentinel) automatically.

∙ **Edit Stations (Bulk, HQ only):** Upload a CSV or XLSX file to bulk-edit existing station metadata (names, coordinates, types, etc.). A sample download is available.
    → Step: Click "Download Sample" next to Edit Stations → prepare file → click the Edit Stations file input → select file → station records update in the database.

<!-- INSERT SCREENSHOT: Upload buttons and sample download links visible at the top of the page -->
(fig 1.4 : Data Entry — Bulk Upload Options)
