## Why

Scenario answers are now logically richer, but free-form questions still depend on how much deterministic context the browser sends in one request. We need a refresh-time scenario knowledge layer so users can ask broader questions about qualification, jeopardy, third-place jumps, and future round-of-32 implications without relying on the model to infer missing permutations.

## What Changes

- Generate expanded scenario documents for every team after result/stat refreshes, including qualification routes, miss-out routes, third-place chasers, and teams that can jump into the third-place table from other positions.
- Store those generated scenario documents in Cloudflare Vectorize so the scenario question endpoint can retrieve relevant facts by team, fixture, route type, and user question.
- Keep deterministic scenario calculations as the source of truth; Vectorize is only a retrieval layer over generated facts.
- Add snapshot metadata so each vectorized document is tied to the current generated tournament data and stale scenarios can be ignored.
- Update the scenario AI endpoint to combine exact selected-team context with retrieved scenario documents before asking Workers AI to explain the answer.
- Update result/stat refresh behavior so changed generated data can trigger scenario document generation and Vectorize indexing.
- Preserve static hosting for the core browser app; the Vectorize path only enhances server-side scenario question answers.

## Capabilities

### New Capabilities
- `scenario-vector-index`: Covers refresh-time generation, indexing, and retrieval of scenario documents in Cloudflare Vectorize.

### Modified Capabilities
- `prediction-engine`: Expand deterministic scenario analysis to calculate broader qualification, jeopardy, and third-place jump permutations.
- `scheduled-data-refresh`: Run scenario indexing after generated data changes during result/stat refresh workflows.
- `browser-app`: Enhance scenario question answers with retrieved deterministic scenario documents while keeping static scenario panels usable without Vectorize.

## Impact

- Adds scenario document generation code under `src/engine/` or `src/scenarios/`.
- Adds a server-side Vectorize integration under `functions/api/` and/or a refresh script runnable from the update-results workflow.
- Updates `wrangler.toml` with a Vectorize binding and embedding model configuration.
- May add npm scripts for generating/indexing scenario documents after `npm run update-results` and `npm run update-stats`.
- Adds tests for expanded scenario permutations, stale snapshot filtering, retrieval fallback behavior, and refresh integration.
- Does not alter authoritative fixture/result schema or allow predictions to overwrite completed results.
