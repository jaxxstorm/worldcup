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
        expect.objectContaining({ role: "system", content: expect.stringContaining("Always use answerSeed and answerBrief as primary sources") }),
        expect.objectContaining({ role: "user", content: expect.stringContaining("Scotland beat Brazil 1-0") })
      ]),
      temperature: 0.2
    }), { gateway: { id: "worldcup2026" } });
    const calls = run.mock.calls as unknown as Array<[string, { messages?: Array<{ role: string; content: string }> }, { gateway?: { id?: string } }]>;
    const aiInput = calls[0]?.[1];
    const systemMessage = aiInput?.messages?.find((message) => message.role === "system")?.content ?? "";
    expect(systemMessage).toContain("determine all logical scenarios");
    expect(systemMessage).toContain("answerSeed");
    expect(systemMessage).toContain("jeopardyRoutes");
    expect(systemMessage).toContain("jeopardyChasers");
    expect(systemMessage).toContain("finishPaths");
    expect(systemMessage).toContain("Treat answerSeed, jeopardyRoutes, jeopardyChasers, qualificationPaths, and finishPaths as the source-of-truth");
    expect(systemMessage).toContain("missOutSummary");
    expect(systemMessage).toContain("use jeopardyRoutes and jeopardyChasers before missOutSummary");
    expect(systemMessage).toContain("Never answer a miss-out question with only generic wording");
    expect(systemMessage).toContain("Never output role labels, hidden reasoning");
    expect(systemMessage).toContain("Do not use vague tie-breaker caveats");
    expect(systemMessage).toContain("Do not restate the user's question");
    expect(systemMessage).toContain("use pressureSummary first");
    expect(systemMessage).toContain("use all jeopardyChasers, jeopardyRoutes");
    expect(systemMessage).toContain("groupOutcomeCombinations");
    expect(systemMessage).toContain("if they draw but someone else wins");
    expect(systemMessage).toContain("which teams can pass them?");
    expect(systemMessage).toContain("Do not bound third-place pressure to one fixture or one example");
    expect(systemMessage).toContain("Third-place qualification must be described as a live/current projection");
    expect(systemMessage).toContain("For qualification questions, answer in this order");
    expect(systemMessage).toContain("bounded scenario share");
    expect(systemMessage).toContain("Do not force the answer into four bullets");
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
          answerSeed: ["Qualification paths", "Algeria qualify directly through: any win.", "Jeopardy routes", "If Algeria lose and Czechia win, Algeria are in trouble."],
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
      answer: "Qualification paths\nAlgeria qualify directly through: any win.\nJeopardy routes\nIf Algeria lose and Czechia win, Algeria are in trouble."
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
          jeopardyChasers: [
            {
              passingTeamName: "South Korea",
              resultCondition: "Czechia win m005 by 1+",
              baselineCondition: "Scotland lose by 1"
            }
          ],
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
      answer: "- South Korea can pass if Czechia win m005 by 1+ after Scotland lose by 1."
    });
  });

  it("falls back to named miss-out context for miss-out questions", async () => {
    const run = vi.fn(async () => ({ reasoning: "hidden" }));
    const response = await onRequestPost({
      request: jsonRequest({
        question: "What needs to happen for Scotland to miss out?",
        team: "Scotland",
        context: {
          jeopardyRoutes: [
            {
              summary: "If Scotland lose to Brazil by 2 and Czechia plus Senegal win, Scotland drop to 9th and miss out."
            }
          ],
          missOutSummary: [
            "No listed selected-match outcome alone eliminates Scotland.",
            "Scotland's miss-out route is third-place pressure.",
            "Named third-place teams that can pass Scotland:",
            "South Korea can pass Scotland if Czechia win m005 by 1+ after Scotland lose by 1.",
            "DR Congo can pass Scotland if DR Congo win m066 by 1+ after Scotland lose by 1."
          ],
          userFacingSummary: ["Scotland miss out if enough chasing third-place teams pass them."]
        }
      }),
      env: { AI: { run } }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      answer: "- If Scotland lose to Brazil by 2 and Czechia plus Senegal win, Scotland drop to 9th and miss out."
    });
  });

  it("falls back to bounded scenario share for chance questions", async () => {
    const run = vi.fn(async () => ({ reasoning: "hidden" }));
    const response = await onRequestPost({
      request: jsonRequest({
        question: "What percent chance do Scotland have of missing out?",
        team: "Scotland",
        context: {
          jeopardyBaselines: [
            {
              condition: "Scotland lose to Brazil by 2",
              scenarioShare: { eliminating: 3, tested: 16, percent: 19 }
            }
          ],
          answerSeed: ["This should not be used for chance questions."]
        }
      }),
      env: { AI: { run } }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      answer: "- Scotland lose to Brazil by 2: bounded scenario share 3 of 16 tested compatible chaser combinations (19%). This is not a real probability model."
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
