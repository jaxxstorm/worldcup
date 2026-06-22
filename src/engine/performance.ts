import type { Fixture, FixtureId, GroupId, PredictionMap, Score, StandingRow, Team, TeamId, TournamentData } from "../types";
import { calculateGroupStandings } from "./standings";

export type PerformanceStatus = "overperforming" | "underperforming" | "on-track" | "unknown";
export type PerformanceMode = "raw" | "per-match" | "group-delta";
export type FixturePerformanceSource = "final" | "prediction";
export type FixturePerformanceResult = "win" | "draw" | "loss";

export const FIFA_RANK_SEED_RATING_BASE = 2200;
export const FIFA_RANK_SEED_RATING_STEP = 6;
export const ELO_EXPECTED_RESULT_SCALE = 400;

export interface PerformanceRow extends StandingRow {
  group: GroupId;
  currentRank: number;
  fifaRanking?: number;
  expectedOverallRank?: number;
  expectedGroupRank?: number;
  performanceDelta?: number;
  performanceStatus: PerformanceStatus;
}

export interface FixturePerformanceEntry {
  fixtureId: FixtureId;
  matchNumber: number;
  group: GroupId;
  teamId: TeamId;
  opponentId: TeamId;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  result: FixturePerformanceResult;
  resultPoints: number;
  fifaRanking: number;
  opponentFifaRanking: number;
  rankingGap: number;
  teamSeedRating: number;
  opponentSeedRating: number;
  actualResult: number;
  expectedResult: number;
  successScore: number;
  source: FixturePerformanceSource;
}

export interface FixturePerformanceSummary {
  teamId: TeamId;
  group: GroupId;
  fifaRanking: number;
  fixtures: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  actualPoints: number;
  actualResultTotal: number;
  expectedResultTotal: number;
  totalSuccessScore: number;
  finalCount: number;
  predictionCount: number;
}

export function calculatePerformanceRows(data: TournamentData, predictions: PredictionMap, mode: PerformanceMode = "raw"): PerformanceRow[] {
  const teamById = new Map(data.teams.map((team) => [team.id, team]));
  const standings = calculateGroupStandings(data, predictions);
  const expectedOverallRanks = expectedOverallRankings(data);
  const expectedGroupRanks = expectedGroupRankings(data);
  const rows = (Object.entries(standings) as Array<[GroupId, StandingRow[]]>)
    .flatMap(([group, groupRows]) => groupRows.map((row) => ({ group, row })))
    .sort((left, right) => comparePerformanceEntries(left, right, teamById, expectedGroupRanks, mode));

  return rows.map(({ group, row }, index) => {
    const currentRank = index + 1;
    const fifaRanking = teamById.get(row.teamId)?.fifaRanking;
    const expectedOverallRank = expectedOverallRanks.get(row.teamId);
    const expectedGroupRank = expectedGroupRanks.get(row.teamId);
    const performanceDelta = mode === "group-delta"
      ? expectedGroupRank === undefined ? undefined : expectedGroupRank - row.rank
      : expectedOverallRank === undefined ? undefined : expectedOverallRank - currentRank;

    return {
      ...row,
      group,
      currentRank,
      fifaRanking,
      expectedOverallRank,
      expectedGroupRank,
      performanceDelta,
      performanceStatus: performanceStatus(performanceDelta)
    };
  });
}

export function calculateFixturePerformanceEntries(data: TournamentData, predictions: PredictionMap): FixturePerformanceEntry[] {
  const teamById = new Map(data.teams.map((team) => [team.id, team]));

  return data.fixtures
    .flatMap((fixture) => fixturePerformanceEntries(fixture, predictions, teamById))
    .sort(compareFixturePerformanceEntries(teamById));
}

export function calculateFixturePerformanceSummaries(data: TournamentData, predictions: PredictionMap): FixturePerformanceSummary[] {
  const teamById = new Map(data.teams.map((team) => [team.id, team]));
  const entries = calculateFixturePerformanceEntries(data, predictions);
  const summaries = new Map<TeamId, FixturePerformanceSummary>();

  for (const entry of entries) {
    const current = summaries.get(entry.teamId);
    if (!current) {
      summaries.set(entry.teamId, {
        teamId: entry.teamId,
        group: entry.group,
        fifaRanking: entry.fifaRanking,
        fixtures: 1,
        won: entry.result === "win" ? 1 : 0,
        drawn: entry.result === "draw" ? 1 : 0,
        lost: entry.result === "loss" ? 1 : 0,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference: entry.goalDifference,
        actualPoints: entry.resultPoints,
        actualResultTotal: entry.actualResult,
        expectedResultTotal: entry.expectedResult,
        totalSuccessScore: entry.successScore,
        finalCount: entry.source === "final" ? 1 : 0,
        predictionCount: entry.source === "prediction" ? 1 : 0
      });
      continue;
    }

    current.fixtures += 1;
    current.won += entry.result === "win" ? 1 : 0;
    current.drawn += entry.result === "draw" ? 1 : 0;
    current.lost += entry.result === "loss" ? 1 : 0;
    current.goalsFor += entry.goalsFor;
    current.goalsAgainst += entry.goalsAgainst;
    current.goalDifference += entry.goalDifference;
    current.actualPoints += entry.resultPoints;
    current.actualResultTotal += entry.actualResult;
    current.expectedResultTotal += entry.expectedResult;
    current.totalSuccessScore += entry.successScore;
    current.finalCount += entry.source === "final" ? 1 : 0;
    current.predictionCount += entry.source === "prediction" ? 1 : 0;
  }

  return Array.from(summaries.values()).sort((left, right) => (
    right.totalSuccessScore - left.totalSuccessScore ||
    right.actualResultTotal - left.actualResultTotal ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    left.expectedResultTotal - right.expectedResultTotal ||
    left.fifaRanking - right.fifaRanking ||
    compareTeamName(left.teamId, right.teamId, teamById)
  ));
}

function comparePerformanceEntries(
  left: { group: GroupId; row: StandingRow },
  right: { group: GroupId; row: StandingRow },
  teamById: Map<TeamId, Team>,
  expectedGroupRanks: Map<TeamId, number>,
  mode: PerformanceMode
) {
  if (mode === "group-delta") {
    return (
      groupDelta(right.row, expectedGroupRanks) - groupDelta(left.row, expectedGroupRanks) ||
      compareRawRows(left.row, right.row, teamById) ||
      left.group.localeCompare(right.group)
    );
  }

  if (mode === "per-match") {
    return comparePerMatchRows(left.row, right.row, teamById) || left.group.localeCompare(right.group);
  }

  return compareRawRows(left.row, right.row, teamById) || left.group.localeCompare(right.group);
}

function fixturePerformanceEntries(
  fixture: Fixture,
  predictions: PredictionMap,
  teamById: Map<TeamId, Team>
): FixturePerformanceEntry[] {
  if (fixture.stage !== "group" || !fixture.group) return [];
  if (typeof fixture.home !== "string" || typeof fixture.away !== "string") return [];

  const source: FixturePerformanceSource = fixture.result ? "final" : "prediction";
  const score = fixture.result ?? predictions[fixture.id];
  if (!isCompleteScore(score)) return [];

  const homeTeam = teamById.get(fixture.home);
  const awayTeam = teamById.get(fixture.away);
  if (!homeTeam?.fifaRanking || !awayTeam?.fifaRanking) return [];

  return [
    buildFixturePerformanceEntry(fixture, source, homeTeam, awayTeam, score.home, score.away),
    buildFixturePerformanceEntry(fixture, source, awayTeam, homeTeam, score.away, score.home)
  ];
}

function buildFixturePerformanceEntry(
  fixture: Fixture,
  source: FixturePerformanceSource,
  team: Team,
  opponent: Team,
  goalsFor: number,
  goalsAgainst: number
): FixturePerformanceEntry {
  const resultPoints = goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0;
  const rankingGap = team.fifaRanking! - opponent.fifaRanking!;
  const teamSeedRating = fifaRankSeedRating(team.fifaRanking!);
  const opponentSeedRating = fifaRankSeedRating(opponent.fifaRanking!);
  const result = fixtureResult(goalsFor, goalsAgainst);
  const actualResult = fixtureActualResult(result);
  const expectedResult = eloExpectedResult(teamSeedRating, opponentSeedRating);

  return {
    fixtureId: fixture.id,
    matchNumber: fixture.matchNumber,
    group: fixture.group!,
    teamId: team.id,
    opponentId: opponent.id,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    result,
    resultPoints,
    fifaRanking: team.fifaRanking!,
    opponentFifaRanking: opponent.fifaRanking!,
    rankingGap,
    teamSeedRating,
    opponentSeedRating,
    actualResult,
    expectedResult,
    successScore: fixtureSuccessScore(actualResult, expectedResult),
    source
  };
}

export function fifaRankSeedRating(fifaRanking: number) {
  return FIFA_RANK_SEED_RATING_BASE - ((fifaRanking - 1) * FIFA_RANK_SEED_RATING_STEP);
}

export function eloExpectedResult(teamSeedRating: number, opponentSeedRating: number) {
  return 1 / (1 + (10 ** ((opponentSeedRating - teamSeedRating) / ELO_EXPECTED_RESULT_SCALE)));
}

export function fixtureActualResult(result: FixturePerformanceResult) {
  if (result === "win") return 1;
  if (result === "draw") return 0.5;
  return 0;
}

export function fixtureSuccessScore(actualResult: number, expectedResult: number) {
  return (actualResult - expectedResult) * 3;
}

function fixtureResult(goalsFor: number, goalsAgainst: number): FixturePerformanceResult {
  if (goalsFor > goalsAgainst) return "win";
  if (goalsFor === goalsAgainst) return "draw";
  return "loss";
}

function isCompleteScore(score: Score | undefined): score is Score {
  return score !== undefined && Number.isFinite(score.home) && Number.isFinite(score.away);
}

function compareFixturePerformanceEntries(teamById: Map<TeamId, Team>) {
  return (left: FixturePerformanceEntry, right: FixturePerformanceEntry) => (
    right.successScore - left.successScore ||
    right.actualResult - left.actualResult ||
    right.goalDifference - left.goalDifference ||
    left.opponentFifaRanking - right.opponentFifaRanking ||
    left.matchNumber - right.matchNumber ||
    compareTeamName(left.teamId, right.teamId, teamById)
  );
}

function compareRawRows(left: StandingRow, right: StandingRow, teamById: Map<TeamId, Team>) {
  return (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    compareFairPlay(left, right) ||
    compareFifaRanking(left.teamId, right.teamId, teamById) ||
    compareTeamName(left.teamId, right.teamId, teamById)
  );
}

function comparePerMatchRows(left: StandingRow, right: StandingRow, teamById: Map<TeamId, Team>) {
  return (
    perMatch(right.points, right.played) - perMatch(left.points, left.played) ||
    perMatch(right.goalDifference, right.played) - perMatch(left.goalDifference, left.played) ||
    perMatch(right.goalsFor, right.played) - perMatch(left.goalsFor, left.played) ||
    compareFairPlayPerMatch(left, right) ||
    compareFifaRanking(left.teamId, right.teamId, teamById) ||
    compareTeamName(left.teamId, right.teamId, teamById)
  );
}

function perMatch(value: number, played: number) {
  return played > 0 ? value / played : 0;
}

function groupDelta(row: StandingRow, expectedGroupRanks: Map<TeamId, number>) {
  return (expectedGroupRanks.get(row.teamId) ?? row.rank) - row.rank;
}

function expectedOverallRankings(data: TournamentData) {
  const ranks = new Map<TeamId, number>();

  data.teams
    .filter((team) => team.group && team.fifaRanking)
    .slice()
    .sort((left, right) => (left.fifaRanking ?? Number.MAX_SAFE_INTEGER) - (right.fifaRanking ?? Number.MAX_SAFE_INTEGER) || left.name.localeCompare(right.name))
    .forEach((team, index) => ranks.set(team.id, index + 1));

  return ranks;
}

function expectedGroupRankings(data: TournamentData) {
  const ranks = new Map<TeamId, number>();
  const groups = data.teams.reduce<Partial<Record<GroupId, Team[]>>>((grouped, team) => {
    if (!team.group) return grouped;
    grouped[team.group] = [...(grouped[team.group] ?? []), team];
    return grouped;
  }, {});

  for (const teams of Object.values(groups)) {
    teams
      ?.slice()
      .sort((left, right) => (left.fifaRanking ?? Number.MAX_SAFE_INTEGER) - (right.fifaRanking ?? Number.MAX_SAFE_INTEGER) || left.name.localeCompare(right.name))
      .forEach((team, index) => ranks.set(team.id, index + 1));
  }

  return ranks;
}

function compareFairPlay(left: StandingRow, right: StandingRow) {
  if (!Number.isFinite(left.fairPlayPoints) || !Number.isFinite(right.fairPlayPoints)) return 0;
  return left.fairPlayPoints! - right.fairPlayPoints!;
}

function compareFairPlayPerMatch(left: StandingRow, right: StandingRow) {
  if (!Number.isFinite(left.fairPlayPoints) || !Number.isFinite(right.fairPlayPoints)) return 0;
  return perMatch(left.fairPlayPoints!, left.played) - perMatch(right.fairPlayPoints!, right.played);
}

function compareFifaRanking(leftTeamId: TeamId, rightTeamId: TeamId, teamById: Map<TeamId, Team>) {
  const left = teamById.get(leftTeamId)?.fifaRanking;
  const right = teamById.get(rightTeamId)?.fifaRanking;
  if (!left || !right) return 0;
  return left - right;
}

function compareTeamName(leftTeamId: TeamId, rightTeamId: TeamId, teamById: Map<TeamId, Team>) {
  const left = teamById.get(leftTeamId)?.name ?? leftTeamId;
  const right = teamById.get(rightTeamId)?.name ?? rightTeamId;
  return left.localeCompare(right);
}

function performanceStatus(delta: number | undefined): PerformanceStatus {
  if (delta === undefined) return "unknown";
  if (delta > 0) return "overperforming";
  if (delta < 0) return "underperforming";
  return "on-track";
}
