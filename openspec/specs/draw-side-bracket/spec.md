# draw-side-bracket Specification

## Purpose
TBD - created by archiving change show-draw-sides-bracket. Update Purpose after archive.
## Requirements
### Requirement: Draw sides are visible
The system SHALL present the projected round-of-32 bracket as distinct left and right draw sides.

#### Scenario: Bracket side grouping renders
- **WHEN** a user opens the bracket view
- **THEN** the page MUST show separate left-side and right-side draw groups based on projected round-of-32 bracket order

#### Scenario: Teams are projected as of today
- **WHEN** round-of-32 slots can be resolved from real results, current standings, and active predictions
- **THEN** each side MUST show the resolved team names and flags in its corresponding bracket position

#### Scenario: Slot is unresolved
- **WHEN** a bracket participant cannot yet be resolved to a concrete team
- **THEN** the side view MUST show the source slot or placeholder for that participant

### Requirement: Draw side match details
The system SHALL include useful match details in each draw-side pairing.

#### Scenario: Match detail renders
- **WHEN** a round-of-32 pairing is shown on a draw side
- **THEN** the pairing MUST include the match id, kickoff time, venue, host city, and host country when available

#### Scenario: Prediction changes draw side
- **WHEN** a user changes predictions that alter projected round-of-32 qualification
- **THEN** the left and right draw sides MUST update without a page reload

