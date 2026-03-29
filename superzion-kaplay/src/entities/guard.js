// ===================================================================
// Bomberman Guard — patrol and chaser types
// Patrol: walks straight, turns 90 on wall collision
// Chaser: random walk, chases player within 3 tiles
// Ported from original Phaser Guard.js to Kaplay
// ===================================================================

import {
  TILE, COLS, ROWS,
  gx, gy, toCol, toRow,
  T_EMPTY, T_OBJ,
} from "../data/level1-config.js";
import { deathParticles } from "../systems/game-juice.js";

const PATROL_SPEED = 75;
const CHASER_SPEED = 60;
const CHASE_SPEED = 82;
const CHASE_RANGE = 3; // tiles (Manhattan)
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // up, down, left, right
const DIR_NAMES = ["up", "down", "left", "right"];

export function createGuard(k, def, gameState) {
  const map = gameState.map;
  const type = def.type; // "patrol" or "chaser"
  const prefix = type === "patrol" ? "bm_patrol" : "bm_chaser";
  const baseSpeed = type === "patrol" ? PATROL_SPEED : CHASER_SPEED;

  const guard = k.add([
    k.sprite(`${prefix}_down_0`),
    k.pos(gx(def.col), gy(def.row)),
    k.anchor("center"),
    k.area({ width: 22, height: 22 }),
    k.body(),
    k.z(10),
    "guard",
    `guard_${type}`,
    {
      guardType: type,
      alive: true,
      baseSpeed,
      speedMult: 1,
      prefix,

      // Direction state
      dirIdx: Math.floor(Math.random() * 4),
      facing: "down",
      vx: 0,
      vy: 0,

      // Animation
      animFrame: 0,
      animTimer: 0,
      _curSprite: `${prefix}_down_0`,

      // Turn timer (patrol behavior)
      turnTimer: 1500 + Math.random() * 2000,

      // Stuck detection
      lastCol: def.col,
      lastRow: def.row,
      stuckTimer: 0,
    },
  ]);

  // Initialize velocity
  applyVelocity(guard);

  // Helper to update sprite (needs k reference)
  function updateSprite() {
    const name = `${guard.prefix}_${guard.facing}_${guard.animFrame}`;
    if (name !== guard._curSprite) {
      guard._curSprite = name;
      guard.use(k.sprite(name));
    }
  }

  guard.onUpdate(() => {
    if (!guard.alive) return;

    const dt = k.dt();
    const dtMs = dt * 1000;

    // Get player reference
    const players = k.get("bomberman_player");
    const playerObj = players.length > 0 ? players[0] : null;

    // Chaser: check for player proximity
    if (guard.guardType === "chaser" && playerObj && !playerObj.dead) {
      const dx = playerObj.pos.x - guard.pos.x;
      const dy = playerObj.pos.y - guard.pos.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      const tileDist = dist / TILE;

      if (tileDist < CHASE_RANGE) {
        // Chase mode: move toward player
        const cs = CHASE_SPEED * guard.speedMult;
        if (Math.abs(dx) > Math.abs(dy)) {
          guard.vx = dx > 0 ? cs : -cs;
          guard.vy = 0;
          guard.facing = dx > 0 ? "right" : "left";
        } else {
          guard.vx = 0;
          guard.vy = dy > 0 ? cs : -cs;
          guard.facing = dy > 0 ? "down" : "up";
        }
        guard.move(guard.vx, guard.vy);
        animateTimer(guard, dtMs);
        updateSprite();
        return;
      }
    }

    // Wall collision / stuck detection
    const curCol = toCol(guard.pos.x);
    const curRow = toRow(guard.pos.y);

    // Check if actually stuck (same tile for too long)
    if (curCol === guard.lastCol && curRow === guard.lastRow) {
      guard.stuckTimer += dtMs;
      if (guard.stuckTimer > 500) {
        pickNewDirection(guard, map);
        guard.stuckTimer = 0;
      }
    } else {
      guard.lastCol = curCol;
      guard.lastRow = curRow;
      guard.stuckTimer = 0;
    }

    // Check if next tile in current direction is blocked
    const [ddx, ddy] = DIRS[guard.dirIdx];
    const nextCol = curCol + ddx;
    const nextRow = curRow + ddy;
    if (
      nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS ||
      (map[nextRow][nextCol] !== T_EMPTY && map[nextRow][nextCol] !== T_OBJ)
    ) {
      pickNewDirection(guard, map);
    }

    // Periodic random turn (patrol behavior)
    guard.turnTimer -= dtMs;
    if (guard.turnTimer <= 0) {
      guard.turnTimer = 1500 + Math.random() * 2000;
      if (Math.random() < 0.4) {
        pickNewDirection(guard, map);
      }
    }

    // Apply movement
    applyVelocity(guard);
    guard.move(guard.vx, guard.vy);

    // Animation
    animateTimer(guard, dtMs);
    updateSprite();
  });

  // Kill method
  guard.kill = function () {
    if (!guard.alive) return;
    guard.alive = false;
    guard.vx = 0;
    guard.vy = 0;

    // Death particles
    deathParticles(k, guard.pos.x, guard.pos.y);

    // Death animation: shrink and fade
    k.tween(
      1, 0, 0.3,
      (v) => {
        guard.scale = k.vec2(v, v);
        guard.opacity = v;
      },
      k.easings.easeOutQuad
    ).onEnd(() => guard.destroy());
  };

  return guard;
}

function pickNewDirection(guard, map) {
  const current = guard.dirIdx;
  const candidates = [0, 1, 2, 3].filter((i) => i !== current);

  // Shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const col = toCol(guard.pos.x);
  const row = toRow(guard.pos.y);

  // Pick first unblocked direction
  for (const idx of candidates) {
    const [dx, dy] = DIRS[idx];
    const nc = col + dx;
    const nr = row + dy;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      const tile = map[nr][nc];
      if (tile === T_EMPTY || tile === T_OBJ) {
        guard.dirIdx = idx;
        guard.facing = DIR_NAMES[idx];
        return;
      }
    }
  }

  // All blocked: reverse
  guard.dirIdx = current < 2 ? (1 - current) : (current === 2 ? 3 : 2);
  guard.facing = DIR_NAMES[guard.dirIdx];
}

function applyVelocity(guard) {
  const speed = guard.baseSpeed * guard.speedMult;
  const [dx, dy] = DIRS[guard.dirIdx];
  guard.vx = dx * speed;
  guard.vy = dy * speed;
}

function animateTimer(guard, dtMs) {
  guard.animTimer += dtMs;
  if (guard.animTimer > 200) {
    guard.animTimer = 0;
    guard.animFrame = 1 - guard.animFrame;
  }
}
