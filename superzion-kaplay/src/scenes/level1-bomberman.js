// ===================================================================
// Level 1 Bomberman Scene — Operation Tehran
// Full playable bomberman: grid, player, guards, bombs, explosions,
// powerups, HUD, win/lose conditions
// ===================================================================

import {
  TILE, COLS, ROWS, GRID_X, GRID_Y,
  T_EMPTY, T_WALL, T_BREAK, T_DOOR, T_GDOOR, T_OBJ,
  SPAWN, OBJ, GUARD_DEFS,
  gx, gy, toCol, toRow,
  generateMap,
} from "../data/level1-config.js";
import { generateBombermanTextures } from "../systems/texture-factory.js";
import { createBombermanPlayer } from "../entities/player-bomberman.js";
import { placeBomb } from "../entities/bomb.js";
import { createGuard } from "../entities/guard.js";
import { createBombermanHUD } from "../ui/hud.js";
import { screenFlash, pickupParticles } from "../systems/game-juice.js";

export function level1BombermanScene(k) {
  // Ensure textures are generated (idempotent)
  generateBombermanTextures(k);

  // No gravity for top-down
  k.setGravity(0);

  // ═══════════════════════════════════════════════════════════
  // GAME STATE
  // ═══════════════════════════════════════════════════════════
  const { map, powerups } = generateMap();
  const gameState = {
    map,
    powerups,
    guards: [],
    objectiveReached: false,
    levelComplete: false,
    gameOver: false,
  };

  // ═══════════════════════════════════════════════════════════
  // BACKGROUND — sky blue behind grid + desert floor
  // ═══════════════════════════════════════════════════════════

  // Sky
  k.add([
    k.rect(960, 540),
    k.pos(0, 0),
    k.color(135, 180, 220),
    k.z(-10),
  ]);

  // Desert ground under grid
  k.add([
    k.rect(960, 540 - GRID_Y + 10),
    k.pos(0, GRID_Y - 5),
    k.color(180, 160, 120),
    k.z(-9),
  ]);

  // Grid border shadow
  k.add([
    k.rect(COLS * TILE + 6, ROWS * TILE + 6),
    k.pos(GRID_X - 3, GRID_Y - 3),
    k.color(0, 0, 0),
    k.opacity(0.3),
    k.z(-5),
  ]);

  // ═══════════════════════════════════════════════════════════
  // BUILD GRID
  // ═══════════════════════════════════════════════════════════

  // Floor tiles (draw floor under everything)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      k.add([
        k.sprite("bm_floor"),
        k.pos(GRID_X + c * TILE, GRID_Y + r * TILE),
        k.z(-1),
      ]);
    }
  }

  // Place map tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = map[r][c];
      const tx = GRID_X + c * TILE;
      const ty = GRID_Y + r * TILE;

      if (tile === T_WALL) {
        k.add([
          k.sprite("bm_wall"),
          k.pos(tx + TILE / 2, ty + TILE / 2),
          k.anchor("center"),
          k.area({ width: TILE, height: TILE }),
          k.body({ isStatic: true }),
          k.z(2),
          "wall",
        ]);
      } else if (tile === T_BREAK) {
        k.add([
          k.sprite("bm_breakable"),
          k.pos(tx + TILE / 2, ty + TILE / 2),
          k.anchor("center"),
          k.area({ width: TILE, height: TILE }),
          k.body({ isStatic: true }),
          k.z(2),
          "breakable",
          { _col: c, _row: r },
        ]);
      } else if (tile === T_DOOR) {
        k.add([
          k.sprite("bm_door"),
          k.pos(tx + TILE / 2, ty + TILE / 2),
          k.anchor("center"),
          k.area({ width: TILE, height: TILE }),
          k.body({ isStatic: true }),
          k.z(2),
          "door",
          { _col: c, _row: r },
        ]);
      } else if (tile === T_GDOOR) {
        k.add([
          k.sprite("bm_gdoor"),
          k.pos(tx + TILE / 2, ty + TILE / 2),
          k.anchor("center"),
          k.area({ width: TILE, height: TILE }),
          k.body({ isStatic: true }),
          k.z(2),
          "gdoor",
          { _col: c, _row: r },
        ]);
      } else if (tile === T_OBJ) {
        k.add([
          k.sprite("bm_obj"),
          k.pos(tx + TILE / 2, ty + TILE / 2),
          k.anchor("center"),
          k.area({ width: 28, height: 28 }),
          k.z(2),
          "objective",
          { _col: c, _row: r },
        ]);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PLAYER
  // ═══════════════════════════════════════════════════════════

  const player = createBombermanPlayer(k, gx(SPAWN.col), gy(SPAWN.row));

  // ═══════════════════════════════════════════════════════════
  // GUARDS
  // ═══════════════════════════════════════════════════════════

  for (const def of GUARD_DEFS) {
    const guard = createGuard(k, def, gameState);
    gameState.guards.push(guard);
  }

  // ═══════════════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════════════

  const hud = createBombermanHUD(k, player);

  // ═══════════════════════════════════════════════════════════
  // INPUT — Bomb placement
  // ═══════════════════════════════════════════════════════════

  k.onKeyPress("space", () => {
    if (player.dead || player.frozen || gameState.levelComplete || gameState.gameOver) return;
    if (player.activeBombs >= player.maxBombs) return;

    const col = player.getCol();
    const row = player.getRow();

    const bomb = placeBomb(k, col, row, player.bombRange, player, gameState);
    if (bomb) {
      player.activeBombs++;
    }
  });

  // Dodge
  k.onKeyPress("shift", () => {
    if (player.dead || player.frozen || gameState.levelComplete || gameState.gameOver) return;
    player.dodge();
  });

  // ═══════════════════════════════════════════════════════════
  // COLLISION HANDLERS
  // ═══════════════════════════════════════════════════════════

  // Player touches guard
  k.onCollide("player", "guard", (p, g) => {
    if (p.dead || p.invulnerable || !g.alive) return;
    const died = p.takeDamage(1);
    screenFlash(k, 255, 0, 0, 200, 0.35);
    k.shake(5);
    if (died) {
      handleGameOver(k, gameState);
    }
  });

  // Explosion hits guard
  k.onCollide("explosion", "guard", (e, g) => {
    if (!g.alive) return;
    g.kill();
  });

  // Explosion hits player
  k.onCollide("explosion", "player", (e, p) => {
    if (p.dead || p.invulnerable || p.isDodging) return;
    const died = p.takeDamage(1);
    screenFlash(k, 255, 0, 0, 200, 0.35);
    k.shake(5);
    if (died) {
      handleGameOver(k, gameState);
    }
  });

  // Player touches powerup
  k.onCollide("player", "powerup", (p, pu) => {
    if (p.dead) return;
    const type = pu.powerupType;

    if (type === "bomb") {
      p.maxBombs = Math.min(p.maxBombs + 1, 5);
    } else if (type === "range") {
      p.bombRange = Math.min(p.bombRange + 1, 6);
    } else if (type === "speed") {
      p.speedBoosts = Math.min(p.speedBoosts + 1, 4);
    } else if (type === "key") {
      p.hasKey = true;
      screenFlash(k, 255, 215, 0, 300, 0.3);
    }

    pickupParticles(k, pu.pos.x, pu.pos.y);
    pu.destroy();
  });

  // Player touches objective
  k.onCollide("player", "objective", (p, obj) => {
    if (p.dead || gameState.objectiveReached) return;
    gameState.objectiveReached = true;
    hud.setObjectiveStatus("COMPLETE");
    screenFlash(k, 0, 255, 100, 300, 0.3);
    k.shake(3);

    // Spawn key powerup near objective
    spawnKeyPowerup(k, OBJ.col, OBJ.row);

    // Show exit
    showExitMarker(k, gameState);
  });

  // Player touches golden door
  k.onCollide("player", "gdoor", (p, door) => {
    if (!p.hasKey || p.dead) return;
    // Unlock golden door
    gameState.map[door._row][door._col] = T_EMPTY;
    screenFlash(k, 255, 215, 0, 300, 0.4);
    k.shake(3);
    k.tween(
      1, 0, 0.3,
      (v) => { door.scale = k.vec2(v, v); door.opacity = v; },
      k.easings.easeOutQuad
    ).onEnd(() => door.destroy());
  });

  // Player touches exit
  k.onCollide("player", "exit_marker", (p, e) => {
    if (p.dead || gameState.levelComplete) return;
    handleLevelComplete(k, gameState, player, hud);
  });

  // ═══════════════════════════════════════════════════════════
  // GAME LOOP UPDATE
  // ═══════════════════════════════════════════════════════════

  k.onUpdate(() => {
    if (gameState.levelComplete || gameState.gameOver) return;

    const guardsAlive = gameState.guards.filter((g) => g.alive).length;
    hud.update(k.dt(), guardsAlive);

    // Keep player within grid bounds
    clampToGrid(player);
  });
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function clampToGrid(player) {
  const minX = GRID_X + TILE / 2 + 2;
  const maxX = GRID_X + (COLS - 1) * TILE + TILE / 2 - 2;
  const minY = GRID_Y + TILE / 2 + 2;
  const maxY = GRID_Y + (ROWS - 1) * TILE + TILE / 2 - 2;

  if (player.pos.x < minX) player.pos.x = minX;
  if (player.pos.x > maxX) player.pos.x = maxX;
  if (player.pos.y < minY) player.pos.y = minY;
  if (player.pos.y > maxY) player.pos.y = maxY;
}

function spawnKeyPowerup(k, col, row) {
  // Place key powerup one tile away from objective
  const candidates = [
    { c: col + 1, r: row },
    { c: col - 1, r: row },
    { c: col, r: row + 1 },
    { c: col, r: row - 1 },
  ];

  for (const pos of candidates) {
    if (pos.c >= 0 && pos.c < COLS && pos.r >= 0 && pos.r < ROWS) {
      const px = gx(pos.c);
      const py = gy(pos.r);

      const pup = k.add([
        k.sprite("bm_powerup_key"),
        k.pos(px, py),
        k.anchor("center"),
        k.area({ width: 20, height: 20 }),
        k.z(3),
        "powerup",
        { powerupType: "key", _col: pos.c, _row: pos.r },
      ]);

      // Glow effect
      const startY = py;
      pup.onUpdate(() => {
        pup.pos.y = startY + Math.sin(k.time() * 3) * 2;
      });
      break;
    }
  }
}

function showExitMarker(k, gameState) {
  // Place exit at spawn location (player needs to go back)
  const ex = gx(SPAWN.col);
  const ey = gy(SPAWN.row);

  k.add([
    k.sprite("bm_exit"),
    k.pos(ex, ey),
    k.anchor("center"),
    k.area({ width: 28, height: 28 }),
    k.z(1),
    "exit_marker",
  ]);
}

function handleGameOver(k, gameState) {
  if (gameState.gameOver) return;
  gameState.gameOver = true;

  screenFlash(k, 255, 0, 0, 500, 0.5);
  k.shake(10);

  // Game over overlay
  k.wait(0.5, () => {
    k.add([
      k.rect(960, 540),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.7),
      k.fixed(),
      k.z(200),
    ]);

    k.add([
      k.text("MISSION FAILED", { size: 36, font: "monospace" }),
      k.pos(480, 220),
      k.anchor("center"),
      k.color(255, 68, 68),
      k.fixed(),
      k.z(201),
    ]);

    k.add([
      k.text("Agent down. Operation compromised.", { size: 14, font: "monospace" }),
      k.pos(480, 270),
      k.anchor("center"),
      k.color(200, 200, 200),
      k.fixed(),
      k.z(201),
    ]);

    const retryText = k.add([
      k.text("PRESS SPACE TO RETRY", { size: 16, font: "monospace" }),
      k.pos(480, 340),
      k.anchor("center"),
      k.color(255, 215, 0),
      k.fixed(),
      k.z(201),
    ]);

    let bt = 0;
    retryText.onUpdate(() => {
      bt += k.dt();
      retryText.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3;
    });

    k.onKeyPress("space", () => {
      k.go("level1-bomberman");
    });

    k.onClick(() => {
      k.go("level1-bomberman");
    });
  });
}

function handleLevelComplete(k, gameState, player, hud) {
  if (gameState.levelComplete) return;
  gameState.levelComplete = true;
  player.frozen = true;

  screenFlash(k, 0, 255, 100, 400, 0.4);
  k.shake(5);

  k.wait(0.8, () => {
    k.add([
      k.rect(960, 540),
      k.pos(0, 0),
      k.color(0, 0, 0),
      k.opacity(0.7),
      k.fixed(),
      k.z(200),
    ]);

    k.add([
      k.text("MISSION COMPLETE", { size: 36, font: "monospace" }),
      k.pos(480, 200),
      k.anchor("center"),
      k.color(0, 255, 100),
      k.fixed(),
      k.z(201),
    ]);

    k.add([
      k.text("Operation Tehran - Phase 1 Successful", { size: 14, font: "monospace" }),
      k.pos(480, 250),
      k.anchor("center"),
      k.color(200, 200, 200),
      k.fixed(),
      k.z(201),
    ]);

    const guardsKilled = gameState.guards.filter((g) => !g.alive).length;
    k.add([
      k.text(`Hostiles neutralized: ${guardsKilled}/${gameState.guards.length}`, { size: 12, font: "monospace" }),
      k.pos(480, 290),
      k.anchor("center"),
      k.color(150, 150, 170),
      k.fixed(),
      k.z(201),
    ]);

    const continueText = k.add([
      k.text("PRESS SPACE TO CONTINUE", { size: 16, font: "monospace" }),
      k.pos(480, 360),
      k.anchor("center"),
      k.color(255, 215, 0),
      k.fixed(),
      k.z(201),
    ]);

    let bt = 0;
    continueText.onUpdate(() => {
      bt += k.dt();
      continueText.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3;
    });

    k.onKeyPress("space", () => {
      k.go("menu");
    });

    k.onClick(() => {
      k.go("menu");
    });
  });
}
