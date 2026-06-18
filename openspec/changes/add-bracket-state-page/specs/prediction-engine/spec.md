## MODIFIED Requirements

### Requirement: Qualification and knockout projection recalculate
The system SHALL update projected qualification, round-of-32 slots, later knockout outcomes, and current bracket slot resolution whenever relevant predictions change.

#### Scenario: Group qualification changes
- **WHEN** prediction changes alter group ranking or qualification status
- **THEN** the projected qualified teams and round-of-32 assignments MUST update

#### Scenario: Knockout winner changes
- **WHEN** a user changes a prediction for a knockout match
- **THEN** downstream projected fixtures MUST update to reflect the new advancing team

#### Scenario: Bracket slot resolution changes
- **WHEN** prediction changes alter which team currently maps to a bracket slot
- **THEN** the projection MUST expose the updated current team for that bracket slot

### Requirement: Calculations are deterministic
The system SHALL calculate standings, qualifiers, current bracket slot resolution, and tournament projections deterministically from the same tournament data and prediction state.

#### Scenario: Same inputs produce same projection
- **WHEN** the same normalized tournament data and prediction model are evaluated repeatedly
- **THEN** the system MUST produce the same standings, qualifiers, bracket slot resolution, and knockout projection each time

## ADDED Requirements

### Requirement: Current bracket slot resolution
The system SHALL expose both the source label and the current resolved team for each bracket slot when tournament data plus active predictions can determine that team.

#### Scenario: Source slot resolves to team
- **WHEN** standings and predictions determine a team for a bracket source slot
- **THEN** the projection MUST include that team and the original source label

#### Scenario: Source slot remains unresolved
- **WHEN** standings and predictions cannot determine a team for a bracket source slot
- **THEN** the projection MUST include the original source label without inventing a team

### Requirement: Bracket projection metadata
The system SHALL include fixture metadata needed to render bracket match time and location in the projected bracket model.

#### Scenario: Projected bracket match includes metadata
- **WHEN** a bracket match is projected
- **THEN** the projection MUST expose its fixture id, stage, kickoff time, venue id, and participant sources
