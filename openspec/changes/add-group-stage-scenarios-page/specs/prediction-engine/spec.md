## ADDED Requirements

### Requirement: Team group-stage scenario analysis
The system SHALL calculate deterministic team-centered group-stage scenario summaries from normalized tournament data, authoritative results, and the active prediction model.

#### Scenario: Selected team has remaining group fixture
- **WHEN** a selected team has at least one unresolved group-stage fixture
- **THEN** the scenario analysis MUST identify how win, draw, and loss outcomes for the selected team's next relevant fixture affect qualification status and projected round-of-32 assignment

#### Scenario: Selected team depends on other results
- **WHEN** another fixture or third-place table outcome can change the selected team's qualification status or round-of-32 assignment
- **THEN** the scenario analysis MUST identify the dependent fixture, affected teams, and the condition that changes the selected team's path

#### Scenario: Direct qualification is available
- **WHEN** a selected team can finish in a group position that qualifies directly for the round of 32
- **THEN** the scenario analysis MUST include the group finish and projected round-of-32 slot associated with that direct qualification path

#### Scenario: Third-place qualification is available
- **WHEN** a selected team can qualify through the best third-place table
- **THEN** the scenario analysis MUST include the third-place dependency and projected round-of-32 assignment when the qualifying third-place group set can be resolved

#### Scenario: Elimination path is available
- **WHEN** a selected team can fail to qualify from the current unresolved group-stage state
- **THEN** the scenario analysis MUST include the condition that leaves the team eliminated

#### Scenario: Possible opponent depends on other outcomes
- **WHEN** the selected team's projected round-of-32 opponent changes based on other unresolved results
- **THEN** the scenario analysis MUST include each reasonable opponent possibility with the dependency that causes it

#### Scenario: Same inputs produce same scenarios
- **WHEN** the same tournament data, selected team, and prediction model are analyzed repeatedly
- **THEN** the scenario analysis MUST return the same qualification paths, dependencies, and matchup possibilities each time

### Requirement: AI scenario context
The system SHALL expose compact selected-team scenario context suitable for server-side AI explanation without treating AI output as source-of-truth calculation.

#### Scenario: Context is compact
- **WHEN** the app prepares context for a scenario question
- **THEN** the context MUST include the selected team's current state, answer brief, pressure summary, outcomes, dependencies, margin notes, possible opponents, and fixed results without including the full tournament dataset

#### Scenario: Context reflects active predictions
- **WHEN** active predictions affect the selected team's scenario
- **THEN** the context sent for AI explanation MUST reflect those active predictions

#### Scenario: AI answer remains grounded
- **WHEN** the server-side explainer receives a scenario question
- **THEN** it MUST instruct the model to answer only from supplied context and to say when the context is insufficient

#### Scenario: AI distinguishes projection from certainty
- **WHEN** the supplied scenario context contains a third-place qualification route
- **THEN** the server-side explainer MUST instruct the model to describe it as a current projection or dependency unless the context explicitly marks it guaranteed

#### Scenario: AI model favors reasoning quality
- **WHEN** the server-side explainer calls Workers AI
- **THEN** it MUST use a reasoning-capable default model and allow an environment-provided model override
