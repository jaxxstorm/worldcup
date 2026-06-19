## ADDED Requirements

### Requirement: Optional stat leaderboard data
The normalized tournament dataset SHALL support optional tournament stat leaderboards with source metadata.

#### Scenario: Stat leaderboard is present
- **WHEN** the generated tournament dataset includes stat leaderboard data
- **THEN** validation MUST require each leaderboard to include an id, label, value label, source metadata, and entries array

#### Scenario: Stat leaderboard is absent
- **WHEN** the generated tournament dataset does not include stat leaderboard data
- **THEN** validation MUST continue to accept the dataset so fixtures, standings, and projections remain usable

#### Scenario: Stat source is retained
- **WHEN** stat leaderboard data is normalized from an external or manual source
- **THEN** the dataset MUST retain source metadata sufficient to identify the stat source and access time
