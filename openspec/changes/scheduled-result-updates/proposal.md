## Why

Tournament results will change throughout World Cup 2026, and manually updating the static dataset after every match is easy to forget and hard to audit. A scheduled, deterministic data refresh keeps the published tables and projections current while preserving the app's static-hosting model.

## What Changes

- Add a scheduled GitHub Actions workflow that runs every four hours and can also be triggered manually.
- Add a result update script that pulls a configured external result feed, normalizes completed results into the local tournament JSON schema, validates the output, and writes only deterministic data changes.
- Commit normalized result changes back to the repository when the scheduled job detects updates.
- Rebuild and redeploy the static Cloudflare Pages site after result changes so standings and bracket projections reflect the refreshed dataset.
- Avoid a GitHub agent for the first version; use an auditable script and workflow instead.

## Capabilities

### New Capabilities
- `scheduled-data-refresh`: Covers scheduled result ingestion, repository updates, and static-site redeployment from refreshed tournament data.

### Modified Capabilities
- `tournament-data`: External result updates must merge into the normalized dataset without allowing predictions to overwrite immutable real results.
- `browser-app`: The static app must consume the refreshed generated tournament dataset so scheduled updates affect the deployed tables and projections.

## Impact

- Adds a GitHub Actions workflow for scheduled result refreshes.
- Adds or extends Node/TypeScript scripts for result ingestion and validation.
- Updates tournament data imports so the browser app uses the generated static dataset.
- Uses repository and Cloudflare deployment secrets in CI: a result source URL when configured, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_API_TOKEN`.
