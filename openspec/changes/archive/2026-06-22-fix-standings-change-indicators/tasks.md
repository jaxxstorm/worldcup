## 1. Change Model

- [x] 1.1 Split standings change detection into row-level rank movement and stat-level points/goal value changes.
- [x] 1.2 Preserve previous-value summaries for changed rank, points, and goal-related standings values.
- [x] 1.3 Keep bracket participant, matchup, source slot, and winner change detection unchanged.

## 2. UI Rendering

- [x] 2.1 Update standings table rendering so row-level `recent-change` styling only appears for rank/table movement.
- [x] 2.2 Add value-level indicators/tooltips for changed points and goal-related standings cells.
- [x] 2.3 Ensure stat-only standings changes do not render the row-level `Changed` badge or row-level previous-standing tooltip.
- [x] 2.4 Verify existing keyboard/focus access to change tooltips still works for row-level and value-level indicators.

## 3. Tests

- [x] 3.1 Add or update change-highlight unit tests for stat-only points/goal changes with unchanged rank.
- [x] 3.2 Add or update change-highlight unit tests for true rank movement that still highlights the row.
- [x] 3.3 Run the relevant test suite and static build/check command.
