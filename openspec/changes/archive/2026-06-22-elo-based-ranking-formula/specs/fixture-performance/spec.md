## MODIFIED Requirements

### Requirement: Rank-adjusted fixture performance entries are calculated
The system SHALL calculate fixture-level performance entries for each team side of resolved group fixtures using authoritative results plus complete active predictions.

#### Scenario: Completed fixture produces side entries
- **WHEN** a group fixture has an authoritative result and both teams have FIFA rankings
- **THEN** the system MUST produce one performance entry for the home team and one performance entry for the away team with fixture id, team id, opponent id, goals for, goals against, result points, team FIFA ranking, opponent FIFA ranking, team seed rating, opponent seed rating, expected result, actual result, and success score

#### Scenario: Predicted fixture produces side entries
- **WHEN** an unresolved group fixture has a complete active score prediction and both teams have FIFA rankings
- **THEN** the system MUST include fixture performance entries calculated from the predicted score without mutating the fixture record

#### Scenario: Partial prediction is ignored
- **WHEN** an unresolved fixture does not have a complete active prediction
- **THEN** the system MUST NOT produce fixture performance entries for that fixture

### Requirement: Fixture credit uses ranking baseline points
The system SHALL award fixture success score as actual result minus Elo-style expected result scaled to three points, where team and opponent seed ratings are derived from FIFA rankings.

#### Scenario: Published seed rating is derived from FIFA ranking
- **WHEN** a team has a FIFA ranking
- **THEN** the system MUST calculate its seed rating as `2200 - ((fifaRanking - 1) * 6)`

#### Scenario: Expected result uses Elo curve
- **WHEN** a ranked team is scored against a ranked opponent
- **THEN** the system MUST calculate expected result as `1 / (1 + 10 ** ((opponentSeedRating - teamSeedRating) / 400))`

#### Scenario: Success score compares actual result to expectation
- **WHEN** a ranked fixture side has a win, draw, or loss
- **THEN** the system MUST calculate actual result as 1 for a win, 0.5 for a draw, or 0 for a loss, and success score as `(actualResult - expectedResult) * 3`

#### Scenario: Close-ranked favorite win outranks routine heavy-favorite win
- **WHEN** one team beats a closely ranked lower opponent and another team beats a much lower-ranked opponent
- **THEN** the close-ranked win MUST produce a larger positive success score when the actual result is otherwise equivalent

#### Scenario: Underdog draw is rewarded
- **WHEN** a lower-ranked team draws against a higher-ranked opponent
- **THEN** the lower-ranked team's fixture success score MUST be positive and the higher-ranked team's fixture success score MUST be negative

#### Scenario: Favorite draw is penalized
- **WHEN** a higher-ranked team draws against a lower-ranked opponent
- **THEN** the higher-ranked team's fixture success score MUST be negative using the Elo-style expected result

### Requirement: Fixture performance ranking is deterministic
The system SHALL sort fixture performance entries deterministically from the same tournament data and prediction state.

#### Scenario: Scores are tied
- **WHEN** two fixture performance entries have the same success score
- **THEN** the system MUST sort them by actual result, goal difference, opponent FIFA ranking, fixture match number, and team name in a stable order

#### Scenario: Rankings are unavailable
- **WHEN** a fixture side or its opponent does not have a FIFA ranking
- **THEN** the system MUST keep the calculation deterministic without inventing a missing ranking
