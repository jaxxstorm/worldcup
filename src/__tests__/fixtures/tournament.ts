import type { Fixture, GroupId, KnockoutSlot, MatchStage, PredictionMap, Score, SourceMetadata, Team, TournamentData } from "../../types";

export const testSource: SourceMetadata = {
  name: "Deterministic test data",
  url: "https://example.test/worldcup-fixtures.json",
  accessedAt: "2026-01-01T00:00:00.000Z",
  notes: "Stable synthetic tournament data for tests."
};

const groups: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const specialTeams: Record<string, Partial<Team>> = {
  mexico: { name: "Mexico", fifaCode: "MEX", fifaRanking: 15 },
  "south-africa": { name: "South Africa", fifaCode: "RSA", fifaRanking: 61 },
  "south-korea": { name: "South Korea", fifaCode: "KOR", fifaRanking: 22 },
  czechia: { name: "Czechia", fifaCode: "CZE", fifaRanking: 44 },
  brazil: { name: "Brazil", fifaCode: "BRA", fifaRanking: 5 },
  morocco: { name: "Morocco", fifaCode: "MAR", fifaRanking: 11 },
  haiti: { name: "Haiti", fifaCode: "HAI", fifaRanking: 84 },
  scotland: { name: "Scotland", fifaCode: "SCO", fifaRanking: 36 },
  spain: { name: "Spain", fifaCode: "ESP", fifaRanking: 1 },
  "cape-verde": { name: "Cabo Verde", fifaCode: "CPV", fifaRanking: 68 },
  "saudi-arabia": { name: "Saudi Arabia", fifaCode: "KSA", fifaRanking: 60 },
  uruguay: { name: "Uruguay", fifaCode: "URU", fifaRanking: 16 },
  canada: { name: "Canada", fifaCode: "CAN", fifaRanking: 31 },
  argentina: { name: "Argentina", fifaCode: "ARG", fifaRanking: 2 },
  algeria: { name: "Algeria", fifaCode: "ALG", fifaRanking: 35 },
  austria: { name: "Austria", fifaCode: "AUT", fifaRanking: 24 },
  jordan: { name: "Jordan", fifaCode: "JOR", fifaRanking: 66 },
  england: { name: "England", fifaCode: "ENG", fifaRanking: 4 },
  croatia: { name: "Croatia", fifaCode: "CRO", fifaRanking: 10 },
  ghana: { name: "Ghana", fifaCode: "GHA", fifaRanking: 72 },
  panama: { name: "Panama", fifaCode: "PAN", fifaRanking: 30 }
};

const groupTeamIds: Record<GroupId, string[]> = {
  A: ["mexico", "south-africa", "south-korea", "czechia"],
  B: ["canada", "group-b-two", "group-b-three", "group-b-four"],
  C: ["brazil", "morocco", "haiti", "scotland"],
  D: ["group-d-one", "group-d-two", "group-d-three", "group-d-four"],
  E: ["group-e-one", "group-e-two", "group-e-three", "group-e-four"],
  F: ["group-f-one", "group-f-two", "group-f-three", "group-f-four"],
  G: ["group-g-one", "group-g-two", "group-g-three", "group-g-four"],
  H: ["spain", "cape-verde", "saudi-arabia", "uruguay"],
  I: ["group-i-one", "group-i-two", "group-i-three", "group-i-four"],
  J: ["argentina", "algeria", "austria", "jordan"],
  K: ["group-k-one", "group-k-two", "group-k-three", "group-k-four"],
  L: ["england", "croatia", "ghana", "panama"]
};

interface FixtureSeed {
  id: string;
  matchNumber: number;
  home: string;
  away: string;
}

const specialFixtureSeeds: Partial<Record<GroupId, FixtureSeed[]>> = {
  C: [
    { id: "m013", matchNumber: 13, home: "brazil", away: "morocco" },
    { id: "m014", matchNumber: 14, home: "haiti", away: "scotland" },
    { id: "m015", matchNumber: 15, home: "brazil", away: "haiti" },
    { id: "m016", matchNumber: 16, home: "scotland", away: "morocco" },
    { id: "m017", matchNumber: 17, home: "scotland", away: "brazil" },
    { id: "m018", matchNumber: 18, home: "morocco", away: "haiti" }
  ],
  H: [
    { id: "m043", matchNumber: 43, home: "spain", away: "cape-verde" },
    { id: "m044", matchNumber: 44, home: "saudi-arabia", away: "uruguay" },
    { id: "m045", matchNumber: 45, home: "spain", away: "saudi-arabia" },
    { id: "m046", matchNumber: 46, home: "uruguay", away: "cape-verde" },
    { id: "m047", matchNumber: 47, home: "uruguay", away: "spain" },
    { id: "m048", matchNumber: 48, home: "cape-verde", away: "saudi-arabia" }
  ],
  J: [
    { id: "m055", matchNumber: 55, home: "argentina", away: "algeria" },
    { id: "m056", matchNumber: 56, home: "austria", away: "jordan" },
    { id: "m057", matchNumber: 57, home: "argentina", away: "austria" },
    { id: "m058", matchNumber: 58, home: "jordan", away: "algeria" },
    { id: "m059", matchNumber: 59, home: "jordan", away: "argentina" },
    { id: "m060", matchNumber: 60, home: "algeria", away: "austria" }
  ],
  L: [
    { id: "m067", matchNumber: 67, home: "england", away: "croatia" },
    { id: "m068", matchNumber: 68, home: "ghana", away: "panama" },
    { id: "m069", matchNumber: 69, home: "england", away: "ghana" },
    { id: "m070", matchNumber: 70, home: "panama", away: "croatia" },
    { id: "m071", matchNumber: 71, home: "panama", away: "england" },
    { id: "m072", matchNumber: 72, home: "croatia", away: "ghana" }
  ]
};

const knockoutFixtures: Array<{ id: string; matchNumber: number; stage: MatchStage; home: string; away: string }> = [
  { id: "m073", matchNumber: 73, stage: "round-of-32", home: "2A", away: "2B" },
  { id: "m074", matchNumber: 74, stage: "round-of-32", home: "1E", away: "3A/B/C/D/F" },
  { id: "m075", matchNumber: 75, stage: "round-of-32", home: "1F", away: "2C" },
  { id: "m076", matchNumber: 76, stage: "round-of-32", home: "1C", away: "2F" },
  { id: "m077", matchNumber: 77, stage: "round-of-32", home: "1I", away: "3C/D/F/G/H" },
  { id: "m078", matchNumber: 78, stage: "round-of-32", home: "2E", away: "2I" },
  { id: "m079", matchNumber: 79, stage: "round-of-32", home: "1A", away: "3C/E/F/H/I" },
  { id: "m080", matchNumber: 80, stage: "round-of-32", home: "1L", away: "3E/H/I/J/K" },
  { id: "m081", matchNumber: 81, stage: "round-of-32", home: "1D", away: "3B/E/F/I/J" },
  { id: "m082", matchNumber: 82, stage: "round-of-32", home: "1G", away: "3A/E/H/I/J" },
  { id: "m083", matchNumber: 83, stage: "round-of-32", home: "2K", away: "2L" },
  { id: "m084", matchNumber: 84, stage: "round-of-32", home: "1H", away: "2J" },
  { id: "m085", matchNumber: 85, stage: "round-of-32", home: "1B", away: "3E/F/G/I/J" },
  { id: "m086", matchNumber: 86, stage: "round-of-32", home: "1J", away: "2H" },
  { id: "m087", matchNumber: 87, stage: "round-of-32", home: "1K", away: "3D/E/I/J/L" },
  { id: "m088", matchNumber: 88, stage: "round-of-32", home: "2D", away: "2G" },
  { id: "m089", matchNumber: 89, stage: "round-of-16", home: "Winner m074", away: "Winner m077" },
  { id: "m090", matchNumber: 90, stage: "round-of-16", home: "Winner m073", away: "Winner m075" },
  { id: "m091", matchNumber: 91, stage: "round-of-16", home: "Winner m076", away: "Winner m078" },
  { id: "m092", matchNumber: 92, stage: "round-of-16", home: "Winner m079", away: "Winner m080" },
  { id: "m093", matchNumber: 93, stage: "round-of-16", home: "Winner m083", away: "Winner m084" },
  { id: "m094", matchNumber: 94, stage: "round-of-16", home: "Winner m081", away: "Winner m082" },
  { id: "m095", matchNumber: 95, stage: "round-of-16", home: "Winner m086", away: "Winner m088" },
  { id: "m096", matchNumber: 96, stage: "round-of-16", home: "Winner m085", away: "Winner m087" },
  { id: "m097", matchNumber: 97, stage: "quarter-final", home: "Winner m089", away: "Winner m090" },
  { id: "m098", matchNumber: 98, stage: "quarter-final", home: "Winner m093", away: "Winner m094" },
  { id: "m099", matchNumber: 99, stage: "quarter-final", home: "Winner m091", away: "Winner m092" },
  { id: "m100", matchNumber: 100, stage: "quarter-final", home: "Winner m095", away: "Winner m096" },
  { id: "m101", matchNumber: 101, stage: "semi-final", home: "Winner m097", away: "Winner m098" },
  { id: "m102", matchNumber: 102, stage: "semi-final", home: "Winner m099", away: "Winner m100" },
  { id: "m103", matchNumber: 103, stage: "third-place", home: "Loser m101", away: "Loser m102" },
  { id: "m104", matchNumber: 104, stage: "final", home: "Winner m101", away: "Winner m102" }
];

export function makeTournamentData(): TournamentData {
  const teams = groups.flatMap((group) => groupTeamIds[group].map((id, index) => makeTeam(id, group, index)));
  const groupFixtures = groups.flatMap((group, groupIndex) => makeGroupFixtures(group, groupIndex));
  const knockout = knockoutFixtures.map((fixture, index): Fixture => ({
    id: fixture.id,
    matchNumber: fixture.matchNumber,
    stage: fixture.stage,
    date: `2026-07-${String(index + 1).padStart(2, "0")}T20:00:00Z`,
    venueId: "test-venue",
    home: { kind: "placeholder", label: fixture.home },
    away: { kind: "placeholder", label: fixture.away },
    status: "scheduled"
  }));

  return {
    schemaVersion: "1.0.0",
    generatedAt: testSource.accessedAt,
    sources: [testSource],
    teams,
    venues: [{
      id: "test-venue",
      name: "Test Stadium",
      city: "Test City",
      region: "Test Region",
      country: "Test Country",
      timeZone: "America/Los_Angeles",
      latitude: 47.6062,
      longitude: -122.3321
    }],
    fixtures: [...groupFixtures, ...knockout],
    knockoutSlots: knockoutFixtures.map((fixture): KnockoutSlot => ({
      id: `${fixture.id}-slot`,
      round: fixture.stage,
      fixtureId: fixture.id,
      homeSource: fixture.home,
      awaySource: fixture.away
    }))
  };
}

export function cloneTournamentData(data = makeTournamentData()): TournamentData {
  return structuredClone(data) as TournamentData;
}

export function completeGroupPredictions(data: TournamentData, score: Score = { home: 1, away: 0 }): PredictionMap {
  return Object.fromEntries(
    data.fixtures
      .filter((fixture) => fixture.stage === "group" && fixture.status === "scheduled")
      .map((fixture) => [fixture.id, score])
  );
}

export function setFixtureResult(data: TournamentData, fixtureId: string, home: number, away: number, score?: Partial<Score>) {
  const fixture = fixtureById(data, fixtureId);
  fixture.status = "completed";
  fixture.result = { home, away, ...score };
  delete fixture.sourceResult;
}

export function setFixtureScheduled(data: TournamentData, fixtureId: string) {
  const fixture = fixtureById(data, fixtureId);
  fixture.status = "scheduled";
  delete fixture.result;
  delete fixture.sourceResult;
}

export function fixtureById(data: TournamentData, fixtureId: string): Fixture {
  const fixture = data.fixtures.find((candidate) => candidate.id === fixtureId);
  if (!fixture) throw new Error(`Missing test fixture ${fixtureId}`);
  return fixture;
}

function makeTeam(id: string, group: GroupId, index: number): Team {
  const seed = specialTeams[id] ?? {};
  const title = id.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

  return {
    id,
    name: seed.name ?? title,
    fifaCode: seed.fifaCode ?? id.slice(-3).toUpperCase().padStart(3, "X"),
    group,
    flag: `flag-${id}`,
    fifaRanking: seed.fifaRanking ?? (groups.indexOf(group) * 4) + index + 20,
    fairPlayPoints: seed.fairPlayPoints
  };
}

function makeGroupFixtures(group: GroupId, groupIndex: number): Fixture[] {
  const seeds = specialFixtureSeeds[group] ?? genericFixtureSeeds(group, groupIndex);
  return seeds.map((seed, index) => ({
    id: seed.id,
    matchNumber: seed.matchNumber,
    stage: "group" as const,
    group,
    date: `2026-06-${String(11 + groupIndex + Math.floor(index / 2)).padStart(2, "0")}T20:00:00Z`,
    venueId: "test-venue",
    home: seed.home,
    away: seed.away,
    status: "scheduled" as const
  }));
}

function genericFixtureSeeds(group: GroupId, groupIndex: number): FixtureSeed[] {
  const [first, second, third, fourth] = groupTeamIds[group];
  const base = groupIndex * 6 + 1;
  return [
    { id: `m${String(base).padStart(3, "0")}`, matchNumber: base, home: first, away: second },
    { id: `m${String(base + 1).padStart(3, "0")}`, matchNumber: base + 1, home: third, away: fourth },
    { id: `m${String(base + 2).padStart(3, "0")}`, matchNumber: base + 2, home: first, away: third },
    { id: `m${String(base + 3).padStart(3, "0")}`, matchNumber: base + 3, home: fourth, away: second },
    { id: `m${String(base + 4).padStart(3, "0")}`, matchNumber: base + 4, home: fourth, away: first },
    { id: `m${String(base + 5).padStart(3, "0")}`, matchNumber: base + 5, home: second, away: third }
  ];
}
