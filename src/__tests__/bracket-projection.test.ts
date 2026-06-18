import { describe, expect, it } from "vitest";
import { tournamentData } from "../data/tournament";
import { projectTournament } from "../engine/knockout";
import { bestThirdPlacedGroups, calculateGroupStandings, thirdPlaceSourceAssignments } from "../engine/standings";
import type { GroupId, PredictionMap } from "../types";

function groupPredictionSet(): PredictionMap {
  return Object.fromEntries(
    tournamentData.fixtures
      .filter((fixture) => fixture.stage === "group" && fixture.status === "scheduled")
      .map((fixture) => [fixture.id, { home: 1, away: 0 }])
  );
}

describe("bracket projection", () => {
  it("exposes current resolved teams and source labels for bracket slots", () => {
    const projection = projectTournament(tournamentData, groupPredictionSet());
    const openingRoundMatch = projection.find((match) => match.fixtureId === "m073");

    expect(openingRoundMatch?.homeSource).toBe("1A");
    expect(openingRoundMatch?.home.slot).toBe("1A");
    expect(openingRoundMatch?.home.teamId).toBeDefined();
    expect(openingRoundMatch?.date).toBeTruthy();
    expect(openingRoundMatch?.venueId).toBeTruthy();
  });

  it("preserves unresolved source labels when no team can be resolved", () => {
    const projection = projectTournament(tournamentData, {});
    const roundOf16Match = projection.find((match) => match.fixtureId === "m089");

    expect(roundOf16Match?.home.teamId).toBeUndefined();
    expect(roundOf16Match?.home.label).toBe("Winner m073");
    expect(roundOf16Match?.homeSource).toBe("Winner m073");
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
    const roundOf16Match = nextProjection.find((match) => match.fixtureId === "m089");

    expect(roundOf32Match.home.teamId).toBeDefined();
    expect(roundOf16Match?.home.teamId).toBe(roundOf32Match.home.teamId);
  });

  it("selects the eight best third-place groups from completed projected standings", () => {
    const standings = calculateGroupStandings(tournamentData, groupPredictionSet());

    expect(bestThirdPlacedGroups(standings)).toEqual(["F", "B", "G", "C", "K", "H", "J", "D"]);
  });

  it("resolves round-of-32 third-place placeholders once all best third-place groups are knowable", () => {
    const projection = projectTournament(tournamentData, groupPredictionSet());
    const thirdPlaceMatches = projection.filter((match) => match.stage === "round-of-32" && match.awaySource.includes("/"));

    expect(thirdPlaceMatches.map((match) => [match.fixtureId, match.away.slot, match.away.teamId])).toEqual([
      ["m074", "3F", "netherlands"],
      ["m075", "3B", "canada"],
      ["m078", "3G", "egypt"],
      ["m080", "3C", "morocco"],
      ["m082", "3K", "portugal"],
      ["m084", "3H", "spain"],
      ["m087", "3J", "austria"],
      ["m088", "3D", "australia"]
    ]);
  });

  it("resolves round-of-32 third-place placeholders from current standings before the group stage is complete", () => {
    const projection = projectTournament(tournamentData, {});
    const thirdPlaceMatches = projection.filter((match) => match.stage === "round-of-32" && match.awaySource.includes("/"));

    expect(bestThirdPlacedGroups(calculateGroupStandings(tournamentData, {}))).toEqual(["F", "G", "C", "K", "B", "H", "A", "E"]);
    expect(thirdPlaceMatches.every((match) => match.away.teamId && match.away.slot.startsWith("3"))).toBe(true);
  });

  it("keeps third-place assignments unresolved only when fewer than eight groups exist", () => {
    expect(thirdPlaceSourceAssignments(["3A/B/C", "3D/E/F"], ["A"] as GroupId[])).toEqual(new Map());
  });
});
