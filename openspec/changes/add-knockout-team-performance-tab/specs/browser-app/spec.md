## MODIFIED Requirements

### Requirement: Performance view shows rank-adjusted fixture performances
The system SHALL display individual fixture performances in the Performance view using an Elo-style success score derived from FIFA rankings, authoritative results, and active predictions, with separate analysis tabs for team ranking, group fixture performance, and all-team opponent-relative performance.

#### Scenario: User views fixture performances
- **WHEN** a user opens the group fixture Performance sub-tab
- **THEN** the app MUST show the fixture performance formula and a result list with team, opponent, fixture, scoreline, result type, FIFA ranking context, seed ratings, expected result, actual result, success score, and whether the score comes from a final result or active prediction

#### Scenario: Fixture tab summarizes teams first
- **WHEN** a user opens the group fixture Performance sub-tab
- **THEN** the app MUST show a team summary table before the individual result list with games played, actual result total, expected result total, success score total, and final/predicted row counts

#### Scenario: User switches performance analysis type
- **WHEN** a user opens the Performance view
- **THEN** the app MUST provide sub-tabs for team-level performance, group fixture performance, and all-team performance so each analysis can be viewed without scrolling through the other table

#### Scenario: All-team tab includes knockout performances
- **WHEN** a user opens the all-team Performance sub-tab
- **THEN** the app MUST show opponent-relative team summaries and result rows from all resolved or completely predicted fixtures, including knockout fixtures with resolved ranked teams

#### Scenario: Knockout predictions update all-team performance
- **WHEN** a user changes a complete knockout fixture prediction that has resolved ranked teams
- **THEN** the all-team Performance sub-tab MUST update team summaries and result rows without a page reload

#### Scenario: Authoritative knockout results are immutable
- **WHEN** a knockout fixture has an authoritative completed result
- **THEN** the all-team Performance sub-tab MUST show the fixed result as final and MUST NOT replace it with active prediction data

#### Scenario: Formula explanation is readable
- **WHEN** the fixture performance formula is displayed
- **THEN** the app MUST explain how FIFA ranking becomes seed rating, how expected result is derived from the Elo curve, and how success score compares actual result with expected result in user-facing language

#### Scenario: Prediction changes fixture performance table
- **WHEN** a user changes a complete group-stage prediction
- **THEN** the group fixture performance table MUST update without a page reload

#### Scenario: Static hosting remains compatible
- **WHEN** the app is built for static hosting
- **THEN** fixture and all-team performance entries MUST be renderable from bundled tournament data and deterministic browser calculations without runtime server access
