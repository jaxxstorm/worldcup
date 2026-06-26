import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generateScenarioDocuments } from "../src/engine/scenario-documents";
import type { TournamentData } from "../src/types";

const dataPath = resolve("src/data/tournament.generated.json");
const defaultEndpointPath = "/api/scenario-index";

export interface ScenarioIndexResult {
  snapshotId: string;
  documentCount: number;
  indexed: boolean;
  skippedReason?: string;
}

type ScenarioDocumentGenerator = typeof generateScenarioDocuments;
type ScenarioIndexLogger = (message: string) => void;

interface ScenarioIndexOptions {
  batchSize?: number;
  log?: ScenarioIndexLogger;
}

export async function generateAndMaybeIndexScenarios(
  data: TournamentData,
  env = process.env,
  generateDocuments: ScenarioDocumentGenerator = generateScenarioDocuments,
  options: ScenarioIndexOptions = {}
): Promise<ScenarioIndexResult> {
  const log = options.log ?? (() => {});
  log("Generating scenario documents...");
  const documents = generateDocuments(data);
  const snapshotId = documents[0]?.metadata.snapshotId ?? "unknown";
  const endpoint = endpointUrl(env.SCENARIO_INDEX_URL, env.SCENARIO_SITE_URL);
  const token = env.SCENARIO_INDEX_TOKEN?.trim();
  const batchSize = options.batchSize ?? Number(env.SCENARIO_INDEX_BATCH_SIZE ?? 100);
  const effectiveBatchSize = Number.isFinite(batchSize) && batchSize > 0 ? Math.floor(batchSize) : 100;

  log(`Generated ${documents.length} scenario document(s) for ${snapshotId}.`);

  if (!endpoint || !token) {
    const skippedReason = "SCENARIO_INDEX_URL/SCENARIO_SITE_URL or SCENARIO_INDEX_TOKEN is not configured";
    if (env.SCENARIO_INDEX_REQUIRED === "1") throw new Error(skippedReason);
    return { snapshotId, documentCount: documents.length, indexed: false, skippedReason };
  }

  log(`Indexing at ${endpoint} in ${Math.ceil(documents.length / effectiveBatchSize)} batch(es) of up to ${effectiveBatchSize}.`);
  for (let offset = 0; offset < documents.length; offset += effectiveBatchSize) {
    const batch = documents.slice(offset, offset + effectiveBatchSize);
    const batchNumber = Math.floor(offset / effectiveBatchSize) + 1;
    const batchTotal = Math.ceil(documents.length / effectiveBatchSize);
    log(`Indexing batch ${batchNumber}/${batchTotal}: documents ${offset + 1}-${offset + batch.length}...`);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ snapshotId, documents: batch })
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Scenario indexing failed on batch ${batchNumber}/${batchTotal}: ${response.status} ${response.statusText}${detail ? ` ${detail}` : ""}`);
    }
    const result = await response.json().catch(() => undefined) as { indexed?: number; skipped?: number } | undefined;
    log(`Indexed batch ${batchNumber}/${batchTotal}: ${result?.indexed ?? batch.length} indexed, ${result?.skipped ?? 0} skipped.`);
  }

  return { snapshotId, documentCount: documents.length, indexed: true };
}

function endpointUrl(indexUrl: string | undefined, siteUrl: string | undefined) {
  if (indexUrl?.trim()) return scenarioIndexEndpoint(indexUrl.trim());
  if (!siteUrl?.trim()) return undefined;
  return scenarioIndexEndpoint(siteUrl.trim());
}

function scenarioIndexEndpoint(value: string) {
  const url = new URL(value);
  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = defaultEndpointPath;
  }
  return url.toString();
}

async function main() {
  console.error(`Loading tournament data from ${dataPath}...`);
  const data = JSON.parse(readFileSync(dataPath, "utf8")) as TournamentData;
  const result = await generateAndMaybeIndexScenarios(data, process.env, generateScenarioDocuments, { log: console.error });
  const action = result.indexed ? "Indexed" : "Generated";
  console.log(`${action} ${result.documentCount} scenario document(s) for ${result.snapshotId}.`);
  if (!result.indexed && result.skippedReason) {
    console.log(`Scenario vector indexing skipped: ${result.skippedReason}.`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
