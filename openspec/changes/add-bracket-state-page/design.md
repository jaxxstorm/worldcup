## Context

The app currently shows fixtures, group tables, and a projected knockout list, but unresolved bracket slots still surface source labels such as "Winner m101" or grouped third-place placeholders. Users need a bracket-oriented view that explains where teams would land if the tournament ended with the currently known real results and active predictions.

The existing static app already has deterministic standings and knockout projection modules. This change should extend that projection data and render it in a separate client-side page/tab without adding server routing or new persistence.

## Goals / Non-Goals

**Goals:**

- Add a distinct bracket page/tab reachable from the static browser app.
- Show a full knockout bracket using the current projection model.
- Resolve bracket slots to teams where current real results and predictions make that possible.
- Keep unresolved slot labels visible alongside current resolved teams so users can understand the rule/source.
- Display kickoff time, venue, host city, and location for bracket matches.
- Update bracket and first-page knockout projections immediately when predictions change.

**Non-Goals:**

- Changing the tournament JSON schema for fixtures, venues, or knockout paths.
- Adding server-side routing, accounts, shared links, or persistence beyond existing session storage.
- Replacing official bracket mapping rules with a new external dependency.
- Adding advanced bracket editing beyond existing fixture prediction controls.

## Decisions

1. Use in-app tab/page state instead of server routes.

   The app will expose a "Fixtures" view and a "Bracket" view through client-side state or hash-safe controls. This stays compatible with GitHub Pages and avoids server route fallback issues.

   Alternative considered: path-based routing. Rejected for this change because the app is currently a single static entry point and does not need route-level URLs to satisfy the request.

2. Extend projected match data with display-ready slot resolution.

   The projection model should continue to derive from tournament data plus predictions, but each bracket match should carry both source labels and current resolved teams where available. This lets the first page and bracket page share the same projection and avoid duplicating resolution logic in the UI.

   Alternative considered: resolve placeholders only in rendering. Rejected because multiple views need the same behavior and tests belong near the projection logic.

3. Treat "state of the world" as current deterministic projection.

   A slot is resolved when real results plus predictions can produce a team for that source. If a slot still cannot be resolved, the UI shows the source label and an unresolved state.

   Alternative considered: simulate missing results or assume current table rank without all matches. Rejected because the app should not invent results; user predictions are the mechanism for filling unresolved fixtures.

## Risks / Trade-offs

- Some third-place mappings can remain ambiguous -> Show the current resolved team when possible and preserve the source label when not.
- Bracket UI can become dense on small screens -> Use a responsive stacked bracket/list layout for the initial implementation.
- Duplicate projection rendering could drift -> Reuse the same projected match model for the first-page knockout section and the bracket page.
- Static hosting route issues -> Keep navigation inside the single-page app.

## Migration Plan

1. Extend projection types/helpers to expose source labels, current teams, fixture time, venue, and location for bracket matches.
2. Update the first-page knockout list to show current resolved teams next to source placeholders.
3. Add a distinct bracket tab/page with bracket rounds and match metadata.
4. Add tests for current slot resolution and prediction-driven bracket changes.
5. Run type checking, unit tests, and production build.

## Open Questions

None for the initial implementation.
