import "./styles.css";
import { tournamentData, teamById, venueById } from "./data/tournament";
import { validateTournamentData } from "./data/schema";
import { groupFixturesByDisplayDate, orderFixturesChronologically } from "./engine/fixtures";
import { projectTournament } from "./engine/knockout";
import { interpretPredictionInput, isEditableFixture, setPrediction } from "./engine/predictions";
import { calculateGroupStandings } from "./engine/standings";
import { loadPredictions, savePredictions } from "./storage/session";
import type { Fixture, MatchStage, PredictionMap, ProjectedMatch, QualifiedTeam, TeamRef } from "./types";

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

function formatFixtureKickoff(fixture: Fixture) {
  const date = new Date(fixture.date);

  if (Number.isNaN(date.getTime())) {
    return "Kickoff TBD";
  }

  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function renderFixtureTeam(teamRef: TeamRef, score?: number) {
  const team = typeof teamRef === "string" ? teamById.get(teamRef) : undefined;
  const label = team ? team.name : typeof teamRef === "string" ? teamRef : teamRef.label;
  const flag = team?.flag ?? "◇";
  return `
    <div class="team-line">
      <span class="flag">${flag}</span>
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
              <span class="team-cell">${team?.flag ?? ""} ${team?.name ?? row.teamId}</span>
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
        <p class="section-note">Projected from the current tables, real results, and your active predictions.</p>
        <div class="bracket-rounds">
          ${bracketRounds.map((round) => renderBracketRound(round, projection.filter((match) => match.stage === round))).join("")}
        </div>
      </section>
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
      <div class="knockout-round">${match.fixtureId} · ${new Date(match.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</div>
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
  const label = resolved ? `${resolved.flag} ${resolved.name}` : source;
  const sourceLabel = resolved ? `<span class="slot-label">${source}</span>` : "";
  return `<span class="bracket-team ${resolved ? "resolved" : "unresolved"}">${label}${sourceLabel}</span>`;
}

function renderQualifiedTeam(team: QualifiedTeam) {
  const resolved = team.teamId ? teamById.get(team.teamId) : undefined;
  return `${resolved?.flag ?? ""} ${resolved?.name ?? team.label}`;
}

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
