// ===================================================================
// Level 1 Platformer — Tehran Rooftop Run
// Side-scrolling platformer: jump across rooftops at night,
// shoot guards, reach the target building to enter Bomberman phase.
// ===================================================================

import { W, H } from "../constants.js";
import { generatePlatformerTextures } from "../systems/texture-factory.js";
import { screenFlash, impactParticles } from "../systems/game-juice.js";
import { createTouchControls, isMobile } from "../systems/touch-input.js";

const WORLD_WIDTH = 2400;
const PLAYER_SPEED = 200;
const JUMP_FORCE = 420;
const BULLET_SPEED = 500;
const SHOOT_COOLDOWN = 0.3; // seconds
const COYOTE_TIME = 0.08;   // seconds
const JUMP_BUFFER = 0.1;    // seconds
const INVULN_TIME = 1.5;    // seconds

export function level1PlatformerScene(k) {
  // Generate textures (idempotent)
  generatePlatformerTextures(k);

  // Platformer gravity
  k.setGravity(900);

  // Game state
  const state = {
    gameOver: false,
    transitioning: false,
    isPaused: false,
    pauseObjects: [],
    guardsKilled: 0,
  };

  // Camera zoom
  k.camScale(1.5);

  // Touch controls (mobile only)
  const touch = createTouchControls(k, 'platformer');

  // ═══════════════════════════════════════════════════════════
  // BACKGROUND — 4-layer parallax + moon (drawn every frame)
  // ═══════════════════════════════════════════════════════════

  // Procedural star positions (generated once)
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * WORLD_WIDTH * 1.5,
      y: Math.random() * 200,
      r: 0.5 + Math.random() * 1.2,
      bright: 0.3 + Math.random() * 0.7,
    });
  }

  // Mountain peaks (generated once)
  const mountains = [];
  for (let i = 0; i < 12; i++) {
    mountains.push({
      x: i * 250 + Math.random() * 80,
      h: 40 + Math.random() * 60,
      w: 100 + Math.random() * 80,
    });
  }

  // Skyline buildings (generated once)
  const skylineBuildings = [];
  for (let i = 0; i < 30; i++) {
    skylineBuildings.push({
      x: i * 100 + Math.random() * 40,
      w: 30 + Math.random() * 50,
      h: 30 + Math.random() * 80,
      windows: Math.floor(Math.random() * 6) + 2,
    });
  }

  // Near buildings (generated once)
  const nearBuildings = [];
  for (let i = 0; i < 20; i++) {
    nearBuildings.push({
      x: i * 140 + Math.random() * 50,
      w: 50 + Math.random() * 60,
      h: 40 + Math.random() * 60,
    });
  }

  // Building lights
  const lights = [];
  for (let i = 0; i < 40; i++) {
    lights.push({
      x: Math.random() * WORLD_WIDTH,
      y: 230 + Math.random() * 120,
      r: 1 + Math.random() * 1.5,
      color: [
        { r: 255, g: 238, b: 136 },
        { r: 255, g: 255, b: 255 },
        { r: 255, g: 221, b: 102 },
        { r: 255, g: 204, b: 68 },
      ][Math.floor(Math.random() * 4)],
      alpha: 0.15 + Math.random() * 0.35,
    });
  }

  k.onDraw(() => {
    if (state.isPaused) return;
    const camX = k.camPos().x;
    const camY = k.camPos().y;

    // The camera viewport dimensions at the current zoom
    const vw = W / 1.5;
    const vh = H / 1.5;
    const viewLeft = camX - vw / 2;
    const viewTop = camY - vh / 2;

    // Layer 0: Night sky fill
    k.drawRect({
      pos: k.vec2(viewLeft, viewTop),
      width: vw,
      height: vh,
      color: k.rgb(10, 10, 42),
    });

    // Layer 1: Stars (barely moves)
    for (const s of stars) {
      const sx = s.x - camX * 0.02;
      // Wrap stars for infinite feel
      const wrappedX = ((sx % vw) + vw) % vw + viewLeft;
      k.drawCircle({
        pos: k.vec2(wrappedX, viewTop + s.y * (vh / 300)),
        radius: s.r,
        color: k.rgb(255, 255, 255),
        opacity: s.bright * (0.6 + 0.4 * Math.sin(k.time() * 2 + s.x)),
      });
    }

    // Moon (upper right, slow parallax)
    const moonX = viewLeft + vw * 0.78 - camX * 0.03;
    const moonY = viewTop + 40;
    // Outer glow
    k.drawCircle({
      pos: k.vec2(moonX, moonY),
      radius: 50,
      color: k.rgb(255, 255, 255),
      opacity: 0.04,
    });
    k.drawCircle({
      pos: k.vec2(moonX, moonY),
      radius: 40,
      color: k.rgb(255, 255, 255),
      opacity: 0.06,
    });
    // Moon disc
    k.drawCircle({
      pos: k.vec2(moonX, moonY),
      radius: 30,
      color: k.rgb(232, 228, 208),
      opacity: 0.85,
    });
    // Highlight
    k.drawCircle({
      pos: k.vec2(moonX - 6, moonY - 6),
      radius: 20,
      color: k.rgb(244, 240, 224),
      opacity: 0.4,
    });
    // Craters
    const craters = [
      { dx: -8, dy: 5, r: 7 },
      { dx: 10, dy: -4, r: 5 },
      { dx: 3, dy: 12, r: 4 },
      { dx: -12, dy: -10, r: 3 },
      { dx: 14, dy: 8, r: 3 },
    ];
    for (const cr of craters) {
      k.drawCircle({
        pos: k.vec2(moonX + cr.dx, moonY + cr.dy),
        radius: cr.r,
        color: k.rgb(200, 196, 176),
        opacity: 0.5,
      });
    }

    // Layer 2: Mountains (slow parallax 0.1)
    const mtOff = camX * 0.1;
    for (const m of mountains) {
      const mx = m.x - mtOff;
      if (mx + m.w < viewLeft - 100 || mx - m.w > viewLeft + vw + 100) continue;
      k.drawTriangle({
        p1: k.vec2(mx, 350 - camY * 0.1),
        p2: k.vec2(mx - m.w / 2, 350 - camY * 0.1),
        p3: k.vec2(mx, 350 - m.h - camY * 0.1),
        color: k.rgb(30, 25, 50),
        opacity: 0.8,
      });
      k.drawTriangle({
        p1: k.vec2(mx, 350 - camY * 0.1),
        p2: k.vec2(mx + m.w / 2, 350 - camY * 0.1),
        p3: k.vec2(mx, 350 - m.h - camY * 0.1),
        color: k.rgb(25, 20, 45),
        opacity: 0.8,
      });
    }

    // Layer 3: City skyline (medium parallax 0.3)
    const slOff = camX * 0.3;
    for (const b of skylineBuildings) {
      const bx = b.x - slOff;
      if (bx + b.w < viewLeft - 50 || bx > viewLeft + vw + 50) continue;
      const baseY = 380 - camY * 0.3;
      k.drawRect({
        pos: k.vec2(bx, baseY - b.h),
        width: b.w,
        height: b.h,
        color: k.rgb(20, 18, 35),
        opacity: 0.9,
      });
      // Windows (lit dots)
      for (let w = 0; w < b.windows; w++) {
        const wx = bx + 4 + (w % 3) * (b.w / 4);
        const wy = baseY - b.h + 5 + Math.floor(w / 3) * 12;
        if (wy < baseY - 5) {
          k.drawRect({
            pos: k.vec2(wx, wy),
            width: 3,
            height: 3,
            color: k.rgb(255, 238, 136),
            opacity: 0.2 + 0.15 * Math.sin(k.time() * 0.5 + w + b.x),
          });
        }
      }
    }

    // Layer 4: Near buildings (faster parallax 0.6)
    const nbOff = camX * 0.6;
    for (const b of nearBuildings) {
      const bx = b.x - nbOff;
      if (bx + b.w < viewLeft - 50 || bx > viewLeft + vw + 50) continue;
      const baseY = 410 - camY * 0.6;
      k.drawRect({
        pos: k.vec2(bx, baseY - b.h),
        width: b.w,
        height: b.h,
        color: k.rgb(30, 28, 50),
        opacity: 0.95,
      });
      // Top edge highlight
      k.drawRect({
        pos: k.vec2(bx, baseY - b.h),
        width: b.w,
        height: 2,
        color: k.rgb(50, 48, 70),
        opacity: 0.6,
      });
    }

    // Building lights (on near-building layer)
    for (const l of lights) {
      const lx = l.x - nbOff;
      if (lx < viewLeft - 20 || lx > viewLeft + vw + 20) continue;
      k.drawCircle({
        pos: k.vec2(lx, l.y - camY * 0.6),
        radius: l.r,
        color: k.rgb(l.color.r, l.color.g, l.color.b),
        opacity: l.alpha,
      });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // PLATFORMS
  // ═══════════════════════════════════════════════════════════

  const layout = [
    { x: 200,  y: 430, w: 512, h: 24 },  // Wide starting platform
    { x: 560,  y: 395, w: 256, h: 24 },  // Step up
    { x: 800,  y: 360, w: 256, h: 24 },  // Step up (guard here)
    { x: 1060, y: 330, w: 192, h: 24 },  // Jump across
    { x: 1300, y: 370, w: 256, h: 24 },  // Mid section
    { x: 1550, y: 340, w: 192, h: 24 },  // Higher platform
    { x: 1780, y: 370, w: 256, h: 24 },  // Lower step
    { x: 2020, y: 340, w: 384, h: 24 },  // Target building roof
    { x: 2280, y: 340, w: 224, h: 24 },  // Target extension
  ];

  for (const def of layout) {
    // Platform top surface (lighter top edge)
    k.add([
      k.rect(def.w, def.h),
      k.pos(def.x - def.w / 2, def.y),
      k.area(),
      k.body({ isStatic: true }),
      k.color(102, 102, 102),
      k.z(5),
      "platform",
    ]);
    // Light top edge
    k.add([
      k.rect(def.w, 3),
      k.pos(def.x - def.w / 2, def.y),
      k.color(136, 136, 136),
      k.z(6),
    ]);
  }

  // Ground floor (full world width)
  k.add([
    k.rect(WORLD_WIDTH, 128),
    k.pos(0, 480),
    k.area(),
    k.body({ isStatic: true }),
    k.color(85, 85, 85),
    k.z(5),
    "platform",
  ]);

  // Underground fill (visual)
  k.add([
    k.rect(WORLD_WIDTH, 100),
    k.pos(0, 530),
    k.color(58, 58, 58),
    k.z(4),
  ]);

  // ═══════════════════════════════════════════════════════════
  // ROOFTOP DETAILS (decorative — no collision)
  // ═══════════════════════════════════════════════════════════

  // Water tanks
  const waterTanks = [
    { x: 140, y: 408 },
    { x: 830, y: 338 },
    { x: 1550, y: 318 },
    { x: 2040, y: 318 },
  ];
  for (const wt of waterTanks) {
    // Tank body
    k.add([
      k.rect(12, 16),
      k.pos(wt.x - 6, wt.y - 16),
      k.color(136, 136, 136),
      k.opacity(0.7),
      k.z(4),
    ]);
    // Tank top
    k.add([
      k.circle(7),
      k.pos(wt.x, wt.y - 16),
      k.anchor("center"),
      k.color(153, 153, 153),
      k.opacity(0.6),
      k.z(4),
    ]);
    // Legs
    k.add([
      k.rect(2, 4),
      k.pos(wt.x - 5, wt.y),
      k.color(102, 102, 102),
      k.opacity(0.5),
      k.z(4),
    ]);
    k.add([
      k.rect(2, 4),
      k.pos(wt.x + 3, wt.y),
      k.color(102, 102, 102),
      k.opacity(0.5),
      k.z(4),
    ]);
  }

  // AC units
  const acUnits = [
    { x: 240, y: 415 },
    { x: 580, y: 380 },
    { x: 1070, y: 315 },
    { x: 1320, y: 355 },
    { x: 2000, y: 325 },
  ];
  for (const ac of acUnits) {
    k.add([
      k.rect(14, 8),
      k.pos(ac.x - 7, ac.y - 6),
      k.color(119, 119, 119),
      k.opacity(0.6),
      k.z(4),
    ]);
    // Fan grille
    k.add([
      k.circle(3),
      k.pos(ac.x, ac.y - 3),
      k.anchor("center"),
      k.color(85, 85, 85),
      k.opacity(0.5),
      k.z(4),
    ]);
  }

  // Satellite dishes
  const dishes = [
    { x: 520, y: 375 },
    { x: 1100, y: 310 },
    { x: 1780, y: 350 },
    { x: 2250, y: 320 },
  ];
  for (const d of dishes) {
    // Stem (thin rect)
    k.add([
      k.rect(2, 10),
      k.pos(d.x - 1, d.y - 10),
      k.color(119, 119, 119),
      k.opacity(0.6),
      k.z(4),
    ]);
    // Dish (half circle approximation: small circle)
    k.add([
      k.circle(5),
      k.pos(d.x, d.y - 10),
      k.anchor("center"),
      k.color(153, 153, 153),
      k.opacity(0.5),
      k.z(4),
    ]);
  }

  // ═══════════════════════════════════════════════════════════
  // PLAYER
  // ═══════════════════════════════════════════════════════════

  const player = k.add([
    k.sprite("plt_player_idle"),
    k.pos(200, 400),
    k.area({ shape: new k.Rect(k.vec2(0, 0), 20, 28) }),
    k.body(),
    k.anchor("center"),
    k.z(10),
    "player",
    {
      speed: PLAYER_SPEED,
      hp: 3,
      maxHp: 3,
      invulnerable: false,
      invulnTimer: 0,
      facing: 1,
      animState: "idle",
      runFrame: 0,
      runTimer: 0,
      shootCooldown: 0,
      coyoteTimer: 0,
      jumpBuffer: 0,
    },
  ]);

  // ═══════════════════════════════════════════════════════════
  // PLAYER MOVEMENT + ANIMATION
  // ═══════════════════════════════════════════════════════════

  player.onUpdate(() => {
    if (state.gameOver || state.transitioning || state.isPaused) return;

    // Horizontal movement
    let moving = false;
    if (k.isKeyDown("left") || k.isKeyDown("a") || touch?.left) {
      player.move(-player.speed, 0);
      player.facing = -1;
      player.flipX = true;
      moving = true;
    } else if (k.isKeyDown("right") || k.isKeyDown("d") || touch?.right) {
      player.move(player.speed, 0);
      player.facing = 1;
      player.flipX = false;
      moving = true;
    }

    // Coyote time
    if (player.isGrounded()) {
      player.coyoteTimer = COYOTE_TIME;
    } else {
      player.coyoteTimer -= k.dt();
    }

    // Jump buffer decrement
    if (player.jumpBuffer > 0) player.jumpBuffer -= k.dt();

    // Handle buffered/coyote jumps
    if (player.jumpBuffer > 0 && (player.isGrounded() || player.coyoteTimer > 0)) {
      player.jump(JUMP_FORCE);
      player.jumpBuffer = 0;
      player.coyoteTimer = 0;
    }

    // Animation
    if (!player.isGrounded()) {
      if (player.animState !== "jump") {
        player.use(k.sprite("plt_player_jump"));
        player.animState = "jump";
        // Restore flip
        player.flipX = player.facing < 0;
      }
    } else if (moving) {
      player.runTimer += k.dt();
      if (player.runTimer > 0.12) {
        player.runTimer = 0;
        player.runFrame = (player.runFrame + 1) % 4;
      }
      if (player.animState !== "run" || player.runTimer === 0) {
        player.use(k.sprite(`plt_player_run_${player.runFrame}`));
        player.animState = "run";
        player.flipX = player.facing < 0;
      }
    } else {
      if (player.animState !== "idle") {
        player.use(k.sprite("plt_player_idle"));
        player.animState = "idle";
        player.runFrame = 0;
        player.runTimer = 0;
        player.flipX = player.facing < 0;
      }
    }

    // Shoot cooldown
    if (player.shootCooldown > 0) player.shootCooldown -= k.dt();

    // Invulnerability
    if (player.invulnerable) {
      player.invulnTimer -= k.dt();
      player.opacity = Math.sin(k.time() * 20) > 0 ? 1 : 0.3;
      if (player.invulnTimer <= 0) {
        player.invulnerable = false;
        player.opacity = 1;
      }
    }

    // Clamp player to world bounds
    if (player.pos.x < 16) player.pos.x = 16;
    if (player.pos.x > WORLD_WIDTH - 16) player.pos.x = WORLD_WIDTH - 16;
  });

  // ═══════════════════════════════════════════════════════════
  // JUMP INPUT (UP / W keys only)
  // ═══════════════════════════════════════════════════════════

  k.onKeyPress("up", () => {
    if (state.gameOver || state.transitioning || state.isPaused) return;
    player.jumpBuffer = JUMP_BUFFER;
  });
  k.onKeyPress("w", () => {
    if (state.gameOver || state.transitioning || state.isPaused) return;
    player.jumpBuffer = JUMP_BUFFER;
  });
  // Touch jump (checked each frame)
  if (touch) {
    k.onUpdate(() => {
      if (state.gameOver || state.transitioning || state.isPaused) return;
      if (touch.justPressed('jump')) {
        player.jumpBuffer = JUMP_BUFFER;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // SHOOTING (SPACE key)
  // ═══════════════════════════════════════════════════════════

  function doShoot() {
    if (state.gameOver || state.transitioning || state.isPaused) return;
    if (player.shootCooldown > 0) return;

    player.shootCooldown = SHOOT_COOLDOWN;

    const bx = player.pos.x + player.facing * 18;
    const by = player.pos.y - 2;

    k.add([
      k.rect(8, 3),
      k.pos(bx, by),
      k.anchor("center"),
      k.area(),
      k.color(255, 238, 100),
      k.z(8),
      k.move(player.facing > 0 ? k.RIGHT : k.LEFT, BULLET_SPEED),
      k.offscreen({ destroy: true }),
      "bullet",
    ]);

    // Muzzle flash
    screenFlash(k, 255, 255, 136, 60, 0.15);

    // Local muzzle flash circle
    const flash = k.add([
      k.circle(5),
      k.pos(bx, by),
      k.anchor("center"),
      k.color(255, 255, 100),
      k.opacity(0.8),
      k.z(11),
    ]);
    k.tween(0.8, 0, 0.1, (v) => { flash.opacity = v; }, k.easings.linear)
      .onEnd(() => flash.destroy());
  }

  k.onKeyPress("space", doShoot);

  // Touch fire (checked each frame)
  if (touch) {
    k.onUpdate(() => {
      if (touch.justPressed('primary')) doShoot();
    });
  }

  // ═══════════════════════════════════════════════════════════
  // GUARDS
  // ═══════════════════════════════════════════════════════════

  const guardDefs = [
    { x: 830, y: 330, range: 80 },
    { x: 1300, y: 340, range: 60 },
    { x: 1780, y: 340, range: 70 },
    { x: 2100, y: 310, range: 90 },
  ];

  function createPlatformerGuard(gx, gy, range) {
    const guard = k.add([
      k.sprite("plt_guard_walk_0"),
      k.pos(gx, gy),
      k.area({ shape: new k.Rect(k.vec2(0, 0), 24, 28) }),
      k.body(),
      k.anchor("center"),
      k.z(9),
      "guard",
      {
        startX: gx,
        patrolRange: range,
        dir: 1,
        speed: 50,
        alertSpeed: 90,
        isAlert: false,
        walkFrame: 0,
        walkTimer: 0,
      },
    ]);
    return guard;
  }

  const guards = [];
  for (const gd of guardDefs) {
    guards.push(createPlatformerGuard(gd.x, gd.y, gd.range));
  }

  // Guard AI update
  k.onUpdate("guard", (guard) => {
    if (state.gameOver || state.transitioning || state.isPaused) return;
    if (!guard.isGrounded()) return; // Don't move while falling

    const distToPlayer = player.pos.dist(guard.pos);

    // Alert detection
    if (distToPlayer < 150) {
      guard.isAlert = true;
      guard.speed = guard.alertSpeed;
      const dx = player.pos.x - guard.pos.x;
      guard.dir = dx > 0 ? 1 : -1;
    } else if (distToPlayer > 200 && guard.isAlert) {
      guard.isAlert = false;
      guard.speed = 50;
    }

    // Move
    guard.move(guard.speed * guard.dir, 0);

    // Patrol bounds (only when not alert)
    if (!guard.isAlert) {
      if (guard.pos.x >= guard.startX + guard.patrolRange && guard.dir > 0) {
        guard.dir = -1;
      } else if (guard.pos.x <= guard.startX - guard.patrolRange && guard.dir < 0) {
        guard.dir = 1;
      }
    }

    // Flip sprite
    guard.flipX = guard.dir < 0;

    // Walk animation
    guard.walkTimer += k.dt();
    if (guard.walkTimer > 0.15) {
      guard.walkTimer = 0;
      guard.walkFrame = (guard.walkFrame + 1) % 4;
      guard.use(k.sprite(`plt_guard_walk_${guard.walkFrame}`));
      guard.flipX = guard.dir < 0;
    }

    // Alert tint
    if (guard.isAlert) {
      guard.color = k.rgb(255, 100, 100);
    } else {
      guard.color = k.rgb(255, 255, 255);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // BULLET -> GUARD COLLISION
  // ═══════════════════════════════════════════════════════════

  k.onCollide("bullet", "guard", (bullet, guard) => {
    bullet.destroy();
    impactParticles(k, guard.pos.x, guard.pos.y, 10);
    k.shake(4);
    guard.destroy();
    state.guardsKilled++;
  });

  // ═══════════════════════════════════════════════════════════
  // PLAYER -> GUARD DAMAGE
  // ═══════════════════════════════════════════════════════════

  function damagePlayer() {
    if (player.invulnerable || player.hp <= 0 || state.gameOver || state.transitioning) return;

    player.hp--;
    player.invulnerable = true;
    player.invulnTimer = INVULN_TIME;

    screenFlash(k, 255, 0, 0, 150, 0.3);
    k.shake(6);
    updateHUD();

    if (player.hp <= 0) {
      playerDeath();
    }
  }

  k.onCollide("player", "guard", () => {
    damagePlayer();
  });

  // ═══════════════════════════════════════════════════════════
  // SECURITY CAMERAS (visual cone obstacles)
  // ═══════════════════════════════════════════════════════════

  const secCameras = [
    { x: 600, y: 350, angleMin: 0.8, angleMax: 2.2, speed: 0.5, len: 100, halfAngle: 0.3, currentAngle: 0.8, sweepDir: 1 },
    { x: 1600, y: 300, angleMin: 0.8, angleMax: 2.2, speed: 0.6, len: 100, halfAngle: 0.3, currentAngle: 0.8, sweepDir: 1 },
  ];

  // Camera hardware sprites (small gray box)
  for (const cam of secCameras) {
    k.add([
      k.rect(8, 6),
      k.pos(cam.x - 4, cam.y - 3),
      k.color(100, 100, 100),
      k.z(8),
    ]);
  }

  // Draw camera cones each frame
  k.onDraw(() => {
    if (state.isPaused || state.gameOver) return;
    for (const cam of secCameras) {
      const bx = cam.x + Math.cos(cam.currentAngle - cam.halfAngle) * cam.len;
      const by = cam.y + Math.sin(cam.currentAngle - cam.halfAngle) * cam.len;
      const cx = cam.x + Math.cos(cam.currentAngle + cam.halfAngle) * cam.len;
      const cy = cam.y + Math.sin(cam.currentAngle + cam.halfAngle) * cam.len;

      // Cone fill
      k.drawTriangle({
        p1: k.vec2(cam.x, cam.y),
        p2: k.vec2(bx, by),
        p3: k.vec2(cx, cy),
        color: k.rgb(255, 34, 34),
        opacity: 0.12,
      });

      // Cone edges
      k.drawLine({
        p1: k.vec2(cam.x, cam.y),
        p2: k.vec2(bx, by),
        width: 1,
        color: k.rgb(255, 34, 34),
        opacity: 0.25,
      });
      k.drawLine({
        p1: k.vec2(cam.x, cam.y),
        p2: k.vec2(cx, cy),
        width: 1,
        color: k.rgb(255, 34, 34),
        opacity: 0.25,
      });
    }
  });

  // Camera sweep + player detection
  function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
  }

  k.onUpdate(() => {
    if (state.gameOver || state.transitioning || state.isPaused) return;

    for (const cam of secCameras) {
      cam.currentAngle += cam.speed * cam.sweepDir * k.dt();
      if (cam.currentAngle >= cam.angleMax) {
        cam.currentAngle = cam.angleMax;
        cam.sweepDir = -1;
      } else if (cam.currentAngle <= cam.angleMin) {
        cam.currentAngle = cam.angleMin;
        cam.sweepDir = 1;
      }

      // Check player in cone
      const bx = cam.x + Math.cos(cam.currentAngle - cam.halfAngle) * cam.len;
      const by = cam.y + Math.sin(cam.currentAngle - cam.halfAngle) * cam.len;
      const cx = cam.x + Math.cos(cam.currentAngle + cam.halfAngle) * cam.len;
      const cy = cam.y + Math.sin(cam.currentAngle + cam.halfAngle) * cam.len;

      if (pointInTriangle(player.pos.x, player.pos.y, cam.x, cam.y, bx, by, cx, cy)) {
        damagePlayer();
      }
    }
  });

  // ═══════════════════════════════════════════════════════════
  // TARGET BUILDING — end of level
  // ═══════════════════════════════════════════════════════════

  // Visual: door on the target building rooftop
  const target = k.add([
    k.sprite("plt_target"),
    k.pos(2200, 292),
    k.anchor("center"),
    k.area({ shape: new k.Rect(k.vec2(0, 0), 40, 48) }),
    k.z(6),
    "target",
  ]);

  // Pulsing glow around target
  const targetGlow = k.add([
    k.rect(60, 60),
    k.pos(2200, 292),
    k.anchor("center"),
    k.color(255, 215, 0),
    k.opacity(0.15),
    k.z(4),
  ]);

  // Glow pulse
  targetGlow.onUpdate(() => {
    targetGlow.opacity = 0.1 + 0.15 * Math.sin(k.time() * 3);
  });

  // Player reaches target -> enter building
  k.onCollide("player", "target", () => {
    if (state.transitioning) return;
    state.transitioning = true;

    // Freeze player
    player.move(0, 0);

    // Save checkpoint
    try { localStorage.setItem("superzion_checkpoint_l1", "bomberman"); } catch (e) { /* ignore */ }

    // Visual: zoom + fade
    screenFlash(k, 255, 255, 255, 800, 0.6);
    k.shake(3);

    k.wait(1.0, () => {
      k.go("level1-bomberman");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // DEATH
  // ═══════════════════════════════════════════════════════════

  function playerDeath() {
    if (state.gameOver) return;
    state.gameOver = true;

    // MISSION FAILED text
    const failText = k.add([
      k.text("MISSION FAILED", { size: 28, font: "monospace" }),
      k.pos(W / 2, H / 2 - 40),
      k.anchor("center"),
      k.color(255, 68, 68),
      k.opacity(0),
      k.fixed(),
      k.z(50),
    ]);

    k.tween(0, 1, 0.4, (v) => { failText.opacity = v; }, k.easings.linear);

    const retryLabel = isMobile() ? "TAP TO RETRY" : "PRESS R TO RETRY";
    const retryText = k.add([
      k.text(retryLabel, { size: isMobile() ? 18 : 14, font: "monospace" }),
      k.pos(W / 2, H / 2 + 10),
      k.anchor("center"),
      k.color(200, 200, 200),
      k.opacity(0),
      k.fixed(),
      k.z(50),
    ]);

    k.tween(0, 1, 0.6, (v) => { retryText.opacity = v; }, k.easings.linear);

    k.shake(8);

    // Restart on R or tap
    k.onKeyPress("r", () => {
      k.go("level1-platformer");
    });
    k.onClick(() => {
      if (state.gameOver) k.go("level1-platformer");
    });

    // Auto restart after delay
    k.wait(3, () => {
      if (state.gameOver) k.go("level1-platformer");
    });
  }

  // ═══════════════════════════════════════════════════════════
  // HUD (fixed on screen)
  // ═══════════════════════════════════════════════════════════

  const hudHearts = [];
  for (let i = 0; i < player.maxHp; i++) {
    hudHearts.push(
      k.add([
        k.sprite("plt_heart"),
        k.pos(15 + i * 20, 12),
        k.fixed(),
        k.z(30),
        k.scale(1),
      ])
    );
  }

  // Controls hint
  if (!isMobile()) {
    k.add([
      k.text("ARROWS: Move/Jump | SPACE: Shoot", { size: 8, font: "monospace" }),
      k.pos(W / 2, H - 12),
      k.anchor("center"),
      k.color(150, 150, 170),
      k.opacity(0.6),
      k.fixed(),
      k.z(30),
    ]);
  }

  function updateHUD() {
    for (let i = 0; i < player.maxHp; i++) {
      if (i < player.hp) {
        hudHearts[i].use(k.sprite("plt_heart"));
      } else {
        hudHearts[i].use(k.sprite("plt_heart_empty"));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CAMERA FOLLOW
  // ═══════════════════════════════════════════════════════════

  k.onUpdate(() => {
    if (state.isPaused) return;

    const halfVW = W / (2 * 1.5);
    const halfVH = H / (2 * 1.5);

    // Target camera position
    const targetX = Math.max(halfVW, Math.min(player.pos.x, WORLD_WIDTH - halfVW));
    const targetY = Math.max(halfVH, Math.min(player.pos.y, H - halfVH));

    // Smooth lerp toward target
    const curPos = k.camPos();
    const lerpSpeed = 0.08;
    k.camPos(
      curPos.x + (targetX - curPos.x) * lerpSpeed,
      curPos.y + (targetY - curPos.y) * lerpSpeed
    );
  });

  // ═══════════════════════════════════════════════════════════
  // PAUSE SYSTEM (ESC)
  // ═══════════════════════════════════════════════════════════

  k.onKeyPress("escape", () => {
    if (state.gameOver || state.transitioning) return;

    state.isPaused = !state.isPaused;

    if (state.isPaused) {
      // Overlay
      const overlay = k.add([
        k.rect(W, H),
        k.pos(0, 0),
        k.color(0, 0, 0),
        k.opacity(0.6),
        k.fixed(),
        k.z(60),
      ]);
      state.pauseObjects.push(overlay);

      const pauseTitle = k.add([
        k.text("PAUSED", { size: 32, font: "monospace" }),
        k.pos(W / 2, H / 2 - 30),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.fixed(),
        k.z(61),
      ]);
      state.pauseObjects.push(pauseTitle);

      const pauseLabel = isMobile()
        ? "TAP || TO RESUME | TAP HERE: MENU"
        : "ESC: Resume | R: Restart | Q: Menu";
      const pauseOpts = k.add([
        k.text(pauseLabel, { size: isMobile() ? 14 : 12, font: "monospace" }),
        k.pos(W / 2, H / 2 + 10),
        k.anchor("center"),
        k.color(170, 170, 170),
        k.fixed(),
        k.z(61),
      ]);
      state.pauseObjects.push(pauseOpts);
    } else {
      for (const obj of state.pauseObjects) obj.destroy();
      state.pauseObjects = [];
    }
  });

  // Pause-specific keys
  k.onKeyPress("r", () => {
    if (state.isPaused) k.go("level1-platformer");
  });
  k.onKeyPress("q", () => {
    if (state.isPaused) k.go("menu");
  });

  // Touch pause button
  if (touch) {
    k.onUpdate(() => {
      if (touch.justPressed('pause')) {
        if (state.isPaused) {
          // Resume: tap menu button area -> go to menu
          k.go("menu");
        } else if (!state.gameOver && !state.transitioning) {
          // Toggle pause via ESC simulation
          state.isPaused = !state.isPaused;
          if (state.isPaused) {
            const overlay = k.add([
              k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.6),
              k.fixed(), k.z(60),
            ]);
            state.pauseObjects.push(overlay);
            state.pauseObjects.push(k.add([
              k.text("PAUSED", { size: 32, font: "monospace" }),
              k.pos(W / 2, H / 2 - 30), k.anchor("center"), k.color(255, 255, 255),
              k.fixed(), k.z(61),
            ]));
            state.pauseObjects.push(k.add([
              k.text("TAP || AGAIN: MENU", { size: 14, font: "monospace" }),
              k.pos(W / 2, H / 2 + 10), k.anchor("center"), k.color(170, 170, 170),
              k.fixed(), k.z(61),
            ]));
          } else {
            for (const obj of state.pauseObjects) obj.destroy();
            state.pauseObjects = [];
          }
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // FADE IN
  // ═══════════════════════════════════════════════════════════

  const fadeOverlay = k.add([
    k.rect(W, H),
    k.pos(0, 0),
    k.color(0, 0, 0),
    k.opacity(1),
    k.fixed(),
    k.z(100),
  ]);
  k.tween(1, 0, 0.5, (v) => { fadeOverlay.opacity = v; }, k.easings.linear)
    .onEnd(() => fadeOverlay.destroy());
}
