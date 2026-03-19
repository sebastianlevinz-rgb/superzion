---
phase: 7
slug: intro-overhaul
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 7 — Validation Strategy

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
- **After every plan wave:** Launch dev server, watch full intro sequence
- **Before `/gsd:verify-work`:** Full intro watched without skip
- **Max feedback latency:** 5 seconds (build) + human visual/audio check

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | INTRO-01 | manual-visual | `cd superzion && npx vite build` | N/A | ⬜ pending |
| 07-02-01 | 02 | 1 | INTRO-02 | manual-visual | build + visual | N/A | ⬜ pending |
| 07-03-01 | 03 | 1 | INTRO-03, INTRO-04 | manual-visual+audio | build + visual+audio | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No automated test framework needed — this is an audiovisual cinematic phase where all verification requires human observation.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 4 waving flags in intro parade | INTRO-01 | Canvas animation rendering | Watch Act 1, verify flag sprites with wave animation |
| Giant Maguen David + arcade font title | INTRO-02 | Visual layout/styling | Watch Act 3, verify golden star and thick font |
| Psytrance from frame 1 + distinct SFX | INTRO-03 | Audio playback timing | Listen for music start, missile whoosh, jet flyby, gunfire |
| Camera shake on every explosion | INTRO-04 | Visual motion perception | Watch for screen shake synced with each explosion |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: build check after every task
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s (build validation)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-19
