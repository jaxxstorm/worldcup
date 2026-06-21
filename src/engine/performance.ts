import type { GroupId, PredictionMap, StandingRow, Team, TeamId, TournamentData } from "../types";
import { calculateGroupStandings } from "./standings";

export type PerformanceStatus = "overperforming" | "underperforming" | "on-track" | "unknown";
export type PerformanceMode = "raw" | "per-match" | "group-delta";

export interface PerformanceRow extends StandingRow {
  group: GroupId;
  currentRank: number;
  fifaRanking?: number;
  expectedGroupRank?: number;
  performanceDelta?: number;
  performanceStatus: PerformanceStatus;
}

export function calculatePerformanceRows(data: TournamentData, predictions: PredictionMap, mode: PerformanceMode = "raw"): PerformanceRow[] {
  const teamById = new Map(data.teams.map((team) => [team.id, team]));
  const standings = calculateGroupStandings(data, predictions);
  const expectedGroupRanks = expectedGroupRankings(data);
  const rows = (Object.entries(standings) as Array<[GroupId, StandingRow[]]>)
    .flatMap(([group, groupRows]) => groupRows.map((row) => ({ group, row })))
    .sort((left, right) => comparePerformanceEntries(left, right, teamById, expectedGroupRanks, mode));

  return rows.map(({ group, row }, index) => {
    const currentRank = index + 1;
    const fifaRanking = teamById.get(row.teamId)?.fifaRanking;
    const expectedGroupRank = expectedGroupRanks.get(row.teamId);
    const performanceDelta = mode === "group-delta"
      ? expectedGroupRank === undefined ? undefined : expectedGroupRank - row.rank
      : fifaRanking ? fifaRanking - currentRank : undefined;

    return {
      ...row,
      group,
      currentRank,
      fifaRanking,
      expectedGroupRank,
      performanceDelta,
      performanceStatus: performanceStatus(performanceDelta)
    };
  });
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
    compareRawRows(left, right, teamById)
  );
}

function perMatch(value: number, played: number) {
  return played > 0 ? value / played : 0;
}

function groupDelta(row: StandingRow, expectedGroupRanks: Map<TeamId, number>) {
  return (expectedGroupRanks.get(row.teamId) ?? row.rank) - row.rank;
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
