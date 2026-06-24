## Why

Users can currently change predictions and inspect standings or bracket projections, but the app does not explain the conditional path for a specific team. A dedicated scenarios page would make qualification stakes understandable by translating group-stage permutations into readable "what this team needs" and "who they might face next" guidance.

## What Changes

- Add a distinct Scenarios tab to the static browser app.
- Let users choose a team and view a text-first group-stage scenario summary.
- Add a scenario question box that lets users ask natural-language questions such as "how could Scotland not qualify?"
- Explain how the selected team can qualify, fail to qualify, or land in a specific round-of-32 slot based on its own remaining fixtures and dependent results elsewhere in the group or third-place table.
- Show likely round-of-32 matchup possibilities when other dependent results affect the opponent or slot assignment.
- Use a Cloudflare Pages Function with a reasoning-capable Workers AI model to turn deterministic scenario context into concise answers without exposing provider credentials in browser code.
- Keep AI answers grounded in precomputed answer briefs and pressure summaries, so the model narrates direct, projected third-place, and elimination routes rather than calculating them.
- Keep authoritative completed results immutable and treat user predictions as the active scenario baseline for unresolved fixtures.
- Ensure scenario output is refreshed in the deployed static app after result refresh runs and stat refresh runs that change the generated dataset.
- Keep all scenario calculations deterministic and browser-local so static hosting remains sufficient.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `browser-app`: Add a Scenarios tab with team selection and readable qualification/matchup explanations.
- `browser-app`: Add a natural-language scenario question box that posts compact scenario context to a server-side explainer endpoint.
- `prediction-engine`: Add deterministic team scenario analysis derived from authoritative results, active predictions, remaining group fixtures, third-place qualification, and knockout slot assignment rules.
- `scheduled-data-refresh`: Ensure refreshed generated data from result or stat runs rebuilds and deploys the static app so scenarios reflect the latest bundled data.

## Impact

- Affects the main tab navigation and rendering in `src/main.ts`.
- Adds scenario calculation helpers under `src/engine/`.
- Adds a Cloudflare Pages Function under `functions/api/`, a Workers AI binding named `AI`, and a model override path for testing newer reasoning models.
- May update the scheduled refresh workflow so both result and stat data changes trigger validation, rebuild, commit, and deployment.
- Adds tests for scenario analysis, dependency explanation, and Scenarios tab rendering.
- Adds a server-side Pages Function route for AI-assisted explanation, while deterministic scenario calculations remain available without AI.
