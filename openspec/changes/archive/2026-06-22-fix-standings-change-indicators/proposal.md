## Why

Prediction-change highlighting currently marks standings rows as changed when a prediction is added even if the visible standings values users care about have not changed. This creates noisy "Changed" badges and previous-value tooltips that imply a table movement happened when only the prediction model changed.

## What Changes

- Narrow standings row change indicators so they appear only when a team's table position or table-relevant status changes.
- Show points and goal-related changes at the affected standings values instead of marking the whole row as changed when table order is unchanged.
- Keep prediction-only recalculations from showing a standings-row "Changed" badge when the table standing itself is unchanged.
- Preserve existing bracket-change highlighting when predictions alter projected knockout participants, matchups, source slots, or winners.

## Capabilities

### New Capabilities

### Modified Capabilities
- `browser-app`: Prediction-driven standings highlighting must reflect actual displayed table-value changes instead of any prediction-triggered recalculation.

## Impact

- Affected code: standings snapshot comparison, row highlight rendering, tooltip copy, and browser-app tests.
- No fixture, result, team, venue, or external data source changes.
- No server/runtime changes; behavior remains compatible with static hosting.
