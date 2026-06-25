## 1. Scenario Documents

- [x] 1.1 Add deterministic scenario document types and snapshot id generation
- [x] 1.2 Generate team summary, qualification route, miss-out route, finish path, chaser, third-place jump, and rule-note documents for all teams
- [x] 1.3 Collapse equivalent margin outcomes into readable thresholds while keeping concrete fixture/team metadata
- [x] 1.4 Add tests for third-place jump candidates, compatibility filtering, and result-drift-safe scenario document generation

## 2. Vectorize Integration

- [x] 2.1 Add Vectorize and embedding model binding/configuration types
- [x] 2.2 Add reusable embedding, indexing, and retrieval helpers with snapshot filtering and no-binding fallback
- [x] 2.3 Update the scenario question endpoint to retrieve vectorized scenario documents and prioritize exact request context
- [x] 2.4 Add API tests for retrieved context, stale snapshot filtering, and fallback behavior

## 3. Refresh Workflow

- [x] 3.1 Add a scenario indexing script that runs after generated-data changes
- [x] 3.2 Wire result/stat refresh scripts or workflow commands to invoke scenario indexing without timestamp-only churn
- [x] 3.3 Document required Vectorize index and metadata indexes
- [x] 3.4 Add refresh tests or command checks for no-change and skip-safe indexing behavior

## 4. Verification

- [x] 4.1 Run scenario and API test suites
- [x] 4.2 Run `npm test`
- [x] 4.3 Run `npm run typecheck`
- [x] 4.4 Run `npm run build`
