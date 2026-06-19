## 1. Generated Data Source

- [x] 1.1 Split the static seed data from the published data module so the app imports `tournament.generated.json`.
- [x] 1.2 Update normalization tooling to regenerate `tournament.generated.json` from the seed data.

## 2. Result Refresh Script

- [x] 2.1 Add a result refresh script that accepts a configured external JSON source URL or local file.
- [x] 2.2 Merge new completed results into generated tournament data with source metadata, validation, and conflict rejection.
- [x] 2.3 Add tests covering new-result merge, no-change behavior, and completed-result conflict handling.

## 3. Scheduled Workflow

- [x] 3.1 Add a GitHub Actions workflow that runs every four hours and by manual dispatch.
- [x] 3.2 Configure the workflow to skip cleanly without `RESULTS_SOURCE_URL`, commit generated data changes, verify the build artifact, and deploy changed data to Cloudflare Pages.

## 4. Verification

- [x] 4.1 Run tests, typecheck, and production build.
- [x] 4.2 Confirm OpenSpec apply status shows all tasks complete.
