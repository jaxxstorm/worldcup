import "./styles.css";
import { tournamentData, teamById, venueById } from "./data/tournament";
import { validateTournamentData } from "./data/schema";
import { buildBracketLayout, type BracketLayout, type BracketNode } from "./engine/bracket-layout";
import { formatFixtureKickoff, groupFixturesByDisplayDate, orderFixturesChronologically } from "./engine/fixtures";
import { drawSidesForProjection, projectTournament } from "./engine/knockout";
import { calculateFixturePerformanceEntries, calculateFixturePerformanceSummaries, calculatePerformanceRows, type FixturePerformanceEntry, type FixturePerformanceSummary, type PerformanceMode, type PerformanceRow } from "./engine/performance";
import { interpretPredictionInput, isEditableFixture, setPrediction } from "./engine/predictions";
import { calculateGroupStandings, thirdPlaceRankings } from "./engine/standings";
import { loadPredictions, savePredictions } from "./storage/session";
import type { Fixture, MatchStage, PredictionMap, ProjectedMatch, QualifiedTeam, Score, StatLeaderboard, Team, TeamRef, ThirdPlaceStandingRow } from "./types";

const validationIssues = validateTournamentData(tournamentData);
if (validationIssues.length > 0) {
  throw new Error(`Invalid tournament data: ${validationIssues.map((issue) => `${issue.path} ${issue.message}`).join(", ")}`);
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("App root missing");

const appRoot = app;
let predictions: PredictionMap = loadPredictions(tournamentData);
let activeView: "main" | "bracket" | "stats" | "performance" = "main";
let activePerformanceTab: "teams" | "fixtures" = "teams";
let activePerformanceMode: PerformanceMode = "raw";

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
        <a class="source-pill" href="${tournamentData.sources[0].url}" target="_blank" rel="noreferrer">Fixture source</a>
      </header>
      <nav class="view-tabs" aria-label="Views">
        <button class="${activeView === "main" ? "active" : ""}" type="button" data-view="main">Fixtures</button>
        <button class="${activeView === "bracket" ? "active" : ""}" type="button" data-view="bracket">Knockout Stages</button>
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

  appRoot.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-prediction]").forEach((input) => {
    input.addEventListener(input instanceof HTMLSelectElement ? "change" : "input", handlePredictionInput);
  });
}

function parseActiveView(view: string | undefined): typeof activeView {
  if (view === "bracket" || view === "stats" || view === "performance") return view;
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
  if (view === "stats") return renderStatsView();
  if (view === "performance") return renderPerformanceView();
  return renderMainView(projection);
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
        <p>Credit compares actual points with a ranking baseline, then scales by how far apart the teams are in FIFA ranking.</p>
        </div>
        <span>${fixtureRows.length} entries</span>
      </div>
      ${renderFixturePerformanceSummaryTable(summaryRows)}
      ${renderFixturePerformanceFormula()}
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
      <span class="team-cell">${renderFlag(team)} ${team?.name ?? row.teamId}</span>
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
        ${renderHeaderTooltip("Actual", "Actual match points earned: win 3, draw 1, loss 0.")}
        ${renderHeaderTooltip("Base", "Baseline points expected from FIFA ranking: favorite 3, underdog 0, equal rank 1.")}
        ${renderHeaderTooltip("Credit", "Total fixture credit: (Actual - Base) times the rank-gap factor for each row.")}
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
      <span class="team-cell">${renderFlag(team)} ${team?.name ?? row.teamId}</span>
      <span>${row.group}</span>
      <span>${row.fifaRanking}</span>
      <span>${row.fixtures}</span>
      <span>${row.won}-${row.drawn}-${row.lost}</span>
      <span>${formatSignedNumber(row.goalDifference)}</span>
      <span>${row.goalsFor}</span>
      <span>${row.actualPoints}</span>
      <span>${row.baselinePoints}</span>
      <span class="fixture-performance-score">${formatSignedNumber(row.totalCredit)}</span>
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
        ${renderHeaderTooltip("Gap", "Team rank minus opponent rank. Positive means underdog; negative means favorite.")}
        ${renderHeaderTooltip("Pts", "Actual points earned from this fixture: win 3, draw 1, loss 0.")}
        ${renderHeaderTooltip("Base", "Baseline points expected from ranking: favorite 3, underdog 0, equal rank 1.")}
        ${renderHeaderTooltip("Factor", "Rank-gap multiplier: 0-4 = x1, 5-14 = x2, 15-29 = x3, 30+ = x4.")}
        ${renderHeaderTooltip("Credit", "Fixture credit: (Pts - Base) x Factor.")}
        ${renderHeaderTooltip("Source", "Whether the score is an authoritative final result or active prediction.")}
      </div>
      ${rows.map((row, index) => renderFixturePerformanceRow(row, index)).join("")}
    </div>
  `;
}

function renderHeaderTooltip(label: string, tooltip: string) {
  return `<span class="table-header-help" title="${tooltip}" aria-label="${label}: ${tooltip}">${label}<span aria-hidden="true">?</span></span>`;
}

function renderFixturePerformanceRow(row: FixturePerformanceEntry, index: number) {
  const team = teamById.get(row.teamId);
  const opponent = teamById.get(row.opponentId);

  return `
    <div class="fixture-performance-row ${row.source}">
      <span>${index + 1}</span>
      <span class="team-cell">${renderFlag(team)} ${team?.name ?? row.teamId}</span>
      <span class="team-cell">${renderFlag(opponent)} ${opponent?.name ?? row.opponentId}</span>
      <span>${row.fixtureId}</span>
      <span>${row.goalsFor}-${row.goalsAgainst} ${fixtureResultLabel(row)}</span>
      <span>${row.fifaRanking}</span>
      <span>${row.opponentFifaRanking}</span>
      <span>${formatSignedNumber(row.rankingGap)}</span>
      <span>${row.resultPoints}</span>
      <span>${row.baselinePoints}</span>
      <span>x${row.rankingFactor}</span>
      <span class="fixture-performance-score">${formatSignedNumber(row.performanceScore)}</span>
      <span><span class="fixture-performance-source">${row.source === "final" ? "Final" : "Predicted"}</span></span>
    </div>
  `;
}

function renderFixturePerformanceFormula() {
  return `
    <div class="fixture-performance-formula">
      <div>
        <strong>How Fixture Credit Works</strong>
        <p>Each team gets a baseline for every ranked fixture. Credit is actual points versus baseline points, scaled by ranking gap.</p>
      </div>
      <div class="formula-grid">
        <span><strong>Baseline</strong>: if your FIFA rank is better than your opponent's, you are expected to win and get 3 baseline points.</span>
        <span><strong>Underdog</strong>: if your FIFA rank is worse, you are expected to lose and get 0 baseline points.</span>
        <span><strong>Even ranks</strong>: equal-ranked teams use a 1 point baseline, matching a draw.</span>
        <span><strong>Rank factor</strong>: ranking gap 0-4 = x1, 5-14 = x2, 15-29 = x3, 30+ = x4.</span>
        <span><strong>Credit</strong> = (actual points - baseline points) x rank factor. Positive means better than expected; negative means worse than expected.</span>
        <span><strong>Table</strong>: totals add fixture credit across played final results and complete predictions.</span>
      </div>
    </div>
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
                <span class="team-cell">${renderFlag(team)}</span>
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
  return `
    <div class="third-place-row ${row.qualifies ? "qualifies" : ""}">
      <span>${row.thirdPlaceRank}</span>
      <span>${row.group}</span>
      <span class="team-cell">${renderFlag(team)} ${team?.name ?? row.teamId}</span>
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
  const visibleFixtures = orderFixturesChronologically(
    tournamentData.fixtures.filter((fixture) => fixture.stage === "group" || fixture.stage === "round-of-32")
  );
  const fixtureGroups = groupFixturesByDisplayDate(visibleFixtures);

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
      ${renderFlag(team)}
      <span>${label}</span>
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
          return `
            <div class="standing-row">
              <span>${row.rank}</span>
              <span class="team-cell">${renderFlag(team)} ${team?.name ?? row.teamId}</span>
              <span>${row.played}</span>
              <span>${row.won}</span>
              <span>${row.drawn}</span>
              <span>${row.lost}</span>
              <span>${row.goalDifference}</span>
              <span>${row.points}</span>
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
    .map((match) => `
      <article class="knockout-match">
        <div class="knockout-round">${formatStage(match.stage)} · ${match.fixtureId}</div>
        <div class="knockout-row">${renderBracketParticipant(match.home, match.homeSource)} vs ${renderBracketParticipant(match.away, match.awaySource)}</div>
        ${match.winner ? `<div class="winner">Advances: ${renderQualifiedTeam(match.winner)}</div>` : ""}
      </article>
    `)
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
      <div xmlns="http://www.w3.org/1999/xhtml" class="diagram-node ${node.side}">
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
      ${renderDiagramTeam(match.home, match.homeSource, match.winner?.teamId)}
      ${renderDiagramTeam(match.away, match.awaySource, match.winner?.teamId)}
    </div>
    <div class="diagram-node-detail" title="${formatFixtureKickoff(match)} · ${venue ? `${venue.city}` : "Venue TBD"}">${formatBracketDiagramKickoff(match)} · ${venue ? venue.city : "Venue TBD"}</div>
  `;
}

function renderDiagramTeam(team: QualifiedTeam, source: string, winnerTeamId?: string) {
  const resolved = team.teamId ? teamById.get(team.teamId) : undefined;
  const isWinner = Boolean(winnerTeamId && resolved?.id === winnerTeamId);
  return `
    <div class="diagram-team ${resolved ? "resolved" : "unresolved"} ${isWinner ? "winner-team" : ""}">
      ${renderFlag(resolved)}
      <span>${resolved?.name ?? source}</span>
      <em>${source}</em>
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

  return `
    <div class="bracket-fixture-row">
      <span class="bracket-fixture-match">${match.fixtureId}</span>
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
  return `<span class="bracket-table-team">${renderFlag(resolved)} ${resolved?.name ?? source}</span>`;
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
        ${renderFlag(resolved)}
        <span class="draw-team-name">${resolved?.name ?? source}</span>
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

function renderBracketParticipant(team: QualifiedTeam, source = team.slot) {
  const resolved = team.teamId ? teamById.get(team.teamId) : undefined;
  const label = resolved ? `${renderFlag(resolved)} ${resolved.name}` : source;
  const sourceLabel = resolved ? `<span class="slot-label">${source}</span>` : "";
  return `<span class="bracket-team ${resolved ? "resolved" : "unresolved"}">${label}${sourceLabel}</span>`;
}

function renderQualifiedTeam(team: QualifiedTeam) {
  const resolved = team.teamId ? teamById.get(team.teamId) : undefined;
  return resolved ? `${renderFlag(resolved)} ${resolved.name}` : team.label;
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

function performanceStatusLabel(row: PerformanceRow) {
  if (row.performanceStatus === "overperforming") return "Over";
  if (row.performanceStatus === "underperforming") return "Under";
  if (row.performanceStatus === "on-track") return "On rank";
  return "Unknown";
}

function fixtureResultLabel(row: FixturePerformanceEntry) {
  if (row.result === "win") return "W";
  if (row.result === "draw") return "D";
  return "L";
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
  } else {
    predictions = setPrediction(tournamentData, predictions, fixtureId, decision.score);
  }

  savePredictions(predictions);
  renderPreservingPredictionInput(input);
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

function formatBracketDiagramKickoff(match: Pick<ProjectedMatch, "date">) {
  const date = new Date(match.date);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

render();
