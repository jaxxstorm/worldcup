## Why

The Performance view currently explains team form through group-stage outcomes only, so it does not show how teams perform against all opponents once knockout matches are resolved or predicted. Users need a fuller opponent-relative performance view that includes knockout games, making examples like France outperforming everyone or England earning a strong result against Mexico visible in one place.

## What Changes

- Add a new Performance sub-tab that ranks team performance across all resolved and predicted tournament fixtures, including knockout matches.
- Extend opponent-relative performance calculations beyond group fixtures while preserving immutable authoritative results and using active predictions only for unresolved matches.
- Show team-level totals and opponent context for all-team performance, including games played, actual result total, expected result total, success score, and final/predicted counts.
- Keep the existing group-stage fixture performance view available for its current analysis scope.
- No breaking changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `fixture-performance`: Extend rank-adjusted fixture performance requirements to support all resolved or predicted fixtures, including knockout fixtures where both sides are known and ranked.
- `browser-app`: Add a Performance sub-tab for all-team opponent-relative performance that renders from static data and active client-side predictions.

## Impact

- Affects the performance calculation engine, Performance view tab/sub-tab UI, and performance tests.
- Uses existing bundled tournament teams, rankings, fixtures, authoritative results, and active prediction state; no new runtime API or server dependency is required.
- Authoritative completed results remain fixed facts and predictions remain mutable inputs for unresolved matches only.
- Static hosting remains compatible because the feature is derived from bundled data and deterministic browser calculations.
