import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tournamentData } from "../src/data/tournament.seed";
import { validateTournamentData } from "../src/data/schema";
import type { Fixture, SourceMetadata, TournamentData } from "../src/types";

const outputPath = resolve("src/data/tournament.generated.json");
const sourcePath = process.argv[2];

const data = sourcePath ? JSON.parse(readFileSync(sourcePath, "utf8")) : withGeneratedOverlays(tournamentData);
const issues = validateTournamentData(data);

if (issues.length > 0) {
  console.error("Tournament data failed validation:");
  for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
  process.exit(1);
}

writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);

function withGeneratedOverlays(seedData: TournamentData): TournamentData {
  if (!existsSync(outputPath)) return seedData;

  const existing = JSON.parse(readFileSync(outputPath, "utf8")) as TournamentData;
  const data = structuredClone(seedData) as TournamentData;
  const existingFixtures = new Map(existing.fixtures.map((fixture) => [fixture.id, fixture]));

  data.fixtures = data.fixtures.map((fixture) => mergeFixtureOverlay(fixture, existingFixtures.get(fixture.id)));
  data.sources = mergeSources(data.sources, existing.sources);
  data.generatedAt = latestTimestamp(data.generatedAt, existing.generatedAt);

  if (existing.statLeaderboards) {
    data.statLeaderboards = existing.statLeaderboards;
  }

  return data;
}

function mergeFixtureOverlay(fixture: Fixture, existing?: Fixture): Fixture {
  if (!existing?.result || existing.status !== "completed") return fixture;
  if (fixture.status === "completed") return fixture;

  return {
    ...fixture,
    status: "completed",
    result: existing.result,
    sourceResult: existing.sourceResult
  };
}

function mergeSources(baseSources: SourceMetadata[], existingSources: SourceMetadata[]) {
  const seen = new Set<string>();
  return [...baseSources, ...existingSources].filter((source) => {
    const key = `${source.name}\n${source.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function latestTimestamp(left: string, right: string) {
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}
