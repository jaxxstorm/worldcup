## Why

Prediction inputs currently re-render the app while a user is typing, which causes the page to jump and the active input to lose its value or focus. This blocks the core predictor workflow because users cannot reliably enter scores for unresolved fixtures.

## What Changes

- Keep prediction score inputs usable while users type or use number steppers.
- Avoid clearing partial score entry before both sides of a prediction are available.
- Preserve the user's scroll position and focused prediction input when recalculating after a complete prediction edit.
- Continue recalculating standings and knockout projections immediately once a valid full prediction is entered.
- Keep real completed results immutable and non-editable.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `browser-app`: prediction editing must accept typed and stepper input without focus loss, page jumps, or premature clearing of partial score entry.

## Impact

- Affects prediction input handling in `src/main.ts`.
- May add a small helper for deciding whether an input event should update, clear, or leave the active prediction model unchanged.
- Adds focused tests for partial prediction entry and completed prediction updates.
- Does not change fixture/result data, the JSON schema, authoritative data sources, static GitHub Pages hosting, or session storage format.
