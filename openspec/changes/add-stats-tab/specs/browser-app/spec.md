## ADDED Requirements

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
