## Why

The group stage is nearly complete, so the dedicated Scenarios page and AI/vector scenario question flow no longer justify their product and maintenance cost. Removing them keeps the predictor focused on fixtures, standings, bracket, stats, and performance views that remain useful through the knockout stage.

## What Changes

- Remove the user-facing Scenarios tab and prevent users from navigating to the scenarios experience.
- Remove scenario question submission and related runtime API/vector indexing plumbing from the deployed app and refresh workflow.
- Preserve core prediction, standings, bracket, stats, performance, and static hosting behavior.
- **BREAKING**: Scenario question endpoints and scenario vector indexing are no longer part of the supported application surface.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `browser-app`: The available browser views no longer include a Scenarios page or scenario question UI.
- `scheduled-data-refresh`: The refresh workflow no longer indexes scenario vectors after data changes.

## Impact

- Affected browser code: `src/main.ts`, `src/styles.css`, and scenario-specific UI tests.
- Affected runtime/deployment code: scenario API handlers, Vectorize helper code, indexing script, package scripts, workflow steps, and scenario Vectorize documentation.
- No changes to the tournament data schema, authoritative fixture/result refresh strategy, immutable completed results, prediction editing, or static app hosting requirements.
