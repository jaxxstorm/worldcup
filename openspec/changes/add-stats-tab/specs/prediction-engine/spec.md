## ADDED Requirements

### Requirement: Third-place ranking model
The system SHALL expose a reusable ranking of all group third-place teams from calculated standings.

#### Scenario: Third-place rankings use standings
- **WHEN** standings are calculated from real results plus active predictions
- **THEN** the third-place ranking model MUST include each group's third-place team, group id, rank, points, wins, draws, losses, goals for, goals against, and goal difference

#### Scenario: Ranking order matches qualification order
- **WHEN** best third-place groups are calculated from standings
- **THEN** the ordered third-place ranking model MUST place qualifying groups in the same order used for best third-place qualification

#### Scenario: Ranking is deterministic
- **WHEN** the same tournament data and prediction model are evaluated repeatedly
- **THEN** the third-place ranking model MUST return the same ordered rows
