## Context

The current bracket tab renders projected knockout matches as independent round cards. That is useful for details, but it does not communicate draw geography: users cannot quickly see which round-of-32 teams are on the same half of the bracket and which teams are separated until the final.

The prediction engine already returns projected knockout matches in deterministic match-number order, including round-of-32 participants, source slots, dates, venues, and projected winners when scores exist. This change can present that existing projection differently without changing tournament data, standings logic, or prediction storage.

## Goals / Non-Goals

**Goals:**
- Show the projected draw as two distinct sides of the bracket.
- Preserve "as-it-stands today" semantics: real results plus current standings plus active predictions.
- Show flags, team names, slot/source labels, match id, kickoff, venue, host city, and country for each round-of-32 tie.
- Keep the layout usable on desktop and mobile, with side-by-side halves on wider screens and stacked halves on narrow screens.

**Non-Goals:**
- Add a graphical canvas/SVG bracket engine.
- Change qualification, third-place assignment, or winner projection rules.
- Change fixture data, result ingestion, or session storage.
- Recreate the exact styling of the reference image.

## Decisions

1. Split draw sides by round-of-32 order.
   - The first eight round-of-32 matches are the left side and the final eight are the right side.
   - Rationale: the dataset already encodes bracket order through match numbers and downstream winner links.
   - Alternative considered: infer sides from rendered columns or source labels. Rejected because it is less stable than match order.

2. Add a small pure helper for grouping bracket sides.
   - Rationale: deterministic grouping can be unit tested outside the DOM and reused by the UI.
   - The helper returns left/right side labels and ordered projected matches.

3. Render draw sides as structured HTML/CSS, not generated images.
   - Rationale: static HTML remains accessible, responsive, cheap to build, and compatible with static hosting.
   - CSS connector lines can provide bracket affordance without adding a drawing dependency.

4. Keep the existing round cards below the side view.
   - Rationale: the side view is optimized for "who is on which half"; the round cards remain useful for later rounds and projected winners.

## Risks / Trade-offs

- [Risk] The visual is less pictorial than the reference image -> Use compact team pills, side labels, connector lines, and clear hierarchy.
- [Risk] Mobile width cannot support a full horizontal bracket -> Stack sides and preserve ordered match groups.
- [Risk] Future data changes alter round-of-32 count -> Helper should handle uneven or partial input deterministically.
