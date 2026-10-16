# Attendance Register — Roll Call

A lightweight, mobile-first web app for Integrated M.Sc. Mathematics students at SVNIT. It combines four everyday tools in one page: an **attendance register**, a **CGPA target optimizer**, an **SVNIT result checker**, and a **"Can I bunk?" attendance calculator**.

**Live site:** https://mscmath.netlify.app

Built with plain HTML, CSS and JavaScript. There is no framework, no build step and no backend.

---

## Features

### Attendance register
- Class roster with search by name, roll number or registration number
- One-tap present/absent marking, plus "Mark all present" and "Clear all"
- Live stats (total, present, absent) and an attendance progress bar
- Submit with a date and time stamp so sessions never get mixed up
- Output is copied to the clipboard automatically, and can be copied again, exported as `.txt`, or printed
- Keyboard shortcut: `Ctrl`/`⌘` + `Enter` to submit

### CGPA Target Optimizer
- Enter current CGPA, semesters passed, total semesters and a target CGPA
- Goal presets (8.0 / 8.5 / 9.0 / 9.5 / custom)
- Computes the **average SGPA required** in the remaining semesters, with a difficulty meter
- Optional semester history for an actual trend line and sharper forecasts
- Projection chart with a safe–stretch band, per-semester SGPA chart, and a "required SGPA vs runway" chart
- Three pacing strategies for the same target, a scenario simulator, a feasibility check and strategy insights
- Custom milestones, also flagged on the projection chart
- Inputs are saved automatically in your browser

> Uses **equal-weight CGPA** (each semester counts the same). It does not weight by credits.

### SVNIT Results
- Lists result notices from the SVNIT student notice page
- Search, filter by year, and mark notices as seen
- Data is synced automatically through a separate GitHub repository: [svnit-result-checker](https://github.com/tolstoylover/svnit-result-checker)

### Can I bunk?
- Attendance buffer calculator based on these zones:

| Zone | Attendance |
|---|---|
| Safe | 75% and above |
| Grade down | 60% to 75% |
| Danger | below 60% |

### General
- Light and dark themes
- Responsive layout for phones, tablets and desktops
- Print-friendly attendance output
- Respects `prefers-reduced-motion`

---

## Tech stack

| Area | Choice |
|---|---|
| Markup | HTML5 |
| Styling | Vanilla CSS with custom properties (design tokens), light/dark theming via `[data-theme]` |
| Logic | Vanilla JavaScript |
| Fonts | Instrument Serif, Inter, JetBrains Mono (Google Fonts) |
| Charts | Hand-written inline SVG |
| Storage | Browser `localStorage` |
| Hosting | Netlify (static) |

---

## Project structure

```
.
├── index.html      # Page markup and all modals
├── style.css       # Design tokens, layout, components, print and mobile styles
├── bunk.css        # Styles for the "Can I bunk?" tool
├── calendar.css    # Calendar styles
├── index.js        # Attendance, CGPA optimizer and results checker logic
├── bunk.js         # "Can I bunk?" logic
└── README.md
```

---

## Getting started

### Run locally

No installation is needed. You can open `index.html` directly in a browser, but a local server is better because the results checker fetches data over the network.

```bash
# clone the repository
git clone <your-repository-url>
cd <repository-folder>

# option 1: Python
python3 -m http.server 8000

# option 2: Node
npx serve .
```

Then open http://localhost:8000.

### Deploy to Netlify

1. Push the project to a GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project** and select the repository.
3. Leave the build command empty and set the publish directory to `.` (the project root).
4. Deploy. Every push to the main branch redeploys automatically.

---

## How it works

### Data and privacy
- All attendance, CGPA inputs, milestones, theme choice and "seen" result notices are stored in your own browser using `localStorage`.
- Nothing is sent to a server by this app.
- Clearing your browser data, or switching browser or device, will remove your saved data. There is no account system or cloud sync yet.

### CGPA calculation
With `C` as the current CGPA after `p` semesters, `T` as the total semesters and `G` as the target CGPA, the average SGPA needed in the remaining `T − p` semesters is:

```
required SGPA = (G × T − C × p) / (T − p)
```

If this value is above the maximum SGPA (10), the target is not reachable and the app shows the best possible CGPA instead.

### Results checker
A scheduled job in the [svnit-result-checker](https://github.com/tolstoylover/svnit-result-checker) repository reads the SVNIT notice page and publishes the latest notices. This app loads that data and tracks which notices you have already seen.

---

## Customizing

- **Roster:** edit the student list in `index.js` (or wherever the roster data is defined in your copy).
- **Colors and fonts:** change the CSS variables at the top of `style.css` under `:root` and `[data-theme="dark"]`.
- **Bunk thresholds:** adjust the 75% and 60% values in `bunk.js`.
- **Total semesters default:** the program is a 10-semester course; change the placeholder and validation in `index.html` and `index.js` if yours differs.

---

## Roadmap

Ideas under consideration, roughly in priority order:

- [ ] Backup and restore (export/import JSON)
- [ ] Weekly timetable with per-subject attendance
- [ ] Per-subject bunk calculator
- [ ] Late and excused attendance statuses, with CSV export
- [ ] Credit-weighted SGPA/CGPA mode
- [ ] End-semester marks calculator
- [ ] Installable PWA with offline support
- [ ] Result alerts through Telegram or push notifications
- [ ] Optional accounts and a shared class view

---

## Browser support

Works in current versions of Chrome, Edge, Firefox and Safari, on desktop and mobile. The page uses `backdrop-filter` and CSS custom properties, so very old browsers will show a simpler look.

---

## Contributing

Suggestions and bug reports are welcome.

1. Fork the repository and create a branch: `git checkout -b feature/your-feature`
2. Keep changes small and focused, and test in both light and dark themes and on a narrow mobile screen
3. Open a pull request describing what changed and why

---

## Disclaimer

This is an unofficial student project and is not affiliated with SVNIT. The result list is gathered from the public notice page and may be delayed or incomplete, so always confirm on the official website. CGPA projections and attendance advice are estimates, and your institute's official rules apply.

---

## Author

Made by **Tolstoy**.

