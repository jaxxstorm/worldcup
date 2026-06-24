import "./styles.css";
import { tournamentData, teamById, venueById } from "./data/tournament";
import { validateTournamentData } from "./data/schema";
import { buildBracketLayout, type BracketLayout, type BracketNode } from "./engine/bracket-layout";
import { formatFixtureKickoff, sectionFixturesForDisplay } from "./engine/fixtures";
import { drawSidesForProjection, projectTournament } from "./engine/knockout";
import { calculateFixturePerformanceEntries, calculateFixturePerformanceSummaries, calculatePerformanceRows, type FixturePerformanceEntry, type FixturePerformanceSummary, type PerformanceMode, type PerformanceRow } from "./engine/performance";
import { interpretPredictionInput, isEditableFixture, setPrediction } from "./engine/predictions";
import { analyzeTeamScenarios, buildScenarioQuestionContext, type ScenarioDependency, type ScenarioMarginNote, type ScenarioOutcome, type ScenarioQuestionContext, type TeamScenarioAnalysis } from "./engine/scenarios";
import { calculateGroupStandings, thirdPlaceRankings } from "./engine/standings";
import { recentResultsForTeam, type TeamRecentResult } from "./engine/team-details";
import { buildPredictionShareUrl, sharedPredictionsFromUrl } from "./storage/share";
import { loadPredictions, savePredictions } from "./storage/session";
import type { Fixture, MatchStage, PredictionMap, ProjectedMatch, QualifiedTeam, Score, StatLeaderboard, Team, TeamRef, ThirdPlaceStandingRow } from "./types";
import { capturePredictionChangeSnapshot, changeLabel, matchChange, matchChanged, participantChange, standingRowChange, standingValueChange, thirdPlaceRowChange, winnerChange, type MatchChange, type PredictionChangeSnapshot, type RowChange } from "./ui/change-highlights";

const validationIssues = validateTournamentData(tournamentData);
if (validationIssues.length > 0) {
  throw new Error(`Invalid tournament data: ${validationIssues.map((issue) => `${issue.path} ${issue.message}`).join(", ")}`);
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("App root missing");

const appRoot = app;
const sharedPredictions = sharedPredictionsFromUrl(tournamentData, window.location.href);
let predictions: PredictionMap = sharedPredictions ?? loadPredictions(tournamentData);
let activeView: "main" | "bracket" | "stats" | "performance" | "scenarios" = "main";
let activePerformanceTab: "teams" | "fixtures" = "teams";
let activePerformanceMode: PerformanceMode = "raw";
let selectedScenarioTeamId = scenarioTeams()[0]?.id ?? "";
let scenarioQuestion = "";
let scenarioAnswer = "";
let scenarioAnswerContext: ScenarioQuestionContext | undefined;
let scenarioQuestionError = "";
let scenarioQuestionLoading = false;
let activeTooltip: HTMLDivElement | undefined;
let recentPredictionChange: PredictionChangeSnapshot | undefined = sharedPredictions && Object.keys(sharedPredictions).length > 0
  ? capturePredictionChangeSnapshot(tournamentData, {})
  : undefined;

if (sharedPredictions) {
  savePredictions(sharedPredictions);
}

const bracketRounds: MatchStage[] = ["round-of-32", "round-of-16", "quarter-final", "semi-final", "third-place", "final"];
const fixtureById = new Map(tournamentData.fixtures.map((fixture) => [fixture.id, fixture]));

function render() {
  const projection = projectTournament(tournamentData, predictions);
  appRoot.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <div class="brand">
          <h1>World Cup 2026 Predictor</h1>
          <p>As-it-stands tables and bracket paths use real results plus your predictions. Change future scores and the projected tournament updates instantly.</p>
        </div>
        <div class="topbar-actions">
          <button class="source-pill share-pill" type="button" data-share-predictions>Share predictions</button>
          <button class="source-pill clear-predictions-pill" type="button" data-clear-predictions ${Object.keys(predictions).length === 0 ? "disabled" : ""}>Clear predictions</button>
          <span class="share-status" aria-live="polite" data-share-status></span>
          <a class="source-pill" href="${tournamentData.sources[0].url}" target="_blank" rel="noreferrer">Fixture source</a>
        </div>
      </header>
      <nav class="view-tabs" aria-label="Views">
        <button class="${activeView === "main" ? "active" : ""}" type="button" data-view="main">Fixtures</button>
        <button class="${activeView === "bracket" ? "active" : ""}" type="button" data-view="bracket">Knockout Stages</button>
        <button class="${activeView === "scenarios" ? "active" : ""}" type="button" data-view="scenarios">Scenarios</button>
        <button class="${activeView === "stats" ? "active" : ""}" type="button" data-view="stats">Stats</button>
        <button class="${activeView === "performance" ? "active" : ""}" type="button" data-view="performance">Performance</button>
      </nav>
      ${renderActiveView(activeView, projection)}
    </main>
  `;

  appRoot.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      activeView = parseActiveView(button.dataset.view);
      render();
    });
  });

  appRoot.querySelectorAll<HTMLButtonElement>("[data-performance-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      activePerformanceMode = parsePerformanceMode(button.dataset.performanceMode);
      render();
    });
  });

  appRoot.querySelectorAll<HTMLButtonElement>("[data-performance-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activePerformanceTab = parsePerformanceTab(button.dataset.performanceTab);
      render();
    });
  });

  appRoot.querySelectorAll<HTMLSelectElement>("[data-scenario-team]").forEach((select) => {
    select.addEventListener("change", () => {
      selectedScenarioTeamId = select.value;
      scenarioAnswer = "";
      scenarioAnswerContext = undefined;
      scenarioQuestionError = "";
      render();
    });
  });

  appRoot.querySelectorAll<HTMLInputElement>("[data-scenario-question]").forEach((input) => {
    input.addEventListener("input", () => {
      scenarioQuestion = input.value;
    });
  });

  appRoot.querySelectorAll<HTMLFormElement>("[data-scenario-question-form]").forEach((form) => {
    form.addEventListener("submit", handleScenarioQuestion);
  });

  appRoot.querySelectorAll<HTMLElement>("[data-tooltip]").forEach((element) => {
    element.addEventListener("mouseenter", () => showTooltip(element));
    element.addEventListener("mouseleave", hideTooltip);
    element.addEventListener("focus", () => showTooltip(element));
    element.addEventListener("blur", hideTooltip);
  });

  appRoot.querySelectorAll<HTMLElement>("[data-team-id]").forEach((element) => {
    element.addEventListener("mouseenter", () => showTeamTooltip(element));
    element.addEventListener("mouseleave", hideTooltip);
    element.addEventListener("focus", () => showTeamTooltip(element));
    element.addEventListener("blur", hideTooltip);
  });

  appRoot.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-prediction]").forEach((input) => {
    input.addEventListener(input instanceof HTMLSelectElement ? "change" : "input", handlePredictionInput);
  });

  appRoot.querySelectorAll<HTMLButtonElement>("[data-share-predictions]").forEach((button) => {
    button.addEventListener("click", handleSharePredictions);
  });

  appRoot.querySelectorAll<HTMLButtonElement>("[data-clear-predictions]").forEach((button) => {
    button.addEventListener("click", handleClearPredictions);
  });
}

function parseActiveView(view: string | undefined): typeof activeView {
  if (view === "bracket" || view === "stats" || view === "performance" || view === "scenarios") return view;
  return "main";
}

function parsePerformanceMode(mode: string | undefined): PerformanceMode {
  if (mode === "raw" || mode === "per-match" || mode === "group-delta") return mode;
  return "raw";
}

function parsePerformanceTab(tab: string | undefined): typeof activePerformanceTab {
  if (tab === "fixtures") return "fixtures";
  return "teams";
}

function renderActiveView(view: typeof activeView, projection: ProjectedMatch[]) {
  if (view === "bracket") return renderBracketView(projection);
  if (view === "scenarios") return renderScenariosView();
  if (view === "stats") return renderStatsView();
  if (view === "performance") return renderPerformanceView();
  return renderMainView(projection);
}

function renderScenariosView() {
  const selectedTeam = teamById.get(selectedScenarioTeamId) ?? tournamentData.teams.find((team) => team.group);
  if (!selectedTeam) return `<p class="empty-state">No group-stage teams are available.</p>`;

  selectedScenarioTeamId = selectedTeam.id;
  const scenario = analyzeTeamScenarios(tournamentData, predictions, selectedTeam.id);

  return `
    <div class="scenarios-page">
      <section>
        <div class="scenarios-heading">
          <div>
            <h2>Scenarios</h2>
            <p class="section-note">Pick a team or ask a scenario question.</p>
          </div>
          ${renderScenarioTeamSelector(selectedTeam.id)}
        </div>
        ${renderScenarioQuestionBox(selectedTeam)}
        <div class="scenarios-layout">
          <div class="scenario-left-column">
            ${renderScenarioCurrentPanel(scenario)}
          </div>
          <div class="scenario-right-column">
            ${renderScenarioOutcomePanel(scenario)}
            ${renderScenarioDependencyPanel(scenario)}
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderScenarioQuestionBox(selectedTeam: Team) {
  return `
    <form class="scenario-question-box" data-scenario-question-form>
      <label for="scenario-question">Ask about ${escapeHtml(selectedTeam.name)}</label>
      <div class="scenario-question-row">
        <input
          id="scenario-question"
          type="search"
          data-scenario-question
          value="${escapeAttribute(scenarioQuestion)}"
          placeholder="How could ${escapeAttribute(selectedTeam.name)} miss out?"
          autocomplete="off"
        >
        <button type="submit" ${scenarioQuestionLoading ? "disabled" : ""}>${scenarioQuestionLoading ? "Asking..." : "Ask"}</button>
      </div>
      ${scenarioAnswerContext ? renderScenarioVisualAnswer(scenarioAnswerContext) : ""}
      ${scenarioAnswer ? `<div class="scenario-ai-answer" aria-live="polite">${escapeHtml(scenarioAnswer)}</div>` : ""}
      ${scenarioQuestionError ? `<p class="scenario-ai-error" aria-live="polite">${escapeHtml(scenarioQuestionError)}</p>` : ""}
    </form>
  `;
}

function renderScenarioVisualAnswer(context: ScenarioQuestionContext) {
  const route = context.jeopardyRoutes[0];
  const pathMarkup = renderScenarioQuickPaths(context);
  const routeMarkup = route ? renderScenarioRouteMap(context, route) : "";
  const chaserMarkup = renderScenarioChaserMap(context, route);
  const finishMarkup = renderScenarioFinishMap(context);

  if (!pathMarkup && !routeMarkup && !chaserMarkup && !finishMarkup) return "";

  return `
    <div class="scenario-visual-answer" aria-label="Scenario implications">
      ${pathMarkup}
      ${routeMarkup}
      ${chaserMarkup}
      ${finishMarkup}
    </div>
  `;
}

function renderScenarioQuickPaths(context: ScenarioQuestionContext) {
  const paths = context.qualificationPaths.slice(0, 5);
  if (paths.length === 0) return "";

  return `
    <div class="scenario-visual-block">
      <div class="scenario-visual-heading">
        <span>Paths</span>
        <strong>${escapeHtml(context.team.name)}</strong>
      </div>
      <div class="scenario-quick-paths">
        ${paths.map((path) => `
          <span class="scenario-path-chip ${path.status}">
            <strong>${escapeHtml(path.condition)}</strong>
            <em>${scenarioStatusLabel(path.status)} · ${ordinal(path.groupFinish)} · ${path.points} pts</em>
          </span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderScenarioRouteMap(context: ScenarioQuestionContext, route: ScenarioQuestionContext["jeopardyRoutes"][number]) {
  const routeCount = context.jeopardyRoutes.length;
  const routeRank = route.resultingThirdPlaceRank ? `${ordinal(route.resultingThirdPlaceRank)} in third-place` : scenarioStatusLabel(route.status);
  const routeShare = renderScenarioRouteShare(route.scenarioShare);

  return `
    <div class="scenario-visual-block">
      <div class="scenario-visual-heading">
        <span>Shortest miss-out route</span>
        <strong>${route.events.length} ${route.events.length === 1 ? "result" : "results"} needed${routeCount > 1 ? ` · ${routeCount} routes found` : ""}</strong>
      </div>
      <div class="scenario-route-flow">
        <span class="scenario-route-baseline">${escapeHtml(route.baselineCondition)}</span>
        ${route.events.map((event) => `
          <span class="scenario-route-event">
            <span>${escapeHtml(event.fixtureId)}</span>
            <strong>${escapeHtml(event.resultCondition)}</strong>
            <em>${escapeHtml(event.passingTeams.join(", "))} pass</em>
          </span>
        `).join("")}
        <span class="scenario-route-outcome ${route.status}">
          <strong>${escapeHtml(routeRank)}</strong>
          <em>${scenarioStatusLabel(route.status)}</em>
        </span>
      </div>
      ${routeShare ? `<p class="scenario-visual-note">${routeShare}</p>` : ""}
    </div>
  `;
}

function renderScenarioRouteShare(share: ScenarioQuestionContext["jeopardyRoutes"][number]["scenarioShare"]) {
  if (!questionAsksForShare() || share.tested === 0) return "";

  const percent = Number.isInteger(share.percent) ? `${share.percent}%` : `${share.percent.toFixed(1)}%`;
  return `${share.eliminating} of ${share.tested} tested compatible combinations (${percent} bounded scenario share, not a prediction probability).`;
}

function questionAsksForShare() {
  return /\b(chance|percent|percentage|probability|probable|likely|likelihood)\b/i.test(scenarioQuestion);
}

function renderScenarioChaserMap(context: ScenarioQuestionContext, route: ScenarioQuestionContext["jeopardyRoutes"][number] | undefined) {
  const routePassingTeams = new Set(route?.events.flatMap((event) => event.passingTeams) ?? []);
  const chasers = scenarioVisualChasers(context, routePassingTeams);
  if (chasers.length === 0) return "";

  const visibleChasers = chasers.slice(0, 8);
  const hiddenCount = chasers.length - visibleChasers.length;

  return `
    <div class="scenario-visual-block">
      <div class="scenario-visual-heading">
        <span>Chasing pack</span>
        <strong>${chasers.length} ${chasers.length === 1 ? "team" : "teams"} can pass</strong>
      </div>
      <div class="scenario-chaser-grid">
        ${visibleChasers.map((chaser) => `
          <span class="scenario-chaser-chip ${routePassingTeams.has(chaser.passingTeamName) ? "route" : ""}">
            <strong>${escapeHtml(chaser.passingTeamName)}</strong>
            <span>${escapeHtml(chaser.resultCondition)}</span>
            <em>${ordinal(chaser.thirdPlaceRank)} · ${chaser.points} pts · GD ${formatSignedNumber(chaser.goalDifference)}</em>
          </span>
        `).join("")}
        ${hiddenCount > 0 ? `<span class="scenario-chaser-chip more">+${hiddenCount} more</span>` : ""}
      </div>
    </div>
  `;
}

function scenarioVisualChasers(context: ScenarioQuestionContext, routePassingTeams: Set<string>) {
  const byTeam = new Map<string, ScenarioQuestionContext["jeopardyChasers"][number]>();

  for (const chaser of context.jeopardyChasers) {
    const current = byTeam.get(chaser.passingTeamId);
    if (!current || scenarioChaserSortValue(chaser, routePassingTeams) < scenarioChaserSortValue(current, routePassingTeams)) {
      byTeam.set(chaser.passingTeamId, chaser);
    }
  }

  return Array.from(byTeam.values()).sort((left, right) => {
    const leftRoute = routePassingTeams.has(left.passingTeamName) ? 0 : 1;
    const rightRoute = routePassingTeams.has(right.passingTeamName) ? 0 : 1;
    return leftRoute - rightRoute ||
      left.thirdPlaceRank - right.thirdPlaceRank ||
      (left.margin ?? 99) - (right.margin ?? 99) ||
      left.passingTeamName.localeCompare(right.passingTeamName);
  });
}

function scenarioChaserSortValue(chaser: ScenarioQuestionContext["jeopardyChasers"][number], routePassingTeams: Set<string>) {
  return (routePassingTeams.has(chaser.passingTeamName) ? 0 : 100000) +
    chaser.thirdPlaceRank * 1000 +
    (chaser.margin ?? 99);
}

function renderScenarioFinishMap(context: ScenarioQuestionContext) {
  const paths = [...context.finishPaths].sort((left, right) => left.groupFinish - right.groupFinish);
  if (paths.length === 0) return "";

  return `
    <div class="scenario-visual-block">
      <div class="scenario-visual-heading">
        <span>Round of 32</span>
        <strong>By finish</strong>
      </div>
      <div class="scenario-finish-strip">
        ${paths.map((path) => `
          <span class="scenario-finish-chip ${path.status}">
            <strong>${ordinal(path.groupFinish)}</strong>
            <span>${escapeHtml(path.roundOf32FixtureId ?? "TBD")} ${path.opponentLabel ? `vs ${renderScenarioOpponent(path.opponentTeamId, path.opponentLabel)}` : "opponent unresolved"}</span>
            <em>${escapeHtml(path.condition)}</em>
          </span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderScenarioTeamSelector(selectedTeamId: string) {
  const teams = scenarioTeams();
  return `
    <label class="scenario-team-selector">
      <span>Team</span>
      <select data-scenario-team aria-label="Select scenario team">
        ${teams.map((team) => `<option value="${escapeAttribute(team.id)}" ${team.id === selectedTeamId ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("")}
      </select>
    </label>
  `;
}

function scenarioTeams() {
  return [...tournamentData.teams]
    .filter((team) => team.group)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function renderScenarioCurrentPanel(scenario: TeamScenarioAnalysis) {
  const team = teamById.get(scenario.teamId);
  return `
    <section class="scenario-panel scenario-current" aria-labelledby="scenario-current-heading">
      <div class="scenario-current-heading">
        <div class="scenario-current-title-row">
          <h3 id="scenario-current-heading">Current Position</h3>
          <span>${scenarioStatusLabel(scenario.current.status)}</span>
        </div>
        <p class="scenario-current-team-line">
          ${renderTeamIdentity(team, scenario.teamId)}
          <span>are ${ordinal(scenario.current.rank)} in Group ${scenario.group}.</span>
        </p>
      </div>
      <div class="scenario-current-layout">
        <div class="scenario-current-main">
          <div class="scenario-current-grid">
            <span><strong>${scenario.current.points}</strong> pts</span>
            <span><strong>${formatSignedNumber(scenario.current.goalDifference)}</strong> GD</span>
            <span><strong>${scenario.current.goalsFor}</strong> GF</span>
            <span><strong>${scenario.current.played}</strong> played</span>
          </div>
          ${scenario.fixedResults.length > 0 ? `
            <div class="scenario-fixed-results">
              <h4>Fixed Results</h4>
              ${scenario.fixedResults.map((result) => `<p>${escapeHtml(result)}</p>`).join("")}
            </div>
          ` : ""}
        </div>
        <div class="scenario-path-panel">
          <h4>Round of 32</h4>
          ${renderScenarioCurrentPath(scenario)}
          ${renderScenarioInlineOpponents(scenario)}
        </div>
      </div>
    </section>
  `;
}

function renderScenarioCurrentPath(scenario: TeamScenarioAnalysis) {
  if (!scenario.currentPath) return `<p class="scenario-summary">No resolved assignment.</p>`;

  return `
    <div class="scenario-path-row current">
      <span>${scenario.currentPath.fixtureId}</span>
      <span>${scenario.currentPath.slot}</span>
      <strong>${renderScenarioOpponent(scenario.currentPath.opponentTeamId, scenario.currentPath.opponentLabel)}</strong>
    </div>
  `;
}

function renderScenarioInlineOpponents(scenario: TeamScenarioAnalysis) {
  const alternatives = scenario.possibleOpponents
    .filter((possibility) => !sameScenarioOpponent(possibility, scenario.currentPath))
    .sort((left, right) => left.fixtureId.localeCompare(right.fixtureId) || left.opponentLabel.localeCompare(right.opponentLabel));
  if (alternatives.length === 0) return "";

  return `
    <div class="scenario-inline-opponents">
      <h5>Alternative opponents</h5>
      ${alternatives.slice(0, 5).map((possibility) => `
        <div class="scenario-opponent-row">
          <div>
            <span>${possibility.fixtureId}</span>
            <strong>${renderScenarioOpponent(possibility.opponentTeamId, possibility.opponentLabel)}</strong>
          </div>
          <em>${escapeHtml(possibility.condition)}</em>
        </div>
      `).join("")}
    </div>
  `;
}

function sameScenarioOpponent(possibility: TeamScenarioAnalysis["possibleOpponents"][number], currentPath: TeamScenarioAnalysis["currentPath"]) {
  return Boolean(currentPath) &&
    possibility.fixtureId === currentPath?.fixtureId &&
    possibility.opponentLabel === currentPath.opponentLabel &&
    possibility.opponentTeamId === currentPath.opponentTeamId;
}

function renderScenarioOutcomePanel(scenario: TeamScenarioAnalysis) {
  return `
    <section class="scenario-panel scenario-outcomes" aria-labelledby="scenario-outcomes-heading">
      <div class="stats-panel-heading">
        <div>
          <h3 id="scenario-outcomes-heading">Qualification Paths</h3>
          <p>Remaining group branches.</p>
        </div>
        <span>${scenario.outcomes.length} paths</span>
      </div>
      ${scenario.outcomes.length > 0 ? `
        <div class="scenario-list">
          ${scenario.outcomes.map(renderScenarioOutcome).join("")}
        </div>
      ` : `<p class="empty-state">No unresolved group fixtures remain for this team.</p>`}
      ${scenario.marginNotes.length > 0 ? `
        <div class="scenario-margin-notes">
          <h4>Margin swings</h4>
          <div class="scenario-list">
            ${scenario.marginNotes.map(renderScenarioMarginNote).join("")}
          </div>
        </div>
      ` : ""}
      ${scenario.tieBreakerNote ? `<p class="scenario-note">${escapeHtml(scenario.tieBreakerNote)}</p>` : ""}
    </section>
  `;
}

function renderScenarioOutcome(outcome: ScenarioOutcome) {
  return `
    <article class="scenario-item ${outcome.status}">
      <div>
        <strong>${escapeHtml(outcome.condition)}</strong>
        <p>${ordinal(outcome.groupFinish)} in group; ${outcome.points} pts${outcome.slot ? `; ${outcome.roundOf32FixtureId} as ${outcome.slot}${outcome.opponentLabel ? ` vs ${escapeHtml(outcome.opponentLabel)}` : ""}` : ""}.</p>
      </div>
      <span>${scenarioStatusLabel(outcome.status)}</span>
    </article>
  `;
}

function renderScenarioMarginNote(note: ScenarioMarginNote) {
  return `
    <article class="scenario-item ${note.status}">
      <div>
        <strong>${escapeHtml(note.condition)}</strong>
        <p>${escapeHtml(note.effect)}</p>
      </div>
      <span>${note.fixtureIds.join(" + ")}</span>
    </article>
  `;
}

function renderScenarioDependencyPanel(scenario: TeamScenarioAnalysis) {
  return `
    <section class="scenario-panel scenario-dependencies" aria-labelledby="scenario-dependencies-heading">
      <div class="stats-panel-heading">
        <div>
          <h3 id="scenario-dependencies-heading">Dependencies</h3>
          <p>Other results that can move the path.</p>
        </div>
        <span>${scenario.dependencies.length}</span>
      </div>
      ${scenario.dependencies.length > 0 ? `
        <div class="scenario-list">
          ${scenario.dependencies.map(renderScenarioDependency).join("")}
        </div>
      ` : `<p class="empty-state">No outside dependency changes this team's current path.</p>`}
    </section>
  `;
}

function renderScenarioDependency(dependency: ScenarioDependency) {
  return `
    <article class="scenario-item ${dependency.kind}">
      <div>
        <strong>${escapeHtml(dependency.condition)}</strong>
        <p>${escapeHtml(dependency.effect)}</p>
      </div>
      <span>${dependency.fixtureId ?? dependency.kind}</span>
    </article>
  `;
}

function renderScenarioOpponent(teamId: string | undefined, label: string) {
  return renderTeamIdentity(teamId ? teamById.get(teamId) : undefined, label);
}

function renderMainView(projection: ProjectedMatch[]) {
  return `
    <div class="layout">
      <div class="column">
        <section>
          <h2>Fixtures</h2>
          <div class="fixture-list">${renderFixtures()}</div>
        </section>
      </div>
      <div class="column">
        <section>
          <h2>As-It-Stands Tables</h2>
          <p class="section-note">Current standings decide projected qualifiers until predictions replace unresolved results.</p>
          <div class="table-list">${renderStandings()}</div>
        </section>
        <section>
          <h2>As-It-Stands Knockout Path</h2>
          <p class="section-note">Best third-place slots are filled from the current third-place table when the bracket is projected.</p>
          <div class="knockout-list">${renderKnockout(projection)}</div>
        </section>
      </div>
    </div>
  `;
}

function renderStatsView() {
  return `
    <div class="stats-page">
      <section>
        <h2>Stats</h2>
        <p class="section-note">Player leaderboards use normalized football-data.org scorer data bundled into the static app.</p>
        <section class="stats-panel" aria-labelledby="player-stats-heading">
          <div class="stats-panel-heading">
            <h3 id="player-stats-heading">Player Leaders</h3>
            <span>${tournamentData.statLeaderboards?.length ?? 0} boards</span>
          </div>
          ${renderStatLeaderboards(tournamentData.statLeaderboards ?? [])}
        </section>
      </section>
    </div>
  `;
}

function renderPerformanceView() {
  const rows = calculatePerformanceRows(tournamentData, predictions, activePerformanceMode);
  const fixtureRows = calculateFixturePerformanceEntries(tournamentData, predictions);
  const fixtureSummaries = calculateFixturePerformanceSummaries(tournamentData, predictions);

  return `
    <div class="performance-page">
      <section>
        <h2>Performance</h2>
        ${renderPerformanceSubTabs()}
        ${activePerformanceTab === "teams" ? renderTeamPerformancePanel(rows) : renderFixturePerformancePanel(fixtureSummaries, fixtureRows)}
      </section>
    </div>
  `;
}

function renderPerformanceSubTabs() {
  const tabs: Array<{ id: typeof activePerformanceTab; label: string }> = [
    { id: "teams", label: "Teams" },
    { id: "fixtures", label: "Fixtures" }
  ];

  return `
    <div class="performance-subtabs" aria-label="Performance analysis type">
      ${tabs.map((tab) => `
        <button class="${activePerformanceTab === tab.id ? "active" : ""}" type="button" data-performance-tab="${tab.id}">
          ${tab.label}
        </button>
      `).join("")}
    </div>
  `;
}

function renderTeamPerformancePanel(rows: PerformanceRow[]) {
  return `
    <p class="section-note">${performanceModeNote(activePerformanceMode)}</p>
    <section class="stats-panel performance-panel" aria-labelledby="performance-table-heading">
      <div class="stats-panel-heading">
        <h3 id="performance-table-heading">Team Performance</h3>
        <span>${rows.length} teams</span>
      </div>
      ${renderPerformanceModeControls()}
      ${renderPerformanceTable(rows, activePerformanceMode)}
    </section>
  `;
}

function renderFixturePerformancePanel(summaryRows: FixturePerformanceSummary[], fixtureRows: FixturePerformanceEntry[]) {
  return `
    <section class="stats-panel fixture-performance-panel" aria-labelledby="fixture-performance-heading">
      <div class="stats-panel-heading">
        <div>
          <h3 id="fixture-performance-heading">Fixture Performances</h3>
        <p>Success compares each result with an Elo-style expectation derived from FIFA ranking.</p>
        </div>
        <span>${fixtureRows.length} entries</span>
      </div>
      ${renderFixturePerformanceFormula()}
      ${renderFixturePerformanceSummaryTable(summaryRows)}
      <div class="fixture-performance-detail-heading">
        <h4>Results & Credit</h4>
        <span>${fixtureRows.length} rows</span>
      </div>
      ${renderFixturePerformanceTable(fixtureRows)}
    </section>
  `;
}

function renderPerformanceModeControls() {
  const modes: Array<{ id: PerformanceMode; label: string }> = [
    { id: "raw", label: "Raw" },
    { id: "group-delta", label: "Group delta" },
    { id: "per-match", label: "Per match" }
  ];

  return `
    <div class="performance-mode-tabs" aria-label="Performance ranking mode">
      ${modes.map((mode) => `
        <button class="${activePerformanceMode === mode.id ? "active" : ""}" type="button" data-performance-mode="${mode.id}">
          ${mode.label}
        </button>
      `).join("")}
    </div>
  `;
}

function renderPerformanceTable(rows: PerformanceRow[], mode: PerformanceMode) {
  const rankHeader = mode === "group-delta" ? "Rank" : "#";
  const metricHeaders = mode === "group-delta"
    ? ["Now", "Seeded", "Record", "Pts", "GD", "FIFA", "Move", "Status"]
    : ["Record", mode === "per-match" ? "PPM" : "Pts", mode === "per-match" ? "GD/M" : "GD", "Seed", "FIFA", "Move", "Status"];

  return `
    <div class="performance-table">
      <div class="performance-row header ${mode === "group-delta" ? "group-delta" : ""}">
        <span>${rankHeader}</span>
        <span>Team</span>
        <span>Group</span>
        ${metricHeaders.map((header) => `<span>${header}</span>`).join("")}
      </div>
      ${rows.map((row) => renderPerformanceRow(row, mode)).join("")}
    </div>
  `;
}

function renderPerformanceRow(row: PerformanceRow, mode: PerformanceMode) {
  const team = teamById.get(row.teamId);
  return `
    <div class="performance-row ${row.performanceStatus} ${mode === "group-delta" ? "group-delta" : ""}">
      <span>${row.currentRank}</span>
      <span class="team-cell">${renderTeamIdentity(team, row.teamId)}</span>
      <span>${row.group}</span>
      ${mode === "group-delta" ? renderGroupDeltaCells(row) : renderOverallPerformanceCells(row, mode)}
    </div>
  `;
}

function performanceModeNote(mode: PerformanceMode) {
  if (mode === "raw") return "Total table rank compared with expected seed among the 48 teams, derived from FIFA ranking.";
  if (mode === "group-delta") return "Rows are sorted by group-position movement. Now is current group place; Seeded is expected group place from FIFA ranking; Move is Seeded minus Now, so +2 means two places ahead.";
  return "Average table: ranks by points per match, then goal difference per match, goals per match, fair play per match, and FIFA rank. Move compares that average rank with expected seed among the 48 teams.";
}

function renderOverallPerformanceCells(row: PerformanceRow, mode: PerformanceMode) {
  return `
    <span>${row.won}-${row.drawn}-${row.lost}</span>
    <span>${performancePointsValue(row, mode)}</span>
    <span>${performanceGoalDifferenceValue(row, mode)}</span>
    <span>${row.expectedOverallRank ?? "-"}</span>
    <span>${row.fifaRanking ?? "-"}</span>
    <span class="performance-delta">${formatPerformanceDelta(row.performanceDelta)}</span>
    <span><span class="performance-status">${performanceStatusLabel(row)}</span></span>
  `;
}

function renderGroupDeltaCells(row: PerformanceRow) {
  return `
    <span>${ordinal(row.rank)}</span>
    <span>${row.expectedGroupRank ? ordinal(row.expectedGroupRank) : "-"}</span>
    <span>${row.won}-${row.drawn}-${row.lost}</span>
    <span>${row.points}</span>
    <span>${formatSignedNumber(row.goalDifference)}</span>
    <span>${row.fifaRanking ?? "-"}</span>
    <span class="performance-delta">${formatPerformanceDelta(row.performanceDelta)}</span>
    <span><span class="performance-status">${performanceStatusLabel(row)}</span></span>
  `;
}

function renderFixturePerformanceSummaryTable(rows: FixturePerformanceSummary[]) {
  if (rows.length === 0) return `<p class="empty-state">No ranked fixture credits are available yet.</p>`;

  return `
    <div class="fixture-summary-table" aria-label="Fixture credit summary by team">
      <div class="fixture-summary-row header">
        ${renderHeaderTooltip("#", "Position in this fixture-credit table.")}
        ${renderHeaderTooltip("Team", "Team being summarized.")}
        ${renderHeaderTooltip("Group", "World Cup group.")}
        ${renderHeaderTooltip("Rank", "Team FIFA ranking. Lower numbers are stronger.")}
        ${renderHeaderTooltip("Played", "Final results and complete predictions included in this summary.")}
        ${renderHeaderTooltip("Record", "Wins-draws-losses across included fixture rows.")}
        ${renderHeaderTooltip("GD", "Goal difference across included fixture rows.")}
        ${renderHeaderTooltip("GF", "Goals scored across included fixture rows.")}
        ${renderHeaderTooltip("Actual", "Total actual result value: win 1, draw 0.5, loss 0.")}
        ${renderHeaderTooltip("Expected", "Total Elo-style expected result from FIFA-rank seed ratings.")}
        ${renderHeaderTooltip("Success", "Total success score: (Actual result - Expected result) x 3.")}
        ${renderHeaderTooltip("Final", "Number of authoritative final results included.")}
        ${renderHeaderTooltip("Pred", "Number of complete user predictions included.")}
      </div>
      ${rows.map((row, index) => renderFixturePerformanceSummaryRow(row, index)).join("")}
    </div>
  `;
}

function renderFixturePerformanceSummaryRow(row: FixturePerformanceSummary, index: number) {
  const team = teamById.get(row.teamId);

  return `
    <div class="fixture-summary-row">
      <span>${index + 1}</span>
      <span class="team-cell">${renderTeamIdentity(team, row.teamId)}</span>
      <span>${row.group}</span>
      <span>${row.fifaRanking}</span>
      <span>${row.fixtures}</span>
      <span>${row.won}-${row.drawn}-${row.lost}</span>
      <span>${formatSignedNumber(row.goalDifference)}</span>
      <span>${row.goalsFor}</span>
      <span>${formatDecimal(row.actualResultTotal)}</span>
      <span>${formatDecimal(row.expectedResultTotal)}</span>
      <span class="fixture-performance-score">${formatSignedDecimal(row.totalSuccessScore)}</span>
      <span>${row.finalCount}</span>
      <span>${row.predictionCount}</span>
    </div>
  `;
}

function renderFixturePerformanceTable(rows: FixturePerformanceEntry[]) {
  if (rows.length === 0) return `<p class="empty-state">No completed or predicted ranked group fixtures are available yet.</p>`;

  return `
    <div class="fixture-performance-table">
      <div class="fixture-performance-row header">
        ${renderHeaderTooltip("#", "Position in the fixture-result credit list.")}
        ${renderHeaderTooltip("Team", "Team whose side of the fixture is being scored.")}
        ${renderHeaderTooltip("Opponent", "The team faced in this fixture.")}
        ${renderHeaderTooltip("Fixture", "Fixture identifier from the tournament data.")}
        ${renderHeaderTooltip("Score", "Score from this team's perspective, plus W/D/L result.")}
        ${renderHeaderTooltip("Rank", "Team FIFA ranking. Lower numbers are stronger.")}
        ${renderHeaderTooltip("Opp", "Opponent FIFA ranking. Lower numbers are stronger.")}
        ${renderHeaderTooltip("Seed", "Team seed rating: 2200 - ((FIFA rank - 1) x 6).")}
        ${renderHeaderTooltip("Opp seed", "Opponent seed rating from the same FIFA-rank conversion.")}
        ${renderHeaderTooltip("Expected", "Elo-style expected result for this team before the match.")}
        ${renderHeaderTooltip("Actual", "Actual result value: win 1, draw 0.5, loss 0.")}
        ${renderHeaderTooltip("Success", "Success score: (Actual result - Expected result) x 3.")}
        ${renderHeaderTooltip("Source", "Whether the score is an authoritative final result or active prediction.")}
      </div>
      ${rows.map((row, index) => renderFixturePerformanceRow(row, index)).join("")}
    </div>
  `;
}

function renderHeaderTooltip(label: string, tooltip: string) {
  return `<span class="table-header-help" data-tooltip="${tooltip}" aria-label="${label}: ${tooltip}" tabindex="0">${label}<span aria-hidden="true">?</span></span>`;
}

function showTooltip(anchor: HTMLElement) {
  hideTooltip();

  const tooltip = anchor.dataset.tooltip;
  if (!tooltip) return;

  activeTooltip = document.createElement("div");
  activeTooltip.className = "floating-tooltip";
  activeTooltip.textContent = tooltip;
  document.body.append(activeTooltip);

  positionFloatingTooltip(anchor);
}

function showTeamTooltip(anchor: HTMLElement) {
  hideTooltip();

  const teamId = anchor.dataset.teamId;
  const team = teamId ? teamById.get(teamId) : undefined;
  if (!team) return;

  const results = recentResultsForTeam(tournamentData, team.id);
  activeTooltip = document.createElement("div");
  activeTooltip.className = "floating-tooltip team-details-tooltip";
  activeTooltip.innerHTML = `
    <div class="team-details-heading">
      ${renderFlag(team)}
      <strong>${escapeHtml(team.name)}</strong>
    </div>
    <div class="team-details-ranking">
      <span>FIFA ranking</span>
      <strong>${team.fifaRanking ?? "Unavailable"}</strong>
    </div>
    <div class="team-details-results">
      <span class="team-details-label">Previous results</span>
      ${results.length > 0 ? results.map(renderTeamRecentResult).join("") : `<span class="team-details-empty">No completed results yet</span>`}
    </div>
  `;
  document.body.append(activeTooltip);

  positionFloatingTooltip(anchor);
}

function positionFloatingTooltip(anchor: HTMLElement) {
  if (!activeTooltip) return;

  const anchorRect = anchor.getBoundingClientRect();
  const tooltipRect = activeTooltip.getBoundingClientRect();
  const left = Math.min(
    window.innerWidth - tooltipRect.width - 12,
    Math.max(12, anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2)
  );
  const top = anchorRect.bottom + 8;

  activeTooltip.style.left = `${left}px`;
  activeTooltip.style.top = `${top}px`;
}

function renderTeamRecentResult(result: TeamRecentResult) {
  const opponent = teamById.get(result.opponentId);
  return `
    <div class="team-result-row">
      <span class="team-result-outcome ${result.outcome}">${teamResultLabel(result.outcome)}</span>
      <span class="team-result-opponent">${renderFlag(opponent)} ${escapeHtml(opponent?.name ?? result.opponentId)}</span>
      <span class="team-result-score">${result.goalsFor}-${result.goalsAgainst}</span>
      <span class="team-result-date">${formatCompactDate(result.date)}</span>
    </div>
  `;
}

function hideTooltip() {
  activeTooltip?.remove();
  activeTooltip = undefined;
}

function renderFixturePerformanceRow(row: FixturePerformanceEntry, index: number) {
  const team = teamById.get(row.teamId);
  const opponent = teamById.get(row.opponentId);

  return `
    <div class="fixture-performance-row ${row.source}">
      <span>${index + 1}</span>
      <span class="team-cell">${renderTeamIdentity(team, row.teamId)}</span>
      <span class="team-cell">${renderTeamIdentity(opponent, row.opponentId)}</span>
      <span>${row.fixtureId}</span>
      <span>${row.goalsFor}-${row.goalsAgainst} ${fixtureResultLabel(row)}</span>
      <span>${row.fifaRanking}</span>
      <span>${row.opponentFifaRanking}</span>
      <span>${row.teamSeedRating}</span>
      <span>${row.opponentSeedRating}</span>
      <span>${formatDecimal(row.expectedResult)}</span>
      <span>${formatDecimal(row.actualResult)}</span>
      <span class="fixture-performance-score">${formatSignedDecimal(row.successScore)}</span>
      <span><span class="fixture-performance-source">${row.source === "final" ? "Final" : "Predicted"}</span></span>
    </div>
  `;
}

function renderFixturePerformanceFormula() {
  return `
    <details class="fixture-performance-formula">
      <summary>
        <span>How Fixture Success Works</span>
        <span>Formula</span>
      </summary>
      <div class="formula-grid">
        <span><strong>Seed rating</strong>: 2200 - ((FIFA rank - 1) x 6). Lower FIFA rank means a higher seed rating.</span>
        <span><strong>Expected result</strong>: 1 / (1 + 10 ^ ((opponent seed - team seed) / 400)).</span>
        <span><strong>Actual result</strong>: win = 1, draw = 0.5, loss = 0.</span>
        <span><strong>Success</strong> = (actual result - expected result) x 3. Positive means better than expected.</span>
        <span><strong>Close wins</strong>: beating a nearby strong team scores higher than a routine win over a much weaker team.</span>
        <span><strong>Table</strong>: totals add success across played final results and complete predictions.</span>
      </div>
    </details>
  `;
}

function renderStatLeaderboards(leaderboards: StatLeaderboard[]) {
  if (leaderboards.length === 0) return `<p class="empty-state">No player stat leaderboards are available yet.</p>`;

  return `
    <div class="leaderboard-grid">
      ${leaderboards.map(renderStatLeaderboard).join("")}
    </div>
  `;
}

function renderStatLeaderboard(leaderboard: StatLeaderboard) {
  return `
    <article class="leaderboard-card">
      <div class="leaderboard-card-heading">
        <h4>${leaderboard.label}</h4>
        <span>${leaderboard.valueLabel}</span>
      </div>
      ${leaderboard.entries.length > 0 ? `
        <div class="leaderboard-list">
          ${leaderboard.entries.map((entry) => {
            const team = entry.teamId ? teamById.get(entry.teamId) : undefined;
            return `
              <div class="leaderboard-row">
                <span>${entry.rank}</span>
                <span class="leaderboard-player">${entry.player}<em>${team?.name ?? entry.detail ?? ""}</em></span>
                <span class="team-cell">${team ? renderTeamIdentity(team, team.id) : renderFlag()}</span>
                <strong>${entry.value}</strong>
              </div>
            `;
          }).join("")}
        </div>
      ` : `<p class="empty-state">No verified ${leaderboard.label.toLowerCase()} entries have been normalized yet.</p>`}
      <a class="stats-source-link" href="${leaderboard.source.url}" target="_blank" rel="noreferrer">${leaderboard.source.name}</a>
    </article>
  `;
}

function renderThirdPlaceTable() {
  const standings = calculateGroupStandings(tournamentData, predictions);
  const rows = thirdPlaceRankings(standings, tournamentData);

  return `
    <div class="third-place-table">
      <div class="third-place-row header">
        <span>#</span>
        <span>Group</span>
        <span>Team</span>
        <span>P</span>
        <span>GD</span>
        <span>GF</span>
        <span>Pts</span>
        <span>FP</span>
        <span>Status</span>
      </div>
      ${rows.map(renderThirdPlaceRow).join("")}
    </div>
  `;
}

function renderThirdPlaceRow(row: ThirdPlaceStandingRow) {
  const team = teamById.get(row.teamId);
  const change = thirdPlaceRowChange(recentPredictionChange, row);
  return `
    <div class="third-place-row ${row.qualifies ? "qualifies" : ""} ${change ? "recent-change" : ""}">
      <span>${row.thirdPlaceRank}</span>
      <span>${row.group}</span>
      <span class="team-cell">${renderTeamIdentity(team, row.teamId)}${renderChangeBadge(change)}</span>
      <span>${row.played}</span>
      <span>${row.goalDifference}</span>
      <span>${row.goalsFor}</span>
      <span>${row.points}</span>
      <span>${row.fairPlayPoints ?? "-"}</span>
      <span>${row.qualifies ? "Qualifies" : "Outside"}</span>
    </div>
  `;
}

function renderFixtures() {
  const visibleFixtures = tournamentData.fixtures.filter((fixture) => fixture.stage === "group" || fixture.stage === "round-of-32");
  const { actionable, completed } = sectionFixturesForDisplay(visibleFixtures);

  return `
    ${renderCompletedFixtureSection(completed)}
    ${renderFixtureDateGroups(actionable)}
  `;
}

function renderCompletedFixtureSection(fixtureGroups: ReturnType<typeof sectionFixturesForDisplay>["completed"]) {
  const completedCount = fixtureGroups.reduce((total, group) => total + group.fixtures.length, 0);
  if (completedCount === 0) return "";

  return `
    <details class="completed-fixtures">
      <summary>
        <span>Completed Fixtures</span>
        <span>${completedCount} ${completedCount === 1 ? "match" : "matches"}</span>
      </summary>
      <div class="completed-fixture-list">
        ${renderFixtureDateGroups(fixtureGroups)}
      </div>
    </details>
  `;
}

function renderFixtureDateGroups(fixtureGroups: ReturnType<typeof sectionFixturesForDisplay>["actionable"]) {
  return fixtureGroups
    .map((group) => `
      <section class="fixture-date-group" aria-labelledby="fixture-date-${group.key}">
        <div class="fixture-date-header">
          <h3 id="fixture-date-${group.key}">${group.label}</h3>
          <span>${group.fixtures.length} ${group.fixtures.length === 1 ? "match" : "matches"}</span>
        </div>
        <div class="fixture-date-list">
          ${group.fixtures.map(renderFixture).join("")}
        </div>
      </section>
    `)
    .join("");
}

function renderFixture(fixture: Fixture) {
  const venue = venueById.get(fixture.venueId);
  const score = fixture.result ?? predictions[fixture.id];

  return `
    <article class="fixture">
      <div>
        <div class="team-stack">
          ${renderFixtureTeam(fixture.home, score?.home)}
          ${renderFixtureTeam(fixture.away, score?.away)}
        </div>
        <div class="fixture-meta">
          <span>${fixtureStageLabel(fixture)}</span>
          <span>${formatFixtureKickoff(fixture)}</span>
          <span>${venue ? `${venue.name}, ${venue.city}, ${venue.country}` : "Venue TBD"}</span>
          ${score ? renderScoreDecision(score) : ""}
        </div>
      </div>
      ${renderFixtureControls(fixture)}
    </article>
  `;
}

function fixtureStageLabel(fixture: Fixture) {
  return fixture.stage === "group" && fixture.group ? `Group ${fixture.group}` : fixture.stage.replaceAll("-", " ");
}

function renderFixtureTeam(teamRef: TeamRef, score?: number) {
  const team = typeof teamRef === "string" ? teamById.get(teamRef) : undefined;
  const label = team ? team.name : typeof teamRef === "string" ? teamRef : teamRef.label;
  return `
    <div class="team-line">
      ${renderTeamIdentity(team, label)}
      <span class="score">${score ?? "-"}</span>
    </div>
  `;
}

function renderFixtureControls(fixture: Fixture) {
  if (!isEditableFixture(fixture)) return `<div class="fixed-result">Final</div>`;

  const score = predictions[fixture.id];
  const isKnockout = fixture.stage !== "group";
  return `
    <div class="prediction-controls ${isKnockout ? "knockout-prediction-controls" : ""}">
      <input data-prediction="${fixture.id}" data-side="home" min="0" max="99" type="number" inputmode="numeric" value="${score?.home ?? ""}" aria-label="Home score prediction" />
      <input data-prediction="${fixture.id}" data-side="away" min="0" max="99" type="number" inputmode="numeric" value="${score?.away ?? ""}" aria-label="Away score prediction" />
      ${isKnockout ? renderKnockoutDecisionControls(fixture, score) : ""}
    </div>
  `;
}

function renderKnockoutDecisionControls(fixture: Fixture, score?: Score) {
  if (score?.home === undefined || score.away === undefined || score.home !== score.away) return "";

  return `
    <select data-prediction="${fixture.id}" data-side="decision" aria-label="Knockout decision method">
      <option value="aet" ${score?.decision === "aet" ? "selected" : ""}>AET</option>
      <option value="penalties" ${score?.decision === "penalties" ? "selected" : ""}>Pens</option>
    </select>
    ${score?.decision === "penalties" ? `
      <select data-prediction="${fixture.id}" data-side="winner" aria-label="Penalty winner">
        <option value="" ${!score?.winner ? "selected" : ""}>Penalty winner</option>
        <option value="home" ${score?.winner === "home" ? "selected" : ""}>Home advances</option>
        <option value="away" ${score?.winner === "away" ? "selected" : ""}>Away advances</option>
      </select>
    ` : ""}
  `;
}

function renderStandings() {
  const standings = calculateGroupStandings(tournamentData, predictions);
  return Object.entries(standings)
    .map(([group, rows]) => `
      <article class="standing">
        <h3>Group ${group}</h3>
        <div class="standing-row header"><span>#</span><span>Team</span><span>P</span><span>W</span><span>D</span><span>L</span><span>GD</span><span>Pts</span></div>
        ${rows.map((row) => {
          const team = teamById.get(row.teamId);
          const change = standingRowChange(recentPredictionChange, row);
          const goalDifferenceChange = standingValueChange(recentPredictionChange, row, "goalDifference");
          const pointsChange = standingValueChange(recentPredictionChange, row, "points");
          return `
            <div class="standing-row ${change ? "recent-change" : ""}">
              <span>${row.rank}</span>
              <span class="team-cell">${renderTeamIdentity(team, row.teamId)}${renderChangeBadge(change)}</span>
              <span>${row.played}</span>
              <span>${row.won}</span>
              <span>${row.drawn}</span>
              <span>${row.lost}</span>
              <span class="standing-value">${row.goalDifference}${renderChangeBadge(goalDifferenceChange)}</span>
              <span class="standing-value">${row.points}${renderChangeBadge(pointsChange)}</span>
            </div>
          `;
        }).join("")}
      </article>
    `)
    .join("");
}

function renderKnockout(projection: ProjectedMatch[]) {
  return projection
    .filter((match) => match.stage === "round-of-32" || match.stage === "round-of-16" || match.stage === "quarter-final" || match.stage === "semi-final" || match.stage === "final")
    .map((match) => {
      const homeChange = participantChange(recentPredictionChange, match, "home");
      const awayChange = participantChange(recentPredictionChange, match, "away");
      const winningChange = winnerChange(recentPredictionChange, match);
      return `
        <article class="knockout-match ${matchChanged(recentPredictionChange, match) ? "recent-change" : ""}">
          <div class="knockout-round">${formatStage(match.stage)} · ${match.fixtureId}</div>
          <div class="knockout-row">${renderBracketParticipant(match.home, match.homeSource, homeChange?.changed, previousItemTooltip("participant", homeChange?.previous))} vs ${renderBracketParticipant(match.away, match.awaySource, awayChange?.changed, previousItemTooltip("participant", awayChange?.previous))}</div>
          ${match.winner ? `<div class="winner ${winningChange ? "recent-change-text" : ""}">Advances: ${renderQualifiedTeam(match.winner)}${renderChangeBadge(winningChange ? true : undefined, previousItemTooltip("winner", winningChange?.previous))}</div>` : ""}
        </article>
      `;
    })
    .join("");
}

function renderBracketView(projection: ProjectedMatch[]) {
  return `
    <div class="bracket-page">
      <section>
        <h2>Knockout Stages</h2>
        <p class="section-note">If we started today: projected from the current tables, real results, and your active predictions.</p>
        ${renderBracketPanel(projection)}
        ${renderKnockoutQualificationPanel()}
        ${renderBracketFixtureTable(projection)}
      </section>
    </div>
  `;
}

function renderKnockoutQualificationPanel() {
  return `
    <section class="stats-panel knockout-qualification-panel" aria-labelledby="knockout-qualification-heading">
      <div class="stats-panel-heading">
        <div>
          <h3 id="knockout-qualification-heading">Knockout Qualification</h3>
          <p>Best third-place teams calculated from real results and your predictions.</p>
        </div>
        <span>Top 8 qualify</span>
      </div>
      ${renderThirdPlaceTable()}
    </section>
  `;
}

function renderBracketPanel(projection: ProjectedMatch[]) {
  const layout = buildBracketLayout(projection);
  return `
    <section class="bracket-panel" aria-label="Interactive projected bracket">
      <div class="bracket-panel-header">
        <div>
          <h3>Draw Bracket</h3>
          <p>Projected from real results and your active predictions.</p>
        </div>
      </div>
      <div class="bracket-scroll" tabindex="0" aria-label="Scrollable bracket diagram">
        <svg class="bracket-diagram" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="World Cup knockout bracket diagram">
          ${renderBracketRoundLabels(layout)}
          <g class="bracket-connectors" aria-hidden="true">
            ${layout.connectors.map((connector) => `<path d="${connector.path}" />`).join("")}
          </g>
          <g class="bracket-nodes">
            ${layout.nodes.map(renderBracketNode).join("")}
          </g>
        </svg>
      </div>
    </section>
  `;
}

function renderBracketRoundLabels(layout: BracketLayout) {
  const labels = [
    { x: 24, text: "Round of 32" },
    { x: 292, text: "Round of 16" },
    { x: 560, text: "Quarter-finals" },
    { x: 794, text: "Semi-final" },
    { x: 1062, text: "Final" },
    { x: 1330, text: "Semi-final" },
    { x: 1600, text: "Quarter-finals" },
    { x: 1868, text: "Round of 16" },
    { x: 2136, text: "Round of 32" }
  ];

  return `
    <g class="bracket-round-labels">
      ${labels.map((label) => `<text x="${label.x + 107}" y="48" text-anchor="middle">${label.text}</text>`).join("")}
    </g>
  `;
}

function renderBracketNode(node: BracketNode) {
  return `
    <foreignObject x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="diagram-node ${node.side} ${matchChanged(recentPredictionChange, node.match) ? "recent-change" : ""}">
        ${renderBracketNodeContent(node.match)}
      </div>
    </foreignObject>
  `;
}

function renderBracketNodeContent(match: ProjectedMatch) {
  const venue = venueById.get(match.venueId);
  return `
    <div class="diagram-node-meta">
      <span>${match.fixtureId}</span>
      <span>${formatStage(match.stage)}</span>
    </div>
    <div class="diagram-node-teams">
      ${renderDiagramTeam(match.home, match.homeSource, match.winner?.teamId, participantChange(recentPredictionChange, match, "home"))}
      ${renderDiagramTeam(match.away, match.awaySource, match.winner?.teamId, participantChange(recentPredictionChange, match, "away"))}
    </div>
    <div class="diagram-node-detail" title="${formatFixtureKickoff(match)} · ${venue ? `${venue.city}` : "Venue TBD"}">${formatBracketDiagramKickoff(match)} · ${venue ? venue.city : "Venue TBD"}</div>
  `;
}

function renderDiagramTeam(team: QualifiedTeam, source: string, winnerTeamId?: string, change?: { changed: boolean; previous: string }) {
  const resolved = team.teamId ? teamById.get(team.teamId) : undefined;
  const isWinner = Boolean(winnerTeamId && resolved?.id === winnerTeamId);
  return `
    <div class="diagram-team ${resolved ? "resolved" : "unresolved"} ${isWinner ? "winner-team" : ""} ${change ? "recent-change" : ""}">
      ${renderTeamIdentity(resolved, source)}
      <em ${change ? tooltipAttributes(previousItemTooltip("participant", change.previous)) : ""}>${change ? "Changed" : source}</em>
    </div>
  `;
}

function renderBracketFixtureTable(projection: ProjectedMatch[]) {
  const matches = projection
    .filter((match) => bracketRounds.includes(match.stage))
    .sort((left, right) => left.matchNumber - right.matchNumber);

  return `
    <section class="bracket-fixture-panel" aria-labelledby="bracket-fixture-heading">
      <div class="bracket-fixture-heading">
        <h3 id="bracket-fixture-heading">Bracket Fixtures</h3>
        <span>${matches.length} matches</span>
      </div>
      <div class="bracket-fixture-table">
        <div class="bracket-fixture-row header">
          <span>Match</span>
          <span>Fixture</span>
          <span>Teams</span>
          <span>Kickoff</span>
          <span>Venue</span>
          <span>Prediction</span>
        </div>
        ${matches.map(renderBracketFixtureRow).join("")}
      </div>
    </section>
  `;
}

function renderBracketFixtureRow(match: ProjectedMatch) {
  const fixture = fixtureById.get(match.fixtureId);
  const venue = venueById.get(match.venueId);
  const score = fixture ? fixture.result ?? predictions[fixture.id] : undefined;
  const change = matchChange(recentPredictionChange, match);

  return `
    <div class="bracket-fixture-row ${change ? "recent-change" : ""}">
      <span class="bracket-fixture-match">${match.fixtureId}${renderChangeBadge(change ? true : undefined, previousMatchTooltip(change))}</span>
      <span>${formatStage(match.stage)}</span>
      <span class="bracket-fixture-teams">
        <span>${renderBracketTableTeam(match.home, match.homeSource)} <strong>${score?.home ?? "-"}</strong></span>
        <span>${renderBracketTableTeam(match.away, match.awaySource)} <strong>${score?.away ?? "-"}</strong></span>
        ${score ? renderScoreDecision(score) : ""}
      </span>
      <span class="bracket-fixture-kickoff" title="${formatFixtureKickoff(match)}">${formatFixtureKickoff(match)}</span>
      <span class="bracket-fixture-venue" title="${venue ? `${venue.name}, ${venue.city}` : "Venue TBD"}">${venue ? `${venue.name}, ${venue.city}` : "Venue TBD"}</span>
      <span>${fixture ? renderFixtureControls(fixture) : ""}</span>
    </div>
  `;
}

function renderBracketTableTeam(team: QualifiedTeam, source: string) {
  const resolved = team.teamId ? teamById.get(team.teamId) : undefined;
  return `<span class="bracket-table-team">${renderTeamIdentity(resolved, source)}</span>`;
}

function renderDrawSides(projection: ProjectedMatch[]) {
  return `
    <section class="draw-side-board" aria-label="Projected bracket sides">
      <div class="draw-side-heading">
        <div>
          <h3>Draw Sides</h3>
          <p>Round-of-32 paths split into the two halves of the bracket.</p>
        </div>
      </div>
      <div class="draw-side-grid">
        ${drawSidesForProjection(projection).map(renderDrawSide).join("")}
      </div>
    </section>
  `;
}

function renderDrawSide(side: ReturnType<typeof drawSidesForProjection>[number]) {
  return `
    <section class="draw-side ${side.id}" aria-label="${side.label}">
      <div class="draw-side-title">
        <h4>${side.label}</h4>
        <span>${side.matches.length} matches</span>
      </div>
      <div class="draw-match-list">
        ${side.matches.map(renderDrawMatch).join("")}
      </div>
    </section>
  `;
}

function renderDrawMatch(match: ProjectedMatch) {
  const venue = venueById.get(match.venueId);
  return `
    <article class="draw-match">
      <div class="draw-match-main">
        <div class="draw-match-code">${match.fixtureId}</div>
        <div class="draw-participants">
          ${renderDrawParticipant(match.home, match.homeSource)}
          ${renderDrawParticipant(match.away, match.awaySource)}
        </div>
      </div>
      <div class="draw-match-meta">
        <span>${formatFixtureKickoff(match)}</span>
        <span>${venue ? `${venue.name}, ${venue.city}, ${venue.country}` : "Venue TBD"}</span>
      </div>
    </article>
  `;
}

function renderDrawParticipant(team: QualifiedTeam, source = team.slot) {
  const resolved = team.teamId ? teamById.get(team.teamId) : undefined;
  return `
    <div class="draw-team ${resolved ? "resolved" : "unresolved"}">
      <span class="draw-team-identity">
        ${renderTeamIdentity(resolved, source)}
      </span>
      <span class="slot-label">${source}</span>
    </div>
  `;
}

function renderBracketRound(round: MatchStage, matches: ProjectedMatch[]) {
  return `
    <section class="bracket-round-card">
      <h3>${formatStage(round)}</h3>
      <div class="bracket-match-list">
        ${matches.map(renderBracketMatch).join("")}
      </div>
    </section>
  `;
}

function renderBracketMatch(match: ProjectedMatch) {
  const venue = venueById.get(match.venueId);
  return `
    <article class="bracket-match">
      <div class="knockout-round">${match.fixtureId} · ${formatFixtureKickoff(match)}</div>
      <div class="bracket-participants">
        ${renderBracketParticipant(match.home, match.homeSource)}
        ${renderBracketParticipant(match.away, match.awaySource)}
      </div>
      <div class="fixture-meta">${venue ? `${venue.name}, ${venue.city}, ${venue.country}` : "Venue TBD"}</div>
      ${match.winner ? `<div class="winner">Projected winner: ${renderQualifiedTeam(match.winner)}</div>` : ""}
    </article>
  `;
}

function renderBracketParticipant(team: QualifiedTeam, source = team.slot, changed = false, tooltip?: string) {
  const resolved = team.teamId ? teamById.get(team.teamId) : undefined;
  const label = renderTeamIdentity(resolved, source);
  const sourceLabel = resolved ? `<span class="slot-label">${source}</span>` : "";
  return `<span class="bracket-team ${resolved ? "resolved" : "unresolved"} ${changed ? "recent-change" : ""}">${label}${sourceLabel}${renderChangeBadge(changed ? true : undefined, tooltip)}</span>`;
}

function renderQualifiedTeam(team: QualifiedTeam) {
  const resolved = team.teamId ? teamById.get(team.teamId) : undefined;
  return renderTeamIdentity(resolved, team.label);
}

function formatPerformanceDelta(delta: number | undefined) {
  if (delta === undefined) return "-";
  return formatSignedNumber(delta);
}

function performancePointsValue(row: PerformanceRow, mode: PerformanceMode) {
  if (mode !== "per-match") return String(row.points);
  return formatRate(row.points, row.played);
}

function performanceGoalDifferenceValue(row: PerformanceRow, mode: PerformanceMode) {
  if (mode !== "per-match") return formatSignedNumber(row.goalDifference);
  const value = row.played > 0 ? row.goalDifference / row.played : 0;
  return value > 0 ? `+${formatDecimal(value)}` : formatDecimal(value);
}

function formatRate(value: number, played: number) {
  return formatDecimal(played > 0 ? value / played : 0);
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function formatSignedDecimal(value: number) {
  const formatted = formatDecimal(value);
  return value > 0 ? `+${formatted}` : formatted;
}

function performanceStatusLabel(row: PerformanceRow) {
  if (row.performanceStatus === "overperforming") return "Over";
  if (row.performanceStatus === "underperforming") return "Under";
  if (row.performanceStatus === "on-track") return "On rank";
  return "Unknown";
}

function scenarioStatusLabel(status: TeamScenarioAnalysis["current"]["status"]) {
  if (status === "direct") return "Direct";
  if (status === "third-place") return "Third place";
  return "Eliminated";
}

function fixtureResultLabel(row: FixturePerformanceEntry) {
  if (row.result === "win") return "W";
  if (row.result === "draw") return "D";
  return "L";
}

function renderTeamIdentity(team: Team | undefined, fallback: string) {
  if (!team) return `${renderFlag()} <span>${escapeHtml(fallback)}</span>`;

  return `
    <span class="team-hover-target" data-team-id="${escapeAttribute(team.id)}" tabindex="0">
      ${renderFlag(team)}
      <span class="team-hover-name">${escapeHtml(team.name)}</span>
    </span>
  `;
}

function renderFlag(team?: Team) {
  if (!team) return `<span class="flag placeholder" aria-hidden="true">◇</span>`;

  const code = flagImageCodes[team.id];
  if (!code) return `<span class="flag" role="img" aria-label="${team.name} flag">${team.flag}</span>`;

  return `<img class="flag flag-img" src="https://flagcdn.com/w40/${code}.png" srcset="https://flagcdn.com/w80/${code}.png 2x" alt="${team.name} flag" loading="lazy" />`;
}

const flagImageCodes: Record<string, string> = {
  algeria: "dz",
  argentina: "ar",
  australia: "au",
  austria: "at",
  belgium: "be",
  bosnia: "ba",
  brazil: "br",
  canada: "ca",
  "cape-verde": "cv",
  colombia: "co",
  "cote-divoire": "ci",
  croatia: "hr",
  curacao: "cw",
  czechia: "cz",
  "dr-congo": "cd",
  ecuador: "ec",
  egypt: "eg",
  england: "gb-eng",
  france: "fr",
  germany: "de",
  ghana: "gh",
  haiti: "ht",
  iran: "ir",
  iraq: "iq",
  japan: "jp",
  jordan: "jo",
  mexico: "mx",
  morocco: "ma",
  netherlands: "nl",
  "new-zealand": "nz",
  norway: "no",
  panama: "pa",
  paraguay: "py",
  portugal: "pt",
  qatar: "qa",
  "saudi-arabia": "sa",
  scotland: "gb-sct",
  senegal: "sn",
  "south-africa": "za",
  "south-korea": "kr",
  spain: "es",
  sweden: "se",
  switzerland: "ch",
  tunisia: "tn",
  turkiye: "tr",
  "united-states": "us",
  uruguay: "uy",
  uzbekistan: "uz"
};

function formatStage(stage: MatchStage) {
  return stage.replaceAll("-", " ");
}

function handlePredictionInput(event: Event) {
  const input = event.currentTarget as HTMLInputElement | HTMLSelectElement;
  const fixtureId = input.dataset.prediction;
  if (!fixtureId) return;

  const fixture = tournamentData.fixtures.find((candidate) => candidate.id === fixtureId);
  if (!fixture || !isEditableFixture(fixture)) return;

  const controls = Array.from(appRoot.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[data-prediction="${fixtureId}"]`));
  const home = controls.find((control) => control.dataset.side === "home")?.value;
  const away = controls.find((control) => control.dataset.side === "away")?.value;
  const homeScore = home === undefined || home === "" ? undefined : Number(home);
  const awayScore = away === undefined || away === "" ? undefined : Number(away);
  const tiedScore = Number.isInteger(homeScore) && Number.isInteger(awayScore) && homeScore === awayScore;
  const method = tiedScore ? controls.find((control) => control.dataset.side === "decision")?.value : "regular";
  const winner = method === "penalties" ? controls.find((control) => control.dataset.side === "winner")?.value : "";
  const decision = interpretPredictionInput(home, away, Boolean(predictions[fixtureId]), method, winner, fixture.stage !== "group");

  if (decision.kind === "partial") return;

  if (decision.kind === "cleared") {
    predictions = setPrediction(tournamentData, predictions, fixtureId);
    recentPredictionChange = undefined;
  } else {
    recentPredictionChange ??= capturePredictionChangeSnapshot(tournamentData, predictions);
    predictions = setPrediction(tournamentData, predictions, fixtureId, decision.score);
  }

  scenarioAnswer = "";
  scenarioAnswerContext = undefined;
  scenarioQuestionError = "";
  savePredictions(predictions);
  renderPreservingPredictionInput(input);
}

async function handleSharePredictions() {
  const url = buildPredictionShareUrl(tournamentData, window.location.href, predictions);
  const status = appRoot.querySelector<HTMLElement>("[data-share-status]");

  try {
    await navigator.clipboard.writeText(url);
    if (status) status.textContent = Object.keys(predictions).length === 0 ? "Copied empty model link" : "Copied link";
  } catch {
    window.prompt("Copy prediction link", url);
    if (status) status.textContent = "Link ready";
  }
}

async function handleScenarioQuestion(event: Event) {
  event.preventDefault();

  const question = scenarioQuestion.trim();
  scenarioAnswer = "";
  scenarioAnswerContext = undefined;
  scenarioQuestionError = "";

  if (!question) {
    scenarioQuestionError = "Ask a scenario question first.";
    render();
    return;
  }

  try {
    const selectedTeam = teamById.get(selectedScenarioTeamId);
    const context = buildScenarioQuestionContext(tournamentData, predictions, selectedScenarioTeamId);
    scenarioAnswerContext = context;
    scenarioQuestionLoading = true;
    render();

    const response = await fetch("/api/scenario-question", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question,
        team: selectedTeam?.name ?? selectedScenarioTeamId,
        context
      })
    });
    const payload = await parseScenarioQuestionResponse(response);

    if (!response.ok) {
      throw new Error(payload.error ?? "Scenario questions are unavailable right now.");
    }

    scenarioAnswer = payload.answer ?? "";
    scenarioQuestionError = scenarioAnswer ? "" : "The model did not return an answer.";
  } catch (error) {
    scenarioQuestionError = error instanceof Error ? error.message : "Scenario questions are unavailable right now.";
  } finally {
    scenarioQuestionLoading = false;
    render();
  }
}

async function parseScenarioQuestionResponse(response: Response): Promise<{ answer?: string; error?: string }> {
  try {
    return await response.json() as { answer?: string; error?: string };
  } catch {
    return {};
  }
}

function handleClearPredictions() {
  if (Object.keys(predictions).length === 0) return;

  predictions = {};
  recentPredictionChange = undefined;
  scenarioAnswer = "";
  scenarioAnswerContext = undefined;
  scenarioQuestionError = "";
  hideTooltip();
  savePredictions(predictions);
  render();

  const status = appRoot.querySelector<HTMLElement>("[data-share-status]");
  if (status) status.textContent = "Cleared predictions";
}

function renderPreservingPredictionInput(input: HTMLInputElement | HTMLSelectElement) {
  const fixtureId = input.dataset.prediction;
  const side = input.dataset.side;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  render();

  if (fixtureId && side) {
    const restoredInput = Array.from(appRoot.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-prediction]")).find(
      (candidate) => candidate.dataset.prediction === fixtureId && candidate.dataset.side === side
    );
    restoredInput?.focus({ preventScroll: true });
  }

  window.scrollTo(scrollX, scrollY);
}

function renderScoreDecision(score: Score) {
  if (score.decision === "penalties") return `<span class="score-decision">Pens</span>`;
  if (score.decision === "aet") return `<span class="score-decision">AET</span>`;
  return "";
}

function renderChangeBadge(change: RowChange | true | undefined, tooltip?: string) {
  if (!change) return "";

  const label = change === true ? "Changed" : changeLabel(change);
  const tooltipText = tooltip ?? (change === true ? "Changed by latest prediction" : change.previousSummary);
  return `<span class="change-badge" ${tooltipAttributes(tooltipText)} aria-label="${escapeAttribute(tooltipText)}">${label}</span>`;
}

function previousItemTooltip(_kind: "participant" | "winner", previous: string | undefined) {
  if (!previous) return undefined;
  return `Previous: ${formatPreviousChangeValue(previous)}`;
}

function previousMatchTooltip(change: MatchChange | undefined) {
  if (!change) return undefined;

  const matchup = `${formatPreviousChangeValue(change.previousHome)} vs ${formatPreviousChangeValue(change.previousAway)}`;
  const winner = change.previousWinner === "unresolved" ? "" : `; winner: ${formatPreviousChangeValue(change.previousWinner)}`;
  return `Previous: ${matchup}${winner}`;
}

function formatPreviousChangeValue(value: string) {
  return teamById.get(value)?.name ?? value;
}

function teamResultLabel(outcome: TeamRecentResult["outcome"]) {
  if (outcome === "win") return "W";
  if (outcome === "draw") return "D";
  return "L";
}

function formatCompactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function tooltipAttributes(tooltip: string | undefined) {
  if (!tooltip) return "";
  return `data-tooltip="${escapeAttribute(tooltip)}" tabindex="0"`;
}

function escapeHtml(value: string) {
  return escapeAttribute(value);
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatBracketDiagramKickoff(match: Pick<ProjectedMatch, "date">) {
  const date = new Date(match.date);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

render();
