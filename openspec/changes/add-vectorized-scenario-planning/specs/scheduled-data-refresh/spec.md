## ADDED Requirements

### Requirement: Scenario vector refresh
The system SHALL generate and index scenario documents after result refresh or stat refresh runs change the generated tournament dataset.

#### Scenario: Result refresh changes scenario inputs
- **WHEN** a result refresh run changes `src/data/tournament.generated.json`
- **THEN** the refresh process MUST run scenario document generation and attempt Vectorize indexing for the new snapshot before deployment completes

#### Scenario: Stat refresh changes scenario inputs
- **WHEN** a stat refresh run changes `src/data/tournament.generated.json`
- **THEN** the refresh process MUST run scenario document generation and attempt Vectorize indexing for the new snapshot before deployment completes

#### Scenario: Refresh has no generated data changes
- **WHEN** result refresh and stat refresh runs complete without changing the generated tournament dataset
- **THEN** the refresh process MUST avoid rewriting scenario vectors or generated scenario artifacts solely to update timestamps

#### Scenario: Vector indexing is not configured
- **WHEN** the refresh process runs without Vectorize credentials or required bindings
- **THEN** it MUST report scenario indexing as skipped while preserving the generated data no-change behavior
