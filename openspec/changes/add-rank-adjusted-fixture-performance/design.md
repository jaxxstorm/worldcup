## Context

The app already has a Performance view backed by `src/engine/performance.ts`. It calculates team-level overperformance from group standings and FIFA rankings, using authoritative results plus active predictions through the same deterministic standings flow as the rest of the predictor.

This change adds fixture-level performance entries. It does not require a new external data source or JSON schema field because fixture results, active predictions, team identities, and FIFA rankings already exist in the static dataset. Completed fixture results remain immutable, and unresolved fixture predictions remain separate session state.

## Goals / Non-Goals

**Goals:**
- Calculate one performance entry per team side for each resolved group fixture.
- Give lower-ranked teams more credit for wins and draws against higher-ranked opponents than favorites receive for the same raw result.
- Recalculate entries from active predictions without mutating tournament data.
- Render the entries in the existing Performance view using static-host-compatible client code.

**Non-Goals:**
- Replace FIFA rankings with an Elo model or live ranking feed.
- Change group standings, qualification, or knockout projection rules.
- Persist derived performance entries in session storage or generated JSON.
- Score unresolved fixtures that do not have a complete active prediction.

## Decisions

1. Use a deterministic derived score instead of storing fixture-performance data.
   - Rationale: the app already derives standings and performance rows in the browser from static data plus predictions. Keeping fixture performance derived avoids schema churn and keeps GitHub Pages deployment simple.
   - Alternative considered: add generated fixture-performance fields to the tournament JSON. That would duplicate state and make user predictions harder to incorporate.

2. Score both sides of each resolved group fixture independently.
   - Rationale: the user wants to compare individual fixture performances, such as giving Cape Verde more credit for a draw than Spain. A match-level row would hide which side exceeded expectation.
   - Alternative considered: a single fixture upset score. That is less useful for browsing team performances.

3. Base fixture credit on actual points versus baseline points, scaled by ranking gap.
   - Formula: `credit = (actual points - baseline points) * rank factor`. The baseline assumes the better FIFA-ranked team beats the worse-ranked team for 3 points, the underdog gets 0 points, and equal-ranked teams draw for 1 point each. Rank factor is x1 for gaps 0-4, x2 for gaps 5-14, x3 for gaps 15-29, and x4 for gaps 30+.
   - Rationale: this is still easy to derive from any fixture row, while a bigger upset or bigger favorite failure counts more than a near-even ranking surprise.
   - Alternative considered: a curved expected-points formula with margin bonuses. That produced more nuanced scores, but it was harder to explain and made the fixture table feel less transparent.

4. Include unresolved predicted group fixtures only when a complete valid prediction exists.
   - Rationale: predictions are mutable user state and should affect the visible model immediately, while partial predictions should not create misleading performance rows.
   - Alternative considered: include scheduled fixtures with blank scores. That would mix fixtures with no performance evidence into the table.

## Risks / Trade-offs

- Ranking gaps are a rough proxy for match difficulty -> Publish the baseline and rank-factor rules in the UI and expose ranking, actual points, baseline points, factor, and credit so users can interpret the table.
- Teams without FIFA rankings cannot be fairly scored -> Keep those fixtures out of scored rows or mark their score as unavailable rather than inventing a ranking.
- The metric may over-reward one-off results early in the tournament -> Keep it as a fixture table, separate from team-level aggregate movement.
- User predictions can create hypothetical fixture performances -> Identify predicted rows separately from final results.
