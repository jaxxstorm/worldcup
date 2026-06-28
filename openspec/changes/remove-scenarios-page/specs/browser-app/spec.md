## ADDED Requirements

### Requirement: Scenarios page is unavailable
The system SHALL NOT expose the retired Scenarios page or scenario question flow in the browser application.

#### Scenario: User views application navigation
- **WHEN** the browser app renders its primary view navigation
- **THEN** the navigation MUST NOT include a Scenarios tab or control

#### Scenario: Application renders active views
- **WHEN** the browser app renders any supported view
- **THEN** it MUST only render supported static predictor views and MUST NOT render scenario analysis, scenario team selection, or scenario question UI

#### Scenario: Static hosting remains compatible
- **WHEN** the app is served from static hosting
- **THEN** removing Scenarios MUST NOT require server-side routes and MUST NOT affect fixtures, bracket, stats, performance, prediction editing, prediction sharing, or session restoration
