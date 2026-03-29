// ===================================================================
// Boot Scene — audio unlock on mobile, quick start on desktop
// ===================================================================

import { generateBombermanTextures } from "../systems/texture-factory.js";

export function bootScene(k) {
  const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Generate all textures during boot so they are ready for gameplay
  generateBombermanTextures(k);

  // Dark background
  k.add([
    k.rect(960, 540),
    k.pos(0, 0),
    k.color(10, 10, 30),
  ]);

  // Title
  k.add([
    k.text("SUPERZION", { size: 36, font: "monospace" }),
    k.pos(480, 200),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);

  // Star of David decoration (simple text)
  k.add([
    k.text("*", { size: 24, font: "monospace" }),
    k.pos(480, 260),
    k.anchor("center"),
    k.color(255, 215, 0),
  ]);

  if (isMobile) {
    // Mobile: require tap to unlock audio context
    const tapText = k.add([
      k.text("TAP TO START", { size: 20, font: "monospace" }),
      k.pos(480, 340),
      k.anchor("center"),
      k.color(200, 200, 200),
    ]);

    // Blink effect
    let blinkTimer = 0;
    tapText.onUpdate(() => {
      blinkTimer += k.dt();
      tapText.opacity = Math.sin(blinkTimer * 3) > 0 ? 1 : 0.3;
    });

    k.onClick(() => {
      k.go("menu");
    });
  } else {
    // Desktop: show loading briefly then proceed
    const loadText = k.add([
      k.text("LOADING...", { size: 16, font: "monospace" }),
      k.pos(480, 340),
      k.anchor("center"),
      k.color(150, 150, 150),
    ]);

    k.wait(0.8, () => {
      k.go("menu");
    });
  }
}
