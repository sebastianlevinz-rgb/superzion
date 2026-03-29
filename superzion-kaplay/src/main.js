// ═══════════════════════════════════════════════════════════════
// SuperZion — Kaplay Edition
// ═══════════════════════════════════════════════════════════════

import kaplay from "kaplay";
import { bootScene } from "./scenes/boot.js";
import { menuScene } from "./scenes/menu.js";
import { level1BombermanScene } from "./scenes/level1-bomberman.js";

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
k.scene("level1-bomberman", () => level1BombermanScene(k));

// Start
k.go("boot");

export default k;
