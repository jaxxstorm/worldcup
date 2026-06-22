import { sanitizePredictions } from "../engine/predictions";
import type { PredictionMap, TournamentData } from "../types";

export const predictionShareParam = "p";

export function encodePredictionShare(predictions: PredictionMap): string {
  return toBase64Url(JSON.stringify(predictions));
}

export function decodePredictionShare(data: TournamentData, payload: string): PredictionMap | undefined {
  try {
    return sanitizePredictions(data, JSON.parse(fromBase64Url(payload)));
  } catch {
    return undefined;
  }
}

export function sharedPredictionsFromUrl(data: TournamentData, href: string): PredictionMap | undefined {
  const url = new URL(href);
  const payload = url.searchParams.get(predictionShareParam);
  if (!payload) return undefined;
  return decodePredictionShare(data, payload);
}

export function buildPredictionShareUrl(data: TournamentData, href: string, predictions: PredictionMap): string {
  const url = new URL(href);
  const sanitized = sanitizePredictions(data, predictions);

  if (Object.keys(sanitized).length === 0) {
    url.searchParams.delete(predictionShareParam);
  } else {
    url.searchParams.set(predictionShareParam, encodePredictionShare(sanitized));
  }

  return url.toString();
}

function toBase64Url(value: string) {
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(`${base64}${padding}`);
}
