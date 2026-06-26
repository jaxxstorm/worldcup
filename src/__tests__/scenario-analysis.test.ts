import { describe, expect, it } from "vitest";
import { generateScenarioDocuments, thirdPlaceJumpCandidates } from "../engine/scenario-documents";
import { scenarioSnapshotId } from "../engine/scenario-snapshot";
import { analyzeTeamScenarios, buildScenarioQuestionContext } from "../engine/scenarios";
import { calculateGroupStandings, thirdPlaceRankings } from "../engine/standings";
import type { TournamentData } from "../types";
import { makeTournamentData, setFixtureResult, setFixtureScheduled } from "./fixtures/tournament";

function cloneTournamentData() {
  return makeTournamentData();
}

function setResult(data: TournamentData, fixtureId: string, home: number, away: number) {
  setFixtureResult(data, fixtureId, home, away);
}

function setScheduled(data: TournamentData, fixtureId: string) {
  setFixtureScheduled(data, fixtureId);
}

function stagedScotlandData() {
  const data = cloneTournamentData();
  stageThirdPlaceChasers(data);
  stageOpenChaserGroup(data);
  setResult(data, "m013", 1, 1);
  setResult(data, "m014", 0, 1);
  setResult(data, "m015", 3, 0);
  setResult(data, "m016", 0, 1);
  setScheduled(data, "m017");
  setScheduled(data, "m018");
  return data;
}

function stagedScotlandMarginData() {
  const data = cloneTournamentData();
  stageThirdPlaceChasers(data);
  stageOpenChaserGroup(data);
  setResult(data, "m013", 1, 0);
  setResult(data, "m014", 0, 1);
  setResult(data, "m015", 1, 0);
  setResult(data, "m016", 0, 0);
  setScheduled(data, "m017");
  setScheduled(data, "m018");
  return data;
}

function stagedEnglandData() {
  const data = cloneTournamentData();
  stageThirdPlaceChasers(data);
  stageOpenChaserGroup(data);
  setResult(data, "m067", 4, 2);
  setResult(data, "m068", 1, 0);
  setResult(data, "m069", 0, 0);
  setResult(data, "m070", 0, 1);
  setScheduled(data, "m071");
  setScheduled(data, "m072");
  return data;
}

function stagedAlgeriaData() {
  const data = cloneTournamentData();
  stageThirdPlaceChasers(data);
  stageOpenChaserGroup(data);
  setResult(data, "m055", 3, 0);
  setResult(data, "m056", 3, 1);
  setResult(data, "m057", 2, 0);
  setResult(data, "m058", 1, 2);
  setScheduled(data, "m059");
  setScheduled(data, "m060");
  return data;
}

function stageThirdPlaceChasers(data: TournamentData) {
  for (const group of ["A", "B", "D", "E", "F", "G", "I"] as const) {
    const fixtures = data.fixtures.filter((fixture) => fixture.group === group);
    setResult(data, fixtures[0].id, 1, 0);
    setResult(data, fixtures[1].id, 1, 0);
    setResult(data, fixtures[2].id, 1, 1);
    setResult(data, fixtures[3].id, 0, 1);
    setResult(data, fixtures[4].id, 0, 1);
    setResult(data, fixtures[5].id, 1, 0);
  }
}

function stageOpenChaserGroup(data: TournamentData) {
  setResult(data, "m043", 1, 1);
  setResult(data, "m044", 0, 1);
  setResult(data, "m045", 1, 0);
  setResult(data, "m046", 1, 1);
  setScheduled(data, "m047");
  setScheduled(data, "m048");
}

describe("scenario analysis", () => {
  it("explains selected-team win, draw, and loss paths from remaining group fixtures", () => {
    const scenario = analyzeTeamScenarios(stagedEnglandData(), {}, "england");
    const panamaOutcomes = scenario.outcomes.filter((outcome) => outcome.fixtureId === "m071");

    expect(panamaOutcomes.map((outcome) => outcome.kind)).toEqual(["big-win", "win", "draw", "loss", "heavy-loss"]);
    expect(panamaOutcomes.find((outcome) => outcome.kind === "win")?.summary).toContain("England beat Panama 1-0");
    expect(panamaOutcomes.find((outcome) => outcome.kind === "heavy-loss")?.summary).toContain("GD");
    expect(panamaOutcomes.every((outcome) => outcome.roundOf32FixtureId)).toBe(true);
    expect(panamaOutcomes.every((outcome) => outcome.summary.includes("Group L"))).toBe(true);
  });

  it("identifies direct qualification, third-place qualification, and elimination paths", () => {
    const scotland = analyzeTeamScenarios(stagedScotlandData(), {}, "scotland");
    const panama = analyzeTeamScenarios(stagedEnglandData(), {}, "panama");

    expect(scotland.outcomes.some((outcome) => outcome.status === "direct")).toBe(true);
    expect(scotland.outcomes.some((outcome) => outcome.status === "third-place")).toBe(true);
    expect(panama.current.status).toBe("eliminated");
    expect(panama.outcomes.every((outcome) => outcome.status === "eliminated")).toBe(true);
  });

  it("factors scoreline severity into goal-difference-sensitive branches", () => {
    const scotland = analyzeTeamScenarios(stagedScotlandData(), {}, "scotland");
    const heavyBrazilLoss = scotland.outcomes.find((outcome) => outcome.fixtureId === "m017" && outcome.kind === "heavy-loss");
    const narrowBrazilLoss = scotland.outcomes.find((outcome) => outcome.fixtureId === "m017" && outcome.kind === "loss");

    expect(heavyBrazilLoss?.condition).toBe("Scotland lose to Brazil 0-3");
    expect(narrowBrazilLoss?.condition).toBe("Scotland lose to Brazil 0-1");
    expect(heavyBrazilLoss?.summary).toContain("GD");
    expect(heavyBrazilLoss?.summary).not.toEqual(narrowBrazilLoss?.summary);
  });

  it("adds concise margin-swing notes when combined scorelines can change qualification", () => {
    const scotland = analyzeTeamScenarios(stagedScotlandMarginData(), {}, "scotland");

    expect(scotland.marginNotes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        condition: expect.stringMatching(/^Scotland lose to Brazil by \d\+ and .+ beat .+ by \d\+$/),
        effect: expect.stringContaining("They can")
      })
    ]));
  });

  it("names dependent fixtures and possible round-of-32 opponents", () => {
    const scenario = analyzeTeamScenarios(stagedEnglandData(), {}, "england");

    expect(scenario.dependencies).toContainEqual(expect.objectContaining({
      fixtureId: "m072",
      condition: expect.stringContaining("Croatia"),
      teamIds: ["croatia", "ghana"],
      kind: "group"
    }));
    expect(scenario.possibleOpponents.length).toBeGreaterThan(0);
    expect(scenario.possibleOpponents).toContainEqual(expect.objectContaining({
      condition: "Current real results and active predictions hold",
      opponentLabel: expect.any(String)
    }));
  });

  it("describes completed results as fixed scenario context", () => {
    const scenario = analyzeTeamScenarios(stagedEnglandData(), {}, "england");

    expect(scenario.fixedResults).toEqual([
      "Final: England 4-2 Croatia",
      "Final: England 0-0 Ghana"
    ]);
  });

  it("builds compact AI question context from active predictions", () => {
    const data = stagedScotlandData();
    const context = buildScenarioQuestionContext(data, { m017: { home: 3, away: 0 } }, "scotland");
    const currentContext = buildScenarioQuestionContext(data, {}, "scotland");

    expect(context.team).toEqual({ id: "scotland", name: "Scotland", group: "C" });
    expect(context.activePredictionCount).toBe(1);
    expect(context.qualificationRules).toContain("The top two teams in each group qualify directly.");
    expect(currentContext.qualificationPaths).toEqual(expect.arrayContaining([
      expect.objectContaining({
        condition: "Scotland beat Brazil 3-0",
        status: "direct",
        roundOf32FixtureId: expect.any(String)
      }),
      expect.objectContaining({
        condition: "Scotland lose to Brazil 0-1",
        status: "third-place"
      })
    ]));
    expect(currentContext.finishPaths).toEqual(expect.arrayContaining([
      expect.objectContaining({ groupFinish: 1, opponentLabel: expect.any(String) }),
      expect.objectContaining({ groupFinish: 2, opponentLabel: expect.any(String) }),
      expect.objectContaining({ groupFinish: 3, opponentLabel: expect.any(String) })
    ]));
    expect(currentContext.jeopardyChasers.length).toBeGreaterThan(0);
    expect(currentContext.jeopardyChasers[0]).toEqual(expect.objectContaining({
      passingTeamName: expect.any(String),
      resultCondition: expect.any(String)
    }));
    expect(currentContext.jeopardyRoutes.length).toBeGreaterThan(0);
    expect(currentContext.jeopardyRoutes[0]).toEqual(expect.objectContaining({
      baselineCondition: expect.any(String),
      status: "eliminated",
      summary: expect.stringContaining("miss out"),
      events: expect.arrayContaining([
        expect.objectContaining({
          fixtureId: expect.any(String),
          passingTeams: expect.arrayContaining([expect.any(String)])
        })
      ])
    }));
    expect(currentContext.answerSeed).toEqual(expect.arrayContaining([
      "Qualification paths",
      "Jeopardy routes",
      "Likely round of 32"
    ]));
    expect(currentContext.missOutSummary).toEqual(expect.arrayContaining([
      "No listed selected-match outcome alone eliminates Scotland.",
      expect.stringContaining("Named third-place teams that can pass Scotland:"),
      expect.stringContaining("can pass Scotland")
    ]));
    expect(currentContext.userFacingSummary).toEqual(expect.arrayContaining([
      expect.stringContaining("Any listed win qualifies Scotland directly"),
      expect.stringContaining("A draw currently projects Scotland through"),
      expect.stringContaining("miss out if enough chasing third-place teams pass")
    ]));
    expect(currentContext.answerBrief).toEqual(expect.arrayContaining([
      expect.stringContaining("Scotland are currently"),
      expect.stringContaining("If Scotland win"),
      expect.stringContaining("currently projected through third place"),
      expect.stringContaining("No listed selected-match outcome eliminates Scotland")
    ]));
    expect(currentContext.pressureSummary).toEqual(expect.arrayContaining([
      expect.stringContaining("Lose by 1"),
      expect.stringMatching(/^Lose by \d\+/),
      expect.any(String)
    ]));
    expect(currentContext.pressureNotes[0]).toEqual(expect.objectContaining({
      lossMargin: 1,
      thirdPlaceRank: expect.any(Number),
      sparePlaces: expect.any(Number),
      singleResultExamples: expect.arrayContaining([
        expect.objectContaining({
          winnerName: expect.any(String),
          margin: expect.any(Number),
          thirdPlaceTeamName: expect.any(String),
          summary: expect.any(String)
        })
      ])
    }));
    expect(currentContext.chasingTeams.length).toBeGreaterThan(0);
    expect(context.selectedGroupStandings.map((row) => row.teamName)).toContain("Scotland");
    expect(context.thirdPlaceTable.length).toBeGreaterThan(0);
    expect(currentContext.thirdPlaceTable.some((row) => row.teamName === "Scotland" && row.qualifies)).toBe(true);
    expect(context.remainingGroupFixtures).toContainEqual(expect.objectContaining({
      fixtureId: "m018",
      group: "C",
      homeName: "Morocco",
      awayName: "Haiti"
    }));
    expect(currentContext.groupOutcomeCombinations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        selectedCondition: expect.stringContaining("Scotland draw"),
        dependencyFixtureId: "m018",
        dependencyCondition: expect.stringContaining("Morocco")
      })
    ]));
    expect(context.groupOutcomeCombinations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        selectedCondition: "Current real results and active predictions hold",
        dependencyFixtureId: "m018",
        dependencyCondition: expect.stringContaining("Morocco")
      })
    ]));
    expect(currentContext.outcomes.length).toBeGreaterThan(0);
    expect(context.outcomes).toEqual([]);
    expect(context.dependencies.length).toBeLessThanOrEqual(12);
    expect(context.possibleOpponents.length).toBeLessThanOrEqual(8);
    expect(JSON.stringify(context)).not.toContain("\"fixtures\"");
    expect(JSON.stringify(context)).not.toContain("\"teams\"");
  });

  it("builds concrete jeopardy routes for miss-out answers", () => {
    const context = buildScenarioQuestionContext(stagedAlgeriaData(), {}, "algeria");
    const narrowLossBaseline = context.jeopardyBaselines.find((baseline) => baseline.condition === "Algeria lose to Austria by 1");

    expect(narrowLossBaseline).toEqual(expect.objectContaining({
      condition: "Algeria lose to Austria by 1",
      scenarioShare: expect.objectContaining({
        eliminating: expect.any(Number),
        tested: expect.any(Number),
        percent: expect.any(Number)
      })
    }));
    expect(narrowLossBaseline?.passersNeeded).toBe(Math.max(0, 9 - (narrowLossBaseline?.thirdPlaceRank ?? 9)));
    expect(context.jeopardyRoutes.length).toBeGreaterThan(0);

    const firstRoute = context.jeopardyRoutes[0];
    const routeBaseline = context.jeopardyBaselines.find((baseline) => baseline.condition === firstRoute.baselineCondition);
    expect(routeBaseline).toBeDefined();
    expect(firstRoute).toEqual(expect.objectContaining({
      status: "eliminated",
      resultingThirdPlaceRank: 9,
      summary: expect.stringContaining("Algeria drop to 9th")
    }));
    const routeFixtureIds = firstRoute.events.map((event) => event.fixtureId);
    expect(new Set(routeFixtureIds).size).toBe(routeFixtureIds.length);
    expect(firstRoute.events.length).toBeGreaterThan(0);
  });

  it("returns deterministic scenario output for the same inputs", () => {
    const data = stagedScotlandData();
    expect(analyzeTeamScenarios(data, {}, "scotland")).toEqual(analyzeTeamScenarios(data, {}, "scotland"));
  });

  it("generates deterministic scenario documents for vector retrieval", () => {
    const data = stagedScotlandData();
    const documents = generateScenarioDocuments(data);
    const snapshotId = scenarioSnapshotId(data);

    expect(documents.length).toBeGreaterThan(data.teams.length);
    expect(documents.every((document) => document.metadata.snapshotId === snapshotId)).toBe(true);
    expect(documents.every((document) => new TextEncoder().encode(document.id).length <= 64)).toBe(true);
    expect(documents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        metadata: expect.objectContaining({ kind: "team-summary", teamId: "scotland" }),
        text: expect.stringContaining("Scotland")
      }),
      expect.objectContaining({
        metadata: expect.objectContaining({ kind: "qualification-route", teamId: "scotland" })
      }),
      expect.objectContaining({
        metadata: expect.objectContaining({ kind: "miss-out-route" }),
        text: expect.stringContaining("miss out")
      }),
      expect.objectContaining({
        metadata: expect.objectContaining({ kind: "rule-note" })
      })
    ]));
  });

  it("includes third-place jump candidates for teams outside the current third-place table", () => {
    const data = stagedScotlandData();
    const currentThirdTeamIds = new Set(thirdPlaceRankings(calculateGroupStandings(data, {}), data).map((row) => row.teamId));
    const jumpCandidates = thirdPlaceJumpCandidates(data);
    const outsideCurrentTable = jumpCandidates.find((candidate) => !currentThirdTeamIds.has(candidate.thirdPlaceTeamId));

    expect(outsideCurrentTable).toEqual(expect.objectContaining({
      fixtureId: expect.any(String),
      condition: expect.any(String),
      thirdPlaceTeamId: expect.any(String),
      thirdPlaceTeamName: expect.any(String),
      points: expect.any(Number),
      goalDifference: expect.any(Number),
      goalsFor: expect.any(Number)
    }));
    expect(generateScenarioDocuments(data)).toContainEqual(expect.objectContaining({
      metadata: expect.objectContaining({
        kind: "third-place-jump",
        teamId: outsideCurrentTable?.thirdPlaceTeamId
      }),
      text: expect.stringContaining("can jump into third place")
    }));
  });

  it("keeps snapshot ids stable for identical data and changes them for real result changes", () => {
    const data = stagedScotlandData();
    const sameData = structuredClone(data) as TournamentData;
    const changedData = structuredClone(data) as TournamentData;
    setResult(changedData, "m017", 1, 0);

    expect(scenarioSnapshotId(data)).toBe(scenarioSnapshotId(sameData));
    expect(scenarioSnapshotId(data)).not.toBe(scenarioSnapshotId(changedData));
  });
});
