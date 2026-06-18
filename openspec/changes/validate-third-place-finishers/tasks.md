## 1. Third-Place Qualification Logic

- [x] 1.1 Add a deterministic helper that returns the ordered set of projected best third-place groups from standings.
- [x] 1.2 Add a FIFA third-place combination mapping helper for resolving ambiguous round-of-32 labels such as `3A/B/C`.
- [x] 1.3 Validate the mapping against available FIFA World Cup 2026 third-place assignment source material and document the assumptions in code or tests.

## 2. Knockout Projection Integration

- [x] 2.1 Update knockout source resolution to use the third-place assignment helper before falling back to unresolved placeholders.
- [x] 2.2 Ensure ambiguous third-place labels remain unresolved when fewer than eight third-place groups are knowable.

## 3. Verification

- [x] 3.1 Add tests for best third-place group selection and concrete round-of-32 third-place slot resolution.
- [x] 3.2 Add tests for unresolved third-place labels when the qualifying group set is incomplete.
- [x] 3.3 Run the project test/typecheck/build commands.
