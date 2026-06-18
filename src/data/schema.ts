import type { TournamentData } from "../types";

export interface ValidationIssue {
  path: string;
  message: string;
}

export function validateTournamentData(data: TournamentData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const teamIds = new Set<string>();
  const venueIds = new Set<string>();
  const fixtureIds = new Set<string>();

  if (!data.schemaVersion) issues.push({ path: "schemaVersion", message: "schemaVersion is required" });
  if (!data.generatedAt) issues.push({ path: "generatedAt", message: "generatedAt is required" });
  if (data.sources.length === 0) issues.push({ path: "sources", message: "at least one source is required" });

  data.teams.forEach((team, index) => {
    if (teamIds.has(team.id)) issues.push({ path: `teams.${index}.id`, message: "team id must be unique" });
    teamIds.add(team.id);
    if (!team.name || !team.fifaCode || !team.flag) {
      issues.push({ path: `teams.${index}`, message: "team name, fifaCode, and flag are required" });
    }
  });

  data.venues.forEach((venue, index) => {
    if (venueIds.has(venue.id)) issues.push({ path: `venues.${index}.id`, message: "venue id must be unique" });
    venueIds.add(venue.id);
    if (!venue.name || !venue.city || !venue.country) {
      issues.push({ path: `venues.${index}`, message: "venue name, city, and country are required" });
    }
  });

  data.fixtures.forEach((fixture, index) => {
    if (fixtureIds.has(fixture.id)) issues.push({ path: `fixtures.${index}.id`, message: "fixture id must be unique" });
    fixtureIds.add(fixture.id);
    if (!venueIds.has(fixture.venueId)) issues.push({ path: `fixtures.${index}.venueId`, message: "fixture venue must exist" });
    if (fixture.stage === "group" && !fixture.group) issues.push({ path: `fixtures.${index}.group`, message: "group fixture must include group" });
    if (fixture.status === "completed" && !fixture.result) issues.push({ path: `fixtures.${index}.result`, message: "completed fixture must include result" });
    validateTeamRef(data, fixture.home, `fixtures.${index}.home`, issues);
    validateTeamRef(data, fixture.away, `fixtures.${index}.away`, issues);
  });

  data.knockoutSlots.forEach((slot, index) => {
    if (!fixtureIds.has(slot.fixtureId)) issues.push({ path: `knockoutSlots.${index}.fixtureId`, message: "slot fixture must exist" });
    if (!slot.homeSource || !slot.awaySource) issues.push({ path: `knockoutSlots.${index}`, message: "slot sources are required" });
  });

  return issues;
}

function validateTeamRef(data: TournamentData, ref: unknown, path: string, issues: ValidationIssue[]) {
  if (typeof ref === "string") {
    if (!data.teams.some((team) => team.id === ref)) issues.push({ path, message: "team reference must exist" });
    return;
  }

  if (!ref || typeof ref !== "object" || (ref as { kind?: string }).kind !== "placeholder") {
    issues.push({ path, message: "team reference must be a team id or placeholder" });
  }
}

export const tournamentJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "World Cup 2026 Tournament Data",
  type: "object",
  required: ["schemaVersion", "generatedAt", "sources", "teams", "venues", "fixtures", "knockoutSlots"],
  properties: {
    schemaVersion: { type: "string" },
    generatedAt: { type: "string", format: "date-time" },
    sources: { type: "array", minItems: 1 },
    teams: { type: "array" },
    venues: { type: "array" },
    fixtures: { type: "array" },
    knockoutSlots: { type: "array" }
  }
} as const;
