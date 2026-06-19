## Context

The fixtures page already renders World Cup fixtures from normalized static data and recent changes sort fixtures chronologically before display. Dense match days are still hard to scan because every fixture appears in one continuous list. This change only affects how the fixtures view presents already-loaded data in the browser.

The app must remain deployable as static assets on GitHub Pages. Real results remain immutable, user predictions remain session-scoped, and fixture data should continue to come from the existing normalized JSON schema fed by external authoritative sources where practical.

## Goals / Non-Goals

**Goals:**

- Present fixtures in boxed sections grouped by calendar date.
- Preserve chronological ordering across date groups.
- Preserve kickoff-time and match-number ordering inside each date group.
- Keep all existing fixture card content, including teams, flags, status, kickoff details, venues, host cities, results, and editable predictions.
- Keep grouping deterministic and client-side only.

**Non-Goals:**

- Changing the fixture JSON schema or adding new fixture fields.
- Changing authoritative fixture/result ingestion.
- Changing standings, bracket, qualification, or prediction calculation behavior.
- Changing session storage keys or stored prediction format.
- Adding server-side routing or runtime services.

## Decisions

- Group fixtures after chronological ordering in the UI layer. This keeps source fixture data immutable and lets the existing sorter continue to define canonical display order.
- Use a stable calendar-date key derived from each fixture kickoff value, with an "unscheduled" fallback for fixtures without a parseable kickoff. This keeps scheduled matches grouped by actual date while still rendering incomplete data gracefully.
- Render each date group as a semantic section with a date heading and existing fixture cards inside. This improves scanability while preserving the individual fixture card interactions.
- Style date groups as restrained bordered boxes using the existing visual system. The app is an operational predictor, so the grouping should organize information without making the page feel like a marketing layout.
- Keep all behavior static and browser-local. No new dependency, server route, or data fetch is required for grouping.

## Risks / Trade-offs

- [Risk] Timezone conversion could make a match appear under a different date than the source schedule for some users. -> Mitigation: use the same kickoff formatting/display convention already used by the fixture list so date grouping and visible kickoff details agree.
- [Risk] Unscheduled or partially specified fixtures could be hidden if grouping assumes every fixture has a valid date. -> Mitigation: include an explicit fallback group for unscheduled fixtures.
- [Risk] Adding another wrapper around fixture cards could create crowded mobile layouts. -> Mitigation: use responsive spacing and border styling that preserves card readability on narrow screens.
