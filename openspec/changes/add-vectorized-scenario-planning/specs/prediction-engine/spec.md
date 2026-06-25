## ADDED Requirements

### Requirement: Expanded scenario permutation analysis
The system SHALL calculate bounded scenario permutations for unresolved group fixtures to identify qualification routes, miss-out routes, third-place chasers, teams that can jump into third place, and likely round-of-32 finish paths.

#### Scenario: All groups provide third-place jump candidates
- **WHEN** scenario analysis evaluates unresolved group fixtures
- **THEN** it MUST include candidate outcomes where a team not currently in the third-place table can become third and affect best-third qualification

#### Scenario: Concrete chaser margins are recorded
- **WHEN** a candidate result allows a team to pass another team in the third-place comparison
- **THEN** scenario analysis MUST record the fixture, winning team, required margin threshold, resulting third-place team, points, goal difference, goals for, and group finish

#### Scenario: Compatible routes are searched
- **WHEN** scenario analysis builds qualification or miss-out route combinations
- **THEN** it MUST combine only fixture outcomes that can happen together and MUST reject contradictory outcomes from the same fixture

#### Scenario: Bounded exploration remains explicit
- **WHEN** scenario analysis reports route coverage or percentages
- **THEN** it MUST label them as bounded scenario share over tested margin combinations rather than real-world probability

#### Scenario: Result drift does not break behavior tests
- **WHEN** tests assert scenario permutation behavior
- **THEN** they MUST construct or normalize fixture state so evolving authoritative results cannot invalidate the expected teams or outcomes
