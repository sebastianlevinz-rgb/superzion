# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Polish Pass

**Shipped:** 2026-03-19
**Phases:** 4 | **Plans:** 7 | **Sessions:** 1

### What Was Built
- Player sprite redesigned as Mossad agent across all 3 texture systems (SpriteGenerator, CinematicTextures, ParadeTextures)
- 4 real boss parade sprites with tween-based super attack animations replacing colored rectangles
- Intro cinematic overhaul: waving flags, golden Maguen David title, diversified SFX, camera shake
- Level 2 container corridors widened for passability
- Shared EndScreen.js with keyboard cleanup across all 7 scenes
- Controls overlay standardized to yellow text on dark background

### What Worked
- All 4 phases planned and executed in a single session — fast turnaround
- Parallel agent execution (2 plans per wave) cut wall-clock time significantly
- Research phase consistently identified existing infrastructure, avoiding unnecessary new code
- Phase 5 checkpoint-based verification caught issues early (Level 2 play-testing)
- Plan checker verification loop caught zero issues — research quality was high enough for clean first-pass plans

### What Was Inefficient
- Some agents hit API connection errors and needed retries (1 researcher agent)
- Planner agent hit usage limits once, requiring resume
- ROADMAP.md plan checkboxes for phases 6-7 weren't updated by executors (still showed `[ ]` despite completion)

### Patterns Established
- Visual-only phases (sprites, cinematics) work well as autonomous plans with build-only verification
- `_spawnExplosion()` pattern: placing effects inside helper methods instead of at call sites is DRY and future-proof
- EndScreen.js `destroy()` pattern: returning cleanup handles from UI modules prevents listener leaks

### Key Lessons
1. Existing infrastructure often covers 80%+ of requirements — research prevents reinventing the wheel
2. Sequential waves are needed when plans touch the same file, even if they're logically independent
3. Panorama texture stubs were needed due to working copy divergence — uncommitted changes can create hidden dependencies

### Cost Observations
- Model mix: ~70% opus (executors, planner), ~30% sonnet (checker, verifier)
- Sessions: 1 (all 4 phases in one conversation)
- Notable: 7 plans executed with only 2 human checkpoints needed (both in Phase 5)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1+ | 1 (3 deferred) | Pivoted from cinematic milestone to polish pass |
| v1.1 | 1 | 4 | Full plan→execute→verify pipeline in single session |

### Top Lessons (Verified Across Milestones)

1. Research-first planning produces clean plans that pass verification on first attempt
2. Shared UI modules with cleanup handles prevent state leaks across scene transitions
