import type { Fixture, FixtureId, PredictionMap, Score, TournamentData } from "../types";

export type PredictionInputDecision =
  | { kind: "complete"; score: Score }
  | { kind: "cleared" }
  | { kind: "partial" };

export function isEditableFixture(fixture: Fixture): boolean {
  return fixture.status !== "completed" && !fixture.result;
}

export function interpretPredictionInput(
  homeValue: string | undefined,
  awayValue: string | undefined,
  hasExistingPrediction = false,
  decisionValue: string | undefined = "regular",
  winnerValue: string | undefined = "",
  requiresWinner = false
): PredictionInputDecision {
  const homeEmpty = homeValue === undefined || homeValue === "";
  const awayEmpty = awayValue === undefined || awayValue === "";
  const home = parsePredictionInputValue(homeValue);
  const away = parsePredictionInputValue(awayValue);
  const decision = parseDecision(decisionValue);
  const winner = parseWinner(winnerValue);

  if (home !== undefined && away !== undefined) {
    if (!decision) return { kind: "partial" };
    const knockoutDecision = requiresWinner && home === away && decision === "regular" ? "aet" : decision;
    return { kind: "complete", score: { home, away, ...(knockoutDecision !== "regular" ? { decision: knockoutDecision } : {}), ...(winner ? { winner } : {}) } };
  }

  if ((homeEmpty && awayEmpty) || (hasExistingPrediction && (homeEmpty || awayEmpty))) {
    return { kind: "cleared" };
  }

  return { kind: "partial" };
}

export function sanitizePredictions(data: TournamentData, predictions: unknown): PredictionMap {
  if (!predictions || typeof predictions !== "object" || Array.isArray(predictions)) return {};

  const fixtures = new Map(data.fixtures.map((fixture) => [fixture.id, fixture]));
  const sanitized: PredictionMap = {};

  for (const [fixtureId, rawScore] of Object.entries(predictions as Record<string, unknown>)) {
    const fixture = fixtures.get(fixtureId);
    if (!fixture || !isEditableFixture(fixture) || !isScoreForFixture(fixture, rawScore)) continue;
    const score = normalizeScore(rawScore);
    sanitized[fixtureId] = {
      home: score.home,
      away: score.away,
      ...(score.decision ? { decision: score.decision } : {}),
      ...(score.winner ? { winner: score.winner } : {})
    };
  }

  return sanitized;
}

export function getAppliedScore(fixture: Fixture, predictions: PredictionMap): Score | undefined {
  if (fixture.result) return fixture.result;
  if (!isEditableFixture(fixture)) return undefined;
  return predictions[fixture.id];
}

export function setPrediction(data: TournamentData, predictions: PredictionMap, fixtureId: FixtureId, score?: Score): PredictionMap {
  const fixture = data.fixtures.find((candidate) => candidate.id === fixtureId);
  if (!fixture || !isEditableFixture(fixture)) return predictions;

  const next = { ...predictions };
  if (!score) {
    delete next[fixtureId];
    return next;
  }

  if (isScoreForFixture(fixture, score)) next[fixtureId] = normalizeScore(score);
  return next;
}

function isScoreForFixture(fixture: Fixture, value: unknown): value is Score {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Score;
  if (!Number.isInteger(maybe.home) || !Number.isInteger(maybe.away) || maybe.home < 0 || maybe.away < 0 || maybe.home > 99 || maybe.away > 99) {
    return false;
  }
  if (maybe.decision && !parseDecision(maybe.decision)) return false;
  if (maybe.winner && !parseWinner(maybe.winner)) return false;
  if (fixture.stage === "group") return !maybe.decision && !maybe.winner;
  if (maybe.home !== maybe.away) return maybe.decision !== "penalties";
  return maybe.decision === "aet" || maybe.decision === "penalties";
}

function normalizeScore(score: Score): Score {
  return {
    home: score.home,
    away: score.away,
    ...(score.decision && score.decision !== "regular" ? { decision: score.decision } : {}),
    ...(score.decision === "penalties" && score.winner ? { winner: score.winner } : {})
  };
}

function parsePredictionInputValue(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) return undefined;

  return parsed;
}

function parseDecision(value: string | undefined): Score["decision"] | undefined {
  if (!value || value === "regular") return "regular";
  if (value === "aet" || value === "penalties") return value;
  return undefined;
}

function parseWinner(value: string | undefined): Score["winner"] | undefined {
  if (value === "home" || value === "away") return value;
  return undefined;
}
