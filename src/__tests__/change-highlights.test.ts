import { describe, expect, it } from "vitest";
import { tournamentData } from "../data/tournament";
import { projectTournament } from "../engine/knockout";
import { calculateGroupStandings, thirdPlaceRankings } from "../engine/standings";
import type { PredictionMap, TournamentData } from "../types";
import { capturePredictionChangeSnapshot, changeLabel, matchChange, participantChange, standingRowChange, thirdPlaceRowChange } from "../ui/change-highlights";

function editableGroupTournamentData(): TournamentData {
  const data = structuredClone(tournamentData) as TournamentData;

  for (const fixture of data.fixtures) {
    if (fixture.stage !== "group") continue;
    fixture.status = "scheduled";
    delete fixture.result;
    delete fixture.sourceResult;
  }

  return data;
}

function groupPredictionSet(data = tournamentData): PredictionMap {
  return Object.fromEntries(
    data.fixtures
      .filter((fixture) => fixture.stage === "group" && fixture.status === "scheduled")
      .map((fixture) => [fixture.id, { home: 1, away: 0 }])
  );
}

describe("prediction change highlights", () => {
  it("does not report changes without a previous prediction snapshot", () => {
    const row = calculateGroupStandings(tournamentData, {}).A[0];
    const match = projectTournament(tournamentData, {})[0];

    expect(standingRowChange(undefined, row, row.rank <= 2)).toBeUndefined();
    expect(matchChange(undefined, match)).toBeUndefined();
  });

  it("reports changed standings rows after a prediction changes table values", () => {
    const data = editableGroupTournamentData();
    const fixture = data.fixtures.find((candidate) => candidate.stage === "group" && candidate.group === "A")!;
    const before = capturePredictionChangeSnapshot(data, {});
    const predictions: PredictionMap = { [fixture.id]: { home: 3, away: 0 } };
    const standings = calculateGroupStandings(data, predictions);
    const qualifyingThirdPlaceTeams = new Set(thirdPlaceRankings(standings, data).filter((row) => row.qualifies).map((row) => row.teamId));
    const changedRow = standings.A.find((row) => row.teamId === fixture.home)!;
    const change = standingRowChange(before, changedRow, changedRow.rank <= 2 || qualifyingThirdPlaceTeams.has(changedRow.teamId));

    expect(change).toEqual(expect.objectContaining({ changed: true }));
    expect(change?.previousSummary).toContain("Previous:");
    expect(changeLabel(change)).toMatch(/Changed|\+|-|0/);
  });

  it("reports changed third-place qualification rows", () => {
    const data = editableGroupTournamentData();
    const before = capturePredictionChangeSnapshot(data, {});
    const predictions = groupPredictionSet(data);
    const changedThirdPlaceRow = thirdPlaceRankings(calculateGroupStandings(data, predictions), data).find((row) => {
      const previous = before.thirdPlaces.get(row.teamId);
      return previous && (previous.thirdPlaceRank !== row.thirdPlaceRank || previous.qualifies !== row.qualifies || previous.points !== row.points);
    })!;

    expect(thirdPlaceRowChange(before, changedThirdPlaceRow)).toEqual(expect.objectContaining({
      changed: true,
      previousSummary: expect.stringContaining("Previous:")
    }));
  });

  it("reports changed bracket matches and participants after a knockout prediction", () => {
    const basePredictions = groupPredictionSet();
    const before = capturePredictionChangeSnapshot(tournamentData, basePredictions);
    const nextProjection = projectTournament(tournamentData, {
      ...basePredictions,
      m073: { home: 2, away: 0 }
    });
    const downstreamMatch = nextProjection.find((match) => match.fixtureId === "m090")!;

    expect(matchChange(before, downstreamMatch)).toEqual(expect.objectContaining({
      changed: true,
      previousHome: expect.any(String)
    }));
    expect(participantChange(before, downstreamMatch, "home")).toEqual(expect.objectContaining({
      changed: true,
      previous: expect.any(String)
    }));
  });
});
