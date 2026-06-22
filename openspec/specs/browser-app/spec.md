## Purpose

Define the static browser application experience for the World Cup 2026 predictor, including fixtures, flags, session persistence, prediction editing, and GitHub Pages hosting behavior.
## Requirements
### Requirement: Static TypeScript browser app
The system SHALL provide a TypeScript/JavaScript browser application that builds to static assets suitable for Cloudflare Pages or equivalent static hosting, using the generated tournament dataset as its published data source.

#### Scenario: Static build is produced
- **WHEN** the application build command completes
- **THEN** it MUST produce static files that can be served without a runtime application server

#### Scenario: App is served from static hosting
- **WHEN** the app is hosted from its configured static site origin
- **THEN** routing and asset URLs MUST continue to work from that static base path

#### Scenario: Generated data is refreshed
- **WHEN** the generated tournament dataset changes before a build
- **THEN** the built browser app MUST use the refreshed generated data for fixtures, results, standings, and projections

### Requirement: Fixtures and locations are visible
The system SHALL display World Cup fixtures with team names, flags, match status, kickoff details when available, venue, host city, and location, grouped into visually distinct date sections.

#### Scenario: Fixture list renders
- **WHEN** a user views fixtures
- **THEN** each fixture MUST show its teams or unresolved placeholders, status, venue, and host city

#### Scenario: Match has a completed result
- **WHEN** a fixture has an authoritative result
- **THEN** the UI MUST show the real score as fixed rather than as an editable prediction

#### Scenario: Fixtures are grouped by match date
- **WHEN** a user views fixtures with multiple matches on the same calendar date
- **THEN** those fixtures MUST appear within the same visually distinct dated group based on the normalized fixture date

#### Scenario: Fixture date groups use normalized schedule dates
- **WHEN** the fixture list groups matches by date
- **THEN** group counts MUST reflect validated fixture dates from the tournament dataset rather than synthetic group-generation matchdays

#### Scenario: Date groups are chronological
- **WHEN** a user views the fixture list
- **THEN** dated fixture groups MUST be ordered chronologically by match date

#### Scenario: Fixtures within a date group are chronological
- **WHEN** a dated fixture group contains multiple matches
- **THEN** fixtures within that group MUST be ordered by kickoff time and then match number

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

#### Scenario: Prediction edit highlights table changes
- **WHEN** a complete prediction edit changes a team's standing rank, points, goal difference, or qualification status
- **THEN** the affected standings row MUST be visually distinguished from unchanged rows after recalculation

#### Scenario: Prediction edit highlights bracket changes
- **WHEN** a complete prediction edit changes a projected knockout participant, source slot, matchup, or winner
- **THEN** the affected bracket cards, bracket diagram participants, and bracket fixture rows MUST be visually distinguished from unchanged bracket content after recalculation

#### Scenario: Change highlight explains previous value
- **WHEN** a user hovers or focuses a recent-change badge
- **THEN** the app MUST show the previous standing, participant, matchup, or winner value that was replaced by the latest completed prediction edit

#### Scenario: Initial model has no change highlights
- **WHEN** the app first renders restored predictions from session storage
- **THEN** standings and bracket content MUST render without recent-change highlighting until the user completes a new prediction edit

### Requirement: Session storage persistence
The system SHALL persist the active prediction model in browser session storage and restore it during the same browser session.

#### Scenario: Prediction is restored
- **WHEN** a user reloads the page in the same browser session
- **THEN** previously entered valid predictions MUST be restored from session storage

#### Scenario: Stored prediction is invalid
- **WHEN** session storage contains invalid JSON, unknown fixture IDs, or predictions for completed fixtures
- **THEN** the app MUST discard invalid entries and continue loading

### Requirement: Country flags display
The system SHALL display country flags wherever teams appear in fixtures, standings, and knockout projections.

#### Scenario: Team appears in standings
- **WHEN** a team is shown in a table row
- **THEN** the team flag MUST be shown with the team identity

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

### Requirement: Bracket draw side view
The system SHALL include a bracket view that communicates which projected teams occupy each side of the knockout draw.

#### Scenario: Bracket tab includes draw sides
- **WHEN** a user selects the bracket tab
- **THEN** the app MUST display a draw-side bracket visualization before or alongside detailed round cards

#### Scenario: Draw side view is responsive
- **WHEN** the bracket view is displayed on narrow screens
- **THEN** the draw sides MUST remain readable without overlapping text or controls

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

### Requirement: Stats tab
The system SHALL provide a Stats tab that displays tournament player stat leaderboards.

#### Scenario: User opens stats tab
- **WHEN** a user selects the Stats tab
- **THEN** the app MUST display available player stat leaderboards

#### Scenario: No leaderboard data exists
- **WHEN** no stat leaderboards are available in tournament data
- **THEN** the Stats tab MUST display a non-failing empty state for player stats

#### Scenario: Stats tab on static hosting
- **WHEN** the app is served from static hosting
- **THEN** Stats tab navigation MUST work without requiring a server-side route

### Requirement: Bracket tab shows knockout qualification
The system SHALL show the current best third-place ranking table on the Bracket tab as knockout qualification context.

#### Scenario: User opens bracket tab
- **WHEN** a user selects the Bracket tab
- **THEN** the app MUST display the calculated best third-place ranking table near the projected bracket

#### Scenario: Prediction updates knockout qualification
- **WHEN** a user changes a group-stage prediction that affects standings
- **THEN** the Bracket tab knockout qualification table MUST update without a page reload

### Requirement: Performance view shows rank-adjusted fixture performances
The system SHALL display individual fixture performances in the Performance view using rank-adjusted credit derived from FIFA rankings, authoritative results, and active predictions.

#### Scenario: User views fixture performances
- **WHEN** a user opens the Performance view
- **THEN** the app MUST show the fixture performance baseline and rank-factor rules and a result list with team, opponent, fixture, scoreline, result type, FIFA ranking context, actual points, baseline points, rank factor, fixture credit, and whether the score comes from a final result or active prediction

#### Scenario: Fixture tab summarizes teams first
- **WHEN** a user opens the fixture-level Performance sub-tab
- **THEN** the app MUST show a team summary table before the individual result list with games played, actual points, baseline points, total credit, and final/predicted row counts

#### Scenario: User switches performance analysis type
- **WHEN** a user opens the Performance view
- **THEN** the app MUST provide sub-tabs for team-level performance and fixture-level performance so each analysis can be viewed without scrolling through the other table

#### Scenario: Formula explanation is readable
- **WHEN** the fixture performance baseline rules are displayed
- **THEN** the app MUST explain how baseline points, rank factor, and credit are derived from FIFA ranking and actual match points in user-facing language

#### Scenario: Prediction changes fixture performance table
- **WHEN** a user changes a complete group-stage prediction
- **THEN** the fixture performance table MUST update without a page reload

#### Scenario: Static hosting remains compatible
- **WHEN** the app is built for static hosting
- **THEN** fixture performance entries MUST be renderable from bundled tournament data and deterministic browser calculations without runtime server access
