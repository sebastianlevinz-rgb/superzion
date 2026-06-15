// ═══════════════════════════════════════════════════════════════
// SuperZion — Kaplay Edition
// ═══════════════════════════════════════════════════════════════

import kaplay from "kaplay";
import { bootScene } from "./scenes/boot.js";
import { menuScene } from "./scenes/menu.js";
import { level1BombermanScene } from "./scenes/level1-bomberman.js";
import { level1PlatformerScene } from "./scenes/level1-platformer.js";
import { gameIntroScene } from "./scenes/cinematics/intro.js";
import { level1IntroScene } from "./scenes/cinematics/level1-intro.js";
import { explosionScene } from "./scenes/cinematics/explosion.js";
import { beirutIntroCinematicScene } from "./scenes/cinematics/beirut-intro.js";
import { level2StealthScene } from "./scenes/level2-stealth.js";
import { deepstrikeIntroCinematicScene } from "./scenes/cinematics/deepstrike-intro.js";
import { level3BomberScene } from "./scenes/level3-bomber.js";
import { undergroundIntroCinematicScene } from "./scenes/cinematics/underground-intro.js";
import { level4DroneScene } from "./scenes/level4-drone.js";
import { mountainIntroCinematicScene } from "./scenes/cinematics/mountain-intro.js";
import { level5B2Scene } from "./scenes/level5-b2.js";
import { laststandIntroScene } from "./scenes/cinematics/laststand-intro.js";
import { level6BossScene } from "./scenes/level6-boss.js";
import { victoryScene } from "./scenes/cinematics/victory.js";
import { creditsScene } from "./scenes/cinematics/credits.js";

// CRITICAL: global: false avoids Safari navigation() namespace conflict
const k = kaplay({
  global: false,
  width: 960,
  height: 540,
  background: [0, 0, 0],
  crisp: true,
  stretch: true,
  letterbox: true,
  touchToMouse: true,
  buttons: {
    jump:    { keyboard: ["space", "up", "w"] },
    fire:    { keyboard: ["space"] },
    bomb:    { keyboard: ["space"] },
    dodge:   { keyboard: ["shift"] },
    interact:{ keyboard: ["e"] },
    chaff:   { keyboard: ["c"] },
    pause:   { keyboard: ["escape"] },
    mute:    { keyboard: ["m"] },
    confirm: { keyboard: ["space", "enter"] },
  },
});

// Register scenes
k.scene("boot", () => bootScene(k));
k.scene("menu", () => menuScene(k));
k.scene("game-intro", () => gameIntroScene(k));
k.scene("level1-intro", () => level1IntroScene(k));
k.scene("level1-platformer", () => level1PlatformerScene(k));
k.scene("level1-bomberman", () => level1BombermanScene(k));
k.scene("explosion", () => explosionScene(k));
k.scene("beirut-intro", () => beirutIntroCinematicScene(k));
k.scene("level2-stealth", () => level2StealthScene(k));
k.scene("deepstrike-intro", () => deepstrikeIntroCinematicScene(k));
k.scene("level3-bomber", () => level3BomberScene(k));
k.scene("underground-intro", () => undergroundIntroCinematicScene(k));
k.scene("level4-drone", () => level4DroneScene(k));
k.scene("mountain-intro", () => mountainIntroCinematicScene(k));
k.scene("level5-b2", () => level5B2Scene(k));
k.scene("laststand-intro", () => laststandIntroScene(k));
k.scene("level6-boss", () => level6BossScene(k));
k.scene("victory", () => victoryScene(k));
k.scene("credits", () => creditsScene(k));

// Start
k.go("boot");

export default k;
