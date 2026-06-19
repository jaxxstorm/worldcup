## Purpose

Define deterministic prediction, standings, qualification, and knockout projection behavior while keeping authoritative tournament data separate from user predictions.
## Requirements
### Requirement: Predictions apply only to unresolved matches
The system SHALL allow user predictions for unresolved fixtures and MUST prevent predictions from replacing authoritative results for completed fixtures.

#### Scenario: User predicts unresolved match
- **WHEN** a user enters a score for a fixture without an authoritative result
- **THEN** the prediction MUST be accepted into the active prediction model

#### Scenario: User attempts completed match prediction
- **WHEN** a user attempts to change a fixture with an authoritative result
- **THEN** the prediction MUST be rejected or ignored while preserving the real result

### Requirement: Prediction state is separate from source data
The system SHALL store user predictions separately from normalized tournament data.

#### Scenario: Prediction is stored
- **WHEN** a user predicts a match score
- **THEN** the active prediction model MUST store the prediction by fixture identifier without mutating the fixture record

#### Scenario: Prediction is cleared
- **WHEN** a user clears a prediction
- **THEN** the fixture MUST return to its unresolved state unless it has an authoritative result

### Requirement: Group standings recalculate
The system SHALL recalculate group standings from authoritative results plus active predictions whenever prediction state changes.

#### Scenario: Prediction changes table
- **WHEN** a user adds, edits, or clears a group-stage prediction
- **THEN** the affected group table MUST update to reflect points, wins, draws, losses, goals for, goals against, goal difference, and rank

#### Scenario: Real and predicted results combine
- **WHEN** a group contains both completed matches and predicted matches
- **THEN** the standings MUST include completed real results and accepted predictions in one projected table

### Requirement: Qualification and knockout projection recalculate
The system SHALL update projected qualification, round-of-32 slots, best third-place finisher assignments, and later knockout outcomes whenever relevant predictions change.

#### Scenario: Group qualification changes
- **WHEN** prediction changes alter group ranking or qualification status
- **THEN** the projected qualified teams and round-of-32 assignments MUST update

#### Scenario: Best third-place teams qualify
- **WHEN** projected group standings identify at least eight third-place teams
- **THEN** the eight best third-place teams MUST qualify for the round of 32 according to the active standings sort

#### Scenario: Third-place round-of-32 slots resolve
- **WHEN** the eight qualifying third-place groups are known
- **THEN** ambiguous round-of-32 labels such as `3A/B/C` MUST resolve to the concrete third-place team assigned by the FIFA third-place group combination table

#### Scenario: Third-place assignment uses current standings
- **WHEN** the group stage is incomplete but current standings identify at least eight third-place teams
- **THEN** ambiguous third-place round-of-32 labels MUST resolve from the current third-place standings as the tournament stands today

#### Scenario: Knockout winner changes
- **WHEN** a user changes a prediction for a knockout match
- **THEN** downstream projected fixtures MUST update to reflect the new advancing team

### Requirement: Calculations are deterministic
The system SHALL calculate standings, qualifiers, current bracket slot resolution, and tournament projections deterministically from the same tournament data and prediction state.

#### Scenario: Same inputs produce same projection
- **WHEN** the same normalized tournament data and prediction model are evaluated repeatedly
- **THEN** the system MUST produce the same standings, qualifiers, bracket slot resolution, and knockout projection each time

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

