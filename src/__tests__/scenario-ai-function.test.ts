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
      messages: expect.arrayContaining([
        expect.objectContaining({ role: "system", content: expect.stringContaining("Always use answerBrief as the primary source") }),
        expect.objectContaining({ role: "user", content: expect.stringContaining("Scotland beat Brazil 1-0") })
      ]),
      temperature: 0.2
    }), { gateway: { id: "worldcup2026" } });
    const calls = run.mock.calls as unknown as Array<[string, { messages?: Array<{ role: string; content: string }> }, { gateway?: { id?: string } }]>;
    const aiInput = calls[0]?.[1];
    const systemMessage = aiInput?.messages?.find((message) => message.role === "system")?.content ?? "";
    expect(systemMessage).toContain("determine all logical scenarios");
    expect(systemMessage).toContain("Never output role labels, hidden reasoning");
    expect(systemMessage).toContain("Do not use vague tie-breaker caveats");
    expect(systemMessage).toContain("Do not restate the user's question");
    expect(systemMessage).toContain("use pressureSummary first");
    expect(systemMessage).toContain("use all chasingTeams, pressureNotes");
    expect(systemMessage).toContain("groupOutcomeCombinations");
    expect(systemMessage).toContain("if they draw but someone else wins");
    expect(systemMessage).toContain("which teams can pass them?");
    expect(systemMessage).toContain("Do not bound third-place pressure to one fixture or one example");
    expect(systemMessage).toContain("Third-place qualification must be described as a live/current projection");
    expect(systemMessage).toContain("For qualification questions, answer in this order");
    expect(calls[0]?.[2]).toEqual({ gateway: { id: "worldcup2026" } });
  });

  it("allows model and gateway overrides", async () => {
    const run = vi.fn(async () => ({ response: "ok" }));
    await onRequestPost({
      request: jsonRequest({
        question: "How could Scotland qualify?",
        team: "Scotland",
        context: { answerBrief: ["Any win works."] }
      }),
      env: { AI: { run }, SCENARIO_AI_MODEL: "@cf/test/model", SCENARIO_AI_GATEWAY_ID: "test-gateway" }
    });

    expect(run).toHaveBeenCalledWith("@cf/test/model", expect.any(Object), { gateway: { id: "test-gateway" } });
  });

  it("strips leaked analysis and role markers from model output", async () => {
    const run = vi.fn(async () => ({
      response: "assistantanalysisWe need to answer from context.\n\nassistantfinal- Win: safe.\n- Lose: needs third-place pressure."
    }));
    const response = await onRequestPost({
      request: jsonRequest({
        question: "How could Algeria miss out?",
        team: "Algeria",
        context: { answerBrief: ["No listed selected-match outcome eliminates Algeria."] }
      }),
      env: { AI: { run } }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ answer: "- Win: safe.\n- Lose: needs third-place pressure." });
  });

  it("extracts answers from OpenAI-style output content arrays", async () => {
    const run = vi.fn(async () => ({
      output: [{ content: [{ text: "- Algeria need enough teams to pass them." }] }]
    }));
    const response = await onRequestPost({
      request: jsonRequest({
        question: "How could Algeria miss out?",
        team: "Algeria",
        context: { answerBrief: ["No listed selected-match outcome eliminates Algeria."] }
      }),
      env: { AI: { run } }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ answer: "- Algeria need enough teams to pass them." });
  });

  it("falls back to deterministic context when the model shape has no extractable answer", async () => {
    const run = vi.fn(async () => ({ reasoning: "hidden" }));
    const response = await onRequestPost({
      request: jsonRequest({
        question: "How could Algeria miss out?",
        team: "Algeria",
        context: {
          userFacingSummary: ["Any win qualifies Algeria directly.", "A draw or loss currently projects Algeria through third place."],
          answerBrief: ["No listed selected-match outcome eliminates Algeria."],
          pressureSummary: ["Lose by 1: Algeria are 5th in the third-place table."],
          chasingTeams: ["South Korea can pass Algeria if Czechia win m005 by 1+."]
        }
      }),
      env: { AI: { run } }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      answer: "- Any win qualifies Algeria directly.\n- A draw or loss currently projects Algeria through third place.\n- Lose by 1: Algeria are 5th in the third-place table.\n- South Korea can pass Algeria if Czechia win m005 by 1+."
    });
  });

  it("falls back to chasing teams for overtake follow-ups", async () => {
    const run = vi.fn(async () => ({ reasoning: "hidden" }));
    const response = await onRequestPost({
      request: jsonRequest({
        question: "Which teams can pass Scotland and how?",
        team: "Scotland",
        context: {
          userFacingSummary: ["Scotland are currently projected through third place."],
          chasingTeams: [
            "South Korea can pass Scotland if Czechia win m005 by 1+ after Scotland lose by 1.",
            "Qatar can pass Scotland if Qatar win m012 by 1+ after Scotland lose by 1."
          ]
        }
      }),
      env: { AI: { run } }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      answer: "- South Korea can pass Scotland if Czechia win m005 by 1+ after Scotland lose by 1.\n- Qatar can pass Scotland if Qatar win m012 by 1+ after Scotland lose by 1."
    });
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
