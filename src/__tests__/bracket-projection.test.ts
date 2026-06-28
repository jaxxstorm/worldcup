import { describe, expect, it } from "vitest";
import { teamById, tournamentData } from "../data/tournament";
import { projectTournament } from "../engine/knockout";
import { bestThirdPlacedGroups, calculateGroupStandings, thirdPlaceRankings, thirdPlaceSourceAssignments } from "../engine/standings";
import type { Fixture, GroupId, PredictionMap, TeamRef, TournamentData } from "../types";
import { completeGroupPredictions, makeTournamentData } from "./fixtures/tournament";

function groupPredictionSet(data: TournamentData): PredictionMap {
  return completeGroupPredictions(data);
}

function editableGroupTournamentData(): TournamentData {
  return makeTournamentData();
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

function projectedFixtureNames() {
  return Object.fromEntries(
    projectTournament(tournamentData, {})
      .filter((match) => match.stage === "round-of-32")
      .map((match) => [
        match.fixtureId,
        [
          match.home.teamId ? teamById.get(match.home.teamId)?.name : match.home.label,
          match.away.teamId ? teamById.get(match.away.teamId)?.name : match.away.label
        ]
      ])
  );
}

describe("bracket projection", () => {
  it("exposes current resolved teams and source labels for bracket slots", () => {
    const data = makeTournamentData();
    const projection = projectTournament(data, groupPredictionSet(data));
    const openingRoundMatch = projection.find((match) => match.fixtureId === "m073");

    expect(openingRoundMatch?.homeSource).toBe("2A");
    expect(openingRoundMatch?.home.slot).toBe("2A");
    expect(openingRoundMatch?.home.teamId).toBeDefined();
    expect(openingRoundMatch?.date).toBeTruthy();
    expect(openingRoundMatch?.venueId).toBeTruthy();
  });

  it("preserves unresolved source labels when no team can be resolved", () => {
    const projection = projectTournament(makeTournamentData(), {});
    const roundOf16Match = projection.find((match) => match.fixtureId === "m089");

    expect(roundOf16Match?.home.teamId).toBeUndefined();
    expect(roundOf16Match?.home.label).toBe("Winner m074");
    expect(roundOf16Match?.homeSource).toBe("Winner m074");
  });

  it("updates downstream bracket projection when knockout predictions change", () => {
    const data = makeTournamentData();
    const basePredictions = groupPredictionSet(data);
    const firstProjection = projectTournament(data, basePredictions);
    const roundOf32Match = firstProjection.find((match) => match.fixtureId === "m073")!;
    const knockoutPredictions = {
      ...basePredictions,
      m073: { home: 2, away: 0 }
    };

    const nextProjection = projectTournament(data, knockoutPredictions);
    const roundOf16Match = nextProjection.find((match) => match.fixtureId === "m090");

    expect(roundOf32Match.home.teamId).toBeDefined();
    expect(roundOf16Match?.home.teamId).toBe(roundOf32Match.home.teamId);
  });

  it("uses penalty winners to advance tied knockout predictions", () => {
    const data = makeTournamentData();
    const basePredictions = groupPredictionSet(data);
    const firstProjection = projectTournament(data, basePredictions);
    const roundOf32Match = firstProjection.find((match) => match.fixtureId === "m073")!;
    const knockoutPredictions = {
      ...basePredictions,
      m073: { home: 1, away: 1, decision: "penalties", winner: "away" } as const
    };

    const nextProjection = projectTournament(data, knockoutPredictions);
    const roundOf16Match = nextProjection.find((match) => match.fixtureId === "m090");

    expect(roundOf16Match?.home.teamId).toBe(roundOf32Match.away.teamId);
  });

  it("does not advance a tied knockout prediction before a penalty winner is selected", () => {
    const data = makeTournamentData();
    const basePredictions = groupPredictionSet(data);
    const knockoutPredictions = {
      ...basePredictions,
      m073: { home: 1, away: 1, decision: "aet" } as const
    };

    const nextProjection = projectTournament(data, knockoutPredictions);
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
    const data = makeTournamentData();
    const projection = projectTournament(data, {});
    const thirdPlaceMatches = projection.filter((match) => match.stage === "round-of-32" && match.awaySource.includes("/"));
    const thirdPlaceFixtures = data.fixtures.filter((fixture) => fixture.stage === "round-of-32" && sourceLabel(fixture.away).includes("/"));

    expect(thirdPlaceMatches.map((match) => [match.fixtureId, match.away.slot, match.away.teamId])).toEqual(
      thirdPlaceFixtures.map(expectedThirdPlaceSlots(data, {}))
    );
  });

  it("matches the confirmed current round-of-32 bracket for BBC-listed ties", () => {
    const fixtures = projectedFixtureNames();

    expect(fixtures.m074).toEqual(["Germany", "Paraguay"]);
    expect(fixtures.m078).toEqual(["Cote d'Ivoire", "Norway"]);
    expect(fixtures.m080).toEqual(["England", "DR Congo"]);
    expect(fixtures.m081).toEqual(["United States", "Bosnia and Herzegovina"]);
    expect(fixtures.m083).toEqual(["Portugal", "Croatia"]);
    expect(fixtures.m084).toEqual(["Spain", "Austria"]);
    expect(fixtures.m085).toEqual(["Switzerland", "Algeria"]);
    expect(fixtures.m088).toEqual(["Australia", "Egypt"]);
  });

  it("uses the official third-place combination table for qualifying group sets", () => {
    const assignments = thirdPlaceSourceAssignments(["3A/B/C/D/F", "3C/D/F/G/H", "3E/H/I/J/K"], ["A", "B", "C", "D", "F", "G", "H", "K"]);

    expect(assignments.get("3A/B/C/D/F")).toBe("3C");
    expect(assignments.get("3C/D/F/G/H")).toBe("3F");
    expect(assignments.get("3E/H/I/J/K")).toBe("3K");
  });

  it("keeps fallback third-place assignments compatible with each placeholder source", () => {
    const assignments = thirdPlaceSourceAssignments(["3E/H/I/J/K", "3A/B/C/D/F"], ["F", "E"] as GroupId[]);

    expect(assignments.get("3E/H/I/J/K")).toBe("3E");
    expect(assignments.get("3A/B/C/D/F")).toBe("3F");
  });

  it("never assigns a third-place group outside a placeholder's listed groups", () => {
    const data = makeTournamentData();
    const standings = calculateGroupStandings(data, {});
    const bestGroups = bestThirdPlacedGroups(standings, data);
    const sources = data.fixtures.flatMap((fixture) => [sourceLabel(fixture.home), sourceLabel(fixture.away)]);
    const assignments = thirdPlaceSourceAssignments(sources, bestGroups);

    for (const [source, slot] of assignments) {
      expect(source.split("/").join("")).toContain(slot.slice(1));
    }
  });

  it("keeps third-place assignments unresolved only when fewer than eight groups exist", () => {
    expect(thirdPlaceSourceAssignments(["3A/B/C", "3D/E/F"], ["A"] as GroupId[])).toEqual(new Map());
  });
});
