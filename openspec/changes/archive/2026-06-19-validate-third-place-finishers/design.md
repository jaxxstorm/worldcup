## Context

The 2026 tournament format advances the top two teams from each of 12 groups plus the eight best third-place teams. The app already ranks group standings and selects eight third-place teams, but ambiguous Round-of-32 source labels such as `3A/B/C` are resolved by whichever listed qualifier appears first. That can leave visible gaps or assign a third-place team to the wrong slot.

FIFA's Round-of-32 schedule uses a combination table: once the eight third-place groups are known, each ambiguous third-place slot maps to one specific group. The prediction engine needs to apply that table before resolving knockout participants.

## Goals / Non-Goals

**Goals:**

- Determine the eight best third-place groups from projected group standings.
- Resolve Round-of-32 ambiguous third-place source labels through a deterministic combination mapping keyed by qualified third-place groups.
- Leave placeholders unresolved only when the eight third-place group set cannot be determined.
- Keep downstream knockout projection deterministic as predictions change.
- Cover representative and edge-case third-place combinations with tests.

**Non-Goals:**

- Changing group-stage ranking tiebreakers beyond the app's current deterministic standings sort.
- Changing tournament fixture data or the JSON schema.
- Changing the UI rendering contract for bracket participants.
- Persisting extra qualification state in session storage.

## Decisions

- Extend qualifier calculation to expose both team slots (`3A`, `3B`, etc.) and the set/order of best third-place groups. This keeps qualification logic in the standings layer.
- Add a pure third-place source resolver in the knockout layer. It receives source labels like `3D/E/F`, the qualifying third-place groups, and the qualifier map, then returns the correct concrete slot when a table entry exists.
- Store the third-place assignment table as deterministic code data. The source format is small, static, and tournament-specific, so no runtime fetch is needed for GitHub Pages.
- Preserve unresolved labels when fewer than eight third-place groups are known. This prevents misleading bracket certainty when the prediction model has incomplete group results.

## Risks / Trade-offs

- [Risk] The 495-row FIFA combination table is easy to transcribe incorrectly. -> Mitigation: derive tests from known combinations and keep the mapping in one isolated module/helper.
- [Risk] Existing data labels may not exactly match the table's expected slot sets. -> Mitigation: parse labels by third-place group letters and fall back to the existing unresolved label when no table entry applies.
- [Risk] Current standings tiebreakers are simplified relative to full FIFA regulations. -> Mitigation: this change targets slot assignment after projected rankings are calculated; full tiebreaker parity remains separate work.
