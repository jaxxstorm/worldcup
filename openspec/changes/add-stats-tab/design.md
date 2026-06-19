## Context

The app is a static TypeScript predictor that bundles `tournament.generated.json` at build time. Group standings and knockout projections already recalculate in the browser from immutable real results plus active user predictions. Player stat leaderboards must come from normalized external stat-source data, while third-place team rankings should be calculated locally and shown alongside the bracket because they determine knockout qualification.

football-data.org exposes a scorers endpoint for competitions that includes goals, assists, and penalties. The app should fetch that endpoint in a scheduled job with an API token, normalize the response into static leaderboards, and continue to bundle the normalized data with the site.

## Goals / Non-Goals

**Goals:**

- Add a Stats tab to the existing static tab navigation.
- Render player leaderboards for the top 10 goal scorers plus other football-data.org scorer stats such as assists and penalties from bundled tournament data.
- Calculate and display the best third-place table in the bracket view from current standings, including real results and active predictions.
- Keep all behavior compatible with static hosting and browser-only recalculation.
- Retain source metadata for imported stats data.

**Non-Goals:**

- Do not fetch football-data.org or any external stats source from the browser at runtime.
- Do not add a server, database, account system, or API proxy.
- Do not make player stats editable prediction inputs.
- Do not replace the existing standings or bracket projection logic.

## Decisions

1. Extend the tournament data model with optional `statLeaderboards`.
   - Each leaderboard has an id, label, value label, source metadata, and ranked entries.
   - Entries include rank, player name, team id when it can be matched, numeric value, and optional detail text.
   - Rationale: this keeps the browser UI simple and static while allowing different upstream sources to be normalized into one stable shape.
   - Alternative considered: fetch football-data.org directly from the browser. Rejected because it would expose the API token and tie the static app to live network availability.

2. Calculate third-place rankings in `engine/standings`.
   - Add a reusable helper that returns each group's third-place row in best-third-place order.
   - Rationale: third-place ranks depend on real results plus the user's current predictions, so they must be derived from the same standings used by bracket projection.
   - Alternative considered: store third-place ranks in JSON. Rejected because it would go stale as predictions change.

3. Add a Stats tab as a third top-level view and a knockout qualification panel on the Bracket tab.
   - The Stats tab renders player leaderboard cards.
   - The Bracket tab renders the third-place ranking table near the bracket because those ranks determine knockout slots.
   - Rationale: player stats are distinct from bracket qualification, while third-place standings explain the projected knockout draw.
   - Alternative considered: put third-place rankings on the Stats tab. Rejected because it separated the table from the bracket behavior it explains.

4. Add a dedicated football-data.org stats refresh script.
   - The script reads `STATS_SOURCE_URL`, `STATS_SOURCE_TOKEN`, and `FOOTBALL_DATA_API_TOKEN`, normalizes scorer rows, and writes `tournament.generated.json`.
   - Rationale: this mirrors the existing result refresh pattern and keeps the browser app static.
   - Alternative considered: combine stats with the result refresh parser. Rejected because scorer leaderboards have a different source shape and update cadence.

## Risks / Trade-offs

- [Risk] football-data.org API keys are missing or quota-limited. -> Mitigation: make the stats refresh fail clearly in CI and keep the last committed static leaderboards usable.
- [Risk] Player/team names may not match local team ids. -> Mitigation: allow entries without a `teamId` and display the supplied team label/detail when no team id exists.
- [Risk] Stats can become stale independently from match results. -> Mitigation: show stat source metadata and keep stats optional so builds remain valid without leaderboards.
- [Risk] Third-place display can disagree with bracket projection if it uses separate logic. -> Mitigation: expose a shared standings helper and test it against bracket behavior.

## Migration Plan

1. Extend types and schema validation to accept optional stat leaderboards.
2. Add initial normalized leaderboard data to `tournament.generated.json`.
3. Add standings helper and tests for third-place ranking.
4. Add Stats tab UI and styles.
5. Verify with tests, typecheck, and build.

Rollback is straightforward: remove the Stats tab, optional leaderboard data, and helper/tests. Existing fixtures, standings, predictions, and bracket behavior remain unchanged.

## Open Questions

- Should stat refresh failures block result refresh commits, or should stats be allowed to skip independently?
- Should additional football-data.org fields be added if the scorer payload expands beyond goals, assists, and penalties?
