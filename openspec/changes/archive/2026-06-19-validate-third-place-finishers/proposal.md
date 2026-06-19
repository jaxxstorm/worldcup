## Why

Round-of-32 slots that depend on the eight best third-place teams can still show unresolved placeholders such as `3D/E/F`, even when the projected third-place qualifiers are known. FIFA's 48-team format advances the top two teams from each group plus the eight best third-place teams, and the specific Round-of-32 placement for those third-place teams is determined by the official combination table for the qualifying third-place groups.

## What Changes

- Validate the prediction engine against the FIFA World Cup 2026 third-place qualification format.
- Rank third-place teams from groups A-L and identify the eight best projected third-place finishers.
- Resolve ambiguous Round-of-32 third-place source labels, such as `3A/B/C`, using a deterministic combination table keyed by the set of qualifying third-place groups.
- Keep unresolved labels only when the qualifying third-place group combination cannot yet be determined.
- Preserve immutable real results, mutable user predictions, and static GitHub Pages hosting behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `prediction-engine`: qualification and knockout projection must apply the FIFA third-place finisher assignment logic when projected third-place qualifiers are known.

## Impact

- Affects `src/engine/standings.ts` and `src/engine/knockout.ts`.
- Adds a deterministic third-place assignment table or helper derived from the FIFA World Cup 2026 regulations schedule logic.
- Adds projection tests for best third-place qualification and Round-of-32 ambiguous slot resolution.
- Does not change the tournament JSON schema, authoritative fixture/result ingestion, user prediction storage, or GitHub Pages deployment.
