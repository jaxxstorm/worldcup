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

#### Scenario: Prediction edit highlights table movement
- **WHEN** a complete prediction edit changes a team's visible standing rank
- **THEN** the affected standings row MUST be visually distinguished from unchanged rows after recalculation

#### Scenario: Prediction edit highlights points and goal changes
- **WHEN** a complete prediction edit changes a team's displayed points or goal-related standings values without changing that team's visible standing rank
- **THEN** the affected points or goal-related values MUST show the change without marking the whole standings row as changed

#### Scenario: Prediction edit does not highlight unchanged table rows
- **WHEN** a complete prediction edit is added and the affected group's visible standing ranks are unchanged
- **THEN** standings rows whose only differences are points or goal-related values MUST NOT display a row-level "Changed" badge or row-level previous-standing tooltip

#### Scenario: Prediction edit highlights bracket changes
- **WHEN** a complete prediction edit changes a projected knockout participant, source slot, matchup, or winner
- **THEN** the affected bracket cards, bracket diagram participants, and bracket fixture rows MUST be visually distinguished from unchanged bracket content after recalculation

#### Scenario: Change highlight explains previous value
- **WHEN** a user hovers or focuses a recent-change badge
- **THEN** the app MUST show the previous standing value, points value, goal-related value, participant, matchup, or winner value that was replaced by the latest completed prediction edit

#### Scenario: Initial model has no change highlights
- **WHEN** the app first renders restored predictions from session storage
- **THEN** standings and bracket content MUST render without recent-change highlighting until the user completes a new prediction edit
