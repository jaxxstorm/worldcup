import { describe, expect, it } from "vitest";
import { tournamentData } from "../data/tournament";
import { validateTournamentData } from "../data/schema";

describe("tournament data", () => {
  it("validates the normalized tournament dataset", () => {
    expect(validateTournamentData(tournamentData)).toEqual([]);
  });

  it("includes source metadata, venue locations, and venue timezones", () => {
    expect(tournamentData.sources.length).toBeGreaterThan(0);
    expect(tournamentData.venues.every((venue) => venue.name && venue.city && venue.country && venue.timeZone)).toBe(true);
  });

  it("uses the FIFA group-stage schedule cadence in browser-local date buckets", () => {
    const groupFixtures = tournamentData.fixtures.filter((fixture) => fixture.stage === "group");
    const countsByDate = groupFixtures.reduce<Record<string, number>>((counts, fixture) => {
      const date = new Date(fixture.date).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
      counts[date] = (counts[date] ?? 0) + 1;
      return counts;
    }, {});

    expect(countsByDate["2026-06-12"]).toBe(2);
    expect(countsByDate).toMatchObject({
      "2026-06-11": 2,
      "2026-06-12": 2,
      "2026-06-13": 4,
      "2026-06-14": 4,
      "2026-06-15": 4,
      "2026-06-16": 4,
      "2026-06-17": 4
    });
  });
});
