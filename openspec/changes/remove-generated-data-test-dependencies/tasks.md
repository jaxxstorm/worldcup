## 1. Test Data Audit

- [x] 1.1 Identify tests that import generated tournament data for behavior assertions
- [x] 1.2 Classify generated-data tests that should remain as contract or smoke coverage

## 2. Deterministic Fixtures

- [x] 2.1 Add shared deterministic tournament-data fixture helpers for tests
- [x] 2.2 Ensure fixture helpers can model scheduled fixtures, completed fixtures, knockout slots, venues, rankings, fair play, and stat leaderboards

## 3. Test Refactor

- [x] 3.1 Refactor behavior tests to use deterministic fixtures instead of generated tournament data
- [x] 3.2 Keep generated-data tests focused on schema, loadability, and broad invariants
- [x] 3.3 Preserve coverage for immutable completed results and scheduled refresh behavior with explicit fixtures

## 4. Verification

- [x] 4.1 Run the full test suite
- [x] 4.2 Run type checking or build verification
