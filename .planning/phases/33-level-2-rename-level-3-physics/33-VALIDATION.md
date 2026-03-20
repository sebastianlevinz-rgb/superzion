---
phase: 33
slug: level-2-rename-level-3-physics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 33 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser testing (no automated test framework) |
| **Config file** | none |
| **Quick run command** | `cd superzion && npx vite build` |
| **Full suite command** | Manual playthrough of Level 2 and Level 3 via `cd superzion && npx vite --open` |
| **Estimated runtime** | ~5 seconds (build), ~5 minutes (manual playthrough) |

---

## Sampling Rate

- **After every task commit:** Run `cd superzion && npx vite build`
- **After every plan wave:** Manual playthrough of Level 2 cinematic + gameplay + Level 3 all 6 phases
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds (build check)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 33-01-01 | 01 | 1 | LVL2-01 | manual | `grep -rn "SIGNAL STORM\|PORT SWAP" superzion/src/` | N/A | ⬜ pending |
| 33-02-01 | 02 | 1 | LVL3-01 | manual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 33-02-02 | 02 | 1 | LVL3-02 | manual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 33-02-03 | 02 | 1 | LVL3-03 | manual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 33-02-04 | 02 | 1 | LVL3-04 | manual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 33-02-05 | 02 | 1 | LVL3-05 | manual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 33-02-06 | 02 | 1 | LVL3-06 | manual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 33-02-07 | 02 | 1 | LVL3-07 | manual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 33-02-08 | 02 | 1 | LVL3-08 | manual | `cd superzion && npx vite build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No automated test framework needed — all validation is visual/manual via browser.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Explosive Interception" in all UI locations | LVL2-01 | Visual text check across multiple screens | Play Level 2: check cinematic title, HUD, menu entry, victory screen, credits |
| Plane falls under gravity | LVL3-01 | Physics feel is subjective | Play Level 3, release all keys mid-flight, verify plane descends |
| UP arrow thrust | LVL3-02 | Input response is visual | Play Level 3, hold UP, verify plane rises |
| LEFT/RIGHT tilt | LVL3-03 | Visual rotation check | Play Level 3, press LEFT/RIGHT, verify plane tilts |
| Hard landing crash | LVL3-04 | Gameplay behavior check | Play Level 3, dive fast into carrier, verify explosion |
| Water contact crash | LVL3-05 | Gameplay behavior check | Play Level 3, fly into water at any phase, verify explosion |
| Failed takeoff crash | LVL3-06 | Gameplay behavior check | Play Level 3, don't press UP during takeoff, verify water crash |
| Precision landing | LVL3-07 | Gameplay feel check | Play Level 3, attempt landing — verify need for controlled descent |
| Heavy plane feel | LVL3-08 | Subjective feel comparison | Play Level 3, compare to previous behavior — plane should feel weighty |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
