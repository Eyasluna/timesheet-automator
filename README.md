# Timesheet Automator

Biweekly timesheet generator with randomized daily hours that always sum to your target. Built to stop missing submission deadlines on a recurring bi-weekly cycle.

- Configurable weekly totals (0–55 hrs/week, 0.5 h slider)
- Randomized daily distribution (0–11 hrs/day, 0.25 h granularity)
- Lunch break auto-skipped for short workdays (< 5 h)
- Print-to-PDF or download as standalone HTML
- Ships as a single `timesheet-automator` CLI that opens the UI in your browser

---

## Install

### Homebrew (recommended)

```bash
brew install eyasluna/tap/timesheet-automator
```

Updating later:

```bash
brew update
brew upgrade eyasluna/tap/timesheet-automator
```

### From source (for development)

```bash
git clone https://github.com/Eyasluna/timesheet-automator.git
cd timesheet-automator
npm install
npm run dev          # hot-reload dev server on http://localhost:5173
```

## Usage

After `brew install`, launch the app from anywhere:

```bash
timesheet-automator
```

The CLI:
1. Starts a local static server on a random free port on `127.0.0.1`.
2. Opens your default browser to that URL.
3. Stays running until you `Ctrl+C` it.

### Pin a port

```bash
PORT=4000 timesheet-automator
```

Handy if you want to bookmark the URL.

### Generating a timesheet

1. Fill in **Employee Info** and **Pay Period** start (a Monday).
2. Drag the **Week 1 / Week 2** sliders to your target totals (e.g. 10 h each).
3. Click **✦ Generate Timesheet**.
4. On the preview tab, click **Randomize Again** until the daily spread looks reasonable.
5. Click **Print / Save as PDF** → in the browser print dialog, choose **Save as PDF**.

The generated PDF includes employee/employer fields, both weeks' daily breakdown, signature lines, and weekly + biweekly totals.

---

## How it works

| Layer | Tech |
|---|---|
| UI | React 18 (single component in `src/TimesheetApp.jsx`) |
| Build | Vite |
| CLI | Node 20 stdlib HTTP server (zero runtime dependencies) |
| Distribution | GitHub Releases tarball → Homebrew tap |

Hour randomization (`randomizeHours` in `src/TimesheetApp.jsx`) distributes the weekly target across 5 days in 0.25 h increments, capped at 11 h/day, with no per-day minimum — so a 10 h week may legitimately put 0 h on some days.

---

## Releasing

Releases are fully automated. Two paths:

### Automatic — merge a PR

Every PR merged to `main` cuts a new release. The version bump is controlled by **labels on the PR**:

| Label | Bump | Example |
|---|---|---|
| `release:major` | `1.2.3 → 2.0.0` | Breaking change |
| `release:minor` | `1.2.3 → 1.3.0` | New feature |
| `release:patch` *(default)* | `1.2.3 → 1.2.4` | Bug fix, refactor |
| `release:skip` | *(no release)* | Docs, CI, chores |

The workflow (`.github/workflows/release.yml`) on merge:
1. Determines bump type from PR labels.
2. Runs `npm version <type>` — bumps `package.json` and creates a tag.
3. Builds `dist/`, packages `bin + dist + package.json + README` into a tarball.
4. Pushes the bump commit and tag back to `main`.
5. Creates a GitHub Release and attaches the tarball.
6. Prints the new tarball's `sha256` in the run summary — copy that into the Homebrew formula.

### Manual — workflow dispatch

When you want to cut a release without merging anything (e.g. for an emergency rebuild):

1. Go to **Actions → Release → Run workflow**.
2. Pick `patch` / `minor` / `major`.
3. Same steps as above run on `main`.

### After every release: update the Homebrew tap

The formula lives in [`Eyasluna/homebrew-tap`](https://github.com/Eyasluna/homebrew-tap). After a release:

1. Open the run summary on the **Actions → Release** page; copy the printed `url` and `sha256`.
2. In `homebrew-tap/Formula/timesheet-automator.rb`, update the two lines.
3. Commit & push.

> Future improvement: a follow-up Actions job that opens a PR against the tap repo with the new `url` + `sha256` automatically. Not wired up yet because it requires a fine-grained PAT with write access to the tap repo.

---

## Project layout

```
timesheet-automator/
├── bin/timesheet-automator      # Node CLI launcher (served via brew)
├── src/
│   ├── main.jsx                 # React entry
│   └── TimesheetApp.jsx         # All UI + hour generator logic
├── dist/                        # Build output (gitignored locally, shipped in release tarball)
├── index.html                   # Vite HTML entry
├── vite.config.js
├── package.json
└── .github/workflows/release.yml
```

## Required PR labels

Create these labels once in the GitHub repo (Settings → Labels):

- `release:major`
- `release:minor`
- `release:patch`
- `release:skip`

If you forget to label a PR, it defaults to a **patch** bump.

## License

MIT
