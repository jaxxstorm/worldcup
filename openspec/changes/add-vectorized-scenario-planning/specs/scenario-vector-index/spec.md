## ADDED Requirements

### Requirement: Scenario documents are generated for vector retrieval
The system SHALL generate deterministic scenario documents that summarize team qualification routes, miss-out routes, third-place chasers, third-place jump candidates, finish paths, and rule notes for the current generated tournament dataset.

#### Scenario: Team scenario documents exist
- **WHEN** scenario documents are generated for the current tournament dataset
- **THEN** each team MUST have documents covering its current summary, qualification routes, jeopardy or miss-out routes where applicable, and likely round-of-32 finish paths where resolvable

#### Scenario: Third-place jump candidates are included
- **WHEN** an unresolved group fixture outcome can move a team into third place
- **THEN** the generated documents MUST include that team as a third-place jump candidate even if the team is not currently third in its group

#### Scenario: Documents use deterministic source facts
- **WHEN** a generated scenario document describes a route or chaser
- **THEN** it MUST be derived from deterministic standings, bounded scoreline checks, and bracket slot resolution rather than AI output

### Requirement: Scenario documents are indexed by snapshot
The system SHALL store scenario documents in Cloudflare Vectorize with metadata that identifies the generated-data snapshot, document kind, team id, group id, and related fixture where available.

#### Scenario: Document metadata identifies snapshot
- **WHEN** a scenario document is prepared for Vectorize
- **THEN** its vector id and metadata MUST include the current `snapshotId`

#### Scenario: Vector query filters stale documents
- **WHEN** the scenario question endpoint queries Vectorize
- **THEN** it MUST filter or discard results whose `snapshotId` differs from the current generated dataset snapshot

#### Scenario: Vectorize unavailable
- **WHEN** the Vectorize binding or embedding model is unavailable
- **THEN** the scenario question endpoint MUST continue answering from exact supplied deterministic context or its deterministic fallback without failing the Scenarios tab

### Requirement: Scenario vector retrieval augments AI answers
The system SHALL retrieve relevant scenario documents for natural-language scenario questions and pass them to the AI explainer as supplemental deterministic facts.

#### Scenario: Team-specific question
- **WHEN** a user asks a question for a selected team
- **THEN** the endpoint MUST prioritize documents for that selected team and documents related to teams, fixtures, or routes mentioned in the question

#### Scenario: Conflict between exact context and retrieved context
- **WHEN** exact request context and retrieved scenario documents disagree
- **THEN** the AI prompt MUST instruct the model to prefer the exact request context and use retrieved documents only as supplemental context

#### Scenario: Retrieved context is compact
- **WHEN** retrieved scenario documents are added to the prompt
- **THEN** the endpoint MUST cap the number or combined text size of retrieved documents so the prompt remains compact
