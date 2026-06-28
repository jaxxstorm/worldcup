## Context

The app currently exposes Scenarios as a first-class browser tab, with client-side scenario analysis, a scenario question form, serverless API handlers for AI answers and Vectorize indexing, a refresh workflow step that indexes scenario documents, and tests/documentation around that flow. The group stage is nearly complete, so this workflow is no longer core to the product.

The remaining core product is still a static predictor: fixtures, immutable completed results, editable unresolved predictions, standings, bracket projections, stats, and performance analysis. Removing Scenarios must not change tournament data shape, result refresh behavior, prediction persistence, or static-hosting compatibility.

## Goals / Non-Goals

**Goals:**

- Remove the Scenarios tab and any UI path that renders the scenario page.
- Remove scenario question/network submission from the browser bundle.
- Remove scenario Vectorize indexing from scheduled refresh and package scripts.
- Remove or retire scenario-specific tests and documentation that would keep the feature as supported behavior.
- Keep deterministic tournament projection, standings, bracket, stats, performance, and prediction sharing intact.

**Non-Goals:**

- Change tournament JSON schema, fixtures, results, teams, venues, or stat leaderboard data.
- Change how immutable completed results and mutable user predictions interact.
- Rework bracket or standings calculations except where unused scenario-only code becomes removable.
- Add a replacement scenario experience.

## Decisions

1. Remove the user-facing feature at the navigation boundary.
   - The view union, tab button, view parser, and render switch should no longer include `scenarios`.
   - Alternative considered: leave a hidden route or disabled tab. Rejected because the request is to remove the ability to use it.

2. Remove scenario question and Vectorize plumbing as supported runtime surface.
   - Delete the API handlers, Vectorize helper, indexing script, workflow step, docs, and package script that exist only to answer or index scenario questions.
   - Alternative considered: keep the backend/API for future reuse. Rejected because it creates ongoing secrets, workflow, and support surface for a removed product feature.

3. Remove scenario UI tests and replace them with absence/regression assertions where useful.
   - Tests should assert that the nav no longer exposes Scenarios and the scheduled workflow no longer invokes scenario indexing.
   - Alternative considered: keep scenario analysis unit tests. Rejected for implementation if the engine becomes unreachable and is deleted; tests should not keep removed behavior alive.

## Risks / Trade-offs

- [Risk] Removing scenario modules can uncover imports used by indexing or tests only. -> Mitigation: run typecheck/build/tests after deletion and remove any now-unused references together.
- [Risk] Active OpenSpec changes that introduced Scenarios remain in the tree. -> Mitigation: this change documents the product reversal and updates main behavior; follow-up archival can retire superseded change artifacts after implementation is verified.
- [Risk] The current merge conflict in generated tournament data can block full validation. -> Mitigation: avoid editing generated data for this change and report any validation commands blocked by the unresolved conflict.
