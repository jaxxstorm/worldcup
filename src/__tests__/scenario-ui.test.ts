import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync("src/main.ts", "utf8");
const styles = readFileSync("src/styles.css", "utf8");

describe("retired scenario UI", () => {
  it("does not expose the Scenarios view in browser navigation or rendering", () => {
    expect(mainSource).not.toContain('data-view="scenarios"');
    expect(mainSource).not.toContain(">Scenarios<");
    expect(mainSource).not.toContain("renderScenariosView");
    expect(mainSource).not.toContain("data-scenario-team");
    expect(mainSource).not.toContain("data-scenario-question");
    expect(mainSource).not.toContain("/api/scenario-question");

    expect(mainSource).toContain('data-view="main"');
    expect(mainSource).toContain('data-view="bracket"');
    expect(mainSource).toContain('data-view="stats"');
    expect(mainSource).toContain('data-view="performance"');
  });

  it("does not keep scenario-specific styles in the browser stylesheet", () => {
    expect(styles).not.toContain(".scenarios-page");
    expect(styles).not.toContain(".scenarios-layout");
    expect(styles).not.toContain(".scenario-question-box");
    expect(styles).not.toContain(".scenario-visual-answer");
    expect(styles).not.toContain(".scenario-state-badge");

    expect(styles).toContain(".bracket-page");
    expect(styles).toContain(".stats-page");
    expect(styles).toContain(".performance-page");
  });

  it("exposes all-team performance alongside group fixture performance", () => {
    expect(mainSource).toContain('data-performance-tab="${tab.id}"');
    expect(mainSource).toContain('label: "Group fixtures"');
    expect(mainSource).toContain('label: "All teams"');
    expect(mainSource).toContain('calculateFixturePerformanceEntries(tournamentData, predictions, "all")');
    expect(mainSource).toContain('fixturePerformanceScopeLabel');
  });
});
