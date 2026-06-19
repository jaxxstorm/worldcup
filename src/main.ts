import "./styles.css";
import { tournamentData, teamById, venueById } from "./data/tournament";
import { validateTournamentData } from "./data/schema";
import { buildBracketLayout, type BracketLayout, type BracketNode } from "./engine/bracket-layout";
import { formatFixtureKickoff, groupFixturesByDisplayDate, orderFixturesChronologically } from "./engine/fixtures";
import { drawSidesForProjection, projectTournament } from "./engine/knockout";
import { interpretPredictionInput, isEditableFixture, setPrediction } from "./engine/predictions";
import { calculateGroupStandings } from "./engine/standings";
import { loadPredictions, savePredictions } from "./storage/session";
import type { Fixture, MatchStage, PredictionMap, ProjectedMatch, QualifiedTeam, Team, TeamRef } from "./types";

const validationIssues = validateTournamentData(tournamentData);
if (validationIssues.length > 0) {
  throw new Error(`Invalid tournament data: ${validationIssues.map((issue) => `${issue.path} ${issue.message}`).join(", ")}`);
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("App root missing");

const appRoot = app;
let predictions: PredictionMap = loadPredictions(tournamentData);
let activeView: "main" | "bracket" = "main";

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
        <button class="${activeView === "bracket" ? "active" : ""}" type="button" data-view="bracket">Bracket</button>
      </nav>
      ${activeView === "main" ? renderMainView(projection) : renderBracketView(projection)}
    </main>
  `;

  appRoot.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      activeView = button.dataset.view === "bracket" ? "bracket" : "main";
      render();
    });
  });

  appRoot.querySelectorAll<HTMLInputElement>("[data-prediction]").forEach((input) => {
    input.addEventListener("input", handlePredictionInput);
  });
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
          <span>${fixture.stage.replaceAll("-", " ")}</span>
          <span>${formatFixtureKickoff(fixture)}</span>
          <span>${venue ? `${venue.name}, ${venue.city}, ${venue.country}` : "Venue TBD"}</span>
        </div>
      </div>
      ${renderFixtureControls(fixture)}
    </article>
  `;
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
  return `
    <div class="prediction-controls">
      <input data-prediction="${fixture.id}" data-side="home" min="0" max="99" type="number" inputmode="numeric" value="${score?.home ?? ""}" aria-label="Home score prediction" />
      <input data-prediction="${fixture.id}" data-side="away" min="0" max="99" type="number" inputmode="numeric" value="${score?.away ?? ""}" aria-label="Away score prediction" />
    </div>
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
        <h2>Bracket</h2>
        <p class="section-note">If we started today: projected from the current tables, real results, and your active predictions.</p>
        ${renderBracketPanel(projection)}
        ${renderBracketFixtureTable(projection)}
      </section>
    </div>
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
    <div class="diagram-node-detail">${formatFixtureKickoff(match)} · ${venue ? `${venue.city}` : "Venue TBD"}</div>
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
      </span>
      <span>${formatFixtureKickoff(match)}</span>
      <span>${venue ? `${venue.name}, ${venue.city}` : "Venue TBD"}</span>
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
  const input = event.currentTarget as HTMLInputElement;
  const fixtureId = input.dataset.prediction;
  if (!fixtureId) return;

  const fixture = tournamentData.fixtures.find((candidate) => candidate.id === fixtureId);
  if (!fixture || !isEditableFixture(fixture)) return;

  const controls = Array.from(appRoot.querySelectorAll<HTMLInputElement>(`[data-prediction="${fixtureId}"]`));
  const home = controls.find((control) => control.dataset.side === "home")?.value;
  const away = controls.find((control) => control.dataset.side === "away")?.value;
  const decision = interpretPredictionInput(home, away, Boolean(predictions[fixtureId]));

  if (decision.kind === "partial") return;

  if (decision.kind === "cleared") {
    predictions = setPrediction(tournamentData, predictions, fixtureId);
  } else {
    predictions = setPrediction(tournamentData, predictions, fixtureId, decision.score);
  }

  savePredictions(predictions);
  renderPreservingPredictionInput(input);
}

function renderPreservingPredictionInput(input: HTMLInputElement) {
  const fixtureId = input.dataset.prediction;
  const side = input.dataset.side;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  render();

  if (fixtureId && side) {
    const restoredInput = Array.from(appRoot.querySelectorAll<HTMLInputElement>("[data-prediction]")).find(
      (candidate) => candidate.dataset.prediction === fixtureId && candidate.dataset.side === side
    );
    restoredInput?.focus({ preventScroll: true });
  }

  window.scrollTo(scrollX, scrollY);
}

render();
