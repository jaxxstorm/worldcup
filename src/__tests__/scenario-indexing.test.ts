import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAndMaybeIndexScenarios } from "../../scripts/index-scenarios";
import { makeTournamentData } from "./fixtures/tournament";

function testDocuments() {
  return [
    {
      id: "wc2026-test1234:team-summary:test",
      title: "Test summary",
      text: "A compact deterministic document.",
      metadata: {
        snapshotId: "wc2026-test1234",
        kind: "team-summary" as const,
        teamId: "canada",
        teamName: "Canada",
        groupId: "B" as const
      }
    }
  ];
}

describe("scenario indexing script", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates scenario documents and skips Vectorize when endpoint configuration is missing", async () => {
    const data = makeTournamentData();
    const result = await generateAndMaybeIndexScenarios(data, {}, testDocuments);

    expect(result.indexed).toBe(false);
    expect(result.documentCount).toBe(1);
    expect(result.snapshotId).toBe("wc2026-test1234");
    expect(result.skippedReason).toContain("SCENARIO_INDEX_URL");
  });

  it("posts generated scenario documents to the configured indexing endpoint", async () => {
    const data = makeTournamentData();
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { snapshotId: string; documents: Array<{ metadata: { snapshotId: string } }> };
      expect(body.snapshotId).toBe("wc2026-test1234");
      expect(body.documents).toHaveLength(1);
      expect(body.documents.every((document) => document.metadata.snapshotId === body.snapshotId)).toBe(true);
      return new Response(JSON.stringify({ indexed: body.documents.length, skipped: 0 }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateAndMaybeIndexScenarios(data, {
      SCENARIO_INDEX_URL: "https://worldcup.test/api/scenario-index",
      SCENARIO_INDEX_TOKEN: "secret"
    }, testDocuments);

    expect(result.indexed).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://worldcup.test/api/scenario-index", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ authorization: "Bearer secret" })
    }));
  });
});
