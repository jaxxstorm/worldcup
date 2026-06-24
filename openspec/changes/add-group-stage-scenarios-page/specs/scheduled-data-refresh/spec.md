## ADDED Requirements

### Requirement: Scenario refresh deployment
The system SHALL rebuild and deploy the static app after result refresh or stat refresh runs change the generated tournament dataset so scenario explanations reflect the latest bundled data.

#### Scenario: Result refresh changes scenario inputs
- **WHEN** a result refresh run changes `src/data/tournament.generated.json`
- **THEN** the workflow MUST validate the changed data, build the static app, commit the generated data update, and deploy the rebuilt static site

#### Scenario: Stat refresh changes generated data
- **WHEN** a stat refresh run changes `src/data/tournament.generated.json`
- **THEN** the workflow MUST validate the changed data, build the static app, commit the generated data update, and deploy the rebuilt static site

#### Scenario: Refresh run has no generated data changes
- **WHEN** result refresh and stat refresh runs complete without changing `src/data/tournament.generated.json`
- **THEN** the workflow MUST avoid creating a repository commit or deployment
