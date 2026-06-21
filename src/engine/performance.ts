import type { Fixture, FixtureId, GroupId, PredictionMap, Score, StandingRow, Team, TeamId, TournamentData } from "../types";
import { calculateGroupStandings } from "./standings";

export type PerformanceStatus = "overperforming" | "underperforming" | "on-track" | "unknown";
export type PerformanceMode = "raw" | "per-match" | "group-delta";
export type FixturePerformanceSource = "final" | "prediction";
export type FixturePerformanceResult = "win" | "draw" | "loss";

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
  expectedResultPoints: number;
  surprisePoints: number;
  fifaRanking: number;
  opponentFifaRanking: number;
  rankingGap: number;
  marginBonus: number;
  performanceScore: number;
  source: FixturePerformanceSource;
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
  const expectedResultPoints = expectedFixtureResultPoints(team.fifaRanking!, opponent.fifaRanking!);
  const surprisePoints = resultPoints - expectedResultPoints;
  const marginBonus = fixtureMarginBonus(goalsFor - goalsAgainst);

  return {
    fixtureId: fixture.id,
    matchNumber: fixture.matchNumber,
    group: fixture.group!,
    teamId: team.id,
    opponentId: opponent.id,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    result: goalsFor > goalsAgainst ? "win" : goalsFor === goalsAgainst ? "draw" : "loss",
    resultPoints,
    expectedResultPoints,
    surprisePoints,
    fifaRanking: team.fifaRanking!,
    opponentFifaRanking: opponent.fifaRanking!,
    rankingGap,
    marginBonus,
    performanceScore: Math.round(surprisePoints * 100 + marginBonus),
    source
  };
}

function expectedFixtureResultPoints(teamRanking: number, opponentRanking: number) {
  const rankingGap = teamRanking - opponentRanking;
  return 3 / (1 + Math.exp(rankingGap / 15));
}

function fixtureMarginBonus(goalDifference: number) {
  const cappedDifference = Math.max(-4, Math.min(4, goalDifference));
  return cappedDifference * 20;
}

function isCompleteScore(score: Score | undefined): score is Score {
  return score !== undefined && Number.isFinite(score.home) && Number.isFinite(score.away);
}

function compareFixturePerformanceEntries(teamById: Map<TeamId, Team>) {
  return (left: FixturePerformanceEntry, right: FixturePerformanceEntry) => (
    right.performanceScore - left.performanceScore ||
    right.resultPoints - left.resultPoints ||
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
