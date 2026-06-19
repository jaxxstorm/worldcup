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
  decision?: Score["decision"];
  winner?: Score["winner"];
  status?: string;
}

interface ResultFeed {
  source?: Partial<SourceMetadata>;
  results?: ResultEntry[];
}

interface FootballDataMatch {
  utcDate?: string;
  status?: string;
  homeTeam?: { name?: string; shortName?: string; tla?: string };
  awayTeam?: { name?: string; shortName?: string; tla?: string };
  score?: { fullTime?: { home?: number | null; away?: number | null } };
}

interface FootballDataFeed {
  matches?: FootballDataMatch[];
}

interface FifaLocalizedDescription {
  Description?: string;
}

interface FifaTeam {
  Score?: number | null;
  IdCountry?: string;
  TeamName?: FifaLocalizedDescription[];
  Abbreviation?: string;
  ShortClubName?: string;
}

interface FifaMatch {
  MatchNumber?: number;
  MatchStatus?: number;
  ResultType?: number;
  Date?: string;
  Home?: FifaTeam | null;
  Away?: FifaTeam | null;
  HomeTeamScore?: number | null;
  AwayTeamScore?: number | null;
}

interface FifaCalendarFeed {
  Results?: FifaMatch[];
}

export interface MergeResult {
  data: TournamentData;
  changed: boolean;
  imported: number;
}

const outputPath = resolve("src/data/tournament.generated.json");

export function mergeResultFeed(baseData: TournamentData, feed: ResultFeed | TournamentData | FootballDataFeed | FifaCalendarFeed, fallbackSource: SourceMetadata): MergeResult {
  const incoming = extractResultEntries(feed, baseData);
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

    const incomingScore = normalizeIncomingScore(fixture, entry);
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
    const headers = new Headers();
    const token = process.env.RESULTS_SOURCE_TOKEN ?? process.env.FOOTBALL_DATA_API_TOKEN;
    if (token) headers.set("X-Auth-Token", token);

    const response = await fetch(source, { headers });
    if (!response.ok) throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    return response.json();
  }

  return JSON.parse(readFileSync(resolve(source), "utf8"));
}

function extractResultEntries(feed: ResultFeed | TournamentData | FootballDataFeed | FifaCalendarFeed, baseData: TournamentData): ResultEntry[] {
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
        away: fixture.result!.away,
        decision: fixture.result!.decision,
        winner: fixture.result!.winner
      }));
  }

  if ("matches" in feed && Array.isArray(feed.matches)) {
    return feed.matches.flatMap((match) => footballDataMatchToResult(match, baseData));
  }

  if ("Results" in feed && Array.isArray(feed.Results)) {
    return feed.Results.flatMap((match) => fifaMatchToResult(match, baseData));
  }

  throw new Error("Result source must contain a results array, normalized fixtures array, football-data.org matches array, or FIFA calendar Results array");
}

function normalizeSource(feed: ResultFeed | TournamentData | FootballDataFeed | FifaCalendarFeed, fallback: SourceMetadata): SourceMetadata {
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

function fifaMatchToResult(match: FifaMatch, data: TournamentData): ResultEntry[] {
  if (match.ResultType !== 1 && match.MatchStatus !== 0) return [];

  const home = match.HomeTeamScore ?? match.Home?.Score;
  const away = match.AwayTeamScore ?? match.Away?.Score;
  if (!Number.isInteger(home) || !Number.isInteger(away)) return [];

  const fixture = findFixtureByFifaTeams(data, match);
  if (!fixture) {
    throw new Error(`No fixture found for FIFA match ${describeFifaTeam(match.Home)} vs ${describeFifaTeam(match.Away)}`);
  }

  return [{ fixtureId: fixture.id, home: home!, away: away! }];
}

function findFixtureByFifaTeams(data: TournamentData, match: FifaMatch): Fixture | undefined {
  const homeNames = fifaTeamKeys(match.Home);
  const awayNames = fifaTeamKeys(match.Away);
  if (homeNames.size === 0 || awayNames.size === 0) return undefined;

  return data.fixtures.find((fixture) => {
    if (fixture.stage !== "group" || typeof fixture.home !== "string" || typeof fixture.away !== "string") return false;

    const homeTeam = data.teams.find((team) => team.id === fixture.home);
    const awayTeam = data.teams.find((team) => team.id === fixture.away);
    return Boolean(homeTeam && awayTeam && homeNames.has(teamKey(homeTeam.name)) && awayNames.has(teamKey(awayTeam.name)));
  });
}

function fifaTeamKeys(team: FifaTeam | null | undefined): Set<string> {
  return new Set([
    team?.ShortClubName,
    team?.Abbreviation,
    team?.IdCountry,
    ...(team?.TeamName?.map((name) => name.Description) ?? [])
  ].filter((value): value is string => Boolean(value)).map(teamKey));
}

function footballDataMatchToResult(match: FootballDataMatch, data: TournamentData): ResultEntry[] {
  if (match.status !== "FINISHED" && match.status !== "AWARDED") return [];

  const home = match.score?.fullTime?.home;
  const away = match.score?.fullTime?.away;
  if (!Number.isInteger(home) || !Number.isInteger(away)) return [];

  const fixture = findFixtureByTeamsAndDate(data, match);
  if (!fixture) {
    throw new Error(`No fixture found for football-data.org match ${match.homeTeam?.name ?? "unknown"} vs ${match.awayTeam?.name ?? "unknown"}`);
  }

  return [{ fixtureId: fixture.id, home: home!, away: away! }];
}

function findFixtureByTeamsAndDate(data: TournamentData, match: FootballDataMatch): Fixture | undefined {
  const homeNames = footballTeamKeys(match.homeTeam);
  const awayNames = footballTeamKeys(match.awayTeam);
  const matchDate = match.utcDate?.slice(0, 10);

  return data.fixtures.find((fixture) => {
    if (fixture.stage !== "group" || typeof fixture.home !== "string" || typeof fixture.away !== "string") return false;
    if (matchDate && fixture.date.slice(0, 10) !== matchDate) return false;

    const homeTeam = data.teams.find((team) => team.id === fixture.home);
    const awayTeam = data.teams.find((team) => team.id === fixture.away);
    return Boolean(homeTeam && awayTeam && homeNames.has(teamKey(homeTeam.name)) && awayNames.has(teamKey(awayTeam.name)));
  });
}

function footballTeamKeys(team: FootballDataMatch["homeTeam"]): Set<string> {
  return new Set([team?.name, team?.shortName, team?.tla].filter((value): value is string => Boolean(value)).map(teamKey));
}

function teamKey(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();

  return TEAM_KEY_ALIASES[normalized] ?? normalized;
}

const TEAM_KEY_ALIASES: Record<string, string> = {
  congodr: "drcongo",
  iriran: "iran",
  korea: "southkorea",
  korearepublic: "southkorea",
  usa: "unitedstates"
};

function appendSource(sources: SourceMetadata[], source: SourceMetadata): SourceMetadata[] {
  if (sources.some((candidate) => candidate.url === source.url && candidate.name === source.name)) return sources;
  return [...sources, source];
}

function sameScore(left: Score, right: Score): boolean {
  return left.home === right.home && left.away === right.away && left.decision === right.decision && left.winner === right.winner;
}

function normalizeIncomingScore(fixture: Fixture, entry: ResultEntry): Score {
  const score: Score = {
    home: entry.home,
    away: entry.away,
    ...(entry.decision && entry.decision !== "regular" ? { decision: entry.decision } : {}),
    ...(entry.winner ? { winner: entry.winner } : {})
  };

  if (fixture.stage === "group") {
    if (score.decision || score.winner) throw new Error(`Group result ${fixture.id} cannot include knockout tiebreakers`);
    return score;
  }

  if (score.decision && score.decision !== "aet" && score.decision !== "penalties") {
    throw new Error(`Invalid knockout decision for fixture ${fixture.id}`);
  }
  if (score.winner && score.winner !== "home" && score.winner !== "away") {
    throw new Error(`Invalid knockout winner for fixture ${fixture.id}`);
  }
  if (score.home === score.away && (score.decision !== "penalties" || !score.winner)) {
    throw new Error(`Tied knockout result ${fixture.id} must include penalties and a winner`);
  }
  if (score.home !== score.away && score.decision === "penalties") {
    throw new Error(`Penalty result ${fixture.id} must have a tied score`);
  }

  return {
    home: score.home,
    away: score.away,
    ...(score.decision ? { decision: score.decision } : {}),
    ...(score.decision === "penalties" && score.winner ? { winner: score.winner } : {})
  };
}

function describeEntry(entry: ResultEntry): string {
  return entry.fixtureId ? `fixtureId=${entry.fixtureId}` : `matchNumber=${entry.matchNumber ?? "unknown"}`;
}

function describeFifaTeam(team: FifaTeam | null | undefined): string {
  return team?.ShortClubName ?? team?.TeamName?.find((name) => name.Description)?.Description ?? team?.Abbreviation ?? "unknown";
}

function assertValid(data: TournamentData) {
  const issues = validateTournamentData(data);
  if (issues.length === 0) return;

  const details = issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
  throw new Error(`Updated tournament data failed validation:\n${details}`);
}

async function main() {
  const sourceUrl = process.env.RESULTS_SOURCE_URL ?? process.argv[2] ?? "https://api.fifa.com/api/v3/calendar/matches?language=en&count=200&idCompetition=17&idSeason=285023";
  if (!sourceUrl) {
    console.log("RESULTS_SOURCE_URL is not configured; skipping result refresh.");
    return;
  }
  if (sourceUrl.includes("api.football-data.org") && !process.env.RESULTS_SOURCE_TOKEN && !process.env.FOOTBALL_DATA_API_TOKEN) {
    console.log("Football-data.org source requires FOOTBALL_DATA_API_TOKEN; skipping result refresh.");
    return;
  }

  const source: SourceMetadata = {
    name: process.env.RESULTS_SOURCE_NAME ?? "FIFA World Cup 2026 match calendar API",
    url: sourceUrl,
    accessedAt: new Date().toISOString(),
    notes: process.env.RESULTS_SOURCE_NOTES ?? "Official FIFA calendar endpoint used by scheduled result refresh."
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
