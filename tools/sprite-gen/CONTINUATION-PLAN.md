# SuperZion — AI Graphics Overhaul: Autonomous Continuation Plan

> Read this FIRST when resuming after a context clear. Sebastian's instruction:
> *"Seguí trabajando, ya sabes qué hacer, y no me preguntes nada hasta el final."*
> Goal: **EVERY visible graphic** in the game must use spectacular AI pixel-art
> (Nano Banana / Gemini), not procedural. Audit everything, replace/improve,
> de-tint, verify with screenshots, commit. Do NOT ask questions until done.

Target project: **`superzion/`** (Phaser). NOT `superzion-kaplay/`.
Dev server usually already running at http://localhost:3000/ (else `cd superzion && npm run dev`).

---

## 1. The pipeline (how to make + wire a sprite)

Tool: `tools/sprite-gen/` (Node). API key auto-loads from `tools/sprite-gen/.env` (gitignored).

- **Define** a sprite/bg in `prompts.js` under a group (`SPRITES.<group>`), each entry
  `{ name, size, prompt, ref?, bg?, tile?, tileAlpha?, key?, aspect? }`.
  - `size`: number (square) or `{w,h}`.
  - `ref`: name of a previously-generated raw to pass as a consistency reference.
  - **Post-process modes** (pick one): default = sprite (chroma-key green→transparent,
    trim, contain); `bg:true` = opaque full-frame (use `BG_STYLE`, aspect "16:9");
    `tile:true` = opaque seamless mirror-tile (for scrolling tileSprites);
    `tileAlpha:true` = transparent seamless tile (parallax layers, sky shows through);
    `key:"magenta"` = for GREEN-coloured subjects (green key would erase them — use STYLE_MG).
  - **STYLE** (sprites) adds "single character" → it WILL inject a person. For backgrounds/
    objects/parallax use **BG_STYLE** or a hand-written "NO characters, NO people…" prompt.
- **Generate**: `node generate.js <group> [name]`  (one name, or whole group; `--rest` skips
  already-generated raws). Output → `superzion/public/assets/sprites/<name>.png`.
- **Reprocess** without re-paying: `node reprocess.js <group>`.
- **Integrate**: add the key string to the `AI_SPRITES` array in
  `superzion/src/utils/AISprites.js`. That's it — `BootScene.preload` loads it and
  `aiTexturePatch.js` makes the procedural generator yield to the PNG (it patches
  `addCanvas` to no-op on existing keys and `remove` to refuse deleting AI keys).
  Reverting = remove the key.
- Cost ≈ US$0.04/image. Building: generate one tall image then SLICE it into floor keys
  (see `__natanz_building` → `target_bldg_floor_*` precedent in this repo's history).

## 2. Integrating PROCEDURAL-drawn things (no texture key)

Many visuals are NOT textures — they're drawn each frame with `add.graphics()` /
`SuperZionRenderer` (e.g. heroes/villains in some scenes, the B-2 in B2BomberScene,
the bunker walls, intro symbols, clouds, the victory crowd). For these you must edit the
SCENE CODE to replace the procedural draw with an `add.image(x,y,'ai_key')` (see done
examples: VictoryScene hero → `parade_superzion`; B2BomberScene `_drawB2*` → `b2_top`
sprite with rotation; IntroCinematic `_briefingOverlay` → `cin_tehran` backdrop).

## 3. CRITICAL LESSON — de-tinting

AI sprites LOAD FINE. The reason cinematics looked "old": scenes **tinted** the AI
sprites dark (`setTint(0x666666)` / `0x882222`), killing detail. **Always grep new/edited
scenes for `setTint(0x` on AI image/sprite and remove dark tints** so the art shows full
colour. Already cleaned: GameIntroScene + the 5 *IntroCinematicScene + the 6 briefings.

## 4. Audit method — SCREENSHOT EVERYTHING

Playwright + chromium are installed in `tools/sprite-gen/`. Drive the game, screenshot every
scene, and look for anything still procedural/dim. Example script (adapt navigation —
Space advances, Enter starts a level from the menu; the intro is long, ~10+ Space):
```js
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:960,height:540} });
await p.goto('http://localhost:3000/',{waitUntil:'load'});
await p.waitForTimeout(3000);
for (let i=0;i<N;i++){ await p.keyboard.press('Space'); await p.waitForTimeout(1400);
  await p.screenshot({path:`_s${i}.png`}); }
await b.close();
```
Name temp scripts/pngs with leading `_` (gitignored). Look at the PNGs with Read. There is
a debug 'P' key in some levels that skips to victory (to reach festejos fast).

## 5. THE WORK — audit & upgrade EVERY scene (checklist)

Go scene by scene. For each, screenshot, then replace remaining procedural visuals with AI
(generate + integrate or swap the procedural draw), and de-tint. Sebastian explicitly named:
"la intro, cada avión, cada nube, el búnker, el edificio, todas las cosas — TODO."

Known-still-procedural / to verify (NOT exhaustive — confirm by screenshotting):
- **Intro (GameIntroScene)**: narrative text pages w/ procedural backgrounds; org symbols
  (skull/swords/fist/serpent — small crude); the SUPERZION **title reveal** background
  (procedural sunset/city/water — replace with an AI panorama); the procedural building
  silhouettes & embers; any procedural plane/"auto".
- **MenuScene** (level select): background + the per-level mission **preview thumbnails**
  (procedural mini-scenes) — make AI.
- **Festejos**: VictoryScene (hero is AI; the **surrounding crowd of figures** + giant star
  are procedural → AI), CreditsScene (procedural clouds + scrolling text → AI sky/clouds).
- **Clouds everywhere**: `cloud_layer` is AI in the F-15 level only. Other scenes draw
  procedural clouds (menu, credits, cinematics, B2) → replace with AI cloud parallax.
- **Bomber (F-15) level**: the **bunker** (procedural walls/layers/interior in BomberScene)
  → AI building/bunker art; the boss console scene.
- **Drone level (DroneScene)**: `ruined_city_tile`/`ruined_city_tile_2` (city tiles, use
  tile mode), the drone-level interiors; verify enemies.
- **B-2 level (B2BomberScene)**: backgrounds `night_sky`(done) BUT `city_night`,
  `desert_night`, `mountain_night`, `natanz_mountain` still procedural → AI bg/tile.
  Verify the B-2 sprite orientation/scale looks right in-flight.
- **Boss level (BossScene)**: `beirut_city`/`beirut_ground` parallax (tile), verify
  player_fighter + bunker_fortress.
- **Platformer**: `plt_mountains`, `plt_skyline`, `plt_near_buildings`, roof tiles → AI
  (bg / tileAlpha / tile). Hero+guard already AI.
- **Port/stealth**: tiles `ps_floor`/`ps_water`/`ps_road`/`ps_dock_edge`, `ps_mountains_bg`
  → AI. Chars/props already AI.
- **Bomberman (GameScene)**: tiles `bm_floor`/`bm_wall`/`bm_breakable`/doors, powerups,
  hearts/HUD, explosion FX — Sebastian wants "todo", but tiles must tile (tile mode) and
  tiny UI/FX may look worse in AI; use judgment, prefer AI where it clearly helps.
- **Flags**: improved in procedural code already; they're animated spritesheets so AI is hard.
  Leave unless a clean approach appears.
- **Vehicles / "cada avión"**: ensure every plane/jet/drone/ship in every scene (gameplay,
  cinematics, parade, menu) uses AI art, not procedural.

Effects/tiny-UI: AI often looks worse at 16-32px; for tiles use `tile`/`tileAlpha` mode and
verify seams; for FX/UI use judgment. When something is intentionally left procedural,
note why.

## 6. Verify, commit, deploy

- After each batch: confirm `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/`
  = 200 and the vite log has no errors; screenshot the affected scene.
- Commit in logical batches (graphics feature files + new PNGs; DON'T stage node_modules —
  it's gitignored now). Push to `origin/master`. End commit msgs with the Co-Authored-By line.
- **Live deploy**: Vercel serves the committed `superzion/dist/` statically (empty
  buildCommand). To publish: `cd superzion && npm run build` (copies public/ → dist/),
  then commit `superzion/dist` + push. NOTE: Vercel deploys have shown `state=failure`
  since March (pre-existing) and Deployment Protection (401) is ON — that's Sebastian's
  dashboard issue, not ours. He was offered switching vercel.json to a standard Vite build
  config; pending his OK — don't change it autonomously.

## 7. Current state (as of this handoff)

~140 AI sprites done & integrated: all chars/enemies/bosses/vehicles across every mode,
distinct bosses, national flags (procedural code), F-15 terrain+parallax, Natanz building+
sky, B-2 top-down, title bg, victory hero, 6 level-intro briefing backdrops, de-tinted
cinematics. Bunker return-flight bug fixed. See `AISprites.js` for the exact DONE list and
git log for history. Last commits: de-tint+bunker (28495e7), L1 briefing (f453eef),
5 briefings (0272530).

**Definition of done:** play through the whole game (intro → every level + its cinematic +
its festejo → credits) and nothing looks procedural/old/dim — everything is spectacular AI
pixel-art consistent with the hero & bosses.

---

## 8. Session update (2026-06-15, continuation)

New AI assets generated + integrated this session (group `overhaul` in prompts.js):
- `credits_sky` — Tel Aviv sunrise panorama → CreditsScene backdrop (+ AI cloud_layer
  parallax drift, lighter overlay). Replaced crude grey ellipse clouds.
- Level-select **thumbnails** now reuse existing AI panoramas (cin_tehran /
  cin_lebanon_coast / cin_destroyed_city / cin_natanz / cin_fortress) — MenuScene
  `_drawLevelPreview` reduced to just the border; `_previewImg` carries the art.
- `plt_mountains` / `plt_skyline` / `plt_near_buildings` — DAYTIME sunlit Tehran
  silhouette bands (tileAlpha) for the Platformer parallax. (First gen was night → wrong;
  the platformer is DAY — regenerated.)
- `beirut_city` (tileAlpha war-torn skyline) + `beirut_ground` (tile rubble street) for the
  final BossScene parallax — integrates with the warm beirut_sky.
- Fixed generate.js stale log line (said superzion-kaplay; output is superzion/).
- Rebuilt + committed `superzion/dist` for the live deploy.

**Verified by screenshot, left PROCEDURAL by judgment (detailed/deliberate, NOT crude):**
- DroneScene city = grey building OBSTACLES (gameplay collision); clean readable arcade.
- B2BomberScene = atmospheric top-down night-stealth terrain (ocean→coast→land, faint at
  10 km altitude) — deliberate minimal mood, an elaborate procedural renderer.
- VictoryScene finale = animated procedural sunrise (`_drawSunrise(progress)` redraws
  per-frame) with AI hero + fireworks; warm-tinted clouds animate cohesively. Swapping in
  AI clouds would need a risky refactor of the per-frame redraw — not worth it.
- GameIntro "empire silhouettes" (Babylon/Rome/Swastika-X) are intentionally FAINT
  (alpha 0.2-0.3) thematic symbols on a dark narrative page — not crude foreground sprites.
  Title reveal already uses `__title_bg` (AI).

⚠️ **Pre-existing uncommitted work** (predates this session, untouched by me): a large diff
across superzion scene/util files (BossScene, DroneScene, GameScene, PlatformerScene,
PortSwapScene, Guard, Player, B2/Bomber/Boss/RadarTextures, MusicManager, SoundManager,
EndScreen, LevelConfig…) AND all of superzion-kaplay. Likely Antigravity / a prior session.
Ask Sebastian before committing it — I only committed files I directly authored.
