import { describe, expect, it } from "vitest";
import { calculatePerformanceRows } from "../engine/performance";
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
      { id: "foxtrot", name: "Foxtrot", fifaCode: "FOX", group: "B", flag: "F", fifaRanking: 80 }
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
      }
    ],
    knockoutSlots: []
  };
}

describe("performance analysis", () => {
  it("compares current performance rank with FIFA ranking", () => {
    const rows = calculatePerformanceRows(performanceTournament(), {});

    expect(rows.map((row) => row.teamId)).toEqual(["beta", "echo", "foxtrot", "delta", "gamma", "alpha"]);
    expect(rows.find((row) => row.teamId === "beta")).toMatchObject({
      currentRank: 1,
      fifaRanking: 20,
      performanceDelta: 19,
      performanceStatus: "overperforming"
    });
    expect(rows.find((row) => row.teamId === "alpha")).toMatchObject({
      currentRank: 6,
      fifaRanking: 1,
      performanceDelta: -5,
      performanceStatus: "underperforming"
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
      performanceStatus: "unknown"
    });
    expect(data.fixtures.find((fixture) => fixture.id === "gamma-delta")?.result).toBeUndefined();
  });

  it("can rank by per-match performance in the middle of a round", () => {
    const rows = calculatePerformanceRows(performanceTournament(), {}, "per-match");

    expect(rows.map((row) => row.teamId).slice(0, 3)).toEqual(["beta", "echo", "foxtrot"]);
    expect(rows.find((row) => row.teamId === "foxtrot")?.currentRank).toBeGreaterThan(rows.find((row) => row.teamId === "beta")!.currentRank);
  });

  it("can rank by group-relative expectation delta", () => {
    const rows = calculatePerformanceRows(performanceTournament(), {}, "group-delta");

    expect(rows.filter((row) => row.performanceDelta === 1).map((row) => row.teamId)).toEqual(["beta"]);
    expect(rows.find((row) => row.teamId === "foxtrot")).toMatchObject({
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
});
