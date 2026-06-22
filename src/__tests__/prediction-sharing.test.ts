import { describe, expect, it } from "vitest";
import { tournamentData } from "../data/tournament";
import { buildPredictionShareUrl, decodePredictionShare, encodePredictionShare, predictionShareParam, sharedPredictionsFromUrl } from "../storage/share";
import type { PredictionMap } from "../types";

describe("prediction sharing", () => {
  it("round-trips valid predictions through a share payload", () => {
    const openFixture = tournamentData.fixtures.find((fixture) => fixture.status === "scheduled")!;
    const predictions: PredictionMap = { [openFixture.id]: { home: 2, away: 1 } };
    const payload = encodePredictionShare(predictions);

    expect(decodePredictionShare(tournamentData, payload)).toEqual(predictions);
  });

  it("loads shared predictions from a URL", () => {
    const openFixture = tournamentData.fixtures.find((fixture) => fixture.status === "scheduled")!;
    const predictions: PredictionMap = { [openFixture.id]: { home: 1, away: 0 } };
    const url = buildPredictionShareUrl(tournamentData, "https://example.test/worldcup?view=main", predictions);

    expect(new URL(url).searchParams.get("view")).toBe("main");
    expect(sharedPredictionsFromUrl(tournamentData, url)).toEqual(predictions);
  });

  it("ignores invalid share data", () => {
    expect(sharedPredictionsFromUrl(tournamentData, `https://example.test/?${predictionShareParam}=not-valid`)).toBeUndefined();
  });

  it("sanitizes shared predictions for completed fixtures", () => {
    const completed = tournamentData.fixtures.find((fixture) => fixture.status === "completed")!;
    const payload = encodePredictionShare({ [completed.id]: { home: 9, away: 9 } });

    expect(decodePredictionShare(tournamentData, payload)).toEqual({});
  });

  it("removes the share parameter for an empty prediction model", () => {
    const url = buildPredictionShareUrl(tournamentData, `https://example.test/?${predictionShareParam}=old`, {});

    expect(new URL(url).searchParams.has(predictionShareParam)).toBe(false);
  });
});
