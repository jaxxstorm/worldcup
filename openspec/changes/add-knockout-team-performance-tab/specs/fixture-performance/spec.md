## MODIFIED Requirements

### Requirement: Rank-adjusted fixture performance entries are calculated
The system SHALL calculate fixture-level performance entries for each team side of resolved group and knockout fixtures using authoritative results plus complete active predictions.

#### Scenario: Completed group fixture produces side entries
- **WHEN** a group fixture has an authoritative result and both teams have FIFA rankings
- **THEN** the system MUST produce one performance entry for the home team and one performance entry for the away team with fixture id, stage, group, team id, opponent id, goals for, goals against, result points, team FIFA ranking, opponent FIFA ranking, team seed rating, opponent seed rating, expected result, actual result, and success score

#### Scenario: Completed knockout fixture produces side entries
- **WHEN** a knockout fixture has an authoritative result, both teams are resolved, and both teams have FIFA rankings
- **THEN** the system MUST produce one performance entry for each side with fixture id, knockout stage, team id, opponent id, goals for, goals against, result points, team FIFA ranking, opponent FIFA ranking, team seed rating, opponent seed rating, expected result, actual result, and success score

#### Scenario: Predicted fixture produces side entries
- **WHEN** an unresolved group or knockout fixture has resolved teams, a complete active score prediction, and both teams have FIFA rankings
- **THEN** the system MUST include fixture performance entries calculated from the predicted score without mutating the fixture record

#### Scenario: Partial prediction is ignored
- **WHEN** an unresolved fixture does not have a complete active prediction
- **THEN** the system MUST NOT produce fixture performance entries for that fixture

#### Scenario: Unresolved knockout participant is ignored
- **WHEN** a knockout fixture still contains an unresolved source slot or placeholder for either side
- **THEN** the system MUST NOT produce fixture performance entries for that fixture

## ADDED Requirements

### Requirement: All-team fixture performance summaries include knockout matches
The system SHALL calculate team performance summaries across all included fixture performance entries, including group and knockout entries.

#### Scenario: Team has group and knockout entries
- **WHEN** a team has ranked performance entries from both group and knockout fixtures
- **THEN** the summary MUST aggregate games played, record, goals for, goals against, goal difference, actual points, actual result total, expected result total, total success score, final count, and prediction count across all included entries

#### Scenario: Summary sorting is deterministic
- **WHEN** two all-team summaries have equal success score
- **THEN** the system MUST sort them by actual result total, goal difference, goals for, expected result total, FIFA ranking, and team name in a stable order
