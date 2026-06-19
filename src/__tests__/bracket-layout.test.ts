import { describe, expect, it } from "vitest";
import { buildBracketLayout } from "../engine/bracket-layout";
import { projectTournament } from "../engine/knockout";
import { tournamentData } from "../data/tournament";

describe("bracket layout", () => {
  it("positions projected matches into left, right, and center bracket regions", () => {
    const layout = buildBracketLayout(projectTournament(tournamentData, {}));

    expect(layout.nodes.some((node) => node.side === "left" && node.match.fixtureId === "m073")).toBe(true);
    expect(layout.nodes.some((node) => node.side === "right" && node.match.fixtureId === "m088")).toBe(true);
    expect(layout.nodes.some((node) => node.side === "center" && node.match.fixtureId === "m104")).toBe(true);
  });

  it("builds connector paths from source fixtures to downstream matches", () => {
    const layout = buildBracketLayout(projectTournament(tournamentData, {}));

    expect(layout.connectors).toContainEqual(expect.objectContaining({
      fromFixtureId: "m073",
      toFixtureId: "m090"
    }));
    expect(layout.connectors).toContainEqual(expect.objectContaining({
      fromFixtureId: "m101",
      toFixtureId: "m104"
    }));
    expect(layout.connectors.every((connector) => connector.path.startsWith("M "))).toBe(true);
  });

  it("keeps semifinal, final, and third-place nodes from overlapping", () => {
    const layout = buildBracketLayout(projectTournament(tournamentData, {}));
    const centerStageNodes = layout.nodes.filter((node) => [101, 102, 103, 104].includes(node.match.matchNumber));

    for (let leftIndex = 0; leftIndex < centerStageNodes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < centerStageNodes.length; rightIndex += 1) {
        expect(overlaps(centerStageNodes[leftIndex], centerStageNodes[rightIndex])).toBe(false);
      }
    }
  });
});

function overlaps(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number }
) {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y;
}
