import type { Fixture, TeamId, TournamentData } from "../types";

export type TeamResultOutcome = "win" | "draw" | "loss";

export interface TeamRecentResult {
  fixtureId: string;
  matchNumber: number;
  date: string;
  stage: Fixture["stage"];
  opponentId: TeamId;
  goalsFor: number;
  goalsAgainst: number;
  outcome: TeamResultOutcome;
}

export function recentResultsForTeam(data: TournamentData, teamId: TeamId, limit = 5): TeamRecentResult[] {
  return data.fixtures
    .filter((fixture) => fixture.result && typeof fixture.home === "string" && typeof fixture.away === "string")
    .filter((fixture) => fixture.home === teamId || fixture.away === teamId)
    .sort((left, right) => {
      const dateComparison = Date.parse(right.date) - Date.parse(left.date);
      if (dateComparison !== 0) return dateComparison;
      return right.matchNumber - left.matchNumber;
    })
    .slice(0, limit)
    .map((fixture) => {
      const isHome = fixture.home === teamId;
      const goalsFor = isHome ? fixture.result!.home : fixture.result!.away;
      const goalsAgainst = isHome ? fixture.result!.away : fixture.result!.home;

      return {
        fixtureId: fixture.id,
        matchNumber: fixture.matchNumber,
        date: fixture.date,
        stage: fixture.stage,
        opponentId: isHome ? fixture.away as TeamId : fixture.home as TeamId,
        goalsFor,
        goalsAgainst,
        outcome: resultOutcome(goalsFor, goalsAgainst)
      };
    });
}

function resultOutcome(goalsFor: number, goalsAgainst: number): TeamResultOutcome {
  if (goalsFor > goalsAgainst) return "win";
  if (goalsFor < goalsAgainst) return "loss";
  return "draw";
}
