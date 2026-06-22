## Context

The app already calculates fixture performance in `src/engine/performance.ts` from immutable authoritative group results plus complete active predictions. The current model uses FIFA ranking as a binary favorite/underdog baseline, then multiplies the point delta by coarse ranking-gap buckets. That makes some results too flat: a favorite beating a very weak team can tie a favorite beating a nearby strong team, even though the second result says more about relative strength.

The tournament data already includes FIFA rankings for teams. This change does not require a new JSON schema field or external runtime feed. FIFA ranking remains the static pre-tournament strength seed bundled in the generated dataset, while completed results and user predictions remain separate inputs to the deterministic browser calculation.

## Goals / Non-Goals

**Goals:**

- Publish a formula users can read and verify from each fixture row.
- Reward teams for outperforming the result expected from the relative strength of their opponent.
- Give small credit for expected wins over much weaker teams and larger credit for wins over nearby or stronger teams.
- Give lower-ranked teams meaningful positive credit for draws against much stronger opponents.
- Keep final results immutable and predictions session-scoped.
- Keep all calculations client-side and compatible with static GitHub Pages hosting.

**Non-Goals:**

- Implement a live Elo rating feed or update global team ratings after every match.
- Replace FIFA ranking data in the generated tournament dataset.
- Change group standings, knockout qualification, or prediction storage behavior.
- Score knockout fixtures before the app has a separate requirement for knockout performance analysis.

## Decisions

1. Convert FIFA rank into a seed rating, then use the standard Elo expected-result formula.
   - Formula: `seedRating = 2200 - ((fifaRanking - 1) * 6)`.
   - Formula: `expectedResult = 1 / (1 + 10 ** ((opponentSeedRating - teamSeedRating) / 400))`.
   - Rationale: users get an Elo-shaped probability curve without needing a new rating source. A 400 point rating gap remains the familiar Elo scale, while a 6-point-per-rank mapping makes large FIFA-ranking gaps matter without making near-ranked matches indistinguishable.
   - Alternative considered: use FIFA rank difference directly with custom buckets. Rejected because the current bucket model is the source of the flattening.
   - Alternative considered: import real Elo ratings. Rejected for this change because it adds source selection, refresh, and provenance questions that are larger than the desired formula update.

2. Score fixture success as actual result over expected result.
   - Formula: `actualResult = 1` for a win, `0.5` for a draw, and `0` for a loss.
   - Formula: `successScore = (actualResult - expectedResult) * 3`.
   - Rationale: the score remains point-like and intuitive. Expected wins over much weaker teams produce a small positive score, wins over close opponents produce a stronger positive score, underdog draws become positive, and favorite draws/losses are penalized.
   - Alternative considered: preserve football points as `resultPoints - expectedPoints`. Rejected because Elo result scoring convention already treats a draw as half-success and maps cleanly to the expected-result curve.

3. Keep existing fixture-performance inclusion rules.
   - Completed group fixtures with authoritative results are scored.
   - Unresolved group fixtures are scored only when the active prediction has a complete score.
   - Predictions must not mutate fixture records.
   - Fixtures with missing rankings stay deterministic by excluding scored entries rather than inventing strength.
   - Rationale: this preserves the app's existing data ownership and session-storage behavior.

4. Publish formula fields in the Performance view.
   - Each fixture row should expose team rank, opponent rank, seed ratings, expected result, actual result, and success score.
   - The summary table should total or average success score using the same entry scores.
   - Rationale: users should be able to understand examples like Cape Verde drawing Spain and Uruguay or England beating Croatia without reading code.

## Risks / Trade-offs

- [Risk] FIFA rank is not a true Elo rating and can be stale. -> Mitigation: label it as a FIFA-rank seed rating and publish the conversion formula.
- [Risk] The 6-point-per-rank slope is opinionated. -> Mitigation: keep it as a named constant with tests for expected examples, making future tuning explicit.
- [Risk] Scores change from integer bucket values to decimals. -> Mitigation: format scores consistently in the UI and update tests around rounded values where appropriate.
- [Risk] Users may confuse success score with group points. -> Mitigation: keep table labels and explanatory copy focused on "expected result" and "success score" rather than standings points.
- [Risk] Live generated data changes could make brittle examples fail. -> Mitigation: behavior tests should use local test fixtures rather than relying on the generated tournament dataset.
