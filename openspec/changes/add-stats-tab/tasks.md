## 1. Data Model

- [x] 1.1 Add TypeScript types for stat leaderboards and entries.
- [x] 1.2 Extend tournament data validation for optional stat leaderboards.
- [x] 1.3 Add initial normalized stat leaderboard data with source metadata.

## 2. Standings Engine

- [x] 2.1 Add a reusable helper that ranks group third-place teams from calculated standings.
- [x] 2.2 Add tests covering deterministic third-place ranking from predictions.

## 3. Browser UI

- [x] 3.1 Add Stats tab navigation and render path.
- [x] 3.2 Render player stat leaderboard cards from bundled data.
- [x] 3.3 Render calculated third-place rankings from active standings and predictions on the Bracket tab.
- [x] 3.4 Add responsive styles for the Stats tab.

## 4. Verification

- [x] 4.1 Add or update tests for optional stat data validation.
- [x] 4.2 Run tests, typecheck, and production build.

## 5. football-data.org Stats Source

- [x] 5.1 Add football-data.org scorers refresh script.
- [x] 5.2 Add scheduled workflow step for stats refresh using `FOOTBALL_DATA_API_TOKEN` or `STATS_SOURCE_TOKEN`.
- [x] 5.3 Add tests for football-data.org scorer normalization.
- [x] 5.4 Limit player leaderboard rendering to top 10 rows per football-data.org stat.
