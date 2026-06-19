## Context

The browser app already computes a deterministic `ProjectedMatch[]` from authoritative results plus active session predictions. The current bracket tab renders that projection as repeated text sections and match cards, so it lacks a coherent playoff-style diagram and does not keep bracket-related prediction inputs visually connected to the bracket.

The app is a static Vite/TypeScript site. Prediction editing, recalculation, and session persistence are already implemented in the browser, and completed real results are immutable. This change should therefore reshape presentation and input placement without changing the tournament data schema or prediction engine semantics.

## Goals / Non-Goals

**Goals:**
- Render the bracket tab as one primary panel with two draw sides and connected knockout paths.
- Use a JavaScript/TypeScript data-driven bracket renderer so the diagram is generated from the current projection rather than hand-authored CSS tables.
- Show teams, flags, slots, fixture identifiers, kickoff time in browser timezone, and venue/city in bracket nodes.
- Put a fixture prediction table underneath the bracket so users can edit unresolved bracket-related fixtures in the same view.
- Keep prediction changes flowing through the existing session storage and projection recalculation pipeline.

**Non-Goals:**
- Change qualification, third-place, standings, or knockout winner calculation rules.
- Add a runtime backend, user accounts, or non-static route handling.
- Change the normalized fixture/result schema.
- Replace the existing fixtures tab or group standings presentation.

## Decisions

1. Build a data-driven SVG bracket panel in the existing TypeScript app.
   - Rationale: SVG can draw connected bracket paths and scale horizontally while remaining static-host compatible.
   - Alternative considered: Keep the current card/list layout and improve CSS. Rejected because it still reads as tables rather than a bracket.
   - Alternative considered: Add a large bracket package. Deferred because the current projection structure is custom, and a small internal renderer can be more predictable for round-of-32 through final.

2. Split the visual bracket into left and right draw sides.
   - Rationale: The user wants to see which side of the draw a team ends up on, and the existing projection already exposes draw-side grouping.
   - Each side should render round columns from round of 32 through finalist path, with connectors between related rounds.

3. Keep prediction inputs in a table below the diagram.
   - Rationale: Dense score input controls are easier to scan and edit in rows than inside small bracket nodes.
   - The table should include completed fixtures as fixed results and unresolved fixtures as editable prediction inputs.

4. Preserve the existing recalculation flow.
   - Rationale: The app already re-renders after score input changes and persists session predictions. The bracket view should use the same handlers and storage path.

## Risks / Trade-offs

- Dense 104-match tournament bracket may be wide on mobile -> Mitigation: make the bracket panel horizontally scrollable with stable node dimensions.
- Long team names and venue text can overflow nodes -> Mitigation: use compact node text, fixed dimensions, and put full fixture details in the table underneath.
- SVG connectors can become visually noisy -> Mitigation: draw connectors only between knockout rounds, keep the prediction fixture table separate, and retain clear round headings.
- Internal renderer is custom code -> Mitigation: keep layout functions deterministic and covered by focused tests for bracket side grouping/render output.

## Migration Plan

1. Add the bracket panel renderer and replace the bracket tab's table-like layout.
2. Add the bracket fixture prediction table underneath the diagram, reusing the existing prediction input handler.
3. Update styles for bracket panel scrolling, node layout, and fixture table density.
4. Add focused tests for bracket panel markup expectations and run the existing validation/build suite.
5. Roll back by restoring the previous bracket view renderer; prediction data and normalized tournament data are unaffected.

## Open Questions

- None for the first implementation. More advanced interactions such as click-to-focus, zoom controls, or path highlighting can be layered on after the core bracket panel is working.
