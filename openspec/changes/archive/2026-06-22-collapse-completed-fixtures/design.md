## Context

The main Fixtures view currently filters group and round-of-32 fixtures, sorts them chronologically, and renders every date group expanded. As real results accumulate, completed fixtures remain at the top of the list as full cards and push unresolved prediction inputs farther down the page.

## Goals / Non-Goals

**Goals:**
- Keep chronological flow by leaving completed fixtures above unresolved fixtures.
- Make current unresolved fixtures easier to reach by collapsing completed fixtures by default.
- Keep completed results available without taking up the default viewport.
- Preserve chronological grouping inside both actionable and completed fixture sections.
- Avoid changing tournament data, prediction storage, or calculation behavior.

**Non-Goals:**
- Adding persistent user preferences for collapsed/expanded state.
- Changing the bracket fixture table.
- Hiding completed scores completely.

## Decisions

- Split the main fixture list into completed and actionable buckets at render time.
  - Rationale: this is presentation-only and should not affect the underlying fixture ordering, prediction engine, or dataset.
  - Alternative considered: mutate `orderFixturesChronologically` to sort scheduled fixtures first. That would break the desired chronological flow by moving current fixtures above completed ones.
- Render completed fixtures inside a collapsed native `<details>` section.
  - Rationale: native disclosure controls work without extra state, remain accessible, and do not require session persistence.
  - Alternative considered: remove completed fixtures from the view entirely. That would make final scores harder to inspect and weaken result transparency.
- Keep date grouping for both buckets.
  - Rationale: users still need temporal context when browsing either upcoming matches or completed results.

## Risks / Trade-offs

- Native disclosure styling differs slightly by browser -> use light CSS around `<summary>` while keeping semantics intact.
- Completed fixtures become one extra click away -> the summary includes the completed count so users know what is available.
