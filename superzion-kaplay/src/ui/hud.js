// ===================================================================
// Bomberman HUD — HP hearts, bomb count, key status, timer
// Uses k.fixed() so elements stay on screen regardless of camera
// ===================================================================

export function createBombermanHUD(k, player) {
  // Dark HUD background bar
  const hudBg = k.add([
    k.rect(960, 56),
    k.pos(0, 0),
    k.color(10, 10, 30),
    k.opacity(0.85),
    k.fixed(),
    k.z(100),
  ]);

  // HP label
  const hpLabel = k.add([
    k.text("HP", { size: 12, font: "monospace" }),
    k.pos(15, 8),
    k.fixed(),
    k.z(101),
    k.color(180, 180, 180),
  ]);

  // Heart sprites (up to 3)
  const hearts = [];
  for (let i = 0; i < 3; i++) {
    const heart = k.add([
      k.sprite("bm_heart"),
      k.pos(42 + i * 20, 6),
      k.fixed(),
      k.z(101),
    ]);
    hearts.push(heart);
  }

  // Bombs label
  const bombLabel = k.add([
    k.text("BOMBS", { size: 12, font: "monospace" }),
    k.pos(115, 8),
    k.fixed(),
    k.z(101),
    k.color(180, 180, 180),
  ]);

  const bombCount = k.add([
    k.text("1", { size: 14, font: "monospace" }),
    k.pos(175, 7),
    k.fixed(),
    k.z(101),
    k.color(255, 215, 0),
  ]);

  // Range label
  const rangeLabel = k.add([
    k.text("RNG", { size: 12, font: "monospace" }),
    k.pos(205, 8),
    k.fixed(),
    k.z(101),
    k.color(180, 180, 180),
  ]);

  const rangeCount = k.add([
    k.text("2", { size: 14, font: "monospace" }),
    k.pos(240, 7),
    k.fixed(),
    k.z(101),
    k.color(255, 136, 0),
  ]);

  // Key indicator
  const keyIcon = k.add([
    k.sprite("bm_key_icon"),
    k.pos(280, 6),
    k.fixed(),
    k.z(101),
  ]);

  // Level title (centered)
  const levelTitle = k.add([
    k.text("OPERATION TEHRAN", { size: 14, font: "monospace" }),
    k.pos(480, 7),
    k.anchor("top"),
    k.fixed(),
    k.z(101),
    k.color(255, 215, 0),
  ]);

  // Guards remaining (right side)
  const guardsLabel = k.add([
    k.text("GUARDS: 6", { size: 12, font: "monospace" }),
    k.pos(750, 8),
    k.fixed(),
    k.z(101),
    k.color(255, 100, 100),
  ]);

  // Objective status (right side)
  const objStatus = k.add([
    k.text("OBJ: --", { size: 12, font: "monospace" }),
    k.pos(870, 8),
    k.fixed(),
    k.z(101),
    k.color(100, 255, 100),
  ]);

  // Lower HUD line - timer and controls hint
  const controlsHint = k.add([
    k.text("ARROWS:Move  SPACE:Bomb  SHIFT:Dodge", { size: 10, font: "monospace" }),
    k.pos(480, 30),
    k.anchor("top"),
    k.fixed(),
    k.z(101),
    k.color(100, 100, 120),
  ]);

  // Timer
  let elapsed = 0;

  const timerText = k.add([
    k.text("00:00", { size: 12, font: "monospace" }),
    k.pos(920, 30),
    k.anchor("topright"),
    k.fixed(),
    k.z(101),
    k.color(150, 150, 170),
  ]);

  return {
    update(dt, guardsAlive) {
      // Update hearts
      for (let i = 0; i < 3; i++) {
        if (i < player.hp) {
          hearts[i].use(k.sprite("bm_heart"));
        } else {
          hearts[i].use(k.sprite("bm_heart_empty"));
        }
      }

      // Update bomb count
      bombCount.text = `${player.maxBombs - player.activeBombs}/${player.maxBombs}`;

      // Update range
      rangeCount.text = `${player.bombRange}`;

      // Update key icon
      if (player.hasKey) {
        keyIcon.use(k.sprite("bm_key_icon_active"));
      }

      // Update guards count
      guardsLabel.text = `GUARDS: ${guardsAlive}`;

      // Update timer
      elapsed += dt;
      const mins = Math.floor(elapsed / 60);
      const secs = Math.floor(elapsed % 60);
      timerText.text = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    },

    setObjectiveStatus(status) {
      objStatus.text = `OBJ: ${status}`;
    },
  };
}
