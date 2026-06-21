## ADDED Requirements

### Requirement: Performance view shows rank-adjusted fixture performances
The system SHALL display individual fixture performances in the Performance view using rank-adjusted credit derived from FIFA rankings, authoritative results, and active predictions.

#### Scenario: User views fixture performances
- **WHEN** a user opens the Performance view
- **THEN** the app MUST show the fixture performance formula and a table with team, opponent, fixture, scoreline, result type, FIFA ranking context, actual points, expected points, surprise points, margin contribution, rank-adjusted credit, and whether the score comes from a final result or active prediction

#### Scenario: Fixture tab summarizes teams first
- **WHEN** a user opens the fixture-level Performance sub-tab
- **THEN** the app MUST show a team summary table before the individual result list with total credit, average credit, best credit, worst credit, and final/predicted row counts

#### Scenario: User switches performance analysis type
- **WHEN** a user opens the Performance view
- **THEN** the app MUST provide sub-tabs for team-level performance and fixture-level performance so each analysis can be viewed without scrolling through the other table

#### Scenario: Formula explanation is readable
- **WHEN** the fixture performance formula is displayed
- **THEN** the app MUST explain rank gap, expected points, surprise points, margin contribution, and final credit in user-facing language alongside the mathematical formula

#### Scenario: Prediction changes fixture performance table
- **WHEN** a user changes a complete group-stage prediction
- **THEN** the fixture performance table MUST update without a page reload

#### Scenario: Static hosting remains compatible
- **WHEN** the app is built for static hosting
- **THEN** fixture performance entries MUST be renderable from bundled tournament data and deterministic browser calculations without runtime server access
