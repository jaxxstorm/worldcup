## Why

The fixture list is currently chronological, so completed matches accumulate as full expanded cards and force users to scroll before they can reach current unresolved fixtures. The predictor should keep the chronological context, but compress completed results so users can get to current matches faster.

## What Changes

- Keep completed fixtures above current unresolved fixtures in the main Fixtures view.
- Collapse completed fixtures by default so current unresolved fixtures are visible sooner.
- Keep completed fixture details and final scores accessible without allowing prediction edits.
- Preserve static hosting and client-side rendering behavior.

## Capabilities

### New Capabilities

### Modified Capabilities
- `browser-app`: The Fixtures view must collapse completed fixtures by default while keeping current unresolved fixtures expanded.

## Impact

- Affected code: `src/main.ts`, `src/styles.css`, fixture ordering tests.
- No changes to fixture data, result data, external data source handling, or prediction calculations.
- No server-side runtime behavior; the app remains static-host compatible.
