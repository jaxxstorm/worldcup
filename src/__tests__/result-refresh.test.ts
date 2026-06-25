import { describe, expect, it } from "vitest";
import { mergeResultFeed } from "../../scripts/update-results";
import type { SourceMetadata, TournamentData } from "../types";
import { fixtureById, makeTournamentData, setFixtureResult } from "./fixtures/tournament";

const source: SourceMetadata = {
  name: "Test result feed",
  url: "https://example.com/results.json",
  accessedAt: "2026-06-18T12:00:00.000Z",
  notes: "Used by result refresh tests."
};

describe("result refresh", () => {
  it("merges a new completed result into generated data", () => {
    const data = makeTournamentData();
    const openFixture = fixtureById(data, "m001");
    const result = mergeResultFeed(data, {
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

  it("merges a tied knockout result with penalties and winner", () => {
    const data = makeTournamentData();
    const openFixture = fixtureById(data, "m073");
    const result = mergeResultFeed(data, {
      results: [{ fixtureId: openFixture.id, home: 1, away: 1, decision: "penalties", winner: "home" }]
    }, source);

    expect(result.changed).toBe(true);
    expect(result.data.fixtures.find((fixture) => fixture.id === openFixture.id)!.result).toEqual({
      home: 1,
      away: 1,
      decision: "penalties",
      winner: "home"
    });
  });

  it("rejects a tied knockout result without a penalty winner", () => {
    const data = makeTournamentData();
    const openFixture = fixtureById(data, "m073");

    expect(() => mergeResultFeed(data, {
      results: [{ fixtureId: openFixture.id, home: 1, away: 1, decision: "aet" }]
    }, source)).toThrow(`Tied knockout result ${openFixture.id} must include penalties and a winner`);
  });

  it("does not change data when a feed repeats an existing completed result", () => {
    const data = makeTournamentData();
    setFixtureResult(data, "m001", 2, 0);
    const completedFixture = fixtureById(data, "m001");
    const result = mergeResultFeed(data, {
      source,
      results: [{
        fixtureId: completedFixture.id,
        home: completedFixture.result!.home,
        away: completedFixture.result!.away
      }]
    }, source);

    expect(result.changed).toBe(false);
    expect(result.imported).toBe(0);
    expect(result.data).toEqual(data);
  });

  it("rejects conflicting updates for completed fixtures", () => {
    const data = makeTournamentData();
    setFixtureResult(data, "m001", 2, 0);
    const completedFixture = fixtureById(data, "m001");
    const conflictingHome = completedFixture.result!.home + 1;

    expect(() => mergeResultFeed(data, {
      source,
      results: [{ fixtureId: completedFixture.id, home: conflictingHome, away: completedFixture.result!.away }]
    }, source)).toThrow(`Incoming result conflicts with completed fixture ${completedFixture.id}`);
  });

  it("can merge from a normalized tournament dataset", () => {
    const data = makeTournamentData();
    const openFixture = fixtureById(data, "m001");
    const sourceData = structuredClone(data) as TournamentData;
    const sourceFixture = sourceData.fixtures.find((fixture) => fixture.id === openFixture.id)!;
    sourceFixture.status = "completed";
    sourceFixture.result = { home: 3, away: 0 };
    sourceFixture.sourceResult = source;

    const result = mergeResultFeed(data, sourceData, source);

    expect(result.changed).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.data.fixtures.find((fixture) => fixture.id === openFixture.id)!.result).toEqual({ home: 3, away: 0 });
  });

  it("can merge completed football-data.org matches by team and fixture date", () => {
    const data = makeTournamentData();
    const openFixture = fixtureById(data, "m001");
    const homeTeam = data.teams.find((team) => team.id === openFixture.home)!;
    const awayTeam = data.teams.find((team) => team.id === openFixture.away)!;

    const result = mergeResultFeed(data, {
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
    const data = makeTournamentData();
    const openFixture = fixtureById(data, "m001");

    const result = mergeResultFeed(data, {
      Results: [{
        MatchNumber: openFixture.matchNumber,
        MatchStatus: 0,
        ResultType: 1,
        Home: { ShortClubName: data.teams.find((team) => team.id === openFixture.home)!.name },
        Away: { ShortClubName: data.teams.find((team) => team.id === openFixture.away)!.name },
        HomeTeamScore: 2,
        AwayTeamScore: 0
      }]
    }, source);

    expect(result.changed).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.data.fixtures.find((fixture) => fixture.id === openFixture.id)!.result).toEqual({ home: 2, away: 0 });
  });

  it("ignores FIFA calendar matches that do not have a final result", () => {
    const data = makeTournamentData();
    const openFixture = fixtureById(data, "m001");

    const result = mergeResultFeed(data, {
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
    expect(result.data).toEqual(data);
  });
});
