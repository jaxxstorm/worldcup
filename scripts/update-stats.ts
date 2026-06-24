import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { SourceMetadata, StatLeaderboard, StatLeaderboardEntry, Team, TournamentData } from "../src/types";
import { validateTournamentData } from "../src/data/schema";

interface FootballDataScorer {
  player?: { name?: string };
  team?: { name?: string; shortName?: string; tla?: string };
  goals?: number | null;
  assists?: number | null;
  penalties?: number | null;
}

interface FootballDataTeamRef {
  name?: string;
  shortName?: string;
  tla?: string;
}

interface FootballDataFairPlayEntry {
  team?: FootballDataTeamRef;
  teamId?: string;
  yellowCards?: number | null;
  secondYellowCards?: number | null;
  yellowRedCards?: number | null;
  redCards?: number | null;
  fairPlayPoints?: number | null;
  points?: number | null;
}

interface FootballDataScorersFeed {
  scorers?: FootballDataScorer[];
  fairPlay?: FootballDataFairPlayEntry[];
  discipline?: FootballDataFairPlayEntry[];
}

export interface StatsMergeResult {
  data: TournamentData;
  changed: boolean;
  imported: number;
  summary: string[];
}

const outputPath = resolve("src/data/tournament.generated.json");

export function mergeStatsFeed(baseData: TournamentData, feed: FootballDataScorersFeed, source: SourceMetadata): StatsMergeResult {
  const data = structuredClone(baseData) as TournamentData;
  const statLeaderboards = feed.scorers ? buildStatLeaderboards(data, feed, source) : data.statLeaderboards ?? [];
  const statLeaderboardsChanged = !sameStatLeaderboards(data.statLeaderboards ?? [], statLeaderboards);
  const fairPlayChanges = mergeFairPlayData(data, feed);
  const changed = statLeaderboardsChanged || fairPlayChanges.length > 0;

  if (!changed) return { data, changed: false, imported: 0, summary: [] };

  data.statLeaderboards = statLeaderboards;
  data.generatedAt = source.accessedAt;
  data.sources = appendSource(data.sources, source);
  assertValid(data);

  return {
    data,
    changed,
    imported: (statLeaderboardsChanged ? statLeaderboards.reduce((count, leaderboard) => count + leaderboard.entries.length, 0) : 0) + fairPlayChanges.length,
    summary: [
      ...(statLeaderboardsChanged ? statLeaderboards.map(formatLeaderboardSummary) : []),
      ...fairPlayChanges.map((change) => `Fair play: ${change.teamName} ${formatPointsChange(change.previous, change.next)}`)
    ]
  };
}

export async function loadStatsSource(source: string): Promise<unknown> {
  if (/^https?:\/\//.test(source)) {
    const token = firstEnvValue("STATS_SOURCE_TOKEN", "FOOTBALL_DATA_API_TOKEN");
    if (!token && source.includes("api.football-data.org")) {
      throw new Error("Football-data.org stats source requires FOOTBALL_DATA_API_TOKEN or STATS_SOURCE_TOKEN.");
    }

    const headers = new Headers();
    if (token) headers.set("X-Auth-Token", token);

    const response = await fetch(source, { headers });
    if (!response.ok) throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    return response.json();
  }

  return JSON.parse(readFileSync(resolve(source), "utf8"));
}

function firstEnvValue(...keys: string[]): string | undefined {
  return keys.map((key) => process.env[key]?.trim()).find((value): value is string => Boolean(value));
}

function buildStatLeaderboards(data: TournamentData, feed: FootballDataScorersFeed, source: SourceMetadata): StatLeaderboard[] {
  const scorers = feed.scorers ?? [];
  return [
    buildLeaderboard(data, scorers, source, "goals", "Top Goal Scorers", "Goals", (scorer) => scorer.goals, 10),
    buildLeaderboard(data, scorers, source, "assists", "Top Assists", "Assists", (scorer) => scorer.assists, 10),
    buildLeaderboard(data, scorers, source, "penalties", "Penalty Goals", "Pens", (scorer) => scorer.penalties, 10)
  ];
}

function mergeFairPlayData(data: TournamentData, feed: FootballDataScorersFeed): Array<{ teamName: string; previous?: number; next: number }> {
  const entries = feed.fairPlay ?? feed.discipline ?? [];
  const changes: Array<{ teamName: string; previous?: number; next: number }> = [];

  for (const entry of entries) {
    const team = entry.teamId ? data.teams.find((candidate) => candidate.id === entry.teamId) : findTeam(data.teams, entry.team);
    if (!team) continue;

    const points = fairPlayPoints(entry);
    if (!Number.isFinite(points) || points < 0) continue;
    if (team.fairPlayPoints === points) continue;

    changes.push({ teamName: team.name, previous: team.fairPlayPoints, next: points });
    team.fairPlayPoints = points;
  }

  return changes;
}

function formatLeaderboardSummary(leaderboard: StatLeaderboard): string {
  const leader = leaderboard.entries[0];
  const leaderSummary = leader ? ` leader ${leader.player} (${leader.value})` : " no entries";
  return `${leaderboard.label}: ${leaderboard.entries.length} entr${leaderboard.entries.length === 1 ? "y" : "ies"},${leaderSummary}`;
}

function formatPointsChange(previous: number | undefined, next: number): string {
  return previous === undefined ? `set to ${next}` : `${previous} -> ${next}`;
}

function fairPlayPoints(entry: FootballDataFairPlayEntry): number {
  const explicit = entry.fairPlayPoints ?? entry.points;
  if (Number.isFinite(explicit)) return explicit!;

  const yellowCards = entry.yellowCards ?? 0;
  const secondYellowCards = entry.secondYellowCards ?? entry.yellowRedCards ?? 0;
  const redCards = entry.redCards ?? 0;
  return yellowCards + (secondYellowCards * 3) + (redCards * 4);
}

function buildLeaderboard(
  data: TournamentData,
  scorers: FootballDataScorer[],
  source: SourceMetadata,
  id: string,
  label: string,
  valueLabel: string,
  valueFor: (scorer: FootballDataScorer) => number | null | undefined,
  limit: number
): StatLeaderboard {
  const entries = scorers
    .flatMap((scorer): Omit<StatLeaderboardEntry, "rank">[] => {
      const value = valueFor(scorer);
      const player = scorer.player?.name;
      if (!player || !Number.isFinite(value) || !value || value < 1) return [];

      const team = findTeam(data.teams, scorer.team);
      return [{
        player,
        ...(team ? { teamId: team.id } : {}),
        value,
        ...(scorer.team?.name ? { detail: scorer.team.name } : {})
      }];
    })
    .sort((left, right) => right.value - left.value || left.player.localeCompare(right.player))
    .slice(0, limit)
    .map((entry, index) => ({ rank: index + 1, ...entry }));

  return { id, label, valueLabel, source, entries };
}

function sameStatLeaderboards(left: StatLeaderboard[], right: StatLeaderboard[]): boolean {
  return JSON.stringify(left.map(stableLeaderboardForComparison)) === JSON.stringify(right.map(stableLeaderboardForComparison));
}

function stableLeaderboardForComparison(leaderboard: StatLeaderboard) {
  return {
    ...leaderboard,
    source: {
      name: leaderboard.source.name,
      url: leaderboard.source.url,
      notes: leaderboard.source.notes
    }
  };
}

function findTeam(teams: Team[], incoming: FootballDataScorer["team"] | FootballDataTeamRef | undefined): Team | undefined {
  const keys = new Set([incoming?.name, incoming?.shortName, incoming?.tla].filter((value): value is string => Boolean(value)).map(teamKey));
  if (keys.size === 0) return undefined;

  return teams.find((team) => keys.has(teamKey(team.name)) || keys.has(teamKey(team.id)));
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
  bosniaherzegovina: "bosniaandherzegovina",
  bosnia: "bosniaandherzegovina",
  capeverdeislands: "caboverde",
  congodr: "drcongo",
  coteivoire: "cotedivoire",
  korearepublic: "southkorea",
  korea: "southkorea",
  usa: "unitedstates"
};

function appendSource(sources: SourceMetadata[], source: SourceMetadata): SourceMetadata[] {
  if (sources.some((candidate) => candidate.url === source.url && candidate.name === source.name)) return sources;
  return [...sources, source];
}

function assertValid(data: TournamentData) {
  const issues = validateTournamentData(data);
  if (issues.length === 0) return;

  const details = issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
  throw new Error(`Updated tournament data failed validation:\n${details}`);
}

async function main() {
  const sourceUrl = process.env.STATS_SOURCE_URL ?? process.argv[2] ?? "https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=100";
  const source: SourceMetadata = {
    name: process.env.STATS_SOURCE_NAME ?? "football-data.org World Cup scorers API",
    url: sourceUrl,
    accessedAt: new Date().toISOString(),
    notes: process.env.STATS_SOURCE_NOTES ?? "football-data.org scorers endpoint normalized into static tournament stat leaderboards."
  };

  const currentData = JSON.parse(readFileSync(outputPath, "utf8")) as TournamentData;
  const feed = (await loadStatsSource(sourceUrl)) as FootballDataScorersFeed;
  const result = mergeStatsFeed(currentData, feed, source);

  if (!result.changed) {
    console.log("No stat leaderboard changes found.");
    return;
  }

  writeFileSync(outputPath, `${JSON.stringify(result.data, null, 2)}\n`);
  console.log(`Imported ${result.imported} stat update${result.imported === 1 ? "" : "s"} into ${outputPath}`);
  for (const line of result.summary) {
    console.log(`- ${line}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
