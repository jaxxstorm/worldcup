## Context

The browser app redraws the main view after prediction input events so standings and knockout projections stay current. Because the redraw replaces the app DOM, editing a number input can lose focus, discard partial input, and move the page back to the top. That makes the predictor unusable for fixture score entry.

This change is limited to client-side prediction input handling. It does not alter fixture/result data, authoritative data source normalization, completed match immutability, or the static GitHub Pages deployment model.

## Goals / Non-Goals

**Goals:**

- Let users type numbers or use number-input steppers in unresolved fixture prediction fields.
- Avoid removing a partially typed score when only one side of a match has been entered.
- Recalculate standings and knockout projections once both home and away prediction values are present.
- Preserve scroll position and return focus to the edited input after a recalculation redraw.
- Continue clearing an existing prediction when the user clears a prediction field.

**Non-Goals:**

- Changing the prediction data model or session storage schema.
- Persisting incomplete one-sided predictions.
- Making completed results editable.
- Adding a frontend framework, router, or server-side runtime.

## Decisions

- Treat one-sided score entry as a local input draft, not an active prediction model update. This keeps the typed value visible while avoiding invalid half-predictions in session storage.
- Update the prediction model only when both fields are valid numbers, or clear an existing prediction when either field is emptied. This preserves immediate recalculation for complete predictions and keeps reset behavior intuitive.
- Preserve the active input identity, selection, and scroll position before redraw, then restore them after rendering. This keeps the current DOM rendering approach while removing the disruptive focus and page-jump behavior.
- Keep the implementation in the existing browser code path with small pure helpers where useful for tests. No new dependency is needed.

## Risks / Trade-offs

- [Risk] Partial one-sided input does not update standings until the second side is entered. -> Mitigation: standings require a complete score, and the visible input retains the draft until it becomes complete.
- [Risk] Restoring focus after redraw could fail if the fixture is no longer editable. -> Mitigation: restore only when the matching input exists after render.
- [Risk] Scroll restoration could fight browser default number input behavior. -> Mitigation: restore only around app-triggered redraws, not every keystroke.
