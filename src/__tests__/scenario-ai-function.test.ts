import { describe, expect, it, vi } from "vitest";
import { onRequestPost } from "../../functions/api/scenario-question";

describe("scenario question function", () => {
  it("asks Workers AI with the supplied compact context", async () => {
    const run = vi.fn(async () => ({ response: "- Scotland qualify if the listed outcomes hold." }));
    const response = await onRequestPost({
      request: jsonRequest({
        question: "How could Scotland qualify?",
        team: "Scotland",
        context: { team: { name: "Scotland" }, outcomes: [{ condition: "Scotland beat Brazil 1-0" }] }
      }),
      env: { AI: { run } }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ answer: "- Scotland qualify if the listed outcomes hold." });
    expect(run).toHaveBeenCalledWith("@cf/openai/gpt-oss-120b", expect.objectContaining({
      prompt: expect.stringContaining("Scotland beat Brazil 1-0"),
      temperature: 0.2
    }));
    const calls = run.mock.calls as unknown as Array<[string, { prompt?: string }]>;
    const aiInput = calls[0]?.[1];
    expect(aiInput).toEqual(expect.objectContaining({
      prompt: expect.stringContaining("Always use answerBrief as the primary source")
    }));
    expect(aiInput.prompt).toContain("Do not restate the user's question");
    expect(aiInput.prompt).toContain("use pressureSummary first");
    expect(aiInput.prompt).toContain("Third-place qualification must be described as a live/current projection");
    expect(aiInput.prompt).toContain("For qualification questions, answer in this order");
  });

  it("fails gracefully when the AI binding is unavailable", async () => {
    const response = await onRequestPost({
      request: jsonRequest({
        question: "How could Scotland not qualify?",
        team: "Scotland",
        context: { team: { name: "Scotland" } }
      }),
      env: {}
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Scenario questions are unavailable in this environment." });
  });

  it("validates empty questions", async () => {
    const response = await onRequestPost({
      request: jsonRequest({ question: "", team: "Scotland", context: { team: { name: "Scotland" } } }),
      env: { AI: { run: vi.fn() } }
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Ask a scenario question first." });
  });
});

function jsonRequest(body: unknown) {
  return new Request("https://worldcup.test/api/scenario-question", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}
