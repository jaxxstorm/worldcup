import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Fixture, Score, SourceMetadata, TournamentData } from "../src/types";
import { validateTournamentData } from "../src/data/schema";

interface ResultEntry {
  fixtureId?: string;
  matchNumber?: number;
  home: number;
  away: number;
  status?: string;
}

interface ResultFeed {
  source?: Partial<SourceMetadata>;
  results?: ResultEntry[];
}

export interface MergeResult {
  data: TournamentData;
  changed: boolean;
  imported: number;
}

const outputPath = resolve("src/data/tournament.generated.json");

export function mergeResultFeed(baseData: TournamentData, feed: ResultFeed | TournamentData, fallbackSource: SourceMetadata): MergeResult {
  const incoming = extractResultEntries(feed);
  const source = normalizeSource(feed, fallbackSource);
  const data = structuredClone(baseData) as TournamentData;
  let changed = false;
  let imported = 0;

  for (const entry of incoming) {
    const fixture = findFixture(data.fixtures, entry);
    if (!fixture) throw new Error(`No fixture found for result ${describeEntry(entry)}`);
    if (!Number.isInteger(entry.home) || !Number.isInteger(entry.away) || entry.home < 0 || entry.away < 0) {
      throw new Error(`Invalid score for fixture ${fixture.id}`);
    }

    const incomingScore = { home: entry.home, away: entry.away };
    if (fixture.status === "completed") {
      if (!fixture.result || !sameScore(fixture.result, incomingScore)) {
        throw new Error(`Incoming result conflicts with completed fixture ${fixture.id}`);
      }
      continue;
    }

    fixture.status = "completed";
    fixture.result = incomingScore;
    fixture.sourceResult = source;
    changed = true;
    imported += 1;
  }

  if (changed) {
    data.generatedAt = source.accessedAt;
    data.sources = appendSource(data.sources, source);
    assertValid(data);
  }

  return { data, changed, imported };
}

export async function loadResultSource(source: string): Promise<unknown> {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    return response.json();
  }

  return JSON.parse(readFileSync(resolve(source), "utf8"));
}

function extractResultEntries(feed: ResultFeed | TournamentData): ResultEntry[] {
  if ("results" in feed && Array.isArray(feed.results)) {
    return feed.results.filter((entry) => !entry.status || entry.status === "completed");
  }

  if ("fixtures" in feed && Array.isArray(feed.fixtures)) {
    return feed.fixtures
      .filter((fixture) => fixture.status === "completed" && fixture.result)
      .map((fixture) => ({
        fixtureId: fixture.id,
        matchNumber: fixture.matchNumber,
        home: fixture.result!.home,
        away: fixture.result!.away
      }));
  }

  throw new Error("Result source must contain a results array or normalized fixtures array");
}

function normalizeSource(feed: ResultFeed | TournamentData, fallback: SourceMetadata): SourceMetadata {
  const fromFeed = "source" in feed ? feed.source : undefined;
  const source = fromFeed ?? fallback;
  return {
    name: source.name ?? fallback.name,
    url: source.url ?? fallback.url,
    accessedAt: source.accessedAt ?? fallback.accessedAt,
    notes: source.notes ?? fallback.notes
  };
}

function findFixture(fixtures: Fixture[], entry: ResultEntry): Fixture | undefined {
  if (entry.fixtureId) return fixtures.find((fixture) => fixture.id === entry.fixtureId);
  if (entry.matchNumber) return fixtures.find((fixture) => fixture.matchNumber === entry.matchNumber);
  throw new Error("Result entry must include fixtureId or matchNumber");
}

function appendSource(sources: SourceMetadata[], source: SourceMetadata): SourceMetadata[] {
  if (sources.some((candidate) => candidate.url === source.url && candidate.name === source.name)) return sources;
  return [...sources, source];
}

function sameScore(left: Score, right: Score): boolean {
  return left.home === right.home && left.away === right.away;
}

function describeEntry(entry: ResultEntry): string {
  return entry.fixtureId ? `fixtureId=${entry.fixtureId}` : `matchNumber=${entry.matchNumber ?? "unknown"}`;
}

function assertValid(data: TournamentData) {
  const issues = validateTournamentData(data);
  if (issues.length === 0) return;

  const details = issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
  throw new Error(`Updated tournament data failed validation:\n${details}`);
}

async function main() {
  const sourceUrl = process.env.RESULTS_SOURCE_URL ?? process.argv[2];
  if (!sourceUrl) {
    console.log("RESULTS_SOURCE_URL is not configured; skipping result refresh.");
    return;
  }

  const source: SourceMetadata = {
    name: process.env.RESULTS_SOURCE_NAME ?? "Configured World Cup result feed",
    url: sourceUrl,
    accessedAt: new Date().toISOString(),
    notes: process.env.RESULTS_SOURCE_NOTES ?? "Used by scheduled result refresh."
  };

  const currentData = JSON.parse(readFileSync(outputPath, "utf8")) as TournamentData;
  const feed = (await loadResultSource(sourceUrl)) as ResultFeed | TournamentData;
  const result = mergeResultFeed(currentData, feed, source);

  if (!result.changed) {
    console.log("No new completed results found.");
    return;
  }

  writeFileSync(outputPath, `${JSON.stringify(result.data, null, 2)}\n`);
  console.log(`Imported ${result.imported} completed result(s) into ${outputPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
