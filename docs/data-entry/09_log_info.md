**Log Info**

The Log Info page is a read-only audit and activity log centre for iRAINS. It keeps a record of key system events — station additions/deletions, report generation, and officer actions — so that HQ and MC administrators can trace what happened and when. All three sub-logs are accessible from a sidebar.

Access: HQ and MC users only.

---

## Navigation — Sidebar

When you land on Log Info, a sidebar presents three log categories. Click any item to load that log in the main content area.

<!-- INSERT SCREENSHOT: Log Info page with sidebar showing Station Log, Reports Log, and Action Log links -->
(fig 9.1 : Log Info — Sidebar Navigation)

---

## Sub-Log 1: Station Log

∙ **Purpose:** Records every station-level change made in the system — new stations added, stations edited, and stations deleted. This is the audit trail for the station database.

∙ **How to access:** Click "Station Log" in the sidebar.

∙ **What you see:** A table listing log entries with details such as:
    ∙ Timestamp — date and time of the change
    ∙ Station Name / ID — which station was affected
    ∙ Action — what was done (Added / Edited / Deleted)
    ∙ Performed By — the user account that made the change
    ∙ Notes or change summary

∙ **Use case:** If a station goes missing from the map or has wrong coordinates, check the Station Log to see who modified it and when.

<!-- INSERT SCREENSHOT: Station Log table showing rows of station change events with timestamp, station name, action, and user columns -->
(fig 9.2 : Log Info — Station Log Table)

---

## Sub-Log 2: Reports Log

∙ **Purpose:** Records log entries related to report generation and dissemination — when a report was generated, what type, and who triggered it.

∙ **How to access:** Click "Reports Log" in the sidebar.

∙ **What you see:** A table of report generation events with details such as:
    ∙ Timestamp — when the report was generated
    ∙ Report Type — e.g., daily state statistics, cumulative district report, etc.
    ∙ Triggered By — the user who generated or downloaded the report
    ∙ Status — success or failure

∙ **Use case:** Useful for confirming that required daily reports were generated and downloaded by the appropriate office.

<!-- INSERT SCREENSHOT: Reports Log table showing report generation events with type, timestamp, and user columns -->
(fig 9.3 : Log Info — Reports Log Table)

---

## Sub-Log 3: Action Log

∙ **Purpose:** Records officer-level actions within iRAINS — logins, verifications, data submissions, and other significant actions taken by users.

∙ **How to access:** Click "Action Log" in the sidebar.

∙ **What you see:** A table of user actions with details such as:
    ∙ Timestamp — when the action occurred
    ∙ User — the officer who performed the action
    ∙ Action Type — what was done (Login, Verification, Data Submit, etc.)
    ∙ Details — any relevant parameters or context for the action

∙ **Use case:** For accountability tracking — confirm that MC officers logged in and submitted data on time, or that a verification was completed by the right person.

<!-- INSERT SCREENSHOT: Action Log table showing user actions with timestamp, user name, action type, and detail columns -->
(fig 9.4 : Log Info — Action Log Table)
