import { describe, expect, it } from "vitest";
import { formatFixtureKickoff, groupFixturesByDisplayDate, orderFixturesChronologically } from "../engine/fixtures";
import type { Fixture, Venue } from "../types";

function fixture(matchNumber: number, date: string): Fixture {
  return {
    id: `m${String(matchNumber).padStart(3, "0")}`,
    matchNumber,
    stage: "group",
    group: "A",
    date,
    venueId: "venue",
    home: { kind: "placeholder", label: "Home" },
    away: { kind: "placeholder", label: "Away" },
    status: "scheduled"
  };
}

const easternVenue: Venue = {
  id: "east",
  name: "East Stadium",
  city: "Miami",
  region: "Florida",
  country: "United States",
  timeZone: "America/New_York"
};

describe("orderFixturesChronologically", () => {
  it("orders fixtures by kickoff date from earliest to latest", () => {
    const unordered = [
      fixture(3, "2026-06-14T19:00:00Z"),
      fixture(1, "2026-06-11T19:00:00Z"),
      fixture(2, "2026-06-12T22:00:00Z")
    ];

    expect(orderFixturesChronologically(unordered).map((match) => match.matchNumber)).toEqual([1, 2, 3]);
  });

  it("orders same-time fixtures by match number", () => {
    const unordered = [
      fixture(8, "2026-06-12T22:00:00Z"),
      fixture(2, "2026-06-12T22:00:00Z"),
      fixture(5, "2026-06-12T22:00:00Z")
    ];

    expect(orderFixturesChronologically(unordered).map((match) => match.matchNumber)).toEqual([2, 5, 8]);
  });

  it("does not mutate the source fixture array", () => {
    const unordered = [
      fixture(3, "2026-06-14T19:00:00Z"),
      fixture(1, "2026-06-11T19:00:00Z")
    ];

    orderFixturesChronologically(unordered);

    expect(unordered.map((match) => match.matchNumber)).toEqual([3, 1]);
  });

  it("orders invalid kickoff dates after scheduled fixtures", () => {
    const unordered = [
      fixture(3, "not-a-date"),
      fixture(1, "2026-06-11T19:00:00Z"),
      fixture(2, "2026-06-12T22:00:00Z")
    ];

    expect(orderFixturesChronologically(unordered).map((match) => match.matchNumber)).toEqual([1, 2, 3]);
  });
});

describe("groupFixturesByDisplayDate", () => {
  it("groups fixtures sharing the same display date", () => {
    const groups = groupFixturesByDisplayDate([
      fixture(1, "2026-06-11T19:00:00Z"),
      fixture(2, "2026-06-11T22:00:00Z"),
      fixture(3, "2026-06-12T22:00:00Z")
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].fixtures.map((match) => match.matchNumber)).toEqual([1, 2]);
    expect(groups[1].fixtures.map((match) => match.matchNumber)).toEqual([3]);
  });

  it("preserves chronological date order from ordered fixtures", () => {
    const ordered = orderFixturesChronologically([
      fixture(3, "2026-06-13T19:00:00Z"),
      fixture(1, "2026-06-11T19:00:00Z"),
      fixture(2, "2026-06-12T22:00:00Z")
    ]);

    expect(groupFixturesByDisplayDate(ordered).map((group) => group.fixtures[0].matchNumber)).toEqual([1, 2, 3]);
  });

  it("preserves fixture order inside each date group", () => {
    const ordered = [
      fixture(1, "2026-06-11T19:00:00Z"),
      fixture(2, "2026-06-11T22:00:00Z"),
      fixture(3, "2026-06-11T23:00:00Z")
    ];

    expect(groupFixturesByDisplayDate(ordered)[0].fixtures.map((match) => match.matchNumber)).toEqual([1, 2, 3]);
  });

  it("does not mutate the source fixture array", () => {
    const ordered = [
      fixture(1, "2026-06-11T19:00:00Z"),
      fixture(2, "2026-06-11T22:00:00Z")
    ];

    groupFixturesByDisplayDate(ordered);

    expect(ordered.map((match) => match.matchNumber)).toEqual([1, 2]);
  });

  it("renders invalid kickoff dates in a fallback group", () => {
    const groups = groupFixturesByDisplayDate([fixture(1, "not-a-date")]);

    expect(groups).toEqual([
      expect.objectContaining({
        key: "unscheduled",
        label: "Date TBD",
        fixtures: [expect.objectContaining({ matchNumber: 1 })]
      })
    ]);
  });

  it("groups fixtures by the venue-local date when venue timezone is available", () => {
    const venues = new Map<string, Venue>([[easternVenue.id, easternVenue]]);
    const lateUtcFixture = { ...fixture(1, "2026-06-19T03:30:00Z"), venueId: easternVenue.id };
    const groups = groupFixturesByDisplayDate([lateUtcFixture], venues);

    expect(groups[0].key).toBe("2026-06-18");
    expect(groups[0].label).toBe("Thursday, June 18, 2026");
  });
});

describe("formatFixtureKickoff", () => {
  it("formats kickoff time in the venue timezone", () => {
    expect(formatFixtureKickoff(fixture(1, "2026-06-18T19:00:00Z"), easternVenue)).toContain("3:00 PM");
    expect(formatFixtureKickoff(fixture(1, "2026-06-18T19:00:00Z"), easternVenue)).toContain("EDT");
  });

  it("falls back cleanly for invalid kickoff dates", () => {
    expect(formatFixtureKickoff(fixture(1, "not-a-date"), easternVenue)).toBe("Kickoff TBD");
  });
});
