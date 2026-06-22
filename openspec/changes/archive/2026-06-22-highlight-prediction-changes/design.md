## Overview

Add a lightweight UI-only comparison layer around prediction-triggered renders. Before applying a completed prediction edit, capture the current standings and bracket projection in simple keyed snapshots. After applying the edit, render from the new model and compare the new values to the previous snapshot to assign change classes and short labels.

## Goals

- Make recently changed standings rows and bracket participants easy to spot.
- Highlight only changes caused by the most recent completed prediction edit or clear action.
- Keep prediction and projection engines deterministic and unchanged.
- Preserve the existing static Vite application architecture.

## Non-Goals

- Persisting change history across reloads.
- Adding animation libraries or server-side state.
- Changing tournament data normalization or authoritative result handling.

## Approach

### Snapshot Shape

Maintain a module-level `lastPredictionChange` object populated only by `handlePredictionInput` immediately before mutating `predictions`. The snapshot records:

- group standings by `teamId`, including rank, points, goal difference, and qualification status
- projected knockout match state by `fixtureId`, including home/away team IDs, source labels, and projected winner

Initial page load has no snapshot, so no highlight appears.

### Rendering

Render helpers compare current rows and projected matches to the snapshot:

- standings rows receive classes for rank/stat changes and a compact change badge
- first-page knockout cards receive classes when participants or winner changed
- bracket diagram teams receive classes when slot occupants changed
- bracket fixture rows receive classes when matchup or winner changed
- third-place rows receive classes when qualification status, rank, or table values changed

The comparison should be resilient to unresolved slots by using source labels as fallbacks.

### Styling

Use accessible, restrained highlighting:

- warm background and border accent for changed rows/nodes
- small text badge such as `Changed`, `+2`, or `Moved`
- short animation that fades from a stronger highlight to the steady changed state

The UI must remain readable on narrow screens and in horizontally scrollable tables.

## Risks

- Over-highlighting could create noise if every downstream bracket match changes. Mitigate by using a consistent low-intensity style and limiting labels to affected row or participant surfaces.
- Re-rendering already preserves input focus and scroll; snapshot work must not disturb that behavior.
