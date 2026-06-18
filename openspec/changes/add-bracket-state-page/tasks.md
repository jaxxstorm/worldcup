## 1. Projection Model

- [x] 1.1 Extend projected match types to expose participant source labels, resolved teams, fixture id, stage, kickoff time, and venue id.
- [x] 1.2 Update bracket slot resolution so current real results plus active predictions produce "state of the world" teams where possible.
- [x] 1.3 Preserve unresolved source labels when a bracket slot cannot yet resolve to a team.

## 2. Browser Navigation

- [x] 2.1 Add client-side tab/page state for a main fixtures/table view and a distinct bracket view.
- [x] 2.2 Ensure bracket navigation works without server-side routes for GitHub Pages compatibility.

## 3. Bracket Rendering

- [x] 3.1 Build the bracket page layout grouped by knockout round.
- [x] 3.2 Render each bracket match with source labels, resolved teams where available, kickoff time, venue, host city, and country.
- [x] 3.3 Update the first-page projected knockout area to show current resolved teams alongside source placeholders.
- [x] 3.4 Ensure bracket and first-page projected knockout views update immediately when predictions change.

## 4. Tests

- [x] 4.1 Add tests for current bracket slot resolution from standings and predictions.
- [x] 4.2 Add tests for unresolved source labels remaining visible when no team can be resolved.
- [x] 4.3 Add tests for prediction-driven bracket projection updates.

## 5. Verification

- [x] 5.1 Run type checking and unit tests.
- [x] 5.2 Run the production build to verify the static app still builds for GitHub Pages.
