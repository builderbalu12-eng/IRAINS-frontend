**Verification — MC**

The Verification MC page is used by MC (Meteorological Centre) users to review, confirm, and verify the rainfall values that have been entered for stations under their jurisdiction on a given date. It provides a summary of how many stations have reported and how many are verified, with drill-down tables and bulk verify actions.

Access: MC users only.

---

## Step 1 — Select Date

∙ **Date Picker:** Choose the date for which you want to review station data. Defaults to today.
    → Step: Click the date input at the top of the page → pick or type a date → proceed to submit.

∙ **Submit Button:** Loads the verification summary for the selected date.
    → Step: Click "Submit" → the summary table and count buttons load below.

<!-- INSERT SCREENSHOT: Date picker and Submit button at the top of the Verification MC page -->
(fig 3.1 : Verification MC — Date Selection)

---

## Step 2 — Read the Summary Count Buttons

Four large count buttons appear showing the station status breakdown for the selected date:

∙ **Updated Stations:** Number of stations that have a rainfall value entered for this date. Click to view the list of updated stations.

∙ **Not Updated Stations:** Number of stations with no value entered yet. Click to view which stations are still pending data entry.

∙ **Verified Stations:** Number of stations that have been verified by this MC. Click to view the already-verified station list.

∙ **Not Verified Stations:** Number of stations that have data entered but have not yet been verified. Click to view and take action on these stations.

→ Step: Click any count button → a detailed station table for that category appears below the buttons.

<!-- INSERT SCREENSHOT: The four count buttons (Updated, Not Updated, Verified, Not Verified) showing station counts for the selected date -->
(fig 3.2 : Verification MC — Summary Count Buttons)

---

## Step 3 — View Station Detail Table

Clicking any count button opens the detailed station table for that category. Columns:

∙ **S.No** — row number
∙ **District** — district the station belongs to
∙ **Station Name** — station identifier
∙ **Station ID** — unique IMD code
∙ **Rainfall (mm)** — the entered rainfall value
∙ **Status** — current status (Updated / Not Updated / Verified / Not Verified)
∙ **Verified Time** — timestamp of when the station was verified (shown only in the Verified stations table)

∙ **Sort Columns:** Click any column header (S.No, District, Station Name, Station ID, Rainfall, Status) to sort the table ascending or descending by that column.
    → Step: Click a column header once to sort ascending → click again to sort descending.

<!-- INSERT SCREENSHOT: Detail table showing station rows with all columns and a column header sort arrow visible -->
(fig 3.3 : Verification MC — Station Detail Table)

---

## Step 4 — Verify Stations

∙ **Verify Selected:** Check the checkbox next to one or more station rows → click "Verify Selected" to mark only those stations as verified.
    → Step: Check station checkboxes → click "Verify Selected" → those stations move to the Verified count.

∙ **Verify All:** Verifies every station currently visible in the table in a single action. Use this to bulk-verify all Not Verified stations for the day.
    → Step: Click "Verify All" → all stations in the current table are marked verified → the Verified count button updates.

<!-- INSERT SCREENSHOT: Station table with checkboxes checked on some rows, and "Verify Selected" + "Verify All" buttons visible above the table -->
(fig 3.4 : Verification MC — Verify Selected and Verify All Buttons)
