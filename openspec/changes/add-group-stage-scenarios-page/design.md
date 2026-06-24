## Context

The app already calculates group standings, third-place rankings, and knockout bracket projections from the generated tournament dataset plus the active prediction model. Users can see the current result of those calculations, but they cannot ask a team-centered question such as "what does England need, who else matters, and who might they face next?"

The Scenarios tab should reuse the existing static tournament data and prediction state. It must not introduce a runtime service, mutate authoritative results, or persist derived scenarios. Scenario output is explanatory text generated from deterministic browser calculations.

The scheduled refresh workflow already runs generated result and stat updates before validating, building, and deploying changed static data. Scenarios must stay tied to that generated-data lifecycle so a result refresh or stat refresh that changes `tournament.generated.json` also updates the deployed scenario explanations.

Natural-language scenario questions need a small server-side layer because Workers AI credentials and bindings must not be exposed in browser code. The browser should send the user's question and compact deterministic scenario context to a Cloudflare Pages Function. The Function uses a Workers AI binding named `AI`, asks the model to explain only from the supplied context, and returns a concise answer.

The AI layer is an explainer, not a simulator. The deterministic scenario context should include precomputed answer material such as direct qualification routes, projected third-place routes, eliminated routes, miss-out summaries, concrete jeopardy routes, bounded scenario-share metrics, likely finish-to-opponent paths, same-group result combinations, all relevant passing-team pressure examples, and dependency notes. The default Workers AI model should favor reasoning and instruction-following quality, while still allowing an environment override for local experimentation or future model changes.

## Goals / Non-Goals

**Goals:**

- Add a Scenarios tab where users select a team and see group-stage qualification paths.
- Explain direct qualification, third-place qualification, elimination risk, and relevant dependency results in readable text.
- Show plausible round-of-32 slots and opponent possibilities when dependent results affect the selected team's landing spot.
- Recalculate scenarios from authoritative results plus active predictions without mutating fixture data or prediction state.
- Let users ask scenario questions through a simple text box, with answers grounded in deterministic context.
- Keep AI prompt/input compact and avoid sending the full tournament dataset.
- Use a reasoning-capable default Workers AI model for clearer natural-language scenario explanations.
- Rebuild and deploy scenario output whenever result or stat refresh runs change the generated dataset.
- Keep behavior compatible with static hosting and session-restored prediction state.

**Non-Goals:**

- Exhaustively enumerate every possible scoreline permutation for every unresolved fixture.
- Add server-side simulation, database storage, or external scenario APIs.
- Change FIFA standings or third-place assignment rules.
- Add prediction inputs to the Scenarios tab beyond linking back to existing unresolved fixture predictions.
- Use AI as the source of truth for qualification logic.
- Expose provider API keys or Workers AI credentials in browser code.

## Decisions

1. Add a reusable scenario-analysis engine rather than embedding logic in the UI.
   - The engine should accept tournament data, active predictions, and a selected team id, then return structured scenario sections for direct qualification, third-place qualification, elimination, dependencies, and round-of-32 outcomes.
   - Rationale: the same behavior needs focused tests and should share existing standings, third-place ranking, and bracket-slot resolution helpers.
   - Alternative considered: derive scenarios directly while rendering the tab. Rejected because qualification dependencies are domain logic and would make the UI brittle.

2. Use bounded outcome categories instead of exhaustive scoreline simulation.
   - The engine should evaluate useful match-result classes for unresolved relevant fixtures: selected team win/draw/loss, group competitors' win/draw/loss effects, and active predictions as the baseline where present.
   - Compact AI context should combine the selected team's active or possible result with other unresolved fixtures in the same group, so questions like "what if they draw and Morocco win?" can be answered from supplied facts.
   - Jeopardy route search should use bounded margins from 1 to 8, include draw branches where relevant, combine only compatible fixture outcomes, and keep shortest concrete miss-out routes first.
   - Percentages should be labelled as bounded scenario share over tested compatible chaser combinations, not real probabilities.
   - Rationale: users need actionable explanations, not a massive list of permutations with unlikely score details.
   - Alternative considered: brute-force all scorelines within an arbitrary range. Rejected because it creates misleading precision and unnecessary browser work.

3. Model dependencies as named fixture/team conditions.
   - Scenario results should name the dependent teams and fixtures, such as another group's third-place total or another group fixture that changes the round-of-32 opponent.
   - Third-place pressure should identify the team that can pass the selected team and the fixture result or margin that causes it, rather than only saying "chasing teams".
   - Rationale: text like "Scotland qualify if X happens" is more useful than only showing a table position.
   - Alternative considered: show only final projected standings. Rejected because the feature exists to explain why the projection changes.

4. Render Scenarios as a text-first work surface with a compact team selector.
   - The tab should follow existing app navigation patterns, show country flags with team names, and use concise panels for "Current position", "Qualification paths", "Dependencies", and "Possible round-of-32 opponents".
   - Scenario question answers should also show a compact deterministic visual summary from the same context sent to the AI: qualification path chips, the shortest concrete jeopardy route, chasing-team chips, and likely round-of-32 outcomes by finish.
   - The visual summary should use plain escaped browser-rendered text and wrapping chips/rows instead of markdown or AI-generated formatting.
   - Rationale: scenario analysis is dense; it should be scannable without becoming a marketing-style page.
   - Alternative considered: add scenario snippets to every team row. Rejected because it would overload standings and fixture views.

5. Do not change the generated JSON schema.
   - All scenario output is derived from existing teams, fixtures, results, predictions, standings, third-place ranking, and knockout slot definitions.
   - Rationale: there is no new authoritative data source and no persistent derived state.

6. Keep scenario refresh tied to the existing generated-data workflow.
   - Result refresh and stat refresh should both participate in the same changed-data detection, validation, static build, commit, and deployment path.
   - Rationale: scenario text is built from bundled tournament data, so any generated data run that changes the bundle must refresh the deployed app.
   - Alternative considered: run a scenario-specific scheduled job. Rejected because scenarios are derived client-side and do not need a separate data source.

7. Use Cloudflare Pages Functions plus Workers AI for natural-language answers.
   - Add a POST endpoint such as `/api/scenario-question` that receives `{ question, team, context }`.
   - Configure a Workers AI binding named `AI` in `wrangler.toml` and call `context.env.AI.run(...)` from the Function.
   - Route calls through Cloudflare AI Gateway using gateway id `worldcup2026`, with `SCENARIO_AI_GATEWAY_ID` available as an environment override.
   - The default model should be a stronger reasoning-capable Workers AI text model, currently `@cf/openai/gpt-oss-120b`, with `SCENARIO_AI_MODEL` available as an environment override.
   - The endpoint should use a chat-style `messages` payload so system instructions and user question/context stay separated.
   - The system prompt should be strict and situation-aware: determine all logical scenarios supported by supplied deterministic context, distinguish direct qualification from projected third-place qualification, use pressure summaries for danger/panic questions, avoid restating the user's question, never expose reasoning text, and keep answers concise.
   - Rationale: this keeps credentials server-side, matches the Cloudflare Pages deployment, and lets the deterministic engine remain the factual input.
   - Alternative considered: call an AI provider directly from the browser. Rejected because browser calls would expose credentials and make abuse control difficult.

## Risks / Trade-offs

- [Risk] Scenario text can imply certainty when dependent results are still unresolved. -> Mitigation: label baseline projections separately from conditional outcomes and name unresolved dependencies explicitly.
- [Risk] Bounded outcome categories may omit rare scoreline-specific goal-difference paths. -> Mitigation: include a fallback note when qualification depends on goal difference or tie-breakers beyond simple win/draw/loss outcomes.
- [Risk] Live generated data changes can make integration expectations brittle. -> Mitigation: unit tests for scenario logic should use local fixture data; generated-data tests should be marked as integration expectations.
- [Risk] Stats-only data changes could skip a scenario rebuild if workflow checks are scoped too narrowly. -> Mitigation: changed-data detection should treat result and stat updates to the generated dataset as deployment-triggering changes.
- [Risk] The Scenarios tab can become too verbose on small screens. -> Mitigation: use grouped sections, short headings, and responsive layouts that preserve readable text without nested cards.
- [Risk] AI answers may hallucinate unsupported permutations. -> Mitigation: send only compact deterministic context, use a strict grounding prompt, and render a fallback/error state when the endpoint is unavailable.
- [Risk] Reasoning models can expose analysis text or role markers. -> Mitigation: instruct final-answer-only output and sanitize responses before returning them to the browser.
- [Risk] A weaker or deprecated model may produce vague scenario answers even with good context. -> Mitigation: use a reasoning-capable default model and keep a model override for local testing and future provider changes.
- [Risk] Workers AI bindings are unavailable in local/static-only previews. -> Mitigation: keep deterministic scenario panels usable and make the question box fail gracefully.
