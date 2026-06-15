// ===================================================================
// Menu Scene — title screen with level selection
// ===================================================================

import { isMobile } from '../systems/touch-input.js';

export function menuScene(k) {
  const mobile = isMobile();
  // Dark blue background
  k.add([
    k.rect(960, 540),
    k.pos(0, 0),
    k.color(10, 10, 46),
  ]);

  // Decorative lines (military briefing feel)
  for (let i = 0; i < 5; i++) {
    k.add([
      k.rect(960, 1),
      k.pos(0, 80 + i * 90),
      k.color(30, 30, 70),
      k.opacity(0.5),
    ]);
  }

  // Title
  k.add([
    k.text("SUPERZION", { size: 48, font: "monospace" }),
    k.pos(480, 60),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);

  // Subtitle
  k.add([
    k.text("OPERATION TEHRAN", { size: 18, font: "monospace" }),
    k.pos(480, 100),
    k.anchor("center"),
    k.color(0, 170, 68),
  ]);

  // Divider
  k.add([
    k.rect(400, 2),
    k.pos(480, 122),
    k.anchor("center"),
    k.color(255, 215, 0),
    k.opacity(0.4),
  ]);

  // Mission briefing text
  k.add([
    k.text("MISSION BRIEFING", { size: 14, font: "monospace" }),
    k.pos(480, 140),
    k.anchor("center"),
    k.color(200, 200, 200),
  ]);

  k.add([
    k.text("Infiltrate. Eliminate. Strike from above.", { size: 12, font: "monospace" }),
    k.pos(480, 160),
    k.anchor("center"),
    k.color(150, 150, 170),
  ]);

  // All levels unlocked — free selection
  const levelProgress = 99;

  // Button layout: 6 buttons stacked with tighter spacing
  const btnStartY = 190;
  const btnSpacing = 42;

  // ── Level 1 button ──
  const l1Y = btnStartY;
  k.add([
    k.rect(324, 40),
    k.pos(480, l1Y),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);
  k.add([
    k.rect(320, 36),
    k.pos(480, l1Y),
    k.anchor("center"),
    k.color(42, 30, 16),
    k.area(),
    "startBtn",
  ]);
  k.add([
    k.text("LEVEL 1: TEHRAN ROOFTOP", { size: 13, font: "monospace" }),
    k.pos(480, l1Y - 1),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);

  // ── Level 2 button ──
  const l2Y = btnStartY + btnSpacing;
  const l2Unlocked = levelProgress >= 2;
  k.add([
    k.rect(324, 40),
    k.pos(480, l2Y),
    k.anchor("center"),
    k.color(l2Unlocked ? 0 : 60, l2Unlocked ? 170 : 60, l2Unlocked ? 68 : 60),
  ]);
  k.add([
    k.rect(320, 36),
    k.pos(480, l2Y),
    k.anchor("center"),
    k.color(l2Unlocked ? 16 : 30, l2Unlocked ? 30 : 30, l2Unlocked ? 42 : 30),
    k.area(),
    "level2Btn",
  ]);
  k.add([
    k.text(l2Unlocked ? "LEVEL 2: GRIM BEEPER" : "LEVEL 2: LOCKED", { size: 13, font: "monospace" }),
    k.pos(480, l2Y - 1),
    k.anchor("center"),
    k.color(l2Unlocked ? 0 : 80, l2Unlocked ? 200 : 80, l2Unlocked ? 100 : 80),
  ]);

  // ── Level 3 button ──
  const l3Y = btnStartY + btnSpacing * 2;
  const l3Unlocked = levelProgress >= 3;
  k.add([
    k.rect(324, 40),
    k.pos(480, l3Y),
    k.anchor("center"),
    k.color(l3Unlocked ? 255 : 60, l3Unlocked ? 102 : 60, l3Unlocked ? 0 : 60),
  ]);
  k.add([
    k.rect(320, 36),
    k.pos(480, l3Y),
    k.anchor("center"),
    k.color(l3Unlocked ? 42 : 30, l3Unlocked ? 16 : 30, l3Unlocked ? 8 : 30),
    k.area(),
    "level3Btn",
  ]);
  k.add([
    k.text(l3Unlocked ? "LEVEL 3: DEEP STRIKE" : "LEVEL 3: LOCKED", { size: 13, font: "monospace" }),
    k.pos(480, l3Y - 1),
    k.anchor("center"),
    k.color(l3Unlocked ? 255 : 80, l3Unlocked ? 136 : 80, l3Unlocked ? 0 : 80),
  ]);

  // ── Level 4 button ──
  const l4Y = btnStartY + btnSpacing * 3;
  const l4Unlocked = levelProgress >= 4;
  k.add([
    k.rect(324, 40),
    k.pos(480, l4Y),
    k.anchor("center"),
    k.color(l4Unlocked ? 255 : 60, l4Unlocked ? 68 : 60, l4Unlocked ? 68 : 60),
  ]);
  k.add([
    k.rect(320, 36),
    k.pos(480, l4Y),
    k.anchor("center"),
    k.color(l4Unlocked ? 42 : 30, l4Unlocked ? 8 : 30, l4Unlocked ? 16 : 30),
    k.area(),
    "level4Btn",
  ]);
  k.add([
    k.text(l4Unlocked ? "LEVEL 4: LAST CHAIR" : "LEVEL 4: LOCKED", { size: 13, font: "monospace" }),
    k.pos(480, l4Y - 1),
    k.anchor("center"),
    k.color(l4Unlocked ? 255 : 80, l4Unlocked ? 100 : 80, l4Unlocked ? 100 : 80),
  ]);

  // ── Level 5 button ──
  const l5Y = btnStartY + btnSpacing * 4;
  const l5Unlocked = levelProgress >= 5;
  k.add([
    k.rect(324, 40),
    k.pos(480, l5Y),
    k.anchor("center"),
    k.color(l5Unlocked ? 170 : 60, l5Unlocked ? 170 : 60, l5Unlocked ? 204 : 60),
  ]);
  k.add([
    k.rect(320, 36),
    k.pos(480, l5Y),
    k.anchor("center"),
    k.color(l5Unlocked ? 20 : 30, l5Unlocked ? 20 : 30, l5Unlocked ? 30 : 30),
    k.area(),
    "level5Btn",
  ]);
  k.add([
    k.text(l5Unlocked ? "LEVEL 5: MOUNTAIN BREAKER" : "LEVEL 5: LOCKED", { size: 13, font: "monospace" }),
    k.pos(480, l5Y - 1),
    k.anchor("center"),
    k.color(l5Unlocked ? 170 : 80, l5Unlocked ? 170 : 80, l5Unlocked ? 255 : 80),
  ]);

  // ── Level 6 button ──
  const l6Y = btnStartY + btnSpacing * 5;
  const l6Unlocked = levelProgress >= 6;
  k.add([
    k.rect(324, 40),
    k.pos(480, l6Y),
    k.anchor("center"),
    k.color(l6Unlocked ? 255 : 60, l6Unlocked ? 34 : 60, l6Unlocked ? 34 : 60),
  ]);
  k.add([
    k.rect(320, 36),
    k.pos(480, l6Y),
    k.anchor("center"),
    k.color(l6Unlocked ? 42 : 30, l6Unlocked ? 8 : 30, l6Unlocked ? 8 : 30),
    k.area(),
    "level6Btn",
  ]);
  k.add([
    k.text(l6Unlocked ? "LEVEL 6: OPERATION ENDGAME" : "LEVEL 6: LOCKED", { size: 13, font: "monospace" }),
    k.pos(480, l6Y - 1),
    k.anchor("center"),
    k.color(l6Unlocked ? 255 : 80, l6Unlocked ? 68 : 80, l6Unlocked ? 68 : 80),
  ]);

  // Blinking "PRESS SPACE / CLICK" prompt
  const promptLabel = mobile ? "TAP A LEVEL TO START" : "PRESS SPACE OR CLICK TO START";
  const prompt = k.add([
    k.text(promptLabel, { size: mobile ? 16 : 12, font: "monospace" }),
    k.pos(480, 470),
    k.anchor("center"),
    k.color(200, 200, 200),
  ]);

  let blinkTimer = 0;
  prompt.onUpdate(() => {
    blinkTimer += k.dt();
    prompt.opacity = Math.sin(blinkTimer * 3) > 0 ? 1 : 0.3;
  });

  // Controls hint
  const controlsLabel = mobile
    ? "Touch controls appear during gameplay"
    : "ARROWS/WASD: Move | SPACE: Action | C: Chaff | SHIFT: Dash";
  k.add([
    k.text(controlsLabel, { size: mobile ? 12 : 10, font: "monospace" }),
    k.pos(480, 500),
    k.anchor("center"),
    k.color(100, 100, 120),
  ]);

  // Input handlers
  function startLevel1() {
    k.go("game-intro");
  }
  function startLevel2() {
    if (!l2Unlocked) return;
    k.go("beirut-intro");
  }
  function startLevel3() {
    if (!l3Unlocked) return;
    k.go("deepstrike-intro");
  }
  function startLevel4() {
    if (!l4Unlocked) return;
    k.go("underground-intro");
  }
  function startLevel5() {
    if (!l5Unlocked) return;
    k.go("mountain-intro");
  }
  function startLevel6() {
    if (!l6Unlocked) return;
    k.go("laststand-intro");
  }

  k.onKeyPress("space", startLevel1);
  k.onKeyPress("enter", startLevel1);
  k.onClick("startBtn", startLevel1);
  k.onClick("level2Btn", startLevel2);
  k.onClick("level3Btn", startLevel3);
  k.onClick("level4Btn", startLevel4);
  k.onClick("level5Btn", startLevel5);
  k.onClick("level6Btn", startLevel6);

  // Key shortcuts
  k.onKeyPress("2", startLevel2);
  k.onKeyPress("3", startLevel3);
  k.onKeyPress("4", startLevel4);
  k.onKeyPress("5", startLevel5);
  k.onKeyPress("6", startLevel6);
}
