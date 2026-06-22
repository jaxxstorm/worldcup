## Why

The current Performance view shows team-level movement against FIFA-ranking expectations, but it does not explain which individual fixtures were especially impressive or disappointing. A lower-ranked team earning the same result against a stronger opponent should receive more credit than a favorite earning that result against a weaker opponent.

## What Changes

- Add fixture-level performance scoring for completed group fixtures and user-predicted group fixtures.
- Compare each team result against the FIFA rankings of both teams, awarding higher credit for wins and draws against stronger opponents and lower credit for results a favorite was expected to earn.
- Surface a rank-adjusted fixture performance table in the browser Performance view.
- Keep calculations deterministic, client-side, and derived from bundled tournament data plus active predictions.

## Capabilities

### New Capabilities
- `fixture-performance`: Calculates and exposes rank-adjusted performance entries for individual fixtures.

### Modified Capabilities
- `browser-app`: The Performance view shows rank-adjusted individual fixture performances.

## Impact

- Affects `src/engine/performance.ts`, `src/main.ts`, styles, and focused performance tests.
- Uses existing normalized fixture, result, prediction, and team FIFA-ranking data from the static tournament dataset.
- Does not alter authoritative results or prediction storage; real results remain immutable and predictions continue to apply only to unresolved fixtures.
- Requires no server runtime and remains compatible with GitHub Pages/static hosting.
