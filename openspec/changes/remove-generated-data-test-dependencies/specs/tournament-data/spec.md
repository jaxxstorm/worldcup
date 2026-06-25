## ADDED Requirements

### Requirement: Generated data supports deterministic tests
The generated tournament dataset SHALL be treated as mutable output of the authoritative data refresh process, while behavior tests SHALL use independent deterministic fixtures for exact logic expectations.

#### Scenario: Generated data changes after refresh
- **WHEN** the generated tournament dataset is updated from authoritative fixture, result, team, venue, ranking, or stats sources
- **THEN** CI tests MUST NOT fail solely because exact generated values changed

#### Scenario: Generated data contract is still validated
- **WHEN** generated tournament data is imported by tests
- **THEN** those tests MUST validate schema and broad contract invariants without depending on a specific current tournament state
