## MODIFIED Requirements

### Requirement: Qualification and knockout projection recalculate
The system SHALL update projected qualification, round-of-32 slots, best third-place finisher assignments, and later knockout outcomes whenever relevant predictions change.

#### Scenario: Group qualification changes
- **WHEN** prediction changes alter group ranking or qualification status
- **THEN** the projected qualified teams and round-of-32 assignments MUST update

#### Scenario: Best third-place teams qualify
- **WHEN** projected group standings identify at least eight third-place teams
- **THEN** the eight best third-place teams MUST qualify for the round of 32 according to the active standings sort

#### Scenario: Third-place round-of-32 slots resolve
- **WHEN** the eight qualifying third-place groups are known
- **THEN** ambiguous round-of-32 labels such as `3A/B/C` MUST resolve to the concrete third-place team assigned by the FIFA third-place group combination table

#### Scenario: Third-place assignment uses current standings
- **WHEN** the group stage is incomplete but current standings identify at least eight third-place teams
- **THEN** ambiguous third-place round-of-32 labels MUST resolve from the current third-place standings as the tournament stands today

#### Scenario: Knockout winner changes
- **WHEN** a user changes a prediction for a knockout match
- **THEN** downstream projected fixtures MUST update to reflect the new advancing team
