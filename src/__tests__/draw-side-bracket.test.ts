import { describe, expect, it } from "vitest";
import { drawSidesForProjection } from "../engine/knockout";
import type { MatchStage, ProjectedMatch } from "../types";

function match(matchNumber: number, stage: MatchStage = "round-of-32"): ProjectedMatch {
  return {
    fixtureId: `m${String(matchNumber).padStart(3, "0")}`,
    stage,
    matchNumber,
    date: "2026-06-28T19:00:00Z",
    venueId: "venue",
    homeSource: "1A",
    awaySource: "2B",
    home: { slot: "1A", label: "1A" },
    away: { slot: "2B", label: "2B" }
  };
}

describe("draw side bracket grouping", () => {
  it("splits round-of-32 matches into left and right sides by bracket order", () => {
    const sides = drawSidesForProjection(Array.from({ length: 16 }, (_, index) => match(73 + index)));

    expect(sides.map((side) => side.label)).toEqual(["Left Side", "Right Side"]);
    expect(sides[0].matches.map((candidate) => candidate.matchNumber)).toEqual([73, 74, 75, 76, 77, 78, 79, 80]);
    expect(sides[1].matches.map((candidate) => candidate.matchNumber)).toEqual([81, 82, 83, 84, 85, 86, 87, 88]);
  });

  it("sorts matches before assigning sides", () => {
    const sides = drawSidesForProjection([match(76), match(73), match(75), match(74)]);

    expect(sides[0].matches.map((candidate) => candidate.matchNumber)).toEqual([73, 74]);
    expect(sides[1].matches.map((candidate) => candidate.matchNumber)).toEqual([75, 76]);
  });

  it("ignores non round-of-32 matches", () => {
    const sides = drawSidesForProjection([match(73), match(89, "round-of-16"), match(74)]);

    expect(sides[0].matches.map((candidate) => candidate.matchNumber)).toEqual([73]);
    expect(sides[1].matches.map((candidate) => candidate.matchNumber)).toEqual([74]);
  });

  it("puts the extra match on the left side when input is uneven", () => {
    const sides = drawSidesForProjection([match(73), match(74), match(75)]);

    expect(sides[0].matches.map((candidate) => candidate.matchNumber)).toEqual([73, 74]);
    expect(sides[1].matches.map((candidate) => candidate.matchNumber)).toEqual([75]);
  });
});
