## ADDED Requirements

### Requirement: Bracket tab renders an interactive draw panel
The system SHALL render the bracket tab as a single visual bracket panel generated from the current tournament projection, with distinct sides of the draw and connected knockout paths.

#### Scenario: Bracket panel renders draw sides
- **WHEN** a user opens the bracket tab
- **THEN** the UI MUST show a bracket diagram with distinct left and right draw sides

#### Scenario: Bracket node includes fixture context
- **WHEN** a projected knockout match appears in the bracket diagram
- **THEN** the bracket node MUST show the fixture identifier, projected teams or source slots, flags for resolved teams, kickoff information, and venue context

#### Scenario: Prediction updates bracket diagram
- **WHEN** a user changes an unresolved prediction that affects the knockout projection
- **THEN** the bracket diagram MUST update without a page reload

### Requirement: Bracket tab includes fixture prediction table
The system SHALL show a fixture table underneath the visual bracket panel for bracket-related matches and prediction entry.

#### Scenario: Prediction table renders below bracket
- **WHEN** a user opens the bracket tab
- **THEN** the UI MUST show a fixture prediction table below the bracket diagram

#### Scenario: Prediction table preserves result immutability
- **WHEN** a bracket-related fixture has an authoritative completed result
- **THEN** the table MUST show the fixed result instead of editable prediction inputs

#### Scenario: Prediction table accepts unresolved scores
- **WHEN** a user edits an unresolved fixture score in the bracket table
- **THEN** the active prediction model, bracket diagram, and downstream projected outcomes MUST update without a page reload
