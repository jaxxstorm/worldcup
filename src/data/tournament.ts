import generatedData from "./tournament.generated.json";
import type { TournamentData } from "../types";

export const tournamentData = generatedData as TournamentData;

export const teamById = new Map(tournamentData.teams.map((team) => [team.id, team]));
export const venueById = new Map(tournamentData.venues.map((venue) => [venue.id, venue]));
