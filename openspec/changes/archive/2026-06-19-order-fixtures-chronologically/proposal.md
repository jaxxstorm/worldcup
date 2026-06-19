## Why

The fixture list should match how users naturally follow a tournament: by kickoff time. Ordering fixtures chronologically makes completed results, current matches, and future predictions easier to scan without changing the underlying tournament data.

## What Changes

- Display fixtures in chronological order by their scheduled kickoff date/time.
- Use a stable secondary order, such as match number, when fixtures share the same kickoff time.
- Preserve existing completed-result and prediction behavior while changing only fixture presentation order.
- Keep the change compatible with static GitHub Pages hosting; no routing or server behavior changes are required.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `browser-app`: Fixture list presentation must be chronological instead of relying on source array order.

## Impact

- Affects fixture list rendering in the browser app.
- May add a small pure sorting helper and tests for fixture ordering.
- Does not change the normalized data schema, authoritative result handling, session storage, or prediction calculations.
