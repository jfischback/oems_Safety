# oems_Safety
Safety Calculators

The first 7 SAF tabs of the Safety Calculations Google Sheet: TRIR, DART Rate, Lost Time Case Rate, Fall Clearance, Sling Tension, Center of Gravity and Crane Capacity Percentage. Each calculator solves for whichever value is left blank. Fall Clearance also compares the required clearance to the clearance available; Sling Tension flags angles below 30° (ASME B30.9) and Crane Capacity flags loads over 100% of the load chart.

Diagrams: Fall Clearance (worker before and after the arrest, with the clearance stack drawn to scale against the clearance available), Sling Tension (two-leg bridle with the angle and leg tension, plus tension per leg at other angles) and Center of Gravity (parts on a beam, distances from the reference end, and the CG under the hook).

Every page has the same OEMS header, first-visit disclaimer, footer disclaimer and copyright as the IH and environmental calculators, with safety wording. The page code is shared with the environmental calculators.

## Files
- `calculators.js`: every equation, its variables and units, each variable's rearranged formula, and the threshold checks and warnings.
- `solver.js`: solves for the blank box.
- `diagram.js`: the diagrams.
- `app.js`, `style.css`: the calculator page.
- `partials/topbar.html`, `partials/gate.html`, `disclaimer.js`, `disclaimer.css`: the OEMS header and disclaimer gate.
- One folder per calculator (for example `fall-clearance/`), plus `index.html` listing them all.

## Changing a calculator
Edit `calculators.js`, then run:
```
node scripts/build-pages.mjs   # rebuilds the pages and vercel.json
node tests/check.mjs           # checks every calculator against the Google Sheet values
```

## Hosting
Static site, no build step. On Vercel, import this repo with the default settings.
