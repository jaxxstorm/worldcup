import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAndMaybeIndexScenarios } from "../../scripts/index-scenarios";
import { tournamentData } from "../data/tournament";

describe("scenario indexing script", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates scenario documents and skips Vectorize when endpoint configuration is missing", async () => {
    const result = await generateAndMaybeIndexScenarios(tournamentData, {});

    expect(result.indexed).toBe(false);
    expect(result.documentCount).toBeGreaterThan(tournamentData.teams.length);
    expect(result.snapshotId).toMatch(/^wc2026-[a-f0-9]{8}$/);
    expect(result.skippedReason).toContain("SCENARIO_INDEX_URL");
  });

  it("posts generated scenario documents to the configured indexing endpoint", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { snapshotId: string; documents: Array<{ metadata: { snapshotId: string } }> };
      expect(body.snapshotId).toMatch(/^wc2026-[a-f0-9]{8}$/);
      expect(body.documents.length).toBeGreaterThan(tournamentData.teams.length);
      expect(body.documents.every((document) => document.metadata.snapshotId === body.snapshotId)).toBe(true);
      return new Response(JSON.stringify({ indexed: body.documents.length, skipped: 0 }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateAndMaybeIndexScenarios(tournamentData, {
      SCENARIO_INDEX_URL: "https://worldcup.test/api/scenario-index",
      SCENARIO_INDEX_TOKEN: "secret"
    });

    expect(result.indexed).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://worldcup.test/api/scenario-index", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ authorization: "Bearer secret" })
    }));
  });
});
