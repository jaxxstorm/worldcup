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
The system SHALL update projected qualification, round-of-32 slots, and later knockout outcomes whenever relevant predictions change.

#### Scenario: Group qualification changes
- **WHEN** prediction changes alter group ranking or qualification status
- **THEN** the projected qualified teams and round-of-32 assignments MUST update

#### Scenario: Knockout winner changes
- **WHEN** a user changes a prediction for a knockout match
- **THEN** downstream projected fixtures MUST update to reflect the new advancing team

### Requirement: Calculations are deterministic
The system SHALL calculate standings and tournament projections deterministically from the same tournament data and prediction state.

#### Scenario: Same inputs produce same projection
- **WHEN** the same normalized tournament data and prediction model are evaluated repeatedly
- **THEN** the system MUST produce the same standings, qualifiers, and knockout projection each time
