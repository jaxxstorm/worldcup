import type { Fixture } from "../types";

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

export function groupFixturesByDisplayDate(fixtures: Fixture[]): FixtureDateGroup[] {
  const groups = new Map<string, FixtureDateGroup>();

  fixtures.forEach((fixture) => {
    const groupInfo = getFixtureDateGroupInfo(fixture);
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

export function formatFixtureKickoff(fixture: Pick<Fixture, "date">): string {
  const date = new Date(fixture.date);

  if (Number.isNaN(date.getTime())) {
    return "Kickoff TBD";
  }

  return date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function getFixtureTimestamp(fixture: Fixture) {
  const timestamp = Date.parse(fixture.date);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function getFixtureDateGroupInfo(fixture: Fixture): Pick<FixtureDateGroup, "key" | "label"> {
  const date = new Date(fixture.date);

  if (Number.isNaN(date.getTime())) {
    return unscheduledGroup;
  }

  const key = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");

  return {
    key,
    label: date.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  };
}
