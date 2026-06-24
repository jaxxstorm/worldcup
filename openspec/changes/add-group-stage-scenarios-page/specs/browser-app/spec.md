## ADDED Requirements

### Requirement: Scenarios tab
The system SHALL provide a Scenarios tab that lets users choose a team and view readable group-stage qualification and round-of-32 pathway explanations.

#### Scenario: User opens scenarios tab
- **WHEN** a user selects the Scenarios tab
- **THEN** the app MUST show a team selector and scenario content for the selected team without requiring a server-side route

#### Scenario: User selects a team
- **WHEN** a user chooses a team from the Scenarios tab selector
- **THEN** the app MUST display that team's current group position, qualification status, dependency summary, and possible round-of-32 outcomes

#### Scenario: Scenario content uses active predictions
- **WHEN** the active prediction model changes and the selected team's qualification path is affected
- **THEN** the Scenarios tab MUST recalculate its displayed text from authoritative results plus active predictions without a page reload

#### Scenario: Completed results stay fixed
- **WHEN** a selected team's scenario includes an authoritative completed fixture
- **THEN** the app MUST describe that fixture as fixed and MUST NOT present it as a mutable condition

#### Scenario: Scenario tab on static hosting
- **WHEN** the app is built and hosted as static assets
- **THEN** Scenarios tab navigation and team selection MUST work without runtime server storage or dynamic route handling

#### Scenario: Generated data refresh updates scenarios
- **WHEN** a result refresh run or stat refresh run changes the generated tournament dataset before a static build
- **THEN** the built Scenarios tab MUST use the refreshed generated data for qualification status, dependencies, and possible round-of-32 outcomes

#### Scenario: User asks scenario question
- **WHEN** a user enters a natural-language scenario question for the selected team
- **THEN** the app MUST send the question with compact deterministic scenario context to a server-side endpoint and display the returned answer

#### Scenario: Scenario question endpoint unavailable
- **WHEN** the server-side scenario question endpoint fails or is unavailable
- **THEN** the app MUST keep deterministic scenario content visible and show a non-destructive error state for the question answer

#### Scenario: Scenario prompts stay compact
- **WHEN** the app submits a scenario question
- **THEN** it MUST send only the selected team's relevant scenario context rather than the full tournament dataset

#### Scenario: Scenario answer is presented as explanation
- **WHEN** the server-side endpoint returns an AI scenario answer
- **THEN** the app MUST present it as explanatory text while leaving the deterministic scenario panels visible as the source context

#### Scenario: Scenario answer includes visual implications
- **WHEN** a user asks a scenario question and the deterministic context includes qualification paths, jeopardy routes, chasers, or finish paths
- **THEN** the app MUST render a compact visual summary of those deterministic implications alongside the answer so users can quickly scan the route, chasing teams, and likely round-of-32 outcomes

#### Scenario: Qualification questions lead with qualification routes
- **WHEN** a user asks how the selected team qualifies
- **THEN** the app MUST render qualification route chains from deterministic qualification paths before any miss-out or chasing-pack visualization

#### Scenario: Qualification questions show shortest path
- **WHEN** deterministic qualification paths include one or more qualifying branches
- **THEN** the app MUST identify the shortest qualification path and render it before secondary qualifying branches
