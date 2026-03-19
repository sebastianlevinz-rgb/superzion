# Roadmap: SuperZion

## Milestones

- **v1.0 Cinematic & Audio** - Phases 1-4 (deferred after Phase 1 shipped)
- ✅ **v1.1 Polish Pass** - Phases 5-8 (shipped 2026-03-19)
- ✅ **v1.2 Sprite & Polish v2** - Phases 9-14 (shipped 2026-03-19)
- **v1.3 Narrative & Audio** - Phases 15-20 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 Cinematic & Audio (Phases 1-4) - DEFERRED after Phase 1</summary>

- [x] **Phase 1: Audio Foundation** - Repair MusicManager with fade/crossfade and fix AudioBufferSourceNode leaks
- [ ] **Phase 2: Level Audio** - Author 6 distinct trance themes and per-level ambient layers (DEFERRED)
- [ ] **Phase 3: Cinematic Infrastructure** - Build CinematicDirector, TextureRegistry, and BaseCinematicScene refactor (DEFERRED)
- [ ] **Phase 4: Cinematics and Animation** - Deliver animated intro showcase, between-level sequences, and motion smear (DEFERRED)

</details>

<details>
<summary>v1.1 Polish Pass (Phases 5-8) -- SHIPPED 2026-03-19</summary>

- [x] Phase 5: Standalone Fixes (2/2 plans) -- completed 2026-03-19
- [x] Phase 6: Visual Identity (2/2 plans) -- completed 2026-03-19
- [x] Phase 7: Intro Overhaul (2/2 plans) -- completed 2026-03-19
- [x] Phase 8: End-Screen Standardization (1/1 plan) -- completed 2026-03-19

</details>

<details>
<summary>v1.2 Sprite & Polish v2 (Phases 9-14) -- SHIPPED 2026-03-19</summary>

- [x] Phase 9: Player Organic Drawing (1/1 plan) -- completed 2026-03-19
- [x] Phase 10: Propagate Organic Technique (1/1 plan) -- completed 2026-03-19
- [x] Phase 11: Star & Hard Hat Fixes (1/1 plan) -- completed 2026-03-19
- [x] Phase 12: Intro Axis of Evil Fix (1/1 plan) -- completed 2026-03-19
- [x] Phase 13: Intro Music (1/1 plan) -- completed 2026-03-19
- [x] Phase 14: Logo Enhancement (1/1 plan) -- completed 2026-03-19

</details>

### v1.3 Narrative & Audio

- [ ] **Phase 15: Cinematic Text Engine** - Refactor BaseCinematicScene for page-by-page SPACE/ENTER advancement with blinking indicator and ESC skip
- [ ] **Phase 16: Intro Narrative** - Complete GameIntroScene rewrite with new narrative script
- [ ] **Phase 17: Level Cinematics** - All 6 level intro cinematics + 5 transitions with new narrative
- [ ] **Phase 18: Victory & Tagline** - New VictoryFinalScene + tagline change everywhere
- [ ] **Phase 19: Cinematic Audio** - Music and SFX for all cinematics with mood transitions
- [ ] **Phase 20: Audio Global Audit** - Level music/SFX verification + M key global + zero silence guarantee

## Phase Details

<details>
<summary>v1.0-v1.2 Phase Details (Phases 1-14)</summary>

See `.planning/milestones/` for archived phase details.

</details>

### Phase 15: Cinematic Text Engine
**Goal**: Every cinematic uses page-by-page text advancement controlled by the player
**Depends on**: Nothing (infrastructure phase)
**Requirements**: TEXT-01, TEXT-02, TEXT-03
**Success Criteria** (what must be TRUE):
  1. Pressing SPACE or ENTER advances to the next text page in all cinematics — text never auto-advances
  2. A blinking "► SPACE" indicator is always visible at the bottom of the screen during text pages
  3. Pressing ESC skips the entire cinematic and transitions to the next scene
  4. Typewriter effect still works — text appears character by character, then waits for player input
**Plans**: 1 plan

### Phase 16: Intro Narrative
**Goal**: GameIntroScene tells the complete new story from 3000 years of history through SuperZion's reveal
**Depends on**: Phase 15 (text engine must support page-by-page)
**Requirements**: NARR-01, NARR-02
**Success Criteria** (what must be TRUE):
  1. GameIntroScene displays all narrative pages in order with typewriter effect
  2. Visual scenes match narrative (map of Israel, boss silhouettes, enemy parade, Israel flag, arsenal, SuperZion reveal)
  3. Player advances through each page with SPACE/ENTER
  4. Final page shows SUPERZION title + new subtitle "THEY FIGHT TO CONQUER. WE FIGHT TO EXIST."
**Plans**: 1 plan

### Phase 17: Level Cinematics
**Goal**: Every level has a narrative-driven cinematic intro and transition that tells the war story
**Depends on**: Phase 15 (text engine), Phase 16 (intro sets narrative tone)
**Requirements**: NARR-03, NARR-04
**Success Criteria** (what must be TRUE):
  1. All 6 pre-level cinematics display new narrative text with typewriter effect and SPACE/ENTER advancement
  2. 5 transition cinematics (1→2, 2→3, 3→4, 4→5, 5→6) display post-victory + next-mission narrative
  3. Each cinematic has appropriate visual scenes matching the narrative (panoramas, boss portraits, hero preparations)
  4. ESC skips each cinematic to its target gameplay scene
**Plans**: 1 plan

### Phase 18: Victory & Tagline
**Goal**: The game ends with an epic victory narrative and the new tagline appears everywhere
**Depends on**: Phase 15 (text engine)
**Requirements**: NARR-05, NARR-06
**Success Criteria** (what must be TRUE):
  1. VictoryFinalScene displays complete victory narrative ending with "Am Yisrael Chai"
  2. SUPERZION title and new subtitle appear in victory sequence
  3. Tagline "THEY FIGHT TO CONQUER. WE FIGHT TO EXIST." replaces old tagline in MenuScene, GameIntroScene, VictoryScene, and CreditsScene
  4. Old tagline "ONE SOLDIER. SIX MISSIONS. ZERO MERCY." does not appear anywhere
**Plans**: 1 plan

### Phase 19: Cinematic Audio
**Goal**: Every cinematic has mood-appropriate music and synchronized sound effects
**Depends on**: Phases 16-18 (narratives must exist to score them)
**Requirements**: AUD-01, AUD-02, AUD-03, AUD-04
**Success Criteria** (what must be TRUE):
  1. Intro has psytrance 145+ BPM from frame 1 with dark→heroic→epic mood transitions
  2. All level intro and transition cinematics have background music matching their tone
  3. Typewriter text produces click sound per letter in all cinematics
  4. Boss appearances, explosions, and visual impacts have synchronized sound effects
**Plans**: 1 plan

### Phase 20: Audio Global Audit
**Goal**: Zero silence anywhere in the game — every scene has audio, every action has sound
**Depends on**: Phase 19 (cinematic audio must be in place)
**Requirements**: AUD-05, AUD-06, AUD-07, AUD-08, AUD-09
**Success Criteria** (what must be TRUE):
  1. All 6 gameplay levels have background music playing continuously
  2. All player actions (move, jump, shoot, bomb, interact) have sound effects
  3. All enemy actions (patrol, alert, shoot, die) have sound effects
  4. Victory sequence has epic music with climax at "Am Yisrael Chai"
  5. M key mute/unmute works in every scene (menu, cinematics, gameplay, victory, credits)
  6. No screen in the entire game is silent — verified from intro through credits
**Plans**: 1 plan

## Progress

**Execution Order:**
Phases execute in numeric order: 15 -> 16 -> 17 -> 18 -> 19 -> 20

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Audio Foundation | v1.0 | 1/1 | Complete | 2026-03-05 |
| 2-4. (Deferred) | v1.0 | 0/TBD | Deferred | - |
| 5-8. Polish Pass | v1.1 | 7/7 | Complete | 2026-03-19 |
| 9-14. Sprite & Polish v2 | v1.2 | 6/6 | Complete | 2026-03-19 |
| 15. Cinematic Text Engine | v1.3 | 0/1 | Not started | - |
| 16. Intro Narrative | v1.3 | 0/1 | Not started | - |
| 17. Level Cinematics | v1.3 | 0/1 | Not started | - |
| 18. Victory & Tagline | v1.3 | 0/1 | Not started | - |
| 19. Cinematic Audio | v1.3 | 0/1 | Not started | - |
| 20. Audio Global Audit | v1.3 | 0/1 | Not started | - |
