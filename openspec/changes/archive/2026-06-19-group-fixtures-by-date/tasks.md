## 1. Fixture Grouping

- [x] 1.1 Add a deterministic helper that groups chronologically ordered fixtures by display date without mutating the source fixture array.
- [x] 1.2 Ensure fixtures with missing or invalid kickoff values still render in a fallback group.

## 2. Fixtures UI

- [x] 2.1 Update the fixtures view to render date-group sections with a heading and boxed container.
- [x] 2.2 Keep existing fixture card content and prediction controls unchanged inside each date group.
- [x] 2.3 Add responsive styles for date-group boxes that work on desktop and mobile.

## 3. Verification

- [x] 3.1 Add tests for grouping same-date fixtures, preserving chronological date order, and preserving fixture order inside each date group.
- [x] 3.2 Run the project test/typecheck/build commands and verify the static app still builds for GitHub Pages.
