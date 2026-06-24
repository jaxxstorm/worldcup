import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync("src/main.ts", "utf8");
const styles = readFileSync("src/styles.css", "utf8");

describe("scenario UI integration", () => {
  it("wires the Scenarios tab, team selector, and active prediction analysis into the main view", () => {
    expect(mainSource).toContain('data-view="scenarios"');
    expect(mainSource).toContain('data-scenario-team');
    expect(mainSource).not.toContain("${team.flag} ${escapeHtml(team.name)}");
    expect(mainSource).toContain("analyzeTeamScenarios(tournamentData, predictions");
    expect(mainSource).toContain("let selectedScenarioTeamId = scenarioTeams()[0]?.id ?? \"\"");
    expect(mainSource).toContain(".sort((left, right) => left.name.localeCompare(right.name))");
    expect(mainSource).toContain("renderScenarioOutcomePanel");
    expect(mainSource).toContain("renderScenarioDependencyPanel");
    expect(mainSource).toContain("scenario-right-column");
    expect(mainSource).toContain("renderScenarioInlineOpponents");
    expect(mainSource).toContain("scenario-opponent-row");
    expect(mainSource).toContain("Alternative opponents");
    expect(mainSource).toContain("sameScenarioOpponent");
    expect(mainSource).toContain("data-scenario-question");
    expect(mainSource).toContain("<div class=\"scenario-ai-answer\"");
    expect(mainSource).toContain("let scenarioAnswerContext");
    expect(mainSource).toContain("renderScenarioVisualAnswer");
    expect(mainSource).toContain("renderScenarioRouteMap");
    expect(mainSource).toContain("renderScenarioChaserMap");
    expect(mainSource).toContain("renderScenarioFinishMap");
    expect(mainSource).toContain("scenario-route-event");
    expect(mainSource).toContain("scenario-chaser-chip");
    expect(mainSource).toContain("scenario-finish-chip");
    expect(mainSource).toContain("buildScenarioQuestionContext(tournamentData, predictions");
    expect(mainSource).toContain("\"/api/scenario-question\"");
  });

  it("renders fixed-result copy and responsive scenario styles", () => {
    expect(mainSource).toContain("Fixed Results");
    expect(mainSource).toContain("scenario.fixedResults");
    expect(styles).toContain(".scenarios-layout");
    expect(styles).toContain(".scenario-left-column");
    expect(styles).toContain(".scenario-right-column");
    expect(styles).toContain(".scenario-current-layout");
    expect(styles).toContain(".scenario-path-panel");
    expect(styles).toContain(".scenario-opponent-row");
    expect(styles).toContain(".scenario-question-box");
    expect(styles).toContain(".scenario-question-row");
    expect(styles).toContain(".scenario-visual-answer");
    expect(styles).toContain(".scenario-route-flow");
    expect(styles).toContain(".scenario-chaser-grid");
    expect(styles).toContain(".scenario-finish-strip");
    expect(styles).toContain("white-space: pre-wrap");
    expect(styles).toContain(".scenario-team-selector");
    expect(styles).toContain("@media (max-width: 900px)");
  });
});
