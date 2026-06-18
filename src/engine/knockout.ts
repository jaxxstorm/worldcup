import type { MatchStage, PredictionMap, ProjectedMatch, QualifiedTeam, TournamentData } from "../types";
import { getAppliedScore } from "./predictions";
import { bestThirdPlacedGroups, calculateGroupStandings, groupQualifiers, thirdPlaceSourceAssignments } from "./standings";

const knockoutOrder: MatchStage[] = ["round-of-32", "round-of-16", "quarter-final", "semi-final", "third-place", "final"];

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
      const winner = score ? pickWinner(home, away, score.home, score.away) : undefined;
      const loser = score ? pickWinner(away, home, score.away, score.home) : undefined;

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

function pickWinner(home: QualifiedTeam, away: QualifiedTeam, homeScore: number, awayScore: number) {
  if (homeScore === awayScore) return undefined;
  return homeScore > awayScore ? home : away;
}

function labelFor(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "label" in value) return String(value.label);
  return "TBD";
}
