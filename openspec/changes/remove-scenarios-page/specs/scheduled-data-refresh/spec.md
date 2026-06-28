## ADDED Requirements

### Requirement: Refresh avoids scenario indexing
The system SHALL NOT generate or index scenario vectors as part of the scheduled data refresh workflow.

#### Scenario: Generated data changes
- **WHEN** the result or stat refresh workflow changes the generated tournament dataset
- **THEN** the workflow MUST validate, build, commit, and deploy the refreshed static app without running scenario vector indexing

#### Scenario: Scenario indexing configuration exists
- **WHEN** scenario indexing environment variables or secrets remain configured in deployment settings
- **THEN** the scheduled refresh workflow MUST NOT depend on them to complete
