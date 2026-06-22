## Why

Prediction models are currently trapped in one browser session, which makes it hard to share a bracket scenario with another person. A shareable link lets users send their active predictions and lets recipients immediately see the projected table and bracket changes.

## What Changes

- Add a static-host-compatible share link format that encodes active predictions in the URL.
- Add a browser UI control for generating and copying the current prediction share link.
- Load valid predictions from a share link, persist them into session storage, and render the projected changes from the baseline model.
- Ignore invalid or stale share data, including completed fixtures and unknown fixture IDs.

## Capabilities

### New Capabilities

### Modified Capabilities
- `browser-app`: The browser app must support generating and loading shareable prediction links.

## Impact

- Affected code: browser app initialization, prediction storage helpers, UI controls, and tests.
- No server dependency or account system; links remain static-host compatible.
- No changes to authoritative tournament data or result immutability.
