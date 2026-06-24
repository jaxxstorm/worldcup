## 1. Scenario Engine

- [x] 1.1 Add a scenario analysis module that accepts tournament data, active predictions, and a selected team id
- [x] 1.2 Reuse existing standings, third-place ranking, and bracket projection helpers to derive qualification status and round-of-32 slot outcomes
- [x] 1.3 Evaluate bounded win/draw/loss outcome categories for the selected team's unresolved group fixtures
- [x] 1.4 Identify dependent group fixtures, third-place table dependencies, and affected teams that can change the selected team's path
- [x] 1.5 Include possible round-of-32 opponents with the dependency that causes each matchup
- [x] 1.6 Add deterministic fallback text for cases that depend on goal difference, fair play, ranking, or other tie-breakers beyond simple win/draw/loss outcomes

## 2. Scenario UI

- [x] 2.1 Add Scenarios to the top-level tab navigation and view routing
- [x] 2.2 Add a team selector with flags and stable team ids
- [x] 2.3 Render current position, qualification paths, dependency summary, and possible round-of-32 outcomes for the selected team
- [x] 2.4 Recalculate displayed scenario text whenever active predictions change
- [x] 2.5 Describe authoritative completed results as fixed and avoid editable controls in the Scenarios tab
- [x] 2.6 Add responsive styles for the Scenarios tab that keep text readable on mobile and desktop

## 3. Refresh Workflow

- [x] 3.1 Verify the scheduled refresh workflow treats result refresh and stat refresh changes to `src/data/tournament.generated.json` as deployment-triggering changes
- [x] 3.2 Update the workflow if needed so either refresh run triggers tests, typecheck, static build, generated-data commit, and Cloudflare Pages deployment
- [x] 3.3 Preserve the no-change path so refresh runs without generated data changes do not create commits or deployments

## 4. Tests and Verification

- [x] 4.1 Add scenario engine tests with local fixture data for direct qualification, third-place qualification, elimination, dependencies, and possible opponents
- [x] 4.2 Add tests proving repeated scenario analysis with the same inputs returns the same output
- [x] 4.3 Add UI tests or render assertions for Scenarios tab navigation, team selection, active prediction recalculation, and completed-result copy
- [x] 4.4 Add workflow or script coverage for result-refresh and stat-refresh changed-data behavior where practical
- [x] 4.5 Run `npm test`, `npm run typecheck`, and `npm run build`

## 5. AI Scenario Questions

- [x] 5.1 Add compact scenario context serialization for the selected team and active predictions
- [x] 5.2 Add a Cloudflare Pages Function endpoint for scenario questions using a Workers AI `AI` binding
- [x] 5.3 Configure the Workers AI binding in `wrangler.toml`
- [x] 5.4 Add a Scenarios tab question box with loading, answer, and error states
- [x] 5.5 Minimize static explanatory copy now that users can ask natural-language questions
- [x] 5.6 Add tests for compact context, endpoint request handling, UI wiring, and graceful failure
- [x] 5.7 Run `npm test`, `npm run typecheck`, and `npm run build`
- [x] 5.8 Use a reasoning-capable default Workers AI model with an environment override
- [x] 5.9 Update AI prompt/spec language so deterministic answer briefs and pressure summaries remain the source of truth
- [x] 5.10 Include selected-result plus same-group fixture combinations in compact AI context
- [x] 5.11 Include all named passing-team pressure examples and prompt the explainer to answer overtake follow-ups from them
- [x] 5.12 Add miss-out-specific context so miss-out answers include named third-place chasers instead of generic buffer text
