# Scenario Vectorize Setup

Scenario question answers can use Cloudflare Vectorize as a retrieval layer over deterministic scenario documents. The deterministic scenario engine remains the source of truth.

Create the index with dimensions matching the default Workers AI embedding model:

```sh
npx wrangler vectorize create worldcup-scenarios --dimensions=768 --metric=cosine
```

Create metadata indexes before inserting vectors:

```sh
npx wrangler vectorize create-metadata-index worldcup-scenarios --property-name=snapshotId --type=string
npx wrangler vectorize create-metadata-index worldcup-scenarios --property-name=teamId --type=string
npx wrangler vectorize create-metadata-index worldcup-scenarios --property-name=kind --type=string
npx wrangler vectorize create-metadata-index worldcup-scenarios --property-name=groupId --type=string
```

Required bindings and secrets:

- `AI`: Workers AI binding.
- `SCENARIO_VECTORIZE`: Vectorize binding for `worldcup-scenarios`.
- `SCENARIO_INDEX_TOKEN`: secret checked by `/api/scenario-index`.
- `SCENARIO_INDEX_URL` or `SCENARIO_SITE_URL`: used by `npm run index-scenarios`.

Optional overrides:

- `SCENARIO_EMBEDDING_MODEL`: defaults to `@cf/baai/bge-base-en-v1.5`.
- `SCENARIO_INDEX_REQUIRED=1`: makes the indexing script fail instead of skip when endpoint configuration is missing.

Local behavior:

```sh
npm run index-scenarios
```

Without endpoint configuration this only generates the deterministic document set in memory and reports that Vectorize indexing was skipped. It does not rewrite generated data just to change timestamps.
