// ===================================================================
// Menu Scene — title screen with level selection
// ===================================================================

export function menuScene(k) {
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
    k.pos(480, 120),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);

  // Subtitle
  k.add([
    k.text("OPERATION TEHRAN", { size: 18, font: "monospace" }),
    k.pos(480, 170),
    k.anchor("center"),
    k.color(0, 170, 68),
  ]);

  // Divider
  k.add([
    k.rect(400, 2),
    k.pos(480, 210),
    k.anchor("center"),
    k.color(255, 215, 0),
    k.opacity(0.4),
  ]);

  // Mission briefing text
  k.add([
    k.text("MISSION BRIEFING", { size: 14, font: "monospace" }),
    k.pos(480, 250),
    k.anchor("center"),
    k.color(200, 200, 200),
  ]);

  k.add([
    k.text("Infiltrate enemy compound. Locate intelligence.", { size: 12, font: "monospace" }),
    k.pos(480, 280),
    k.anchor("center"),
    k.color(150, 150, 170),
  ]);

  k.add([
    k.text("Neutralize hostiles. Extract.", { size: 12, font: "monospace" }),
    k.pos(480, 300),
    k.anchor("center"),
    k.color(150, 150, 170),
  ]);

  // Level 1 button border (gold)
  k.add([
    k.rect(324, 54),
    k.pos(480, 380),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);

  // Level 1 button area
  const btnBg = k.add([
    k.rect(320, 50),
    k.pos(480, 380),
    k.anchor("center"),
    k.color(42, 30, 16),
    k.area(),
    "startBtn",
  ]);

  k.add([
    k.text("LEVEL 1: BOMBERMAN", { size: 16, font: "monospace" }),
    k.pos(480, 378),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);

  // Blinking "PRESS SPACE / CLICK" prompt
  const prompt = k.add([
    k.text("PRESS SPACE OR CLICK TO START", { size: 12, font: "monospace" }),
    k.pos(480, 440),
    k.anchor("center"),
    k.color(200, 200, 200),
  ]);

  let blinkTimer = 0;
  prompt.onUpdate(() => {
    blinkTimer += k.dt();
    prompt.opacity = Math.sin(blinkTimer * 3) > 0 ? 1 : 0.3;
  });

  // Controls hint
  k.add([
    k.text("ARROWS: Move | SPACE: Bomb | SHIFT: Dodge", { size: 10, font: "monospace" }),
    k.pos(480, 500),
    k.anchor("center"),
    k.color(100, 100, 120),
  ]);

  // Input handlers
  function startGame() {
    k.go("level1-bomberman");
  }

  k.onKeyPress("space", startGame);
  k.onKeyPress("enter", startGame);
  k.onClick("startBtn", startGame);
}
