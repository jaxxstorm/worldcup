## ADDED Requirements

### Requirement: Behavior tests use deterministic data
The test suite SHALL exercise application behavior with deterministic fixtures that are defined in tests or test helpers rather than relying on generated tournament data.

#### Scenario: Generated results change
- **WHEN** authoritative generated match results are refreshed
- **THEN** behavior tests MUST continue to pass without requiring expectation updates for the new result set

#### Scenario: Generated schedule changes
- **WHEN** authoritative generated fixture dates, teams, venues, rankings, or stats are refreshed
- **THEN** behavior tests MUST continue to pass without requiring expectation updates for the new generated values

### Requirement: Generated data tests are contract-focused
Tests that import generated tournament data SHALL validate loadability, schema conformance, and broad invariants only.

#### Scenario: Generated data is validated
- **WHEN** a test imports the generated tournament dataset
- **THEN** the test MUST avoid exact behavioral expectations that depend on current fixture results, fixture counts, team rankings, or stat values

#### Scenario: Production data remains covered
- **WHEN** CI runs the generated-data tests
- **THEN** the tests MUST still fail if the generated artifact cannot be loaded or violates the normalized tournament data contract
