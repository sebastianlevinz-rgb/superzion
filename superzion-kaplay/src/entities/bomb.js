// ===================================================================
// Bomb Entity — timed explosion in cross pattern
// Destroys breakable walls, damages guards/player, chain reacts
// ===================================================================

import {
  TILE, GRID_X, GRID_Y, COLS, ROWS,
  T_EMPTY, T_WALL, T_BREAK, T_DOOR,
  gx, gy, toCol, toRow,
} from "../data/level1-config.js";
import { screenFlash, impactParticles } from "../systems/game-juice.js";

const FUSE_TIME = 3.0;
const EXPLOSION_DURATION = 0.4;

export function placeBomb(k, col, row, range, owner, gameState) {
  const bx = gx(col);
  const by = gy(row);

  // Prevent placing on existing bomb
  const existing = k.get("bomb").filter(
    (b) => toCol(b.pos.x) === col && toRow(b.pos.y) === row
  );
  if (existing.length > 0) return null;

  const bomb = k.add([
    k.sprite("bm_bomb"),
    k.pos(bx, by),
    k.anchor("center"),
    k.area({ width: 28, height: 28 }),
    k.z(5),
    "bomb",
    {
      col,
      row,
      range,
      owner,
      fuseTimer: FUSE_TIME,
      exploded: false,
    },
  ]);

  // Pulsing animation
  let pulseDir = 1;
  bomb.onUpdate(() => {
    bomb.fuseTimer -= k.dt();

    // Pulse scale as fuse burns
    const t = 1 - bomb.fuseTimer / FUSE_TIME;
    const pulseSpeed = 3 + t * 8; // pulse faster as timer runs out
    const scale = 1 + Math.sin(k.time() * pulseSpeed) * 0.08;
    bomb.scale = k.vec2(scale, scale);

    if (bomb.fuseTimer <= 0 && !bomb.exploded) {
      explodeBomb(k, bomb, gameState);
    }
  });

  return bomb;
}

function explodeBomb(k, bomb, gameState) {
  if (bomb.exploded) return;
  bomb.exploded = true;

  const col = bomb.col;
  const row = bomb.row;
  const range = bomb.range;

  // Decrement owner active bombs
  if (bomb.owner && bomb.owner.activeBombs > 0) {
    bomb.owner.activeBombs--;
  }

  bomb.destroy();

  // Screen effects
  k.shake(3);
  screenFlash(k, 255, 100, 0, 120, 0.25);

  // Create explosion at center
  createExplosionTile(k, col, row, "bm_explode_center", gameState);

  // Four directions
  const dirs = [
    { dc: 0, dr: -1, sprite: "bm_explode_v" }, // up
    { dc: 0, dr: 1, sprite: "bm_explode_v" },  // down
    { dc: -1, dr: 0, sprite: "bm_explode_h" }, // left
    { dc: 1, dr: 0, sprite: "bm_explode_h" },  // right
  ];

  for (const dir of dirs) {
    for (let i = 1; i <= range; i++) {
      const tc = col + dir.dc * i;
      const tr = row + dir.dr * i;

      // Bounds check
      if (tc < 0 || tc >= COLS || tr < 0 || tr >= ROWS) break;

      const tile = gameState.map[tr][tc];

      // Indestructible wall: stop
      if (tile === T_WALL) break;

      // Breakable wall: destroy it, then stop
      if (tile === T_BREAK) {
        destroyBreakable(k, tc, tr, gameState);
        createExplosionTile(k, tc, tr, dir.sprite, gameState);
        break;
      }

      // Door: destroy it, then stop
      if (tile === T_DOOR) {
        destroyDoor(k, tc, tr, gameState);
        createExplosionTile(k, tc, tr, dir.sprite, gameState);
        break;
      }

      // Empty or other passable: create explosion
      createExplosionTile(k, tc, tr, dir.sprite, gameState);
    }
  }

  // Chain-react: trigger any bombs in the explosion range
  k.wait(0.05, () => {
    const allBombs = k.get("bomb");
    for (const b of allBombs) {
      if (b.exploded) continue;
      const bc = toCol(b.pos.x);
      const br = toRow(b.pos.y);
      // Check if this bomb is within the explosion area
      if (bc === col && br === row) continue; // already exploded
      const dcb = bc - col;
      const drb = br - row;
      // Same row or column, within range
      if ((dcb === 0 && Math.abs(drb) <= range) || (drb === 0 && Math.abs(dcb) <= range)) {
        b.fuseTimer = 0; // triggers explosion on next frame
      }
    }
  });
}

function createExplosionTile(k, col, row, spriteName, gameState) {
  const ex = gx(col);
  const ey = gy(row);

  const explosion = k.add([
    k.sprite(spriteName),
    k.pos(ex, ey),
    k.anchor("center"),
    k.area({ width: 28, height: 28 }),
    k.z(15),
    "explosion",
    {
      col,
      row,
    },
  ]);

  // Particles
  impactParticles(k, ex, ey, 3, [[255, 200, 50], [255, 100, 0]]);

  // Fade and remove
  k.tween(
    1.0, 0, EXPLOSION_DURATION,
    (v) => { explosion.opacity = v; },
    k.easings.easeOutQuad
  ).onEnd(() => explosion.destroy());
}

function destroyBreakable(k, col, row, gameState) {
  gameState.map[row][col] = T_EMPTY;

  // Find and destroy the breakable wall object
  const walls = k.get("breakable");
  for (const w of walls) {
    if (w._col === col && w._row === row) {
      // Shrink + fade destruction animation
      k.tween(
        1, 0, 0.25,
        (v) => {
          w.scale = k.vec2(v, v);
          w.opacity = v;
        },
        k.easings.easeOutQuad
      ).onEnd(() => w.destroy());
      break;
    }
  }

  // Check for powerup hidden under this crate
  const pup = gameState.powerups[row][col];
  if (pup) {
    spawnPowerup(k, col, row, pup);
    gameState.powerups[row][col] = null;
  }
}

function destroyDoor(k, col, row, gameState) {
  gameState.map[row][col] = T_EMPTY;

  const doors = k.get("door");
  for (const d of doors) {
    if (d._col === col && d._row === row) {
      k.tween(
        1, 0, 0.3,
        (v) => {
          d.scale = k.vec2(v, v);
          d.opacity = v;
        },
        k.easings.easeOutQuad
      ).onEnd(() => d.destroy());
      break;
    }
  }

  screenFlash(k, 0, 255, 100, 200, 0.3);
}

function spawnPowerup(k, col, row, type) {
  const px = gx(col);
  const py = gy(row);

  const powerup = k.add([
    k.sprite(`bm_powerup_${type}`),
    k.pos(px, py),
    k.anchor("center"),
    k.area({ width: 20, height: 20 }),
    k.z(3),
    "powerup",
    {
      powerupType: type,
      _col: col,
      _row: row,
    },
  ]);

  // Gentle bob animation
  const startY = py;
  powerup.onUpdate(() => {
    powerup.pos.y = startY + Math.sin(k.time() * 3) * 2;
  });
}

// Export for chain reactions triggered externally
export function triggerBombAt(k, col, row) {
  const bombs = k.get("bomb");
  for (const b of bombs) {
    if (b.col === col && b.row === row && !b.exploded) {
      b.fuseTimer = 0;
    }
  }
}
