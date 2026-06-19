import type { MatchStage, PredictionMap, ProjectedMatch, QualifiedTeam, Score, TournamentData } from "../types";
import { getAppliedScore } from "./predictions";
import { bestThirdPlacedGroups, calculateGroupStandings, groupQualifiers, thirdPlaceSourceAssignments } from "./standings";

const knockoutOrder: MatchStage[] = ["round-of-32", "round-of-16", "quarter-final", "semi-final", "third-place", "final"];

export interface DrawSide {
  id: "left" | "right";
  label: string;
  matches: ProjectedMatch[];
}

export function projectTournament(data: TournamentData, predictions: PredictionMap): ProjectedMatch[] {
  const standings = calculateGroupStandings(data, predictions);
  const qualifiers = groupQualifiers(standings);
  const thirdPlaceAssignments = thirdPlaceSourceAssignments(data.fixtures.flatMap((fixture) => [labelFor(fixture.home), labelFor(fixture.away)]), bestThirdPlacedGroups(standings));
  const winners = new Map<string, QualifiedTeam>();
  const losers = new Map<string, QualifiedTeam>();
  const projected: ProjectedMatch[] = [];

  for (const stage of knockoutOrder) {
    for (const fixture of data.fixtures.filter((match) => match.stage === stage)) {
      const home = resolveSource(labelFor(fixture.home), qualifiers, winners, losers, thirdPlaceAssignments);
      const away = resolveSource(labelFor(fixture.away), qualifiers, winners, losers, thirdPlaceAssignments);
      const score = getAppliedScore(fixture, predictions);
      const winner = score ? pickWinner(home, away, score) : undefined;
      const loser = score ? pickLoser(home, away, score) : undefined;

      if (winner) winners.set(fixture.id, winner);
      if (loser) losers.set(fixture.id, loser);
      projected.push({
        fixtureId: fixture.id,
        stage,
        matchNumber: fixture.matchNumber,
        date: fixture.date,
        venueId: fixture.venueId,
        homeSource: labelFor(fixture.home),
        awaySource: labelFor(fixture.away),
        home,
        away,
        winner
      });
    }
  }

  return projected;
}

export function resolveSource(
  source: string,
  qualifiers: Map<string, string | undefined>,
  winners: Map<string, QualifiedTeam>,
  losers: Map<string, QualifiedTeam>,
  thirdPlaceAssignments = new Map<string, string>()
): QualifiedTeam {
  const assignedThirdPlaceSource = thirdPlaceAssignments.get(source);
  if (assignedThirdPlaceSource) {
    const teamId = qualifiers.get(assignedThirdPlaceSource);
    return { slot: assignedThirdPlaceSource, teamId, label: assignedThirdPlaceSource };
  }

  if (qualifiers.has(source)) {
    const teamId = qualifiers.get(source);
    return { slot: source, teamId, label: source };
  }

  const winnerMatch = source.match(/^Winner (m\d{3})$/);
  if (winnerMatch) return winners.get(winnerMatch[1]) ?? { slot: source, label: source };

  const loserMatch = source.match(/^Loser (m\d{3})$/);
  if (loserMatch) return losers.get(loserMatch[1]) ?? { slot: source, label: source };

  return { slot: source, label: source };
}

export function drawSidesForProjection(projection: ProjectedMatch[]): DrawSide[] {
  const roundOf32 = projection
    .filter((match) => match.stage === "round-of-32")
    .sort((left, right) => left.matchNumber - right.matchNumber);
  const splitIndex = Math.ceil(roundOf32.length / 2);

  return [
    { id: "left", label: "Left Side", matches: roundOf32.slice(0, splitIndex) },
    { id: "right", label: "Right Side", matches: roundOf32.slice(splitIndex) }
  ];
}

function pickWinner(home: QualifiedTeam, away: QualifiedTeam, score: Score) {
  if (score.home > score.away) return home;
  if (score.away > score.home) return away;
  if (score.winner === "home") return home;
  if (score.winner === "away") return away;
  return undefined;
}

function pickLoser(home: QualifiedTeam, away: QualifiedTeam, score: Score) {
  const winner = pickWinner(home, away, score);
  if (!winner) return undefined;
  return winner === home ? away : home;
}

function labelFor(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "label" in value) return String(value.label);
  return "TBD";
}
