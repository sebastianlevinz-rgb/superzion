---
phase: 1
slug: audio-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual browser + runtime assertions |
| **Config file** | none — no test framework for this phase |
| **Quick run command** | Browser DevTools: `window.__musicManager._nodes.length` |
| **Full suite command** | Manual play-through: menu → 3 level transitions → restart |
| **Estimated runtime** | ~60 seconds (manual) |

---

## Sampling Rate

- **After every task commit:** Manual browser test — play 2-3 scene transitions, verify no abrupt cuts
- **After every plan wave:** Full play-through from menu through at least 3 level transitions
- **Before `/gsd:verify-work`:** Full game play-through verifying all transitions smooth
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | AUDIO-01 | manual | Browser: inspect gain curve during fade | N/A | ⬜ pending |
| 01-01-02 | 01 | 1 | AUDIO-01 | manual | Browser: `_nodes.length === 0` after stop | N/A | ⬜ pending |
| 01-01-03 | 01 | 1 | AUDIO-01 | manual | Listen: restart scene, no volume doubling | N/A | ⬜ pending |
| 01-01-04 | 01 | 1 | AUDIO-01 | manual | Listen: crossfade, no gap or spike | N/A | ⬜ pending |
| 01-01-05 | 01 | 1 | AUDIO-01 | manual-only | Code review: grep scene.start callsites | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — no test framework needed.*

- [ ] Add runtime `console.assert` in `_cleanupNodes()` to verify `_nodes.length === 0` after cleanup (development mode)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Equal-power fade curve sounds correct | AUDIO-01 | AudioParam curve requires running AudioContext + human ear | Trigger scene transition, listen for smooth fade without volume dip |
| No zombie AudioNodes after stop | AUDIO-01 | AudioContext node inspection only available in browser DevTools | After scene transition: DevTools → `window.__musicManager._nodes.length === 0` |
| No volume doubling on restart | AUDIO-01 | Requires human listener to detect phasing | Restart scene 3 times rapidly, verify no volume increase |
| crossfadeTo overlaps smoothly | AUDIO-01 | Crossfade quality is perceptual | Trigger crossfade between 2 themes, verify no silence gap or volume spike |
| All scene.start callsites handle music | AUDIO-01 | Static analysis / code review | `grep -n "scene.start(" src/**/*.js` — each must have music stop/crossfade |

---

## Validation Sign-Off

- [ ] All tasks have manual verify instructions
- [ ] Sampling continuity: manual check after each task
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
