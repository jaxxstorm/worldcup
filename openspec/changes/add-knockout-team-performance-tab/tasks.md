## 1. Performance Engine

- [x] 1.1 Add fixture performance scope support so existing group-only calculations can remain available while all-fixtures calculations include knockout stages.
- [x] 1.2 Extend fixture performance entry data with stage and optional group metadata suitable for rendering group and knockout rows.
- [x] 1.3 Include knockout fixtures only when both participants are resolved team IDs, both teams have FIFA rankings, and the fixture has an authoritative result or complete active prediction.
- [x] 1.4 Ensure authoritative completed results take precedence over active predictions and fixture records are not mutated.
- [x] 1.5 Add all-team summary calculation across included group and knockout entries with deterministic sorting.

## 2. Browser UI

- [x] 2.1 Add a Performance sub-tab for all-team opponent-relative performance while keeping the existing Teams and group Fixtures sub-tabs.
- [x] 2.2 Render all-team summaries and result rows with stage/round context for knockout entries and group context for group entries.
- [x] 2.3 Update empty states and explanatory copy so group-only and all-team performance scopes are clear.
- [x] 2.4 Verify complete prediction edits recalculate the active Performance sub-tab without a page reload.

## 3. Tests

- [x] 3.1 Add engine tests with stable synthetic group and knockout fixtures to verify all-fixtures entries, unresolved placeholders, partial predictions, and authoritative-result precedence.
- [x] 3.2 Add summary tests verifying group plus knockout aggregation and deterministic sorting.
- [x] 3.3 Add UI or scenario tests verifying the new all-team sub-tab is available and includes knockout performance rows when data is resolved.

## 4. Verification

- [x] 4.1 Run the project test suite.
- [x] 4.2 Run the static build to confirm GitHub Pages-compatible output still builds without runtime server dependencies.
