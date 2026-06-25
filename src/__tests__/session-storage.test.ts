import { describe, expect, it } from "vitest";
import { loadPredictions, predictionStorageKey, savePredictions, type PredictionStore } from "../storage/session";
import { fixtureById, makeTournamentData, setFixtureResult } from "./fixtures/tournament";

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
    const data = makeTournamentData();
    const storage = new MemoryStorage();
    const openFixture = fixtureById(data, "m001");

    savePredictions({ [openFixture.id]: { home: 2, away: 1 } }, storage);

    expect(loadPredictions(data, storage)).toEqual({
      [openFixture.id]: { home: 2, away: 1 }
    });
  });

  it("discards invalid JSON", () => {
    const data = makeTournamentData();
    const storage = new MemoryStorage();
    storage.setItem(predictionStorageKey, "{not-json");

    expect(loadPredictions(data, storage)).toEqual({});
    expect(storage.getItem(predictionStorageKey)).toBeNull();
  });

  it("discards predictions for completed fixtures", () => {
    const data = makeTournamentData();
    setFixtureResult(data, "m001", 1, 0);
    const storage = new MemoryStorage();
    const completed = fixtureById(data, "m001");
    storage.setItem(predictionStorageKey, JSON.stringify({ [completed.id]: { home: 1, away: 1 } }));

    expect(loadPredictions(data, storage)).toEqual({});
  });
});
