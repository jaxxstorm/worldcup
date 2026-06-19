import type { Fixture, Venue } from "../types";

export interface FixtureDateGroup {
  key: string;
  label: string;
  fixtures: Fixture[];
}

const unscheduledGroup: Pick<FixtureDateGroup, "key" | "label"> = {
  key: "unscheduled",
  label: "Date TBD"
};

export function orderFixturesChronologically(fixtures: Fixture[]): Fixture[] {
  return [...fixtures].sort((left, right) => {
    const kickoffComparison = getFixtureTimestamp(left) - getFixtureTimestamp(right);
    return kickoffComparison || left.matchNumber - right.matchNumber;
  });
}

export function groupFixturesByDisplayDate(fixtures: Fixture[], venues = new Map<string, Venue>()): FixtureDateGroup[] {
  const groups = new Map<string, FixtureDateGroup>();

  fixtures.forEach((fixture) => {
    const groupInfo = getFixtureDateGroupInfo(fixture, venues.get(fixture.venueId));
    const existingGroup = groups.get(groupInfo.key);

    if (existingGroup) {
      existingGroup.fixtures.push(fixture);
    } else {
      groups.set(groupInfo.key, {
        ...groupInfo,
        fixtures: [fixture]
      });
    }
  });

  return Array.from(groups.values());
}

export function formatFixtureKickoff(fixture: Pick<Fixture, "date">, venue?: Pick<Venue, "timeZone">): string {
  const date = new Date(fixture.date);

  if (Number.isNaN(date.getTime())) {
    return "Kickoff TBD";
  }

  return date.toLocaleString([], {
    timeZone: venue?.timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: venue?.timeZone ? "short" : undefined
  });
}

function getFixtureTimestamp(fixture: Fixture) {
  const timestamp = Date.parse(fixture.date);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function getFixtureDateGroupInfo(fixture: Fixture, venue?: Venue): Pick<FixtureDateGroup, "key" | "label"> {
  const date = new Date(fixture.date);

  if (Number.isNaN(date.getTime())) {
    return unscheduledGroup;
  }

  const dateParts = new Intl.DateTimeFormat([], {
    timeZone: venue?.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = dateParts.find((part) => part.type === "year")?.value ?? "0000";
  const month = dateParts.find((part) => part.type === "month")?.value ?? "00";
  const day = dateParts.find((part) => part.type === "day")?.value ?? "00";
  const key = [year, month, day].join("-");

  return {
    key,
    label: date.toLocaleDateString([], {
      timeZone: venue?.timeZone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  };
}
