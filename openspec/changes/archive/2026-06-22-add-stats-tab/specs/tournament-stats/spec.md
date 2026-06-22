## ADDED Requirements

### Requirement: Stat leaderboards are available
The system SHALL expose normalized tournament stat leaderboards for display in the browser app when stat data is available.

#### Scenario: Leaderboard data exists
- **WHEN** tournament stat data is loaded
- **THEN** each leaderboard MUST include a stable identifier, display label, value label, ranked entries, and source metadata

#### Scenario: Goal scorer leaderboard is capped
- **WHEN** the goal scorer leaderboard is normalized
- **THEN** it MUST contain no more than the top 10 ranked goal scorers

#### Scenario: Leaderboard entry has matched team
- **WHEN** a stat leaderboard entry can be matched to a tournament team
- **THEN** the entry MUST reference the team by local team identifier so the UI can display the team flag and name

#### Scenario: Leaderboard entry has unmatched team
- **WHEN** a stat leaderboard entry cannot be matched to a local tournament team
- **THEN** the entry MUST remain displayable with its player name, value, and optional detail text

### Requirement: Third-place rankings are calculated
The system SHALL calculate the current best third-place ranking table from group standings derived from authoritative results plus active predictions.

#### Scenario: Third-place table is calculated
- **WHEN** group standings are available
- **THEN** the stats model MUST rank each group's third-place team using the same points, goal difference, goals-for, and deterministic tie-break sort used for best third-place qualification

#### Scenario: Predictions change third-place table
- **WHEN** a user changes a group-stage prediction
- **THEN** the calculated third-place table MUST update from the active standings without requiring stored third-place ranking data

### Requirement: Stats remain static-host compatible
The system SHALL render tournament stats from bundled static data and deterministic browser calculations without requiring runtime server access.

#### Scenario: Static build renders stats
- **WHEN** the app is built for static hosting
- **THEN** stat leaderboards and third-place rankings MUST be renderable from the generated data and client-side calculations
