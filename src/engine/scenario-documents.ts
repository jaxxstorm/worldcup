import type { Fixture, FixtureId, GroupId, PredictionMap, Score, StandingRow, TeamId, TournamentData } from "../types";
import { getAppliedScore } from "./predictions";
import {
  buildScenarioQuestionContext,
  type ScenarioFinishPath,
  type ScenarioJeopardyChaser,
  type ScenarioJeopardyRoute,
  type ScenarioQualificationPath,
  type ScenarioQualificationStatus
} from "./scenarios";
import { scenarioSnapshotId } from "./scenario-snapshot";
import { calculateGroupStandings, thirdPlaceRankings } from "./standings";

export type ScenarioDocumentKind =
  | "team-summary"
  | "qualification-route"
  | "miss-out-route"
  | "third-place-chaser"
  | "third-place-jump"
  | "finish-path"
  | "rule-note";

export interface ScenarioDocumentMetadata {
  snapshotId: string;
  kind: ScenarioDocumentKind;
  teamId?: TeamId;
  teamName?: string;
  groupId?: GroupId;
  fixtureId?: FixtureId;
  relatedTeamId?: TeamId;
  relatedTeamName?: string;
  status?: ScenarioQualificationStatus;
  margin?: number;
}

export interface ScenarioDocument {
  id: string;
  title: string;
  text: string;
  metadata: ScenarioDocumentMetadata;
}

interface BoundedFixtureOutcome {
  score: Score;
  condition: string;
  winnerTeamId?: TeamId;
  margin?: number;
}

interface ThirdPlaceJumpCandidate {
  fixtureId: FixtureId;
  condition: string;
  group: GroupId;
  thirdPlaceTeamId: TeamId;
  thirdPlaceTeamName: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  margin?: number;
  winnerTeamId?: TeamId;
}

const maxDocumentTextLength = 1800;

export function generateScenarioDocuments(data: TournamentData, predictions: PredictionMap = {}): ScenarioDocument[] {
  const snapshotId = scenarioSnapshotId(data);
  const documents: ScenarioDocument[] = [];

  for (const team of data.teams.filter((candidate) => candidate.group).sort((left, right) => left.name.localeCompare(right.name))) {
    const context = buildScenarioQuestionContext(data, predictions, team.id);
    const baseMetadata = {
      snapshotId,
      teamId: team.id,
      teamName: team.name,
      groupId: team.group
    };

    documents.push(documentFromParts({
      snapshotId,
      kind: "team-summary",
      title: `${team.name} scenario summary`,
      parts: [
        `${team.name} are ${ordinal(context.current.rank)} in Group ${context.current.group} on ${context.current.points} pts, GD ${formatSignedNumber(context.current.goalDifference)}, GF ${context.current.goalsFor}.`,
        context.currentPath ? `Current round-of-32 path: ${context.currentPath.fixtureId} as ${context.currentPath.slot} vs ${context.currentPath.opponentLabel}.` : "No current round-of-32 assignment.",
        ...context.answerBrief.slice(0, 6)
      ],
      metadata: { ...baseMetadata, kind: "team-summary" }
    }));

    for (const [index, path] of context.qualificationPaths.entries()) {
      documents.push(qualificationRouteDocument(snapshotId, team.id, team.name, team.group!, path, index));
    }

    for (const [index, route] of context.jeopardyRoutes.entries()) {
      documents.push(missOutRouteDocument(snapshotId, team.id, team.name, team.group!, route, index));
    }

    for (const [index, chaser] of context.jeopardyChasers.entries()) {
      documents.push(chaserDocument(snapshotId, team.id, team.name, team.group!, chaser, index));
    }

    for (const [index, path] of context.finishPaths.entries()) {
      documents.push(finishPathDocument(snapshotId, team.id, team.name, team.group!, path, index));
    }
  }

  for (const [index, candidate] of thirdPlaceJumpCandidates(data, predictions).entries()) {
    documents.push(thirdPlaceJumpDocument(snapshotId, candidate, index));
  }

  for (const [index, rule] of [
    "The top two teams in each group qualify directly.",
    "The eight best third-place teams qualify through the third-place table.",
    "Third-place ranking is points, goal difference, goals for, then tournament tie-breakers."
  ].entries()) {
    documents.push(documentFromParts({
      snapshotId,
      kind: "rule-note",
      title: `Scenario rule ${index + 1}`,
      parts: [rule],
      metadata: { snapshotId, kind: "rule-note" }
    }));
  }

  return dedupeDocuments(documents);
}

export function thirdPlaceJumpCandidates(data: TournamentData, predictions: PredictionMap = {}): ThirdPlaceJumpCandidate[] {
  const baseStandings = calculateGroupStandings(data, predictions);
  const currentThirdByGroup = new Map<GroupId, StandingRow>();
  for (const [group, rows] of Object.entries(baseStandings) as Array<[GroupId, StandingRow[]]>) {
    const third = rows.find((row) => row.rank === 3);
    if (third) currentThirdByGroup.set(group, third);
  }

  const candidates = new Map<string, ThirdPlaceJumpCandidate>();
  const unresolvedFixtures = data.fixtures.filter((fixture) => fixture.stage === "group" && fixture.group && !getAppliedScore(fixture, predictions));

  for (const fixture of unresolvedFixtures) {
    for (const outcome of boundedFixtureOutcomes(data, fixture)) {
      const branchStandings = calculateGroupStandings(data, {
        ...predictions,
        [fixture.id]: outcome.score
      });
      const group = fixture.group!;
      const branchThird = branchStandings[group].find((row) => row.rank === 3);
      const currentThird = currentThirdByGroup.get(group);
      if (!branchThird || branchThird.teamId === currentThird?.teamId) continue;

      const key = `${fixture.id}:${outcome.winnerTeamId ?? "draw"}:${branchThird.teamId}`;
      const existing = candidates.get(key);
      const margin = outcome.margin ?? 0;
      const existingMargin = existing?.margin ?? 0;
      if (existing && existingMargin <= margin) continue;

      candidates.set(key, {
        fixtureId: fixture.id,
        condition: outcome.condition,
        group,
        thirdPlaceTeamId: branchThird.teamId,
        thirdPlaceTeamName: teamName(data, branchThird.teamId),
        points: branchThird.points,
        goalDifference: branchThird.goalDifference,
        goalsFor: branchThird.goalsFor,
        ...(outcome.margin ? { margin: outcome.margin } : {}),
        ...(outcome.winnerTeamId ? { winnerTeamId: outcome.winnerTeamId } : {})
      });
    }
  }

  return Array.from(candidates.values()).sort((left, right) =>
    left.thirdPlaceTeamName.localeCompare(right.thirdPlaceTeamName) ||
    left.fixtureId.localeCompare(right.fixtureId) ||
    (left.margin ?? 0) - (right.margin ?? 0)
  );
}

function qualificationRouteDocument(snapshotId: string, teamId: TeamId, teamNameValue: string, group: GroupId, path: ScenarioQualificationPath, index: number): ScenarioDocument {
  return documentFromParts({
    snapshotId,
    kind: "qualification-route",
    title: `${teamNameValue}: ${path.condition}`,
    parts: [
      `${path.condition}: ${teamNameValue} ${statusText(path.status)}, finish ${ordinal(path.groupFinish)} in Group ${group}, ${path.points} pts, GD ${formatSignedNumber(path.goalDifference)}, GF ${path.goalsFor}.`,
      path.roundOf32FixtureId ? `Round of 32: ${path.roundOf32FixtureId}${path.slot ? ` as ${path.slot}` : ""}${path.opponentLabel ? ` vs ${path.opponentLabel}` : ""}.` : "No round-of-32 fixture is resolved for this branch."
    ],
    metadata: {
      snapshotId,
      kind: "qualification-route",
      teamId,
      teamName: teamNameValue,
      groupId: group,
      status: path.status
    },
    idParts: [teamId, String(index), path.condition]
  });
}

function missOutRouteDocument(snapshotId: string, teamId: TeamId, teamNameValue: string, group: GroupId, route: ScenarioJeopardyRoute, index: number): ScenarioDocument {
  const firstFixtureId = route.events[0]?.fixtureId;
  return documentFromParts({
    snapshotId,
    kind: "miss-out-route",
    title: `${teamNameValue} miss-out route ${index + 1}`,
    parts: [
      route.summary,
      ...route.events.map((event) => `${event.fixtureId}: ${event.resultCondition}; passing teams: ${event.passingTeams.join(", ")}.`),
      route.scenarioShare.tested > 0
        ? `Bounded scenario share: ${route.scenarioShare.eliminating} of ${route.scenarioShare.tested} tested compatible combinations (${route.scenarioShare.percent}%). This is not a real probability.`
        : ""
    ],
    metadata: {
      snapshotId,
      kind: "miss-out-route",
      teamId,
      teamName: teamNameValue,
      groupId: group,
      ...(firstFixtureId ? { fixtureId: firstFixtureId } : {}),
      status: route.status
    },
    idParts: [teamId, String(index), route.baselineCondition]
  });
}

function chaserDocument(snapshotId: string, teamId: TeamId, teamNameValue: string, group: GroupId, chaser: ScenarioJeopardyChaser, index: number): ScenarioDocument {
  return documentFromParts({
    snapshotId,
    kind: "third-place-chaser",
    title: `${chaser.passingTeamName} can pass ${teamNameValue}`,
    parts: [
      `${chaser.passingTeamName} can pass ${teamNameValue} if ${chaser.resultCondition} after ${chaser.baselineCondition}.`,
      `${chaser.passingTeamName} become ${ordinal(chaser.thirdPlaceRank)} in the third-place table on ${chaser.points} pts, GD ${formatSignedNumber(chaser.goalDifference)}, GF ${chaser.goalsFor}.`
    ],
    metadata: {
      snapshotId,
      kind: "third-place-chaser",
      teamId,
      teamName: teamNameValue,
      groupId: group,
      fixtureId: chaser.fixtureId,
      relatedTeamId: chaser.passingTeamId,
      relatedTeamName: chaser.passingTeamName,
      ...(chaser.margin ? { margin: chaser.margin } : {})
    },
    idParts: [teamId, chaser.passingTeamId, chaser.fixtureId, String(index)]
  });
}

function finishPathDocument(snapshotId: string, teamId: TeamId, teamNameValue: string, group: GroupId, path: ScenarioFinishPath, index: number): ScenarioDocument {
  return documentFromParts({
    snapshotId,
    kind: "finish-path",
    title: `${teamNameValue} finish ${ordinal(path.groupFinish)}`,
    parts: [
      `${teamNameValue} finishing ${ordinal(path.groupFinish)} in Group ${group} maps to ${path.roundOf32FixtureId ?? "no resolved round-of-32 fixture"}${path.slot ? ` as ${path.slot}` : ""}${path.opponentLabel ? ` vs ${path.opponentLabel}` : ""}.`,
      `Example condition: ${path.condition}.`
    ],
    metadata: {
      snapshotId,
      kind: "finish-path",
      teamId,
      teamName: teamNameValue,
      groupId: group,
      ...(path.roundOf32FixtureId ? { fixtureId: path.roundOf32FixtureId } : {}),
      ...(path.opponentTeamId ? { relatedTeamId: path.opponentTeamId } : {}),
      ...(path.opponentLabel ? { relatedTeamName: path.opponentLabel } : {}),
      status: path.status
    },
    idParts: [teamId, String(path.groupFinish), String(index)]
  });
}

function thirdPlaceJumpDocument(snapshotId: string, candidate: ThirdPlaceJumpCandidate, index: number): ScenarioDocument {
  return documentFromParts({
    snapshotId,
    kind: "third-place-jump",
    title: `${candidate.thirdPlaceTeamName} can become third in Group ${candidate.group}`,
    parts: [
      `${candidate.thirdPlaceTeamName} can jump into third place in Group ${candidate.group} if ${candidate.condition}.`,
      `Resulting row: ${candidate.points} pts, GD ${formatSignedNumber(candidate.goalDifference)}, GF ${candidate.goalsFor}.`
    ],
    metadata: {
      snapshotId,
      kind: "third-place-jump",
      teamId: candidate.thirdPlaceTeamId,
      teamName: candidate.thirdPlaceTeamName,
      groupId: candidate.group,
      fixtureId: candidate.fixtureId,
      relatedTeamId: candidate.thirdPlaceTeamId,
      relatedTeamName: candidate.thirdPlaceTeamName,
      ...(candidate.margin ? { margin: candidate.margin } : {})
    },
    idParts: [candidate.thirdPlaceTeamId, candidate.fixtureId, String(index)]
  });
}

function boundedFixtureOutcomes(data: TournamentData, fixture: Fixture): BoundedFixtureOutcome[] {
  const [home, away] = fixtureTeamIds(fixture);
  if (!home || !away) return [];

  const outcomes: BoundedFixtureOutcome[] = [{
    score: { home: 1, away: 1 },
    condition: `${teamName(data, home)} draw with ${teamName(data, away)} 1-1`
  }];

  for (const winner of [home, away]) {
    for (let margin = 1; margin <= 8; margin += 1) {
      outcomes.push({
        score: winner === home ? { home: margin, away: 0 } : { home: 0, away: margin },
        condition: `${teamName(data, winner)} beat ${teamName(data, winner === home ? away : home)} by ${margin}+`,
        winnerTeamId: winner,
        margin
      });
    }
  }

  return outcomes;
}

function documentFromParts(input: {
  snapshotId: string;
  kind: ScenarioDocumentKind;
  title: string;
  parts: string[];
  metadata: ScenarioDocumentMetadata;
  idParts?: string[];
}): ScenarioDocument {
  const text = compactText(input.parts.filter(Boolean).join("\n"));
  return {
    id: scenarioDocumentId(input.snapshotId, input.kind, input.idParts ?? [input.title]),
    title: input.title,
    text,
    metadata: input.metadata
  };
}

function scenarioDocumentId(snapshotId: string, kind: ScenarioDocumentKind, parts: string[]) {
  const kindPrefix = kind.split("-").map((part) => part[0]).join("");
  const stableHash = hashString(`${kind}:${parts.join(":")}`);
  return `${snapshotId}:${kindPrefix}:${stableHash}`;
}

function dedupeDocuments(documents: ScenarioDocument[]) {
  return Array.from(new Map(documents.map((document) => [document.id, document])).values());
}

function compactText(value: string) {
  return value
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxDocumentTextLength);
}

function fixtureTeamIds(fixture: Fixture) {
  return [fixture.home, fixture.away].filter((value): value is TeamId => typeof value === "string");
}

function teamName(data: TournamentData, teamId: TeamId) {
  return data.teams.find((team) => team.id === teamId)?.name ?? teamId;
}

function statusText(status: ScenarioQualificationStatus) {
  if (status === "direct") return "qualify directly";
  if (status === "third-place") return "are projected through third place";
  return "are eliminated";
}

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function ordinal(value: number) {
  const suffix = value % 10 === 1 && value % 100 !== 11
    ? "st"
    : value % 10 === 2 && value % 100 !== 12
      ? "nd"
      : value % 10 === 3 && value % 100 !== 13
        ? "rd"
        : "th";
  return `${value}${suffix}`;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
