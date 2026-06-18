## Why

The fixture list is chronological, but users still need a faster way to scan the tournament day by day. Grouping fixtures that share a date into boxed sections makes dense match days easier to read without changing the underlying fixture data or prediction model.

## What Changes

- Group visible fixtures by match date on the fixtures view.
- Wrap each date group in a visually distinct bordered section with a date heading.
- Preserve chronological ordering between date groups and within each date group.
- Keep real results immutable and keep user predictions limited to unresolved fixtures.
- Keep the app static-hosting friendly for GitHub Pages; this is a client-side presentation change only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `browser-app`: fixture presentation adds date-grouped boxed sections while preserving fixture details, results, predictions, and static hosting behavior.

## Impact

- Affects fixture rendering in `src/main.ts`.
- Affects visual styling in `src/styles.css`.
- May add a small client-side grouping helper and focused tests for date grouping/order.
- Does not change the JSON schema, authoritative external data source strategy, fixture/result ingestion, session storage format, bracket projection logic, or GitHub Pages deployment model.
