## 1. Engine Formula

- [x] 1.1 Add named helpers/constants for FIFA-rank seed rating, Elo expected result, actual result, and success score in `src/engine/performance.ts`.
- [x] 1.2 Replace bucketed baseline/rank-factor fixture credit with the Elo-style success score while preserving completed-result and complete-prediction inclusion rules.
- [x] 1.3 Update fixture performance entry and summary types to expose seed ratings, expected result, actual result, and success score totals.
- [x] 1.4 Keep deterministic sorting for tied success scores using actual result, goal difference, opponent FIFA ranking, match number, and team name.

## 2. Browser Presentation

- [x] 2.1 Update the fixture performance summary table to show actual result total, expected result total, and success score total.
- [x] 2.2 Update the fixture performance detail table to show seed ratings, expected result, actual result, and success score.
- [x] 2.3 Replace baseline/rank-factor explanatory copy and tooltips with the published Elo-style formula.
- [x] 2.4 Format decimal expected-result and success-score values consistently so the table remains readable.

## 3. Tests

- [x] 3.1 Update fixture performance tests for seed rating, expected result, and success score calculations.
- [x] 3.2 Add coverage showing a close-ranked favorite win scores above a routine heavy-favorite win.
- [x] 3.3 Add coverage showing underdog draws against stronger teams produce positive success and favorite draws produce negative success.
- [x] 3.4 Add coverage that complete predictions recalculate fixture performance without mutating tournament data.
- [x] 3.5 Keep tests based on local behavior fixtures rather than brittle generated tournament-data ordering.

## 4. Verification

- [x] 4.1 Run the test suite for performance calculations.
- [x] 4.2 Run type checking or the project verification script.
- [x] 4.3 Build the static app to confirm GitHub Pages compatibility is unchanged.
