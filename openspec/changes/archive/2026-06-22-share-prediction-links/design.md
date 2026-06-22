## Context

The app already persists predictions in `sessionStorage` and recalculates standings and bracket projections client-side. Recent-change highlighting can compare a baseline prediction model with the active one. Sharing can reuse those pieces if the URL encodes only the prediction map.

## Goals / Non-Goals

**Goals:**
- Generate a link that carries the current valid prediction map.
- Load a shared prediction map before the first render.
- Show projected changes from an empty prediction baseline when a shared link is opened.
- Keep the app deployable as static assets.

**Non-Goals:**
- Server-side short links or saved prediction records.
- User accounts, ownership, or editing permissions.
- Sharing arbitrary UI state such as active tab or scroll position.

## Decisions

- Encode predictions in a `p` URL search parameter using JSON plus base64url.
  - Rationale: query parameters work on static hosting, are easy to copy, and avoid server routes.
  - Alternative considered: path-based routes. Static hosting would need rewrite support and would add routing complexity.
- Sanitize decoded predictions through the existing prediction sanitizer.
  - Rationale: shared links may be stale or manually edited; authoritative completed results must remain immutable.
- On shared-link load, save sanitized predictions to session storage and set recent-change baseline to the no-predictions state.
  - Rationale: the recipient sees the sender's model and immediately sees possible changes caused by those predictions.
- Generate share links from the current location with only the share parameter updated.
  - Rationale: preserves deployment base path and works in local/dev/static environments.

## Risks / Trade-offs

- URL length grows with prediction count -> acceptable for typical prediction sets; no server shortener is in scope.
- Clipboard API may be unavailable -> the share control should still expose/copy the generated URL best-effort.
