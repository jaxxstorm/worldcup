## Why

The current bracket view lists knockout rounds, but it is hard to understand which teams land on the same side of the draw and which paths can only meet in the final. A draw-side bracket makes the "if we started today" projection much easier to reason about at a glance.

## What Changes

- Add a bracket visualization that separates the projected round-of-32 draw into left and right sides.
- Show each side's round-of-32 pairings in bracket order with team flags, source slots, kickoff details, and venues.
- Keep the projection dynamic so real results and user predictions immediately update the teams shown on each side.
- Preserve the existing detailed round-by-round bracket information for match metadata and downstream projected winners.

## Capabilities

### New Capabilities
- `draw-side-bracket`: Covers visualizing the projected knockout draw as left and right sides with dynamic participants and match details.

### Modified Capabilities
- `browser-app`: The bracket page must show draw-side grouping in addition to the existing projected knockout data.

## Impact

- Updates bracket rendering and styling in the static browser app.
- Adds deterministic grouping helpers and tests for left/right draw sides.
- Does not change tournament data, external data ingestion, prediction storage, or result immutability.
