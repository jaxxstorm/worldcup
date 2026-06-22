## Context

The browser app already captures a pre-edit prediction snapshot and compares it with the recalculated standings and bracket projection after a completed prediction edit. Standings rows currently use one row-level change result for rank, points, and goal difference, so a prediction that only changes points or goals can mark an otherwise unmoved table row as `Changed`.

Users need a clearer distinction between value changes and table movement: points and goal-related values should show their own changes, while whole-row/table highlighting should be reserved for movement or other status changes that affect the standings table meaningfully. This is a UI comparison change only; prediction calculations, source tournament data, immutable real results, and session storage semantics stay the same.

## Goals / Non-Goals

**Goals:**

- Stop whole-row standings "Changed" badges for predictions that only alter points or goal-related statistics.
- Surface points and goal-related differences on the affected values with previous-value tooltips.
- Preserve row-level table highlighting when a team moves rank or otherwise changes table-relevant standing status.
- Preserve existing bracket-change highlighting for changed projected knockout content.

**Non-Goals:**

- Changing standings calculation, tie-breakers, qualification rules, or generated tournament data.
- Persisting change history beyond the existing latest-edit snapshot.
- Adding server state, runtime network calls, or static-hosting changes.
- Changing authoritative completed result handling or editable prediction validation.

## Decisions

1. Split standings comparison into row-level movement and stat-level value changes.

   Row-level change detection should compare rank and any displayed status that changes the table meaning, while points and goal-related differences should be exposed as separate value changes for the rendered cells. This keeps the "Changed" row treatment aligned with table movement and avoids implying that the overall table order changed when only a score total changed.

   Alternative considered: keep row-level highlighting for any displayed value change and improve tooltip wording. Rejected because the visual emphasis remains noisy in groups where many rows collect points or goal-difference changes without moving.

2. Keep the comparison UI-only and snapshot-based.

   The current snapshot approach already captures pre-edit standings and bracket projection before mutating predictions. The implementation should adjust what the render layer does with that snapshot rather than changing the prediction engine or storing derived state.

   Alternative considered: emit richer change metadata from the standings engine. Rejected because the engine should remain deterministic and presentation-agnostic.

3. Add focused tests around unchanged-rank stat changes and true table movement.

   Tests should use deterministic fixtures or constructed snapshots so scheduled data refreshes cannot make expectations drift. They should assert that stat-only changes produce value indicators but no row-level standings change, and that rank changes still produce row-level table highlighting.

## Risks / Trade-offs

- Stat-level indicators could be less obvious than row highlighting -> Keep the existing accessible badge/tooltip pattern on changed values and ensure keyboard focus exposes previous values.
- Some users may expect any prediction impact to color the whole row -> The table will still expose the changed points/goals, while row highlighting is reserved for actual table movement.
- Third-place and qualification surfaces have related highlight behavior -> Keep qualification/bracket-specific highlighting intact unless the main standings table row itself changes rank or status.

## Migration Plan

- No data migration is required.
- Deploy with the normal static build.
- Roll back by restoring the previous standings change comparison/rendering behavior.

## Open Questions

- None.
