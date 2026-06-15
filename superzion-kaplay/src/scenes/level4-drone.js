// ===================================================================
// Level 4 — Operation Underground (Drone + Boss Fight)
// Phase 1: City navigation minigame (navigate to glowing window)
// Phase 2: Boss fight — Yahya Sinwar (top-down destroyed room)
//   Boss hides behind armchair (phase 1), roams and throws
//   objects (phase 2), then charges desperately (phase 3).
//   Drone uses SPACE to shoot, X for missiles, SHIFT to dash.
// ===================================================================

import { W, H } from '../constants.js';
import { generateDroneTextures } from '../systems/texture-factory.js';
import { screenFlash, impactParticles, deathParticles } from '../systems/game-juice.js';

// ── City precision minigame constants ──
const DRONE_SPEED = 200;
const WINDOW_X = 740, WINDOW_Y = 250, WINDOW_SIZE = 40;
const WIND_CHANGE_INTERVAL = 2.5;
const WIND_STRENGTH_MIN = 45;
const WIND_STRENGTH_MAX = 90;
const DEBRIS_SPAWN_RATE = 1.8;
const DEBRIS_FALL_MIN = 100;
const DEBRIS_FALL_MAX = 150;
const DEBRIS_BOUNCE = 30;

// ── Boss fight constants ──
const ROOM_LEFT = 40, ROOM_RIGHT = 920, ROOM_TOP = 40, ROOM_BOTTOM = 500;
const DRONE_SHOOT_CD = 0.25;
const DRONE_BULLET_SPEED = 300;
const DRONE_MISSILE_CD = 3;
const DRONE_MISSILE_SPEED = 200;
const DRONE_DASH_DIST = 100;
const DRONE_DASH_CD = 1.0;
const DRONE_DASH_DUR = 0.15;
const BOSS_HP = 30;
const BOSS_BULLET_DMG = 1;
const BOSS_MISSILE_DMG = 5;
const BOSS_THROW_DMG = 2;
const BOSS_CHARGE_DMG = 4;
const BOSS_THROW_SPEED = 180;
const BOSS_DISPLAY = 64;
const BOSS_P2_SPEED = 100;
const BOSS_P3_SPEED = 150;
const BOSS_P3_CHARGE_SPEED = 250;

const ARMCHAIR_X = 580, ARMCHAIR_Y = 280;
const ARMCHAIR_W = 50, ARMCHAIR_H = 40;

export function level4DroneScene(k) {
  generateDroneTextures(k);

  // ══════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════
  let phase = 'city'; // city, boss-intro, boss, victory, dead
  let startTime = Date.now();

  // City phase state
  let droneX = W / 2, droneY = H * 0.7;
  let windAngle = Math.random() * Math.PI * 2;
  let windStrength = 60;
  let windTimer = WIND_CHANGE_INTERVAL;
  let debris = [];
  let debrisAccum = 0;
  let cityTime = 0;
  let windowPulse = 0;

  // Boss phase state
  let bossX = ARMCHAIR_X, bossY = ARMCHAIR_Y;
  let bossHP = BOSS_HP;
  let bossPhase = 1; // 1, 2, 3
  let bossState = 'hiding'; // hiding, peeking, roaming, charging
  let bossTimer = 1.5 + Math.random() * 0.5;
  let bossThrowTimer = 0;
  let bossChargeTimer = 4;
  let bossChargeDir = { x: 0, y: 0 };
  let bossRoamTarget = { x: W / 2, y: H / 2 };
  let bossFlash = 0;
  let phase2Triggered = false;
  let phase3Triggered = false;

  let droneBullets = [];
  let droneMissiles = [];
  let bossProjectiles = [];
  let droneHP = 5;
  let droneMaxHP = 5;
  let droneInvuln = 0;
  let droneShootCD = 0;
  let droneMissileCD = 0;
  let droneDashCD = 0;
  let droneDashing = false;
  let droneDashTimer = 0;
  let droneFacingX = 0, droneFacingY = -1;

  let bulletsFired = 0;
  let missilesUsed = 0;
  let damageTaken = 0;

  // Boss intro state
  let introTimer = 0;

  // Phase transition overlay
  let phaseTransText = '';
  let phaseTransTimer = 0;

  // Buildings for city background (random layout, generated once)
  const cityBuildings = [];
  for (let bx = 0; bx < W; bx += 70) {
    for (let by = 0; by < H; by += 70) {
      if (Math.random() < 0.7) {
        cityBuildings.push({
          x: bx + Math.random() * 10,
          y: by + Math.random() * 10,
          w: 45 + Math.random() * 20,
          h: 45 + Math.random() * 20,
          shade: 40 + Math.floor(Math.random() * 30),
          hasFire: Math.random() < 0.15,
          fireX: Math.random() * 30,
          fireY: Math.random() * 30,
        });
      }
    }
  }

  // Room rubble (pre-generated)
  const roomRubble = [];
  for (let i = 0; i < 20; i++) {
    roomRubble.push({
      x: ROOM_LEFT + 20 + Math.random() * (ROOM_RIGHT - ROOM_LEFT - 40),
      y: ROOM_TOP + 20 + Math.random() * (ROOM_BOTTOM - ROOM_TOP - 40),
      w: 3 + Math.random() * 8,
      h: 2 + Math.random() * 5,
      shade: 30 + Math.floor(Math.random() * 30),
    });
  }

  // ══════════════════════════════════════════════════════════════
  // INSTRUCTIONS
  // ══════════════════════════════════════════════════════════════
  const instrBg = k.add([
    k.rect(W, 36), k.pos(0, H - 36), k.color(0, 0, 0), k.opacity(0.6), k.fixed(), k.z(200),
  ]);
  const instrText = k.add([
    k.text('ARROWS/WASD: Navigate Drone | Reach the glowing window', { size: 12, font: 'monospace' }),
    k.pos(W / 2, H - 18), k.anchor('center'), k.color(200, 200, 200), k.fixed(), k.z(201),
  ]);

  // ══════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════
  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  function angleTo(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // ══════════════════════════════════════════════════════════════
  // CITY PHASE
  // ══════════════════════════════════════════════════════════════
  function updateCity(dt) {
    cityTime += dt;
    windowPulse += dt * 3;

    // Wind changes
    windTimer -= dt;
    if (windTimer <= 0) {
      windTimer = WIND_CHANGE_INTERVAL;
      windAngle = Math.random() * Math.PI * 2;
      windStrength = WIND_STRENGTH_MIN + Math.random() * (WIND_STRENGTH_MAX - WIND_STRENGTH_MIN);
    }

    // Apply wind to drone
    droneX += Math.cos(windAngle) * windStrength * dt;
    droneY += Math.sin(windAngle) * windStrength * dt;

    // Player input
    let mx = 0, my = 0;
    if (k.isKeyDown('left') || k.isKeyDown('a')) mx -= 1;
    if (k.isKeyDown('right') || k.isKeyDown('d')) mx += 1;
    if (k.isKeyDown('up') || k.isKeyDown('w')) my -= 1;
    if (k.isKeyDown('down') || k.isKeyDown('s')) my += 1;
    if (mx !== 0 || my !== 0) {
      const len = Math.sqrt(mx * mx + my * my);
      droneX += (mx / len) * DRONE_SPEED * dt;
      droneY += (my / len) * DRONE_SPEED * dt;
    }

    // Clamp drone in bounds
    droneX = clamp(droneX, 16, W - 16);
    droneY = clamp(droneY, 16, H - 52);

    // Spawn debris
    debrisAccum += DEBRIS_SPAWN_RATE * dt;
    while (debrisAccum >= 1) {
      debrisAccum -= 1;
      debris.push({
        x: Math.random() * W,
        y: -10,
        r: 4 + Math.random() * 6,
        speed: DEBRIS_FALL_MIN + Math.random() * (DEBRIS_FALL_MAX - DEBRIS_FALL_MIN),
        shade: 60 + Math.floor(Math.random() * 40),
      });
    }

    // Update debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speed * dt;
      // Hit drone?
      if (dist(d.x, d.y, droneX, droneY) < d.r + 10) {
        // Knockback
        const a = angleTo(d.x, d.y, droneX, droneY);
        droneX += Math.cos(a) * DEBRIS_BOUNCE;
        droneY += Math.sin(a) * DEBRIS_BOUNCE;
        droneX = clamp(droneX, 16, W - 16);
        droneY = clamp(droneY, 16, H - 52);
        k.shake(4);
        debris.splice(i, 1);
        continue;
      }
      if (d.y > H + 20) {
        debris.splice(i, 1);
      }
    }

    // Check window reached
    if (Math.abs(droneX - WINDOW_X) < WINDOW_SIZE / 2 + 8 &&
        Math.abs(droneY - WINDOW_Y) < WINDOW_SIZE / 2 + 8) {
      startBossIntro();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // BOSS INTRO TRANSITION
  // ══════════════════════════════════════════════════════════════
  function startBossIntro() {
    phase = 'boss-intro';
    introTimer = 0;
    k.shake(12);
    screenFlash(k, 255, 255, 255, 400, 0.6);
    instrText.text = '';
    instrBg.opacity = 0;
  }

  function updateBossIntro(dt) {
    introTimer += dt;
    if (introTimer >= 3) {
      phase = 'boss';
      droneX = W / 2;
      droneY = H * 0.8;
      bossX = ARMCHAIR_X;
      bossY = ARMCHAIR_Y;
      bossState = 'hiding';
      bossTimer = 1.5 + Math.random() * 0.5;
      instrText.text = 'SPACE: Shoot | X: Missile | SHIFT: Dash | ARROWS: Move';
      instrBg.opacity = 0.6;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // BOSS FIGHT
  // ══════════════════════════════════════════════════════════════
  function throwProjectile() {
    const a = angleTo(bossX, bossY, droneX, droneY);
    bossProjectiles.push({
      x: bossX,
      y: bossY,
      vx: Math.cos(a) * BOSS_THROW_SPEED,
      vy: Math.sin(a) * BOSS_THROW_SPEED,
      rot: Math.random() * Math.PI * 2,
    });
  }

  function showPhaseTransition(text) {
    phaseTransText = text;
    phaseTransTimer = 2;
    k.shake(10);
    screenFlash(k, 255, 0, 0, 300, 0.3);
  }

  function updateBoss(dt) {
    bossFlash = Math.max(0, bossFlash - dt * 4);

    // Phase transitions
    if (bossHP <= BOSS_HP * 0.6 && !phase2Triggered) {
      phase2Triggered = true;
      bossPhase = 2;
      bossState = 'roaming';
      bossRoamTarget = { x: ROOM_LEFT + 80 + Math.random() * 400, y: ROOM_TOP + 60 + Math.random() * 300 };
      bossThrowTimer = 1.5;
      showPhaseTransition('PHASE 2 -- HUNTING');
    }
    if (bossHP <= BOSS_HP * 0.3 && !phase3Triggered) {
      phase3Triggered = true;
      bossPhase = 3;
      bossThrowTimer = 1.0;
      bossChargeTimer = 4.0;
      showPhaseTransition('PHASE 3 -- DESPERATE');
    }

    if (bossPhase === 1) {
      // Hiding behind armchair
      if (bossState === 'hiding') {
        bossX = ARMCHAIR_X;
        bossY = ARMCHAIR_Y + 5;
        bossTimer -= dt;
        if (bossTimer <= 0) {
          bossState = 'peeking';
          bossTimer = 0.5;
          bossY = ARMCHAIR_Y - 20;
        }
      } else if (bossState === 'peeking') {
        bossTimer -= dt;
        if (bossTimer <= 0) {
          throwProjectile();
          bossState = 'hiding';
          bossTimer = 1.5 + Math.random() * 0.5;
        }
      }
    } else if (bossPhase === 2) {
      // Roaming
      const spd = BOSS_P2_SPEED;
      const dx = bossRoamTarget.x - bossX;
      const dy = bossRoamTarget.y - bossY;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 5) {
        bossX += (dx / d) * spd * dt;
        bossY += (dy / d) * spd * dt;
      } else {
        bossRoamTarget = {
          x: ROOM_LEFT + 60 + Math.random() * (ROOM_RIGHT - ROOM_LEFT - 120),
          y: ROOM_TOP + 60 + Math.random() * (ROOM_BOTTOM - ROOM_TOP - 120),
        };
      }
      // Throw
      bossThrowTimer -= dt;
      if (bossThrowTimer <= 0) {
        throwProjectile();
        bossThrowTimer = 1.5;
      }
    } else if (bossPhase === 3) {
      if (bossState === 'charging') {
        bossX += bossChargeDir.x * BOSS_P3_CHARGE_SPEED * dt;
        bossY += bossChargeDir.y * BOSS_P3_CHARGE_SPEED * dt;
        bossTimer -= dt;
        // Check charge hits drone
        if (dist(bossX, bossY, droneX, droneY) < 30) {
          droneTakeDamage(BOSS_CHARGE_DMG);
          bossState = 'roaming';
        }
        // Hit wall or timer runs out
        if (bossTimer <= 0 || bossX < ROOM_LEFT + 10 || bossX > ROOM_RIGHT - 10 ||
            bossY < ROOM_TOP + 10 || bossY > ROOM_BOTTOM - 10) {
          bossX = clamp(bossX, ROOM_LEFT + 15, ROOM_RIGHT - 15);
          bossY = clamp(bossY, ROOM_TOP + 15, ROOM_BOTTOM - 15);
          bossState = 'roaming';
          k.shake(6);
        }
      } else {
        // Fast roaming
        const spd = BOSS_P3_SPEED;
        const dx = bossRoamTarget.x - bossX;
        const dy = bossRoamTarget.y - bossY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 5) {
          bossX += (dx / d) * spd * dt;
          bossY += (dy / d) * spd * dt;
        } else {
          bossRoamTarget = {
            x: ROOM_LEFT + 60 + Math.random() * (ROOM_RIGHT - ROOM_LEFT - 120),
            y: ROOM_TOP + 60 + Math.random() * (ROOM_BOTTOM - ROOM_TOP - 120),
          };
        }
        // Throw every 1s
        bossThrowTimer -= dt;
        if (bossThrowTimer <= 0) {
          throwProjectile();
          bossThrowTimer = 1.0;
        }
        // Charge every 4s
        bossChargeTimer -= dt;
        if (bossChargeTimer <= 0) {
          bossState = 'charging';
          bossTimer = 1.0;
          bossChargeTimer = 4.0;
          const a = angleTo(bossX, bossY, droneX, droneY);
          bossChargeDir = { x: Math.cos(a), y: Math.sin(a) };
          screenFlash(k, 255, 0, 0, 150, 0.2);
        }
      }
    }

    // Keep boss in room
    bossX = clamp(bossX, ROOM_LEFT + 10, ROOM_RIGHT - 10);
    bossY = clamp(bossY, ROOM_TOP + 10, ROOM_BOTTOM - 10);
  }

  function droneTakeDamage(amount) {
    if (droneInvuln > 0 || phase === 'victory' || phase === 'dead') return;
    droneHP -= amount;
    damageTaken += amount;
    droneInvuln = 0.5;
    k.shake(6);
    screenFlash(k, 255, 0, 0, 200, 0.3);
    if (droneHP <= 0) {
      droneHP = 0;
      showDefeat();
    }
  }

  function bossTakeDamage(amount) {
    if (bossPhase === 1 && bossState === 'hiding') return; // can't hit when hiding
    bossHP -= amount;
    bossFlash = 1;
    impactParticles(k, bossX, bossY, 4, [[255, 200, 0], [255, 100, 0]]);
    if (bossHP <= 0) {
      bossHP = 0;
      showVictory();
    }
  }

  function updateDroneBoss(dt) {
    droneInvuln = Math.max(0, droneInvuln - dt);
    droneShootCD = Math.max(0, droneShootCD - dt);
    droneMissileCD = Math.max(0, droneMissileCD - dt);
    droneDashCD = Math.max(0, droneDashCD - dt);

    // Drone movement
    let mx = 0, my = 0;
    if (k.isKeyDown('left') || k.isKeyDown('a')) mx -= 1;
    if (k.isKeyDown('right') || k.isKeyDown('d')) mx += 1;
    if (k.isKeyDown('up') || k.isKeyDown('w')) my -= 1;
    if (k.isKeyDown('down') || k.isKeyDown('s')) my += 1;
    if (mx !== 0 || my !== 0) {
      const len = Math.sqrt(mx * mx + my * my);
      mx /= len; my /= len;
      droneFacingX = mx;
      droneFacingY = my;
      droneX += mx * DRONE_SPEED * dt;
      droneY += my * DRONE_SPEED * dt;
    }

    // Dash
    if (droneDashing) {
      droneDashTimer -= dt;
      droneX += droneFacingX * DRONE_DASH_DIST * dt / DRONE_DASH_DUR;
      droneY += droneFacingY * DRONE_DASH_DIST * dt / DRONE_DASH_DUR;
      if (droneDashTimer <= 0) {
        droneDashing = false;
        droneInvuln = 0;
      }
    }

    // Clamp drone
    droneX = clamp(droneX, ROOM_LEFT + 12, ROOM_RIGHT - 12);
    droneY = clamp(droneY, ROOM_TOP + 12, ROOM_BOTTOM - 12);

    // Shooting (hold space)
    if (k.isKeyDown('space') && droneShootCD <= 0 && !droneDashing) {
      droneShootCD = DRONE_SHOOT_CD;
      bulletsFired++;
      const a = angleTo(droneX, droneY, bossX, bossY);
      droneBullets.push({
        x: droneX, y: droneY,
        vx: Math.cos(a) * DRONE_BULLET_SPEED,
        vy: Math.sin(a) * DRONE_BULLET_SPEED,
      });
    }

    // Update bullets
    for (let i = droneBullets.length - 1; i >= 0; i--) {
      const b = droneBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      // Hit boss?
      if (dist(b.x, b.y, bossX, bossY) < BOSS_DISPLAY / 2) {
        bossTakeDamage(BOSS_BULLET_DMG);
        droneBullets.splice(i, 1);
        continue;
      }
      // Out of bounds?
      if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
        droneBullets.splice(i, 1);
      }
    }

    // Update missiles (homing)
    for (let i = droneMissiles.length - 1; i >= 0; i--) {
      const m = droneMissiles[i];
      // Turn toward boss
      const desired = angleTo(m.x, m.y, bossX, bossY);
      let diff = desired - m.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turnRate = 3; // rad/s
      m.angle += clamp(diff, -turnRate * dt, turnRate * dt);
      m.x += Math.cos(m.angle) * DRONE_MISSILE_SPEED * dt;
      m.y += Math.sin(m.angle) * DRONE_MISSILE_SPEED * dt;
      m.life -= dt;
      // Hit boss?
      if (dist(m.x, m.y, bossX, bossY) < BOSS_DISPLAY / 2 + 5) {
        bossTakeDamage(BOSS_MISSILE_DMG);
        impactParticles(k, m.x, m.y, 10, [[255, 100, 0], [255, 200, 0], [255, 50, 0]]);
        k.shake(8);
        screenFlash(k, 255, 200, 0, 150, 0.2);
        droneMissiles.splice(i, 1);
        continue;
      }
      if (m.life <= 0 || m.x < 0 || m.x > W || m.y < 0 || m.y > H) {
        droneMissiles.splice(i, 1);
      }
    }

    // Update boss projectiles
    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
      const p = bossProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += 3 * dt;
      // Hit drone?
      if (dist(p.x, p.y, droneX, droneY) < 14) {
        droneTakeDamage(BOSS_THROW_DMG);
        bossProjectiles.splice(i, 1);
        continue;
      }
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
        bossProjectiles.splice(i, 1);
      }
    }

    // Phase transition text fade
    if (phaseTransTimer > 0) {
      phaseTransTimer -= dt;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // KEY INPUT (missiles, dash)
  // ══════════════════════════════════════════════════════════════
  k.onKeyPress('x', () => {
    if (phase !== 'boss' || droneMissileCD > 0 || droneDashing) return;
    droneMissileCD = DRONE_MISSILE_CD;
    missilesUsed++;
    const a = angleTo(droneX, droneY, bossX, bossY);
    droneMissiles.push({
      x: droneX, y: droneY,
      angle: a,
      life: 5,
    });
  });

  k.onKeyPress('shift', () => {
    if (phase !== 'boss' || droneDashCD > 0 || droneDashing) return;
    droneDashCD = DRONE_DASH_CD;
    droneDashing = true;
    droneDashTimer = DRONE_DASH_DUR;
    droneInvuln = DRONE_DASH_DUR;
  });

  k.onKeyPress('escape', () => k.go('menu'));

  // ══════════════════════════════════════════════════════════════
  // VICTORY / DEFEAT
  // ══════════════════════════════════════════════════════════════
  function showVictory() {
    if (phase === 'victory') return;
    phase = 'victory';
    instrText.text = '';
    instrBg.opacity = 0;

    // Flash & particles
    screenFlash(k, 255, 255, 255, 500, 0.7);
    k.shake(15);
    for (let i = 0; i < 5; i++) {
      k.wait(i * 0.15, () => {
        impactParticles(k, bossX + (Math.random() - 0.5) * 40, bossY + (Math.random() - 0.5) * 40, 8,
          [[255, 100, 0], [255, 200, 0], [255, 50, 0]]);
      });
    }

    const elapsed = Date.now() - startTime;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);

    // Star rating
    let stars = 1;
    if (droneHP >= 3 && missilesUsed <= 3) stars = 3;
    else if (droneHP >= 2) stars = 2;

    // Save progress
    try {
      localStorage.setItem('superzion_stars_4', String(Math.max(stars, parseInt(localStorage.getItem('superzion_stars_4') || '0'))));
      const prev = parseInt(localStorage.getItem('superzion_level_progress') || '1');
      if (5 > prev) localStorage.setItem('superzion_level_progress', '5');
    } catch (e) { /* storage */ }

    k.wait(1, () => {
      // Victory overlay
      k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.7), k.fixed(), k.z(500)]);

      k.add([
        k.text('TARGET ELIMINATED', { size: 32, font: 'monospace' }),
        k.pos(W / 2, 100), k.anchor('center'), k.color(255, 68, 68), k.fixed(), k.z(501),
      ]);

      // Stats
      const statsY = 180;
      const statLines = [
        `Time: ${mins}:${String(secs).padStart(2, '0')}`,
        `Bullets fired: ${bulletsFired}`,
        `Missiles used: ${missilesUsed}`,
        `Damage taken: ${damageTaken}`,
        `Drone HP remaining: ${droneHP}/${droneMaxHP}`,
      ];
      statLines.forEach((line, i) => {
        k.add([
          k.text(line, { size: 14, font: 'monospace' }),
          k.pos(W / 2, statsY + i * 24), k.anchor('center'),
          k.color(200, 200, 200), k.fixed(), k.z(501),
        ]);
      });

      // Stars
      const starStr = '\u2605'.repeat(stars) + '\u2606'.repeat(3 - stars);
      k.add([
        k.text(starStr, { size: 28, font: 'monospace' }),
        k.pos(W / 2, statsY + statLines.length * 24 + 20), k.anchor('center'),
        k.color(255, 215, 0), k.fixed(), k.z(501),
      ]);

      // Prompt
      const promptObj = k.add([
        k.text('SPACE - CONTINUE | M - MENU', { size: 14, font: 'monospace' }),
        k.pos(W / 2, H - 60), k.anchor('center'),
        k.color(200, 200, 200), k.fixed(), k.z(501),
      ]);
      let bt = 0;
      promptObj.onUpdate(() => { bt += k.dt(); promptObj.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3; });

      k.onKeyPress('space', () => { if (phase === 'victory') k.go('mountain-intro'); });
      k.onKeyPress('enter', () => { if (phase === 'victory') k.go('mountain-intro'); });
      k.onKeyPress('m', () => { if (phase === 'victory') k.go('menu'); });
    });
  }

  function showDefeat() {
    if (phase === 'dead') return;
    phase = 'dead';
    instrText.text = '';
    instrBg.opacity = 0;

    screenFlash(k, 255, 0, 0, 500, 0.5);
    deathParticles(k, droneX, droneY);
    k.shake(12);

    k.wait(1, () => {
      k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.7), k.fixed(), k.z(500)]);

      k.add([
        k.text('DRONE DESTROYED', { size: 32, font: 'monospace' }),
        k.pos(W / 2, H * 0.35), k.anchor('center'), k.color(255, 68, 68), k.fixed(), k.z(501),
      ]);

      const promptObj = k.add([
        k.text('SPACE - RETRY | M - MENU', { size: 14, font: 'monospace' }),
        k.pos(W / 2, H * 0.55), k.anchor('center'),
        k.color(200, 200, 200), k.fixed(), k.z(501),
      ]);
      let bt = 0;
      promptObj.onUpdate(() => { bt += k.dt(); promptObj.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3; });

      k.onKeyPress('space', () => { if (phase === 'dead') k.go('level4-drone'); });
      k.onKeyPress('enter', () => { if (phase === 'dead') k.go('level4-drone'); });
      k.onKeyPress('m', () => { if (phase === 'dead') k.go('menu'); });
    });
  }

  // ══════════════════════════════════════════════════════════════
  // DEBUG SKIP
  // ══════════════════════════════════════════════════════════════
  k.onKeyPress('p', () => {
    if (phase === 'city') {
      startBossIntro();
    } else if (phase === 'boss') {
      bossHP = 0;
      bulletsFired = 20;
      missilesUsed = 2;
      showVictory();
    }
  });

  // ══════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ══════════════════════════════════════════════════════════════
  k.onUpdate(() => {
    const dt = k.dt();
    if (phase === 'city') updateCity(dt);
    else if (phase === 'boss-intro') updateBossIntro(dt);
    else if (phase === 'boss') {
      updateBoss(dt);
      updateDroneBoss(dt);
    }
  });

  // ══════════════════════════════════════════════════════════════
  // DRAW
  // ══════════════════════════════════════════════════════════════
  k.onDraw(() => {
    if (phase === 'city') drawCity();
    else if (phase === 'boss-intro') drawBossIntro();
    else if (phase === 'boss' || phase === 'victory' || phase === 'dead') drawBossRoom();
  });

  // ── CITY DRAWING ──
  function drawCity() {
    // Dark sky
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(15, 15, 25) });

    // Buildings (top-down view of destroyed city)
    for (const b of cityBuildings) {
      k.drawRect({
        pos: k.vec2(b.x, b.y), width: b.w, height: b.h,
        color: k.rgb(b.shade, b.shade, b.shade + 5),
      });
      // Roof edge
      k.drawRect({
        pos: k.vec2(b.x + 2, b.y + 2), width: b.w - 4, height: 2,
        color: k.rgb(b.shade + 15, b.shade + 15, b.shade + 20), opacity: 0.4,
      });
      // Fire
      if (b.hasFire) {
        const fr = 4 + Math.sin(cityTime * 4 + b.fireX) * 2;
        k.drawCircle({
          pos: k.vec2(b.x + b.fireX + 8, b.y + b.fireY + 8), radius: fr,
          color: k.rgb(255, 120 + Math.floor(Math.sin(cityTime * 6) * 40), 0), opacity: 0.7,
        });
      }
    }

    // Streets (gaps between buildings — darker lines)
    for (let sx = 65; sx < W; sx += 70) {
      k.drawRect({ pos: k.vec2(sx, 0), width: 5, height: H, color: k.rgb(8, 8, 12), opacity: 0.6 });
    }
    for (let sy = 65; sy < H; sy += 70) {
      k.drawRect({ pos: k.vec2(0, sy), width: W, height: 5, color: k.rgb(8, 8, 12), opacity: 0.6 });
    }

    // Target window (pulsing glow)
    const pulse = 0.5 + Math.sin(windowPulse) * 0.3;
    k.drawRect({
      pos: k.vec2(WINDOW_X - 25, WINDOW_Y - 25), width: 50, height: 50,
      color: k.rgb(255, 200, 0), opacity: pulse * 0.2,
    });
    k.drawRect({
      pos: k.vec2(WINDOW_X - 15, WINDOW_Y - 15), width: 30, height: 30,
      color: k.rgb(255, 200, 0), opacity: pulse * 0.6,
    });
    k.drawRect({
      pos: k.vec2(WINDOW_X - 10, WINDOW_Y - 10), width: 20, height: 20,
      color: k.rgb(255, 230, 100), opacity: pulse,
    });
    // Window panes
    k.drawLine({
      p1: k.vec2(WINDOW_X, WINDOW_Y - 10), p2: k.vec2(WINDOW_X, WINDOW_Y + 10),
      color: k.rgb(180, 140, 0), width: 1, opacity: 0.8,
    });
    k.drawLine({
      p1: k.vec2(WINDOW_X - 10, WINDOW_Y), p2: k.vec2(WINDOW_X + 10, WINDOW_Y),
      color: k.rgb(180, 140, 0), width: 1, opacity: 0.8,
    });

    // Debris
    for (const d of debris) {
      k.drawCircle({
        pos: k.vec2(d.x, d.y), radius: d.r,
        color: k.rgb(d.shade, d.shade - 10, d.shade - 20),
      });
    }

    // Wind indicator (top-right)
    const windEndX = W - 60 + Math.cos(windAngle) * 20;
    const windEndY = 40 + Math.sin(windAngle) * 20;
    k.drawCircle({ pos: k.vec2(W - 60, 40), radius: 22, color: k.rgb(0, 0, 0), opacity: 0.4 });
    k.drawLine({
      p1: k.vec2(W - 60, 40), p2: k.vec2(windEndX, windEndY),
      color: k.rgb(0, 200, 255), width: 2,
    });
    k.drawText({
      text: 'WIND', pos: k.vec2(W - 60, 16),
      size: 8, font: 'monospace', color: k.rgb(100, 100, 120), anchor: 'center',
    });

    // Drone
    const droneAlpha = (droneInvuln > 0 && Math.sin(droneInvuln * 30) > 0) ? 0.3 : 1;
    // Drone body
    k.drawRect({
      pos: k.vec2(droneX - 6, droneY - 4), width: 12, height: 8,
      color: k.rgb(60, 60, 66), opacity: droneAlpha,
    });
    // Rotors
    const rotorOff = [[- 9, -9], [9, -9], [-9, 9], [9, 9]];
    for (const [ox, oy] of rotorOff) {
      k.drawCircle({
        pos: k.vec2(droneX + ox, droneY + oy), radius: 3,
        color: k.rgb(100, 100, 100), opacity: droneAlpha,
      });
    }
    // Camera
    k.drawCircle({
      pos: k.vec2(droneX, droneY), radius: 2,
      color: k.rgb(204, 34, 34), opacity: droneAlpha,
    });

    // HUD - "Navigate to window"
    k.drawText({
      text: 'NAVIGATE TO TARGET WINDOW', pos: k.vec2(W / 2, 16),
      size: 12, font: 'monospace', color: k.rgb(255, 200, 0), anchor: 'center',
    });

    // Arrow pointing to window
    const arrowA = angleTo(droneX, droneY, WINDOW_X, WINDOW_Y);
    const arrowDist = 30;
    const ax = droneX + Math.cos(arrowA) * arrowDist;
    const ay = droneY + Math.sin(arrowA) * arrowDist;
    k.drawCircle({ pos: k.vec2(ax, ay), radius: 3, color: k.rgb(255, 215, 0), opacity: 0.7 });
  }

  // ── BOSS INTRO DRAWING ──
  function drawBossIntro() {
    // Fade from city to room
    const t = clamp(introTimer / 3, 0, 1);

    // Dark transition
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(0, 0, 0) });

    if (t < 0.4) {
      // Glass shatter effect
      const shatterT = t / 0.4;
      for (let i = 0; i < 12; i++) {
        const sx = W / 2 + (Math.random() - 0.5) * 200 * shatterT;
        const sy = H / 2 + (Math.random() - 0.5) * 200 * shatterT;
        k.drawRect({
          pos: k.vec2(sx, sy), width: 4 + Math.random() * 8, height: 3 + Math.random() * 6,
          color: k.rgb(200, 220, 255), opacity: 0.5 * (1 - shatterT),
        });
      }
    }

    if (t > 0.3) {
      // Room fading in
      const roomAlpha = clamp((t - 0.3) / 0.4, 0, 1);
      drawRoomBg(roomAlpha);
    }

    if (t > 0.5) {
      // Boss appearing
      const bossAlpha = clamp((t - 0.5) / 0.3, 0, 1);
      k.drawRect({
        pos: k.vec2(ARMCHAIR_X - BOSS_DISPLAY / 2, ARMCHAIR_Y - BOSS_DISPLAY / 2),
        width: BOSS_DISPLAY, height: BOSS_DISPLAY,
        color: k.rgb(50, 40, 30), opacity: bossAlpha * 0.3,
      });

      // "YAHYA SINWAR" text
      if (t > 0.7) {
        const textAlpha = clamp((t - 0.7) / 0.2, 0, 1);
        k.drawText({
          text: 'YAHYA SINWAR', pos: k.vec2(W / 2, H * 0.3),
          size: 28, font: 'monospace', color: k.rgb(255, 68, 68), anchor: 'center',
          opacity: textAlpha,
        });
        k.drawText({
          text: 'TARGET ACQUIRED', pos: k.vec2(W / 2, H * 0.3 + 36),
          size: 14, font: 'monospace', color: k.rgb(255, 200, 0), anchor: 'center',
          opacity: textAlpha * 0.8,
        });
      }
    }
  }

  // ── ROOM BACKGROUND ──
  function drawRoomBg(alpha) {
    const a = alpha || 1;
    // Floor
    k.drawRect({
      pos: k.vec2(ROOM_LEFT, ROOM_TOP),
      width: ROOM_RIGHT - ROOM_LEFT, height: ROOM_BOTTOM - ROOM_TOP,
      color: k.rgb(35, 30, 25), opacity: a,
    });

    // Walls
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: ROOM_TOP, color: k.rgb(50, 45, 40), opacity: a });
    k.drawRect({ pos: k.vec2(0, ROOM_BOTTOM), width: W, height: H - ROOM_BOTTOM, color: k.rgb(50, 45, 40), opacity: a });
    k.drawRect({ pos: k.vec2(0, 0), width: ROOM_LEFT, height: H, color: k.rgb(50, 45, 40), opacity: a });
    k.drawRect({ pos: k.vec2(ROOM_RIGHT, 0), width: W - ROOM_RIGHT, height: H, color: k.rgb(50, 45, 40), opacity: a });

    // Wall cracks
    k.drawLine({ p1: k.vec2(100, ROOM_TOP), p2: k.vec2(120, ROOM_TOP + 30), color: k.rgb(30, 25, 20), width: 1, opacity: a * 0.5 });
    k.drawLine({ p1: k.vec2(700, ROOM_TOP), p2: k.vec2(680, ROOM_TOP + 25), color: k.rgb(30, 25, 20), width: 1, opacity: a * 0.5 });
    k.drawLine({ p1: k.vec2(ROOM_LEFT, 200), p2: k.vec2(ROOM_LEFT + 20, 220), color: k.rgb(30, 25, 20), width: 1, opacity: a * 0.5 });

    // Rubble
    for (const r of roomRubble) {
      k.drawRect({
        pos: k.vec2(r.x, r.y), width: r.w, height: r.h,
        color: k.rgb(r.shade, r.shade - 5, r.shade - 10), opacity: a * 0.6,
      });
    }

    // Overturned table
    k.drawRect({
      pos: k.vec2(200, 150), width: 60, height: 6,
      color: k.rgb(70, 50, 30), opacity: a,
    });
    k.drawRect({
      pos: k.vec2(200, 150), width: 6, height: 30,
      color: k.rgb(60, 40, 25), opacity: a,
    });

    // Armchair
    k.drawRect({
      pos: k.vec2(ARMCHAIR_X - ARMCHAIR_W / 2, ARMCHAIR_Y - ARMCHAIR_H / 2),
      width: ARMCHAIR_W, height: ARMCHAIR_H,
      color: k.rgb(90, 60, 30), opacity: a,
    });
    // Armchair back
    k.drawRect({
      pos: k.vec2(ARMCHAIR_X - ARMCHAIR_W / 2 - 3, ARMCHAIR_Y - ARMCHAIR_H / 2 - 6),
      width: ARMCHAIR_W + 6, height: 10,
      color: k.rgb(80, 50, 25), opacity: a,
    });
    // Armchair arms
    k.drawRect({
      pos: k.vec2(ARMCHAIR_X - ARMCHAIR_W / 2 - 5, ARMCHAIR_Y - ARMCHAIR_H / 2),
      width: 7, height: ARMCHAIR_H,
      color: k.rgb(75, 48, 22), opacity: a,
    });
    k.drawRect({
      pos: k.vec2(ARMCHAIR_X + ARMCHAIR_W / 2 - 2, ARMCHAIR_Y - ARMCHAIR_H / 2),
      width: 7, height: ARMCHAIR_H,
      color: k.rgb(75, 48, 22), opacity: a,
    });
  }

  // ── BOSS ROOM DRAWING ──
  function drawBossRoom() {
    drawRoomBg();

    // Boss
    if (phase !== 'dead' || bossHP > 0) {
      const bossW = BOSS_DISPLAY;
      const bossH = BOSS_DISPLAY;

      if (bossPhase === 1 && bossState === 'hiding') {
        // Only top of head visible above armchair
        k.drawRect({
          pos: k.vec2(bossX - 10, ARMCHAIR_Y - ARMCHAIR_H / 2 - 14),
          width: 20, height: 12,
          color: k.rgb(170, 130, 90),
        });
        // Beret hint
        k.drawRect({
          pos: k.vec2(bossX - 12, ARMCHAIR_Y - ARMCHAIR_H / 2 - 18),
          width: 24, height: 6,
          color: k.rgb(42, 106, 42),
        });
      } else {
        // Full boss sprite (drawn procedurally)
        const spriteKey = bossPhase === 3 ? 'furious' : bossPhase === 2 ? 'angry' : 'normal';
        // Draw boss body (colored rect with features)
        const bx = bossX - bossW / 2;
        const by = bossY - bossH / 2;

        // Suit body
        k.drawRect({ pos: k.vec2(bx + 18, by + 38), width: 28, height: 22, color: k.rgb(42, 42, 42) });
        // Shoulders
        k.drawRect({ pos: k.vec2(bx + 14, by + 36), width: 36, height: 6, color: k.rgb(51, 51, 51) });
        // Neck
        const skinR = spriteKey === 'furious' ? 176 : spriteKey === 'angry' ? 186 : 196;
        const skinG = spriteKey === 'furious' ? 112 : spriteKey === 'angry' ? 136 : 149;
        const skinB = spriteKey === 'furious' ? 72 : spriteKey === 'angry' ? 88 : 106;
        k.drawRect({ pos: k.vec2(bx + 27, by + 30), width: 10, height: 10, color: k.rgb(skinR - 20, skinG - 20, skinB - 20) });

        // Head
        k.drawCircle({ pos: k.vec2(bossX, by + 18), radius: 14, color: k.rgb(skinR, skinG, skinB) });

        // Beret
        k.drawRect({ pos: k.vec2(bx + 18, by + 4), width: 28, height: 10, color: k.rgb(42, 106, 42) });
        // Beret badge
        k.drawCircle({ pos: k.vec2(bossX, by + 8), radius: 2, color: k.rgb(255, 204, 0) });

        // Eyebrows
        const browAngle = spriteKey === 'furious' ? 3 : spriteKey === 'angry' ? 2 : 1;
        k.drawLine({
          p1: k.vec2(bossX - 10, by + 14 - browAngle),
          p2: k.vec2(bossX - 2, by + 14 + browAngle),
          color: k.rgb(17, 17, 17), width: 3,
        });
        k.drawLine({
          p1: k.vec2(bossX + 10, by + 14 - browAngle),
          p2: k.vec2(bossX + 2, by + 14 + browAngle),
          color: k.rgb(17, 17, 17), width: 3,
        });

        // Eyes
        k.drawCircle({ pos: k.vec2(bossX - 5, by + 18), radius: 1.5, color: k.rgb(26, 26, 26) });
        k.drawCircle({ pos: k.vec2(bossX + 5, by + 18), radius: 1.5, color: k.rgb(26, 26, 26) });

        // Beard
        k.drawCircle({ pos: k.vec2(bossX, by + 30), radius: 8, color: k.rgb(138, 138, 138) });

        // Damage flash
        if (bossFlash > 0) {
          k.drawRect({
            pos: k.vec2(bx, by), width: bossW, height: bossH,
            color: k.rgb(255, 255, 255), opacity: bossFlash * 0.5,
          });
        }

        // Charging indicator
        if (bossState === 'charging') {
          k.drawCircle({
            pos: k.vec2(bossX, bossY), radius: BOSS_DISPLAY / 2 + 5,
            color: k.rgb(255, 0, 0), opacity: 0.3,
          });
        }
      }
    }

    // Boss projectiles
    for (const p of bossProjectiles) {
      k.drawRect({
        pos: k.vec2(p.x - 6, p.y - 4), width: 12, height: 8,
        color: k.rgb(186, 106, 74),
      });
      k.drawLine({
        p1: k.vec2(p.x - 4, p.y - 2), p2: k.vec2(p.x + 2, p.y + 3),
        color: k.rgb(122, 74, 42), width: 1,
      });
    }

    // Drone bullets
    for (const b of droneBullets) {
      k.drawCircle({
        pos: k.vec2(b.x, b.y), radius: 3,
        color: k.rgb(0, 229, 255),
      });
      // Glow
      k.drawCircle({
        pos: k.vec2(b.x, b.y), radius: 5,
        color: k.rgb(0, 229, 255), opacity: 0.3,
      });
    }

    // Drone missiles
    for (const m of droneMissiles) {
      const mx = m.x, my = m.y;
      // Trail
      k.drawCircle({ pos: k.vec2(mx - Math.cos(m.angle) * 6, my - Math.sin(m.angle) * 6), radius: 3, color: k.rgb(255, 136, 0), opacity: 0.5 });
      // Body
      k.drawRect({
        pos: k.vec2(mx - 5, my - 3), width: 10, height: 6,
        color: k.rgb(221, 34, 34),
      });
    }

    // Drone (in boss room)
    if (phase !== 'dead' || droneHP > 0) {
      const droneAlpha = (droneInvuln > 0 && Math.sin(droneInvuln * 30) > 0) ? 0.3 : 1;
      // Body
      k.drawRect({
        pos: k.vec2(droneX - 8, droneY - 5), width: 16, height: 10,
        color: k.rgb(60, 60, 66), opacity: droneAlpha,
      });
      // Rotors
      const rotorOff = [[-10, -10], [10, -10], [-10, 10], [10, 10]];
      for (const [ox, oy] of rotorOff) {
        k.drawCircle({
          pos: k.vec2(droneX + ox, droneY + oy), radius: 4,
          color: k.rgb(100, 100, 100), opacity: droneAlpha,
        });
      }
      // Camera
      k.drawCircle({
        pos: k.vec2(droneX, droneY), radius: 2,
        color: k.rgb(204, 34, 34), opacity: droneAlpha,
      });
      // Dash trail
      if (droneDashing) {
        k.drawCircle({
          pos: k.vec2(droneX - droneFacingX * 15, droneY - droneFacingY * 15),
          radius: 6, color: k.rgb(0, 200, 255), opacity: 0.3,
        });
      }
    }

    // ── HUD ──
    if (phase === 'boss') {
      // Drone HP (top-left)
      k.drawText({
        text: 'DRONE', pos: k.vec2(12, 8),
        size: 10, font: 'monospace', color: k.rgb(150, 150, 170),
      });
      for (let i = 0; i < droneMaxHP; i++) {
        const filled = i < droneHP;
        k.drawRect({
          pos: k.vec2(12 + i * 22, 22), width: 18, height: 8,
          color: filled ? k.rgb(0, 200, 100) : k.rgb(60, 30, 30),
        });
      }

      // Boss HP bar (top-center)
      const barW = 300;
      const barX = W / 2 - barW / 2;
      k.drawText({
        text: `SINWAR [${bossHP}/${BOSS_HP}]`, pos: k.vec2(W / 2, 6),
        size: 10, font: 'monospace', color: k.rgb(255, 100, 100), anchor: 'center',
      });
      k.drawRect({ pos: k.vec2(barX, 20), width: barW, height: 10, color: k.rgb(40, 20, 20) });
      const hpFrac = Math.max(0, bossHP / BOSS_HP);
      const hpR = hpFrac > 0.6 ? 200 : hpFrac > 0.3 ? 255 : 255;
      const hpG = hpFrac > 0.6 ? 50 : hpFrac > 0.3 ? 150 : 50;
      k.drawRect({
        pos: k.vec2(barX, 20), width: barW * hpFrac, height: 10,
        color: k.rgb(hpR, hpG, 0),
      });

      // Missile cooldown (top-right)
      const mcdFrac = droneMissileCD > 0 ? (1 - droneMissileCD / DRONE_MISSILE_CD) : 1;
      k.drawText({
        text: 'MISSILE', pos: k.vec2(W - 90, 8),
        size: 10, font: 'monospace', color: mcdFrac >= 1 ? k.rgb(255, 200, 0) : k.rgb(100, 100, 100),
      });
      k.drawRect({ pos: k.vec2(W - 90, 22), width: 70, height: 6, color: k.rgb(40, 40, 40) });
      k.drawRect({ pos: k.vec2(W - 90, 22), width: 70 * mcdFrac, height: 6, color: mcdFrac >= 1 ? k.rgb(255, 200, 0) : k.rgb(100, 80, 0) });

      // Dash cooldown
      const dcdFrac = droneDashCD > 0 ? (1 - droneDashCD / DRONE_DASH_CD) : 1;
      k.drawText({
        text: 'DASH', pos: k.vec2(W - 90, 34),
        size: 10, font: 'monospace', color: dcdFrac >= 1 ? k.rgb(0, 200, 255) : k.rgb(100, 100, 100),
      });
      k.drawRect({ pos: k.vec2(W - 90, 46), width: 70, height: 6, color: k.rgb(40, 40, 40) });
      k.drawRect({ pos: k.vec2(W - 90, 46), width: 70 * dcdFrac, height: 6, color: dcdFrac >= 1 ? k.rgb(0, 200, 255) : k.rgb(0, 80, 100) });

      // Boss phase indicator
      const phaseLabel = bossPhase === 1 ? 'HIDING' : bossPhase === 2 ? 'HUNTING' : 'DESPERATE';
      const phaseColor = bossPhase === 1 ? k.rgb(200, 200, 100) : bossPhase === 2 ? k.rgb(255, 150, 0) : k.rgb(255, 50, 50);
      k.drawText({
        text: `PHASE ${bossPhase}: ${phaseLabel}`, pos: k.vec2(W / 2, H - 10),
        size: 10, font: 'monospace', color: phaseColor, anchor: 'center',
      });
    }

    // Phase transition text overlay
    if (phaseTransTimer > 0) {
      const tAlpha = Math.min(1, phaseTransTimer);
      k.drawRect({
        pos: k.vec2(0, H / 2 - 30), width: W, height: 60,
        color: k.rgb(0, 0, 0), opacity: tAlpha * 0.7,
      });
      k.drawText({
        text: phaseTransText, pos: k.vec2(W / 2, H / 2),
        size: 24, font: 'monospace', color: k.rgb(255, 68, 68), anchor: 'center',
        opacity: tAlpha,
      });
    }
  }
}
