**Dashboard Map Controls**

The interactive Leaflet map at the centre of the dashboard is the primary way to explore rainfall across India. All colours, popups, and legends update dynamically based on the selected layer, date, and mode.

---

∙ **Colour-Coded Choropleth Map:** Every region/district/block on the map is filled with a colour that instantly communicates rainfall status. The colour scheme changes depending on the active mode:

    **Departure Mode colours:**
    ∙ Dark Blue — Large Excess (60% or more above normal)
    ∙ Sky Blue — Excess (20% to 59% above normal)
    ∙ Green — Normal (−19% to +19%)
    ∙ Red / Orange — Deficient (−20% to −59%)
    ∙ Yellow — Large Deficient (−60% to −99%)
    ∙ White — No Rain (−100%)
    ∙ Grey — No Data

    **Actual Rainfall Mode colours:**
    ∙ White — No Rainfall (0 mm)
    ∙ Light Yellow — Very Light (0.001 mm to 2.4 mm)
    ∙ Light Green — Light (>2.4 mm to 15.5 mm)
    ∙ Green — Moderate (>15.5 mm to 64.4 mm)
    ∙ Blue — Heavy (>64.4 mm to 115.5 mm)
    ∙ Dark Blue — Very Heavy (>115.5 mm to 204.4 mm)
    ∙ Dark Purple — Extremely Heavy (>204.4 mm)
    ∙ Grey — No Data

∙ **Dynamic Legend:** A legend panel on the map (bottom-left or side) shows the colour key for the currently active mode. The legend automatically swaps content when you toggle between Departure and Actual modes — no extra clicks needed.

∙ **Hover Popup (Tooltip):** Hovering the mouse cursor over any coloured region on the map shows a popup with detailed data for that area. The popup displays:
    ∙ Area name (State / District / Block, etc.)
    ∙ Actual rainfall (mm)
    ∙ Normal rainfall (mm)
    ∙ Departure from normal (%)
    → Step: Move mouse over any map region → popup appears automatically → move away to dismiss.

∙ **Loading Spinner:** When the map is fetching data (after changing date, layer, or mode), a spinner overlay appears over the map area. The map becomes interactive again once the spinner disappears.

∙ **Reset Map Position:** A "Reset Position" button restores the map to the default pan/zoom view of India if you have scrolled or zoomed in. Step: Click "Reset Position" → map re-centres on India at the default zoom level.

<!-- INSERT SCREENSHOT: Map with a hover popup visible, legend shown, and layer buttons highlighted -->
(fig 2.1 : Dashboard Map — Hover Popup and Legend)

<!-- INSERT SCREENSHOT: Map in Actual mode showing rainfall colour bands -->
(fig 2.2 : Dashboard Map — Actual Rainfall Mode)
