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

export async function generateAndMaybeIndexScenarios(
  data: TournamentData,
  env = process.env,
  generateDocuments: ScenarioDocumentGenerator = generateScenarioDocuments
): Promise<ScenarioIndexResult> {
  const documents = generateDocuments(data);
  const snapshotId = documents[0]?.metadata.snapshotId ?? "unknown";
  const endpoint = endpointUrl(env.SCENARIO_INDEX_URL, env.SCENARIO_SITE_URL);
  const token = env.SCENARIO_INDEX_TOKEN?.trim();

  if (!endpoint || !token) {
    const skippedReason = "SCENARIO_INDEX_URL/SCENARIO_SITE_URL or SCENARIO_INDEX_TOKEN is not configured";
    if (env.SCENARIO_INDEX_REQUIRED === "1") throw new Error(skippedReason);
    return { snapshotId, documentCount: documents.length, indexed: false, skippedReason };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ snapshotId, documents })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Scenario indexing failed: ${response.status} ${response.statusText}${detail ? ` ${detail}` : ""}`);
  }

  return { snapshotId, documentCount: documents.length, indexed: true };
}

function endpointUrl(indexUrl: string | undefined, siteUrl: string | undefined) {
  if (indexUrl?.trim()) return indexUrl.trim();
  if (!siteUrl?.trim()) return undefined;
  return new URL(defaultEndpointPath, siteUrl.trim()).toString();
}

async function main() {
  const data = JSON.parse(readFileSync(dataPath, "utf8")) as TournamentData;
  const result = await generateAndMaybeIndexScenarios(data);
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
