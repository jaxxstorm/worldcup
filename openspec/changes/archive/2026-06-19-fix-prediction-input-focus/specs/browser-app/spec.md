## MODIFIED Requirements

### Requirement: Prediction editing updates the displayed model
The system SHALL let users edit predictions for unresolved matches and immediately display updated standings and tournament projections when a complete valid prediction is available.

#### Scenario: User edits prediction
- **WHEN** a user changes both home and away prediction scores for an unresolved fixture
- **THEN** the visible standings and projected outcomes MUST update without a page reload

#### Scenario: User edits a partial prediction
- **WHEN** a user enters only one side of an unresolved fixture prediction
- **THEN** the entered value MUST remain visible and focused without clearing the field or scrolling the page away from the active input

#### Scenario: User uses number input stepper
- **WHEN** a user increments or decrements an unresolved fixture prediction score with the input stepper
- **THEN** the input MUST populate with the stepped value and remain usable

#### Scenario: User resets prediction
- **WHEN** a user clears an unresolved match prediction
- **THEN** the visible standings and projected outcomes MUST remove that prediction from the active model

#### Scenario: Prediction recalculation preserves editing context
- **WHEN** a complete prediction edit causes standings and projected outcomes to recalculate
- **THEN** the app MUST preserve the user's scroll position and restore focus to the edited prediction input when it is still present
