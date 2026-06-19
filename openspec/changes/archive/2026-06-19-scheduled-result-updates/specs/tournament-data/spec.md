## MODIFIED Requirements

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
