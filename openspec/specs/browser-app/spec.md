## Purpose

Define the static browser application experience for the World Cup 2026 predictor, including fixtures, flags, session persistence, prediction editing, and GitHub Pages hosting behavior.

## Requirements

### Requirement: Static TypeScript browser app
The system SHALL provide a TypeScript/JavaScript browser application that builds to static assets suitable for GitHub Pages hosting.

#### Scenario: Static build is produced
- **WHEN** the application build command completes
- **THEN** it MUST produce static files that can be served without a runtime application server

#### Scenario: App is served from GitHub Pages path
- **WHEN** the app is hosted from a GitHub Pages project path
- **THEN** routing and asset URLs MUST continue to work from that static base path

### Requirement: Fixtures and locations are visible
The system SHALL display World Cup fixtures with team names, flags, match status, kickoff details when available, venue, host city, and location.

#### Scenario: Fixture list renders
- **WHEN** a user views fixtures
- **THEN** each fixture MUST show its teams or unresolved placeholders, status, venue, and host city

#### Scenario: Match has a completed result
- **WHEN** a fixture has an authoritative result
- **THEN** the UI MUST show the real score as fixed rather than as an editable prediction

### Requirement: Prediction editing updates the displayed model
The system SHALL let users edit predictions for unresolved matches and immediately display updated standings and tournament projections.

#### Scenario: User edits prediction
- **WHEN** a user changes a prediction score
- **THEN** the visible standings and projected outcomes MUST update without a page reload

#### Scenario: User resets prediction
- **WHEN** a user clears an unresolved match prediction
- **THEN** the visible standings and projected outcomes MUST remove that prediction from the active model

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
