---
phase: 6
slug: visual-identity
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vite build (syntax/import validation) |
| **Config file** | superzion/vite.config.js |
| **Quick run command** | `cd superzion && npx vite build 2>&1 \| tail -5` |
| **Full suite command** | `cd superzion && npx vite build && npx vite preview` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd superzion && npx vite build 2>&1 | tail -5`
- **After every plan wave:** Launch dev server, visual inspection of sprites
- **Before `/gsd:verify-work`:** Full visual walkthrough of intro + gameplay
- **Max feedback latency:** 5 seconds (build) + human visual check

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | VIS-01 | manual-visual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 06-01-02 | 01 | 1 | VIS-01 | manual-visual | build + visual | N/A | ⬜ pending |
| 06-02-01 | 02 | 1 | VIS-02 | manual-visual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 06-02-02 | 02 | 1 | VIS-02 | manual-visual | build + visual | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No automated test framework needed — this is a visual-only phase where all sprites are procedurally generated via Canvas 2D.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Player sprite consistent across SpriteGenerator, CinematicTextures, ParadeTextures | VIS-01 | Procedural Canvas 2D sprites — no pixel-comparison pipeline exists | Run game, compare player appearance in gameplay vs cinematic vs intro parade |
| Boss parade shows 4 real sprites with animated attacks | VIS-02 | Visual correctness of sprite rendering | Run intro, watch boss parade sequence for all 4 bosses with attack animations |
| Player sprite readable at 32-48px | VIS-01 | Subjective visual quality | Check gameplay sprites are recognizable at game-scale zoom |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: build check after every task
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s (build validation)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-19
