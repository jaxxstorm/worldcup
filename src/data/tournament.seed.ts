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
  { id: "estadio-azteca", name: "Estadio Azteca", city: "Mexico City", region: "CDMX", country: "Mexico", timeZone: "America/Mexico_City", latitude: 19.3029, longitude: -99.1505 },
  { id: "bmo-field", name: "BMO Field", city: "Toronto", region: "Ontario", country: "Canada", timeZone: "America/Toronto", latitude: 43.6332, longitude: -79.4186 },
  { id: "sofi-stadium", name: "SoFi Stadium", city: "Los Angeles", region: "California", country: "United States", timeZone: "America/Los_Angeles", latitude: 33.9535, longitude: -118.3392 },
  { id: "metlife-stadium", name: "MetLife Stadium", city: "New York/New Jersey", region: "New Jersey", country: "United States", timeZone: "America/New_York", latitude: 40.8135, longitude: -74.0745 },
  { id: "at-and-t-stadium", name: "AT&T Stadium", city: "Dallas", region: "Texas", country: "United States", timeZone: "America/Chicago", latitude: 32.7473, longitude: -97.0945 },
  { id: "mercedes-benz-stadium", name: "Mercedes-Benz Stadium", city: "Atlanta", region: "Georgia", country: "United States", timeZone: "America/New_York", latitude: 33.7554, longitude: -84.4008 },
  { id: "hard-rock-stadium", name: "Hard Rock Stadium", city: "Miami", region: "Florida", country: "United States", timeZone: "America/New_York", latitude: 25.958, longitude: -80.2389 },
  { id: "lumen-field", name: "Lumen Field", city: "Seattle", region: "Washington", country: "United States", timeZone: "America/Los_Angeles", latitude: 47.5952, longitude: -122.3316 },
  { id: "bc-place", name: "BC Place", city: "Vancouver", region: "British Columbia", country: "Canada", timeZone: "America/Vancouver", latitude: 49.2768, longitude: -123.1119 },
  { id: "estadio-bbva", name: "Estadio BBVA", city: "Monterrey", region: "Nuevo Leon", country: "Mexico", timeZone: "America/Mexico_City", latitude: 25.6682, longitude: -100.2444 },
  { id: "estadio-akron", name: "Estadio Akron", city: "Guadalajara", region: "Jalisco", country: "Mexico", timeZone: "America/Mexico_City", latitude: 20.6817, longitude: -103.4629 },
  { id: "gillette-stadium", name: "Gillette Stadium", city: "Boston", region: "Massachusetts", country: "United States", timeZone: "America/New_York", latitude: 42.0909, longitude: -71.2643 },
  { id: "levi-stadium", name: "Levi's Stadium", city: "San Francisco Bay Area", region: "California", country: "United States", timeZone: "America/Los_Angeles", latitude: 37.403, longitude: -121.97 },
  { id: "lincoln-financial-field", name: "Lincoln Financial Field", city: "Philadelphia", region: "Pennsylvania", country: "United States", timeZone: "America/New_York", latitude: 39.9008, longitude: -75.1675 },
  { id: "nrg-stadium", name: "NRG Stadium", city: "Houston", region: "Texas", country: "United States", timeZone: "America/Chicago", latitude: 29.6847, longitude: -95.4107 },
  { id: "arrowhead-stadium", name: "Arrowhead Stadium", city: "Kansas City", region: "Missouri", country: "United States", timeZone: "America/Chicago", latitude: 39.049, longitude: -94.4839 }
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

const fifaRankings: Partial<Record<string, number>> = {
  spain: 1,
  uruguay: 16,
  "saudi-arabia": 60,
  "cape-verde": 68
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
    flag,
    fifaRanking: fifaRankings[id]
  }))
);

const groupFixtureDetails: Record<string, { date: string; venueId: string }> = {
  m001: { date: "2026-06-11T19:00:00Z", venueId: "estadio-azteca" },
  m002: { date: "2026-06-12T02:00:00Z", venueId: "estadio-akron" },
  m003: { date: "2026-06-19T01:00:00Z", venueId: "estadio-akron" },
  m004: { date: "2026-06-18T16:00:00Z", venueId: "mercedes-benz-stadium" },
  m005: { date: "2026-06-25T01:00:00Z", venueId: "estadio-azteca" },
  m006: { date: "2026-06-25T01:00:00Z", venueId: "estadio-bbva" },
  m007: { date: "2026-06-12T19:00:00Z", venueId: "bmo-field" },
  m008: { date: "2026-06-13T19:00:00Z", venueId: "levi-stadium" },
  m009: { date: "2026-06-18T22:00:00Z", venueId: "bc-place" },
  m010: { date: "2026-06-18T19:00:00Z", venueId: "sofi-stadium" },
  m011: { date: "2026-06-24T19:00:00Z", venueId: "bc-place" },
  m012: { date: "2026-06-24T19:00:00Z", venueId: "lumen-field" },
  m013: { date: "2026-06-13T22:00:00Z", venueId: "metlife-stadium" },
  m014: { date: "2026-06-14T01:00:00Z", venueId: "gillette-stadium" },
  m015: { date: "2026-06-20T00:30:00Z", venueId: "lincoln-financial-field" },
  m016: { date: "2026-06-19T22:00:00Z", venueId: "gillette-stadium" },
  m017: { date: "2026-06-24T22:00:00Z", venueId: "hard-rock-stadium" },
  m018: { date: "2026-06-24T22:00:00Z", venueId: "mercedes-benz-stadium" },
  m019: { date: "2026-06-13T01:00:00Z", venueId: "sofi-stadium" },
  m020: { date: "2026-06-14T04:00:00Z", venueId: "bc-place" },
  m021: { date: "2026-06-19T19:00:00Z", venueId: "lumen-field" },
  m022: { date: "2026-06-20T03:00:00Z", venueId: "levi-stadium" },
  m023: { date: "2026-06-26T02:00:00Z", venueId: "sofi-stadium" },
  m024: { date: "2026-06-26T02:00:00Z", venueId: "levi-stadium" },
  m025: { date: "2026-06-14T17:00:00Z", venueId: "nrg-stadium" },
  m026: { date: "2026-06-14T23:00:00Z", venueId: "lincoln-financial-field" },
  m027: { date: "2026-06-20T20:00:00Z", venueId: "bmo-field" },
  m028: { date: "2026-06-21T00:00:00Z", venueId: "arrowhead-stadium" },
  m029: { date: "2026-06-25T20:00:00Z", venueId: "metlife-stadium" },
  m030: { date: "2026-06-25T20:00:00Z", venueId: "lincoln-financial-field" },
  m031: { date: "2026-06-14T20:00:00Z", venueId: "at-and-t-stadium" },
  m032: { date: "2026-06-15T02:00:00Z", venueId: "estadio-bbva" },
  m033: { date: "2026-06-20T17:00:00Z", venueId: "nrg-stadium" },
  m034: { date: "2026-06-21T04:00:00Z", venueId: "estadio-bbva" },
  m035: { date: "2026-06-25T23:00:00Z", venueId: "arrowhead-stadium" },
  m036: { date: "2026-06-25T23:00:00Z", venueId: "at-and-t-stadium" },
  m037: { date: "2026-06-15T19:00:00Z", venueId: "lumen-field" },
  m038: { date: "2026-06-16T01:00:00Z", venueId: "sofi-stadium" },
  m039: { date: "2026-06-21T19:00:00Z", venueId: "sofi-stadium" },
  m040: { date: "2026-06-22T01:00:00Z", venueId: "bc-place" },
  m041: { date: "2026-06-27T03:00:00Z", venueId: "bc-place" },
  m042: { date: "2026-06-27T03:00:00Z", venueId: "lumen-field" },
  m043: { date: "2026-06-15T16:00:00Z", venueId: "mercedes-benz-stadium" },
  m044: { date: "2026-06-15T22:00:00Z", venueId: "hard-rock-stadium" },
  m045: { date: "2026-06-21T16:00:00Z", venueId: "mercedes-benz-stadium" },
  m046: { date: "2026-06-21T22:00:00Z", venueId: "hard-rock-stadium" },
  m047: { date: "2026-06-27T00:00:00Z", venueId: "estadio-akron" },
  m048: { date: "2026-06-27T00:00:00Z", venueId: "nrg-stadium" },
  m049: { date: "2026-06-16T19:00:00Z", venueId: "metlife-stadium" },
  m050: { date: "2026-06-16T22:00:00Z", venueId: "gillette-stadium" },
  m051: { date: "2026-06-22T21:00:00Z", venueId: "lincoln-financial-field" },
  m052: { date: "2026-06-23T00:00:00Z", venueId: "metlife-stadium" },
  m053: { date: "2026-06-26T19:00:00Z", venueId: "gillette-stadium" },
  m054: { date: "2026-06-26T19:00:00Z", venueId: "bmo-field" },
  m055: { date: "2026-06-17T01:00:00Z", venueId: "arrowhead-stadium" },
  m056: { date: "2026-06-17T04:00:00Z", venueId: "levi-stadium" },
  m057: { date: "2026-06-22T17:00:00Z", venueId: "at-and-t-stadium" },
  m058: { date: "2026-06-23T03:00:00Z", venueId: "levi-stadium" },
  m059: { date: "2026-06-28T02:00:00Z", venueId: "at-and-t-stadium" },
  m060: { date: "2026-06-28T02:00:00Z", venueId: "arrowhead-stadium" },
  m061: { date: "2026-06-17T17:00:00Z", venueId: "nrg-stadium" },
  m062: { date: "2026-06-18T02:00:00Z", venueId: "estadio-azteca" },
  m063: { date: "2026-06-23T17:00:00Z", venueId: "nrg-stadium" },
  m064: { date: "2026-06-24T02:00:00Z", venueId: "estadio-akron" },
  m065: { date: "2026-06-27T23:30:00Z", venueId: "hard-rock-stadium" },
  m066: { date: "2026-06-27T23:30:00Z", venueId: "mercedes-benz-stadium" },
  m067: { date: "2026-06-17T20:00:00Z", venueId: "at-and-t-stadium" },
  m068: { date: "2026-06-17T23:00:00Z", venueId: "bmo-field" },
  m069: { date: "2026-06-23T20:00:00Z", venueId: "gillette-stadium" },
  m070: { date: "2026-06-23T23:00:00Z", venueId: "bmo-field" },
  m071: { date: "2026-06-27T21:00:00Z", venueId: "metlife-stadium" },
  m072: { date: "2026-06-27T21:00:00Z", venueId: "lincoln-financial-field" }
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

  return Object.entries(groups).flatMap(([groupId, groupTeams]) =>
    pairings.map(([homeIndex, awayIndex]) => {
      const id = `m${String(matchNumber).padStart(3, "0")}`;
      const details = groupFixtureDetails[id];
      const fixture: Fixture = {
        id,
        matchNumber,
        stage: "group",
        group: groupId as GroupId,
        date: details.date,
        venueId: details.venueId,
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

const knockoutFixtures = [
  knockoutFixture(73, "round-of-32", "2A", "2B", "2026-06-28T19:00:00Z", "sofi-stadium"),
  knockoutFixture(74, "round-of-32", "1E", "3A/B/C/D/F", "2026-06-29T20:30:00Z", "gillette-stadium"),
  knockoutFixture(75, "round-of-32", "1F", "2C", "2026-06-30T01:00:00Z", "estadio-bbva"),
  knockoutFixture(76, "round-of-32", "1C", "2F", "2026-06-29T17:00:00Z", "nrg-stadium"),
  knockoutFixture(77, "round-of-32", "1I", "3C/D/F/G/H", "2026-06-30T21:00:00Z", "metlife-stadium"),
  knockoutFixture(78, "round-of-32", "2E", "2I", "2026-06-30T17:00:00Z", "at-and-t-stadium"),
  knockoutFixture(79, "round-of-32", "1A", "3C/E/F/H/I", "2026-07-01T01:00:00Z", "estadio-azteca"),
  knockoutFixture(80, "round-of-32", "1L", "3E/H/I/J/K", "2026-07-01T16:00:00Z", "mercedes-benz-stadium"),
  knockoutFixture(81, "round-of-32", "1D", "3B/E/F/I/J", "2026-07-02T00:00:00Z", "levi-stadium"),
  knockoutFixture(82, "round-of-32", "1G", "3A/E/H/I/J", "2026-07-01T20:00:00Z", "lumen-field"),
  knockoutFixture(83, "round-of-32", "2K", "2L", "2026-07-02T23:00:00Z", "bmo-field"),
  knockoutFixture(84, "round-of-32", "1H", "2J", "2026-07-02T19:00:00Z", "sofi-stadium"),
  knockoutFixture(85, "round-of-32", "1B", "3E/F/G/I/J", "2026-07-03T03:00:00Z", "bc-place"),
  knockoutFixture(86, "round-of-32", "1J", "2H", "2026-07-03T22:00:00Z", "hard-rock-stadium"),
  knockoutFixture(87, "round-of-32", "1K", "3D/E/I/J/L", "2026-07-04T01:30:00Z", "arrowhead-stadium"),
  knockoutFixture(88, "round-of-32", "2D", "2G", "2026-07-03T18:00:00Z", "at-and-t-stadium"),
  knockoutFixture(89, "round-of-16", "Winner m074", "Winner m077", "2026-07-04T21:00:00Z", "lincoln-financial-field"),
  knockoutFixture(90, "round-of-16", "Winner m073", "Winner m075", "2026-07-04T17:00:00Z", "nrg-stadium"),
  knockoutFixture(91, "round-of-16", "Winner m076", "Winner m078", "2026-07-05T20:00:00Z", "metlife-stadium"),
  knockoutFixture(92, "round-of-16", "Winner m079", "Winner m080", "2026-07-06T00:00:00Z", "estadio-azteca"),
  knockoutFixture(93, "round-of-16", "Winner m083", "Winner m084", "2026-07-06T19:00:00Z", "at-and-t-stadium"),
  knockoutFixture(94, "round-of-16", "Winner m081", "Winner m082", "2026-07-07T00:00:00Z", "lumen-field"),
  knockoutFixture(95, "round-of-16", "Winner m086", "Winner m088", "2026-07-07T16:00:00Z", "mercedes-benz-stadium"),
  knockoutFixture(96, "round-of-16", "Winner m085", "Winner m087", "2026-07-07T20:00:00Z", "bc-place"),
  knockoutFixture(97, "quarter-final", "Winner m089", "Winner m090", "2026-07-09T20:00:00Z", "gillette-stadium"),
  knockoutFixture(98, "quarter-final", "Winner m093", "Winner m094", "2026-07-10T19:00:00Z", "sofi-stadium"),
  knockoutFixture(99, "quarter-final", "Winner m091", "Winner m092", "2026-07-11T21:00:00Z", "hard-rock-stadium"),
  knockoutFixture(100, "quarter-final", "Winner m095", "Winner m096", "2026-07-12T01:00:00Z", "arrowhead-stadium"),
  knockoutFixture(101, "semi-final", "Winner m097", "Winner m098", "2026-07-14T19:00:00Z", "at-and-t-stadium"),
  knockoutFixture(102, "semi-final", "Winner m099", "Winner m100", "2026-07-15T19:00:00Z", "mercedes-benz-stadium"),
  knockoutFixture(103, "third-place", "Loser m101", "Loser m102", "2026-07-18T21:00:00Z", "hard-rock-stadium"),
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
