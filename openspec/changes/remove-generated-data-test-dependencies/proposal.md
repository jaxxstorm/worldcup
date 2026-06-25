## Why

CI should not fail just because the generated tournament dataset changes after fixture or result refreshes. Tests need deterministic inputs for application behavior so authoritative data updates do not create unrelated red builds.

## What Changes

- Move behavior-focused tests away from `src/data/tournament.generated.json` and onto explicit in-test fixtures or shared test fixture builders.
- Keep generated-data coverage limited to schema/contract validation and broad smoke assertions that are intentionally tolerant of result and schedule changes.
- Preserve immutable real-result behavior in tests by modeling completed fixtures inside deterministic fixtures rather than relying on whichever match is currently completed in generated data.

## Capabilities

### New Capabilities

- `test-data-independence`: Defines the expectation that CI tests remain deterministic when generated tournament data changes.

### Modified Capabilities

- `tournament-data`: Clarifies that generated data may be validated directly, but application behavior tests must not depend on exact generated fixture, result, or team contents.

## Impact

- Affected code is expected to be under `src/__tests__` with possible shared helpers for deterministic tournament data.
- No production API or runtime behavior changes are intended.
- Generated data remains sourced and refreshed through the existing static-data workflow compatible with GitHub Pages.
