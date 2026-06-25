import { describe, expect, it } from "vitest";
import { projectTournament } from "../engine/knockout";
import { calculateGroupStandings, thirdPlaceRankings } from "../engine/standings";
import type { PredictionMap, TournamentData } from "../types";
import { capturePredictionChangeSnapshot, changeLabel, matchChange, participantChange, standingRowChange, standingValueChange, thirdPlaceRowChange } from "../ui/change-highlights";
import { completeGroupPredictions, makeTournamentData } from "./fixtures/tournament";

function editableGroupTournamentData(): TournamentData {
  return makeTournamentData();
}

function groupPredictionSet(data: TournamentData): PredictionMap {
  return completeGroupPredictions(data);
}

describe("prediction change highlights", () => {
  it("does not report changes without a previous prediction snapshot", () => {
    const data = makeTournamentData();
    const row = calculateGroupStandings(data, {}).A[0];
    const match = projectTournament(data, {})[0];

    expect(standingRowChange(undefined, row)).toBeUndefined();
    expect(matchChange(undefined, match)).toBeUndefined();
  });

  it("reports value changes without row changes when standings rank is unchanged", () => {
    const data = editableGroupTournamentData();
    const before = capturePredictionChangeSnapshot(data, {});
    const statOnlyChange = data.fixtures
      .filter((fixture) => fixture.stage === "group")
      .map((fixture) => {
        const predictions: PredictionMap = { [fixture.id]: { home: 1, away: 0 } };
        const row = calculateGroupStandings(data, predictions)[fixture.group!].find((candidate) => candidate.teamId === fixture.home)!;
        return {
          rowChange: standingRowChange(before, row),
          pointsChange: standingValueChange(before, row, "points"),
          goalDifferenceChange: standingValueChange(before, row, "goalDifference")
        };
      })
      .find((change) => !change.rowChange && change.pointsChange && change.goalDifferenceChange);

    expect(statOnlyChange?.rowChange).toBeUndefined();
    expect(statOnlyChange?.pointsChange).toEqual(expect.objectContaining({
      changed: true,
      previousSummary: expect.stringContaining("Previous:")
    }));
    expect(statOnlyChange?.goalDifferenceChange).toEqual(expect.objectContaining({
      changed: true,
      previousSummary: expect.stringContaining("Previous:")
    }));
    expect(changeLabel(statOnlyChange?.pointsChange)).toBe("+3");
  });

  it("reports changed standings rows after a prediction changes table rank", () => {
    const data = editableGroupTournamentData();
    const before = capturePredictionChangeSnapshot(data, {});
    const rankChange = data.fixtures
      .filter((fixture) => fixture.stage === "group")
      .map((fixture) => {
        const predictions: PredictionMap = { [fixture.id]: { home: 0, away: 3 } };
        const row = calculateGroupStandings(data, predictions)[fixture.group!].find((candidate) => candidate.teamId === fixture.away)!;
        return standingRowChange(before, row);
      })
      .find(Boolean);

    expect(rankChange).toEqual(expect.objectContaining({ changed: true }));
    expect(rankChange?.previousSummary).toContain("Previous:");
    expect(changeLabel(rankChange)).toMatch(/Changed|\+|-/);
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
    const data = makeTournamentData();
    const basePredictions = groupPredictionSet(data);
    const before = capturePredictionChangeSnapshot(data, basePredictions);
    const nextProjection = projectTournament(data, {
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
