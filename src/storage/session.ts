import type { PredictionMap, TournamentData } from "../types";
import { sanitizePredictions } from "../engine/predictions";

export const predictionStorageKey = "worldcup-2026-predictions";

export interface PredictionStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadPredictions(data: TournamentData, storage: PredictionStore = window.sessionStorage): PredictionMap {
  try {
    const raw = storage.getItem(predictionStorageKey);
    if (!raw) return {};
    return sanitizePredictions(data, JSON.parse(raw));
  } catch {
    storage.removeItem(predictionStorageKey);
    return {};
  }
}

export function savePredictions(predictions: PredictionMap, storage: PredictionStore = window.sessionStorage) {
  storage.setItem(predictionStorageKey, JSON.stringify(predictions));
}
