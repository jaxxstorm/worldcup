## Why

Users need a clearer way to understand the knockout bracket than placeholder labels like "Winner L" or "3/5/6". A dedicated bracket view and a current "state of the world" projection make the tournament outcome understandable before every group and knockout result is final.

## What Changes

- Add a distinct bracket page or tab that renders the knockout bracket.
- Resolve bracket entrants from the current real results plus active predictions.
- Show the current "state of the world" for unresolved slots: if the tournament ended today, show which teams would occupy each bracket position.
- Update bracket entrants and downstream winners immediately when predictions change.
- Include fixture venue/location and kickoff time on bracket matches.
- Update the first page's projected knockout area so placeholder slots also show the current resolved team where available.
- Keep real results immutable and continue using predictions only for unresolved fixtures.
- Keep the feature compatible with static GitHub Pages hosting; no server-side routing or persistence is required.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `browser-app`: Adds bracket navigation/page behavior and displays current projected teams, match locations, and times in bracket and first-page knockout views.
- `prediction-engine`: Extends projection behavior so unresolved bracket slots expose a current "state of the world" team when standings/predictions can resolve one.

## Impact

- Affects client-side projection model and knockout/bracket rendering.
- May add tab/page state in the browser app without introducing server routing.
- Adds tests for bracket slot resolution and prediction-driven bracket updates.
- Does not change the tournament data schema beyond consuming existing fixture venue/time fields.
