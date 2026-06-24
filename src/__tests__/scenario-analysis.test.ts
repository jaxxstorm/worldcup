import { describe, expect, it } from "vitest";
import { tournamentData } from "../data/tournament";
import { analyzeTeamScenarios, buildScenarioQuestionContext } from "../engine/scenarios";
import type { TournamentData } from "../types";

describe("scenario analysis", () => {
  it("explains selected-team win, draw, and loss paths from remaining group fixtures", () => {
    const scenario = analyzeTeamScenarios(tournamentData, {}, "england");
    const panamaOutcomes = scenario.outcomes.filter((outcome) => outcome.fixtureId === "m071");

    expect(panamaOutcomes.map((outcome) => outcome.kind)).toEqual(["big-win", "win", "draw", "loss", "heavy-loss"]);
    expect(panamaOutcomes.find((outcome) => outcome.kind === "win")?.summary).toContain("England beat Panama 1-0");
    expect(panamaOutcomes.find((outcome) => outcome.kind === "heavy-loss")?.summary).toContain("GD");
    expect(panamaOutcomes.every((outcome) => outcome.roundOf32FixtureId)).toBe(true);
    expect(panamaOutcomes.every((outcome) => outcome.summary.includes("Group L"))).toBe(true);
  });

  it("identifies direct qualification, third-place qualification, and elimination paths", () => {
    const scotland = analyzeTeamScenarios(tournamentData, {}, "scotland");
    const panama = analyzeTeamScenarios(tournamentData, {}, "panama");

    expect(scotland.outcomes.some((outcome) => outcome.status === "direct")).toBe(true);
    expect(scotland.outcomes.some((outcome) => outcome.status === "third-place")).toBe(true);
    expect(panama.current.status).toBe("eliminated");
    expect(panama.outcomes.every((outcome) => outcome.status === "eliminated")).toBe(true);
  });

  it("factors scoreline severity into goal-difference-sensitive branches", () => {
    const scotland = analyzeTeamScenarios(tournamentData, {}, "scotland");
    const heavyBrazilLoss = scotland.outcomes.find((outcome) => outcome.fixtureId === "m017" && outcome.kind === "heavy-loss");
    const narrowBrazilLoss = scotland.outcomes.find((outcome) => outcome.fixtureId === "m017" && outcome.kind === "loss");

    expect(heavyBrazilLoss?.condition).toBe("Scotland lose to Brazil 0-3");
    expect(narrowBrazilLoss?.condition).toBe("Scotland lose to Brazil 0-1");
    expect(heavyBrazilLoss?.summary).toContain("GD");
    expect(heavyBrazilLoss?.summary).not.toEqual(narrowBrazilLoss?.summary);
  });

  it("adds concise margin-swing notes when combined scorelines can change qualification", () => {
    const data = structuredClone(tournamentData) as TournamentData;
    const setResult = (fixtureId: string, home: number, away: number) => {
      const fixture = data.fixtures.find((candidate) => candidate.id === fixtureId)!;
      fixture.status = "completed";
      fixture.result = { home, away };
    };
    const setScheduled = (fixtureId: string) => {
      const fixture = data.fixtures.find((candidate) => candidate.id === fixtureId)!;
      fixture.status = "scheduled";
      delete fixture.result;
      delete fixture.sourceResult;
    };
    setResult("m013", 1, 0);
    setResult("m014", 0, 1);
    setResult("m015", 1, 0);
    setResult("m016", 0, 0);
    setScheduled("m017");
    setScheduled("m018");

    const scotland = analyzeTeamScenarios(data, {}, "scotland");

    expect(scotland.marginNotes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        condition: expect.stringMatching(/^Scotland lose to Brazil by \d\+ and .+ beat .+ by \d\+$/),
        effect: expect.stringContaining("They can")
      })
    ]));
  });

  it("names dependent fixtures and possible round-of-32 opponents", () => {
    const scenario = analyzeTeamScenarios(tournamentData, {}, "england");

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
    const scenario = analyzeTeamScenarios(tournamentData, {}, "england");

    expect(scenario.fixedResults).toEqual([
      "Final: England 4-2 Croatia",
      "Final: England 0-0 Ghana"
    ]);
  });

  it("builds compact AI question context from active predictions", () => {
    const context = buildScenarioQuestionContext(tournamentData, { m017: { home: 3, away: 0 } }, "scotland");
    const currentContext = buildScenarioQuestionContext(tournamentData, {}, "scotland");

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
    expect(currentContext.jeopardyChasers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        passingTeamName: "South Korea",
        resultCondition: expect.stringContaining("Czechia")
      }),
      expect.objectContaining({
        passingTeamName: "Cote d'Ivoire",
        resultCondition: expect.stringContaining("Cote d'Ivoire")
      })
    ]));
    expect(currentContext.jeopardyRoutes[0]).toEqual(expect.objectContaining({
      baselineCondition: expect.stringContaining("Scotland lose to Brazil"),
      status: "eliminated",
      summary: expect.stringContaining("miss out"),
      events: expect.arrayContaining([
        expect.objectContaining({
          fixtureId: "m005",
          passingTeams: expect.arrayContaining(["South Korea"])
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
      expect.stringContaining("South Korea can pass Scotland if Czechia win"),
      expect.stringContaining("DR Congo can pass Scotland")
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
      expect.stringContaining("Lose by 2+"),
      expect.stringContaining("Czechia")
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
    expect(currentContext.chasingTeams).toEqual(expect.arrayContaining([
      expect.stringContaining("Czechia")
    ]));
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
    const context = buildScenarioQuestionContext(tournamentData, {}, "algeria");
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
    expect(analyzeTeamScenarios(tournamentData, {}, "scotland")).toEqual(analyzeTeamScenarios(tournamentData, {}, "scotland"));
  });
});
