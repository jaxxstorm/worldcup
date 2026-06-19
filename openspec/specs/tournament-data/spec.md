## Purpose

Define the normalized World Cup 2026 tournament data contract, including fixtures, teams, venues, locations, real results, flags, source metadata, and knockout paths.
## Requirements
### Requirement: Normalized tournament schema
The system SHALL define a normalized JSON schema for World Cup 2026 tournament data including teams, groups, fixtures, match results, venues, host cities, country flags, standings inputs, and knockout paths.

#### Scenario: Tournament data loads
- **WHEN** the application loads normalized tournament data
- **THEN** the data MUST include stable identifiers for teams, fixtures, venues, groups, and knockout slots

#### Scenario: Fixture location is available
- **WHEN** a fixture is displayed
- **THEN** the fixture MUST expose its venue, host city, and location data from the normalized schema

### Requirement: External data normalization
The system SHALL support pulling fixture and result data from an external authoritative source where practical and normalizing it into the local tournament schema, including scheduled result refreshes that update generated static data.

#### Scenario: External data is normalized
- **WHEN** external fixture or result data is imported
- **THEN** the normalized output MUST conform to the local JSON schema used by the static application

#### Scenario: Source metadata is retained
- **WHEN** data is normalized from an external source
- **THEN** the normalized dataset MUST retain source metadata sufficient to identify where the data came from and when it was generated

#### Scenario: Fixture dates match schedule cadence
- **WHEN** group-stage fixture dates are normalized
- **THEN** fixtures MUST retain the authoritative match dates rather than assigning the same synthetic matchday pattern to every group

#### Scenario: Scheduled results update generated data
- **WHEN** a scheduled refresh imports completed match results
- **THEN** those results MUST be written to the generated tournament dataset consumed by the static app

### Requirement: Real results are immutable
The system SHALL mark completed matches with real results as immutable facts in the tournament dataset and reject scheduled refreshes that conflict with already recorded completed scores.

#### Scenario: Completed match has a result
- **WHEN** a fixture has an authoritative final result
- **THEN** the match MUST be treated as completed and unavailable for user prediction overrides

#### Scenario: Completed match feeds standings
- **WHEN** standings are calculated
- **THEN** authoritative real results MUST be included before any user predictions are applied

#### Scenario: Scheduled refresh conflicts with completed result
- **WHEN** an imported result has a different score for an already completed fixture
- **THEN** the refresh process MUST fail without overwriting the completed fixture

### Requirement: Country flags are represented
The system SHALL associate each team with a country flag asset or flag identifier suitable for display in the static browser app.

#### Scenario: Team is rendered
- **WHEN** a team appears in fixtures, standings, or knockout projections
- **THEN** the UI MUST be able to resolve a flag for that team from the tournament data

### Requirement: Knockout paths are modeled
The system SHALL represent knockout round slots and advancement paths starting with the round of 32 and continuing through later rounds.

#### Scenario: Knockout placeholder is unresolved
- **WHEN** a knockout participant depends on unfinished group results
- **THEN** the dataset MUST represent the slot rule or placeholder without requiring a concrete team

#### Scenario: Knockout participant is resolved
- **WHEN** qualification can be determined from real results and predictions
- **THEN** the matching knockout slot MUST be resolvable to the projected team

