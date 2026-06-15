// ===================================================================
// Sprite prompt specs for Nano Banana (gemini-2.5-flash-image)
// ===================================================================
//
// Each sprite is generated on a flat CHROMA key background that the
// post-processor removes to transparency. We generate large + crisp,
// then downscale with nearest-neighbour for clean pixel-art edges.
//
// `ref` = name of a previously-generated sprite to pass back in as a
// reference image, so Nano Banana keeps the character consistent
// across poses (its main strength).

export const KEY_COLOR = "#00FF00"; // chroma key (bright green)

// Shared art-direction text glued onto every prompt.
const STYLE = [
  "16-bit retro pixel-art game sprite",
  "single character, full body, centered, clean readable pixels",
  "crisp hard-edged shading, limited palette, subtle dithering",
  "bold dark outline around the character",
  "no text, no watermark, no UI, no border, no extra characters",
  `solid flat pure ${KEY_COLOR} green background, no gradient, no ground shadow`,
].join(", ");

// Same style but on a MAGENTA background — for green-coloured subjects that
// would otherwise be chroma-keyed away against green. Use with key: "magenta".
const STYLE_MG = STYLE.replace(
  `solid flat pure ${KEY_COLOR} green background, no gradient, no ground shadow`,
  "solid flat pure magenta #FF00FF background, no gradient, no ground shadow"
);

// Style for full-screen BACKGROUNDS — fills the frame, no transparency, no chars.
const BG_STYLE = [
  "16-bit retro pixel-art video-game background scenery",
  "fills the ENTIRE frame edge to edge, wide 16:9 landscape composition",
  "NO characters, NO people, NO creatures, NO text, NO watermark",
  "NO border, NO frame, NO picture-frame, NO vignette, not a framed painting",
  "detailed pixel art, limited palette",
].join(", ");

// ── HERO: olive-green Israeli soldier, light skin, blue kippah w/ Star of David ──
const HERO_BASE =
  "a brave heroic young soldier, olive-green military uniform with belt and " +
  "boots, light skin tone, short dark hair, a blue knitted kippah (skullcap) " +
  "with a small golden Star of David, determined friendly expression, " +
  "detailed pixel art, top-down-ish 2.5D arcade view";

function hero(dir, frame) {
  const view = {
    down: "facing the camera (front view), we see his face",
    up: "seen from behind (back view), back of head and kippah visible",
    left: "facing left (side profile, walking left)",
    right: "facing right (side profile, walking right)",
  }[dir];
  const pose =
    frame === 0
      ? "standing still, legs together, idle pose"
      : "mid-stride walking, one leg forward, clear walk-cycle pose";
  return `${STYLE}. Sprite of ${HERO_BASE}, ${view}, ${pose}.`;
}

// ── ENEMY SOLDIERS (top-down, 4 dirs x 2 frames) ──
// Generic fictional enemy soldiers — NOT the hero (no kippah/star).
function enemySoldier(dir, frame, variant) {
  const colors = {
    patrol:
      "all-BLACK loose militant fatigues and a black chest rig/vest, " +
      "a BLACK balaclava face-mask covering the whole face (only the eyes show), " +
      "a GREEN militant headband tied around the forehead, NO beret, NO cap, scruffy irregular (NOT a clean uniform)",
    chaser:
      "dark grey-and-black tactical militant gear with a black load-bearing vest, " +
      "a BLACK balaclava face-mask (only the eyes show), a RED militant headband, more aggressive looking, NO beret",
  }[variant];
  const base =
    `a militant enemy fighter, ${colors}, holding a rifle, ` +
    "clearly NOT an Israeli soldier — NO olive-green clean uniform, NO blue kippah, NO Star of David, " +
    "menacing, detailed pixel art, top-down-ish 2.5D arcade view";
  const view = {
    down: "facing the camera (front view)",
    up: "seen from behind (back view)",
    left: "facing left (side profile, walking left)",
    right: "facing right (side profile, walking right)",
  }[dir];
  const pose = frame === 0 ? "standing alert, idle" : "mid-stride walking, one leg forward";
  return `${STYLE}. Sprite of ${base}, ${view}, ${pose}.`;
}

// ── BOMBERMAN BOSS "Foam Beard" — wild-white-bearded militia commander ──
// Signature trait: an ENORMOUS wild foamy white beard.
const BOSS1_BASE =
  "a cartoon militia-commander villain boss, stocky figure, with an ENORMOUS " +
  "wild bushy foamy WHITE beard covering his chest, olive-green military field " +
  "fatigues, a black-and-white checkered keffiyeh scarf, no turban, " +
  "exaggerated comic villain proportions, front view facing camera, " +
  "detailed pixel art arcade boss";

function boss1(state) {
  const s = {
    normal: "stern threatening expression, arms crossed",
    angry: "furious shouting expression, red-faced, fists raised, leaning forward",
    dead: "defeated, dizzy with spinning stars, slumped over, comical knockout",
  }[state];
  return `${STYLE}. Boss sprite of ${BOSS1_BASE}, ${s}.`;
}

// ── PLATFORMER (side-scroller, facing right, 64px) ──
function pltHero(pose) {
  const p = {
    idle: "standing still, side profile facing right, idle stance, rifle lowered",
    run0: "running to the right, side view, legs in mid-stride pose A",
    run1: "running to the right, side view, legs passing/contact pose B",
    run2: "running to the right, side view, legs in mid-stride pose C",
    run3: "running to the right, side view, legs extended reach pose D",
    jump: "jumping, side profile facing right, legs tucked, mid-air leap",
  }[pose];
  return `${STYLE}. Sprite of ${HERO_BASE}, ${p}.`;
}

function pltGuard(frame) {
  const p = [
    "standing alert, side profile facing right",
    "walking right, side view, leg forward pose A",
    "walking right, side view, mid-stride pose B",
    "walking right, side view, leg back pose C",
  ][frame];
  const base =
    "a militant enemy fighter in all-BLACK loose fatigues with a black chest vest, " +
    "a BLACK balaclava face-mask (only the eyes show), a GREEN headband on the forehead, " +
    "holding a rifle, clearly NOT an Israeli soldier — NO olive-green uniform, NO kippah, NO beret, detailed pixel art";
  return `${STYLE}. Sprite of ${base}, ${p}.`;
}

// ── PORT SWAP (top-down stealth, 32px, 4 dirs x 2 frames) ──
const PORT_VIEWS = {
  down: "facing the camera (front view)",
  up: "seen from behind (back view)",
  left: "facing left (side profile)",
  right: "facing right (side profile)",
};
function portChar(dir, frame, desc) {
  const pose = frame === 0 ? "standing, idle" : "mid-stride walking, one leg forward";
  return `${STYLE}. Sprite of ${desc}, ${PORT_VIEWS[dir]}, ${pose}, top-down-ish 2.5D arcade view.`;
}
const PORT_PLAYER = HERO_BASE + ", DISGUISED as a dock worker wearing a yellow hard-hat and bright orange hi-vis safety vest over his uniform";
const PORT_GUARD = "a security guard enemy, dark navy-blue uniform, peaked cap, holding a rifle and a flashlight, menacing";
const PORT_WORKER = "a civilian port dock worker, plain work clothes, white hard-hat, orange-yellow hi-vis vest, neutral";

// ── AIR COMBAT: vehicles, drone-level enemies, boss "Turbo Turban" ──
const VEH = {
  f15: "a sleek F-15 fighter jet, side view facing right, grey military jet, swept wings, twin tails, glowing afterburner exhaust",
  b2: "a B-2 Spirit stealth bomber in a dramatic low banked 3/4 rear view flying right — the unmistakable smooth dark-grey FLYING-WING shape with NO tail and NO fuselage, a single seamless blended wing, sharp pointed nose, long swept wings, a jagged W-shaped sawtooth trailing edge, a low cockpit bulge near the nose, faint blue engine glow, sleek and menacing",
  drone: "a military quad-rotor combat drone seen from directly above (top-down), four rotors, central camera, dark grey",
  carrier: "a massive naval aircraft carrier, side view, long grey flight deck, control tower island, military warship",
};
function vehicle(which) {
  return `${STYLE}. Sprite of ${VEH[which]}, sharp detailed pixel art, side-scroller game asset.`;
}

// Turbo Turban — signature trait: a COMICALLY OVERSIZED black turban.
const TURBAN_BASE =
  "a cartoon cleric villain boss, round figure wearing a COMICALLY ENORMOUS oversized " +
  "BLACK turban (the turban is huge, the joke of the character), a brown clerical robe, " +
  "round glasses, a thick grey-black beard, exaggerated comic-villain proportions, " +
  "front view, detailed pixel art arcade boss";
function turban(state) {
  const s = state === "yell"
    ? "furious, mouth open shouting, both arms raised in rage"
    : "stern menacing expression, arms at sides";
  return `${STYLE}. Boss sprite of ${TURBAN_BASE}, ${s}.`;
}

function droneGuard(state) {
  const base = "a tactical enemy guard soldier seen from above (top-down), dark combat gear, helmet, holding a rifle";
  const s = state === "shoot" ? "firing the rifle, muzzle flash" : "standing alert, idle";
  return `${STYLE}. Sprite of ${base}, ${s}, top-down view.`;
}
function turret(state) {
  const s = {
    idle: "powered down, barrel lowered, calm",
    alert: "alerted, red warning light glowing, barrel raised",
    shoot: "firing, muzzle flash at the barrel tip",
  }[state];
  return `${STYLE}. Sprite of an automated mounted gun turret seen from above (top-down), armored base, rotating gun barrel, ${s}, detailed pixel art.`;
}

// ── PARADE + FINAL BOSS + CINEMATICS ──
const sprite = (desc) => `${STYLE}. Sprite of ${desc}, detailed pixel art game asset.`;
const sideVeh = (desc) => `${STYLE}. Sprite of ${desc}, side view facing right, detailed pixel art vehicle.`;

// ── The full job list ──
// size = target output px (matches the procedural canvas so it's a drop-in)
export const SPRITES = {
  // Bomberman hero (8 poses) — DONE
  hero: [
    { name: "bm_player_down_0", size: 32, prompt: hero("down", 0) },
    { name: "bm_player_down_1", size: 32, prompt: hero("down", 1), ref: "bm_player_down_0" },
    { name: "bm_player_up_0", size: 32, prompt: hero("up", 0), ref: "bm_player_down_0" },
    { name: "bm_player_up_1", size: 32, prompt: hero("up", 1), ref: "bm_player_up_0" },
    { name: "bm_player_left_0", size: 32, prompt: hero("left", 0), ref: "bm_player_down_0" },
    { name: "bm_player_left_1", size: 32, prompt: hero("left", 1), ref: "bm_player_left_0" },
    { name: "bm_player_right_0", size: 32, prompt: hero("right", 0), ref: "bm_player_down_0" },
    { name: "bm_player_right_1", size: 32, prompt: hero("right", 1), ref: "bm_player_right_0" },
  ],

  // Bomberman enemies — patrol (green) + chaser (red), 8 poses each
  bm_enemies: [
    { name: "bm_patrol_down_0", size: 32, prompt: enemySoldier("down", 0, "patrol"), ref: "bm_player_down_0" },
    { name: "bm_patrol_down_1", size: 32, prompt: enemySoldier("down", 1, "patrol"), ref: "bm_patrol_down_0" },
    { name: "bm_patrol_up_0", size: 32, prompt: enemySoldier("up", 0, "patrol"), ref: "bm_patrol_down_0" },
    { name: "bm_patrol_up_1", size: 32, prompt: enemySoldier("up", 1, "patrol"), ref: "bm_patrol_up_0" },
    { name: "bm_patrol_left_0", size: 32, prompt: enemySoldier("left", 0, "patrol"), ref: "bm_patrol_down_0" },
    { name: "bm_patrol_left_1", size: 32, prompt: enemySoldier("left", 1, "patrol"), ref: "bm_patrol_left_0" },
    { name: "bm_patrol_right_0", size: 32, prompt: enemySoldier("right", 0, "patrol"), ref: "bm_patrol_down_0" },
    { name: "bm_patrol_right_1", size: 32, prompt: enemySoldier("right", 1, "patrol"), ref: "bm_patrol_right_0" },
    { name: "bm_chaser_down_0", size: 32, prompt: enemySoldier("down", 0, "chaser"), ref: "bm_patrol_down_0" },
    { name: "bm_chaser_down_1", size: 32, prompt: enemySoldier("down", 1, "chaser"), ref: "bm_chaser_down_0" },
    { name: "bm_chaser_up_0", size: 32, prompt: enemySoldier("up", 0, "chaser"), ref: "bm_chaser_down_0" },
    { name: "bm_chaser_up_1", size: 32, prompt: enemySoldier("up", 1, "chaser"), ref: "bm_chaser_up_0" },
    { name: "bm_chaser_left_0", size: 32, prompt: enemySoldier("left", 0, "chaser"), ref: "bm_chaser_down_0" },
    { name: "bm_chaser_left_1", size: 32, prompt: enemySoldier("left", 1, "chaser"), ref: "bm_chaser_left_0" },
    { name: "bm_chaser_right_0", size: 32, prompt: enemySoldier("right", 0, "chaser"), ref: "bm_chaser_down_0" },
    { name: "bm_chaser_right_1", size: 32, prompt: enemySoldier("right", 1, "chaser"), ref: "bm_chaser_right_0" },
  ],

  // Bomberman boss "Foam Beard" — 3 states (64px)
  bm_boss: [
    { name: "bm_boss1_normal", size: 64, prompt: boss1("normal") },
    { name: "bm_boss1_angry", size: 64, prompt: boss1("angry"), ref: "bm_boss1_normal" },
    { name: "bm_boss1_dead", size: 64, prompt: boss1("dead"), ref: "bm_boss1_normal" },
  ],

  // Platformer (Tehran rooftops) — hero + guard, 64px, side view
  platformer: [
    { name: "plt_player_idle", size: 64, prompt: pltHero("idle"), ref: "bm_player_right_0" },
    { name: "plt_player_run_0", size: 64, prompt: pltHero("run0"), ref: "plt_player_idle" },
    { name: "plt_player_run_1", size: 64, prompt: pltHero("run1"), ref: "plt_player_idle" },
    { name: "plt_player_run_2", size: 64, prompt: pltHero("run2"), ref: "plt_player_idle" },
    { name: "plt_player_run_3", size: 64, prompt: pltHero("run3"), ref: "plt_player_idle" },
    { name: "plt_player_jump", size: 64, prompt: pltHero("jump"), ref: "plt_player_idle" },
    { name: "plt_guard_walk_0", size: 64, prompt: pltGuard(0), ref: "bm_patrol_right_0" },
    { name: "plt_guard_walk_1", size: 64, prompt: pltGuard(1), ref: "plt_guard_walk_0" },
    { name: "plt_guard_walk_2", size: 64, prompt: pltGuard(2), ref: "plt_guard_walk_0" },
    { name: "plt_guard_walk_3", size: 64, prompt: pltGuard(3), ref: "plt_guard_walk_0" },
  ],

  // Port Swap (Beirut stealth) — player (disguised), guard, worker; 24 sprites, 32px
  port: [
    { name: "ps_player_down_0", size: 32, prompt: portChar("down", 0, PORT_PLAYER), ref: "bm_player_down_0" },
    { name: "ps_player_down_1", size: 32, prompt: portChar("down", 1, PORT_PLAYER), ref: "ps_player_down_0" },
    { name: "ps_player_up_0", size: 32, prompt: portChar("up", 0, PORT_PLAYER), ref: "ps_player_down_0" },
    { name: "ps_player_up_1", size: 32, prompt: portChar("up", 1, PORT_PLAYER), ref: "ps_player_up_0" },
    { name: "ps_player_left_0", size: 32, prompt: portChar("left", 0, PORT_PLAYER), ref: "ps_player_down_0" },
    { name: "ps_player_left_1", size: 32, prompt: portChar("left", 1, PORT_PLAYER), ref: "ps_player_left_0" },
    { name: "ps_player_right_0", size: 32, prompt: portChar("right", 0, PORT_PLAYER), ref: "ps_player_down_0" },
    { name: "ps_player_right_1", size: 32, prompt: portChar("right", 1, PORT_PLAYER), ref: "ps_player_right_0" },
    { name: "ps_guard_down_0", size: 32, prompt: portChar("down", 0, PORT_GUARD), ref: "bm_patrol_down_0" },
    { name: "ps_guard_down_1", size: 32, prompt: portChar("down", 1, PORT_GUARD), ref: "ps_guard_down_0" },
    { name: "ps_guard_up_0", size: 32, prompt: portChar("up", 0, PORT_GUARD), ref: "ps_guard_down_0" },
    { name: "ps_guard_up_1", size: 32, prompt: portChar("up", 1, PORT_GUARD), ref: "ps_guard_up_0" },
    { name: "ps_guard_left_0", size: 32, prompt: portChar("left", 0, PORT_GUARD), ref: "ps_guard_down_0" },
    { name: "ps_guard_left_1", size: 32, prompt: portChar("left", 1, PORT_GUARD), ref: "ps_guard_left_0" },
    { name: "ps_guard_right_0", size: 32, prompt: portChar("right", 0, PORT_GUARD), ref: "ps_guard_down_0" },
    { name: "ps_guard_right_1", size: 32, prompt: portChar("right", 1, PORT_GUARD), ref: "ps_guard_right_0" },
    { name: "ps_worker_down_0", size: 32, prompt: portChar("down", 0, PORT_WORKER), ref: "ps_player_down_0" },
    { name: "ps_worker_down_1", size: 32, prompt: portChar("down", 1, PORT_WORKER), ref: "ps_worker_down_0" },
    { name: "ps_worker_up_0", size: 32, prompt: portChar("up", 0, PORT_WORKER), ref: "ps_worker_down_0" },
    { name: "ps_worker_up_1", size: 32, prompt: portChar("up", 1, PORT_WORKER), ref: "ps_worker_up_0" },
    { name: "ps_worker_left_0", size: 32, prompt: portChar("left", 0, PORT_WORKER), ref: "ps_worker_down_0" },
    { name: "ps_worker_left_1", size: 32, prompt: portChar("left", 1, PORT_WORKER), ref: "ps_worker_left_0" },
    { name: "ps_worker_right_0", size: 32, prompt: portChar("right", 0, PORT_WORKER), ref: "ps_worker_down_0" },
    { name: "ps_worker_right_1", size: 32, prompt: portChar("right", 1, PORT_WORKER), ref: "ps_worker_right_0" },
  ],

  // Air combat: vehicles + drone-level enemies + Turbo Turban boss
  air: [
    { name: "f15_side", size: { w: 64, h: 32 }, prompt: vehicle("f15") },
    { name: "b2_side", size: { w: 120, h: 40 }, prompt: vehicle("b2") },
    { name: "b2_top", size: { w: 128, h: 76 },
      prompt: `${STYLE}. Sprite of a USAF B-2 Spirit stealth bomber seen as an EXACT top-down planform from DIRECTLY overhead (straight-down bird's-eye satellite view of it parked on a ramp). It is a pure FLYING WING shaped like a wide flat BOOMERANG / MANTA RAY / BAT silhouette: ONE single smooth seamless triangular wing, a sharp pointed beak-like nose at the TOP-CENTER, two long straight leading edges sweeping back and outward to two sharp wingtips, and the UNMISTAKABLE jagged double-W SAWTOOTH trailing edge along the BOTTOM (four shallow V-notches forming the serrated rear edge, the center pointing back). Matte radar-absorbent MEDIUM-DARK CHARCOAL GREY, almost black, completely flat and non-reflective, subtle panel lines. ABSOLUTELY NO tail, NO vertical fins, NO separate fuselage tube, NO protruding nose cone, NO raised bubble cockpit canopy, NO visible engine nozzles, NO afterburner flames, NO swept fighter-jet wings. It is one smooth flat dark wing only, with a faint thin cockpit window line near the nose. This is NOT a fighter jet. Instantly recognizable B-2 Spirit, crisp clean pixel art, bold dark outline.` },
    { name: "drone_top", size: 64, prompt: vehicle("drone") },
    { name: "carrier_side", size: { w: 480, h: 200 }, prompt: vehicle("carrier") },
    { name: "turbo_turban", size: 128, prompt: turban("normal") },
    { name: "turbo_turban_yell", size: 128, prompt: turban("yell"), ref: "turbo_turban" },
    { name: "guard_idle", size: 64, prompt: droneGuard("idle") },
    { name: "guard_shoot", size: 64, prompt: droneGuard("shoot"), ref: "guard_idle" },
    { name: "turret_idle", size: 64, prompt: turret("idle") },
    { name: "turret_alert", size: 64, prompt: turret("alert"), ref: "turret_idle" },
    { name: "turret_shoot", size: 64, prompt: turret("shoot"), ref: "turret_idle" },
    { name: "mini_soldier", size: { w: 16, h: 24 }, prompt: enemySoldier("down", 0, "patrol") },
  ],

  // Parade (GameIntroScene / LastStandCinematicScene) — bosses, hero, vehicles
  parade: [
    // Boss caricatures (generic cartoon arcade villains)
    // Each boss is DISTINCT — its name's signature trait dialed up, own colour/build.
    { name: "parade_foambeard", size: { w: 60, h: 110 },
      prompt: sprite("Ismail Haniyeh, a heavy-set older middle-eastern political leader, full body front view, BALD on top with short grey hair on the sides, a full neatly-TRIMMED grey-and-white beard (not wild, not huge), a round face, wearing a dark charcoal business SUIT with a white shirt (NO uniform, NO keffiyeh, NO turban), calm stern authoritative expression, recognizable likeness, detailed pixel art") },
    { name: "parade_turboturban", size: { w: 70, h: 120 }, ref: "turbo_turban",
      prompt: sprite("a round cartoon cleric villain, full body front view, wearing a COMICALLY ENORMOUS oversized BLACK turban, a brown clerical robe, round glasses, a thick grey-black beard, comic-villain proportions") },
    { name: "parade_angryeyebrows", size: { w: 64, h: 110 },
      prompt: sprite("a lean wiry middle-aged middle-eastern man (Yahya Sinwar), full body standing front view, SHORT fully GREY-WHITE hair buzzed low on the sides, a short trimmed darker-grey beard and mustache, an angular thin face with DARK THICK VERY BUSHY EYEBROWS that strongly contrast his white hair, dark deep-set sunken eyes with a severe fixed stare, notably PROMINENT protruding ears, marked forehead and eye expression lines, wearing plain dark olive-grey civilian-military clothing (NO uniform, NO medals, NO cap, NO turban), stern intimidating and intense, gritty realistic pixel art") },
    { name: "parade_supremeturban", size: { w: 96, h: 160 },
      prompt: sprite("a tall gaunt imposing cartoon supreme-leader villain, full body front view, a dignified medium BLACK turban, round glasses, a long flowing WHITE beard down to his chest, flowing dark-charcoal robes, the most serious and intimidating of villains, comic-villain proportions") },
    // Hero + soldier
    { name: "parade_superzion", size: { w: 96, h: 160 }, ref: "bm_player_down_0",
      prompt: sprite(HERO_BASE + ", full body heroic standing pose, front view, proud and confident") },
    { name: "parade_soldier", size: { w: 20, h: 40 }, ref: "bm_patrol_right_0",
      prompt: sprite("a small black-clad militant enemy fighter with a black balaclava face-mask and a green headband, holding a rifle, side profile marching right") },
    // Vehicles (side view)
    { name: "parade_missiletruck", size: { w: 70, h: 40 }, prompt: sideVeh("a military missile-launcher truck carrying a large missile") },
    { name: "parade_rockettruck", size: { w: 60, h: 36 }, prompt: sideVeh("a military rocket-artillery truck with multiple rocket tubes") },
    { name: "parade_merkava", size: { w: 90, h: 44 }, prompt: sideVeh("a Merkava main battle tank, heavy armor, long cannon") },
    { name: "parade_f15", size: { w: 70, h: 40 }, ref: "f15_side", prompt: sideVeh("an F-15 fighter jet") },
    { name: "parade_f35", size: { w: 66, h: 36 }, prompt: sideVeh("an F-35 stealth fighter jet, sleek modern") },
    { name: "parade_drone", size: { w: 40, h: 24 }, prompt: sideVeh("a military combat drone aircraft, slim fuselage, wings") },
    { name: "parade_carrier", size: { w: 220, h: 60 }, ref: "carrier_side", prompt: sideVeh("a large naval aircraft carrier warship") },
    { name: "parade_frigate", size: { w: 100, h: 48 }, prompt: sideVeh("a navy frigate warship, grey hull, radar mast, deck guns") },
    { name: "parade_irondome", size: { w: 60, h: 50 }, prompt: sideVeh("an Iron Dome missile-defense launcher battery, angled launch tubes") },
    { name: "parade_apc", size: { w: 56, h: 30 }, prompt: sideVeh("an armored personnel carrier military vehicle, wheeled") },
    { name: "parade_azadi", size: { w: 60, h: 100 }, prompt: sprite("the Azadi Tower, a white marble arched monument tower, front view, landmark") },
  ],

  // Full-screen opaque backgrounds (960x540). Parallax layers + tiles stay
  // procedural and draw ON TOP of these, so replacing the base is safe.
  backgrounds: [
    { name: "sunset_sky", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. ONLY a dramatic sunset sky filling the whole frame — orange-to-purple gradient, glowing sun, wispy clouds. NO ground, NO mountains, NO landscape, NO horizon line, just sky.` },
    { name: "night_sky", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. ONLY a deep starry night sky filling the whole frame — dark blue gradient, stars, faint moon, wispy clouds. NO ground, NO mountains, NO landscape, just sky.` },
    { name: "daytime_sky", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. ONLY a clear bright daytime sky filling the whole frame — blue gradient with soft scattered white clouds. NO ground, NO mountains, NO landscape, just sky.` },
    { name: "beirut_sky", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. ONLY a warm hazy morning sky filling the whole frame — soft golden gradient, light haze, faint clouds. NO ground, NO mountains, NO city, NO landscape, just sky.` },
    { name: "command_room", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. Interior of a dim underground military command bunker, concrete walls, glowing monitors and map tables lining the walls, ominous lighting, empty room.` },
    { name: "target_building", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. Cross-section interior of a ruined concrete building, rubble and exposed rebar, broken floors, dim dusty lighting, empty.` },
    // Cinematic panoramas (cutscene backgrounds, standalone)
    { name: "cin_tehran", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A sprawling middle-eastern city skyline at dusk, distant mountains behind, domes and towers, hazy atmosphere.` },
    { name: "cin_beirut_port", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A mediterranean seaport with shipping cranes, stacked containers, docks and the sea, daytime.` },
    { name: "cin_lebanon_coast", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A rugged mediterranean coastline, cliffs meeting the blue sea, distant hills, bright day.` },
    { name: "cin_fortress", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A heavily fortified underground bunker entrance built into a rocky mountainside, concrete and steel, ominous.` },
    { name: "cin_natanz", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A remote desert industrial facility with bunkers and antennas at the foot of barren mountains, dusk.` },
    { name: "cin_gaza", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A dense middle-eastern coastal town skyline of low buildings under a hazy sky, distant sea.` },
    { name: "cin_destroyed_city", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A war-torn ruined city skyline, crumbling damaged buildings, smoke and dust, grim overcast sky.` },
    { name: "cin_cliff_bg", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A dramatic rocky cliff edge overlooking a vast valley and distant mountains at sunset.` },
    { name: "cin_ops_room", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. Interior of a high-tech military operations command center, large glowing wall screens, control desks, blue lighting, empty room.` },
  ],

  // Cinematic hero portraits (transparent sprites)
  cin_hero: [
    { name: "cin_superzion", size: { w: 64, h: 96 }, ref: "bm_player_down_0",
      prompt: sprite(HERO_BASE + ", full body heroic standing portrait, front view, confident") },
    { name: "cin_superzion_cliff", size: 128, ref: "bm_player_down_0",
      prompt: sprite(HERO_BASE + ", full body, standing heroically and looking into the distance, dramatic pose, side/three-quarter view") },
  ],

  // Props (port containers/ship/crane/building + drone-boss armchair)
  props: [
    ...["red", "blue", "green", "yellow", "orange"].flatMap((c) => [
      { name: `ps_container_${c}`, size: { w: 48, h: 24 }, ref: "ps_container_red",
        key: c === "green" ? "magenta" : "green",
        prompt: `${c === "green" ? STYLE_MG : STYLE}. Sprite of a ${c} metal shipping cargo container seen from above (top-down), corrugated ridged top, weathered.` },
      { name: `ps_container_${c}_marked`, size: { w: 48, h: 24 }, ref: `ps_container_${c}`,
        key: c === "green" ? "magenta" : "green",
        prompt: `${c === "green" ? STYLE_MG : STYLE}. Sprite of a ${c} metal shipping cargo container seen from above (top-down), corrugated ridged top, with a bright glowing yellow target X-mark painted on top.` },
    ]),
    { name: "ps_ship", size: { w: 160, h: 48 }, prompt: `${STYLE}. Sprite of a large cargo container ship seen from above (top-down), long grey hull, stacks of containers on deck, bridge tower.` },
    { name: "ps_crane", size: { w: 64, h: 40 }, prompt: `${STYLE}. Sprite of a port gantry container crane seen from above (top-down), yellow steel structure.` },
    { name: "ps_building", size: { w: 64, h: 48 }, prompt: `${STYLE}. Sprite of a port warehouse building seen from above (top-down), flat roof, industrial.` },
    { name: "armchair", size: 120, prompt: `${STYLE}. Sprite of a BATTERED beat-up old single armchair in a war-torn ruined room — faded worn dark grey-brown upholstery, torn fabric with exposed stuffing and a poking spring, one leg damaged, the whole chair COATED in pale GREY DUST and concrete powder with bits of rubble on the seat, front view, empty, gritty realistic pixel art.` },
    { name: "armchair_side", size: { w: 90, h: 120 }, ref: "armchair", prompt: `${STYLE}. Sprite of a BATTERED beat-up old single armchair in a war-torn ruined room — faded worn dark grey-brown upholstery, torn fabric with exposed stuffing, coated in pale GREY DUST and concrete powder, side profile view, empty, gritty realistic pixel art.` },
  ],

  // F-15 level scrolling terrain bands (tileSprites — must tile seamlessly).
  // Aerial side-scroller ground seen passing below the jet. tile:true mirrors.
  terrain: [
    { name: "sea_surface", size: { w: 960, h: 120 }, tile: true, aspect: "16:9",
      prompt: `${BG_STYLE}. Aerial top-down view of a calm Mediterranean SEA at golden hour — clean teal-and-blue water with soft evenly-scattered gentle wave ripples and tiny warm golden sunset glints, smooth and pretty, evenly lit with NO single bright spot, NO horizon, NO land, NO boats. A SEAMLESS repeating horizontal terrain band with uniform texture across the whole frame (no obvious centre feature, no hard seams).` },
    { name: "coast_ground", size: { w: 960, h: 120 }, tile: true, aspect: "16:9",
      prompt: `${BG_STYLE}. Aerial top-down view of a Mediterranean COASTLINE at golden hour — turquoise sea on one side blending into pale sandy beach and patches of green-and-tan scrubland, warm soft sunset lighting, clean and pretty, evenly textured. A SEAMLESS repeating horizontal terrain band, no hard seams, no single centre feature.` },
    { name: "mountain_ground", size: { w: 960, h: 120 }, tile: true, aspect: "16:9",
      prompt: `${BG_STYLE}. Aerial top-down view of rugged mountain ridges at golden hour — warm tan and ochre rocky ridgelines and ravines with soft long shadows, sparse green pockets, pretty warm sunset lighting, clean detailed. A SEAMLESS repeating horizontal terrain band, evenly distributed ridges, no hard seams, no single centre feature.` },
    { name: "valley_ground", size: { w: 960, h: 120 }, tile: true, aspect: "16:9",
      prompt: `${BG_STYLE}. Aerial top-down view of an arid desert VALLEY at golden hour — warm sandy-ochre ground with sparse scrub, dry winding riverbeds and rocky patches, soft warm sunset lighting, clean and pretty. A SEAMLESS repeating horizontal terrain band, evenly textured, no hard seams, no single centre feature.` },
    // Transparent parallax layers (sky shows through the keyed-out areas).
    // NOTE: use a NO-character style — the base STYLE adds figures.
    { name: "far_mountains", size: { w: 960, h: 250 }, tileAlpha: true,
      prompt: `16-bit retro pixel-art parallax scenery layer, NO characters, NO people, NO creatures, NO knights, NO text, NO border. A row of distant hazy blue-grey mountain-range silhouettes along the BOTTOM third only; the ENTIRE rest of the image is a solid flat pure ${KEY_COLOR} green empty sky. Horizontal band, detailed pixel art.` },
    { name: "cloud_layer", size: { w: 768, h: 160 }, tileAlpha: true,
      prompt: `16-bit retro pixel-art parallax layer, NO characters, NO people, NO text, NO border. A few soft wispy white and pale-grey clouds scattered across a solid flat pure ${KEY_COLOR} green background. Horizontal cloud band, detailed pixel art.` },
  ],

  // Natanz target building — generated whole, then SLICED into floor strips.
  natanz: [
    { name: "__natanz_building", size: { w: 224, h: 228 },
      prompt: `16-bit retro pixel-art building sprite, NO characters, NO people, NO text. A tall narrow concrete nuclear/military facility tower, beige and grey weathered concrete, many rows of small dark square windows, ventilation pipes, antennas and a control box on the flat roof, industrial and ominous. The building FILLS the entire frame from the rooftop at the very top to the base at the very bottom. Solid flat pure ${KEY_COLOR} green background on the sides. Detailed pixel art, bold dark outline.` },
  ],

  // Misc remaining old-graphics replacements
  extras: [
    { name: "sky_gradient", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. ONLY a dramatic twilight sky filling the whole frame — deep orange and crimson glow near the bottom horizon fading up through purple to dark navy-black at the top, a few faint wispy clouds, atmospheric and moody. NO ground, NO mountains, NO buildings, NO landscape, just sky.` },
    { name: "__title_bg", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A dramatic war-torn middle-eastern city skyline at dusk under a dark ominous orange-black sky, ruined silhouetted buildings, smoke columns, distant fire glow, cinematic title-screen backdrop.` },
    // Main MENU backdrop — heroic Jerusalem skyline at golden dusk (on-brand,
    // sits dimmed behind the SUPERZION title + level list).
    { name: "menu_bg", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A majestic panorama of the JERUSALEM old-city skyline at golden dusk — ancient pale-gold limestone walls, towers and the silhouette of domes and the Tower of David along the lower third, gentle Judean hills behind, a warm glowing golden-orange sunset sky deepening through amber to deep navy-blue at the top with a few soft wispy clouds and the first faint stars, soft hopeful majestic light, cinematic title-screen backdrop. The upper half is mostly open sky. NO text, NO people, NO modern skyscrapers.` },
    // Ornate metallic Star of David — used everywhere (menu/victory/credits) via StarOfDavid.js
    { name: "star_of_david", size: 256, key: "magenta",
      prompt: `16-bit pixel-art game emblem, a single ORNATE METALLIC GOLD Star of David (Magen David — a six-pointed hexagram of TWO interlocking equilateral triangles), centered and facing front, FILLING the frame. Polished gold with a bright beveled metallic sheen and darker gold shadows for depth, the two triangles clearly WOVEN over and under each other at each crossing, a thin engraved inner double-line border running along each band, a small glowing pale-blue gem set at each of the six points. Bold clean readable edges, NO text, NO scenery, NO extra symbols, NO glow, NO halo, NO aura, NO colored circle or disc behind it. The ENTIRE background behind and around the star is a solid flat pure magenta #FF00FF and nothing else.` },
    { name: "b2_silhouette", size: { w: 200, h: 80 }, ref: "b2_top",
      prompt: `${STYLE}. Sprite of a USAF B-2 Spirit stealth bomber as an EXACT top-down planform from DIRECTLY overhead. A pure FLYING WING shaped like a wide flat BOOMERANG / MANTA / BAT: ONE single smooth seamless triangular wing, a sharp pointed beak nose at the TOP-CENTER, two long straight leading edges sweeping back to two sharp wingtips, and the UNMISTAKABLE jagged double-W SAWTOOTH trailing edge along the BOTTOM (four shallow V-notches). Matte MEDIUM-DARK CHARCOAL GREY, almost black, flat and non-reflective. ABSOLUTELY NO tail, NO vertical fins, NO fuselage tube, NO nose cone, NO raised cockpit canopy, NO engine nozzles, NO fighter-jet swept wings. NOT a fighter jet. Instantly recognizable B-2 boomerang shape, detailed pixel art, bold dark outline.` },
  ],

  // Graphics-overhaul batch: remaining procedural backdrops → AI
  overhaul: [
    // Credits "Am Yisrael Chai" — sunrise over Tel Aviv skyline & sea
    { name: "credits_sky", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A breathtaking sunrise over the Tel Aviv coastline seen from the sea — a glowing golden sun rising on the horizon, warm orange-and-pink sky fading to soft blue above, a distant modern city skyline silhouette of towers along the horizon, calm reflective Mediterranean sea in the lower third with shimmering sun reflection, hopeful peaceful dawn atmosphere, cinematic.` },

    // ── Platformer (Tehran rooftops, DAYTIME) parallax silhouette bands ──
    // Content along the BOTTOM, solid green above so the bright day sky shows through.
    { name: "plt_mountains", size: { w: 768, h: 256 }, tileAlpha: true,
      prompt: `16-bit retro pixel-art parallax scenery layer, NO characters, NO people, NO creatures, NO text, NO border. A row of distant hazy pale blue-grey daytime mountain-range silhouettes along the BOTTOM third only, soft atmospheric haze, bright day; the ENTIRE rest of the image above is a solid flat pure ${KEY_COLOR} green empty sky. Horizontal seamless band, detailed pixel art.` },
    { name: "plt_skyline", size: { w: 768, h: 256 }, tileAlpha: true,
      prompt: `16-bit retro pixel-art parallax scenery layer, NO characters, NO people, NO text, NO border. A sunlit middle-eastern city skyline along the BOTTOM half in DAYTIME — light tan and beige towers, domes and minarets, soft hazy daylight, NO glowing windows; the ENTIRE upper area is a solid flat pure ${KEY_COLOR} green empty sky. Horizontal seamless band, detailed pixel art.` },
    { name: "plt_near_buildings", size: { w: 768, h: 256 }, tileAlpha: true,
      prompt: `16-bit retro pixel-art parallax scenery layer, NO characters, NO people, NO text, NO border. Closer foreground sunlit rooftops and building facades in DAYTIME along the BOTTOM half — warm sandstone and concrete buildings, water tanks and rooftop boxes, satellite dishes, bright daylight, NO glowing windows; the ENTIRE upper area is a solid flat pure ${KEY_COLOR} green empty sky. Horizontal seamless band, detailed pixel art.` },

    // ── Beirut final-boss parallax ──
    { name: "beirut_city", size: { w: 768, h: 256 }, tileAlpha: true,
      prompt: `16-bit retro pixel-art parallax scenery layer, NO characters, NO people, NO text, NO border. A war-torn middle-eastern city skyline silhouette along the BOTTOM half — damaged dark buildings, broken towers, faint distant fire-glow on a few, smoke; the ENTIRE upper area is a solid flat pure ${KEY_COLOR} green empty sky. Horizontal seamless band, detailed pixel art.` },
    { name: "beirut_ground", size: { w: 768, h: 128 }, tile: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A war-torn city street ground band seen straight-on — cracked asphalt and rubble, scattered debris and craters, dim reddish night lighting, fills the frame as a horizontal seamless terrain band. NO sky.` },

    // ── Platformer (L1 Tehran rooftops) NIGHT sky — fixes day/night clash with the night parallax bands ──
    { name: "plt_stars_sky", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. ONLY a deep NIGHT sky over a middle-eastern city — dark navy-blue to near-black gradient, scattered faint stars, thin wispy dark clouds, a soft distant city-glow haze low on the horizon. NO moon, NO ground, NO mountains, NO buildings, just night sky. Calm and moody.` },

    // ── Beirut/Hong Kong port (PortSwap) coastal backdrop ──
    { name: "ps_mountains_bg", size: { w: 960, h: 360 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A hazy daytime COASTAL HARBOR backdrop seen from across the water — distant blue-grey mountains and hills behind a far port-city skyline of cranes, warehouses and low buildings, calm sea haze, soft overcast light. A wide horizontal backdrop strip, atmospheric and distant. NO text, NO people, NO foreground.` },

    // ── B-2 night-flight terrain (Mountain Breaker) — top-down seamless dark tiles ──
    { name: "b2_terrain_sea", size: { w: 512, h: 512 }, bg: true,
      prompt: `${BG_STYLE}. EXACT top-down aerial view straight down at a moonlit NIGHT OCEAN — clearly READABLE deep blue water (not black) with well-defined wave crests and bright silvery-white MOONLIGHT ripple highlights and foam streaks evenly distributed across the whole frame, good contrast, crisp detailed waves, a SEAMLESS repeating texture with no horizon, no land, no single center feature. Moonlit night sea, legible and pretty.` },
    { name: "b2_terrain_coast", size: { w: 512, h: 512 }, bg: true,
      prompt: `${BG_STYLE}. EXACT top-down aerial NIGHT view straight down at a coastline — dark navy sea on one side meeting a faint moonlit sandy shore and dark scrubland on the other, subtle, a seamless horizontal-ish band, moody night, no center feature.` },
    { name: "b2_terrain_land", size: { w: 512, h: 512 }, bg: true,
      prompt: `${BG_STYLE}. EXACT top-down aerial NIGHT view looking straight DOWN at the GROUND — moonlit desert and farmland seen from directly overhead. Clearly READABLE warm grey-brown and tan earth (not black) with good contrast, irregular organic crop-field patches, a few winding dirt ROADS and dry riverbeds, scattered rocky outcrops and low scrub, soft moonlit shading. A SEAMLESS evenly-distributed ground TEXTURE filling the whole frame. ABSOLUTELY NO moon, NO sky, NO horizon, NO straight ruled GRID lines, NO map grid, NO single center feature — only natural ground seen from above.` },

    // ── GameIntro finale: Tel Aviv beach sunset (palm trees) — "they fight to conquer, we fight to exist" ──
    { name: "intro_telaviv_sunset", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A breathtaking, INSTANTLY RECOGNIZABLE TEL AVIV beachfront at golden-hour sunset. Foreground: the sandy Mediterranean beach and the curving seaside PROMENADE (tayelet) with tall leaning PALM TREES and beach umbrellas. Midground skyline along the shore clearly showing Tel Aviv's iconic landmarks: the three distinctive AZRIELI CENTER skyscrapers (one CIRCULAR tower, one TRIANGULAR tower, one SQUARE tower standing together) and rows of white Bauhaus buildings. On the far-left headland, the historic OLD JAFFA hill with its stone clock tower and church spire jutting into the sea. Calm sea with a warm shimmering golden sun reflection, glowing orange-to-purple sunset sky with soft clouds, peaceful hopeful majestic atmosphere, cinematic pixel-art panorama. NO text, NO people.` },

    // ── Final-boss (Endgame) fortress — distinct from cin_fortress (the L2 bunker) ──
    { name: "cin_final_fortress", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A colossal ominous IRANIAN MOUNTAIN FORTRESS-PALACE at night — a towering dark fortress carved into a jagged mountain peak, massive stone ramparts and battlements, several tall slender minarets and a huge central domed throne-hall glowing with eerie red light from within, sweeping searchlights, a long fortified bridge approach, storm clouds and a blood-red moon behind it, lightning, epic and intimidating final-boss lair. Grand and palatial, NOT a small bunker entrance. Cinematic.` },

    // ── L3/L4 brief: underground tunnel network cross-section ──
    { name: "cin_tunnel_xsection", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A dramatic cutaway CROSS-SECTION of a deep underground militant TUNNEL NETWORK beneath a war-torn city — dark earth and concrete with multiple horizontal tunnel galleries connected by shafts, dim yellow-orange tunnel lighting, stacked weapon crates and rockets hidden in side chambers, support beams, the ruined city silhouette far above on the surface, ominous and claustrophobic, military intel diagram feel, cinematic pixel art.` },

    // ── Victory celebration crowd (transparent band for the bottom) ──
    { name: "victory_crowd", size: { w: 720, h: 200 }, key: "magenta",
      prompt: `16-bit retro pixel-art game sprite, a CROWD of diverse cheering Israeli civilians and soldiers celebrating together — men, women and children, several waving WHITE-AND-BLUE Israel flags (white field with two blue horizontal stripes and a blue Star of David), arms raised in joy, packed shoulder-to-shoulder in two or three rows forming a wide horizontal crowd band, seen from the front, warm joyful smiling faces, detailed pixel art, bold dark outline, clean readable pixels. NO text, NO watermark, NO single hero in the centre. The crowd fills the LOWER portion as a wide band; solid flat pure #FF00FF magenta background everywhere above and around the crowd.` },

    // ── Drone boss arena — top-down wrecked hideout floor ──
    { name: "drone_room", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. EXACT top-down bird's-eye view looking STRAIGHT DOWN at the floor of a wrecked underground hideout room — cracked grey concrete and broken tiled floor seen from directly overhead, scattered chunks of rubble and shattered furniture, a torn dusty rug, spilled papers, blast scorch marks and dust, dim ominous overhead lighting with deep shadows. A flat top-down floor plan, NO walls drawn in side-perspective, grim and claustrophobic.` },

    // ── Drone level (Last Chair) — Gaza ruins backdrop ──
    { name: "drone_gaza", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A dense war-torn GAZA city skyline at dusk — rows of damaged low-rise concrete middle-eastern apartment buildings packed tightly, many partially collapsed with blown-out floors and exposed rebar, rubble and dust, a hazy smoky orange-grey sky, distant sea on one side, grim. A realistic ruined coastal town, NOT plain rectangles.` },

    // ── Opening intro narrative backdrops (GameIntroScene pages) ──
    { name: "intro_empires", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. The ruins of the ancient GREAT TEMPLE OF JERUSALEM (the Second Temple, Beit HaMikdash) destroyed and smouldering under a dark ominous blood-red and black smoky sky. A grand ancient Judean temple built of pale golden JERUSALEM LIMESTONE, now shattered in ruins — a surviving tall section of the great stone retaining WALL made of massive rectangular ashlar blocks (Western-Wall style), rows of broken and toppled classical stone columns, a crumbling wide monumental staircase, a large fallen golden seven-branched MENORAH lying among carved stone rubble, scattered ashlar blocks, drifting ash and embers, faint distant fire-glow on the horizon, grim apocalyptic dusk. Ancient Near-East / Holy Land / Judean architecture. STRICTLY NOT aztec, NOT mayan, NOT a mesoamerican step-pyramid, NO sphinx, NO ziggurat, NO egyptian pyramid. Cinematic, moody, epic.` },
    { name: "intro_warzone", size: { w: 960, h: 540 }, bg: true, aspect: "16:9",
      prompt: `${BG_STYLE}. A war-torn modern middle-eastern city in ruins at night — intense orange-red firelight, burning collapsed buildings, thick black smoke columns rising, glowing embers in the air, a deep blood-red sky, apocalyptic destruction. Cinematic, dramatic.` },

    // ── Enemy faction flags on poles. MAGENTA key (the flags contain GREEN, which a
    //    green key would erase). THICK dark outline so they read against busy art. ──
    { name: "flag_iran_ai", size: { w: 96, h: 120 }, key: "magenta",
      prompt: `16-bit pixel-art game sprite, NO people, NO characters, NO text, THICK bold black outline around the whole flag and pole, clean readable pixels, high contrast. A waving cloth flag on a tall dark-grey flagpole — three equal horizontal stripes (top GREEN, middle WHITE, bottom RED) with a small red emblem centered on the white stripe, fabric rippling in the wind, fully opaque solid colours. Solid flat pure #FF00FF magenta background only behind/around the flag.` },
    { name: "flag_hamas_ai", size: { w: 96, h: 120 }, key: "magenta",
      prompt: `16-bit pixel-art game sprite, NO people, NO characters, THICK bold black outline around the whole flag and pole, clean readable pixels, high contrast. A waving solid GREEN cloth flag on a tall dark-grey flagpole with rows of white arabic-style calligraphic markings across it, fabric rippling in the wind, fully opaque. Solid flat pure #FF00FF magenta background only.` },
    { name: "flag_hezbollah_ai", size: { w: 96, h: 120 }, key: "magenta",
      prompt: `16-bit pixel-art game sprite, NO people, NO characters, THICK bold black outline around the whole flag and pole, clean readable pixels, high contrast. A waving YELLOW cloth flag on a tall dark-grey flagpole with a green emblem of an upraised arm holding a rifle silhouette, fabric rippling in the wind, fully opaque. Solid flat pure #FF00FF magenta background only.` },
    { name: "flag_palestine_ai", size: { w: 96, h: 120 }, key: "magenta",
      prompt: `16-bit pixel-art game sprite, NO people, NO characters, NO text, THICK bold black outline around the whole flag and pole, clean readable pixels, high contrast. A waving cloth flag on a tall dark-grey flagpole — three equal horizontal stripes (top BLACK, middle WHITE, bottom GREEN) with a RED triangle on the hoist (left) side, fabric rippling in the wind, fully opaque. Solid flat pure #FF00FF magenta background only.` },
  ],

  // Final boss level (BossScene)
  boss_final: [
    { name: "player_fighter", size: 64, prompt: sideVeh("an F-16 fighter jet, side view facing right, grey military jet with afterburner") },
    { name: "bunker_fortress", size: 256,
      prompt: sprite("a massive armored underground bunker fortress war-machine boss, heavy metal plating, multiple gun turrets, glowing red weak-point core, menacing") },
    // HP-driven damage states of the SAME mech (ref keeps it consistent),
    // swapped via setTexture as the boss loses health.
    { name: "bunker_fortress_angry", size: 256, ref: "bunker_fortress",
      prompt: sprite("the SAME massive armored war-machine fortress boss, now enraged and powering up — weapons charging, brighter intense orange-red glowing core, a few battle scuffs, aggressive menacing stance") },
    { name: "bunker_fortress_furious", size: 256, ref: "bunker_fortress",
      prompt: sprite("the SAME massive armored war-machine fortress boss, heavily battle-damaged — cracked dented plating, sparks and exposed wiring, one turret broken, blazing white-hot overloading core, smoke wisps, desperate furious") },
    { name: "bunker_fortress_dead", size: 256, ref: "bunker_fortress",
      prompt: sprite("the SAME massive armored war-machine fortress boss, DESTROYED and defeated — shattered blackened scorched plating, dark dead lifeless core, slumped broken posture, heavy smoke and small fading embers, wreckage") },

    // FINAL BOSS = Supreme Turban / Ayatollah CHARACTER (not the mech). HP-state
    // variants swapped via setTexture; ref the brief portrait for consistency.
    { name: "boss_ayatollah", size: 256, ref: "parade_supremeturban",
      prompt: sprite("a colossal imposing final-boss cartoon supreme-leader villain, full body front view, a dignified medium BLACK turban, round glasses, a long flowing WHITE beard down to his chest, flowing dark-charcoal robes, raising a tall golden crescent-moon staff that glows, faintly glowing RED eyes, floating menacingly above a dark ornate throne/fortress base, epic boss-fight presence, comic-villain proportions") },
    { name: "boss_ayatollah_angry", size: 256, ref: "boss_ayatollah",
      prompt: sprite("the SAME colossal supreme-leader villain boss (black turban, round glasses, long white beard, dark robes, golden crescent staff), now ENRAGED — bright glowing RED eyes, the crescent staff blazing with energy, robes billowing, arms raised casting power, furious snarl, dramatic boss-fight pose") },
    { name: "boss_ayatollah_furious", size: 256, ref: "boss_ayatollah",
      prompt: sprite("the SAME supreme-leader villain boss (black turban, glasses, white beard, dark robes, crescent staff), DESPERATE and wounded — robes torn and scorched, turban askew, the cracked staff sputtering, intense burning red eyes and a wild furious expression, surrounded by dark crackling energy, last-stand rage") },
    { name: "boss_ayatollah_dead", size: 256, ref: "boss_ayatollah",
      prompt: sprite("the SAME supreme-leader villain boss (black turban, glasses, white beard, dark robes), DEFEATED — slumped and collapsing, robes tattered and smoking, the golden crescent staff broken and falling, dim lifeless eyes, the throne behind him crumbling, fading embers, vanquished") },
  ],

  // Drone-level boss = Yahya Sinwar, the iconic "last drone-footage" look:
  // a wounded fighter slumped in a wrecked armchair, face wrapped in a dark
  // dusty keffiyeh (only the eyes show), tactical vest, caked in grey dust.
  drone_boss: [
    { name: "boss_sinwar", size: 128,
      prompt: sprite("a wounded middle-eastern militant fighter, head and upper body, front view, HUNCHED and crouching low as if hiding behind cover and peering over the top of it, his head and face TIGHTLY WRAPPED in a large dark grey-and-black KEFFIYEH scarf that is very prominent and clearly visible, leaving ONLY his intense narrowed eyes showing, wearing a dark tactical combat plate-carrier VEST over dark clothing, his whole body, scarf and vest CAKED in thick pale GREY DUST and concrete powder, his RIGHT arm limp and injured held against his body, his good LEFT hand gripping forward ready, staring fixed and defiant, NO chair, NO furniture, NO seat, an isolated standing/crouching figure on the empty background, gritty realistic pixel art, bold dark outline, NOT a cartoon, NO turban, NO medals, NO peaked cap") },
    { name: "boss_sinwar_angry", size: 128, ref: "boss_sinwar",
      prompt: sprite("the SAME wounded fighter (big prominent dark KEFFIYEH wrapping the whole face with only the eyes visible, dusty tactical vest, limp injured right arm), now rising up defiant and ENRAGED — his good LEFT arm cocked back overhead to HURL a rock/object, eyes blazing with fury above the scarf, grey dust flying off him, NO chair, isolated figure, gritty realistic pixel art") },
    { name: "boss_sinwar_furious", size: 128, ref: "boss_sinwar",
      prompt: sprite("the SAME wounded fighter (big prominent dark KEFFIYEH face-wrap, only eyes visible, dusty tactical vest, injured right arm), DESPERATE last stand — keffiyeh and vest torn and bloodied, caked in even more grey rubble dust, lunging/charging forward, eyes wild and furious, NO chair, isolated figure, gritty realistic pixel art") },
    { name: "boss_sinwar_dead", size: 128, ref: "boss_sinwar",
      prompt: sprite("the SAME wounded fighter (big prominent dark KEFFIYEH face-wrap, dusty tactical vest), DEFEATED and lifeless — collapsed and slumped forward face-down, the keffiyeh loosening off his head, eyes shut, arms limp at his sides, completely still, buried in grey dust and debris, NO chair, isolated figure, somber, gritty realistic pixel art") },
  ],
};
