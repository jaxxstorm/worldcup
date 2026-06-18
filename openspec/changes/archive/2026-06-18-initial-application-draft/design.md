## Context

The repository is being shaped into a World Cup 2026 predictor application built with TypeScript/JavaScript frontend tooling and deployed as a static site. The application needs a normalized tournament dataset, deterministic browser-side calculations, session-scoped prediction state, and a UI that can show fixtures, results, flags, venues, host cities, and projected knockout paths without requiring a server at runtime.

Completed real matches are factual source data. User predictions are separate mutable state and must never replace, mutate, or shadow authoritative results for completed matches.

## Goals / Non-Goals

**Goals:**

- Define a static-browser architecture that can be hosted on GitHub Pages.
- Normalize externally sourced World Cup 2026 fixture, result, team, venue, and location data into a local JSON schema.
- Keep real results immutable while allowing predictions for unresolved matches.
- Recalculate group standings, qualification, round-of-32 assignments, and later knockout projections whenever prediction state changes.
- Persist and restore the active user prediction model through browser session storage.
- Provide an initial UI surface for fixtures, country flags, locations, tables, and projected outcomes.

**Non-Goals:**

- User accounts, cloud synchronization, shared prediction links, or server-side persistence.
- Live push updates while the app is open.
- Betting, odds, fantasy scoring, or probabilistic simulation models.
- Authoritative replacement of FIFA or other source data; the app only normalizes source data for local use.

## Decisions

1. Use a static TypeScript frontend application.

   The core application will run fully in the browser and build to static assets compatible with GitHub Pages. This keeps hosting simple and avoids server dependencies for prediction behavior.

   Alternative considered: server-rendered app. Rejected because runtime server hosting conflicts with the GitHub Pages requirement and is unnecessary for deterministic predictor calculations.

2. Keep authoritative tournament data separate from user predictions.

   The tournament JSON schema will distinguish teams, fixtures, venues, real results, and knockout mapping from session-scoped predictions. Completed match results will be read-only facts. Predictions will reference match IDs and only apply when a fixture has no real result.

   Alternative considered: merging predictions into fixture records. Rejected because it makes it easier to accidentally overwrite historical results and harder to reset or compare prediction sessions.

3. Normalize external data into checked-in static JSON.

   Fixture and result data should be pulled from an authoritative external source where practical, then transformed into the local schema as a build or maintenance step. The deployed app should consume normalized static JSON so GitHub Pages remains sufficient.

   Alternative considered: fetching third-party APIs directly from the browser. Rejected for the initial draft because availability, CORS, rate limits, and schema drift would make the public static app less reliable.

4. Implement standings and knockout projection as pure calculation modules.

   Standings, tiebreaker inputs, qualification, and knockout advancement should be deterministic functions of tournament data plus predictions. The UI should call these functions after prediction changes and render the returned model.

   Alternative considered: storing derived standings in session storage. Rejected because derived data can become stale; only user-entered predictions need persistence.

5. Use session storage for the active prediction model.

   The app will persist prediction state in browser `sessionStorage`, restore it on page load, and tolerate missing or invalid stored data by falling back to an empty prediction set. This matches the no-account requirement and avoids cross-session assumptions.

   Alternative considered: local storage. Rejected for the initial draft because the requested persistence scope is session storage.

## Risks / Trade-offs

- External source schema drift -> Keep a normalization boundary and validate normalized JSON against the local schema before use.
- FIFA tiebreaker complexity -> Model standings with enough fields to support known ordering rules, and isolate tiebreaker logic behind tests.
- Round-of-32 path uncertainty before all teams are known -> Represent placeholders and seed rules explicitly so projections can update as predictions change.
- GitHub Pages routing limitations -> Prefer hash routing or a single static entry point with relative asset paths.
- Session storage corruption or stale match IDs -> Validate restored prediction state against the current fixture list and discard invalid entries.

## Migration Plan

1. Add the TypeScript/JavaScript app scaffold and static build configuration.
2. Add normalized tournament JSON schema and initial data assets.
3. Add prediction and standings calculation modules with tests.
4. Add UI views for fixtures, tables, knockout projections, flags, and locations.
5. Add session storage persistence and restoration.
6. Add GitHub Pages build/deployment configuration.

Rollback is simple for the initial draft: revert the static app, generated data, and deployment configuration before publication.

## Open Questions

- Which authoritative external source will be used first for fixture and result normalization?
- Which exact flag asset source will be used, and what license constraints apply?
- Which 2026 group-stage tiebreakers and best-third-place mapping rules should be implemented in the first release if official details change?
