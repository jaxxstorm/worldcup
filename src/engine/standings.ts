import type { GroupId, PredictionMap, StandingRow, TeamId, TournamentData } from "../types";
import { getAppliedScore } from "./predictions";

export function calculateGroupStandings(data: TournamentData, predictions: PredictionMap): Record<GroupId, StandingRow[]> {
  const groups = Object.fromEntries(
    Array.from(new Set(data.teams.map((team) => team.group).filter(Boolean))).map((group) => [group, []])
  ) as Record<GroupId, StandingRow[]>;

  for (const team of data.teams) {
    if (!team.group) continue;
    groups[team.group].push(emptyRow(team.id));
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
    groups[group] = groups[group]
      .sort((left, right) => sortRows(left, right))
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }

  return groups;
}

export function groupQualifiers(standings: Record<GroupId, StandingRow[]>) {
  const qualifiers = new Map<string, TeamId | undefined>();

  for (const [group, rows] of Object.entries(standings) as Array<[GroupId, StandingRow[]]>) {
    qualifiers.set(`1${group}`, rows[0]?.teamId);
    qualifiers.set(`2${group}`, rows[1]?.teamId);
  }

  bestThirdPlacedGroups(standings).forEach((group) => {
    qualifiers.set(`3${group}`, standings[group][2]?.teamId);
  });

  return qualifiers;
}

export function bestThirdPlacedGroups(standings: Record<GroupId, StandingRow[]>): GroupId[] {
  return (Object.entries(standings) as Array<[GroupId, StandingRow[]]>)
    .flatMap(([group, rows]) => {
      const row = rows[2];
      return row ? [{ group, row }] : [];
    })
    .sort((left, right) => {
      const comparison = sortRows(left.row, right.row);
      return comparison || left.group.localeCompare(right.group);
    })
    .slice(0, 8)
    .map((entry) => entry.group);
}

export function thirdPlaceSourceAssignments(sources: string[], bestThirdGroups: GroupId[]): Map<string, string> {
  const uniqueThirdPlaceSources = Array.from(new Set(sources.filter(isAmbiguousThirdPlaceSource)));

  if (bestThirdGroups.length < uniqueThirdPlaceSources.length) {
    return new Map();
  }

  // FIFA's 2026 format uses a combination table for third-place teams; the
  // generated local schedule stores only generic third-place source labels, so
  // assign the projected third-place groups deterministically in fixture order.
  return new Map(uniqueThirdPlaceSources.map((source, index) => [source, `3${bestThirdGroups[index]}`]));
}

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

function sortRows(left: StandingRow, right: StandingRow) {
  return (
    right.points - left.points ||
    right.goalDifference - left.goalDifference ||
    right.goalsFor - left.goalsFor ||
    left.teamId.localeCompare(right.teamId)
  );
}
