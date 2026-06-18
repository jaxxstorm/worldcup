## Context

The browser app currently renders fixtures from the tournament data array order. That order can follow generation or source grouping rather than the way users expect to consume a schedule: earliest kickoff first.

This change affects presentation only. Fixture data, result immutability, prediction state, session storage, standings, and knockout projection behavior remain unchanged.

## Goals / Non-Goals

**Goals:**

- Render fixture lists in ascending kickoff time.
- Preserve a stable secondary order by match number when kickoff times are equal.
- Keep sorting logic deterministic and reusable enough to test independently.
- Avoid mutating the underlying normalized tournament data array.

**Non-Goals:**

- Changing fixture dates, venues, match numbers, results, or external data normalization.
- Adding filters, grouping controls, pagination, or calendar views.
- Changing standings, qualification, knockout projection, or session storage behavior.

## Decisions

1. Sort at the browser presentation boundary.

   The app will derive a sorted fixture list before rendering instead of reordering the source data. This keeps normalized data stable for calculations and source audits.

   Alternative considered: rewrite the source data array chronologically. Rejected because source order may still be useful for generated match IDs and external-data comparison.

2. Use kickoff time first and match number second.

   The primary sort key will be the fixture `date`; the secondary sort key will be `matchNumber`. This gives deterministic behavior for same-time fixtures and keeps the UI stable across renders.

   Alternative considered: sort by match number only. Rejected because match number does not always communicate day-by-day tournament flow as clearly as kickoff time.

## Risks / Trade-offs

- Invalid date strings could produce unstable order -> Keep existing data validation and add a sorting test with intentionally unordered fixtures.
- Sorting during render could accidentally mutate shared data -> Use a copied array before sorting.
- Equal kickoff times could jump around between renders -> Use `matchNumber` as a stable secondary key.

## Migration Plan

1. Add a fixture sorting helper or equivalent presentation-level sort.
2. Update fixture rendering to use chronological order.
3. Add tests covering chronological and same-time fixture ordering.
4. Run type checking, unit tests, and production build.

No rollback steps beyond reverting the UI sorting change are required.

## Open Questions

None.
