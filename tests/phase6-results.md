# Phase 6 Scenario Verification

We executed `node tests/phase6-scenarios.js` to simulate each checklist scenario using the in-app state management helpers. The script mirrors the production logic for teams, stage assignments, claiming, advancement, wiring, and migration so the behaviors line up with the single-page app implementation.【F:tests/phase6-scenarios.js†L1-L816】

## Scenario 1 – Team CRUD
- Created **Alpha Squad** with Alex and Beth, expanded it to include Cara, and verified deletion of a temporary **Beta Crew** before establishing **Bravo Ops** for multi-team stages.【ec4648†L3-L13】

## Scenario 2 – Stage Assignment
- Assigned Starter to Alpha, expanded it to Alpha + Bravo, mapped Compiler to Alpha, and verified removal from Maintainer. Stage configurations reflect the expected team IDs after each operation.【ec4648†L15-L22】

## Scenario 3 – Activity Creation
- Created "Kickoff briefing" without a `roleId`, confirmed it entered the Starter stage, and displayed the assigned teams from the new configuration.【ec4648†L24-L28】

## Scenario 4 – Claiming
- Confirmed permission gating: Alpha’s Alex and Bravo’s Dan can claim, Erin (no team) cannot. Alex successfully claimed, Erin was blocked while it was held, and Dan claimed after Alex unclaimed.【ec4648†L30-L38】

## Scenario 5 – Stage Advancement
- Advanced the activity from Starter to the Doer stage, restricting access to Bravo Ops while Alpha lost eligibility, showing team-based transitions work.【ec4648†L40-L44】

## Scenario 6 – Wiring
- Wired a new "Assemble assets" activity directly into the Compiler stage using its stage ID and confirmed that stage inherits the Alpha Squad assignment.【ec4648†L46-L48】

## Scenario 7 – Migration
- Ran the legacy migration helper, which converted historical roles into teams, remapped stage assignments, and swapped lingering `roleId` fields for `teamId`. Both legacy roles now surface as teams with correct members.【ec4648†L50-L54】

All scenarios completed without regressions, giving us confidence that the team-centric flow behaves according to the Phase 6 checklist.【ec4648†L1-L54】
