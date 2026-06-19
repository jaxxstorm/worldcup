## Why

The current bracket tab is mostly a list of projected matches, which makes it hard to understand each side of the draw or explore outcomes in the style of a playoff predictor. Users need one bracket-focused panel that visually diagrams the knockout path while still keeping fixture prediction inputs close at hand.

## What Changes

- Replace the bracket tab's table-like presentation with a single bracket panel that shows left and right sides of the draw in a proper connected bracket diagram.
- Keep the bracket projection driven by authoritative results plus active browser predictions, so changing an unresolved fixture updates the visual bracket immediately.
- Add a fixtures/predictions table underneath the bracket panel for bracket-related matches and prediction entry.
- Preserve fixture metadata in the bracket experience, including match number or fixture ID, kickoff in the browser timezone, venue, city, and team flags.
- Keep the app static-hosting compatible; the bracket rendering must run entirely in the browser without a server.

## Capabilities

### New Capabilities

### Modified Capabilities
- `browser-app`: The bracket view must render an interactive visual bracket panel with draw sides and a supporting prediction fixtures table instead of only list/table style knockout projections.

## Impact

- Affected code: `src/main.ts`, `src/styles.css`, and focused tests around bracket rendering/projection behavior.
- Browser behavior: predictions remain stored in session storage and continue to update standings and projections immediately.
- Data and results: no change to authoritative FIFA fixture/result normalization; completed real results remain immutable.
- Hosting: the implementation remains a static TypeScript/JavaScript build suitable for Cloudflare Pages and GitHub Pages-style static hosting.
