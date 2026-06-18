## MODIFIED Requirements

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
