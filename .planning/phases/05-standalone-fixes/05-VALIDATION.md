---
phase: 5
slug: standalone-fixes
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual visual + gameplay verification |
| **Config file** | none — no automated test infrastructure exists |
| **Quick run command** | `cd superzion && npx vite dev` (then navigate to specific level) |
| **Full suite command** | Manual play-through of all 6 levels |
| **Estimated runtime** | ~5 minutes per full play-through |

---

## Sampling Rate

- **After every task commit:** Launch dev server, verify the specific fix visually
- **After every plan wave:** Play through Levels 1-6 checking controls overlay; play Level 2 fully; watch Level 3 cinematic
- **Before `/gsd:verify-work`:** All 3 success criteria verified by manual inspection
- **Max feedback latency:** ~60 seconds (dev server startup + navigation)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | GAME-01 | manual-only | Launch game → Level 2 → navigate all yards | N/A | ⬜ pending |
| 05-02-01 | 02 | 1 | GAME-02 | manual-only | Launch game → Level 3 → observe Act 3 hangar | N/A | ⬜ pending |
| 05-03-01 | 03 | 1 | UX-02 | manual-only | Launch game → enter each of 6 levels → check overlay + bar | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No automated test framework needed — all verification is manual visual/gameplay inspection.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Player navigates Level 2 container corridors from entrance to target and back to exit | GAME-01 | Requires physics simulation — player moving through colliders in a randomized layout | Launch game, select Level 2, navigate through all container yards to bomb-plant target, then return to exit |
| F-15 displays swept-back wings in Level 3 cinematic | GAME-02 | Visual inspection of a canvas-drawn texture — no screenshot comparison framework exists | Launch game, select Level 3, observe Act 3 hangar scene, confirm wings angle toward tail |
| Controls overlay text is large bright yellow on dark background in all 6 levels | UX-02 | Visual inspection of text rendering across multiple scenes | Launch game, enter each of 6 levels, observe initial big overlay and persistent bottom bar text color/size |

---

## Validation Sign-Off

- [x] All tasks have manual-only verify (justified: visual/spatial requirements, no screenshot comparison framework)
- [x] Sampling continuity: each task verified immediately after commit
- [x] Wave 0 covers all MISSING references (none needed)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
