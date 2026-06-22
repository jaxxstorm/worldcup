import { projectTournament } from "../engine/knockout";
import { calculateGroupStandings, thirdPlaceRankings } from "../engine/standings";
import type { FixtureId, PredictionMap, ProjectedMatch, QualifiedTeam, StandingRow, TeamId, ThirdPlaceStandingRow, TournamentData } from "../types";

interface StandingSnapshot {
  rank: number;
  points: number;
  goalDifference: number;
}

interface ThirdPlaceSnapshot {
  thirdPlaceRank: number;
  points: number;
  goalDifference: number;
  qualifies: boolean;
}

interface MatchSnapshot {
  home: string;
  away: string;
  winner: string;
}

export interface PredictionChangeSnapshot {
  standings: Map<TeamId, StandingSnapshot>;
  thirdPlaces: Map<TeamId, ThirdPlaceSnapshot>;
  matches: Map<FixtureId, MatchSnapshot>;
}

export interface RowChange {
  changed: boolean;
  rankDelta?: number;
  valueDelta?: number;
  previousSummary: string;
}

export interface ItemChange {
  changed: boolean;
  previous: string;
}

export interface MatchChange {
  changed: boolean;
  previousHome: string;
  previousAway: string;
  previousWinner: string;
}

export function capturePredictionChangeSnapshot(data: TournamentData, predictions: PredictionMap): PredictionChangeSnapshot {
  const standings = calculateGroupStandings(data, predictions);
  const thirdPlaces = thirdPlaceRankings(standings, data);

  return {
    standings: new Map(
      Object.values(standings).flatMap((rows) =>
        rows.map((row) => [
          row.teamId,
          {
            rank: row.rank,
            points: row.points,
            goalDifference: row.goalDifference
          }
        ])
      )
    ),
    thirdPlaces: new Map(
      thirdPlaces.map((row) => [
        row.teamId,
        {
          thirdPlaceRank: row.thirdPlaceRank,
          points: row.points,
          goalDifference: row.goalDifference,
          qualifies: row.qualifies
        }
      ])
    ),
    matches: new Map(projectTournament(data, predictions).map((match) => [match.fixtureId, snapshotMatch(match)]))
  };
}

export function standingRowChange(snapshot: PredictionChangeSnapshot | undefined, row: StandingRow): RowChange | undefined {
  const previous = snapshot?.standings.get(row.teamId);
  if (!previous) return undefined;

  const changed = previous.rank !== row.rank;

  if (!changed) return undefined;
  return {
    changed,
    rankDelta: previous.rank - row.rank,
    previousSummary: `Previous: #${previous.rank}, ${previous.points} pts, GD ${formatSignedNumber(previous.goalDifference)}`
  };
}

export function standingValueChange(snapshot: PredictionChangeSnapshot | undefined, row: StandingRow, value: "goalDifference" | "points"): RowChange | undefined {
  const previous = snapshot?.standings.get(row.teamId);
  if (!previous) return undefined;

  const previousValue = previous[value];
  const currentValue = row[value];
  if (previousValue === currentValue) return undefined;

  return {
    changed: true,
    valueDelta: currentValue - previousValue,
    previousSummary: value === "points"
      ? `Previous: ${previousValue} pts`
      : `Previous: GD ${formatSignedNumber(previousValue)}`
  };
}

export function thirdPlaceRowChange(snapshot: PredictionChangeSnapshot | undefined, row: ThirdPlaceStandingRow): RowChange | undefined {
  const previous = snapshot?.thirdPlaces.get(row.teamId);
  if (!previous) return undefined;

  const changed = previous.thirdPlaceRank !== row.thirdPlaceRank
    || previous.points !== row.points
    || previous.goalDifference !== row.goalDifference
    || previous.qualifies !== row.qualifies;

  if (!changed) return undefined;
  return {
    changed,
    rankDelta: previous.thirdPlaceRank - row.thirdPlaceRank,
    previousSummary: `Previous: #${previous.thirdPlaceRank}, ${previous.points} pts, GD ${formatSignedNumber(previous.goalDifference)}, ${qualificationLabel(previous.qualifies)}`
  };
}

export function matchChanged(snapshot: PredictionChangeSnapshot | undefined, match: ProjectedMatch): boolean {
  return Boolean(matchChange(snapshot, match));
}

export function matchChange(snapshot: PredictionChangeSnapshot | undefined, match: ProjectedMatch): MatchChange | undefined {
  const previous = snapshot?.matches.get(match.fixtureId);
  if (!previous) return undefined;

  const current = snapshotMatch(match);
  const changed = previous.home !== current.home || previous.away !== current.away || previous.winner !== current.winner;
  if (!changed) return undefined;

  return {
    changed,
    previousHome: previous.home,
    previousAway: previous.away,
    previousWinner: previous.winner
  };
}

export function participantChanged(snapshot: PredictionChangeSnapshot | undefined, match: ProjectedMatch, side: "home" | "away"): boolean {
  return Boolean(participantChange(snapshot, match, side));
}

export function participantChange(snapshot: PredictionChangeSnapshot | undefined, match: ProjectedMatch, side: "home" | "away"): ItemChange | undefined {
  const previous = snapshot?.matches.get(match.fixtureId);
  if (!previous) return undefined;

  const current = teamKey(side === "home" ? match.home : match.away, side === "home" ? match.homeSource : match.awaySource);
  if (previous[side] === current) return undefined;

  return { changed: true, previous: previous[side] };
}

export function winnerChanged(snapshot: PredictionChangeSnapshot | undefined, match: ProjectedMatch): boolean {
  return Boolean(winnerChange(snapshot, match));
}

export function winnerChange(snapshot: PredictionChangeSnapshot | undefined, match: ProjectedMatch): ItemChange | undefined {
  const previous = snapshot?.matches.get(match.fixtureId);
  if (!previous) return undefined;

  const current = teamKey(match.winner, "unresolved");
  if (previous.winner === current) return undefined;

  return { changed: true, previous: previous.winner };
}

export function changeLabel(change: RowChange | undefined): string {
  if (!change) return "";
  if (change.valueDelta !== undefined) return formatSignedNumber(change.valueDelta);
  if (!change.rankDelta) return "Changed";
  return change.rankDelta > 0 ? `+${change.rankDelta}` : String(change.rankDelta);
}

function snapshotMatch(match: ProjectedMatch): MatchSnapshot {
  return {
    home: teamKey(match.home, match.homeSource),
    away: teamKey(match.away, match.awaySource),
    winner: teamKey(match.winner, "unresolved")
  };
}

function teamKey(team: QualifiedTeam | undefined, source: string) {
  return team?.teamId ?? team?.label ?? source;
}

function qualificationLabel(qualifies: boolean) {
  return qualifies ? "qualifying" : "not qualifying";
}

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
