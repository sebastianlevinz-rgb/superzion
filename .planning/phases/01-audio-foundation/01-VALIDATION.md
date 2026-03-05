---
phase: 1
slug: audio-foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-05
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Static file analysis (Node.js fs.readFileSync) + manual browser verification |
| **Config file** | none — static analysis scripts embedded in plan verify blocks |
| **Quick run command** | `node -e "..."` static analysis scripts in each task's `<automated>` block |
| **Full suite command** | Manual play-through: menu -> 3 level transitions -> restart |
| **Estimated runtime** | ~5 seconds (automated static analysis) + ~60 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Run automated static analysis verify command (< 5 seconds), then manual browser test -- play 2-3 scene transitions, verify no abrupt cuts
- **After every plan wave:** Full play-through from menu through at least 3 level transitions
- **Before `/gsd:verify-work`:** Full game play-through verifying all transitions smooth
- **Max feedback latency:** ~5 seconds (automated) / ~60 seconds (manual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUDIO-01 | static-analysis | Node.js: check MusicManager.js contains setValueCurveAtTime, Math.cos, crossfadeTo, shutdown; no non-comment linearRampToValueAtTime | src/systems/MusicManager.js | pending |
| 01-01-02 | 01 | 1 | AUDIO-01 | static-analysis | Node.js: scan 4 scene files for unguarded scene.start/restart calls with 6-line lookback | src/scenes/*.js, src/systems/EndgameManager.js | pending |
| 01-01-03 | 01 | 1 | AUDIO-01 | manual | Browser: `_nodes.length === 0` after stop | N/A | pending |
| 01-01-04 | 01 | 1 | AUDIO-01 | manual | Listen: crossfade, no gap or spike | N/A | pending |
| 01-01-05 | 01 | 1 | AUDIO-01 | manual | Listen: restart scene, no volume doubling | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

*No test framework needed. Automated verification uses Node.js static file analysis (fs.readFileSync + string matching) which requires no setup.*

- [x] Task 1 verify: static analysis checks MusicManager.js source for required patterns (setValueCurveAtTime, Math.cos, crossfadeTo, shutdown, cancelScheduledValues) and absence of linearRampToValueAtTime
- [x] Task 2 verify: static analysis scans scene files for scene.start/restart calls and checks preceding 6 lines for MusicManager guard calls

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Equal-power fade curve sounds correct | AUDIO-01 | AudioParam curve requires running AudioContext + human ear | Trigger scene transition, listen for smooth fade without volume dip |
| No zombie AudioNodes after stop | AUDIO-01 | AudioContext node inspection only available in browser DevTools | After scene transition: DevTools -> `window.__musicManager._nodes.length === 0` |
| No volume doubling on restart | AUDIO-01 | Requires human listener to detect phasing | Restart scene 3 times rapidly, verify no volume increase |
| crossfadeTo overlaps smoothly | AUDIO-01 | Crossfade quality is perceptual | Trigger BossScene victory -> CreditsScene transition, verify smooth music overlap |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands (static analysis)
- [x] Sampling continuity: automated check after each task, manual after each wave
- [x] Wave 0 covers all MISSING references (no test framework needed)
- [x] No watch-mode flags
- [x] Feedback latency < 60s (automated < 5s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
