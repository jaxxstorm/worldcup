import { describe, expect, it } from "vitest";
import { tournamentData } from "../data/tournament";
import { validateTournamentData } from "../data/schema";
import type { TournamentData } from "../types";

describe("tournament data", () => {
  it("validates the normalized tournament dataset", () => {
    expect(validateTournamentData(tournamentData)).toEqual([]);
  });

  it("includes source metadata, venue locations, and venue timezones", () => {
    expect(tournamentData.sources.length).toBeGreaterThan(0);
    expect(tournamentData.venues.every((venue) => venue.name && venue.city && venue.country && venue.timeZone)).toBe(true);
  });

  it("includes FIFA rankings for every group-stage team", () => {
    expect(tournamentData.teams.filter((team) => team.group && !team.fifaRanking).map((team) => team.id)).toEqual([]);
  });

  it("accepts optional stat leaderboards and validates present entries", () => {
    const withoutLeaderboards = structuredClone(tournamentData) as TournamentData;
    delete withoutLeaderboards.statLeaderboards;
    expect(validateTournamentData(withoutLeaderboards)).toEqual([]);

    expect(tournamentData.statLeaderboards?.every((leaderboard) => leaderboard.id && leaderboard.source?.accessedAt)).not.toBe(false);
    expect(validateTournamentData(tournamentData)).toEqual([]);
  });

  it("rejects stat leaderboard entries that reference unknown teams", () => {
    const withBadEntry = structuredClone(tournamentData) as TournamentData;
    withBadEntry.statLeaderboards = [{
      id: "goals",
      label: "Top Goal Scorers",
      valueLabel: "Goals",
      source: tournamentData.sources[0],
      entries: [{ rank: 1, player: "Example Player", teamId: "missing-team", value: 2 }]
    }];

    expect(validateTournamentData(withBadEntry)).toContainEqual({
      path: "statLeaderboards.0.entries.0.teamId",
      message: "entry team reference must exist"
    });
  });

  it("retains varied FIFA group-stage schedule dates", () => {
    const groupFixtures = tournamentData.fixtures.filter((fixture) => fixture.stage === "group");
    const uniqueDates = new Set(groupFixtures.map((fixture) => fixture.date.slice(0, 10)));

    expect(groupFixtures.every((fixture) => Number.isFinite(Date.parse(fixture.date)))).toBe(true);
    expect(uniqueDates.size).toBeGreaterThan(1);
  });
});
