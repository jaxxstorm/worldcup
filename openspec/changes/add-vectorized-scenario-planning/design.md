## Context

The current Scenarios tab builds deterministic context in the browser and sends a compact selected-team payload to a Cloudflare Pages Function for AI explanation. That has improved answer quality, but it still narrows the model to the context prepared for one team at one point in the UI. Users now want broader future-results planning: all teams that could become third, all teams that can pass a selected team, concrete margins, and combinations that matter after every result refresh.

Cloudflare Vectorize is a good fit for retrieval over generated scenario facts, not for qualification logic. The deterministic engine should still calculate standings, third-place rankings, route compatibility, and round-of-32 slot outcomes. Vectorize should store searchable scenario documents so the question endpoint can retrieve the right facts for messy natural-language questions.

The app must keep core prediction and scenario panels static-compatible. Vectorize is only used by server-side scenario question and refresh/indexing flows.

## Goals / Non-Goals

**Goals:**

- Generate richer deterministic scenario documents for every team, not only the selected team.
- Include teams that can become third-place teams even when they are currently 1st, 2nd, or 4th in their group.
- Explore bounded score margins for unresolved group fixtures and record qualification, miss-out, and round-of-32 implications.
- Store generated scenario documents in Cloudflare Vectorize with snapshot metadata after result/stat refresh changes.
- Let the scenario question endpoint retrieve relevant scenario documents from Vectorize and combine them with exact selected-team context.
- Keep AI as a narrator over deterministic facts, not a simulator.
- Preserve graceful local/static behavior when Vectorize is absent.

**Non-Goals:**

- Add a real probability model.
- Exhaustively brute-force unlimited scorelines.
- Persist user prediction-specific vectors for every browser session.
- Use Vectorize as the authority for qualification status.
- Change the authoritative tournament JSON schema.

## Decisions

1. Generate scenario documents as deterministic artifacts before embedding.
   - Documents should be plain-text summaries with matching structured metadata. Kinds should include `team-summary`, `qualification-route`, `miss-out-route`, `third-place-chaser`, `third-place-jump`, `finish-path`, and `rule-note`.
   - Rationale: retrieval quality depends on precise facts. The model should receive concrete routes like "Czechia beat Mexico by 1+; South Korea become third and pass Scotland", not infer that from raw standings.
   - Alternative considered: store raw standings rows and ask the model to reason. Rejected because it recreates the vague answer problem.

2. Use a snapshot id to isolate moving generated data.
   - Each document should include a deterministic `snapshotId`, generated from the current generated tournament dataset content or build metadata.
   - Vector queries must filter to the current snapshot when metadata filtering is available.
   - Rationale: result updates make old route documents stale immediately.
   - Alternative considered: overwrite documents with stable ids only. Rejected because stale vectors can remain queryable during partial indexing failures.

3. Keep exact selected-team context ahead of vector retrieval.
   - The endpoint should continue accepting `{ question, team, context }`.
   - It should add retrieved documents as supplemental context, with prompt instructions that exact deterministic request context wins over retrieved documents on conflict.
   - Rationale: browser predictions are session-specific and should not be replaced by refresh-time baseline vectors.
   - Alternative considered: have the endpoint answer only from Vectorize. Rejected because Vectorize documents are generated from refreshed baseline data, not every user prediction state.

4. Generate third-place jump candidates from all unresolved group fixtures.
   - For each bounded fixture outcome, recalculate the group and record any team that becomes third and can affect another team's third-place comparison.
   - Include teams outside the current third-place table if a fixture result moves them into third.
   - Rationale: users specifically need to know which not-currently-third teams can jump into the race.
   - Alternative considered: inspect only current third-place rows. Rejected because it misses the important future-results cases.

5. Bound margin exploration but preserve concrete examples.
   - Explore selected and chaser fixture margins `1..8` plus draws where relevant.
   - Collapse equivalent outcomes into human-readable thresholds such as `1+`, `3+`, or a small set of exact margins when the threshold changes.
   - Rationale: users need concrete implications without a combinatorial wall of text.
   - Alternative considered: store every scoreline document separately. Rejected because it makes retrieval noisy and indexing larger without improving explanation.

6. Use Workers AI embeddings compatible with Vectorize dimensions.
   - Default embedding model should be `@cf/baai/bge-base-en-v1.5`, which produces 768-dimensional vectors.
   - Wrangler docs should expect a Vectorize index with 768 dimensions and cosine distance.
   - Environment overrides should allow future embedding model/index changes.
   - Rationale: the existing app already uses Workers AI and Cloudflare AI Gateway; this keeps provider complexity low.

7. Make indexing optional but observable.
   - A script should generate scenario documents locally and, when Cloudflare bindings or credentials are unavailable, write an artifact or report that indexing was skipped.
   - Refresh workflows should fail only when indexing is explicitly required and configured, otherwise static data refresh remains deployable.
   - Rationale: local development and GitHub Pages/static builds should stay usable.

## Risks / Trade-offs

- [Risk] Retrieved documents can be stale after a failed partial index. -> Mitigation: filter by `snapshotId` and include snapshot id in every id and metadata field.
- [Risk] Vector search may miss an exact relevant route. -> Mitigation: always include exact selected-team context and deterministic answer seed before retrieved docs.
- [Risk] Indexing every route could be large. -> Mitigation: collapse equivalent margins and cap per-team route documents while preserving all pass/jump candidates.
- [Risk] Metadata filters require Vectorize metadata indexes created before inserting vectors. -> Mitigation: document required metadata indexes and keep a no-Vectorize fallback path.
- [Risk] Refresh workflows could become brittle if Cloudflare credentials are missing. -> Mitigation: make indexing opt-in/skip-safe unless required by environment.
- [Risk] User prediction state can differ from refresh-time baseline vectors. -> Mitigation: treat Vectorize docs as supplemental background and prefer the request's active deterministic context.

## Migration Plan

1. Add scenario document generation and tests independent of Cloudflare.
2. Add Vectorize binding types, wrangler configuration, and endpoint retrieval fallback.
3. Add an indexing script that can run after generated data refreshes.
4. Update refresh workflow/scripts to call indexing after `tournament.generated.json` changes.
5. Deploy metadata indexes for `snapshotId`, `teamId`, `kind`, and `groupId` before relying on filtered queries.

## Open Questions

- Should production refresh require Vectorize indexing success, or should stale vector answers be disabled while static deployment continues?
- Should user-specific browser predictions eventually create temporary request-scoped scenario documents, or is exact request context enough?
