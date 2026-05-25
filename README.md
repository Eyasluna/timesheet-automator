# Timesheet Automator

Generate biweekly timesheets with randomized daily hours that sum to your target totals, then export to PDF. Built to avoid missing submission deadlines.

## Features

- Configurable weekly hour totals (0–55 hrs/week, in 0.5h increments)
- Randomized daily distribution (0–11 hrs/day, 0.25h granularity)
- Auto-skips lunch for short workdays (< 5h)
- Editable employee/employer/period fields
- Print-to-PDF or download as standalone HTML

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL, fill in the form, and click **Generate Timesheet → Print / Save as PDF**.

## Stack

Vite + React. Single-file component in `src/TimesheetApp.jsx`.
