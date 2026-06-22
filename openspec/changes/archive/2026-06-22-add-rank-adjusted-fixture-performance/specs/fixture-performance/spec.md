## ADDED Requirements

### Requirement: Rank-adjusted fixture performance entries are calculated
The system SHALL calculate fixture-level performance entries for each team side of resolved group fixtures using authoritative results plus complete active predictions.

#### Scenario: Completed fixture produces side entries
- **WHEN** a group fixture has an authoritative result and both teams have FIFA rankings
- **THEN** the system MUST produce one performance entry for the home team and one performance entry for the away team with fixture id, team id, opponent id, goals for, goals against, result points, baseline points, ranking gap, rank factor, and fixture credit

#### Scenario: Predicted fixture produces side entries
- **WHEN** an unresolved group fixture has a complete active score prediction and both teams have FIFA rankings
- **THEN** the system MUST include fixture performance entries calculated from the predicted score without mutating the fixture record

#### Scenario: Partial prediction is ignored
- **WHEN** an unresolved fixture does not have a complete active prediction
- **THEN** the system MUST NOT produce fixture performance entries for that fixture

### Requirement: Fixture credit uses ranking baseline points
The system SHALL award fixture credit as actual points minus baseline points scaled by rank factor, where the better FIFA-ranked team is expected to win, the worse-ranked team is expected to lose, and equal-ranked teams are expected to draw.

#### Scenario: Underdog draw outranks favorite draw
- **WHEN** a lower-ranked team and a higher-ranked team draw the same fixture
- **THEN** the lower-ranked team's fixture credit MUST be positive and the higher-ranked team's fixture credit MUST be negative using the same rank factor

#### Scenario: Underdog win outranks expected favorite win
- **WHEN** one team beats a stronger-ranked opponent and another team earns the same result points against a weaker-ranked opponent
- **THEN** the win against the stronger-ranked opponent MUST have positive fixture credit and the expected favorite win MUST have 0 fixture credit

#### Scenario: Favorite draw is penalized
- **WHEN** a higher-ranked team draws against a lower-ranked opponent
- **THEN** the higher-ranked team's fixture credit MUST be negative using the match rank factor

### Requirement: Fixture performance ranking is deterministic
The system SHALL sort fixture performance entries deterministically from the same tournament data and prediction state.

#### Scenario: Scores are tied
- **WHEN** two fixture performance entries have the same rank-adjusted credit
- **THEN** the system MUST sort them by result points, goal difference, opponent FIFA ranking, fixture match number, and team name in a stable order

#### Scenario: Rankings are unavailable
- **WHEN** a fixture side or its opponent does not have a FIFA ranking
- **THEN** the system MUST keep the calculation deterministic without inventing a missing ranking
