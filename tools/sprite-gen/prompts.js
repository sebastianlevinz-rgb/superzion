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
    patrol: "olive-drab green military uniform and a green beret",
    chaser: "dark red and black military uniform and a black beret, more aggressive looking",
  }[variant];
  const base =
    `a generic enemy foot-soldier, ${colors}, holding a rifle, ` +
    "neutral menacing expression, detailed pixel art, top-down-ish 2.5D arcade view";
  const view = {
    down: "facing the camera (front view)",
    up: "seen from behind (back view)",
    left: "facing left (side profile, walking left)",
    right: "facing right (side profile, walking right)",
  }[dir];
  const pose = frame === 0 ? "standing alert, idle" : "mid-stride walking, one leg forward";
  return `${STYLE}. Sprite of ${base}, ${view}, ${pose}.`;
}

// ── BOMBERMAN BOSS "Foam Beard" — cartoon warlord villain, 3 states ──
const BOSS1_BASE =
  "a cartoon villain warlord boss, large menacing figure, big bushy dark beard, " +
  "military commander cap and uniform, exaggerated comic villain proportions, " +
  "front view facing camera, detailed pixel art arcade boss";

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
    "a generic enemy foot-soldier in olive-drab green uniform and green beret, " +
    "holding a rifle, detailed pixel art";
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
  b2: "a B-2 Spirit stealth bomber, side/low-angle view facing right, dark angular flying-wing shape, sleek black aircraft",
  drone: "a military quad-rotor combat drone seen from directly above (top-down), four rotors, central camera, dark grey",
  carrier: "a massive naval aircraft carrier, side view, long grey flight deck, control tower island, military warship",
};
function vehicle(which) {
  return `${STYLE}. Sprite of ${VEH[which]}, sharp detailed pixel art, side-scroller game asset.`;
}

const TURBAN_BASE =
  "a cartoon villain warlord boss, large comic figure wearing an oversized ornate turban, " +
  "long robe, big beard, exaggerated comic-villain proportions, front view, detailed pixel art arcade boss";
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
    { name: "parade_foambeard", size: { w: 60, h: 110 }, ref: "bm_boss1_normal",
      prompt: sprite("a cartoon warlord villain, full body standing front view, big bushy dark beard, military commander cap and uniform, exaggerated comic-villain proportions") },
    { name: "parade_turboturban", size: { w: 70, h: 120 }, ref: "turbo_turban",
      prompt: sprite("a cartoon warlord villain, full body standing front view, oversized ornate turban, long robe, big beard, comic-villain proportions") },
    { name: "parade_angryeyebrows", size: { w: 64, h: 110 },
      prompt: sprite("a cartoon villain general, full body standing front view, enormous comically bushy eyebrows, stern scowl, olive military uniform with medals") },
    { name: "parade_supremeturban", size: { w: 96, h: 160 }, ref: "parade_turboturban",
      prompt: sprite("a tall imposing cartoon supreme-leader villain, full body front view, flowing dark robes, large black turban, long grey beard, comic-villain proportions") },
    // Hero + soldier
    { name: "parade_superzion", size: { w: 96, h: 160 }, ref: "bm_player_down_0",
      prompt: sprite(HERO_BASE + ", full body heroic standing pose, front view, proud and confident") },
    { name: "parade_soldier", size: { w: 20, h: 40 }, ref: "bm_patrol_right_0",
      prompt: sprite("a small generic enemy foot-soldier in olive-green uniform and beret with a rifle, side profile marching right") },
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
    { name: "armchair", size: 120, prompt: `${STYLE}. Sprite of an ornate royal wingback armchair, plush deep-red velvet with gold trim, front view, empty.` },
    { name: "armchair_side", size: { w: 90, h: 120 }, ref: "armchair", prompt: `${STYLE}. Sprite of an ornate royal wingback armchair, plush deep-red velvet with gold trim, side profile view, empty.` },
  ],

  // Final boss level (BossScene)
  boss_final: [
    { name: "player_fighter", size: 64, prompt: sideVeh("an F-16 fighter jet, side view facing right, grey military jet with afterburner") },
    { name: "bunker_fortress", size: 256,
      prompt: sprite("a massive armored underground bunker fortress war-machine boss, heavy metal plating, multiple gun turrets, glowing red weak-point core, menacing") },
  ],
};
