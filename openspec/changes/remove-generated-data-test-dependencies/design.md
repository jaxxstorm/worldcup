## Context

Most application behavior is deterministic, but several tests currently import `tournamentData`, which is backed by the generated dataset. That dataset is expected to change when authoritative fixtures, results, rankings, or stats are refreshed, so exact expectations derived from it can fail in CI even when production behavior is correct.

The production app should continue to consume generated static data. The test suite needs a boundary: generated data can be validated as data, while engine, storage, sharing, scenario, and refresh behavior should be exercised with stable fixtures built for each behavior.

## Goals / Non-Goals

**Goals:**

- Make CI tests deterministic across generated-data refreshes.
- Replace generated-data-dependent behavior assertions with explicit fixtures or reusable fixture builders.
- Keep one narrow generated-data test surface for schema and smoke validation.

**Non-Goals:**

- Change the tournament JSON schema, runtime data loading, or generated data format.
- Remove the generated dataset from the production application.
- Hide legitimate product regressions by weakening behavior assertions.

## Decisions

1. Introduce deterministic test fixture helpers for tournament data.

   Tests that need teams, fixtures, completed results, knockout slots, or stats will construct those details directly. This keeps each test close to the behavior it validates and prevents changes in the real schedule or results from altering expectations.

   Alternative considered: freeze the generated dataset in CI. That would reduce failures temporarily, but it would fight the scheduled refresh workflow and could let production data drift from tested assumptions.

2. Keep generated-data tests limited to contract validation.

   `src/data/tournament.generated.json` may still be tested for schema validity, stable identifier presence, and broad invariants. Tests should not assert exact counts, exact qualified teams, exact future fixture availability, or exact stat values unless the assertion is specifically about the generated-data contract.

   Alternative considered: remove all generated-data tests. That would make CI quieter but would also lose useful coverage that the static app can load the generated artifact.

3. Preserve immutable-result and refresh behavior with explicit completed fixtures.

   Tests for completed fixtures will create completed records in their own fixture data instead of finding "the first completed fixture" in generated data. This keeps the important domain rule covered while avoiding a dependency on the current live tournament state.

   Alternative considered: branch assertions based on whether generated data currently has completed fixtures. That would make tests more complex and less meaningful.

## Risks / Trade-offs

- [Risk] Deterministic fixtures can diverge from production data shape. -> Mitigation: keep generated-data schema validation and use typed fixture builders.
- [Risk] Broad smoke assertions may miss a live-data-specific issue. -> Mitigation: keep production-data coverage focused on loadability and schema invariants, while behavior tests cover logic comprehensively.
- [Risk] Refactoring many tests at once can accidentally reduce coverage. -> Mitigation: run the full test suite and preserve existing behavior names and expectations where possible.
