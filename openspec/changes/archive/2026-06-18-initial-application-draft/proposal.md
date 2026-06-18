## Why

World Cup 2026 needs an approachable browser-based predictor that can start from authoritative fixture data, preserve real results as facts, and let users explore future outcomes without an account. This change establishes the initial TypeScript/JavaScript application scope before implementation begins.

## What Changes

- Add a static World Cup 2026 application suitable for GitHub Pages hosting.
- Add a normalized JSON data model for teams, groups, fixtures, results, venues, host cities, flags, standings, and knockout paths.
- Pull fixture and result data from an external authoritative source where practical, then normalize it into the application schema.
- Treat completed matches with real results as immutable historical results.
- Allow users to enter predictions for unresolved matches only.
- Recalculate group tables, qualification, round-of-32 paths, and later knockout outcomes when predictions change.
- Persist the active prediction model in browser session storage.
- Display country flags, fixture details, venues, host cities, and locations in the UI.

## Capabilities

### New Capabilities

- `tournament-data`: Defines normalized World Cup 2026 teams, fixtures, real results, venues, locations, flags, standings inputs, and external data source handling.
- `prediction-engine`: Covers client-side prediction state, immutable real-result handling, standings recalculation, qualification, and knockout path projection.
- `browser-app`: Covers the TypeScript/JavaScript static application experience, session storage persistence, fixture presentation, flags, locations, and GitHub Pages deployment constraints.

### Modified Capabilities

None.

## Impact

- Adds the initial frontend application structure using TypeScript/JavaScript tooling.
- Adds static data/schema assets for tournament data and normalized fixture/result ingestion.
- Adds deterministic browser-side calculation code for standings and projected knockout outcomes.
- Adds session storage persistence for user prediction state.
- Adds static-hosting build/deployment configuration for GitHub Pages.
