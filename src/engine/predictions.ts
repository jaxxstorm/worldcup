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
  hasExistingPrediction = false
): PredictionInputDecision {
  const homeEmpty = homeValue === undefined || homeValue === "";
  const awayEmpty = awayValue === undefined || awayValue === "";
  const home = parsePredictionInputValue(homeValue);
  const away = parsePredictionInputValue(awayValue);

  if (home !== undefined && away !== undefined) {
    return { kind: "complete", score: { home, away } };
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
    if (!fixture || !isEditableFixture(fixture) || !isScore(rawScore)) continue;
    sanitized[fixtureId] = {
      home: rawScore.home,
      away: rawScore.away
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

  if (isScore(score)) next[fixtureId] = score;
  return next;
}

function isScore(value: unknown): value is Score {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Score;
  return Number.isInteger(maybe.home) && Number.isInteger(maybe.away) && maybe.home >= 0 && maybe.away >= 0 && maybe.home <= 99 && maybe.away <= 99;
}

function parsePredictionInputValue(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) return undefined;

  return parsed;
}
