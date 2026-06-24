## ADDED Requirements

### Requirement: Team group-stage scenario analysis
The system SHALL calculate deterministic team-centered group-stage scenario summaries from normalized tournament data, authoritative results, and the active prediction model.

#### Scenario: Selected team has remaining group fixture
- **WHEN** a selected team has at least one unresolved group-stage fixture
- **THEN** the scenario analysis MUST identify how win, draw, and loss outcomes for the selected team's next relevant fixture affect qualification status and projected round-of-32 assignment

#### Scenario: Selected team depends on other results
- **WHEN** another fixture or third-place table outcome can change the selected team's qualification status or round-of-32 assignment
- **THEN** the scenario analysis MUST identify the dependent fixture, affected teams, and the condition that changes the selected team's path

#### Scenario: Same-group branches include other group games
- **WHEN** the selected team's own group has unresolved fixtures that do not involve the selected team
- **THEN** the scenario context MUST include bounded combinations of the selected team's active or possible result plus those other group-game results, including the resulting qualification status and round-of-32 effect

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
- **THEN** the context MUST include the selected team's current state, miss-out summary, user-facing summary, answer brief, pressure summary, chasing-team examples, group outcome combinations, outcomes, dependencies, margin notes, possible opponents, and fixed results without including the full tournament dataset

#### Scenario: Context reflects active predictions
- **WHEN** active predictions affect the selected team's scenario
- **THEN** the context sent for AI explanation MUST reflect those active predictions

#### Scenario: Context preserves active-prediction group dependencies
- **WHEN** the selected team's own remaining fixture has an active prediction and another fixture in the selected team's group remains unresolved
- **THEN** the context sent for AI explanation MUST include the active-prediction baseline combined with bounded outcomes for the other group fixture

#### Scenario: AI answer remains grounded
- **WHEN** the server-side explainer receives a scenario question
- **THEN** it MUST instruct the model to answer only from supplied context and to say when the context is insufficient

#### Scenario: AI answer determines logical scenarios
- **WHEN** the user asks how a team can qualify, miss out, or reach danger
- **THEN** the server-side explainer MUST instruct the model to determine all logical scenarios supported by the supplied deterministic context rather than quote raw context or show reasoning

#### Scenario: AI answers chasing-team follow-ups
- **WHEN** the user asks about another team winning or another group producing a large result
- **THEN** the supplied context MUST include enough chasing-team detail for the explainer to name the result, margin, third-place team moved above, and remaining buffer impact

#### Scenario: AI answers who can pass the selected team
- **WHEN** the user asks which teams can pass or overtake the selected team
- **THEN** the supplied context and prompt MUST lead with the named passing teams and the specific fixture result or margin that puts each team above the selected team

#### Scenario: AI answers miss-out questions with named chasers
- **WHEN** the user asks what needs to happen for the selected team to miss out
- **THEN** the supplied context and prompt MUST NOT stop at generic buffer language and MUST include named third-place teams that can pass the selected team when those teams are present in the deterministic context

#### Scenario: AI reasoning is not rendered
- **WHEN** a model response includes role labels, analysis text, scratchpad text, or final-answer markers
- **THEN** the server-side explainer MUST return only the final fan-facing answer

#### Scenario: AI avoids vague tie-breaker caveats
- **WHEN** the supplied context does not identify a specific tie-breaker comparison between named teams
- **THEN** the server-side explainer MUST NOT include generic caveats such as "if tie-breakers go against them"

#### Scenario: AI distinguishes projection from certainty
- **WHEN** the supplied scenario context contains a third-place qualification route
- **THEN** the server-side explainer MUST instruct the model to describe it as a current projection or dependency unless the context explicitly marks it guaranteed

#### Scenario: AI model favors reasoning quality
- **WHEN** the server-side explainer calls Workers AI
- **THEN** it MUST use a reasoning-capable default model and allow an environment-provided model override

#### Scenario: AI calls use Cloudflare Gateway
- **WHEN** the server-side explainer calls Workers AI
- **THEN** it MUST route the request through Cloudflare AI Gateway using the configured gateway id and keep system instructions separate from the user question/context in a chat messages payload
