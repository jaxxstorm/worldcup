import { afterEach, describe, expect, it, vi } from "vitest";
import { loadStatsSource, mergeStatsFeed } from "../../scripts/update-stats";
import { tournamentData } from "../data/tournament";
import type { SourceMetadata } from "../types";

const source: SourceMetadata = {
  name: "football-data.org World Cup scorers API",
  url: "https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=100",
  accessedAt: "2026-06-19T16:00:00.000Z",
  notes: "Used by stats refresh tests."
};

describe("stats refresh", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.STATS_SOURCE_TOKEN;
    delete process.env.FOOTBALL_DATA_API_TOKEN;
  });

  it("falls back to FOOTBALL_DATA_API_TOKEN when STATS_SOURCE_TOKEN is blank", async () => {
    process.env.STATS_SOURCE_TOKEN = "";
    process.env.FOOTBALL_DATA_API_TOKEN = "football-data-token";
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers instanceof Headers ? init.headers.get("X-Auth-Token") : undefined).toBe("football-data-token");
      return new Response(JSON.stringify({ scorers: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadStatsSource("https://api.football-data.org/v4/competitions/WC/scorers")).resolves.toEqual({ scorers: [] });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("normalizes football-data.org scorers into tournament leaderboards", () => {
    const result = mergeStatsFeed(tournamentData, {
      scorers: [
        {
          player: { name: "Example Striker" },
          team: { name: "Korea Republic", tla: "KOR" },
          goals: 3,
          assists: 1,
          penalties: 1
        },
        {
          player: { name: "Example Creator" },
          team: { name: "Canada", tla: "CAN" },
          goals: 1,
          assists: 4,
          penalties: 0
        }
      ]
    }, source);

    expect(result.changed).toBe(true);
    expect(result.imported).toBe(5);
    expect(result.summary).toEqual([
      "Top Goal Scorers: 2 entries, leader Example Striker (3)",
      "Top Assists: 2 entries, leader Example Creator (4)",
      "Penalty Goals: 1 entry, leader Example Striker (1)"
    ]);
    expect(result.data.statLeaderboards?.map((leaderboard) => leaderboard.id)).toEqual(["goals", "assists", "penalties"]);
    expect(result.data.statLeaderboards?.[0].entries[0]).toMatchObject({
      rank: 1,
      player: "Example Striker",
      teamId: "south-korea",
      value: 3
    });
    expect(result.data.statLeaderboards?.[1].entries[0]).toMatchObject({
      rank: 1,
      player: "Example Creator",
      teamId: "canada",
      value: 4
    });
  });

  it("limits the goal scorer leaderboard to the top 10", () => {
    const scorers = Array.from({ length: 12 }, (_, index) => ({
      player: { name: `Player ${String(index + 1).padStart(2, "0")}` },
      team: { name: "Canada", tla: "CAN" },
      goals: 12 - index,
      assists: 0,
      penalties: 0
    }));
    const result = mergeStatsFeed(tournamentData, { scorers }, source);
    const goals = result.data.statLeaderboards?.find((leaderboard) => leaderboard.id === "goals");

    expect(goals?.entries).toHaveLength(10);
    expect(goals?.entries.at(0)).toMatchObject({ rank: 1, player: "Player 01", value: 12 });
    expect(goals?.entries.at(-1)).toMatchObject({ rank: 10, player: "Player 10", value: 3 });
  });

  it("keeps unmatched scorer teams displayable without a team id", () => {
    const result = mergeStatsFeed(tournamentData, {
      scorers: [{
        player: { name: "Mystery Player" },
        team: { name: "Unmatched Team" },
        goals: 2,
        assists: 0,
        penalties: 0
      }]
    }, source);

    expect(result.data.statLeaderboards?.[0].entries[0]).toEqual({
      rank: 1,
      player: "Mystery Player",
      value: 2,
      detail: "Unmatched Team"
    });
  });

  it("normalizes fair-play penalty points from discipline data", () => {
    const result = mergeStatsFeed(tournamentData, {
      fairPlay: [
        {
          team: { name: "Spain", tla: "ESP" },
          yellowCards: 2,
          secondYellowCards: 1,
          redCards: 1
        },
        {
          teamId: "cape-verde",
          fairPlayPoints: 1
        }
      ]
    }, source);

    expect(result.changed).toBe(true);
    expect(result.summary).toEqual([
      "Fair play: Spain set to 9",
      "Fair play: Cabo Verde set to 1"
    ]);
    expect(result.data.teams.find((team) => team.id === "spain")?.fairPlayPoints).toBe(9);
    expect(result.data.teams.find((team) => team.id === "cape-verde")?.fairPlayPoints).toBe(1);
  });
});
