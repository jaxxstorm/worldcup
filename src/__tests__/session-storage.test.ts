import { describe, expect, it } from "vitest";
import { tournamentData } from "../data/tournament";
import { loadPredictions, predictionStorageKey, savePredictions, type PredictionStore } from "../storage/session";

class MemoryStorage implements PredictionStore {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("session storage", () => {
  it("saves and restores valid predictions", () => {
    const storage = new MemoryStorage();
    const openFixture = tournamentData.fixtures.find((fixture) => fixture.status === "scheduled")!;

    savePredictions({ [openFixture.id]: { home: 2, away: 1 } }, storage);

    expect(loadPredictions(tournamentData, storage)).toEqual({
      [openFixture.id]: { home: 2, away: 1 }
    });
  });

  it("discards invalid JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem(predictionStorageKey, "{not-json");

    expect(loadPredictions(tournamentData, storage)).toEqual({});
    expect(storage.getItem(predictionStorageKey)).toBeNull();
  });

  it("discards predictions for completed fixtures", () => {
    const storage = new MemoryStorage();
    const completed = tournamentData.fixtures.find((fixture) => fixture.status === "completed")!;
    storage.setItem(predictionStorageKey, JSON.stringify({ [completed.id]: { home: 1, away: 1 } }));

    expect(loadPredictions(tournamentData, storage)).toEqual({});
  });
});
