## Why

The current fixture-credit model treats many materially different wins as equal because it uses coarse FIFA-ranking baselines and multiplier buckets. We need a published success formula that explains relative team strength from results, rewards teams for outperforming expectation, and makes near-ranked wins worth more than routine wins over much weaker opponents.

## What Changes

- Replace the current bucketed fixture-credit formula with an Elo-style expected-result model for group fixture performance.
- Publish the formula in user-facing language so users can understand why a result scored highly or poorly.
- Score each team side against expected points derived from team and opponent strength, so draws against elite teams and wins over closely ranked strong teams receive appropriate credit.
- Preserve the existing separation between immutable authoritative results and mutable active predictions.
- Keep calculations deterministic and compatible with static GitHub Pages hosting.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `fixture-performance`: Fixture performance credit must use a published Elo-style expected-result formula instead of the current favorite/underdog baseline and rank-gap multiplier buckets.
- `browser-app`: The Performance view must publish the updated formula and expose enough values for users to understand the score.

## Impact

- Affects `src/engine/performance.ts` fixture performance entry and summary calculations.
- Affects Performance view copy, tooltips, and columns in `src/main.ts`.
- Affects fixture performance tests in `src/__tests__/performance.test.ts`.
- Uses existing normalized team FIFA rankings as the static pre-tournament strength seed; no new external fixture, result, team, or venue source is required for this change.
- Authoritative completed fixture results remain immutable, while active predictions continue to be read from browser session state and scored without mutating fixture data.
- No server route or runtime service is introduced; all scoring remains deterministic client-side TypeScript suitable for GitHub Pages.
