import { describe, expect, it } from "vitest";
import { mergeResultFeed } from "../../scripts/update-results";
import { tournamentData } from "../data/tournament";
import type { SourceMetadata, TournamentData } from "../types";

const source: SourceMetadata = {
  name: "Test result feed",
  url: "https://example.com/results.json",
  accessedAt: "2026-06-18T12:00:00.000Z",
  notes: "Used by result refresh tests."
};

describe("result refresh", () => {
  it("merges a new completed result into generated data", () => {
    const openFixture = tournamentData.fixtures.find((fixture) => fixture.status === "scheduled")!;
    const result = mergeResultFeed(tournamentData, {
      source,
      results: [{ fixtureId: openFixture.id, home: 2, away: 1 }]
    }, source);

    const updatedFixture = result.data.fixtures.find((fixture) => fixture.id === openFixture.id)!;
    expect(result.changed).toBe(true);
    expect(result.imported).toBe(1);
    expect(updatedFixture.status).toBe("completed");
    expect(updatedFixture.result).toEqual({ home: 2, away: 1 });
    expect(updatedFixture.sourceResult).toEqual(source);
    expect(result.data.generatedAt).toBe(source.accessedAt);
  });

  it("does not change data when a feed repeats an existing completed result", () => {
    const completedFixture = tournamentData.fixtures.find((fixture) => fixture.status === "completed" && fixture.result)!;
    const result = mergeResultFeed(tournamentData, {
      source,
      results: [{
        fixtureId: completedFixture.id,
        home: completedFixture.result!.home,
        away: completedFixture.result!.away
      }]
    }, source);

    expect(result.changed).toBe(false);
    expect(result.imported).toBe(0);
    expect(result.data).toEqual(tournamentData);
  });

  it("rejects conflicting updates for completed fixtures", () => {
    const completedFixture = tournamentData.fixtures.find((fixture) => fixture.status === "completed" && fixture.result)!;
    const conflictingHome = completedFixture.result!.home + 1;

    expect(() => mergeResultFeed(tournamentData, {
      source,
      results: [{ fixtureId: completedFixture.id, home: conflictingHome, away: completedFixture.result!.away }]
    }, source)).toThrow(`Incoming result conflicts with completed fixture ${completedFixture.id}`);
  });

  it("can merge from a normalized tournament dataset", () => {
    const openFixture = tournamentData.fixtures.find((fixture) => fixture.status === "scheduled")!;
    const sourceData = structuredClone(tournamentData) as TournamentData;
    const sourceFixture = sourceData.fixtures.find((fixture) => fixture.id === openFixture.id)!;
    sourceFixture.status = "completed";
    sourceFixture.result = { home: 3, away: 0 };
    sourceFixture.sourceResult = source;

    const result = mergeResultFeed(tournamentData, sourceData, source);

    expect(result.changed).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.data.fixtures.find((fixture) => fixture.id === openFixture.id)!.result).toEqual({ home: 3, away: 0 });
  });

  it("can merge completed football-data.org matches by team and fixture date", () => {
    const openFixture = tournamentData.fixtures.find((fixture) => fixture.status === "scheduled" && typeof fixture.home === "string" && typeof fixture.away === "string")!;
    const homeTeam = tournamentData.teams.find((team) => team.id === openFixture.home)!;
    const awayTeam = tournamentData.teams.find((team) => team.id === openFixture.away)!;

    const result = mergeResultFeed(tournamentData, {
      matches: [{
        utcDate: openFixture.date,
        status: "FINISHED",
        homeTeam: { name: homeTeam.name },
        awayTeam: { name: awayTeam.name },
        score: { fullTime: { home: 4, away: 2 } }
      }]
    }, source);

    expect(result.changed).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.data.fixtures.find((fixture) => fixture.id === openFixture.id)!.result).toEqual({ home: 4, away: 2 });
  });

  it("can merge completed FIFA calendar matches by team pairing", () => {
    const openFixture = tournamentData.fixtures.find((fixture) => fixture.status === "scheduled" && typeof fixture.home === "string" && typeof fixture.away === "string")!;

    const result = mergeResultFeed(tournamentData, {
      Results: [{
        MatchNumber: openFixture.matchNumber,
        MatchStatus: 0,
        ResultType: 1,
        Home: { ShortClubName: tournamentData.teams.find((team) => team.id === openFixture.home)!.name },
        Away: { ShortClubName: tournamentData.teams.find((team) => team.id === openFixture.away)!.name },
        HomeTeamScore: 2,
        AwayTeamScore: 0
      }]
    }, source);

    expect(result.changed).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.data.fixtures.find((fixture) => fixture.id === openFixture.id)!.result).toEqual({ home: 2, away: 0 });
  });

  it("ignores FIFA calendar matches that do not have a final result", () => {
    const openFixture = tournamentData.fixtures.find((fixture) => fixture.status === "scheduled")!;

    const result = mergeResultFeed(tournamentData, {
      Results: [{
        MatchNumber: openFixture.matchNumber,
        MatchStatus: 1,
        ResultType: 0,
        HomeTeamScore: null,
        AwayTeamScore: null
      }]
    }, source);

    expect(result.changed).toBe(false);
    expect(result.imported).toBe(0);
    expect(result.data).toEqual(tournamentData);
  });
});
