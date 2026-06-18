## MODIFIED Requirements

### Requirement: Fixtures and locations are visible
The system SHALL display World Cup fixtures in chronological kickoff order with team names, flags, match status, kickoff details when available, venue, host city, and location.

#### Scenario: Fixture list renders
- **WHEN** a user views fixtures
- **THEN** each fixture MUST show its teams or unresolved placeholders, status, venue, and host city

#### Scenario: Match has a completed result
- **WHEN** a fixture has an authoritative result
- **THEN** the UI MUST show the real score as fixed rather than as an editable prediction

#### Scenario: Fixtures are chronologically ordered
- **WHEN** a user views the fixture list
- **THEN** fixtures MUST be ordered by scheduled kickoff date/time from earliest to latest

#### Scenario: Same-time fixtures have stable order
- **WHEN** multiple fixtures have the same scheduled kickoff date/time
- **THEN** those fixtures MUST be ordered by match number in ascending order
