import { describe, expect, it } from "vitest";
import {
  calculateFixturePerformanceEntries,
  calculateFixturePerformanceSummaries,
  calculatePerformanceRows,
  eloExpectedResult,
  fifaRankSeedRating,
  fixtureSuccessScore
} from "../engine/performance";
import type { PredictionMap, TournamentData } from "../types";

function performanceTournament(): TournamentData {
  return {
    schemaVersion: "1",
    generatedAt: "2026-06-20T00:00:00.000Z",
    sources: [],
    teams: [
      { id: "alpha", name: "Alpha", fifaCode: "ALP", group: "A", flag: "A", fifaRanking: 1 },
      { id: "beta", name: "Beta", fifaCode: "BET", group: "A", flag: "B", fifaRanking: 20 },
      { id: "gamma", name: "Gamma", fifaCode: "GAM", group: "A", flag: "G" },
      { id: "delta", name: "Delta", fifaCode: "DEL", group: "A", flag: "D", fifaRanking: 50 },
      { id: "echo", name: "Echo", fifaCode: "ECH", group: "B", flag: "E", fifaRanking: 2 },
      { id: "foxtrot", name: "Foxtrot", fifaCode: "FOX", group: "B", flag: "F", fifaRanking: 80 },
      { id: "hotel", name: "Hotel", fifaCode: "HOT", group: "C", flag: "H", fifaRanking: 90 },
      { id: "india", name: "India", fifaCode: "IND", group: "C", flag: "I", fifaRanking: 5 },
      { id: "juliet", name: "Juliet", fifaCode: "JUL", group: "C", flag: "J", fifaRanking: 70 },
      { id: "kilo", name: "Kilo", fifaCode: "KIL", group: "C", flag: "K", fifaRanking: 100 }
    ],
    venues: [{ id: "venue", name: "Venue", city: "City", region: "Region", country: "Country", timeZone: "UTC" }],
    fixtures: [
      {
        id: "alpha-beta",
        matchNumber: 1,
        stage: "group",
        group: "A",
        date: "2026-06-11T12:00:00.000Z",
        venueId: "venue",
        home: "alpha",
        away: "beta",
        status: "completed",
        result: { home: 0, away: 2 }
      },
      {
        id: "gamma-delta",
        matchNumber: 2,
        stage: "group",
        group: "A",
        date: "2026-06-12T12:00:00.000Z",
        venueId: "venue",
        home: "gamma",
        away: "delta",
        status: "scheduled"
      },
      {
        id: "alpha-gamma",
        matchNumber: 3,
        stage: "group",
        group: "A",
        date: "2026-06-13T12:00:00.000Z",
        venueId: "venue",
        home: "alpha",
        away: "gamma",
        status: "scheduled"
      },
      {
        id: "beta-delta",
        matchNumber: 8,
        stage: "group",
        group: "A",
        date: "2026-06-17T12:00:00.000Z",
        venueId: "venue",
        home: "beta",
        away: "delta",
        status: "scheduled"
      },
      {
        id: "echo-foxtrot",
        matchNumber: 4,
        stage: "group",
        group: "B",
        date: "2026-06-13T12:00:00.000Z",
        venueId: "venue",
        home: "echo",
        away: "foxtrot",
        status: "completed",
        result: { home: 0, away: 1 }
      },
      {
        id: "foxtrot-echo",
        matchNumber: 5,
        stage: "group",
        group: "B",
        date: "2026-06-14T12:00:00.000Z",
        venueId: "venue",
        home: "foxtrot",
        away: "echo",
        status: "completed",
        result: { home: 0, away: 1 }
      },
      {
        id: "hotel-india",
        matchNumber: 6,
        stage: "group",
        group: "C",
        date: "2026-06-15T12:00:00.000Z",
        venueId: "venue",
        home: "hotel",
        away: "india",
        status: "completed",
        result: { home: 2, away: 0 }
      },
      {
        id: "hotel-juliet",
        matchNumber: 7,
        stage: "group",
        group: "C",
        date: "2026-06-16T12:00:00.000Z",
        venueId: "venue",
        home: "hotel",
        away: "juliet",
        status: "completed",
        result: { home: 2, away: 0 }
      }
    ],
    knockoutSlots: []
  };
}

describe("performance analysis", () => {
  it("compares current performance rank with FIFA ranking", () => {
    const rows = calculatePerformanceRows(performanceTournament(), {});

    expect(rows.map((row) => row.teamId)).toEqual(["hotel", "beta", "echo", "foxtrot", "delta", "gamma", "kilo", "alpha", "india", "juliet"]);
    expect(rows.find((row) => row.teamId === "beta")).toMatchObject({
      currentRank: 2,
      fifaRanking: 20,
      expectedOverallRank: 4,
      performanceDelta: 2,
      performanceStatus: "overperforming"
    });
    expect(rows.find((row) => row.teamId === "alpha")).toMatchObject({
      currentRank: 8,
      fifaRanking: 1,
      expectedOverallRank: 1,
      performanceDelta: -7,
      performanceStatus: "underperforming"
    });
    expect(rows.find((row) => row.teamId === "hotel")).toMatchObject({
      currentRank: 1,
      fifaRanking: 90,
      expectedOverallRank: 8,
      performanceDelta: 7,
      performanceStatus: "overperforming"
    });
  });

  it("keeps teams with missing FIFA rankings visible", () => {
    const rows = calculatePerformanceRows(performanceTournament(), {});

    expect(rows.find((row) => row.teamId === "gamma")).toMatchObject({
      fifaRanking: undefined,
      performanceDelta: undefined,
      performanceStatus: "unknown"
    });
  });

  it("recalculates from active predictions without mutating tournament data", () => {
    const data = performanceTournament();
    const predictions: PredictionMap = {
      "gamma-delta": { home: 3, away: 0 },
      "alpha-gamma": { home: 0, away: 1 }
    };

    const rows = calculatePerformanceRows(data, predictions);

    expect(rows[0]).toMatchObject({
      teamId: "gamma",
      points: 6,
      performanceDelta: undefined,
      performanceStatus: "unknown"
    });
    expect(data.fixtures.find((fixture) => fixture.id === "gamma-delta")?.result).toBeUndefined();
  });

  it("can rank by per-match performance in the middle of a round", () => {
    const rows = calculatePerformanceRows(performanceTournament(), {}, "per-match");

    expect(rows.map((row) => row.teamId).slice(0, 4)).toEqual(["beta", "hotel", "echo", "foxtrot"]);
    expect(rows.find((row) => row.teamId === "foxtrot")?.currentRank).toBeGreaterThan(rows.find((row) => row.teamId === "beta")!.currentRank);
  });

  it("uses normalized tie-breakers in per-match mode instead of raw totals", () => {
    const rows = calculatePerformanceRows(performanceTournament(), {}, "per-match");

    expect(rows.find((row) => row.teamId === "beta")).toMatchObject({
      currentRank: 1,
      played: 1,
      points: 3,
      goalDifference: 2
    });
    expect(rows.find((row) => row.teamId === "hotel")).toMatchObject({
      currentRank: 2,
      played: 2,
      points: 6,
      goalDifference: 4
    });
  });

  it("can rank by group-relative expectation delta", () => {
    const rows = calculatePerformanceRows(performanceTournament(), {}, "group-delta");

    expect(rows.filter((row) => row.performanceDelta === 1).map((row) => row.teamId)).toEqual(["beta"]);
    expect(rows.find((row) => row.teamId === "hotel")).toMatchObject({
      expectedGroupRank: 3,
      expectedOverallRank: 8,
      rank: 1,
      performanceDelta: 2,
      performanceStatus: "overperforming"
    });
    expect(rows.find((row) => row.teamId === "foxtrot")).toMatchObject({
      expectedOverallRank: 7,
      expectedGroupRank: 2,
      rank: 2,
      performanceDelta: 0,
      performanceStatus: "on-track"
    });
    expect(rows.at(-1)).toMatchObject({
      teamId: "alpha",
      expectedGroupRank: 1,
      rank: 4,
      performanceDelta: -3,
      performanceStatus: "underperforming"
    });
  });

  it("calculates rank-adjusted fixture performance for completed fixtures", () => {
    const rows = calculateFixturePerformanceEntries(performanceTournament(), {});
    const betaExpectedResult = eloExpectedResult(fifaRankSeedRating(20), fifaRankSeedRating(1));
    const hotelExpectedResult = eloExpectedResult(fifaRankSeedRating(90), fifaRankSeedRating(5));

    expect(rows.find((row) => row.fixtureId === "hotel-india" && row.teamId === "hotel")).toMatchObject({
      fixtureId: "hotel-india",
      teamId: "hotel",
      opponentId: "india",
      result: "win",
      resultPoints: 3,
      fifaRanking: 90,
      opponentFifaRanking: 5,
      rankingGap: 85,
      teamSeedRating: 1666,
      opponentSeedRating: 2176,
      actualResult: 1,
      source: "final"
    });
    expect(rows.find((row) => row.fixtureId === "hotel-india" && row.teamId === "hotel")?.expectedResult).toBeCloseTo(hotelExpectedResult);
    expect(rows.find((row) => row.fixtureId === "hotel-india" && row.teamId === "hotel")?.successScore).toBeCloseTo(fixtureSuccessScore(1, hotelExpectedResult));
    expect(rows.find((row) => row.fixtureId === "echo-foxtrot" && row.teamId === "echo")).toMatchObject({
      result: "loss",
      resultPoints: 0,
      teamSeedRating: 2194,
      opponentSeedRating: 1726,
      actualResult: 0
    });
    expect(rows.find((row) => row.fixtureId === "alpha-beta" && row.teamId === "beta")).toMatchObject({
      goalsFor: 2,
      goalsAgainst: 0,
      opponentFifaRanking: 1,
      teamSeedRating: 2086,
      opponentSeedRating: 2200,
      actualResult: 1
    });
    expect(rows.find((row) => row.fixtureId === "alpha-beta" && row.teamId === "beta")?.expectedResult).toBeCloseTo(betaExpectedResult);
    expect(rows.find((row) => row.fixtureId === "alpha-beta" && row.teamId === "beta")?.successScore).toBeCloseTo(fixtureSuccessScore(1, betaExpectedResult));
  });

  it("gives an underdog positive success and a favorite negative success for the same draw", () => {
    const data = performanceTournament();
    const rows = calculateFixturePerformanceEntries(data, {
      "beta-delta": { home: 1, away: 1 }
    });

    const favorite = rows.find((row) => row.fixtureId === "beta-delta" && row.teamId === "beta");
    const underdog = rows.find((row) => row.fixtureId === "beta-delta" && row.teamId === "delta");

    expect(underdog).toMatchObject({
      result: "draw",
      rankingGap: 30,
      resultPoints: 1,
      actualResult: 0.5,
      source: "prediction"
    });
    expect(favorite).toMatchObject({
      result: "draw",
      rankingGap: -30,
      resultPoints: 1,
      actualResult: 0.5,
      source: "prediction"
    });
    expect(underdog!.successScore).toBeGreaterThan(0);
    expect(favorite!.successScore).toBeLessThan(0);
    expect(underdog!.successScore).toBeGreaterThan(favorite!.successScore);
    expect(data.fixtures.find((fixture) => fixture.id === "beta-delta")?.result).toBeUndefined();
  });

  it("scores close-ranked favorite wins above routine heavy-favorite wins", () => {
    const data = performanceTournament();
    data.fixtures.push(
      {
        id: "alpha-echo",
        matchNumber: 9,
        stage: "group",
        group: "A",
        date: "2026-06-18T12:00:00.000Z",
        venueId: "venue",
        home: "alpha",
        away: "echo",
        status: "completed",
        result: { home: 1, away: 0 }
      },
      {
        id: "alpha-foxtrot",
        matchNumber: 10,
        stage: "group",
        group: "A",
        date: "2026-06-19T12:00:00.000Z",
        venueId: "venue",
        home: "alpha",
        away: "foxtrot",
        status: "completed",
        result: { home: 1, away: 0 }
      }
    );

    const rows = calculateFixturePerformanceEntries(data, {});
    const closeWin = rows.find((row) => row.fixtureId === "alpha-echo" && row.teamId === "alpha");
    const routineWin = rows.find((row) => row.fixtureId === "alpha-foxtrot" && row.teamId === "alpha");

    expect(closeWin!.successScore).toBeGreaterThan(routineWin!.successScore);
    expect(closeWin!.successScore).toBeGreaterThan(0);
    expect(routineWin!.successScore).toBeGreaterThan(0);
  });

  it("skips unresolved fixtures and fixtures with missing rankings", () => {
    const rows = calculateFixturePerformanceEntries(performanceTournament(), {
      "gamma-delta": { home: 3, away: 0 }
    });

    expect(rows.some((row) => row.fixtureId === "beta-delta")).toBe(false);
    expect(rows.some((row) => row.fixtureId === "gamma-delta")).toBe(false);
  });

  it("sorts fixture performances deterministically when scores tie", () => {
    const data = performanceTournament();
    data.fixtures.push(
      {
        id: "india-juliet",
        matchNumber: 9,
        stage: "group",
        group: "C",
        date: "2026-06-18T12:00:00.000Z",
        venueId: "venue",
        home: "india",
        away: "juliet",
        status: "completed",
        result: { home: 1, away: 1 }
      },
      {
        id: "india-juliet-rematch",
        matchNumber: 10,
        stage: "group",
        group: "C",
        date: "2026-06-18T12:00:00.000Z",
        venueId: "venue",
        home: "india",
        away: "juliet",
        status: "completed",
        result: { home: 1, away: 1 }
      }
    );

    const tiedFavoriteDraws = calculateFixturePerformanceEntries(data, {})
      .filter((row) => row.result === "draw" && row.teamId === "india")
      .map((row) => row.fixtureId);

    expect(tiedFavoriteDraws).toEqual(["india-juliet", "india-juliet-rematch"]);
  });

  it("summarizes fixture performance credit by team", () => {
    const rows = calculateFixturePerformanceSummaries(performanceTournament(), {});

    expect(rows[0]).toMatchObject({
      teamId: "hotel",
      group: "C",
      fifaRanking: 90,
      fixtures: 2,
      won: 2,
      drawn: 0,
      lost: 0,
      goalsFor: 4,
      goalsAgainst: 0,
      goalDifference: 4,
      actualPoints: 6,
      actualResultTotal: 2,
      finalCount: 2,
      predictionCount: 0
    });
    expect(rows[0].expectedResultTotal).toBeCloseTo(
      eloExpectedResult(fifaRankSeedRating(90), fifaRankSeedRating(5)) +
      eloExpectedResult(fifaRankSeedRating(90), fifaRankSeedRating(70))
    );
    expect(rows[0].totalSuccessScore).toBeCloseTo(
      fixtureSuccessScore(1, eloExpectedResult(fifaRankSeedRating(90), fifaRankSeedRating(5))) +
      fixtureSuccessScore(1, eloExpectedResult(fifaRankSeedRating(90), fifaRankSeedRating(70)))
    );
  });

  it("sorts summaries by total success score", () => {
    const rows = calculateFixturePerformanceSummaries(performanceTournament(), {});

    for (let index = 1; index < rows.length; index += 1) {
      expect(rows[index - 1].totalSuccessScore).toBeGreaterThanOrEqual(rows[index].totalSuccessScore);
    }
  });
});
