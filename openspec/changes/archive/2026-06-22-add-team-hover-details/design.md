## Context

The app already renders teams in many places and has a lightweight floating tooltip for simple text explanations. Team data includes optional FIFA rankings, and completed fixture results are already bundled in the static tournament dataset. The feature should reuse those local facts so GitHub Pages hosting remains unchanged.

## Goals / Non-Goals

**Goals:**
- Provide a consistent hover/focus affordance for team identities across fixtures, standings, bracket, stats, and performance views.
- Show FIFA ranking and up to five latest completed results for the hovered team.
- Derive recent results from immutable authoritative fixture results, not active predictions.
- Keep the default UI visually quiet; the popover appears only while hovering or focusing a team.

**Non-Goals:**
- Fetch live FIFA ranking or international form data at runtime.
- Add new server storage, API routes, or account-based behavior.
- Treat user predictions as historical team results.

## Decisions

- Use a shared team identity renderer for common flag/name appearances.
  - This reduces one-off markup and makes hover behavior consistent.
  - Alternative considered: add ad hoc tooltip attributes at each render site. That would be faster initially but easier to miss in future team surfaces.
- Add a small engine helper to derive recent results from completed fixtures.
  - It keeps date sorting and team-perspective score calculations testable outside the DOM.
  - Alternative considered: compute rows inline during tooltip rendering. That would couple UI markup to fixture traversal.
- Render a dedicated rich team popover instead of overloading plain `data-tooltip`.
  - Existing `data-tooltip` remains for simple text badges and header help.
  - Team details need structured rows and result labels, so a separate `data-team-id` path is clearer.
- Use only bundled data.
  - FIFA ranking comes from `Team.fifaRanking`; recent results come from `Fixture.result`.
  - This avoids network failures and preserves static-host deployment.

## Risks / Trade-offs

- Some teams may have fewer than five completed results early in the tournament -> show the available completed results and a clear empty state when none exist.
- Existing render sites vary in layout density -> use compact inline-flex markup and CSS constraints so table rows and bracket cards do not shift awkwardly.
- Rich popovers can overlap viewport edges -> reuse bounded positioning logic so popovers stay within the visible window horizontally.
