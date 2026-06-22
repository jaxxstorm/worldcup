## Why

Prediction edits can immediately reshuffle group tables and projected knockout paths, but the current UI redraws silently. Users need a quick way to see what their latest completed prediction changed without manually comparing the before and after state.

## What Changes

- Add visual change indicators to standings rows that changed after the latest completed prediction edit.
- Add visual change indicators to projected knockout cards, bracket diagram participants, and bracket fixture rows whose projected teams or winners changed.
- Keep highlights transient and client-side only, without changing prediction calculations, stored data, or authoritative result handling.

## Capabilities

### New Capabilities

### Modified Capabilities
- `browser-app`: Prediction-driven table and bracket recalculation must visibly identify rows and bracket slots affected by the latest completed edit.

## Impact

- Affected code: `src/main.ts`, `src/styles.css`, and browser-app tests.
- No fixture, result, team, venue, or external data source changes.
- No server/runtime changes; behavior remains compatible with static hosting.
