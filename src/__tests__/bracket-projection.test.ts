import { describe, expect, it } from "vitest";
import { tournamentData } from "../data/tournament";
import { projectTournament } from "../engine/knockout";
import { bestThirdPlacedGroups, calculateGroupStandings, thirdPlaceRankings, thirdPlaceSourceAssignments } from "../engine/standings";
import type { Fixture, GroupId, PredictionMap, TeamRef, TournamentData } from "../types";

function groupPredictionSet(data = tournamentData): PredictionMap {
  return Object.fromEntries(
    data.fixtures
      .filter((fixture) => fixture.stage === "group" && fixture.status === "scheduled")
      .map((fixture) => [fixture.id, { home: 1, away: 0 }])
  );
}

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

function sourceLabel(source: TeamRef): string {
  return typeof source === "string" ? source : source.label;
}

function expectedThirdPlaceSlots(data: TournamentData, predictions: PredictionMap) {
  const standings = calculateGroupStandings(data, predictions);
  const bestGroups = bestThirdPlacedGroups(standings, data);
  const assignments = thirdPlaceSourceAssignments(data.fixtures.flatMap((fixture) => [sourceLabel(fixture.home), sourceLabel(fixture.away)]), bestGroups);

  return (fixture: Fixture) => {
    const slot = assignments.get(sourceLabel(fixture.away));
    const group = slot?.slice(1) as GroupId | undefined;
    return [fixture.id, slot, group ? standings[group][2]?.teamId : undefined];
  };
}

describe("bracket projection", () => {
  it("exposes current resolved teams and source labels for bracket slots", () => {
    const projection = projectTournament(tournamentData, groupPredictionSet());
    const openingRoundMatch = projection.find((match) => match.fixtureId === "m073");

    expect(openingRoundMatch?.homeSource).toBe("2A");
    expect(openingRoundMatch?.home.slot).toBe("2A");
    expect(openingRoundMatch?.home.teamId).toBeDefined();
    expect(openingRoundMatch?.date).toBeTruthy();
    expect(openingRoundMatch?.venueId).toBeTruthy();
  });

  it("preserves unresolved source labels when no team can be resolved", () => {
    const projection = projectTournament(tournamentData, {});
    const roundOf16Match = projection.find((match) => match.fixtureId === "m089");

    expect(roundOf16Match?.home.teamId).toBeUndefined();
    expect(roundOf16Match?.home.label).toBe("Winner m074");
    expect(roundOf16Match?.homeSource).toBe("Winner m074");
  });

  it("updates downstream bracket projection when knockout predictions change", () => {
    const basePredictions = groupPredictionSet();
    const firstProjection = projectTournament(tournamentData, basePredictions);
    const roundOf32Match = firstProjection.find((match) => match.fixtureId === "m073")!;
    const knockoutPredictions = {
      ...basePredictions,
      m073: { home: 2, away: 0 }
    };

    const nextProjection = projectTournament(tournamentData, knockoutPredictions);
    const roundOf16Match = nextProjection.find((match) => match.fixtureId === "m090");

    expect(roundOf32Match.home.teamId).toBeDefined();
    expect(roundOf16Match?.home.teamId).toBe(roundOf32Match.home.teamId);
  });

  it("uses penalty winners to advance tied knockout predictions", () => {
    const basePredictions = groupPredictionSet();
    const firstProjection = projectTournament(tournamentData, basePredictions);
    const roundOf32Match = firstProjection.find((match) => match.fixtureId === "m073")!;
    const knockoutPredictions = {
      ...basePredictions,
      m073: { home: 1, away: 1, decision: "penalties", winner: "away" } as const
    };

    const nextProjection = projectTournament(tournamentData, knockoutPredictions);
    const roundOf16Match = nextProjection.find((match) => match.fixtureId === "m090");

    expect(roundOf16Match?.home.teamId).toBe(roundOf32Match.away.teamId);
  });

  it("does not advance a tied knockout prediction before a penalty winner is selected", () => {
    const basePredictions = groupPredictionSet();
    const knockoutPredictions = {
      ...basePredictions,
      m073: { home: 1, away: 1, decision: "aet" } as const
    };

    const nextProjection = projectTournament(tournamentData, knockoutPredictions);
    const roundOf16Match = nextProjection.find((match) => match.fixtureId === "m090");

    expect(roundOf16Match?.home.teamId).toBeUndefined();
    expect(roundOf16Match?.home.label).toBe("Winner m073");
  });

  it("selects the eight best third-place groups from completed projected standings", () => {
    const data = editableGroupTournamentData();
    const standings = calculateGroupStandings(data, groupPredictionSet(data));
    const thirdPlaceGroups = thirdPlaceRankings(standings, data).filter((row) => row.qualifies).map((row) => row.group);

    expect(bestThirdPlacedGroups(standings, data)).toEqual(thirdPlaceGroups);
  });

  it("resolves round-of-32 third-place placeholders once all best third-place groups are knowable", () => {
    const data = editableGroupTournamentData();
    const predictions = groupPredictionSet(data);
    const standings = calculateGroupStandings(data, predictions);
    const thirdPlaceGroups = thirdPlaceRankings(standings, data).filter((row) => row.qualifies).map((row) => row.group);
    const projection = projectTournament(data, predictions);
    const thirdPlaceMatches = projection.filter((match) => match.stage === "round-of-32" && match.awaySource.includes("/"));
    const thirdPlaceFixtures = data.fixtures.filter((fixture) => fixture.stage === "round-of-32" && sourceLabel(fixture.away).includes("/"));

    expect(thirdPlaceGroups).toEqual(bestThirdPlacedGroups(standings, data));
    expect(thirdPlaceMatches.map((match) => [match.fixtureId, match.away.slot, match.away.teamId])).toEqual(
      thirdPlaceFixtures.map(expectedThirdPlaceSlots(data, predictions))
    );
  });

  it("resolves round-of-32 third-place placeholders from current standings before the group stage is complete", () => {
    const projection = projectTournament(tournamentData, {});
    const thirdPlaceMatches = projection.filter((match) => match.stage === "round-of-32" && match.awaySource.includes("/"));
    const thirdPlaceFixtures = tournamentData.fixtures.filter((fixture) => fixture.stage === "round-of-32" && sourceLabel(fixture.away).includes("/"));

    expect(thirdPlaceMatches.map((match) => [match.fixtureId, match.away.slot, match.away.teamId])).toEqual(
      thirdPlaceFixtures.map(expectedThirdPlaceSlots(tournamentData, {}))
    );
  });

  it("keeps third-place assignments unresolved only when fewer than eight groups exist", () => {
    expect(thirdPlaceSourceAssignments(["3A/B/C", "3D/E/F"], ["A"] as GroupId[])).toEqual(new Map());
  });
});
