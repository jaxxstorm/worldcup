## MODIFIED Requirements

### Requirement: Prediction editing updates the displayed model
The system SHALL let users edit predictions for unresolved matches and immediately display updated standings, first-page projected outcomes, and bracket-page tournament projections.

#### Scenario: User edits prediction
- **WHEN** a user changes a prediction score
- **THEN** the visible standings and projected outcomes MUST update without a page reload

#### Scenario: User resets prediction
- **WHEN** a user clears an unresolved match prediction
- **THEN** the visible standings and projected outcomes MUST remove that prediction from the active model

#### Scenario: Bracket updates after prediction
- **WHEN** a user changes a prediction that affects qualification or advancement
- **THEN** the bracket page MUST update affected bracket entrants and downstream projected winners without a page reload

## ADDED Requirements

### Requirement: Bracket page
The system SHALL provide a distinct bracket page or tab that displays the knockout bracket separately from the main fixtures/table view.

#### Scenario: User opens bracket page
- **WHEN** a user selects the bracket page or tab
- **THEN** the app MUST display knockout rounds in bracket order using the current projection model

#### Scenario: Static hosting remains compatible
- **WHEN** the app is served from GitHub Pages
- **THEN** bracket navigation MUST work without requiring server-side routes

### Requirement: Bracket state of the world
The system SHALL display current resolved teams for bracket slots when real results and active predictions determine where teams would fall if the tournament ended today.

#### Scenario: Slot has current team
- **WHEN** a bracket slot can be resolved from current real results and active predictions
- **THEN** the bracket MUST show the resolved team with its source slot label

#### Scenario: Slot is unresolved
- **WHEN** a bracket slot cannot yet be resolved
- **THEN** the bracket MUST show the unresolved source slot label

### Requirement: Bracket match metadata
The system SHALL display bracket match kickoff time, venue, host city, and location for each bracket fixture when those fields are available in tournament data.

#### Scenario: Bracket match has venue and kickoff
- **WHEN** a bracket match is displayed
- **THEN** the bracket MUST show its kickoff time, venue, host city, and country

### Requirement: First-page projected bracket context
The system SHALL show current resolved teams alongside placeholder/source labels in the first-page projected knockout area.

#### Scenario: First page has resolved source slot
- **WHEN** the first-page projected knockout area displays a slot with a currently resolved team
- **THEN** it MUST show the resolved team and the source label that produced it

#### Scenario: First page has unresolved source slot
- **WHEN** the first-page projected knockout area displays an unresolved slot
- **THEN** it MUST continue to show the source placeholder label
