interface Env {
  AI?: {
    run(model: string, input: unknown): Promise<unknown>;
  };
  SCENARIO_AI_MODEL?: string;
}

const defaultModel = "@cf/openai/gpt-oss-120b";
const maxQuestionLength = 280;
const maxContextLength = 24000;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Send a JSON body with a question and scenario context." }, 400);
  }

  const { question, team, context } = parsePayload(payload);
  if (!question) return json({ error: "Ask a scenario question first." }, 400);
  if (question.length > maxQuestionLength) return json({ error: `Keep questions under ${maxQuestionLength} characters.` }, 400);
  if (!context) return json({ error: "Scenario context is missing." }, 400);
  if (!env.AI) return json({ error: "Scenario questions are unavailable in this environment." }, 503);

  const prompt = buildPrompt(question, team, context);
  const result = await runAi(env, prompt);
  if (result instanceof Response) return result;
  const answer = extractAnswer(result);

  if (!answer) return json({ error: "The model did not return an answer." }, 502);
  return json({ answer });
};

async function runAi(env: Env, prompt: string) {
  try {
    return await env.AI!.run(env.SCENARIO_AI_MODEL ?? defaultModel, {
      prompt,
      max_tokens: 360,
      temperature: 0.2
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workers AI failed to answer.";
    return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}

function parsePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return { question: "", team: "", context: undefined };
  const record = payload as Record<string, unknown>;
  return {
    question: typeof record.question === "string" ? record.question.trim() : "",
    team: typeof record.team === "string" ? record.team.trim() : "",
    context: record.context
  };
}

function buildPrompt(question: string, team: string, context: unknown) {
  const contextJson = JSON.stringify(context).slice(0, maxContextLength);
  return [
    "You are a precise World Cup 2026 scenario explainer.",
    "Your job is to turn deterministic scenario data into a direct fan-facing answer.",
    "Use only the supplied JSON context. Do not invent teams, fixtures, scores, or probabilities. Do not browse.",
    "The context includes answerBrief, pressureSummary, qualificationRules, selectedGroupStandings, thirdPlaceTable, remainingGroupFixtures, outcomes, dependencies, marginNotes, and possibleOpponents.",
    "Always use answerBrief as the primary source. If answerBrief answers the question, do not say information is missing.",
    "For panic, danger, or how-many-goals questions, use pressureSummary first and keep the answer especially short.",
    "For qualification questions, answer in this order: direct route, projected third-place route, eliminated routes.",
    "Direct qualification can be stated firmly. Third-place qualification must be described as a live/current projection unless the context explicitly says it is guaranteed.",
    "Never say a third-place outcome means the team 'will qualify' without words like currently, projected, or dependent on the third-place table.",
    "Do not restate the user's question as a heading or first sentence.",
    "Do not say standings, third-place table, tie-breaker rules, or other results are missing when those keys are present.",
    "For 'miss out' or 'not qualify' questions: say whether any listed selected-match outcome eliminates the team. If none do, say that plainly. Then explain third-place pressure using answerBrief and thirdPlaceTable.",
    "For 'what do they need to win by' questions: answer the win/draw/loss branches from answerBrief. If any win is enough, say 'any win' rather than inventing a larger margin.",
    "Be concise: 1-3 bullets maximum. Each bullet should contain a concrete condition or conclusion.",
    "Mention score margins only when answerBrief, marginNotes, or outcomes contain them.",
    "If the supplied context genuinely cannot answer the question, name the exact missing key.",
    `Selected team: ${team || "unknown"}`,
    `Question: ${question}`,
    `Scenario context JSON: ${contextJson}`
  ].join("\n\n");
}

function extractAnswer(result: unknown): string {
  if (typeof result === "string") return result.trim();
  if (!result || typeof result !== "object") return "";

  const record = result as Record<string, unknown>;
  for (const key of ["response", "answer", "text"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  const choices = record.choices;
  if (Array.isArray(choices)) {
    const first = choices[0] as Record<string, unknown> | undefined;
    const message = first?.message as Record<string, unknown> | undefined;
    if (typeof message?.content === "string") return message.content.trim();
    if (typeof first?.text === "string") return first.text.trim();
  }

  return "";
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store"
    }
  });
}
