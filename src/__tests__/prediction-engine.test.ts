import { describe, expect, it } from "vitest";
import { tournamentData } from "../data/tournament";
import { projectTournament } from "../engine/knockout";
import { interpretPredictionInput, isEditableFixture, sanitizePredictions, setPrediction } from "../engine/predictions";
import { bestThirdPlacedGroups, calculateGroupStandings, thirdPlaceRankings } from "../engine/standings";
import type { PredictionMap, TournamentData } from "../types";

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

function editableGroupFixtureCount(data: TournamentData) {
  return data.fixtures.filter((fixture) => fixture.stage === "group" && fixture.status === "scheduled" && !fixture.result && !fixture.sourceResult).length;
}

function groupPredictionSet(data: TournamentData): PredictionMap {
  return Object.fromEntries(
    data.fixtures
      .filter((fixture) => fixture.stage === "group")
      .map((fixture) => [fixture.id, { home: 1, away: 0 }])
  );
}

describe("prediction engine", () => {
  it("prevents predictions from overriding completed fixtures", () => {
    const completed = tournamentData.fixtures.find((fixture) => fixture.status === "completed");
    expect(completed).toBeDefined();
    expect(isEditableFixture(completed!)).toBe(false);

    const predictions = setPrediction(tournamentData, {}, completed!.id, { home: 0, away: 99 });
    expect(predictions).toEqual({});
  });

  it("sanitizes unknown fixtures and completed fixture predictions", () => {
    const completed = tournamentData.fixtures.find((fixture) => fixture.status === "completed")!;
    const open = tournamentData.fixtures.find((fixture) => fixture.stage === "group" && fixture.status === "scheduled")!;

    expect(
      sanitizePredictions(tournamentData, {
        [completed.id]: { home: 9, away: 9 },
        [open.id]: { home: 2, away: 1 },
        missing: { home: 1, away: 1 }
      })
    ).toEqual({ [open.id]: { home: 2, away: 1 } });
  });

  it("recalculates standings from real results and predictions", () => {
    const groupAOpen = tournamentData.fixtures.find((fixture) => fixture.group === "A" && fixture.status === "scheduled")!;
    const predictions: PredictionMap = { [groupAOpen.id]: { home: 3, away: 0 } };
    const groupA = calculateGroupStandings(tournamentData, predictions).A;

    expect(groupA[0].points).toBeGreaterThanOrEqual(groupA[1].points);
    expect(groupA.some((row) => row.played > 0)).toBe(true);
  });

  it("uses FIFA ranking as the final group-stage tie-breaker when teams remain level", () => {
    const data = editableGroupTournamentData();
    const groupH = calculateGroupStandings(data, {}).H;

    expect(editableGroupFixtureCount(data)).toBe(tournamentData.fixtures.filter((fixture) => fixture.stage === "group").length);
    expect(groupH.map((row) => row.teamId)).toEqual(["spain", "uruguay", "saudi-arabia", "cape-verde"]);
  });

  it("uses fair-play points before FIFA ranking when group teams remain level", () => {
    const data = editableGroupTournamentData();
    data.teams = data.teams.map((team) => {
      if (team.id === "spain") return { ...team, fairPlayPoints: 5 };
      if (team.id === "cape-verde") return { ...team, fairPlayPoints: 1 };
      if (team.id === "saudi-arabia") return { ...team, fairPlayPoints: 7 };
      if (team.id === "uruguay") return { ...team, fairPlayPoints: 9 };
      return team;
    });
    const groupH = calculateGroupStandings(data, {}).H;

    expect(groupH.map((row) => row.teamId)).toEqual(["cape-verde", "spain", "saudi-arabia", "uruguay"]);
  });

  it("uses predicted head-to-head results before FIFA ranking for tied group teams", () => {
    const data = editableGroupTournamentData();
    const groupHFixtures = data.fixtures.filter((fixture) => fixture.group === "H");
    const fixtureKey = (home: string, away: string) => groupHFixtures.find((fixture) => fixture.home === home && fixture.away === away)!.id;
    const predictions: PredictionMap = {
      [fixtureKey("spain", "cape-verde")]: { home: 0, away: 1 },
      [fixtureKey("saudi-arabia", "uruguay")]: { home: 0, away: 0 },
      [fixtureKey("spain", "saudi-arabia")]: { home: 1, away: 0 },
      [fixtureKey("uruguay", "cape-verde")]: { home: 1, away: 0 },
      [fixtureKey("uruguay", "spain")]: { home: 0, away: 1 },
      [fixtureKey("cape-verde", "saudi-arabia")]: { home: 1, away: 0 }
    };
    const groupH = calculateGroupStandings(data, predictions).H;

    expect(groupH.map((row) => row.teamId).slice(0, 2)).toEqual(["cape-verde", "spain"]);
  });

  it("projects knockout slots deterministically", () => {
    const scheduledGroupFixtures = tournamentData.fixtures.filter((fixture) => fixture.stage === "group" && fixture.status === "scheduled");
    const predictions = Object.fromEntries(scheduledGroupFixtures.map((fixture, index) => [fixture.id, { home: index % 3, away: (index + 1) % 3 }]));

    expect(projectTournament(tournamentData, predictions)).toEqual(projectTournament(tournamentData, predictions));
    expect(projectTournament(tournamentData, predictions).some((match) => match.stage === "round-of-32" && match.home.teamId)).toBe(true);
  });

  it("ranks third-place teams from projected standings", () => {
    const data = editableGroupTournamentData();
    const standings = calculateGroupStandings(data, groupPredictionSet(data));
    const rankings = thirdPlaceRankings(standings, data);

    expect(rankings.map((row) => row.group).slice(0, 8)).toEqual(bestThirdPlacedGroups(standings, data));
    expect(rankings.slice(0, 8).every((row) => row.qualifies)).toBe(true);
    expect(rankings.slice(8).every((row) => !row.qualifies)).toBe(true);
    expect(rankings.map((row) => row.thirdPlaceRank)).toEqual(rankings.map((_, index) => index + 1));
    expect(rankings[0].points).toBeGreaterThanOrEqual(rankings[1].points);
  });

  it("keeps one-sided prediction input as a partial draft", () => {
    expect(interpretPredictionInput("2", "")).toEqual({ kind: "partial" });
    expect(interpretPredictionInput("", "1")).toEqual({ kind: "partial" });
  });

  it("interprets two prediction input values as a complete score", () => {
    expect(interpretPredictionInput("2", "1")).toEqual({ kind: "complete", score: { home: 2, away: 1 } });
  });

  it("marks tied knockout predictions as after extra time before penalties are selected", () => {
    expect(interpretPredictionInput("1", "1", false, "regular", "", true)).toEqual({
      kind: "complete",
      score: { home: 1, away: 1, decision: "aet" }
    });
  });

  it("stores a knockout penalty winner when penalties decide a tied prediction", () => {
    expect(interpretPredictionInput("1", "1", false, "penalties", "away", true)).toEqual({
      kind: "complete",
      score: { home: 1, away: 1, decision: "penalties", winner: "away" }
    });
  });

  it("interprets empty prediction input values as cleared", () => {
    expect(interpretPredictionInput("", "")).toEqual({ kind: "cleared" });
  });

  it("clears an existing prediction when one side is emptied", () => {
    expect(interpretPredictionInput("2", "", true)).toEqual({ kind: "cleared" });
  });
});
