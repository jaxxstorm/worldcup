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

3. Base the ranking adjustment on a published formula using expected points and goal-difference strength.
   - Formula: `xPts = 3 / (1 + e^(rank gap / 15))`, where `rank gap = team FIFA rank - opponent FIFA rank`. `credit = round((actual points - xPts) * 100 + capped goal difference * 20)`, with goal difference capped at +/-4.
   - Rationale: this keeps the score explainable while avoiding all-or-nothing buckets. Underdogs get high credit for taking points from favorites, favorites are penalized for draws or losses, and multi-goal wins carry extra strength.
   - Alternative considered: hand-authored upset weights. That would be harder for users to audit and would not adapt smoothly across ranking gaps.

4. Include unresolved predicted group fixtures only when a complete valid prediction exists.
   - Rationale: predictions are mutable user state and should affect the visible model immediately, while partial predictions should not create misleading performance rows.
   - Alternative considered: include scheduled fixtures with blank scores. That would mix fixtures with no performance evidence into the table.

## Risks / Trade-offs

- Ranking gaps are a rough proxy for match difficulty -> Publish the formula in the UI and expose ranking, expected-points, actual-points, surprise, margin, and credit context so users can interpret it.
- Teams without FIFA rankings cannot be fairly scored -> Keep those fixtures out of scored rows or mark their score as unavailable rather than inventing a ranking.
- The metric may over-reward one-off results early in the tournament -> Keep it as a fixture table, separate from team-level aggregate movement.
- User predictions can create hypothetical fixture performances -> Identify predicted rows separately from final results.
