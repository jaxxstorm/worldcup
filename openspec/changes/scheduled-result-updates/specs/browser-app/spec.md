## MODIFIED Requirements

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
