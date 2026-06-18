## ADDED Requirements

### Requirement: Scheduled result refresh
The system SHALL run an automated result refresh workflow every four hours and allow manual dispatch.

#### Scenario: Scheduled workflow starts
- **WHEN** the four-hour cron interval elapses
- **THEN** the workflow MUST run the result refresh process against the configured external source

#### Scenario: Manual workflow starts
- **WHEN** a maintainer triggers the workflow manually
- **THEN** the workflow MUST run the same result refresh process used by the scheduled job

### Requirement: External result feed merge
The system SHALL merge externally sourced completed results into the generated tournament dataset without requiring a runtime server.

#### Scenario: New completed result is imported
- **WHEN** the external source includes a completed result for a scheduled fixture
- **THEN** the generated dataset MUST mark that fixture completed, store the score, and retain source metadata

#### Scenario: No result source is configured
- **WHEN** the scheduled workflow runs without a configured result source URL
- **THEN** the workflow MUST exit without changing tournament data and MUST report that refresh was skipped

#### Scenario: Result feed has no changes
- **WHEN** the external source contains no new results
- **THEN** the workflow MUST avoid creating a repository commit

### Requirement: Result refresh validation
The system SHALL validate refreshed tournament data before committing or deploying it.

#### Scenario: Refreshed data is valid
- **WHEN** new results are merged into the generated dataset
- **THEN** the workflow MUST validate the dataset, run tests, and build the static app before deployment

#### Scenario: Incoming result conflicts with history
- **WHEN** an incoming result differs from an already completed fixture result
- **THEN** the refresh process MUST fail without changing the generated dataset

### Requirement: Refresh deployment
The system SHALL deploy the refreshed static app after committing changed result data.

#### Scenario: Data changed
- **WHEN** the refresh workflow commits a generated data update
- **THEN** the workflow MUST deploy the rebuilt static site to Cloudflare Pages

#### Scenario: Deployment artifact is invalid
- **WHEN** the built artifact references the TypeScript source entrypoint instead of compiled assets
- **THEN** the workflow MUST fail before deploying
