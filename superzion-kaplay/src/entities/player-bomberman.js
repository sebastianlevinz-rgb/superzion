// ===================================================================
// Bomberman Player Entity — movement, dodge, animation, invulnerability
// ===================================================================

import { TILE, GRID_X, GRID_Y, toCol, toRow } from "../data/level1-config.js";

const SPEED = 120;
const SPEED_BOOST = 20; // per speed powerup
const DODGE_SPEED = 280;
const DODGE_DURATION = 0.2;
const DODGE_COOLDOWN = 1.0;
const INVULN_DURATION = 1.5;

export function createBombermanPlayer(k, x, y) {
  const player = k.add([
    k.sprite("bm_player_down_0"),
    k.pos(x, y),
    k.area({ width: 22, height: 22 }),
    k.body(),
    k.anchor("center"),
    k.z(10),
    "player",
    "bomberman_player",
    {
      // Stats
      hp: 3,
      maxHp: 3,
      maxBombs: 1,
      bombRange: 2,
      speedBoosts: 0,
      activeBombs: 0,
      hasKey: false,

      // Movement/animation state
      facing: "down",
      animFrame: 0,
      animTimer: 0,
      moving: false,

      // Invulnerability
      invulnerable: false,
      invulnTimer: 0,

      // Dodge
      isDodging: false,
      dodgeTimer: 0,
      dodgeCooldownTimer: 0,
      dodgeDirX: 0,
      dodgeDirY: 0,

      // Frozen (cutscene etc)
      frozen: false,

      // Dead flag
      dead: false,
    },
  ]);

  // ── Movement input ──
  function getSpeed() {
    return SPEED + player.speedBoosts * SPEED_BOOST;
  }

  player.onUpdate(() => {
    if (player.dead || player.frozen) return;

    const dt = k.dt();

    // Dodge cooldown
    if (player.dodgeCooldownTimer > 0) {
      player.dodgeCooldownTimer -= dt;
    }

    // Active dodge movement
    if (player.isDodging) {
      player.dodgeTimer -= dt;
      player.pos.x += player.dodgeDirX * DODGE_SPEED * dt;
      player.pos.y += player.dodgeDirY * DODGE_SPEED * dt;
      if (player.dodgeTimer <= 0) {
        player.isDodging = false;
        player.invulnerable = false;
      }
      return; // skip normal movement during dodge
    }

    // Invulnerability timer
    if (player.invulnerable) {
      player.invulnTimer -= dt;
      // Flash effect
      player.opacity = Math.sin(player.invulnTimer * 15) > 0 ? 1.0 : 0.3;
      if (player.invulnTimer <= 0) {
        player.invulnerable = false;
        player.opacity = 1.0;
      }
    }

    // Movement (keyboard + touch)
    const t = player._touch;
    let dx = 0, dy = 0;
    if (k.isKeyDown("left") || k.isKeyDown("a") || t?.left) { dx = -1; player.facing = "left"; }
    else if (k.isKeyDown("right") || k.isKeyDown("d") || t?.right) { dx = 1; player.facing = "right"; }

    if (k.isKeyDown("up") || k.isKeyDown("w") || t?.up) { dy = -1; player.facing = "up"; }
    else if (k.isKeyDown("down") || k.isKeyDown("s") || t?.down) { dy = 1; player.facing = "down"; }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    const speed = getSpeed();
    player.move(dx * speed, dy * speed);
    player.moving = dx !== 0 || dy !== 0;

    // Walk animation
    if (player.moving) {
      player.animTimer += dt * 1000;
      if (player.animTimer > 180) {
        player.animTimer = 0;
        player.animFrame = 1 - player.animFrame;
      }
    } else {
      player.animFrame = 0;
      player.animTimer = 0;
    }

    // Update sprite
    player.use(k.sprite(`bm_player_${player.facing}_${player.animFrame}`));
  });

  // ── Dodge ──
  player.dodge = function () {
    if (player.isDodging || player.dodgeCooldownTimer > 0 || player.dead) return false;

    // Dodge in facing direction
    const dirMap = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
    };
    const [ddx, ddy] = dirMap[player.facing];

    player.isDodging = true;
    player.invulnerable = true;
    player.dodgeTimer = DODGE_DURATION;
    player.dodgeCooldownTimer = DODGE_COOLDOWN;
    player.dodgeDirX = ddx;
    player.dodgeDirY = ddy;
    player.opacity = 0.5;
    return true;
  };

  // ── Take damage ──
  player.takeDamage = function (amount = 1) {
    if (player.invulnerable || player.dead) return false;

    player.hp -= amount;
    player.invulnerable = true;
    player.invulnTimer = INVULN_DURATION;

    if (player.hp <= 0) {
      player.dead = true;
      player.opacity = 0.3;
      return true; // dead
    }
    return false;
  };

  // ── Grid position helpers ──
  player.getCol = function () { return toCol(player.pos.x); };
  player.getRow = function () { return toRow(player.pos.y); };

  return player;
}
