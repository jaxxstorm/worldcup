## Context

The app currently builds static TypeScript assets and derives tournament data from source modules at build time. A generated JSON dataset also exists, but the browser entrypoint still imports the TypeScript seed data, which means an automated job that edits only the generated JSON would not affect the deployed app.

Results are immutable once completed and must remain distinct from browser predictions. The refresh process therefore needs to merge authoritative completed results into static data, validate the full dataset, and publish the same deterministic app without introducing a runtime server.

## Goals / Non-Goals

**Goals:**
- Refresh real match results on a four-hour GitHub Actions schedule and by manual dispatch.
- Normalize external result data into the existing tournament schema and preserve source metadata.
- Commit changed generated data back to the repository for reviewable history.
- Rebuild and redeploy the Cloudflare Pages static site when result data changes.
- Keep browser prediction behavior client-side and session-storage based.

**Non-Goals:**
- Build a general GitHub agent or autonomous decision-making workflow.
- Add a runtime backend, database, user accounts, or server-side prediction model.
- Infer uncertain results from unstructured prose without an explicit source mapping.
- Allow scheduled refreshes to overwrite existing completed scores with conflicting values silently.

## Decisions

1. Use a scheduled GitHub Actions workflow instead of an agent.
   - Rationale: result refreshes are deterministic ETL work: fetch, normalize, validate, diff, commit, deploy.
   - Alternative considered: GitHub agent. Rejected for now because it adds ambiguity, review burden, and credential surface area without a clear benefit.

2. Keep the external result feed configurable.
   - The workflow reads `RESULTS_SOURCE_URL` and optional source metadata environment variables from repository secrets/variables.
   - The script accepts a compact JSON result feed keyed by fixture id or match number. It can also merge from a normalized tournament JSON document if the source already emits the app schema.
   - Rationale: FIFA and third-party data availability can change, so the app should not hard-code a brittle scraper as the only update path.

3. Treat existing completed results as immutable.
   - If an incoming result conflicts with an already completed fixture, the script fails instead of mutating history.
   - Rationale: this preserves trust in published results and prevents a bad feed parse from rewriting facts.

4. Make the browser app consume generated static data.
   - The TypeScript seed data remains useful for local normalization, but the deployed app imports `tournament.generated.json`.
   - Rationale: scheduled jobs can update one deterministic JSON artifact and the app will reflect it after build.

5. Commit and deploy only when data changes.
   - The scheduled workflow writes the generated JSON, checks for a diff, validates/tests/builds, commits the data change, and deploys to Cloudflare Pages.
   - Rationale: this avoids noisy commits and unnecessary deployments while still keeping the site current.

## Risks / Trade-offs

- External source schema changes -> The refresh script validates input and fails closed; workflow logs show the parse error.
- Missing result source configuration -> The scheduled workflow exits successfully with a clear skip message so the deployment pipeline is not broken before a feed is selected.
- Generated data and seed data drift -> The app reads generated JSON, and the normalize script can regenerate it from seed data when fixture structure changes.
- GitHub token pushes do not trigger downstream workflows -> The scheduled workflow performs its own Cloudflare deploy after committing changed data.
- Conflicting corrections to official results -> The first implementation fails on conflicts; intentional corrections require a manual data update or an explicit future correction mode.

## Migration Plan

1. Add a result update script and tests around merging, no-op behavior, validation, and conflict handling.
2. Change the browser app data module to read `tournament.generated.json`.
3. Add a scheduled GitHub Actions workflow that runs every four hours and deploys changed data to Cloudflare Pages.
4. Configure repository secrets/variables for the result source and Cloudflare deploy credentials.
5. Roll back by disabling the scheduled workflow; the last committed static dataset remains deployable.
