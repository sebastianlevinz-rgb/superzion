# Phase 6: Visual Identity - Research

**Researched:** 2026-03-19
**Domain:** Procedural pixel-art sprite generation via Canvas 2D API (Phaser 3.80.1 game)
**Confidence:** HIGH

## Summary

Phase 6 addresses two visual identity problems: (1) the player character ("SuperZion") has inconsistent appearance across three separate sprite-generation systems and (2) the intro boss parade uses placeholder colored rectangles instead of the detailed boss sprites already available in ParadeTextures.js.

The player sprite exists in three independent implementations: **SpriteGenerator.js** (gameplay, 128x128 frames with full tactical Mossad agent), **CinematicTextures.js** (cutscenes, 64x96 side-view with incorrect kippah and green tactical colors), and **ParadeTextures.js** (intro parade, 96x160 front-view with mostly correct styling but dark brown hair and rifle). The SpriteGenerator already has the target design (black tactical suit, slicked-back hair, beard shadow, gold Star of David). CinematicTextures is the most outdated: it still draws a kippah (blue dome), uses green tactical colors (#3a5530 range), and is missing the beard shadow entirely. The BombermanTextures.js (32x32 top-down Level 1) also has the `kippah: true` flag name but was already updated to draw slicked-back hair instead.

For the boss parade, GameIntroScene._bossFlashEntry() draws generic colored rectangles (30x55px body + circle head) with red glowing eyes, completely ignoring the four detailed boss sprites (parade_foambeard, parade_turboturban, parade_warden, parade_supremeturban) that already exist in ParadeTextures.js. The fix is straightforward: replace the graphics-based boss rendering with the existing parade sprite textures, and add the fourth boss (Supreme Turban) who is currently missing from the intro sequence.

**Primary recommendation:** Align CinematicTextures to match SpriteGenerator's palette/design, adjust ParadeTextures for minor consistency tweaks, then replace GameIntroScene._bossFlashEntry() to use real parade sprites with animated super-attack effects.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIS-01 | Player sprite displays as Mossad agent (tactical black suit, slicked-back hair, beard shadow, Maguen David) consistently across SpriteGenerator, CinematicTextures, and ParadeTextures | Detailed audit of all 3 systems below identifies exact color/shape divergences and prescribes unified palette |
| VIS-02 | Intro boss parade shows 4 real boss sprites (Foam Beard, Turbo Turban, The Warden, Supreme Turban) performing super attacks, not colored rectangles | Analysis of GameIntroScene._bossFlashEntry() shows it draws primitive rectangles; ParadeTextures already has all 4 detailed boss sprites ready to use |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser | 3.80.1 | Game framework, scene/texture management | Already in use, all sprites registered via scene.textures.addCanvas() |
| Canvas 2D API | Browser native | Procedural sprite drawing | All sprites are 100% programmatic, no image files |
| Vite | 5.4.x | Build tool / dev server | Already configured, hot reload for visual iteration |

### Supporting
No additional libraries needed. All work is pure Canvas 2D drawing code within existing files.

## Architecture Patterns

### Texture System Architecture
```
Texture Systems (each generates sprites independently):
src/utils/
  SpriteGenerator.js      # Gameplay: 128x128 spritesheet, 13 frames, 'superzion' key
  CinematicTextures.js    # Cutscenes: 64x96 single frame, 'cin_superzion' key
                          #            128x128 silhouette, 'cin_superzion_cliff' key
  ParadeTextures.js       # Intro: 96x160 single frame, 'parade_superzion' key
                          #        Boss sprites: parade_foambeard/turboturban/warden/supremeturban
  BombermanTextures.js    # Level 1 top-down: 32x32, 'bm_player_*' keys (already aligned)
```

### Pattern 1: Shared Color Palette Constants
**What:** Extract the "canonical" player palette into a shared constant object used by all texture generators.
**When to use:** When 3+ files need the same color values.
**Why NOT to use here:** The texture files are standalone modules with no shared imports between them. Adding a shared module would create a new dependency for a one-time alignment. Instead, manually synchronize the palette values across the 3 files. The total surface area is small (3 palette definitions).

**Recommended approach:** Copy the SpriteGenerator.js PAL object's relevant values into CinematicTextures.js and verify ParadeTextures.js matches. Document the canonical colors in code comments.

### Pattern 2: Existing Sprite Registration
**What:** Each texture file uses `scene.textures.addCanvas(key, canvas)` to register.
**When to use:** All sprite creation follows this pattern.
**Critical detail:** Each function guards with `if (scene.textures.exists(key)) return;` to prevent duplicate registration. When modifying sprites, the texture key must remain identical to avoid breaking all consumer scenes.

### Anti-Patterns to Avoid
- **Changing texture keys:** Many scenes reference 'cin_superzion', 'parade_superzion', etc. by hardcoded string. Renaming breaks everything.
- **Changing canvas dimensions:** CinematicTextures uses 64x96 for cin_superzion. Scenes position/scale based on these dimensions. Changing size requires auditing all scale/position values in consumer scenes.
- **Adding new dependencies between texture modules:** Importing SpriteGenerator from CinematicTextures creates circular dependency risk since scenes may import both.
- **Trying to reuse SpriteGenerator's drawOperativeFrame in cinematics:** It draws front-facing at 128x128. Cinematics need side-view at 64x96. The geometry is fundamentally different; just align the colors and design elements.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sprite animation in intro | Custom tween animation code for boss attacks | Phaser tweens + existing sprite system | Phaser's tween API handles scale, rotation, alpha, position with easing |
| Color palette sharing | Shared color module with imports | Inline palette constants with alignment comments | 3 files is not enough to justify a shared dependency |
| Outline rendering | Manual pixel-by-pixel outline in every texture | SpriteGenerator's applyOutline() approach (imageData scan) | Already proven in SpriteGenerator; can be copied to ParadeTextures if needed |

## Common Pitfalls

### Pitfall 1: CinematicTextures Kippah Removal
**What goes wrong:** CinematicTextures draws a blue kippah dome (PAL.kip1 = '#1a237e') on the head. Removing it and adding slicked-back hair changes the head's vertical extent, which can make the sprite look "headless" or float at incorrect Y positions.
**Why it happens:** The kippah added visual mass at the top of the head. Removing it without adjusting the hair region leaves a gap.
**How to avoid:** When removing the kippah arc, add a flat slicked-back hair ellipse at the same vertical position. The hair should be dark (#0e0e0e to #1a1816) and sit flat, like SpriteGenerator's drawHead().
**Warning signs:** Top of head looks like bare skin instead of hair.

### Pitfall 2: Color Space Between Gameplay and Cinematic Contexts
**What goes wrong:** SpriteGenerator uses BLACK tactical suit (#1a1a1a - #3a3a3a) while CinematicTextures uses GREEN tactical (#3a5530 - #7a9a72). Simply changing colors in CinematicTextures may make the character too dark to see against dark cinematic backgrounds.
**Why it happens:** Cinematics have much darker backgrounds (night scenes, dark interiors) where a dark-suited character vanishes.
**How to avoid:** Use the same black palette but add more vest/harness contrast (#4e4e52 - #626266 range). The vest highlights provide enough contrast against dark backgrounds. Also, the gold Star of David and skin tones provide recognizable contrast.
**Warning signs:** Character becomes an invisible dark blob against dark cinematic backgrounds.

### Pitfall 3: Intro Boss Sprites Not Appearing
**What goes wrong:** GameIntroScene generates all parade textures via generateAllParadeTextures(this) at create(), but _bossFlashEntry() ignores them and draws graphics primitives instead.
**Why it happens:** The boss entry was written before the parade sprites existed, and was never updated.
**How to avoid:** Replace the graphics drawing in _bossFlashEntry() with `this.add.sprite(x, y, 'parade_foambeard')` (and similar for each boss). Since generateAllParadeTextures() runs first in create(), the textures are already available.
**Warning signs:** If generate function is not called before boss entry, texture won't exist and Phaser shows a green rectangle placeholder.

### Pitfall 4: Missing Fourth Boss in Intro
**What goes wrong:** GameIntroScene Act 1 only shows 3 bosses (Foam Beard at 1.5s, Turbo Turban at 3.5s, The Warden at 5.5s). Supreme Turban is missing entirely.
**Why it happens:** The intro was likely written before the Supreme Turban boss was implemented.
**How to avoid:** Add a 4th boss entry. There's ~1.5s spacing between each boss. Options: (a) add at ~7s before the Act 1->2 transition at 7.5s, or (b) compress the existing timings (1.2s, 2.7s, 4.2s, 5.7s) to fit 4 bosses in the same window.
**Warning signs:** Only 3 bosses appear; requirement says 4.

### Pitfall 5: Boss "Super Attack" Animation Ambiguity
**What goes wrong:** VIS-02 says bosses should perform "their super attacks" but the parade sprites are static (single frame, no animation).
**Why it happens:** ParadeTextures uses staticSprite() which creates single-frame textures, not spritesheets.
**How to avoid:** "Super attack animation" should be achieved with Phaser tween effects on the existing static sprites: scale pulses, color tinting, particle/projectile spawns from the boss position, and screen shake. This is consistent with how the intro already works (everything is tweened, not frame-animated).
**Warning signs:** Trying to create multi-frame boss spritesheets would be massive scope creep.

## Code Examples

### Current State: SpriteGenerator PAL (canonical, target design)
```javascript
// Source: superzion/src/utils/SpriteGenerator.js lines 9-47
const PAL = {
  skin0: '#8a6040', skin1: '#b08657', skin2: '#c49668',
  skin3: '#d2a679', skin4: '#e0b689',
  hair0: '#0a0a0a', hair1: '#111110', hair2: '#1a1816', hair3: '#22201c',
  tac0: '#1a1a1a', tac1: '#222222', tac2: '#2a2a2a', tac3: '#333333', tac4: '#3a3a3a',
  vest0: '#3a3a3e', vest1: '#444448', vest2: '#4e4e52', vest3: '#58585c', vest4: '#626266',
  blk0: '#121212', blk1: '#1a1a1a', blk2: '#222222', blk3: '#2a2a2a',
  boot0: '#0e0e0e', boot1: '#141414', boot2: '#1a1a1a',
  gld0: '#806010', gld1: '#a07a18', gld2: '#c49520', gld3: '#FFD700', gld4: '#eab530',
  eyeWhite: '#eeeee8', eyeIris: '#3a2818', eyePupil: '#0e0e0e', eyeGlow: '#ffffff',
  stubble: 'rgba(30, 22, 16, 0.25)',
  mouthLine: '#6a4030',
  outline: '#0a0a0a',
};
```

### Current State: CinematicTextures PAL (OUTDATED, needs alignment)
```javascript
// Source: superzion/src/utils/CinematicTextures.js lines 5-15
const PAL = {
  skin0: '#8a6040', skin1: '#b08657', skin2: '#c49668',
  skin3: '#d2a679', skin4: '#e0b689',
  kip0: '#0e1445', kip1: '#1a237e', kip2: '#283593',  // REMOVE: kippah colors
  tac0: '#3a5530', tac1: '#4a6840', tac2: '#5a7a50',  // WRONG: green, should be black
  tac3: '#6a8a62', tac4: '#7a9a72',                     // WRONG: green, should be black
  vest0: '#5a5a60', vest1: '#6a6a70', vest2: '#7a7a80', // OK-ish, close
  blk0: '#2a2018', blk1: '#3a3028', blk2: '#4a4038', blk3: '#5a5048', // WRONG: brown, should be dark
  gld0: '#806010', gld1: '#a07a18', gld2: '#c49520', gld3: '#daa520', gld4: '#eab530', // OK
};
```

### Key Divergences Summary

| Attribute | SpriteGenerator (CORRECT) | CinematicTextures (WRONG) | ParadeTextures |
|-----------|--------------------------|---------------------------|----------------|
| **Hair** | Slicked-back, jet black (#0a0a0a) | Blue kippah (#1a237e) | Dark brown (#1c1610), labeled "slicked-back" |
| **Suit body** | Black tactical (#1a1a1a-#3a3a3a) | Green tactical (#3a5530-#7a9a72) | Dark charcoal (#2a2a2a) - OK |
| **Vest** | Dark gray (#3a3a3e-#626266) | Similar gray (#5a5a60-#7a7a80) | Gray (#6a6a70) - OK |
| **Boots/gloves** | Near-black (#0e0e0e-#2a2a2a) | Brown (#2a2018-#5a5048) | Brown (#2a1810) - needs darkening |
| **Beard/stubble** | rgba(30,22,16,0.25) scattered dots | Missing entirely | Dark scattered dots (#2a2018) - present |
| **Star of David** | Gold, drawn with drawStar() | Gold stroke outline | Gold, drawn with starOfDavid() - OK |
| **Canvas size** | 128x128 | 64x96 (side-view) | 96x160 (front-view, larger) |
| **Outline** | 1px dark silhouette via applyOutline() | None | None |

### Target: Boss Entry with Real Sprites (pattern for GameIntroScene fix)
```javascript
// Replace _bossFlashEntry graphics with real parade sprites
// Example for Boss 1 (Foam Beard):
_bossEntry(x, y, spriteKey, label, attackFn) {
  // Flash circle (keep existing)
  const flash = this.add.circle(x, y, 10, 0xffffff, 0.8).setDepth(40);
  this.actObjects.push(flash);
  this.tweens.add({
    targets: flash, alpha: 0, scale: 8,
    duration: 300, ease: 'Cubic.easeOut',
  });

  // Real boss sprite instead of colored rectangle
  const boss = this.add.sprite(x, y - 20, spriteKey).setDepth(15).setScale(1.2).setAlpha(0);
  this.actObjects.push(boss);
  this.tweens.add({ targets: boss, alpha: 1, duration: 400 });

  // "Super attack" animation via tweens
  if (attackFn) attackFn(this, boss, x, y);

  // Label (keep existing pattern)
  // ...
}
```

### Target: Boss Attack Effect Examples
```javascript
// Foam Beard: suitcase bomb thrown forward
// Turbo Turban: pointing finger with energy beam
// The Warden: raised fist slam with shockwave
// Supreme Turban: staff crescent glow + dark energy wave
// All implemented as Phaser graphics + tweens, no new spritesheets needed
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Blue kippah headwear | Slicked-back black hair | Already done in SpriteGenerator + BombermanTextures | CinematicTextures NOT updated yet |
| Green tactical suit | Black tactical suit | Already done in SpriteGenerator | CinematicTextures NOT updated yet |
| No beard/stubble | Scattered stubble dots | Already done in SpriteGenerator | CinematicTextures + ParadeTextures partially done |
| Placeholder boss graphics | Detailed boss parade sprites | ParadeTextures already has them | GameIntroScene NOT updated to use them |

**The design has already evolved in SpriteGenerator. The work is propagating those changes to CinematicTextures and wiring up GameIntroScene.**

## Detailed Audit: Files to Modify

### 1. CinematicTextures.js - createSuperZionCinematic() [VIS-01]
**What to change:**
- Replace PAL.kip0/kip1/kip2 colors with hair0/hair1/hair2 (jet black)
- Replace PAL.tac0-tac4 green values with black tactical values
- Replace PAL.blk0-blk3 brown values with near-black values
- Remove kippah arc drawing (line 31-32)
- Add slicked-back hair (flat dark ellipse at top of head)
- Add stubble/beard shadow dots on lower face
- The 64x96 canvas size stays the same (scenes depend on it)

### 2. CinematicTextures.js - createSuperZionOnCliff() [VIS-01]
**What to change:**
- Remove kippah arc drawing (line 436-437)
- This is a dark silhouette (#0a0804) so colors don't matter much
- But the head shape should be flat-topped (no dome) for consistency
- Add subtle gold Star of David glow (already present - verify it matches)

### 3. ParadeTextures.js - createSuperZionParade() [VIS-01]
**What to change (minor):**
- Hair color from '#1c1610' (dark brown) to '#0e0e0e' (jet black) to match
- Boot color from '#2a1810'/'#1a1008' (brown) to '#0e0e0e'/'#121212' (near-black)
- Glove color from '#3a3028' to '#222222' (dark black tactical)
- Everything else (beard, Star of David, tactical suit) is already correct or close enough

### 4. GameIntroScene.js - _bossFlashEntry() [VIS-02]
**What to change:**
- Replace the colored-rectangle boss body with this.add.sprite() using parade keys
- Add a 4th boss entry (Supreme Turban, SUPREME LEADER label) at appropriate timing
- Add per-boss "super attack" tween animations:
  - **Foam Beard:** scale pulse + thrown projectile graphic
  - **Turbo Turban:** pointing arm glow + energy beam toward camera
  - **The Warden:** raised fist slam + shockwave circle expansion
  - **Supreme Turban:** staff glow pulse + dark energy ring expansion

### 5. BombermanTextures.js - drawCharacter() [VIS-01 - ALREADY DONE]
**Status:** Already aligned. The `kippah: true` flag now draws slicked-back hair (#0e0e0e), not a kippah dome. Black tactical suit (#222222 body, #333333 vest), stubble dots, gold Star of David. No changes needed.

## Consumer Scene Audit (no changes needed)

These scenes consume the texture keys but need no modification as long as keys and canvas sizes remain unchanged:

| Scene | Texture Used | Scale | Notes |
|-------|-------------|-------|-------|
| MenuScene | cin_superzion_cliff | 1.5 | Silhouette on cliff |
| IntroCinematicScene | cin_superzion | 1.8 | Side-view character |
| BeirutIntroCinematicScene | cin_superzion | 1.6 | Side-view character |
| DeepStrikeIntroCinematicScene | cin_superzion | 0.9 | Side-view character |
| MountainBreakerIntroCinematicScene | cin_superzion | 0.6 | Side-view character |
| UndergroundIntroCinematicScene | cin_superzion | 1.2 | Side-view character |
| LastStandCinematicScene | cin_superzion | 2.0 | Side-view character |
| ExplosionCinematicScene | superzion (SpriteGenerator) | 1.0 | Gameplay sprite reused |
| GameIntroScene | parade_superzion | 2.0 | Act 3 hero walk-in |
| GameScene (Level 1) | bm_player_* | 1.0 | Top-down gameplay |

## Open Questions

1. **Boss "super attack" visual scope**
   - What we know: VIS-02 says "performing their super attacks"
   - What's unclear: How elaborate should the attack animations be? Simple tween effects (scale, glow, projectile) vs. complex multi-step choreography
   - Recommendation: Keep it simple -- 2-3 second tween sequence per boss. A scale pulse, a projectile/beam graphic spawned and tweened, and a flash/shake. This matches the existing intro's visual language.

2. **Silhouette readability at 32-48px rendered height**
   - What we know: Success criteria #3 says sprite must "read clearly at game-scale rendered sizes (32-48px height)"
   - What's unclear: The SpriteGenerator canvas is 128x128 but rendered at varying scales. At 32px, fine details (stubble dots, stitching) will be invisible.
   - Recommendation: Focus on silhouette contrast (dark suit vs. skin tone head vs. gold star). The existing SpriteGenerator already has good silhouette due to applyOutline(). No changes needed for readability -- just verify after alignment that the cinematic/parade versions also read well at their rendered sizes.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Puppeteer 24.x (already installed) + Playwright 1.58.x |
| Config file | none -- no existing test infrastructure |
| Quick run command | `cd superzion && npx vite build` (validates no JS errors) |
| Full suite command | `cd superzion && npx vite build && npx vite preview` (build + serve for visual check) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Player sprite consistent across 3 texture systems | manual-visual | Build succeeds + visual screenshot comparison | N/A -- visual inspection |
| VIS-02 | Boss parade shows 4 real sprites with attacks | manual-visual | Build succeeds + run intro to verify | N/A -- visual inspection |

**Justification for manual-only:** All sprites are procedurally generated via Canvas 2D. Automated pixel-comparison testing would require a headless browser rendering pipeline that does not exist. The build succeeding confirms no JS errors; visual correctness requires human inspection of the rendered game.

### Sampling Rate
- **Per task commit:** `cd superzion && npx vite build` (confirms no syntax/import errors)
- **Per wave merge:** Launch dev server, run through intro, verify sprites visually
- **Phase gate:** Full visual walkthrough of intro sequence + one gameplay level

### Wave 0 Gaps
None -- no automated test infrastructure is needed for this visual-only phase. Build validation is sufficient to catch code errors.

## Sources

### Primary (HIGH confidence)
- Direct source code audit of all 4 texture files (SpriteGenerator.js, CinematicTextures.js, ParadeTextures.js, BombermanTextures.js)
- Direct source code audit of GameIntroScene.js (boss entry rendering)
- Direct source code audit of all 10 consumer scenes that use the texture keys
- GDD_SUPERZION_COMPLETE.md character descriptions (sections 3.1-3.5)

### Secondary (MEDIUM confidence)
- REQUIREMENTS.md for VIS-01 and VIS-02 definitions
- ROADMAP.md for Phase 6 success criteria

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed, all work is Canvas 2D in existing files
- Architecture: HIGH - complete audit of all 4 texture systems and 10+ consumer scenes
- Pitfalls: HIGH - identified from actual code analysis, not speculation

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable codebase, no external dependencies changing)
