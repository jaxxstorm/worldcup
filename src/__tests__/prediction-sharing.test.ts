import { describe, expect, it } from "vitest";
import { buildPredictionShareUrl, decodePredictionShare, encodePredictionShare, predictionShareParam, sharedPredictionsFromUrl } from "../storage/share";
import type { PredictionMap } from "../types";
import { fixtureById, makeTournamentData, setFixtureResult } from "./fixtures/tournament";

describe("prediction sharing", () => {
  it("round-trips valid predictions through a share payload", () => {
    const data = makeTournamentData();
    const openFixture = fixtureById(data, "m001");
    const predictions: PredictionMap = { [openFixture.id]: { home: 2, away: 1 } };
    const payload = encodePredictionShare(predictions);

    expect(decodePredictionShare(data, payload)).toEqual(predictions);
  });

  it("loads shared predictions from a URL", () => {
    const data = makeTournamentData();
    const openFixture = fixtureById(data, "m001");
    const predictions: PredictionMap = { [openFixture.id]: { home: 1, away: 0 } };
    const url = buildPredictionShareUrl(data, "https://example.test/worldcup?view=main", predictions);

    expect(new URL(url).searchParams.get("view")).toBe("main");
    expect(sharedPredictionsFromUrl(data, url)).toEqual(predictions);
  });

  it("ignores invalid share data", () => {
    expect(sharedPredictionsFromUrl(makeTournamentData(), `https://example.test/?${predictionShareParam}=not-valid`)).toBeUndefined();
  });

  it("sanitizes shared predictions for completed fixtures", () => {
    const data = makeTournamentData();
    setFixtureResult(data, "m001", 1, 0);
    const completed = fixtureById(data, "m001");
    const payload = encodePredictionShare({ [completed.id]: { home: 9, away: 9 } });

    expect(decodePredictionShare(data, payload)).toEqual({});
  });

  it("removes the share parameter for an empty prediction model", () => {
    const url = buildPredictionShareUrl(makeTournamentData(), `https://example.test/?${predictionShareParam}=old`, {});

    expect(new URL(url).searchParams.has(predictionShareParam)).toBe(false);
  });
});
