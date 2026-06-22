import { describe, expect, it } from "vitest";
import { recentResultsForTeam } from "../engine/team-details";
import type { TournamentData } from "../types";

const baseData: TournamentData = {
  schemaVersion: "1",
  generatedAt: "2026-01-01T00:00:00Z",
  sources: [],
  teams: [
    { id: "alpha", name: "Alpha", fifaCode: "ALP", flag: "A" },
    { id: "bravo", name: "Bravo", fifaCode: "BRV", flag: "B" },
    { id: "charlie", name: "Charlie", fifaCode: "CHR", flag: "C" },
    { id: "delta", name: "Delta", fifaCode: "DLT", flag: "D" }
  ],
  venues: [],
  fixtures: [],
  knockoutSlots: []
};

describe("recentResultsForTeam", () => {
  it("returns latest completed results from the team perspective", () => {
    const data: TournamentData = {
      ...baseData,
      fixtures: [
        completedFixture("m1", 1, "2026-06-11T10:00:00Z", "alpha", "bravo", 2, 0),
        completedFixture("m2", 2, "2026-06-12T10:00:00Z", "charlie", "alpha", 1, 1),
        completedFixture("m3", 3, "2026-06-13T10:00:00Z", "alpha", "delta", 0, 3)
      ]
    };

    expect(recentResultsForTeam(data, "alpha")).toEqual([
      expect.objectContaining({ fixtureId: "m3", opponentId: "delta", goalsFor: 0, goalsAgainst: 3, outcome: "loss" }),
      expect.objectContaining({ fixtureId: "m2", opponentId: "charlie", goalsFor: 1, goalsAgainst: 1, outcome: "draw" }),
      expect.objectContaining({ fixtureId: "m1", opponentId: "bravo", goalsFor: 2, goalsAgainst: 0, outcome: "win" })
    ]);
  });

  it("ignores unresolved fixtures and placeholder participants", () => {
    const data: TournamentData = {
      ...baseData,
      fixtures: [
        completedFixture("m1", 1, "2026-06-11T10:00:00Z", "alpha", "bravo", 2, 0),
        {
          id: "m2",
          matchNumber: 2,
          stage: "group",
          group: "A",
          date: "2026-06-12T10:00:00Z",
          venueId: "v1",
          home: "alpha",
          away: "charlie",
          status: "scheduled"
        },
        {
          ...completedFixture("m3", 3, "2026-06-13T10:00:00Z", "alpha", "delta", 3, 0),
          away: { kind: "placeholder", label: "Winner M2" }
        }
      ]
    };

    expect(recentResultsForTeam(data, "alpha").map((result) => result.fixtureId)).toEqual(["m1"]);
  });

  it("limits results to the requested count", () => {
    const data: TournamentData = {
      ...baseData,
      fixtures: Array.from({ length: 6 }, (_, index) => completedFixture(`m${index + 1}`, index + 1, `2026-06-${11 + index}T10:00:00Z`, "alpha", "bravo", index, 0))
    };

    expect(recentResultsForTeam(data, "alpha", 5).map((result) => result.fixtureId)).toEqual(["m6", "m5", "m4", "m3", "m2"]);
  });
});

function completedFixture(id: string, matchNumber: number, date: string, home: string, away: string, homeScore: number, awayScore: number) {
  return {
    id,
    matchNumber,
    stage: "group" as const,
    group: "A" as const,
    date,
    venueId: "v1",
    home,
    away,
    status: "completed" as const,
    result: { home: homeScore, away: awayScore }
  };
}
