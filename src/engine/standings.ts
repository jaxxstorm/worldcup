import type { GroupId, PredictionMap, StandingRow, TeamId, ThirdPlaceStandingRow, TournamentData } from "../types";
import { getAppliedScore } from "./predictions";

export function calculateGroupStandings(data: TournamentData, predictions: PredictionMap): Record<GroupId, StandingRow[]> {
  const groups = Object.fromEntries(
    Array.from(new Set(data.teams.map((team) => team.group).filter(Boolean))).map((group) => [group, []])
  ) as Record<GroupId, StandingRow[]>;

  for (const team of data.teams) {
    if (!team.group) continue;
    groups[team.group].push({
      ...emptyRow(team.id),
      fairPlayPoints: team.fairPlayPoints
    });
  }

  for (const fixture of data.fixtures.filter((match) => match.stage === "group")) {
    if (!fixture.group || typeof fixture.home !== "string" || typeof fixture.away !== "string") continue;
    const score = getAppliedScore(fixture, predictions);
    if (!score) continue;

    const groupRows = groups[fixture.group];
    const home = groupRows.find((row) => row.teamId === fixture.home);
    const away = groupRows.find((row) => row.teamId === fixture.away);
    if (!home || !away) continue;

    applyResult(home, score.home, score.away);
    applyResult(away, score.away, score.home);
  }

  for (const group of Object.keys(groups) as GroupId[]) {
    groups[group] = rankGroupRows(groups[group], data, predictions, group)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }

  return groups;
}

export function groupQualifiers(standings: Record<GroupId, StandingRow[]>, data?: TournamentData) {
  const qualifiers = new Map<string, TeamId | undefined>();

  for (const [group, rows] of Object.entries(standings) as Array<[GroupId, StandingRow[]]>) {
    qualifiers.set(`1${group}`, rows[0]?.teamId);
    qualifiers.set(`2${group}`, rows[1]?.teamId);
  }

  bestThirdPlacedGroups(standings, data).forEach((group) => {
    qualifiers.set(`3${group}`, standings[group][2]?.teamId);
  });

  return qualifiers;
}

export function bestThirdPlacedGroups(standings: Record<GroupId, StandingRow[]>, data?: TournamentData): GroupId[] {
  return thirdPlaceRankings(standings, data)
    .slice(0, 8)
    .map((row) => row.group);
}

export function thirdPlaceRankings(standings: Record<GroupId, StandingRow[]>, data?: TournamentData): ThirdPlaceStandingRow[] {
  return (Object.entries(standings) as Array<[GroupId, StandingRow[]]>)
    .flatMap(([group, rows]) => {
      const row = rows[2];
      return row ? [{ group, row }] : [];
    })
    .sort((left, right) => {
      const comparison = compareOverallRows(left.row, right.row, data);
      return comparison || left.group.localeCompare(right.group);
    })
    .map((entry, index) => ({
      ...entry.row,
      group: entry.group,
      thirdPlaceRank: index + 1,
      qualifies: index < 8
    }));
}

export function thirdPlaceSourceAssignments(sources: string[], bestThirdGroups: GroupId[]): Map<string, string> {
  const uniqueThirdPlaceSources = Array.from(new Set(sources.filter(isAmbiguousThirdPlaceSource)));

  if (bestThirdGroups.length < uniqueThirdPlaceSources.length) {
    return new Map();
  }

  const officialAssignments = OFFICIAL_THIRD_PLACE_SOURCE_ASSIGNMENTS[bestThirdGroups.slice().sort().join("")];
  if (officialAssignments) {
    return new Map(Object.entries(officialAssignments));
  }

  return new Map(uniqueThirdPlaceSources.map((source, index) => [source, `3${bestThirdGroups[index]}`]));
}

const OFFICIAL_THIRD_PLACE_SOURCE_ASSIGNMENTS: Record<string, Record<string, string>> = {
  ABCDFGHK: {
    "3A/B/C/D/F": "3C",
    "3C/D/F/G/H": "3F",
    "3C/E/F/H/I": "3H",
    "3E/H/I/J/K": "3K",
    "3B/E/F/I/J": "3B",
    "3A/E/H/I/J": "3A",
    "3E/F/G/I/J": "3G",
    "3D/E/I/J/L": "3D"
  }
};

function isAmbiguousThirdPlaceSource(source: string) {
  return /^3[A-L](?:\/[A-L])+$/.test(source);
}

function emptyRow(teamId: TeamId): StandingRow {
  return {
    teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    fairPlayPoints: undefined,
    rank: 0
  };
}

function applyResult(row: StandingRow, goalsFor: number, goalsAgainst: number) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.won += 1;
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

function rankGroupRows(rows: StandingRow[], data: TournamentData, predictions: PredictionMap, group: GroupId): StandingRow[] {
  const pointGroups = partitionEqual(rows.sort((left, right) => right.points - left.points), (left, right) => left.points === right.points);
  return pointGroups.flatMap((pointGroup) => resolveTiedRows(pointGroup, data, predictions, group));
}

function resolveTiedRows(rows: StandingRow[], data: TournamentData, predictions: PredictionMap, group: GroupId): StandingRow[] {
  if (rows.length < 2) return rows;

  const headToHeadRows = headToHeadStandings(rows, data, predictions, group);
  const ranked = [...rows].sort((left, right) => compareHeadToHeadRows(headToHeadRows.get(left.teamId)!, headToHeadRows.get(right.teamId)!));
  const stillTied = partitionEqual(ranked, (left, right) => compareHeadToHeadRows(headToHeadRows.get(left.teamId)!, headToHeadRows.get(right.teamId)!) === 0);

  if (stillTied.length === 1 && stillTied[0].length === rows.length) {
    return ranked.sort((left, right) => compareOverallRows(left, right, data));
  }

  return stillTied.flatMap((tiedRows) => tiedRows.length === 1 ? tiedRows : resolveTiedRows(tiedRows, data, predictions, group));
}

function partitionEqual<T>(items: T[], isEqual: (left: T, right: T) => boolean): T[][] {
  return items.reduce<T[][]>((groups, item) => {
    const current = groups.at(-1);
    if (!current || !isEqual(current[0], item)) groups.push([item]);
    else current.push(item);
    return groups;
  }, []);
}

function headToHeadStandings(rows: StandingRow[], data: TournamentData, predictions: PredictionMap, group: GroupId) {
  const teamIds = new Set(rows.map((row) => row.teamId));
  const standings = new Map(rows.map((row) => [row.teamId, emptyRow(row.teamId)]));

  for (const fixture of data.fixtures.filter((match) => match.group === group)) {
    if (typeof fixture.home !== "string" || typeof fixture.away !== "string") continue;
    if (!teamIds.has(fixture.home) || !teamIds.has(fixture.away)) continue;

    const score = getAppliedScore(fixture, predictions);
    if (!score) continue;

    applyResult(standings.get(fixture.home)!, score.home, score.away);
    applyResult(standings.get(fixture.away)!, score.away, score.home);
  }

  return standings;
}

function compareHeadToHeadRows(left: StandingRow, right: StandingRow) {
  return (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor
  );
}

function compareOverallRows(left: StandingRow, right: StandingRow, data?: TournamentData) {
  const fairPlay = data ? compareFairPlay(left.teamId, right.teamId, data) : 0;
  const ranking = data ? compareFifaRanking(left.teamId, right.teamId, data) : 0;
  const drawOrder = data ? compareTeamOrder(left.teamId, right.teamId, data) : left.teamId.localeCompare(right.teamId);

  return (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    fairPlay ||
    ranking ||
    drawOrder
  );
}

function compareFairPlay(leftTeamId: TeamId, rightTeamId: TeamId, data: TournamentData) {
  const left = data.teams.find((team) => team.id === leftTeamId)?.fairPlayPoints;
  const right = data.teams.find((team) => team.id === rightTeamId)?.fairPlayPoints;
  if (!Number.isFinite(left) || !Number.isFinite(right)) return 0;
  return left! - right!;
}

function compareFifaRanking(leftTeamId: TeamId, rightTeamId: TeamId, data: TournamentData) {
  const left = data.teams.find((team) => team.id === leftTeamId)?.fifaRanking;
  const right = data.teams.find((team) => team.id === rightTeamId)?.fifaRanking;
  if (!left || !right) return 0;
  return left - right;
}

function compareTeamOrder(leftTeamId: TeamId, rightTeamId: TeamId, data: TournamentData) {
  return data.teams.findIndex((team) => team.id === leftTeamId) - data.teams.findIndex((team) => team.id === rightTeamId);
}
