import type { ProjectedMatch } from "../types";

export interface BracketNode {
  match: ProjectedMatch;
  x: number;
  y: number;
  width: number;
  height: number;
  side: "left" | "right" | "center";
}

export interface BracketConnector {
  fromFixtureId: string;
  toFixtureId: string;
  path: string;
}

export interface BracketLayout {
  width: number;
  height: number;
  nodes: BracketNode[];
  connectors: BracketConnector[];
}

const nodeWidth = 214;
const nodeHeight = 130;
const top = 56;
const rowGap = 26;

const leftColumns = [24, 292, 560, 794];
const centerX = 1062;
const rightColumns = [2136, 1868, 1600, 1330];

const sideRounds = [
  { start: 73, end: 80, column: 0 },
  { start: 89, end: 92, column: 1 },
  { start: 97, end: 98, column: 2 },
  { start: 101, end: 101, column: 3 }
];

const rightRounds = [
  { start: 81, end: 88, column: 0 },
  { start: 93, end: 96, column: 1 },
  { start: 99, end: 100, column: 2 },
  { start: 102, end: 102, column: 3 }
];

export function buildBracketLayout(projection: ProjectedMatch[]): BracketLayout {
  const matchByNumber = new Map(projection.map((match) => [match.matchNumber, match]));
  const nodes: BracketNode[] = [];

  nodes.push(...buildSideNodes(matchByNumber, sideRounds, leftColumns, "left"));
  nodes.push(...buildSideNodes(matchByNumber, rightRounds, rightColumns, "right"));

  const semiNodes = nodes.filter((node) => node.match.matchNumber === 101 || node.match.matchNumber === 102);
  const finalY = average(semiNodes.map((node) => centerY(node))) - nodeHeight / 2;
  addCenterNode(nodes, matchByNumber.get(104), finalY, "center");
  addCenterNode(nodes, matchByNumber.get(103), finalY + nodeHeight + rowGap, "center");

  const nodeByFixtureId = new Map(nodes.map((node) => [node.match.fixtureId, node]));
  return {
    width: 2374,
    height: 1360,
    nodes,
    connectors: buildConnectors(nodes, nodeByFixtureId)
  };
}

function buildSideNodes(
  matchByNumber: Map<number, ProjectedMatch>,
  rounds: typeof sideRounds,
  columns: number[],
  side: "left" | "right"
): BracketNode[] {
  const nodes: BracketNode[] = [];
  const yByMatchNumber = new Map<number, number>();

  for (const round of rounds) {
    for (let matchNumber = round.start; matchNumber <= round.end; matchNumber += 1) {
      const match = matchByNumber.get(matchNumber);
      if (!match) continue;

      const childNumbers = sourceMatchNumbers(match);
      const y = childNumbers.length > 0 && childNumbers.every((child) => yByMatchNumber.has(child))
        ? average(childNumbers.map((child) => yByMatchNumber.get(child)!))
        : top + (matchNumber - round.start) * (nodeHeight + rowGap);

      yByMatchNumber.set(matchNumber, y);
      nodes.push({
        match,
        x: columns[round.column],
        y,
        width: nodeWidth,
        height: nodeHeight,
        side
      });
    }
  }

  return nodes;
}

function addCenterNode(nodes: BracketNode[], match: ProjectedMatch | undefined, y: number, side: "center") {
  if (!match) return;

  nodes.push({
    match,
    x: centerX,
    y,
    width: nodeWidth,
    height: nodeHeight,
    side
  });
}

function buildConnectors(nodes: BracketNode[], nodeByFixtureId: Map<string, BracketNode>): BracketConnector[] {
  return nodes.flatMap((node) =>
    sourceFixtureIds(node.match).flatMap((sourceFixtureId) => {
      const source = nodeByFixtureId.get(sourceFixtureId);
      if (!source) return [];

      return [{
        fromFixtureId: sourceFixtureId,
        toFixtureId: node.match.fixtureId,
        path: connectorPath(source, node)
      }];
    })
  );
}

function connectorPath(from: BracketNode, to: BracketNode): string {
  const fromRight = from.x + from.width;
  const toLeft = to.x;
  const fromLeft = from.x;
  const toRight = to.x + to.width;
  const startX = from.x < to.x ? fromRight : fromLeft;
  const endX = from.x < to.x ? toLeft : toRight;
  const midX = startX + (endX - startX) / 2;
  const startY = centerY(from);
  const endY = centerY(to);

  return `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
}

function sourceFixtureIds(match: ProjectedMatch): string[] {
  return [match.homeSource, match.awaySource]
    .flatMap((source) => Array.from(source.matchAll(/(?:Winner|Loser) (m\d{3})/g), (candidate) => candidate[1]));
}

function sourceMatchNumbers(match: ProjectedMatch): number[] {
  return sourceFixtureIds(match).map((fixtureId) => Number(fixtureId.slice(1))).filter((value) => Number.isFinite(value));
}

function centerY(node: BracketNode): number {
  return node.y + node.height / 2;
}

function average(values: number[]): number {
  if (values.length === 0) return top;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
