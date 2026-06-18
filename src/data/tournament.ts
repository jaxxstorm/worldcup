import type { Fixture, GroupId, KnockoutSlot, SourceMetadata, Team, TournamentData, Venue } from "../types";

const accessedAt = "2026-06-18T00:00:00.000Z";

const sources: SourceMetadata[] = [
  {
    name: "FIFA World Cup 26 match schedule",
    url: "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/match-schedule",
    accessedAt,
    notes: "Authoritative fixture and venue source to prefer for future normalization runs."
  },
  {
    name: "2026 FIFA World Cup current tournament summary",
    url: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup",
    accessedAt,
    notes: "Used as an initial public cross-check for format, host cities, and early completed results."
  },
  {
    name: "SB Nation World Cup 2026 schedule and scores",
    url: "https://www.sbnation.com/soccer/1117513/world-cup-schedule-2026-how-to-watch-every-match-scores-and-more",
    accessedAt,
    notes: "Used for completed group-stage scores through the article update on June 18, 2026."
  }
];

const venues: Venue[] = [
  { id: "estadio-azteca", name: "Estadio Azteca", city: "Mexico City", region: "CDMX", country: "Mexico", latitude: 19.3029, longitude: -99.1505 },
  { id: "bmo-field", name: "BMO Field", city: "Toronto", region: "Ontario", country: "Canada", latitude: 43.6332, longitude: -79.4186 },
  { id: "sofi-stadium", name: "SoFi Stadium", city: "Los Angeles", region: "California", country: "United States", latitude: 33.9535, longitude: -118.3392 },
  { id: "metlife-stadium", name: "MetLife Stadium", city: "New York/New Jersey", region: "New Jersey", country: "United States", latitude: 40.8135, longitude: -74.0745 },
  { id: "at-and-t-stadium", name: "AT&T Stadium", city: "Dallas", region: "Texas", country: "United States", latitude: 32.7473, longitude: -97.0945 },
  { id: "mercedes-benz-stadium", name: "Mercedes-Benz Stadium", city: "Atlanta", region: "Georgia", country: "United States", latitude: 33.7554, longitude: -84.4008 },
  { id: "hard-rock-stadium", name: "Hard Rock Stadium", city: "Miami", region: "Florida", country: "United States", latitude: 25.958, longitude: -80.2389 },
  { id: "lumen-field", name: "Lumen Field", city: "Seattle", region: "Washington", country: "United States", latitude: 47.5952, longitude: -122.3316 },
  { id: "bc-place", name: "BC Place", city: "Vancouver", region: "British Columbia", country: "Canada", latitude: 49.2768, longitude: -123.1119 },
  { id: "estadio-bbva", name: "Estadio BBVA", city: "Monterrey", region: "Nuevo Leon", country: "Mexico", latitude: 25.6682, longitude: -100.2444 },
  { id: "estadio-akron", name: "Estadio Akron", city: "Guadalajara", region: "Jalisco", country: "Mexico", latitude: 20.6817, longitude: -103.4629 },
  { id: "gillette-stadium", name: "Gillette Stadium", city: "Boston", region: "Massachusetts", country: "United States", latitude: 42.0909, longitude: -71.2643 },
  { id: "levi-stadium", name: "Levi's Stadium", city: "San Francisco Bay Area", region: "California", country: "United States", latitude: 37.403, longitude: -121.97 },
  { id: "lincoln-financial-field", name: "Lincoln Financial Field", city: "Philadelphia", region: "Pennsylvania", country: "United States", latitude: 39.9008, longitude: -75.1675 },
  { id: "nrg-stadium", name: "NRG Stadium", city: "Houston", region: "Texas", country: "United States", latitude: 29.6847, longitude: -95.4107 },
  { id: "arrowhead-stadium", name: "Arrowhead Stadium", city: "Kansas City", region: "Missouri", country: "United States", latitude: 39.049, longitude: -94.4839 }
];

const groups: Record<GroupId, Array<[string, string, string]>> = {
  A: [["mexico", "Mexico", "🇲🇽"], ["south-africa", "South Africa", "🇿🇦"], ["south-korea", "South Korea", "🇰🇷"], ["czechia", "Czechia", "🇨🇿"]],
  B: [["canada", "Canada", "🇨🇦"], ["bosnia", "Bosnia and Herzegovina", "🇧🇦"], ["qatar", "Qatar", "🇶🇦"], ["switzerland", "Switzerland", "🇨🇭"]],
  C: [["brazil", "Brazil", "🇧🇷"], ["morocco", "Morocco", "🇲🇦"], ["haiti", "Haiti", "🇭🇹"], ["scotland", "Scotland", "🏴"]],
  D: [["united-states", "United States", "🇺🇸"], ["paraguay", "Paraguay", "🇵🇾"], ["australia", "Australia", "🇦🇺"], ["turkiye", "Türkiye", "🇹🇷"]],
  E: [["germany", "Germany", "🇩🇪"], ["curacao", "Curacao", "🇨🇼"], ["cote-divoire", "Cote d'Ivoire", "🇨🇮"], ["ecuador", "Ecuador", "🇪🇨"]],
  F: [["netherlands", "Netherlands", "🇳🇱"], ["japan", "Japan", "🇯🇵"], ["sweden", "Sweden", "🇸🇪"], ["tunisia", "Tunisia", "🇹🇳"]],
  G: [["belgium", "Belgium", "🇧🇪"], ["egypt", "Egypt", "🇪🇬"], ["iran", "Iran", "🇮🇷"], ["new-zealand", "New Zealand", "🇳🇿"]],
  H: [["spain", "Spain", "🇪🇸"], ["cape-verde", "Cabo Verde", "🇨🇻"], ["saudi-arabia", "Saudi Arabia", "🇸🇦"], ["uruguay", "Uruguay", "🇺🇾"]],
  I: [["france", "France", "🇫🇷"], ["senegal", "Senegal", "🇸🇳"], ["iraq", "Iraq", "🇮🇶"], ["norway", "Norway", "🇳🇴"]],
  J: [["argentina", "Argentina", "🇦🇷"], ["algeria", "Algeria", "🇩🇿"], ["austria", "Austria", "🇦🇹"], ["jordan", "Jordan", "🇯🇴"]],
  K: [["portugal", "Portugal", "🇵🇹"], ["dr-congo", "DR Congo", "🇨🇩"], ["uzbekistan", "Uzbekistan", "🇺🇿"], ["colombia", "Colombia", "🇨🇴"]],
  L: [["england", "England", "🏴"], ["croatia", "Croatia", "🇭🇷"], ["ghana", "Ghana", "🇬🇭"], ["panama", "Panama", "🇵🇦"]]
};

const teams: Team[] = Object.entries(groups).flatMap(([group, entries]) =>
  entries.map(([id, name, flag]) => ({
    id,
    name,
    fifaCode: id
      .split("-")
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase(),
    group: group as GroupId,
    flag
  }))
);

const venueCycle = venues.map((venue) => venue.id);
const groupSchedule: Record<GroupId, string[]> = {
  A: ["2026-06-11T19:00:00Z", "2026-06-11T22:00:00Z", "2026-06-18T19:00:00Z", "2026-06-18T22:00:00Z", "2026-06-24T19:00:00Z", "2026-06-24T22:00:00Z"],
  B: ["2026-06-12T19:00:00Z", "2026-06-13T19:00:00Z", "2026-06-18T19:00:00Z", "2026-06-18T22:00:00Z", "2026-06-24T19:00:00Z", "2026-06-24T22:00:00Z"],
  C: ["2026-06-13T19:00:00Z", "2026-06-13T22:00:00Z", "2026-06-19T19:00:00Z", "2026-06-19T22:00:00Z", "2026-06-24T19:00:00Z", "2026-06-24T22:00:00Z"],
  D: ["2026-06-12T22:00:00Z", "2026-06-13T22:00:00Z", "2026-06-19T19:00:00Z", "2026-06-19T22:00:00Z", "2026-06-25T19:00:00Z", "2026-06-25T22:00:00Z"],
  E: ["2026-06-14T19:00:00Z", "2026-06-14T22:00:00Z", "2026-06-20T19:00:00Z", "2026-06-20T22:00:00Z", "2026-06-25T19:00:00Z", "2026-06-25T22:00:00Z"],
  F: ["2026-06-14T19:00:00Z", "2026-06-14T22:00:00Z", "2026-06-20T19:00:00Z", "2026-06-20T22:00:00Z", "2026-06-25T19:00:00Z", "2026-06-25T22:00:00Z"],
  G: ["2026-06-15T19:00:00Z", "2026-06-15T22:00:00Z", "2026-06-21T19:00:00Z", "2026-06-21T22:00:00Z", "2026-06-26T19:00:00Z", "2026-06-26T22:00:00Z"],
  H: ["2026-06-15T19:00:00Z", "2026-06-15T22:00:00Z", "2026-06-21T19:00:00Z", "2026-06-21T22:00:00Z", "2026-06-26T19:00:00Z", "2026-06-26T22:00:00Z"],
  I: ["2026-06-16T19:00:00Z", "2026-06-16T22:00:00Z", "2026-06-22T19:00:00Z", "2026-06-22T22:00:00Z", "2026-06-26T19:00:00Z", "2026-06-26T22:00:00Z"],
  J: ["2026-06-16T19:00:00Z", "2026-06-16T22:00:00Z", "2026-06-22T19:00:00Z", "2026-06-22T22:00:00Z", "2026-06-27T19:00:00Z", "2026-06-27T22:00:00Z"],
  K: ["2026-06-17T19:00:00Z", "2026-06-17T22:00:00Z", "2026-06-23T19:00:00Z", "2026-06-23T22:00:00Z", "2026-06-27T19:00:00Z", "2026-06-27T22:00:00Z"],
  L: ["2026-06-17T19:00:00Z", "2026-06-17T22:00:00Z", "2026-06-23T19:00:00Z", "2026-06-23T22:00:00Z", "2026-06-27T19:00:00Z", "2026-06-27T22:00:00Z"]
};

function groupFixtures(): Fixture[] {
  const pairings = [
    [0, 1],
    [2, 3],
    [0, 2],
    [3, 1],
    [3, 0],
    [1, 2]
  ] as const;
  let matchNumber = 1;

  return Object.entries(groups).flatMap(([groupId, groupTeams], groupIndex) =>
    pairings.map(([homeIndex, awayIndex], pairingIndex) => {
      const id = `m${String(matchNumber).padStart(3, "0")}`;
      const fixture: Fixture = {
        id,
        matchNumber,
        stage: "group",
        group: groupId as GroupId,
        date: groupSchedule[groupId as GroupId][pairingIndex],
        venueId: venueCycle[(groupIndex * 3 + pairingIndex) % venueCycle.length],
        home: groupTeams[homeIndex][0],
        away: groupTeams[awayIndex][0],
        status: "scheduled"
      };
      matchNumber += 1;
      return withKnownResult(fixture);
    })
  );
}

function withKnownResult(fixture: Fixture): Fixture {
  const known: Record<string, { home: number; away: number }> = {
    m001: { home: 2, away: 0 },
    m002: { home: 2, away: 1 },
    m007: { home: 1, away: 1 },
    m008: { home: 1, away: 1 },
    m013: { home: 1, away: 1 },
    m014: { home: 0, away: 1 },
    m019: { home: 4, away: 1 },
    m020: { home: 2, away: 0 },
    m025: { home: 7, away: 1 },
    m026: { home: 1, away: 0 },
    m031: { home: 2, away: 2 },
    m032: { home: 5, away: 1 },
    m037: { home: 1, away: 1 },
    m038: { home: 2, away: 2 },
    m043: { home: 0, away: 0 },
    m044: { home: 1, away: 1 },
    m049: { home: 3, away: 1 },
    m050: { home: 1, away: 4 },
    m055: { home: 3, away: 0 },
    m056: { home: 3, away: 1 },
    m061: { home: 1, away: 1 },
    m062: { home: 1, away: 3 },
    m067: { home: 4, away: 2 },
    m068: { home: 1, away: 0 }
  };

  const result = known[fixture.id];
  if (!result) return fixture;

  return {
    ...fixture,
    status: "completed",
    result,
    sourceResult: sources[2]
  };
}

function knockoutFixture(matchNumber: number, stage: Fixture["stage"], homeSource: string, awaySource: string, date: string, venueId: string): Fixture {
  return {
    id: `m${String(matchNumber).padStart(3, "0")}`,
    matchNumber,
    stage,
    date,
    venueId,
    home: { kind: "placeholder", label: homeSource },
    away: { kind: "placeholder", label: awaySource },
    status: "scheduled"
  };
}

const roundOf32Sources = [
  ["1A", "2C"],
  ["1B", "3A/B/C"],
  ["1C", "3D/E/F"],
  ["1D", "2F"],
  ["1E", "2G"],
  ["1F", "3H/I/J"],
  ["1G", "2I"],
  ["1H", "3K/L/A"],
  ["1I", "2K"],
  ["1J", "3B/C/D"],
  ["1K", "2A"],
  ["1L", "3E/F/G"],
  ["2B", "2D"],
  ["2E", "2H"],
  ["2J", "3I/J/K"],
  ["2L", "3L/A/B"]
];

const knockoutFixtures = [
  ...roundOf32Sources.map(([home, away], index) => knockoutFixture(73 + index, "round-of-32", home, away, "2026-06-28T19:00:00Z", venueCycle[index % venueCycle.length])),
  ...Array.from({ length: 8 }, (_, index) => knockoutFixture(89 + index, "round-of-16", `Winner m${String(73 + index * 2).padStart(3, "0")}`, `Winner m${String(74 + index * 2).padStart(3, "0")}`, "2026-07-04T19:00:00Z", venueCycle[(index + 5) % venueCycle.length])),
  ...Array.from({ length: 4 }, (_, index) => knockoutFixture(97 + index, "quarter-final", `Winner m${String(89 + index * 2).padStart(3, "0")}`, `Winner m${String(90 + index * 2).padStart(3, "0")}`, "2026-07-09T19:00:00Z", venueCycle[(index + 9) % venueCycle.length])),
  ...Array.from({ length: 2 }, (_, index) => knockoutFixture(101 + index, "semi-final", `Winner m${String(97 + index * 2).padStart(3, "0")}`, `Winner m${String(98 + index * 2).padStart(3, "0")}`, "2026-07-14T19:00:00Z", venueCycle[(index + 12) % venueCycle.length])),
  knockoutFixture(103, "third-place", "Loser m101", "Loser m102", "2026-07-18T19:00:00Z", "hard-rock-stadium"),
  knockoutFixture(104, "final", "Winner m101", "Winner m102", "2026-07-19T19:00:00Z", "metlife-stadium")
];

const knockoutSlots: KnockoutSlot[] = knockoutFixtures.map((fixture) => ({
  id: `slot-${fixture.id}`,
  round: fixture.stage,
  fixtureId: fixture.id,
  homeSource: typeof fixture.home === "string" ? fixture.home : fixture.home.label,
  awaySource: typeof fixture.away === "string" ? fixture.away : fixture.away.label
}));

export const tournamentData: TournamentData = {
  schemaVersion: "2026.0.1",
  generatedAt: accessedAt,
  sources,
  teams,
  venues,
  fixtures: [...groupFixtures(), ...knockoutFixtures],
  knockoutSlots
};

export const teamById = new Map(tournamentData.teams.map((team) => [team.id, team]));
export const venueById = new Map(tournamentData.venues.map((venue) => [venue.id, venue]));
