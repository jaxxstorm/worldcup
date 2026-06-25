## ADDED Requirements

### Requirement: Scenario answers use retrieved deterministic context
The system SHALL augment scenario question answers with retrieved deterministic scenario documents when the server-side Vectorize integration is available.

#### Scenario: User asks broad scenario question
- **WHEN** a user asks a scenario question that depends on teams or fixtures beyond the selected team's compact browser context
- **THEN** the server-side endpoint MUST retrieve relevant scenario documents and include them as supplemental context for the AI explainer

#### Scenario: Scenario answer remains grounded
- **WHEN** the endpoint sends retrieved scenario documents to the AI explainer
- **THEN** the prompt MUST identify deterministic generated facts separately from the user question and MUST prohibit unsupported route invention

#### Scenario: Static scenario panels remain usable
- **WHEN** Vectorize retrieval fails or is unavailable
- **THEN** the browser MUST keep deterministic scenario panels and the non-destructive question error or fallback answer behavior available
