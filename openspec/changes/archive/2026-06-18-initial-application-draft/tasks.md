## 1. Application Setup

- [x] 1.1 Select and scaffold a TypeScript/JavaScript static frontend framework compatible with GitHub Pages.
- [x] 1.2 Add package scripts for local development, type checking, testing, and static production builds.
- [x] 1.3 Configure relative asset paths or static routing so the app works from a GitHub Pages project path.

## 2. Tournament Data Model

- [x] 2.1 Define TypeScript types and JSON schema for teams, groups, fixtures, results, venues, host cities, flags, standings inputs, and knockout paths.
- [x] 2.2 Add an initial normalized World Cup 2026 dataset with fixtures, venues, host cities, locations, teams/placeholders, and knockout slots.
- [x] 2.3 Add source metadata fields to normalized tournament data.
- [x] 2.4 Add a data normalization path for importing fixture and result data from an external authoritative source where practical.
- [x] 2.5 Add schema validation for normalized tournament data.

## 3. Prediction Engine

- [x] 3.1 Implement prediction state types that store user predictions separately from tournament source data.
- [x] 3.2 Prevent predictions from overriding fixtures with authoritative completed results.
- [x] 3.3 Implement group standings calculation from real results plus accepted predictions.
- [x] 3.4 Implement qualification and round-of-32 slot projection from standings.
- [x] 3.5 Implement knockout advancement projection for later rounds.
- [x] 3.6 Add deterministic tests for standings, qualification, immutable results, and knockout-path calculations.

## 4. Browser Experience

- [x] 4.1 Build fixture views that show teams/placeholders, flags, match status, scores, venues, host cities, and locations.
- [x] 4.2 Build prediction controls for unresolved matches.
- [x] 4.3 Render group tables that update immediately when predictions change.
- [x] 4.4 Render projected round-of-32 and later knockout outcomes from the active prediction model.
- [x] 4.5 Display country flags consistently in fixtures, standings, and knockout projections.

## 5. Session Storage

- [x] 5.1 Persist the active prediction model to browser session storage after valid changes.
- [x] 5.2 Restore valid predictions from session storage on page load.
- [x] 5.3 Discard invalid stored prediction data, unknown fixture IDs, and predictions for completed fixtures.
- [x] 5.4 Add tests for session storage serialization, restoration, and invalid-data handling.

## 6. Static Deployment

- [x] 6.1 Add GitHub Pages deployment configuration for the static build output.
- [x] 6.2 Verify the production build runs without server-only runtime dependencies.
- [x] 6.3 Verify routing and asset URLs work from the expected GitHub Pages base path.

## 7. Final Verification

- [x] 7.1 Run type checking, unit tests, and production build.
- [x] 7.2 Manually verify prediction edits update standings and knockout projections in the browser.
- [x] 7.3 Manually verify reload restores the active prediction model during the same browser session.
- [x] 7.4 Manually verify completed matches display fixed real results and cannot be edited.
