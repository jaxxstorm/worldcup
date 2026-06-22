## Why

The predictor currently shows fixtures, standings, and bracket paths, but it does not expose tournament stat leaders or a clear knockout qualification view for third-place teams. Adding player stat leaderboards and moving third-place qualification context into the bracket view makes the tournament dashboard easier to scan as real results and predictions evolve.

## What Changes

- Add a Stats view/tab to the static browser app.
- Display top player stat leaderboards from normalized static data, including the top 10 goal scorers and other football-data.org scorer stats such as assists and penalties.
- Add a best third-place teams table to the Bracket tab under knockout qualification, calculated from the same authoritative results plus active predictions used by standings and bracket projections.
- Extend tournament data with optional stat leaderboard data and source metadata, keeping external sources normalized into static JSON rather than fetched live by the browser.
- Pull player stat leaderboards from football-data.org's scorers endpoint using a server-side scheduled job token, then commit normalized static data.

## Capabilities

### New Capabilities

- `tournament-stats`: Normalized tournament stat leaderboards and third-place ranking data for browser display.

### Modified Capabilities

- `browser-app`: Add a Stats tab for player leaderboards and a Bracket tab knockout qualification section for calculated third-place rankings without server-side routes.
- `prediction-engine`: Expose calculated best third-place standings as a reusable projection output, derived from real results plus active predictions.
- `tournament-data`: Allow optional normalized stat leaderboard data with retained source metadata.

## Impact

- Updates TypeScript data types and validation for optional tournament stat leaderboards.
- Adds a football-data.org stats refresh script and scheduled workflow step using `FOOTBALL_DATA_API_TOKEN` or `STATS_SOURCE_TOKEN`.
- Adds deterministic ranking helpers for third-place teams.
- Updates the browser UI, tab navigation, and styles for a Stats view.
- Adds tests for stats rendering data, third-place ranking behavior, and static build/type safety.
- No runtime server dependency; data remains bundled with the static site for Cloudflare Pages or equivalent static hosting.
