## Why

Team names appear throughout fixtures, tables, bracket views, stats, and performance screens, but users have to leave the app to understand team context such as FIFA ranking and recent form. Hover-only team details make the predictor easier to scan without adding visual noise to the default layout.

## What Changes

- Add hover/focus details for team identities rendered in the browser app.
- Show each team's bundled FIFA ranking when available.
- Show up to the previous five completed tournament results for that team, derived from authoritative fixture results in the static dataset.
- Keep the details popover hidden until the user hovers or focuses a team name/flag.
- Preserve static-host compatibility; no server routes or runtime data fetches are required.

## Capabilities

### New Capabilities

### Modified Capabilities
- `browser-app`: Team identities expose hover/focus details with FIFA ranking and recent completed results.

## Impact

- Affects team rendering and tooltip behavior in `src/main.ts`.
- Adds client-side helper logic for deriving a team's recent completed results from bundled fixture data.
- Adds styling for compact team hover affordances and the details popover.
- Adds tests for recent-result derivation.
