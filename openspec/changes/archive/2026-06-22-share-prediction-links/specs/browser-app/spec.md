## MODIFIED Requirements

### Requirement: Session storage persistence
The system SHALL persist the active prediction model in browser session storage, restore it during the same browser session, and support loading valid predictions from a static share link.

#### Scenario: Prediction is restored
- **WHEN** a user reloads the page in the same browser session
- **THEN** previously entered valid predictions MUST be restored from session storage

#### Scenario: Stored prediction is invalid
- **WHEN** session storage contains invalid JSON, unknown fixture IDs, or predictions for completed fixtures
- **THEN** the app MUST discard invalid entries and continue loading

#### Scenario: Share link predictions are loaded
- **WHEN** a user opens a URL containing valid shared predictions
- **THEN** the app MUST populate those predictions before the first render and persist the sanitized prediction map in session storage

#### Scenario: Shared predictions show projected changes
- **WHEN** shared predictions are loaded from the URL
- **THEN** standings and bracket content affected by those predictions MUST show recent-change highlighting against the no-predictions baseline

#### Scenario: Invalid share link is ignored
- **WHEN** a user opens a URL containing invalid shared prediction data
- **THEN** the app MUST ignore that share data and continue loading predictions from session storage if available

### Requirement: Prediction sharing
The system SHALL let users create a shareable static link for their active prediction model.

#### Scenario: User creates share link
- **WHEN** a user has one or more active predictions and activates the share control
- **THEN** the app MUST generate a URL containing the sanitized active predictions

#### Scenario: Share link preserves static hosting
- **WHEN** a share link is generated
- **THEN** it MUST use the current static app URL with query data and MUST NOT require server-side routes or runtime server storage

#### Scenario: Empty prediction model share
- **WHEN** the active prediction model has no predictions
- **THEN** the share control MUST remain non-destructive and MUST NOT create invalid prediction state
