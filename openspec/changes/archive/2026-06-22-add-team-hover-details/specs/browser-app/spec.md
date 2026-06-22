## ADDED Requirements

### Requirement: Team hover details
The system SHALL show static team context in a popover only when a user hovers or focuses a rendered team identity.

#### Scenario: Team details appear on hover
- **WHEN** a user hovers or focuses a team name or flag rendered in fixtures, standings, bracket, stats, or performance views
- **THEN** the app MUST show a popover for that team containing its FIFA ranking when available and up to five latest completed results from the bundled tournament dataset

#### Scenario: Team details stay hidden otherwise
- **WHEN** a team identity is rendered but is not hovered or focused
- **THEN** the app MUST NOT show the team details popover

#### Scenario: Recent results use authoritative completed fixtures
- **WHEN** a team details popover lists previous results
- **THEN** those results MUST be derived from immutable completed fixture results and MUST NOT include active user predictions

#### Scenario: Team details tolerate missing data
- **WHEN** a team has no FIFA ranking or no completed fixture results in the dataset
- **THEN** the popover MUST still render without failing and MUST show an appropriate unavailable or empty state

#### Scenario: Static hosting remains compatible
- **WHEN** team details are displayed
- **THEN** the app MUST use bundled static data and MUST NOT require server-side routes, accounts, or runtime network fetches
