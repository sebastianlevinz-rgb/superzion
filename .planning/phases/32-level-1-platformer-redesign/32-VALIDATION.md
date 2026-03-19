---
phase: 32
slug: level-1-platformer-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 32 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser testing + Playwright (^1.58.2, in devDependencies) |
| **Config file** | none — no test config exists |
| **Quick run command** | `cd superzion && npm run dev` (manual browser test) |
| **Full suite command** | Manual playthrough (no automated test suite exists) |
| **Estimated runtime** | ~120 seconds (full Level 1 playthrough) |

---

## Sampling Rate

- **After every task commit:** Run `cd superzion && npm run dev` — play through Level 1 in browser
- **After every plan wave:** Full Level 1 playthrough: menu → cinematic → flight route → platformer → Bomberman → explosion cinematic
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 32-01-01 | 01 | 1 | LVL1-01 | manual | Play PlatformerScene, verify horizontal scrolling and jump mechanics | N/A | ⬜ pending |
| 32-01-02 | 01 | 1 | LVL1-02 | manual | Visually verify Azadi Tower, Milad Tower, mountains, moon, stars in background | N/A | ⬜ pending |
| 32-01-03 | 01 | 1 | LVL1-03 | manual | Verify platform visuals look like rooftops, balconies, domes | N/A | ⬜ pending |
| 32-01-04 | 01 | 1 | LVL1-04 | manual | Verify each obstacle type functions and deals damage | N/A | ⬜ pending |
| 32-01-05 | 01 | 1 | LVL1-05 | manual + console | Check guard.y vs platform.y in console output; visual verification | N/A | ⬜ pending |
| 32-01-06 | 01 | 1 | LVL1-06 | manual | Reach end of platformer, verify visual transition to Bomberman | N/A | ⬜ pending |
| 32-01-07 | 01 | 1 | LVL1-07 | manual | Play through Bomberman after platformer, verify all mechanics work | N/A | ⬜ pending |
| 32-01-08 | 01 | 1 | LVL1-08 | manual | Find and pick up key in Bomberman, verify golden door opens | N/A | ⬜ pending |
| 32-01-09 | 01 | 1 | LVL1-09 | manual | Inspect top-down player sprite, verify star position at chest center | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — this project has no automated test infrastructure, and all testing is manual browser-based. No test framework setup needed for this phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Side-scrolling platformer with run/jump | LVL1-01 | Visual/interactive gameplay verification | Play PlatformerScene, verify player runs and jumps across rooftop platforms |
| Tehran night skyline with landmarks | LVL1-02 | Visual art verification | Check background for Azadi Tower, Milad Tower, Alborz mountains, moon, stars |
| Iranian building rooftop platforms | LVL1-03 | Visual art verification | Verify platform visuals look like rooftops, balconies, mosque domes |
| Cameras, guards, searchlights, electric wire | LVL1-04 | Interactive gameplay verification | Trigger each obstacle type, verify they function and deal damage |
| Guards walk on floor, never float | LVL1-05 | Physics/visual verification | Check console.log output for guard.y vs platform.y; visual check guards feet touch ground |
| Target building entry triggers transition | LVL1-06 | Scene transition verification | Reach end of platformer, verify zoom+fade transition to Bomberman |
| Bomberman phase preserved intact | LVL1-07 | Full gameplay verification | Complete Bomberman phase after platformer, verify all mechanics unchanged |
| Key visible, pickable, functional | LVL1-08 | Gameplay verification | Find key in Bomberman, pick up, verify golden door opens |
| Star of David at chest center | LVL1-09 | Visual sprite verification | Inspect top-down player sprite in all 4 directions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
