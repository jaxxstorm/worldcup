interface Env {
  AI?: {
    run(model: string, input: unknown, options?: unknown): Promise<unknown>;
  };
  SCENARIO_AI_MODEL?: string;
  SCENARIO_AI_GATEWAY_ID?: string;
}

const defaultModel = "@cf/openai/gpt-oss-120b";
const defaultGatewayId = "worldcup2026";
const maxQuestionLength = 280;
const maxContextLength = 64000;

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

  const messages = buildMessages(question, team, context);
  const result = await runAi(env, messages);
  if (result instanceof Response) return result;
  const answer = extractAnswer(result) || fallbackAnswer(question, context);

  if (!answer) return json({ error: "The model did not return an answer." }, 502);
  return json({ answer });
};

async function runAi(env: Env, messages: Array<{ role: "system" | "user"; content: string }>) {
  try {
    return await env.AI!.run(env.SCENARIO_AI_MODEL ?? defaultModel, {
      messages,
      max_tokens: 360,
      temperature: 0.2
    }, {
      gateway: { id: env.SCENARIO_AI_GATEWAY_ID ?? defaultGatewayId }
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

function buildMessages(question: string, team: string, context: unknown) {
  const contextJson = JSON.stringify(context).slice(0, maxContextLength);
  const system = [
    "You are a precise World Cup 2026 scenario explainer.",
    "The user asked a scenario question. Your job is to determine all logical scenarios that answer it using the information at your disposal in the supplied JSON context.",
    "You are not chatting, brainstorming, or showing your work. Return only the final fan-facing answer.",
    "Use only the supplied JSON context. Do not invent teams, fixtures, scores, or probabilities. Do not browse.",
    "The context includes answerSeed, qualificationPaths, finishPaths, jeopardyBaselines, jeopardyChasers, jeopardyRoutes, missOutSummary, userFacingSummary, answerBrief, pressureSummary, chasingTeams, qualificationRules, selectedGroupStandings, thirdPlaceTable, remainingGroupFixtures, groupOutcomeCombinations, outcomes, dependencies, marginNotes, and possibleOpponents.",
    "Treat answerSeed, jeopardyRoutes, jeopardyChasers, qualificationPaths, and finishPaths as the source-of-truth explanation material. Preserve their concrete facts and lightly rewrite them for readability.",
    "For miss-out, not-qualify, pass, overtake, or danger questions, use jeopardyRoutes and jeopardyChasers before missOutSummary, and use missOutSummary before userFacingSummary.",
    "Use userFacingSummary only when it directly answers the question without generic dependency language.",
    "If userFacingSummary says chasing teams can pass the selected team, include the concrete teams, routes, and margins from jeopardyRoutes/jeopardyChasers.",
    "Always use answerSeed and answerBrief as primary sources. If they answer the question, do not say information is missing.",
    "Use groupOutcomeCombinations whenever the user asks about same-group dependencies, another group game, or branches like 'if they draw but someone else wins'. These are precomputed selected-team result plus other group-result combinations.",
    "When groupOutcomeCombinations are relevant, name the selected condition, the other fixture condition, and the resulting qualification status or round-of-32 effect.",
    "For panic, danger, or how-many-goals questions, use pressureSummary first and keep the answer especially short.",
    "For qualification questions, answer in this order when available: direct routes from qualificationPaths, projected third-place routes, concrete miss-out routes from jeopardyRoutes, then likely round-of-32 opponents from finishPaths.",
    "For 'how could they miss out' questions, include at least one concrete route from jeopardyRoutes when it is non-empty. If no route exists, explain the closest jeopardyBaselines and name jeopardyChasers.",
    "Never answer a miss-out question with only generic wording such as 'enough chasing teams pass them' or only the number of buffer places. If jeopardyRoutes or jeopardyChasers name teams, include those names and fixture margins.",
    "For questions like 'which teams can pass them?', 'who can overtake them?', or 'how?', answer from jeopardyChasers first. Name each listed team/result and required margin concisely.",
    "For follow-up examples such as 'what if Czechia win?' or 'someone else wins big?', use all jeopardyChasers, jeopardyRoutes, and thirdPlaceTable rows below the selected team to name the specific result, margin, third-place team moved above, and whether it is one buffer place or enough to eliminate.",
    "Do not bound third-place pressure to one fixture or one example when the context lists more chasers or routes. Summarize the concrete set concisely, grouping similar cases when needed.",
    "For chance, percent, or likelihood questions, only describe scenarioShare as bounded scenario share over tested compatible chaser combinations. Explicitly say it is not a real probability model.",
    "Direct qualification can be stated firmly. Third-place qualification must be described as a live/current projection unless the context explicitly says it is guaranteed.",
    "Never say a third-place outcome means the team 'will qualify' without words like currently, projected, or dependent on the third-place table.",
    "Do not use vague tie-breaker caveats such as 'if tie-breakers go against them'. Mention tie-breakers only when the context names the specific competing team, metric, and comparison. Otherwise omit tie-breakers.",
    "Never output role labels, hidden reasoning, analysis text, 'assistantanalysis', 'assistantfinal', scratchpad text, or planning notes.",
    "Do not restate the user's question as a heading or first sentence.",
    "Do not say standings, third-place table, tie-breaker rules, or other results are missing when those keys are present.",
    "For 'miss out' or 'not qualify' questions: say whether any listed selected-match outcome eliminates the team. If none do, say that plainly. Then explain third-place pressure using jeopardyRoutes and jeopardyChasers.",
    "For 'what do they need to win by' questions: answer the win/draw/loss branches from answerBrief. If any win is enough, say 'any win' rather than inventing a larger margin.",
    "Use short sections or compact paragraphs when they help. Do not force the answer into four bullets.",
    "Mention score margins only when answerBrief, marginNotes, or outcomes contain them.",
    "If the supplied context genuinely cannot answer the question, name the exact missing key."
  ].join("\n");
  const user = [
    `Selected team: ${team || "unknown"}`,
    `Question: ${question}`,
    `Scenario context JSON: ${contextJson}`
  ].join("\n\n");

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user }
  ];
}

function extractAnswer(result: unknown): string {
  if (typeof result === "string") return cleanAnswer(result);
  if (!result || typeof result !== "object") return "";

  const record = result as Record<string, unknown>;
  for (const key of ["response", "answer", "text"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return cleanAnswer(value);
  }

  const choices = record.choices;
  if (Array.isArray(choices)) {
    const first = choices[0] as Record<string, unknown> | undefined;
    const message = first?.message as Record<string, unknown> | undefined;
    if (typeof message?.content === "string") return cleanAnswer(message.content);
    if (Array.isArray(message?.content)) {
      const content = message.content
        .map((part) => typeof part === "string" ? part : typeof part?.text === "string" ? part.text : "")
        .filter(Boolean)
        .join("\n");
      if (content.trim()) return cleanAnswer(content);
    }
    if (typeof first?.text === "string") return cleanAnswer(first.text);
    if (typeof first?.content === "string") return cleanAnswer(first.content);
  }

  const output = record.output;
  if (Array.isArray(output)) {
    const content = output
      .flatMap((item) => {
        if (typeof item === "string") return [item];
        if (!item || typeof item !== "object") return [];
        const itemRecord = item as Record<string, unknown>;
        if (typeof itemRecord.text === "string") return [itemRecord.text];
        if (typeof itemRecord.content === "string") return [itemRecord.content];
        if (Array.isArray(itemRecord.content)) {
          return itemRecord.content.map((part) => {
            if (typeof part === "string") return part;
            if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") return (part as Record<string, string>).text;
            return "";
          });
        }
        return [];
      })
      .filter(Boolean)
      .join("\n");
    if (content.trim()) return cleanAnswer(content);
  }

  return "";
}

function fallbackAnswer(question: string, context: unknown) {
  if (!context || typeof context !== "object") return "";
  const record = context as Record<string, unknown>;
  const answerSeed = Array.isArray(record.answerSeed) ? record.answerSeed.filter((value): value is string => typeof value === "string") : [];
  const jeopardyRoutes = Array.isArray(record.jeopardyRoutes) ? record.jeopardyRoutes.filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object") : [];
  const jeopardyChasers = Array.isArray(record.jeopardyChasers) ? record.jeopardyChasers.filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object") : [];
  const jeopardyBaselines = Array.isArray(record.jeopardyBaselines) ? record.jeopardyBaselines.filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object") : [];
  const missOutSummary = Array.isArray(record.missOutSummary) ? record.missOutSummary.filter((value): value is string => typeof value === "string") : [];
  const userFacingSummary = Array.isArray(record.userFacingSummary) ? record.userFacingSummary.filter((value): value is string => typeof value === "string") : [];
  const answerBrief = Array.isArray(record.answerBrief) ? record.answerBrief.filter((value): value is string => typeof value === "string") : [];
  const pressureSummary = Array.isArray(record.pressureSummary) ? record.pressureSummary.filter((value): value is string => typeof value === "string") : [];
  const chasingTeams = Array.isArray(record.chasingTeams) ? record.chasingTeams.filter((value): value is string => typeof value === "string") : [];
  if (/\b(chance|percent|percentage|likelihood|likely)\b/i.test(question)) {
    const shareLines = scenarioShareFallback(jeopardyBaselines);
    if (shareLines.length > 0) return shareLines.join("\n");
  }
  if (/\b(miss out|not qualify|eliminat|danger)\b/i.test(question) && jeopardyRoutes.length > 0) {
    return jeopardyRoutes.slice(0, 5).map((route) => `- ${typeof route.summary === "string" ? route.summary : ""}`).filter((line) => line.trim() !== "-").join("\n");
  }
  if (/\b(who can|which teams?|pass|overtak)\b/i.test(question) && chasingTeams.length > 0) {
    const structuredChasers = jeopardyChasers
      .map((chaser) => typeof chaser.passingTeamName === "string" && typeof chaser.resultCondition === "string" && typeof chaser.baselineCondition === "string"
        ? `- ${chaser.passingTeamName} can pass if ${chaser.resultCondition} after ${chaser.baselineCondition}.`
        : "")
      .filter(Boolean);
    return (structuredChasers.length > 0 ? structuredChasers : chasingTeams.slice(0, 6).map((line) => `- ${line}`)).join("\n");
  }
  if (answerSeed.length > 0) return answerSeed.slice(0, 10).join("\n");
  if (/\b(miss out|not qualify|eliminat|danger)\b/i.test(question) && missOutSummary.length > 0) {
    return missOutSummary.slice(0, 6).map((line) => `- ${line}`).join("\n");
  }
  const source = [...missOutSummary, ...userFacingSummary, ...pressureSummary, ...chasingTeams, ...answerBrief.filter((line) => /miss out|eliminat|lose|pressure|fall out|top 8/i.test(line))].slice(0, 4);
  return source.length > 0 ? source.map((line) => `- ${line}`).join("\n") : "";
}

function scenarioShareFallback(jeopardyBaselines: Array<Record<string, unknown>>) {
  return jeopardyBaselines.flatMap((baseline) => {
    const condition = typeof baseline.condition === "string" ? baseline.condition : "";
    const share = baseline.scenarioShare;
    if (!condition || !share || typeof share !== "object") return [];
    const record = share as Record<string, unknown>;
    const eliminating = typeof record.eliminating === "number" ? record.eliminating : 0;
    const tested = typeof record.tested === "number" ? record.tested : 0;
    const percent = typeof record.percent === "number" ? record.percent : 0;
    if (tested === 0) return [];
    return [`- ${condition}: bounded scenario share ${eliminating} of ${tested} tested compatible chaser combinations (${percent}%). This is not a real probability model.`];
  }).slice(0, 5);
}

function cleanAnswer(value: string) {
  let answer = value.trim();
  const finalMarker = answer.match(/assistant\s*final\s*:?\s*/i);
  if (finalMarker?.index !== undefined) {
    answer = answer.slice(finalMarker.index + finalMarker[0].length).trim();
  }
  answer = answer
    .replace(/assistant\s*analysis[\s\S]*?(?=assistant\s*final|$)/gi, "")
    .replace(/^assistant\s*final\s*:?\s*/i, "")
    .replace(/^final\s*:?\s*/i, "")
    .trim();
  return answer;
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store"
    }
  });
}
