---
phase: 8
slug: end-screen-standardization
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vite build (syntax/import validation) |
| **Config file** | superzion/vite.config.js |
| **Quick run command** | `cd superzion && npx vite build 2>&1 \| tail -5` |
| **Full suite command** | `cd superzion && npx vite build && npx vite dev` |
| **Estimated runtime** | ~5 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `cd superzion && npx vite build 2>&1 | tail -5`
- **After every plan wave:** Manual browser playthrough of all 6 levels
- **Before `/gsd:verify-work`:** Full playthrough verifying win/lose on all 6 levels
- **Max feedback latency:** 5 seconds (build) + human gameplay check

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | UX-01 | build + manual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 08-01-02 | 01 | 1 | UX-01 | build + manual | build + visual | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No automated test framework needed — this is a UI behavior phase requiring visual browser verification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Win screen shows PLAY AGAIN (R) + NEXT LEVEL (ENTER) | UX-01 | UI rendering in Phaser | Win each level, verify overlay options |
| Lose screen shows RETRY (R) + SKIP LEVEL (S) | UX-01 | UI rendering in Phaser | Lose each level, verify overlay options |
| End screens after animations complete | UX-01 | Animation timing perception | Watch boss disintegration, explosion cinematics |
| No keyboard listener leaks | UX-01 | Requires repeated retries | Retry a level 3x, verify single key fires once |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: build check after every task
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s (build validation)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-19
