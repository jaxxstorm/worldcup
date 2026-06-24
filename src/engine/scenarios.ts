import type { Fixture, FixtureId, GroupId, PredictionMap, ProjectedMatch, Score, StandingRow, TeamId, TournamentData } from "../types";
import { projectTournament } from "./knockout";
import { getAppliedScore } from "./predictions";
import { calculateGroupStandings, thirdPlaceRankings } from "./standings";

export type ScenarioQualificationStatus = "direct" | "third-place" | "eliminated";
export type ScenarioOutcomeKind = "big-win" | "win" | "draw" | "loss" | "heavy-loss";

export interface ScenarioTeamPosition {
  group: GroupId;
  rank: number;
  played: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
  status: ScenarioQualificationStatus;
  thirdPlaceRank?: number;
}

export interface ScenarioRoundOf32Path {
  fixtureId: FixtureId;
  slot: string;
  opponentTeamId?: TeamId;
  opponentLabel: string;
  source: string;
}

export interface ScenarioOutcome {
  kind: ScenarioOutcomeKind;
  fixtureId: FixtureId;
  condition: string;
  status: ScenarioQualificationStatus;
  groupFinish: number;
  points: number;
  slot?: string;
  roundOf32FixtureId?: FixtureId;
  opponentTeamId?: TeamId;
  opponentLabel?: string;
  summary: string;
}

export interface ScenarioDependency {
  fixtureId?: FixtureId;
  condition: string;
  effect: string;
  teamIds: TeamId[];
  kind: "group" | "third-place" | "opponent" | "tie-breaker";
}

export interface ScenarioOpponentPossibility {
  fixtureId: FixtureId;
  opponentTeamId?: TeamId;
  opponentLabel: string;
  condition: string;
  slot?: string;
}

export interface ScenarioMarginNote {
  condition: string;
  effect: string;
  fixtureIds: FixtureId[];
  status: ScenarioQualificationStatus;
}

export interface TeamScenarioAnalysis {
  teamId: TeamId;
  group: GroupId;
  current: ScenarioTeamPosition;
  currentPath?: ScenarioRoundOf32Path;
  outcomes: ScenarioOutcome[];
  dependencies: ScenarioDependency[];
  marginNotes: ScenarioMarginNote[];
  pressureNotes: ScenarioPressureNote[];
  possibleOpponents: ScenarioOpponentPossibility[];
  fixedResults: string[];
  tieBreakerNote?: string;
}

export interface ScenarioQuestionContext {
  team: {
    id: TeamId;
    name: string;
    group: GroupId;
  };
  activePredictionCount: number;
  qualificationRules: string[];
  missOutSummary: string[];
  userFacingSummary: string[];
  answerBrief: string[];
  pressureSummary: string[];
  chasingTeams: string[];
  current: ScenarioTeamPosition;
  currentPath?: ScenarioRoundOf32Path;
  selectedGroupStandings: ScenarioContextStandingRow[];
  thirdPlaceTable: ScenarioContextThirdPlaceRow[];
  remainingGroupFixtures: ScenarioContextFixture[];
  groupOutcomeCombinations: ScenarioGroupOutcomeCombination[];
  outcomes: ScenarioOutcome[];
  dependencies: ScenarioDependency[];
  marginNotes: ScenarioMarginNote[];
  pressureNotes: ScenarioPressureNote[];
  possibleOpponents: ScenarioOpponentPossibility[];
  fixedResults: string[];
  tieBreakerNote?: string;
}

export interface ScenarioContextStandingRow {
  group: GroupId;
  rank: number;
  teamId: TeamId;
  teamName: string;
  played: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface ScenarioContextThirdPlaceRow extends ScenarioContextStandingRow {
  thirdPlaceRank: number;
  qualifies: boolean;
}

export interface ScenarioContextFixture {
  fixtureId: FixtureId;
  group: GroupId;
  homeTeamId?: TeamId;
  homeName: string;
  awayTeamId?: TeamId;
  awayName: string;
}

export interface ScenarioPressureNote {
  lossMargin: number;
  thirdPlaceRank: number;
  sparePlaces: number;
  singleResultExamples: ScenarioPressureExample[];
  condition: string;
  effect: string;
  severity: "info" | "warning" | "danger";
}

export interface ScenarioPressureExample {
  fixtureId: FixtureId;
  winnerTeamId: TeamId;
  winnerName: string;
  margin: number;
  thirdPlaceTeamId: TeamId;
  thirdPlaceTeamName: string;
  summary: string;
}

export interface ScenarioGroupOutcomeCombination {
  selectedCondition: string;
  dependencyFixtureId: FixtureId;
  dependencyCondition: string;
  effect: string;
  status: ScenarioQualificationStatus;
  groupFinish: number;
  points: number;
  goalDifference: number;
  goalsFor: number;
  roundOf32FixtureId?: FixtureId;
  opponentLabel?: string;
}

interface ScenarioState {
  position: ScenarioTeamPosition;
  path?: ScenarioRoundOf32Path;
}

interface OutcomeClass {
  kind: ScenarioOutcomeKind;
  teamGoals: number;
  opponentGoals: number;
}

const outcomeClasses: OutcomeClass[] = [
  { kind: "big-win", teamGoals: 3, opponentGoals: 0 },
  { kind: "win", teamGoals: 1, opponentGoals: 0 },
  { kind: "draw", teamGoals: 1, opponentGoals: 1 },
  { kind: "loss", teamGoals: 0, opponentGoals: 1 },
  { kind: "heavy-loss", teamGoals: 0, opponentGoals: 3 }
];

export function analyzeTeamScenarios(data: TournamentData, predictions: PredictionMap, teamId: TeamId): TeamScenarioAnalysis {
  const team = data.teams.find((candidate) => candidate.id === teamId);
  if (!team?.group) throw new Error(`Team ${teamId} is not a group-stage team`);

  const current = scenarioState(data, predictions, teamId);
  const selectedFixtures = unresolvedGroupFixturesForTeam(data, predictions, teamId);
  const outcomes = selectedFixtures.flatMap((fixture) => outcomeClasses.map((outcome) => {
    const branchPredictions = {
      ...predictions,
      [fixture.id]: scoreForOutcome(fixture, teamId, outcome)
    };
    return scenarioOutcome(data, branchPredictions, teamId, fixture, outcome);
  }));
  const dependencies = [
    ...groupDependencies(data, predictions, teamId, current),
    ...thirdPlaceDependencies(data, current, teamId),
    ...tieBreakerDependencies(data, predictions, teamId)
  ];
  const marginNotes = marginSwingNotes(data, predictions, teamId);
  const pressureNotes = thirdPlacePressureNotes(data, predictions, teamId);
  const possibleOpponents = opponentPossibilities(data, predictions, teamId, current.path);
  const fixedResults = completedGroupFixturesForTeam(data, teamId).map((fixture) => fixedResultSummary(data, fixture, teamId));
  const tieBreakerNote = tieBreakerNoteFor(data, predictions, teamId);

  return {
    teamId,
    group: team.group,
    current: current.position,
    ...(current.path ? { currentPath: current.path } : {}),
    outcomes,
    dependencies,
    marginNotes,
    pressureNotes,
    possibleOpponents,
    fixedResults,
    ...(tieBreakerNote ? { tieBreakerNote } : {})
  };
}

export function buildScenarioQuestionContext(data: TournamentData, predictions: PredictionMap, teamId: TeamId): ScenarioQuestionContext {
  const analysis = analyzeTeamScenarios(data, predictions, teamId);
  const teamNameValue = teamName(data, teamId);
  const standings = calculateGroupStandings(data, predictions);
  const thirdPlaceTable = thirdPlaceRankings(standings, data).map((row) => contextThirdPlaceRow(data, row));
  const selectedGroupStandings = standings[analysis.group].map((row) => contextStandingRow(data, analysis.group, row));

  return {
    team: {
      id: teamId,
      name: teamNameValue,
      group: analysis.group
    },
    activePredictionCount: Object.keys(predictions).length,
    qualificationRules: [
      "The top two teams in each group qualify directly.",
      "The eight best third-place teams qualify through the third-place table.",
      "Third-place ranking is points, goal difference, goals for, then the tournament tie-breakers."
    ],
    missOutSummary: scenarioMissOutSummary(teamNameValue, analysis),
    userFacingSummary: scenarioUserFacingSummary(teamNameValue, analysis),
    answerBrief: scenarioAnswerBrief(teamNameValue, analysis, thirdPlaceTable),
    pressureSummary: thirdPlacePressureSummary(teamNameValue, analysis.pressureNotes),
    chasingTeams: thirdPlaceChasingTeams(teamNameValue, analysis.pressureNotes),
    current: analysis.current,
    ...(analysis.currentPath ? { currentPath: analysis.currentPath } : {}),
    selectedGroupStandings,
    thirdPlaceTable,
    remainingGroupFixtures: remainingGroupFixtures(data, predictions),
    groupOutcomeCombinations: groupOutcomeCombinations(data, predictions, teamId),
    outcomes: analysis.outcomes,
    dependencies: analysis.dependencies.slice(0, 12),
    marginNotes: analysis.marginNotes,
    pressureNotes: analysis.pressureNotes,
    possibleOpponents: analysis.possibleOpponents.slice(0, 8),
    fixedResults: analysis.fixedResults,
    ...(analysis.tieBreakerNote ? { tieBreakerNote: analysis.tieBreakerNote } : {})
  };
}

function contextStandingRow(data: TournamentData, group: GroupId, row: StandingRow): ScenarioContextStandingRow {
  return {
    group,
    rank: row.rank,
    teamId: row.teamId,
    teamName: teamName(data, row.teamId),
    played: row.played,
    points: row.points,
    goalDifference: row.goalDifference,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst
  };
}

function contextThirdPlaceRow(data: TournamentData, row: ReturnType<typeof thirdPlaceRankings>[number]): ScenarioContextThirdPlaceRow {
  return {
    ...contextStandingRow(data, row.group, row),
    thirdPlaceRank: row.thirdPlaceRank,
    qualifies: row.qualifies
  };
}

function remainingGroupFixtures(data: TournamentData, predictions: PredictionMap): ScenarioContextFixture[] {
  return data.fixtures
    .filter((fixture) => fixture.stage === "group" && fixture.group && !getAppliedScore(fixture, predictions))
    .map((fixture) => ({
      fixtureId: fixture.id,
      group: fixture.group!,
      ...(typeof fixture.home === "string" ? { homeTeamId: fixture.home } : {}),
      homeName: teamRefName(data, fixture.home),
      ...(typeof fixture.away === "string" ? { awayTeamId: fixture.away } : {}),
      awayName: teamRefName(data, fixture.away)
    }));
}

function groupOutcomeCombinations(data: TournamentData, predictions: PredictionMap, teamId: TeamId): ScenarioGroupOutcomeCombination[] {
  const selectedFixtures = unresolvedGroupFixturesForTeam(data, predictions, teamId);
  const group = groupForTeam(data, teamId);
  const dependentFixtures = data.fixtures.filter((fixture) => fixture.stage === "group" && fixture.group === group && !getAppliedScore(fixture, predictions) && fixture.home !== teamId && fixture.away !== teamId);
  const combinations: ScenarioGroupOutcomeCombination[] = [];
  const selectedBranches = selectedFixtures.length > 0
    ? selectedFixtures.flatMap((selectedFixture) => outcomeClasses.map((selectedOutcome) => {
      const branchPredictions = {
        ...predictions,
        [selectedFixture.id]: scoreForOutcome(selectedFixture, teamId, selectedOutcome)
      };
      return {
        condition: selectedTeamOutcomeCondition(data, selectedFixture, teamId, selectedOutcome.kind),
        predictions: branchPredictions,
        state: scenarioState(data, branchPredictions, teamId)
      };
    }))
    : [{
      condition: "Current real results and active predictions hold",
      predictions,
      state: scenarioState(data, predictions, teamId)
    }];

  for (const selectedBranch of selectedBranches) {
    for (const dependentFixture of dependentFixtures) {
      for (const dependentOutcome of outcomeClasses) {
        const combinedState = scenarioState(data, {
          ...selectedBranch.predictions,
          [dependentFixture.id]: scoreForFixtureOutcome(dependentFixture, dependentOutcome)
        }, teamId);
        const effect = dependencyEffect(selectedBranch.state, combinedState) ?? "no qualification or round-of-32 path change";

        combinations.push({
          selectedCondition: selectedBranch.condition,
          dependencyFixtureId: dependentFixture.id,
          dependencyCondition: fixtureOutcomeCondition(data, dependentFixture, dependentOutcome),
          effect,
          status: combinedState.position.status,
          groupFinish: combinedState.position.rank,
          points: combinedState.position.points,
          goalDifference: combinedState.position.goalDifference,
          goalsFor: combinedState.position.goalsFor,
          ...(combinedState.path?.fixtureId ? { roundOf32FixtureId: combinedState.path.fixtureId } : {}),
          ...(combinedState.path?.opponentLabel ? { opponentLabel: combinedState.path.opponentLabel } : {})
        });
      }
    }
  }

  return combinations;
}

function scenarioMissOutSummary(team: string, analysis: TeamScenarioAnalysis) {
  const summary: string[] = [];
  const eliminatedOutcomes = analysis.outcomes.filter((outcome) => outcome.status === "eliminated");
  const chasingTeams = thirdPlaceChasingTeams(team, analysis.pressureNotes);
  const firstPressure = analysis.pressureNotes[0];
  const tightestPressure = analysis.pressureNotes.find((note) => note.sparePlaces <= 3) ?? firstPressure;

  if (eliminatedOutcomes.length > 0) {
    summary.push(`${team} miss out in these selected-match branches: ${eliminatedOutcomes.map((outcome) => outcome.condition).join("; ")}.`);
  } else {
    summary.push(`No listed selected-match outcome alone eliminates ${team}.`);
  }

  if (firstPressure) {
    summary.push(`${team}'s miss-out route is third-place pressure: after ${firstPressure.condition}, they are ${ordinal(firstPressure.thirdPlaceRank)} in the third-place table with ${firstPressure.sparePlaces} buffer place${firstPressure.sparePlaces === 1 ? "" : "s"}.`);
  }
  if (tightestPressure && tightestPressure !== firstPressure) {
    summary.push(`The pressure tightens after ${tightestPressure.condition}: only ${tightestPressure.sparePlaces} more team${tightestPressure.sparePlaces === 1 ? "" : "s"} can pass before ${team} fall out of the top 8.`);
  }
  if (chasingTeams.length > 0) {
    summary.push(`Named third-place teams that can pass ${team}:`);
    summary.push(...chasingTeams);
  }

  return summary;
}

function scenarioUserFacingSummary(team: string, analysis: TeamScenarioAnalysis) {
  const summary: string[] = [];
  const winOutcomes = analysis.outcomes.filter((outcome) => outcome.kind === "win" || outcome.kind === "big-win");
  const drawOutcomes = analysis.outcomes.filter((outcome) => outcome.kind === "draw");
  const lossOutcomes = analysis.outcomes.filter((outcome) => outcome.kind === "loss" || outcome.kind === "heavy-loss");
  const directWins = winOutcomes.filter((outcome) => outcome.status === "direct");
  const projectedDraws = drawOutcomes.filter((outcome) => outcome.status === "third-place");
  const projectedLosses = lossOutcomes.filter((outcome) => outcome.status === "third-place");
  const eliminatedOutcomes = analysis.outcomes.filter((outcome) => outcome.status === "eliminated");

  if (directWins.length > 0) {
    summary.push(`Any listed win qualifies ${team} directly${directWins[0].roundOf32FixtureId ? ` (${directWins[0].roundOf32FixtureId}${directWins[0].opponentLabel ? ` vs ${directWins[0].opponentLabel}` : ""})` : ""}.`);
  }
  if (projectedDraws.length > 0) {
    summary.push(`A draw currently projects ${team} through the third-place table${projectedDraws[0].roundOf32FixtureId ? ` (${projectedDraws[0].roundOf32FixtureId}${projectedDraws[0].opponentLabel ? ` vs ${projectedDraws[0].opponentLabel}` : ""})` : ""}, but it depends on other third-place results.`);
  }
  if (projectedLosses.length > 0) {
    const lossConditions = projectedLosses.map((outcome) => outcome.condition.replace(`${team} `, "")).join(" or ");
    summary.push(`Even ${lossConditions} currently keeps ${team} in a projected third-place slot, but only while enough chasing third-place teams stay below them.`);
  }
  if (eliminatedOutcomes.length > 0) {
    summary.push(`${team} miss out if: ${eliminatedOutcomes.map((outcome) => outcome.condition).join("; ")}.`);
  } else if (analysis.pressureNotes.length > 0) {
    const tightest = analysis.pressureNotes.find((note) => note.sparePlaces <= 3) ?? analysis.pressureNotes[0];
    summary.push(`${team} miss out if enough chasing third-place teams pass them; after ${tightest.condition}, ${tightest.sparePlaces} more team${tightest.sparePlaces === 1 ? "" : "s"} can pass before they fall out of the top 8.`);
  }

  return summary;
}

function scenarioAnswerBrief(team: string, analysis: TeamScenarioAnalysis, thirdPlaceTable: ScenarioContextThirdPlaceRow[]) {
  const brief = [
    `${team} are currently ${ordinal(analysis.current.rank)} in Group ${analysis.group} on ${analysis.current.points} pts, GD ${formatSignedNumber(analysis.current.goalDifference)}, GF ${analysis.current.goalsFor}; current status: ${scenarioStatusText(analysis.current.status)}.`
  ];
  const thirdPlaceRow = thirdPlaceTable.find((row) => row.teamId === analysis.teamId);
  const cutoff = thirdPlaceTable.find((row) => row.thirdPlaceRank === 8);
  const firstOut = thirdPlaceTable.find((row) => row.thirdPlaceRank === 9);
  if (thirdPlaceRow) {
    brief.push(`${team} are ${ordinal(thirdPlaceRow.thirdPlaceRank)} in the third-place table; top 8 qualify${cutoff ? `, with ${cutoff.teamName} currently 8th on ${cutoff.points} pts, GD ${formatSignedNumber(cutoff.goalDifference)}, GF ${cutoff.goalsFor}` : ""}${firstOut ? ` and ${firstOut.teamName} currently 9th on ${firstOut.points} pts, GD ${formatSignedNumber(firstOut.goalDifference)}, GF ${firstOut.goalsFor}` : ""}.`);
  }

  const winOutcomes = analysis.outcomes.filter((outcome) => outcome.kind === "win" || outcome.kind === "big-win");
  const drawOutcomes = analysis.outcomes.filter((outcome) => outcome.kind === "draw");
  const lossOutcomes = analysis.outcomes.filter((outcome) => outcome.kind === "loss" || outcome.kind === "heavy-loss");
  brief.push(outcomeFamilyBrief(team, "win", winOutcomes));
  brief.push(outcomeFamilyBrief(team, "draw", drawOutcomes));
  brief.push(outcomeFamilyBrief(team, "lose", lossOutcomes));

  const eliminatedOutcomes = analysis.outcomes.filter((outcome) => outcome.status === "eliminated");
  if (eliminatedOutcomes.length > 0) {
    brief.push(`${team} miss out in these listed outcomes: ${eliminatedOutcomes.map((outcome) => outcome.condition).join("; ")}.`);
  } else {
    brief.push(`No listed selected-match outcome eliminates ${team}; in the bounded win/draw/loss checks they still qualify or qualify directly.`);
  }

  if (analysis.marginNotes.length > 0) {
    brief.push(`Margin swing notes: ${analysis.marginNotes.map((note) => `${note.condition} -> ${note.effect}`).join(" ")}`);
  } else {
    brief.push(`No single bounded margin swing note is identified for ${team}; do not claim a specific elimination margin unless the user's active predictions create one.`);
  }
  if (analysis.pressureNotes.length > 0) {
    brief.push(`Third-place pressure: ${analysis.pressureNotes.map((note) => `${note.condition} -> ${note.effect}`).join(" ")}`);
  }

  return brief.filter(Boolean);
}

function thirdPlacePressureSummary(team: string, pressureNotes: ScenarioPressureNote[]) {
  if (pressureNotes.length === 0) return [];

  const summary: string[] = [];
  const oneGoal = pressureNotes.find((note) => note.lossMargin === 1);
  if (oneGoal) {
    summary.push(`Lose by 1: ${team} are ${ordinal(oneGoal.thirdPlaceRank)} in the third-place table, with a ${oneGoal.sparePlaces}-team buffer.`);
  }

  const firstTight = pressureNotes.find((note) => note.sparePlaces <= 3) ?? pressureNotes.find((note) => note.lossMargin > 1);
  if (firstTight) {
    summary.push(`Lose by ${firstTight.lossMargin}+: ${team} are around ${ordinal(firstTight.thirdPlaceRank)}, so only ${firstTight.sparePlaces} more team${firstTight.sparePlaces === 1 ? "" : "s"} can pass them before they fall out of the top 8.`);
    const examples = preferredPressureExamples(firstTight.singleResultExamples);
    if (examples.length > 0) {
      summary.push(`Single chasing results such as ${examples.join(" or ")} eat into that buffer, but one alone is not fatal unless the table already has ${team} 9th or worse.`);
    }
  }

  return summary;
}

function thirdPlaceChasingTeams(team: string, pressureNotes: ScenarioPressureNote[]) {
  const examples = pressureNotes.flatMap((note) => note.singleResultExamples.map((example) => ({ ...example, lossMargin: note.lossMargin, sparePlaces: note.sparePlaces })));
  if (examples.length === 0) return [];

  const byPassingTeam = new Map<TeamId, typeof examples[number]>();
  for (const example of examples) {
    const existing = byPassingTeam.get(example.thirdPlaceTeamId);
    if (!existing || example.margin < existing.margin || example.lossMargin < existing.lossMargin) {
      byPassingTeam.set(example.thirdPlaceTeamId, example);
    }
  }

  return Array.from(byPassingTeam.values())
    .sort((left, right) => left.margin - right.margin || left.thirdPlaceTeamName.localeCompare(right.thirdPlaceTeamName))
    .map((example) => `${example.thirdPlaceTeamName} can pass ${team} if ${example.winnerName} win ${example.fixtureId} by ${example.margin}+ after ${team} lose by ${example.lossMargin}; that uses one of the ${example.sparePlaces} remaining buffer places.`);
}

function preferredPressureExamples(examples: ScenarioPressureExample[]) {
  const preferred = examples.filter((example) => /\b(Czechia|DR Congo|Congo)\b/.test(example.winnerName)).slice(0, 2);
  return (preferred.length > 0 ? preferred : examples.slice(0, 2)).map((example) => `${example.winnerName} by ${example.margin}+`);
}

function thirdPlacePressureNotes(data: TournamentData, predictions: PredictionMap, teamId: TeamId): ScenarioPressureNote[] {
  const selectedFixture = unresolvedGroupFixturesForTeam(data, predictions, teamId)[0];
  if (!selectedFixture) return [];

  const notes: ScenarioPressureNote[] = [];
  for (const lossMargin of [1, 2, 3, 4, 5]) {
    const lossPredictions = {
      ...predictions,
      [selectedFixture.id]: losingScoreForTeam(selectedFixture, teamId, lossMargin)
    };
    const tableAfterLoss = thirdPlaceRankings(calculateGroupStandings(data, lossPredictions), data);
    const rowAfterLoss = tableAfterLoss.find((row) => row.teamId === teamId);
    if (!rowAfterLoss) continue;

    const sparePlaces = Math.max(0, 8 - rowAfterLoss.thirdPlaceRank);
    const alreadyAbove = new Set(tableAfterLoss.filter((row) => row.thirdPlaceRank < rowAfterLoss.thirdPlaceRank).map((row) => row.teamId));
    const overtakes = firstOvertakingResults(data, predictions, teamId, lossPredictions, rowAfterLoss.thirdPlaceRank, alreadyAbove, selectedFixture.id);
    const severity: ScenarioPressureNote["severity"] = rowAfterLoss.thirdPlaceRank > 8
      ? "danger"
      : sparePlaces <= 2
        ? "warning"
        : "info";

    notes.push({
      lossMargin,
      thirdPlaceRank: rowAfterLoss.thirdPlaceRank,
      sparePlaces,
      singleResultExamples: overtakes,
      condition: `${teamName(data, teamId)} lose to ${opponentNameForFixture(data, selectedFixture, teamId)} by ${lossMargin}`,
      effect: rowAfterLoss.thirdPlaceRank > 8
        ? `They drop to ${ordinal(rowAfterLoss.thirdPlaceRank)} in the third-place table and miss out.`
        : `They are ${ordinal(rowAfterLoss.thirdPlaceRank)} in the third-place table; ${sparePlaces} more team${sparePlaces === 1 ? "" : "s"} can pass them before they fall out of the top 8.${overtakes.length > 0 ? ` Single-result pressure includes ${overtakes.slice(0, 3).map((example) => example.summary).join("; ")}.` : ""}`,
      severity
    });
  }

  return notes;
}

function firstOvertakingResults(
  data: TournamentData,
  basePredictions: PredictionMap,
  teamId: TeamId,
  lossPredictions: PredictionMap,
  baseThirdPlaceRank: number,
  alreadyAbove: Set<TeamId>,
  selectedFixtureId: FixtureId
) {
  const results: ScenarioPressureExample[] = [];
  const seen = new Set<string>();
  const remainingFixtures = data.fixtures.filter((fixture) => fixture.stage === "group" && fixture.id !== selectedFixtureId && !getAppliedScore(fixture, basePredictions));

  for (const fixture of remainingFixtures) {
    for (const winner of fixtureTeamIds(fixture)) {
      for (let margin = 1; margin <= 8; margin += 1) {
        const rows = thirdPlaceRankings(calculateGroupStandings(data, {
          ...lossPredictions,
          [fixture.id]: winningScoreForTeam(fixture, winner, margin)
        }), data);
        const selectedRow = rows.find((row) => row.teamId === teamId);
        if (!selectedRow || selectedRow.thirdPlaceRank <= baseThirdPlaceRank) continue;

        const newThirdPlaceTeam = rows.find((row) => row.thirdPlaceRank < selectedRow.thirdPlaceRank && !alreadyAbove.has(row.teamId) && !seen.has(row.teamId) && row.teamId !== teamId);
        if (!newThirdPlaceTeam) break;
        seen.add(newThirdPlaceTeam.teamId);
        const winnerName = teamName(data, winner);
        const thirdPlaceTeamName = teamName(data, newThirdPlaceTeam.teamId);
        results.push({
          fixtureId: fixture.id,
          winnerTeamId: winner,
          winnerName,
          margin,
          thirdPlaceTeamId: newThirdPlaceTeam.teamId,
          thirdPlaceTeamName,
          summary: `${winnerName} win ${fixture.id} by ${margin}+ (${thirdPlaceTeamName} move above)`
        });
        break;
      }
    }
  }

  return results;
}

function outcomeFamilyBrief(team: string, label: "win" | "draw" | "lose", outcomes: ScenarioOutcome[]) {
  if (outcomes.length === 0) return `${team} have no listed ${label} outcome because no matching unresolved fixture branch is available.`;
  const statuses = Array.from(new Set(outcomes.map((outcome) => scenarioStatusText(outcome.status))));
  const examples = outcomes.map((outcome) => `${outcome.condition} -> ${scenarioStatusText(outcome.status)}, ${ordinal(outcome.groupFinish)} in group, ${outcome.points} pts${outcome.roundOf32FixtureId ? `, ${outcome.roundOf32FixtureId}${outcome.opponentLabel ? ` vs ${outcome.opponentLabel}` : ""}` : ""}`);
  return `If ${team} ${label}: ${statuses.join(" or ")}. ${examples.join("; ")}.`;
}

function scenarioStatusText(status: ScenarioQualificationStatus) {
  if (status === "direct") return "qualify directly";
  if (status === "third-place") return "are currently projected through third place";
  return "are eliminated";
}

function marginSwingNotes(data: TournamentData, predictions: PredictionMap, teamId: TeamId): ScenarioMarginNote[] {
  const selectedFixtures = unresolvedGroupFixturesForTeam(data, predictions, teamId);
  const group = groupForTeam(data, teamId);
  const dependentFixtures = data.fixtures.filter((fixture) => fixture.stage === "group" && fixture.group === group && !getAppliedScore(fixture, predictions));
  const notes: ScenarioMarginNote[] = [];

  for (const selectedFixture of selectedFixtures) {
    for (const dependentFixture of dependentFixtures) {
      if (dependentFixture.id === selectedFixture.id) continue;

      for (const dependentWinner of fixtureTeamIds(dependentFixture)) {
        const note = firstWorseningMarginNote(data, predictions, teamId, selectedFixture, dependentFixture, dependentWinner);
        if (note) notes.push(note);
      }
    }
  }

  return notes
    .sort((left, right) => sameGroupMarginSort(data, teamId, left, right))
    .slice(0, 5);
}

function firstWorseningMarginNote(
  data: TournamentData,
  predictions: PredictionMap,
  teamId: TeamId,
  selectedFixture: Fixture,
  dependentFixture: Fixture,
  dependentWinner: TeamId
): ScenarioMarginNote | undefined {
  for (let selectedMargin = 1; selectedMargin <= 8; selectedMargin += 1) {
    const selectedScore = losingScoreForTeam(selectedFixture, teamId, selectedMargin);
    const selectedState = scenarioState(data, { ...predictions, [selectedFixture.id]: selectedScore }, teamId);
    if (selectedState.position.status === "eliminated") continue;

    for (let dependentMargin = 1; dependentMargin <= 8; dependentMargin += 1) {
      const branch = scenarioState(data, {
        ...predictions,
        [selectedFixture.id]: selectedScore,
        [dependentFixture.id]: winningScoreForTeam(dependentFixture, dependentWinner, dependentMargin)
      }, teamId);

      if (statusValue(branch.position.status) >= statusValue(selectedState.position.status)) continue;

      return {
        condition: `${teamName(data, teamId)} lose to ${opponentNameForFixture(data, selectedFixture, teamId)} by ${selectedMargin}+ and ${teamName(data, dependentWinner)} beat ${opponentNameForFixture(data, dependentFixture, dependentWinner)} by ${dependentMargin}+`,
        effect: `They can ${statusVerb(branch.position.status)} instead of ${statusVerb(selectedState.position.status)}.`,
        fixtureIds: [selectedFixture.id, dependentFixture.id],
        status: branch.position.status
      };
    }
  }

  return undefined;
}

function scenarioState(data: TournamentData, predictions: PredictionMap, teamId: TeamId): ScenarioState {
  const standings = calculateGroupStandings(data, predictions);
  const row = Object.values(standings).flat().find((candidate) => candidate.teamId === teamId);
  if (!row) throw new Error(`No standings row found for ${teamId}`);

  const thirdPlaceRow = thirdPlaceRankings(standings, data).find((candidate) => candidate.teamId === teamId);
  const projection = projectTournament(data, predictions);
  const path = roundOf32PathForTeam(data, projection, teamId);

  return {
    position: {
      group: groupForTeam(data, teamId),
      rank: row.rank,
      played: row.played,
      points: row.points,
      goalDifference: row.goalDifference,
      goalsFor: row.goalsFor,
      status: qualificationStatus(row, thirdPlaceRow?.qualifies),
      ...(thirdPlaceRow ? { thirdPlaceRank: thirdPlaceRow.thirdPlaceRank } : {})
    },
    ...(path ? { path } : {})
  };
}

function scenarioOutcome(data: TournamentData, predictions: PredictionMap, teamId: TeamId, fixture: Fixture, outcome: OutcomeClass): ScenarioOutcome {
  const state = scenarioState(data, predictions, teamId);
  const condition = selectedTeamOutcomeCondition(data, fixture, teamId, outcome.kind);
  const path = state.path;
  const destination = path
    ? ` and land in ${path.fixtureId} as ${path.slot}${path.opponentLabel ? ` against ${path.opponentLabel}` : ""}`
    : "";

  return {
    kind: outcome.kind,
    fixtureId: fixture.id,
    condition,
    status: state.position.status,
    groupFinish: state.position.rank,
    points: state.position.points,
    ...(path?.slot ? { slot: path.slot } : {}),
    ...(path?.fixtureId ? { roundOf32FixtureId: path.fixtureId } : {}),
    ...(path?.opponentTeamId ? { opponentTeamId: path.opponentTeamId } : {}),
    ...(path?.opponentLabel ? { opponentLabel: path.opponentLabel } : {}),
    summary: `${condition}: ${qualificationText(state.position)}${destination}.`
  };
}

function groupDependencies(data: TournamentData, predictions: PredictionMap, teamId: TeamId, current: ScenarioState): ScenarioDependency[] {
  const group = groupForTeam(data, teamId);
  return data.fixtures
    .filter((fixture) => fixture.stage === "group" && fixture.group === group && !getAppliedScore(fixture, predictions))
    .filter((fixture) => fixture.home !== teamId && fixture.away !== teamId)
    .flatMap((fixture) => outcomeClasses.flatMap((outcome) => {
      const branch = scenarioState(data, {
        ...predictions,
        [fixture.id]: scoreForFixtureOutcome(fixture, outcome)
      }, teamId);
      const effect = dependencyEffect(current, branch);
      if (!effect) return [];

      return [{
        fixtureId: fixture.id,
        condition: `${fixtureOutcomeCondition(data, fixture, outcome)}`,
        effect,
        teamIds: fixtureTeamIds(fixture),
        kind: "group" as const
      }];
    }));
}

function thirdPlaceDependencies(data: TournamentData, current: ScenarioState, teamId: TeamId): ScenarioDependency[] {
  if (current.position.rank !== 3) return [];

  return [{
    condition: `Group ${current.position.group}'s third-place total is compared with the other third-place teams`,
    effect: current.position.status === "third-place"
      ? `${teamName(data, teamId)} currently qualifies through the best third-place table`
      : `They currently need at least one higher-ranked third-place team to drop below them`,
    teamIds: [],
    kind: "third-place"
  }];
}

function tieBreakerDependencies(data: TournamentData, predictions: PredictionMap, teamId: TeamId): ScenarioDependency[] {
  const note = tieBreakerNoteFor(data, predictions, teamId);
  if (!note) return [];
  return [{ condition: "Teams are close enough that tie-breakers can decide the exact finish", effect: note, teamIds: [teamId], kind: "tie-breaker" }];
}

function opponentPossibilities(data: TournamentData, predictions: PredictionMap, teamId: TeamId, currentPath: ScenarioRoundOf32Path | undefined): ScenarioOpponentPossibility[] {
  const possibilities = new Map<string, ScenarioOpponentPossibility>();
  const fixtures = data.fixtures.filter((fixture) => fixture.stage === "group" && !getAppliedScore(fixture, predictions));

  if (currentPath) {
    possibilities.set(opponentKey(currentPath), {
      fixtureId: currentPath.fixtureId,
      opponentTeamId: currentPath.opponentTeamId,
      opponentLabel: currentPath.opponentLabel,
      condition: "Current real results and active predictions hold",
      slot: currentPath.slot
    });
  }

  for (const fixture of fixtures) {
    for (const outcome of outcomeClasses) {
      const branchPath = scenarioState(data, {
        ...predictions,
        [fixture.id]: scoreForFixtureOutcome(fixture, outcome)
      }, teamId).path;
      if (!branchPath) continue;

      const key = opponentKey(branchPath);
      if (possibilities.has(key)) continue;
      possibilities.set(key, {
        fixtureId: branchPath.fixtureId,
        opponentTeamId: branchPath.opponentTeamId,
        opponentLabel: branchPath.opponentLabel,
        condition: fixtureOutcomeCondition(data, fixture, outcome),
        slot: branchPath.slot
      });
    }
  }

  return Array.from(possibilities.values()).sort((left, right) => left.opponentLabel.localeCompare(right.opponentLabel) || left.condition.localeCompare(right.condition));
}

function roundOf32PathForTeam(data: TournamentData, projection: ProjectedMatch[], teamId: TeamId): ScenarioRoundOf32Path | undefined {
  for (const match of projection.filter((candidate) => candidate.stage === "round-of-32")) {
    if (match.home.teamId === teamId) {
      return {
        fixtureId: match.fixtureId,
        slot: match.home.slot,
        source: match.homeSource,
        opponentTeamId: match.away.teamId,
        opponentLabel: match.away.teamId ? teamName(data, match.away.teamId) : match.away.label
      };
    }
    if (match.away.teamId === teamId) {
      return {
        fixtureId: match.fixtureId,
        slot: match.away.slot,
        source: match.awaySource,
        opponentTeamId: match.home.teamId,
        opponentLabel: match.home.teamId ? teamName(data, match.home.teamId) : match.home.label
      };
    }
  }
  return undefined;
}

function unresolvedGroupFixturesForTeam(data: TournamentData, predictions: PredictionMap, teamId: TeamId) {
  return data.fixtures.filter((fixture) => fixture.stage === "group" && (fixture.home === teamId || fixture.away === teamId) && !getAppliedScore(fixture, predictions));
}

function completedGroupFixturesForTeam(data: TournamentData, teamId: TeamId) {
  return data.fixtures.filter((fixture) => fixture.stage === "group" && (fixture.home === teamId || fixture.away === teamId) && fixture.result);
}

function qualificationStatus(row: StandingRow, thirdPlaceQualifies = false): ScenarioQualificationStatus {
  if (row.rank <= 2) return "direct";
  if (row.rank === 3 && thirdPlaceQualifies) return "third-place";
  return "eliminated";
}

function qualificationText(position: ScenarioTeamPosition) {
  const totals = `on ${position.points} pts, GD ${formatSignedNumber(position.goalDifference)}, GF ${position.goalsFor}`;
  if (position.status === "direct") return `finish ${ordinal(position.rank)} in Group ${position.group} ${totals} and qualify directly`;
  if (position.status === "third-place") return `finish 3rd in Group ${position.group} ${totals} and qualify through the best third-place table`;
  return `finish ${ordinal(position.rank)} in Group ${position.group} ${totals} and sit outside the qualifying places`;
}

function dependencyEffect(current: ScenarioState, branch: ScenarioState): string | undefined {
  const changes: string[] = [];

  if (branch.position.status !== current.position.status) {
    changes.push(`status becomes ${scenarioStatusText(branch.position.status)}`);
  }
  if (branch.position.rank !== current.position.rank) {
    changes.push(`group place moves from ${ordinal(current.position.rank)} to ${ordinal(branch.position.rank)}`);
  }
  if (branch.position.points !== current.position.points || branch.position.goalDifference !== current.position.goalDifference) {
    changes.push(`table line becomes ${branch.position.points} pts, GD ${formatSignedNumber(branch.position.goalDifference)}, GF ${branch.position.goalsFor}`);
  }

  const pathChanged = current.path?.fixtureId !== branch.path?.fixtureId ||
    current.path?.slot !== branch.path?.slot ||
    current.path?.opponentTeamId !== branch.path?.opponentTeamId ||
    current.path?.opponentLabel !== branch.path?.opponentLabel;
  if (pathChanged) {
    changes.push(`round-of-32 path ${pathSummary(current.path)} -> ${pathSummary(branch.path)}`);
  }

  return changes.length > 0 ? changes.join("; ") : undefined;
}

function scoreForOutcome(fixture: Fixture, teamId: TeamId, outcome: OutcomeClass): Score {
  const teamIsHome = fixture.home === teamId;
  return teamIsHome
    ? { home: outcome.teamGoals, away: outcome.opponentGoals }
    : { home: outcome.opponentGoals, away: outcome.teamGoals };
}

function scoreForFixtureOutcome(_fixture: Fixture, outcome: OutcomeClass): Score {
  return { home: outcome.teamGoals, away: outcome.opponentGoals };
}

function losingScoreForTeam(fixture: Fixture, teamId: TeamId, margin: number): Score {
  return fixture.home === teamId ? { home: 0, away: margin } : { home: margin, away: 0 };
}

function winningScoreForTeam(fixture: Fixture, teamId: TeamId, margin: number): Score {
  return fixture.home === teamId ? { home: margin, away: 0 } : { home: 0, away: margin };
}

function fixtureOutcomeCondition(data: TournamentData, fixture: Fixture, outcome: OutcomeClass) {
  const home = typeof fixture.home === "string" ? teamName(data, fixture.home) : fixture.home.label;
  const away = typeof fixture.away === "string" ? teamName(data, fixture.away) : fixture.away.label;
  if (outcome.teamGoals === outcome.opponentGoals) return `${home} draw with ${away} ${outcome.teamGoals}-${outcome.opponentGoals}`;
  if (outcome.teamGoals > outcome.opponentGoals) return `${home} beat ${away} ${outcome.teamGoals}-${outcome.opponentGoals}`;
  return `${away} beat ${home} ${outcome.opponentGoals}-${outcome.teamGoals}`;
}

function selectedTeamOutcomeCondition(data: TournamentData, fixture: Fixture, teamId: TeamId, outcome: ScenarioOutcomeKind) {
  const team = teamName(data, teamId);
  const opponent = opponentNameForFixture(data, fixture, teamId);
  const branch = outcomeClasses.find((candidate) => candidate.kind === outcome)!;
  if (branch.teamGoals === branch.opponentGoals) return `${team} draw with ${opponent} ${branch.teamGoals}-${branch.opponentGoals}`;
  if (branch.teamGoals > branch.opponentGoals) return `${team} beat ${opponent} ${branch.teamGoals}-${branch.opponentGoals}`;
  return `${team} lose to ${opponent} ${branch.teamGoals}-${branch.opponentGoals}`;
}

function fixedResultSummary(data: TournamentData, fixture: Fixture, teamId: TeamId) {
  const score = fixture.result;
  if (!score) return "";
  const opponent = opponentNameForFixture(data, fixture, teamId);
  const teamGoals = fixture.home === teamId ? score.home : score.away;
  const opponentGoals = fixture.home === teamId ? score.away : score.home;
  return `Final: ${teamName(data, teamId)} ${teamGoals}-${opponentGoals} ${opponent}`;
}

function tieBreakerNoteFor(data: TournamentData, predictions: PredictionMap, teamId: TeamId) {
  const standings = calculateGroupStandings(data, predictions);
  const row = standings[groupForTeam(data, teamId)].find((candidate) => candidate.teamId === teamId);
  if (!row) return undefined;

  const neighbors = standings[groupForTeam(data, teamId)].filter((candidate) => candidate.teamId !== teamId && Math.abs(candidate.points - row.points) <= 1);
  if (neighbors.length === 0) return undefined;

  return "Goal difference, goals scored, head-to-head results, fair play, FIFA ranking, or draw order can still decide this team's exact finish.";
}

function sameScenarioState(left: ScenarioState, right: ScenarioState) {
  return left.position.status === right.position.status &&
    left.position.rank === right.position.rank &&
    left.position.points === right.position.points &&
    left.path?.fixtureId === right.path?.fixtureId &&
    left.path?.slot === right.path?.slot &&
    left.path?.opponentTeamId === right.path?.opponentTeamId &&
    left.path?.opponentLabel === right.path?.opponentLabel;
}

function pathSummary(path: ScenarioRoundOf32Path | undefined) {
  if (!path) return "unassigned";
  return `${path.fixtureId} ${path.slot}${path.opponentLabel ? ` vs ${path.opponentLabel}` : ""}`;
}

function statusValue(status: ScenarioQualificationStatus) {
  if (status === "direct") return 2;
  if (status === "third-place") return 1;
  return 0;
}

function statusVerb(status: ScenarioQualificationStatus) {
  if (status === "direct") return "qualify directly";
  if (status === "third-place") return "qualify through third place";
  return "be eliminated";
}

function sameGroupMarginSort(data: TournamentData, teamId: TeamId, left: ScenarioMarginNote, right: ScenarioMarginNote) {
  const selectedGroup = groupForTeam(data, teamId);
  const leftSameGroup = left.fixtureIds.some((fixtureId) => data.fixtures.find((fixture) => fixture.id === fixtureId)?.group === selectedGroup);
  const rightSameGroup = right.fixtureIds.some((fixtureId) => data.fixtures.find((fixture) => fixture.id === fixtureId)?.group === selectedGroup);
  return Number(rightSameGroup) - Number(leftSameGroup) || left.condition.localeCompare(right.condition);
}

function fixtureTeamIds(fixture: Fixture) {
  return [fixture.home, fixture.away].filter((value): value is TeamId => typeof value === "string");
}

function opponentNameForFixture(data: TournamentData, fixture: Fixture, teamId: TeamId) {
  const opponent = fixture.home === teamId ? fixture.away : fixture.home;
  return typeof opponent === "string" ? teamName(data, opponent) : opponent.label;
}

function groupForTeam(data: TournamentData, teamId: TeamId): GroupId {
  const group = data.teams.find((team) => team.id === teamId)?.group;
  if (!group) throw new Error(`Team ${teamId} is not assigned to a group`);
  return group;
}

function teamName(data: TournamentData, teamId: TeamId) {
  return data.teams.find((team) => team.id === teamId)?.name ?? teamId;
}

function teamRefName(data: TournamentData, team: Fixture["home"]) {
  return typeof team === "string" ? teamName(data, team) : team.label;
}

function opponentKey(path: ScenarioRoundOf32Path) {
  return `${path.fixtureId}:${path.opponentTeamId ?? path.opponentLabel}`;
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
