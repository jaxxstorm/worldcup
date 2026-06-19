export type TeamId = string;
export type FixtureId = string;
export type GroupId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export type MatchStage = "group" | "round-of-32" | "round-of-16" | "quarter-final" | "semi-final" | "third-place" | "final";
export type MatchStatus = "scheduled" | "completed";

export interface SourceMetadata {
  name: string;
  url: string;
  accessedAt: string;
  notes: string;
}

export interface Team {
  id: TeamId;
  name: string;
  fifaCode: string;
  group?: GroupId;
  flag: string;
}

export interface TeamPlaceholder {
  kind: "placeholder";
  label: string;
}

export type TeamRef = TeamId | TeamPlaceholder;

export interface Venue {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
  timeZone: string;
  latitude?: number;
  longitude?: number;
}

export interface Score {
  home: number;
  away: number;
}

export interface Fixture {
  id: FixtureId;
  matchNumber: number;
  stage: MatchStage;
  group?: GroupId;
  date: string;
  venueId: string;
  home: TeamRef;
  away: TeamRef;
  status: MatchStatus;
  result?: Score;
  sourceResult?: SourceMetadata;
}

export interface KnockoutSlot {
  id: string;
  round: MatchStage;
  fixtureId: FixtureId;
  homeSource: string;
  awaySource: string;
}

export interface TournamentData {
  schemaVersion: string;
  generatedAt: string;
  sources: SourceMetadata[];
  teams: Team[];
  venues: Venue[];
  fixtures: Fixture[];
  knockoutSlots: KnockoutSlot[];
}

export interface Prediction {
  fixtureId: FixtureId;
  score: Score;
}

export type PredictionMap = Record<FixtureId, Score>;

export interface StandingRow {
  teamId: TeamId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank: number;
}

export interface QualifiedTeam {
  slot: string;
  teamId?: TeamId;
  label: string;
}

export interface ProjectedMatch {
  fixtureId: FixtureId;
  stage: MatchStage;
  matchNumber: number;
  date: string;
  venueId: string;
  homeSource: string;
  awaySource: string;
  home: QualifiedTeam;
  away: QualifiedTeam;
  winner?: QualifiedTeam;
}
