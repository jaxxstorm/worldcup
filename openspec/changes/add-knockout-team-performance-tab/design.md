## Context

The app already has a Performance view with team rankings and a fixture-level analysis based on rank-adjusted success scores. The current fixture performance engine only emits entries for group-stage fixtures, so knockout results and predictions are excluded even when both teams and scores are known.

This change expands the existing calculation and UI instead of adding new data sources. Completed authoritative results remain immutable, unresolved matches use active predictions only when complete, and all output remains derived from bundled tournament data in the browser.

## Goals / Non-Goals

**Goals:**

- Include knockout fixtures in opponent-relative performance when both sides are resolved and ranked.
- Add a distinct Performance sub-tab for all-team performance across group and knockout fixtures.
- Preserve the existing fixture-level group-stage analysis so users can still inspect group-only performance.
- Keep recalculation deterministic and client-side when predictions change.
- Avoid JSON schema or runtime API changes.

**Non-Goals:**

- Changing the FIFA-rank seed rating formula or Elo-style success score formula.
- Inferring knockout participants without using the existing projection model and active predictions.
- Adding external data fetching, server storage, or account-backed persistence.
- Replacing authoritative completed results with user predictions.

## Decisions

- Add a calculation scope for fixture performance rather than replacing the existing group-only behavior. This keeps current UI behavior stable while allowing an all-fixtures tab to include knockout matches.
- Represent knockout performance entries with stage and optional group metadata. Group-stage rows keep their group value; knockout rows can render the stage or round instead of forcing them into a group.
- Resolve knockout entries only when the fixture has concrete team IDs from authoritative data or from the current projected bracket state, and only when a final score or complete active prediction exists. This avoids scoring unresolved placeholders.
- Keep authoritative and predicted scores separate. The engine should prefer fixture results when present and use predictions only for unresolved fixtures so immutable match facts are not overwritten.
- Use existing bundled fixtures, teams, rankings, and predictions. No JSON schema changes are needed because the current fixture model already represents stages, teams, results, and predictions.

## Risks / Trade-offs

- Knockout slots may be unresolved until enough group predictions exist -> show only rows that have known ranked teams and complete scores, with an empty state when none qualify.
- All-fixtures totals can mix real results and predictions -> expose final and predicted counts so users can see what contributes to each team total.
- Existing tests may depend on group-only assumptions -> add behavior-fixture tests with stable synthetic knockout data instead of relying on live generated tournament data.
- More sub-tabs may add UI density -> keep labels short and reuse the current Performance sub-tab pattern.
