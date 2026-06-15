// ===================================================================
// Level 6 — Operation Endgame: Final Boss (Supreme Turban)
// Side-scrolling approach -> 3-phase boss fight -> victory
// Ported from BossScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../constants.js';
import { generateBossTextures } from '../systems/texture-factory.js';
import { screenFlash, impactParticles, bossPhaseTransition } from '../systems/game-juice.js';

// ── Constants ──
const PLAYER_SPEED_X = 200;
const PLAYER_SPEED_Y = 250;
const PLAYER_SPEED_X_BOOST = 280;
const APPROACH_SPEED = 120;
const TOTAL_DISTANCE = 6000;
const ATTACK_DISTANCE = 4500;
const PLAYER_MAX_BULLETS = 8;
const BULLET_SPEED = 500;
const BULLET_COOLDOWN = 0.15;
const HEAVY_BOMB_MAX = 8;
const HEAVY_BOMB_COOLDOWN = 2;
const HEAVY_BOMB_SPEED = 400;
const HEAVY_BOMB_MULT = 3;
const ANTI_MISSILE_CHARGES = 5;
const ANTI_MISSILE_RADIUS = 100;
const ANTI_MISSILE_CD = 5;
const BOSS_BASE_HP = 80;
const BARREL_ROLL_CD = 3;
const INVULN_TIME = 1.5;

export function level6BossScene(k) {
  generateBossTextures(k);

  // ══════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════
  let phase = 'intro'; // intro, approach, attack, victory, dead
  let introTimer = 0;
  let startTime = Date.now();
  let distance = 0;

  // Parallax offsets
  let cityOffset = 0;
  let groundOffset = 0;

  // Player
  let playerX = -40;
  let playerY = H / 2;
  let playerHP = 3;
  const PLAYER_MAX_HP = 3;
  let invulnTimer = 0;
  let shootCooldown = 0;
  let shotsFired = 0;
  let shotsHit = 0;
  let damageTaken = 0;

  // Player bullets
  let playerBullets = [];

  // Heavy bombs
  let heavyBombs = [];
  let heavyBombsRemaining = HEAVY_BOMB_MAX;
  let heavyBombCooldown = 0;

  // Anti-missile pulse
  let antiMissileCharges = ANTI_MISSILE_CHARGES;
  let antiMissileCooldown = 0;
  let antiMissilePulseActive = false;
  let antiMissilePulseTimer = 0;
  let antiMissilePulseX = 0;
  let antiMissilePulseY = 0;

  // Barrel roll
  let barrelRollCooldown = 0;
  let barrelRollActive = false;
  let barrelRollTimer = 0;
  let barrelRollAngle = 0;

  // Boss
  let bossX = W + 150;
  let bossY = 280;
  let bossHP = BOSS_BASE_HP;
  let bossPhase = 0; // 0=approach, 1=shield, 2=rotating, 3=laser
  let bossVisible = false;

  // Phase 1: Energy shield
  let energyShieldActive = true;
  let energyShieldTimer = 0;
  let energyShieldVulnerable = false;
  let energyShieldFlickerTimer = 0;

  // Phase 2: Rotating shield + drones
  let shieldActive = false;
  let shieldAngle = 0;
  let drones = [];
  let droneSpawnTimer = 0;
  let areaBombs = [];
  let areaBombTimer = 0;

  // Phase 3: Laser sweep
  let laserSweepActive = false;
  let laserSweepY = 0;
  let laserSweepDir = 1;
  let laserGapY = H / 2;
  let laserGapVY = 0;
  let laserFiring = false;
  let laserChargeTimer = 0;
  let laserChargeWarningLine = 0;
  let laserFireDuration = 0;
  let laserCooldown = 0;
  let rapidShotTimer = 0;

  // Enemy projectiles
  let samMissiles = [];
  let bossBullets = [];
  let homingMissiles = [];

  // Attack timers
  let fanMissileTimer = 0;
  let samTimer = 0;
  let spreadTimer = 0;
  let homingTimer = 0;

  // Boss flash telegraph
  let bossFlashTimer = 0;

  // Phase transition flags
  let phase2Triggered = false;
  let phase3Triggered = false;
  let musicPhase2Triggered = false;
  let warningTextTriggered = false;

  // Explosion particles (for victory)
  let deathParticles = [];
  let deathTimer = 0;

  // Center message
  let centerMsgText = '';
  let centerMsgColor = [255, 34, 34];
  let centerMsgAlpha = 0;
  let centerMsgTimer = 0;

  // ══════════════════════════════════════════════════════════════
  // HUD (fixed elements)
  // ══════════════════════════════════════════════════════════════
  const hudArmor = k.add([
    k.text('ARMOR: 3/3', { size: 12, font: 'monospace' }),
    k.pos(15, 15), k.color(255, 255, 255), k.fixed(), k.z(30),
  ]);
  const hudPulse = k.add([
    k.text(`PULSE: ${ANTI_MISSILE_CHARGES}/${ANTI_MISSILE_CHARGES}`, { size: 11, font: 'monospace' }),
    k.pos(15, 32), k.color(0, 255, 255), k.fixed(), k.z(30),
  ]);
  const hudBombs = k.add([
    k.text(`BOMBS: ${HEAVY_BOMB_MAX}/${HEAVY_BOMB_MAX}`, { size: 11, font: 'monospace' }),
    k.pos(15, 48), k.color(255, 136, 0), k.fixed(), k.z(30),
  ]);
  const hudDist = k.add([
    k.text(`DISTANCE: ${TOTAL_DISTANCE}m`, { size: 13, font: 'monospace' }),
    k.pos(W - 15, 15), k.anchor('topright'), k.color(0, 229, 255), k.fixed(), k.z(30),
  ]);
  const hudBarrelRoll = k.add([
    k.text('ROLL: READY', { size: 10, font: 'monospace' }),
    k.pos(15, 64), k.color(0, 200, 0), k.fixed(), k.z(30),
  ]);
  // Boss HP bar components (hidden until attack)
  let bossHPBarVisible = false;
  const hudBossLabel = k.add([
    k.text('AYATOLLAH ALI KHAMENEI', { size: 9, font: 'monospace' }),
    k.pos(W / 2, 20), k.anchor('center'), k.color(255, 255, 255), k.opacity(0), k.fixed(), k.z(32),
  ]);
  const hudPhaseLabel = k.add([
    k.text('', { size: 11, font: 'monospace' }),
    k.pos(W / 2, 36), k.anchor('center'), k.color(255, 136, 0), k.opacity(0), k.fixed(), k.z(32),
  ]);
  // Controls hint
  const instrText = k.add([
    k.text('ARROWS: Move | SPACE: Shoot | X: Bomb | SHIFT: Roll | C: Pulse', { size: 11, font: 'monospace' }),
    k.pos(W / 2, H - 14), k.anchor('center'), k.color(150, 150, 170), k.fixed(), k.z(30),
  ]);

  // ══════════════════════════════════════════════════════════════
  // HELPER: Show center message
  // ══════════════════════════════════════════════════════════════
  function showCenterMsg(text, r, g, b) {
    centerMsgText = text;
    centerMsgColor = [r, g, b];
    centerMsgAlpha = 1;
    centerMsgTimer = 2;
  }

  // ══════════════════════════════════════════════════════════════
  // INTRO
  // ══════════════════════════════════════════════════════════════
  showCenterMsg('OPERATION ENDGAME', 255, 34, 34);

  // Slide player in
  k.tween(-40, 120, 2, (v) => { playerX = v; }, k.easings.easeOutQuad);

  // After 2.5s transition to approach
  k.wait(2.5, () => {
    if (phase === 'intro') {
      phase = 'approach';
      distance = 0;
    }
  });

  // ══════════════════════════════════════════════════════════════
  // MAIN UPDATE
  // ══════════════════════════════════════════════════════════════
  k.onUpdate(() => {
    const dt = k.dt();

    // Center message fade
    if (centerMsgTimer > 0) {
      centerMsgTimer -= dt;
      if (centerMsgTimer < 0.5) {
        centerMsgAlpha = centerMsgTimer / 0.5;
      }
      if (centerMsgTimer <= 0) {
        centerMsgAlpha = 0;
        centerMsgText = '';
      }
    }

    switch (phase) {
      case 'intro':
        introTimer += dt;
        updateScrolling(dt, APPROACH_SPEED * 0.3);
        break;
      case 'approach':
        updateApproach(dt);
        break;
      case 'attack':
        updateAttack(dt);
        break;
      case 'victory':
        updateVictory(dt);
        break;
      case 'dead':
        break;
    }
  });

  // ══════════════════════════════════════════════════════════════
  // SCROLLING
  // ══════════════════════════════════════════════════════════════
  function updateScrolling(dt, speed) {
    cityOffset += speed * 0.15 * dt;
    groundOffset += speed * 0.6 * dt;
  }

  // ══════════════════════════════════════════════════════════════
  // APPROACH PHASE
  // ══════════════════════════════════════════════════════════════
  function updateApproach(dt) {
    const effectiveSpeed = APPROACH_SPEED;
    distance += effectiveSpeed * dt;

    updateScrolling(dt, effectiveSpeed);

    // Player movement
    if (k.isKeyDown('up') || k.isKeyDown('w')) playerY -= PLAYER_SPEED_Y * dt;
    if (k.isKeyDown('down') || k.isKeyDown('s')) playerY += PLAYER_SPEED_Y * dt;
    if (k.isKeyDown('left') || k.isKeyDown('a')) playerX -= PLAYER_SPEED_X * dt;
    if (k.isKeyDown('right') || k.isKeyDown('d')) playerX += PLAYER_SPEED_X * dt;
    playerX = clamp(playerX, 60, 500);
    playerY = clamp(playerY, 60, 480);

    // Invulnerability
    updateInvulnerability(dt);

    // Anti-missile pulse cooldown
    updateAntiMissileCooldown(dt);

    // Heavy bomb cooldown
    heavyBombCooldown = Math.max(0, heavyBombCooldown - dt);

    // Barrel roll cooldown
    barrelRollCooldown = Math.max(0, barrelRollCooldown - dt);

    // Spawn approach enemies
    spawnApproachEnemies(dt);

    // Update projectiles
    updateSAMs(dt);
    updateBossBullets(dt);
    updateHomingMissiles(dt);
    updateHeavyBombs(dt);

    // Collisions
    checkPlayerCollisions();

    // HUD
    const remaining = Math.max(0, Math.round(TOTAL_DISTANCE - distance));
    hudDist.text = `DISTANCE: ${remaining}m`;
    updateHUDCommon();

    // Music transition
    if (!musicPhase2Triggered && distance >= 2000) {
      musicPhase2Triggered = true;
    }

    // Warning text
    if (!warningTextTriggered && distance >= 4200) {
      warningTextTriggered = true;
      showCenterMsg('ENTERING ATTACK RANGE', 255, 136, 0);
    }

    // Transition to attack
    if (distance >= ATTACK_DISTANCE) {
      transitionToAttack();
    }
  }

  function spawnApproachEnemies(dt) {
    samTimer += dt;
    spreadTimer += dt;
    homingTimer += dt;

    if (distance < 2000) {
      if (samTimer >= 3) {
        samTimer = 0;
        spawnSAM(200, true);
      }
    } else if (distance < 4000) {
      if (samTimer >= 1.5) {
        samTimer = 0;
        spawnSAM(280, true);
      }
      if (spreadTimer >= 2) {
        spreadTimer = 0;
        fireAABurst(3);
      }
      if (homingTimer >= 6) {
        homingTimer = 0;
        spawnHomingMissile(W + 10, 100 + Math.random() * 300);
      }
    } else {
      if (samTimer >= 1) {
        samTimer = 0;
        spawnSAM(320, true);
      }
      if (spreadTimer >= 1.5) {
        spreadTimer = 0;
        fireAABurst(5);
      }
      if (homingTimer >= 4) {
        homingTimer = 0;
        spawnHomingMissile(W + 10, 100 + Math.random() * 300);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TRANSITION TO ATTACK
  // ══════════════════════════════════════════════════════════════
  function transitionToAttack() {
    phase = 'attack';
    playerX = clamp(playerX, 60, 500);

    // Reset timers
    samTimer = 0; spreadTimer = 0; homingTimer = 0; fanMissileTimer = 0;

    // Clear projectiles
    playerBullets = [];
    bossBullets = [];
    samMissiles = [];
    homingMissiles = [];
    heavyBombs = [];

    // Show boss
    bossVisible = true;
    bossX = W + 150;
    k.tween(W + 150, 780, 1.5, (v) => { bossX = v; }, k.easings.easeOutQuad);

    // Show boss HP bar after 1s
    k.wait(1, () => {
      bossHPBarVisible = true;
      hudBossLabel.opacity = 1;
      hudPhaseLabel.opacity = 1;
    });

    // Phase 1: Energy shield
    bossPhase = 1;
    energyShieldActive = true;
    energyShieldTimer = 0;
    energyShieldVulnerable = false;

    showCenterMsg('DESTROY THE SUPREME LEADER', 255, 34, 34);
    instrText.text = 'Shoot when shield drops! | X: Bomb | SHIFT: Roll | C: Pulse';
  }

  // ══════════════════════════════════════════════════════════════
  // ATTACK PHASE
  // ══════════════════════════════════════════════════════════════
  function updateAttack(dt) {
    // Barrel roll update
    updateBarrelRoll(dt);

    // Anti-missile pulse cooldown
    updateAntiMissileCooldown(dt);

    // Heavy bomb cooldown
    heavyBombCooldown = Math.max(0, heavyBombCooldown - dt);

    // Player movement (unless barrel rolling)
    if (!barrelRollActive) {
      if (k.isKeyDown('up') || k.isKeyDown('w')) playerY -= PLAYER_SPEED_Y * dt;
      if (k.isKeyDown('down') || k.isKeyDown('s')) playerY += PLAYER_SPEED_Y * dt;
      if (k.isKeyDown('left') || k.isKeyDown('a')) playerX -= PLAYER_SPEED_X_BOOST * 2.5 * dt;
      if (k.isKeyDown('right') || k.isKeyDown('d')) playerX += PLAYER_SPEED_X_BOOST * 2.5 * dt;
    }
    playerX = clamp(playerX, 60, 500);
    playerY = clamp(playerY, 60, 480);

    // Phase-specific updates
    if (bossPhase === 1) updateEnergyShield(dt);
    if (bossPhase === 2) {
      shieldAngle += dt * 1.2;
      updateDrones(dt);
      updateAreaBombs(dt);
    }
    if (bossPhase === 3) updateLaserSweep(dt);

    // Boss flash telegraph
    if (bossFlashTimer > 0) bossFlashTimer -= dt;

    // Player shooting
    shootCooldown = Math.max(0, shootCooldown - dt);
    // (handled by key press events below)

    // Invulnerability
    updateInvulnerability(dt);

    // Boss attacks
    spawnBossAttacks(dt);

    // Update all projectiles
    updatePlayerBullets(dt);
    updateSAMs(dt);
    updateBossBullets(dt);
    updateHomingMissiles(dt);
    updateHeavyBombs(dt);

    // Collisions
    checkPlayerCollisions();
    checkBossCollisions();
    checkHeavyBombBossCollisions();
    if (bossPhase === 2) checkDroneCollisions();

    // HUD
    const phaseLabels = { 1: 'PHASE 1: ENERGY SHIELD', 2: 'PHASE 2: ROTATING SHIELD', 3: 'PHASE 3: SUPREME FURY' };
    hudDist.text = phaseLabels[bossPhase] || 'ENGAGED';
    hudPhaseLabel.text = phaseLabels[bossPhase] || '';
    updateHUDCommon();
  }

  // ══════════════════════════════════════════════════════════════
  // KEY EVENTS
  // ══════════════════════════════════════════════════════════════
  k.onKeyPress('space', () => {
    if (phase === 'dead' || phase === 'victory') return;
    if (phase === 'attack' && shootCooldown <= 0) {
      const activeCount = playerBullets.filter(b => b.active).length;
      if (activeCount < PLAYER_MAX_BULLETS) {
        playerBullets.push({
          x: playerX + 24, y: playerY,
          vx: BULLET_SPEED, vy: 0, active: true,
        });
        shootCooldown = BULLET_COOLDOWN;
        shotsFired++;
      }
    }
  });

  k.onKeyPress('x', () => {
    if (phase === 'dead' || phase === 'victory') return;
    if (phase === 'attack' && heavyBombsRemaining > 0 && heavyBombCooldown <= 0) {
      heavyBombsRemaining--;
      heavyBombCooldown = HEAVY_BOMB_COOLDOWN;
      shotsFired++;
      k.shake(3);
      heavyBombs.push({
        x: playerX + 16, y: playerY + 8,
        vx: HEAVY_BOMB_SPEED, vy: 120,
        active: true, age: 0,
      });
    }
  });

  k.onKeyPress('c', () => {
    if (phase === 'dead' || phase === 'victory') return;
    if (antiMissileCharges > 0 && antiMissileCooldown <= 0) {
      antiMissileCharges--;
      antiMissileCooldown = ANTI_MISSILE_CD;
      antiMissilePulseActive = true;
      antiMissilePulseTimer = 0;
      antiMissilePulseX = playerX;
      antiMissilePulseY = playerY;
      screenFlash(k, 0, 200, 255, 100, 0.3);

      // Destroy nearby projectiles
      const r2 = ANTI_MISSILE_RADIUS * ANTI_MISSILE_RADIUS;
      for (const m of samMissiles) {
        if (!m.active) continue;
        const dx = m.x - playerX, dy = m.y - playerY;
        if (dx * dx + dy * dy < r2) m.active = false;
      }
      for (const b of bossBullets) {
        if (!b.active) continue;
        const dx = b.x - playerX, dy = b.y - playerY;
        if (dx * dx + dy * dy < r2) b.active = false;
      }
      for (const m of homingMissiles) {
        if (!m.active) continue;
        const dx = m.x - playerX, dy = m.y - playerY;
        if (dx * dx + dy * dy < r2) m.active = false;
      }
    }
  });

  k.onKeyPress('shift', () => {
    if (phase === 'dead' || phase === 'victory') return;
    if (!barrelRollActive && barrelRollCooldown <= 0) {
      startBarrelRoll();
    }
  });

  k.onKeyPress('escape', () => k.go('menu'));

  // ══════════════════════════════════════════════════════════════
  // BARREL ROLL
  // ══════════════════════════════════════════════════════════════
  function startBarrelRoll() {
    barrelRollActive = true;
    barrelRollTimer = 1.0;
    barrelRollAngle = 0;
    invulnTimer = Math.max(invulnTimer, 1.0);
    k.shake(3);
  }

  function updateBarrelRoll(dt) {
    barrelRollCooldown = Math.max(0, barrelRollCooldown - dt);
    if (barrelRollActive) {
      barrelRollTimer -= dt;
      barrelRollAngle += dt * 360;
      if (barrelRollTimer <= 0) {
        barrelRollActive = false;
        barrelRollCooldown = BARREL_ROLL_CD;
        barrelRollAngle = 0;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 1: ENERGY SHIELD
  // ══════════════════════════════════════════════════════════════
  function updateEnergyShield(dt) {
    energyShieldTimer += dt;
    if (!energyShieldVulnerable) {
      if (energyShieldTimer >= 4.5) energyShieldFlickerTimer += dt;
      if (energyShieldTimer >= 5.0) {
        energyShieldVulnerable = true;
        energyShieldActive = false;
        energyShieldTimer = 0;
        energyShieldFlickerTimer = 0;
        showCenterMsg('SHIELD DOWN - FIRE!', 0, 255, 0);
        screenFlash(k, 0, 170, 255, 100, 0.3);
        impactParticles(k, bossX, bossY, 12, [[0, 170, 255], [0, 204, 255], [255, 255, 255]]);
      }
    } else {
      if (energyShieldTimer >= 2.0) {
        energyShieldVulnerable = false;
        energyShieldActive = true;
        energyShieldTimer = 0;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: DRONES
  // ══════════════════════════════════════════════════════════════
  function spawnDronePair() {
    const y1 = 80 + Math.random() * 180;
    const y2 = 280 + Math.random() * 180;
    k.wait(1, () => {
      if (phase !== 'attack' || bossPhase !== 2) return;
      drones.push({ x: W - 40, y: y1, hp: 2, active: true, shootTimer: 1.5 + Math.random(), vx: -80 - Math.random() * 40, vy: (Math.random() - 0.5) * 60 });
      drones.push({ x: W - 40, y: y2, hp: 2, active: true, shootTimer: 1.5 + Math.random(), vx: -80 - Math.random() * 40, vy: (Math.random() - 0.5) * 60 });
    });
  }

  function updateDrones(dt) {
    for (const d of drones) {
      if (!d.active) continue;
      const dx = playerX - d.x;
      const dy = playerY - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist > 150) {
        d.vx += (dx / dist) * 100 * dt;
        d.vy += (dy / dist) * 100 * dt;
      } else {
        d.vx += (-dy / dist) * 60 * dt;
        d.vy += (dx / dist) * 60 * dt;
      }
      const spd = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      if (spd > 160) { d.vx = (d.vx / spd) * 160; d.vy = (d.vy / spd) * 160; }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.x = clamp(d.x, 80, W - 20);
      d.y = clamp(d.y, 40, H - 40);

      d.shootTimer -= dt;
      if (d.shootTimer <= 0) {
        d.shootTimer = 2 + Math.random();
        const bDist = Math.sqrt(dx * dx + dy * dy) || 1;
        bossBullets.push({ x: d.x, y: d.y, vx: (dx / bDist) * 200, vy: (dy / bDist) * 200, active: true });
      }
      if (d.x < -40 || d.x > W + 40) d.active = false;
    }
    drones = drones.filter(d => d.active);
  }

  function checkDroneCollisions() {
    for (const b of playerBullets) {
      if (!b.active) continue;
      for (const d of drones) {
        if (!d.active) continue;
        const dx = b.x - d.x, dy = b.y - d.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          b.active = false;
          d.hp--;
          shotsHit++;
          if (d.hp <= 0) {
            d.active = false;
            impactParticles(k, d.x, d.y, 8, [[255, 100, 0], [255, 136, 0]]);
          }
          break;
        }
      }
    }
    // Drone collision with player
    if (invulnTimer <= 0 && !barrelRollActive) {
      for (const d of drones) {
        if (!d.active) continue;
        const dx = d.x - playerX, dy = d.y - playerY;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          d.active = false;
          damagePlayer();
          return;
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: AREA BOMBS
  // ══════════════════════════════════════════════════════════════
  function dropAreaBomb() {
    const tx = clamp(playerX + (Math.random() - 0.5) * 200, 60, 600);
    const ty = clamp(playerY + (Math.random() - 0.5) * 200, 60, 480);
    areaBombs.push({ x: tx, y: ty, warningTimer: 1.0, radius: 60, active: true, detonated: false, explosionTimer: 0 });
  }

  function updateAreaBombs(dt) {
    for (const bomb of areaBombs) {
      if (!bomb.active) continue;
      bomb.warningTimer -= dt;
      if (bomb.warningTimer <= 0 && !bomb.detonated) {
        bomb.detonated = true;
        if (invulnTimer <= 0 && !barrelRollActive) {
          const dx = playerX - bomb.x, dy = playerY - bomb.y;
          if (Math.sqrt(dx * dx + dy * dy) < bomb.radius) damagePlayer();
        }
        k.shake(4);
        bomb.explosionTimer = 0.4;
      }
      if (bomb.detonated) {
        bomb.explosionTimer -= dt;
        if (bomb.explosionTimer <= 0) bomb.active = false;
      }
    }
    areaBombs = areaBombs.filter(b => b.active);
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 3: LASER SWEEP
  // ══════════════════════════════════════════════════════════════
  function updateLaserSweep(dt) {
    if (!laserSweepActive) return;
    if (laserChargeTimer > 0) {
      laserChargeTimer -= dt;
      if (laserChargeTimer <= 0) laserChargeWarningLine = 0.5;
      return;
    }
    if (laserChargeWarningLine > 0) {
      laserChargeWarningLine -= dt;
      if (laserChargeWarningLine <= 0) {
        laserFiring = true;
        laserFireDuration = 3.0;
      }
      return;
    }
    if (laserFiring) {
      laserFireDuration -= dt;
      const sweepSpeed = 200;
      laserSweepY += laserSweepDir * sweepSpeed * dt;
      if (laserSweepY > H - 40) { laserSweepY = H - 40; laserSweepDir = -1; }
      else if (laserSweepY < 40) { laserSweepY = 40; laserSweepDir = 1; }
      laserGapY += laserGapVY * dt;
      if (laserGapY < 60) { laserGapY = 60; laserGapVY = Math.abs(laserGapVY); }
      if (laserGapY > H - 60) { laserGapY = H - 60; laserGapVY = -Math.abs(laserGapVY); }

      // Collision check
      if (invulnTimer <= 0 && !barrelRollActive) {
        const gapTop = laserGapY - 40;
        const gapBottom = laserGapY + 40;
        const inGap = playerY >= gapTop && playerY <= gapBottom;
        const nearLaser = Math.abs(playerY - laserSweepY) < 18;
        if (nearLaser && !inGap) damagePlayer();
      }

      if (laserFireDuration <= 0) {
        laserSweepActive = false;
        laserFiring = false;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // BOSS ATTACKS
  // ══════════════════════════════════════════════════════════════
  function spawnBossAttacks(dt) {
    fanMissileTimer += dt;
    samTimer += dt;
    spreadTimer += dt;
    homingTimer += dt;
    laserCooldown = Math.max(0, laserCooldown - dt);

    if (bossPhase === 1) {
      if (fanMissileTimer >= 3) {
        fanMissileTimer = 0;
        bossFlashTimer = 0.5;
        k.wait(0.5, () => {
          if (phase !== 'attack' || bossPhase !== 1) return;
          fireFanMissiles(5);
        });
      }
    } else if (bossPhase === 2) {
      droneSpawnTimer += dt;
      if (droneSpawnTimer >= 8) { droneSpawnTimer = 0; spawnDronePair(); }
      areaBombTimer += dt;
      if (areaBombTimer >= 5) {
        areaBombTimer = 0;
        dropAreaBomb();
        k.wait(0.6, () => { if (phase === 'attack' && bossPhase === 2) dropAreaBomb(); });
      }
      if (samTimer >= 3) {
        samTimer = 0;
        bossFlashTimer = 0.5;
        k.wait(0.5, () => {
          if (phase !== 'attack' || bossPhase !== 2) return;
          spawnSAMFromBoss(250);
        });
      }
      if (spreadTimer >= 4) { spreadTimer = 0; fireBossSpread(3); }
    } else {
      // Phase 3
      if (!laserSweepActive && laserCooldown <= 0) {
        laserCooldown = 8;
        laserSweepActive = true;
        laserSweepY = 40;
        laserSweepDir = 1;
        laserGapY = H / 2;
        laserGapVY = 80 + Math.random() * 60;
        if (Math.random() > 0.5) laserGapVY *= -1;
        laserChargeTimer = 1.5;
        laserChargeWarningLine = 0;
        laserFiring = false;
        laserFireDuration = 0;
        showCenterMsg('LASER INCOMING', 255, 68, 68);
      }
      rapidShotTimer += dt;
      if (!laserSweepActive && rapidShotTimer >= 0.6) {
        rapidShotTimer = 0;
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          const dx = playerX - bossX;
          const dy = playerY - bossY + (Math.random() - 0.5) * 60;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          bossBullets.push({
            x: bossX - 50, y: bossY + (Math.random() - 0.5) * 30,
            vx: (dx / dist) * 280, vy: (dy / dist) * 280, active: true,
          });
        }
      }
      if (homingTimer >= 5) {
        homingTimer = 0;
        spawnHomingMissile(bossX - 40, bossY);
      }
    }
  }

  function fireFanMissiles(count) {
    const angleStep = 0.8 / (count - 1 || 1);
    const startAngle = Math.PI - 0.4;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      const speed = 240;
      samMissiles.push({
        x: bossX - 60, y: bossY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        speed, homing: false, active: true,
      });
    }
  }

  function fireBossSpread(count) {
    const angleStep = 0.7 / (count - 1 || 1);
    const startAngle = Math.PI - 0.35;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      bossBullets.push({
        x: bossX - 50, y: bossY,
        vx: Math.cos(angle) * 200, vy: Math.sin(angle) * 200, active: true,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ENEMY SPAWNING
  // ══════════════════════════════════════════════════════════════
  function spawnSAM(speed, homing) {
    const y = 80 + Math.random() * 360;
    samMissiles.push({ x: W + 10, y, vx: -speed, vy: 0, speed, homing, active: true });
  }

  function spawnSAMFromBoss(speed) {
    for (const oy of [-20, 20]) {
      samMissiles.push({ x: bossX - 60, y: bossY + oy, vx: -speed, vy: 0, speed, homing: true, active: true });
    }
  }

  function fireAABurst(count) {
    for (let i = 0; i < count; i++) {
      const spawnY = 100 + Math.random() * 340;
      const targetY = playerY + (Math.random() - 0.5) * 80;
      bossBullets.push({
        x: W + 5, y: spawnY, vx: -220, vy: (targetY - spawnY) * 0.3, active: true,
      });
    }
  }

  function spawnHomingMissile(sx, sy) {
    homingMissiles.push({ x: sx, y: sy, vx: -60, vy: 0, speed: 160, active: true });
  }

  // ══════════════════════════════════════════════════════════════
  // PROJECTILE UPDATES
  // ══════════════════════════════════════════════════════════════
  function updatePlayerBullets(dt) {
    for (const b of playerBullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x > W + 20 || b.y > H + 20 || b.y < -20) b.active = false;
    }
    playerBullets = playerBullets.filter(b => b.active);
  }

  function updateSAMs(dt) {
    for (const m of samMissiles) {
      if (!m.active) continue;
      if (m.homing) {
        const dy = playerY - m.y;
        m.vy += dy * 1.5 * dt;
        m.vy = clamp(m.vy, -150, 150);
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < -20 || m.x > W + 20 || m.y < -20 || m.y > H + 20) m.active = false;
    }
    samMissiles = samMissiles.filter(m => m.active);
  }

  function updateBossBullets(dt) {
    for (const b of bossBullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20) b.active = false;
    }
    bossBullets = bossBullets.filter(b => b.active);
  }

  function updateHomingMissiles(dt) {
    for (const m of homingMissiles) {
      if (!m.active) continue;
      const dx = playerX - m.x, dy = playerY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        m.vx += (dx / dist) * 180 * dt;
        m.vy += (dy / dist) * 180 * dt;
        const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        if (spd > m.speed) { m.vx = (m.vx / spd) * m.speed; m.vy = (m.vy / spd) * m.speed; }
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x < -40 || m.x > W + 40 || m.y < -40 || m.y > H + 40) m.active = false;
    }
    homingMissiles = homingMissiles.filter(m => m.active);
  }

  function updateHeavyBombs(dt) {
    for (const bomb of heavyBombs) {
      if (!bomb.active) continue;
      bomb.age += dt;
      bomb.x += bomb.vx * dt;
      bomb.y += bomb.vy * dt;
      if (bomb.x > W + 30 || bomb.y > H + 30 || bomb.y < -30) bomb.active = false;
    }
    heavyBombs = heavyBombs.filter(b => b.active);
  }

  // ══════════════════════════════════════════════════════════════
  // COLLISIONS
  // ══════════════════════════════════════════════════════════════
  function checkPlayerCollisions() {
    if (invulnTimer > 0 || barrelRollActive) return;

    for (const m of samMissiles) {
      if (!m.active) continue;
      const dx = m.x - playerX, dy = m.y - playerY;
      if (Math.sqrt(dx * dx + dy * dy) < 22) { m.active = false; damagePlayer(); return; }
    }
    for (const b of bossBullets) {
      if (!b.active) continue;
      const dx = b.x - playerX, dy = b.y - playerY;
      if (Math.sqrt(dx * dx + dy * dy) < 22) { b.active = false; damagePlayer(); return; }
    }
    for (const m of homingMissiles) {
      if (!m.active) continue;
      const dx = m.x - playerX, dy = m.y - playerY;
      if (Math.sqrt(dx * dx + dy * dy) < 20) { m.active = false; damagePlayer(); return; }
    }
  }

  function checkBossCollisions() {
    for (const b of playerBullets) {
      if (!b.active) continue;
      const dx = b.x - bossX, dy = b.y - bossY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Phase 1: Energy shield blocks
      if (bossPhase === 1 && energyShieldActive && !energyShieldVulnerable && dist < 90) {
        b.active = false; continue;
      }
      // Phase 2: Rotating shield
      if (bossPhase === 2 && shieldActive && dist < 90) {
        const bulletAngle = Math.atan2(dy, dx);
        const shieldFacing = shieldAngle + Math.PI;
        let angleDiff = bulletAngle - shieldFacing;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) < Math.PI / 3) { b.active = false; continue; }
      }

      if (dist < 70) {
        b.active = false;
        bossHP--;
        shotsHit++;
        k.shake(3);
        impactParticles(k, b.x, b.y, 6, [[255, 100, 0], [255, 136, 0], [255, 170, 0]]);
        checkPhaseTransitions();
        if (bossHP <= 0) { startVictory(); return; }
      }
    }
  }

  function checkHeavyBombBossCollisions() {
    for (const bomb of heavyBombs) {
      if (!bomb.active) continue;
      const dx = bomb.x - bossX, dy = bomb.y - bossY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Phase 1: Shield blocks
      if (bossPhase === 1 && energyShieldActive && !energyShieldVulnerable && dist < 90) {
        bomb.active = false; continue;
      }
      // Phase 2: Rotating shield
      if (bossPhase === 2 && shieldActive && dist < 90) {
        const bulletAngle = Math.atan2(dy, dx);
        const shieldFacing = shieldAngle + Math.PI;
        let angleDiff = bulletAngle - shieldFacing;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) < Math.PI / 3) { bomb.active = false; continue; }
      }

      if (dist < 75) {
        bomb.active = false;
        shotsHit++;
        k.shake(8);
        impactParticles(k, bomb.x, bomb.y, 10, [[255, 100, 0], [255, 136, 0], [255, 170, 0]]);
        for (let i = 0; i < HEAVY_BOMB_MULT; i++) {
          bossHP--;
          if (bossHP <= 0) break;
        }
        checkPhaseTransitions();
        if (bossHP <= 0) { startVictory(); return; }
      }
    }
  }

  function checkPhaseTransitions() {
    if (bossHP <= BOSS_BASE_HP * 0.6 && !phase2Triggered) {
      phase2Triggered = true;
      bossPhase = 2;
      energyShieldActive = false;
      energyShieldVulnerable = false;
      shieldActive = true;
      shieldAngle = 0;
      droneSpawnTimer = 0;
      areaBombTimer = 0;
      screenFlash(k, 100, 100, 255, 400, 0.5);
      bossPhaseTransition(k, 'SHIELD OVERLOAD', 255, 136, 0);
      instrText.text = 'Flank the rotating shield! | X: Bomb | SHIFT: Roll';
      samTimer = 0; spreadTimer = 0; homingTimer = 0; fanMissileTimer = 0;
    }
    if (bossHP <= BOSS_BASE_HP * 0.3 && !phase3Triggered) {
      phase3Triggered = true;
      bossPhase = 3;
      shieldActive = false;
      drones = [];
      areaBombs = [];
      screenFlash(k, 255, 50, 0, 400, 0.5);
      bossPhaseTransition(k, 'FINAL STAND', 255, 34, 34);
      instrText.text = 'DODGE THE LASER! | SHIFT: Roll | X: Bomb';
      samTimer = 0; spreadTimer = 0; homingTimer = 0; laserCooldown = 2;
      rapidShotTimer = 0;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PLAYER DAMAGE
  // ══════════════════════════════════════════════════════════════
  function damagePlayer() {
    playerHP--;
    damageTaken++;
    invulnTimer = INVULN_TIME;
    k.shake(6);
    screenFlash(k, 255, 0, 0, 200, 0.4);
    if (playerHP <= 0) { playerHP = 0; playerDeath(); }
  }

  function updateInvulnerability(dt) {
    if (invulnTimer > 0) invulnTimer -= dt;
  }

  function updateAntiMissileCooldown(dt) {
    if (antiMissileCooldown > 0) antiMissileCooldown -= dt;
    if (antiMissilePulseActive) {
      antiMissilePulseTimer += k.dt();
      if (antiMissilePulseTimer >= 0.4) antiMissilePulseActive = false;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // HUD UPDATE
  // ══════════════════════════════════════════════════════════════
  function updateHUDCommon() {
    hudArmor.text = `ARMOR: ${playerHP}/${PLAYER_MAX_HP}`;
    hudArmor.color = playerHP <= 1 ? k.rgb(255, 68, 68) : k.rgb(255, 255, 255);
    hudPulse.text = `PULSE: ${antiMissileCharges}/${ANTI_MISSILE_CHARGES}`;
    hudPulse.color = antiMissileCooldown > 0 ? k.rgb(102, 102, 102) : k.rgb(0, 255, 255);
    hudBombs.text = `BOMBS: ${heavyBombsRemaining}/${HEAVY_BOMB_MAX}`;
    hudBombs.color = heavyBombCooldown > 0 ? k.rgb(102, 102, 102) : (heavyBombsRemaining > 0 ? k.rgb(255, 136, 0) : k.rgb(68, 68, 68));
    hudBarrelRoll.text = barrelRollCooldown > 0 ? `ROLL: ${barrelRollCooldown.toFixed(1)}s` : 'ROLL: READY';
    hudBarrelRoll.color = barrelRollCooldown > 0 ? k.rgb(102, 102, 102) : k.rgb(0, 200, 0);
  }

  // ══════════════════════════════════════════════════════════════
  // VICTORY
  // ══════════════════════════════════════════════════════════════
  function startVictory() {
    if (phase === 'victory') return;
    phase = 'victory';
    bossHP = 0;
    deathTimer = 0;

    // Clear all projectiles
    playerBullets = []; bossBullets = []; samMissiles = [];
    homingMissiles = []; heavyBombs = []; drones = []; areaBombs = [];

    // Boss explosion
    screenFlash(k, 255, 255, 255, 800, 0.6);
    k.shake(15);

    // Spawn death explosion particles
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      deathParticles.push({
        x: bossX + (Math.random() - 0.5) * 60,
        y: bossY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1.5 + Math.random(), maxLife: 2,
        size: 5 + Math.random() * 15,
        color: [[255, 34, 0], [255, 100, 0], [255, 204, 0], [255, 255, 255]][Math.floor(Math.random() * 4)],
      });
    }

    showCenterMsg('SUPREME TURBAN - ELIMINATED', 255, 215, 0);

    // Save progress
    try {
      localStorage.setItem('superzion_level_progress', '6');
      localStorage.setItem('superzion_completed', 'true');
    } catch (e) { /* storage */ }

    // After 4 seconds, transition to victory scene
    k.wait(4, () => {
      k.go('victory');
    });
  }

  function updateVictory(dt) {
    deathTimer += dt;
    bossVisible = false;
    // Update death particles
    for (const p of deathParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vy += 40 * dt; // gravity
    }
    deathParticles = deathParticles.filter(p => p.life > 0);

    // Additional explosions
    if (deathTimer < 3 && Math.random() < dt * 5) {
      impactParticles(k, bossX + (Math.random() - 0.5) * 100, bossY + (Math.random() - 0.5) * 60, 6, [[255, 100, 0], [255, 200, 0]]);
      k.shake(3);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // DEFEAT
  // ══════════════════════════════════════════════════════════════
  function playerDeath() {
    if (phase === 'dead') return;
    phase = 'dead';
    screenFlash(k, 255, 0, 0, 500, 0.5);
    k.shake(12);

    k.wait(1, () => {
      k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.8), k.fixed(), k.z(500)]);
      k.add([
        k.text('MISSION FAILED', { size: 32, font: 'monospace' }),
        k.pos(W / 2, H * 0.35), k.anchor('center'), k.color(255, 68, 68), k.fixed(), k.z(501),
      ]);
      k.add([
        k.text('SUPREME TURBAN WINS', { size: 16, font: 'monospace' }),
        k.pos(W / 2, H * 0.45), k.anchor('center'), k.color(200, 200, 200), k.fixed(), k.z(501),
      ]);
      const promptObj = k.add([
        k.text('SPACE - RETRY | M - MENU', { size: 14, font: 'monospace' }),
        k.pos(W / 2, H * 0.6), k.anchor('center'), k.color(200, 200, 200), k.fixed(), k.z(501),
      ]);
      let bt = 0;
      promptObj.onUpdate(() => { bt += k.dt(); promptObj.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3; });

      k.onKeyPress('space', () => { if (phase === 'dead') k.go('level6-boss'); });
      k.onKeyPress('enter', () => { if (phase === 'dead') k.go('level6-boss'); });
      k.onKeyPress('m', () => { if (phase === 'dead') k.go('menu'); });
    });
  }

  // ══════════════════════════════════════════════════════════════
  // DRAWING (onDraw)
  // ══════════════════════════════════════════════════════════════
  k.onDraw(() => {
    // ── Dawn sky gradient background ──
    for (let y = 0; y < H; y += 4) {
      const t = y / H;
      // Warm golden/pink/purple gradient (Beirut morning)
      const r = Math.floor(20 + t * 50 + (bossPhase === 3 ? 30 : 0));
      const g = Math.floor(14 + t * 30);
      const b = Math.floor(40 - t * 20 + (bossPhase < 3 ? 10 : 0));
      k.drawRect({ pos: k.vec2(0, y), width: W, height: 4, color: k.rgb(r, g, b) });
    }

    // Sun glow (right side, morning)
    k.drawCircle({ pos: k.vec2(W - 80, H * 0.3), radius: 60, color: k.rgb(255, 221, 136), opacity: 0.08 });
    k.drawCircle({ pos: k.vec2(W - 80, H * 0.3), radius: 120, color: k.rgb(255, 204, 102), opacity: 0.04 });

    // ── City silhouette (parallax) ──
    const cx = -cityOffset % W;
    drawCitySilhouette(cx);
    drawCitySilhouette(cx + W);

    // ── Ground (road) ──
    k.drawRect({ pos: k.vec2(0, H - 70), width: W, height: 70, color: k.rgb(40, 35, 30) });
    // Road line
    k.drawLine({ p1: k.vec2(0, H - 40), p2: k.vec2(W, H - 40), color: k.rgb(80, 80, 70), opacity: 0.4, width: 1.5 });
    // Road dashes
    const gx = -groundOffset % 25;
    for (let x = gx; x < W; x += 25) {
      k.drawLine({ p1: k.vec2(x, H - 40), p2: k.vec2(x + 12, H - 40), color: k.rgb(120, 120, 110), opacity: 0.3, width: 1 });
    }

    // ── Boss fortress ──
    if (bossVisible) {
      // Boss flash telegraph
      const flashTint = (bossFlashTimer > 0 && Math.sin(bossFlashTimer * 20) > 0);

      // Fortress body
      const br = flashTint ? 255 : 58;
      const bg = flashTint ? 34 : 58;
      const bb = flashTint ? 34 : 68;
      k.drawRect({ pos: k.vec2(bossX - 60, bossY - 40), width: 120, height: 80, color: k.rgb(br, bg, bb) });
      // Turrets
      k.drawRect({ pos: k.vec2(bossX - 55, bossY - 48), width: 20, height: 12, color: k.rgb(68, 68, 78) });
      k.drawRect({ pos: k.vec2(bossX + 35, bossY - 48), width: 20, height: 12, color: k.rgb(68, 68, 78) });
      // Central dome
      k.drawCircle({ pos: k.vec2(bossX, bossY - 35), radius: 18, color: k.rgb(78, 78, 90) });
      // Red gem
      k.drawCircle({ pos: k.vec2(bossX, bossY - 38), radius: 5, color: k.rgb(255, 34, 34) });
      k.drawCircle({ pos: k.vec2(bossX, bossY - 39), radius: 2.5, color: k.rgb(255, 102, 68) });
      // Gun barrels
      k.drawRect({ pos: k.vec2(bossX - 68, bossY - 32), width: 10, height: 3, color: k.rgb(50, 50, 50) });
      k.drawRect({ pos: k.vec2(bossX + 58, bossY - 32), width: 10, height: 3, color: k.rgb(50, 50, 50) });

      // Smoke from damaged boss
      if (bossHP < BOSS_BASE_HP * 0.6) {
        const smokeCount = bossHP < BOSS_BASE_HP * 0.3 ? 5 : 3;
        const time = k.time();
        for (let i = 0; i < smokeCount; i++) {
          const sx = bossX + Math.sin(time * 2 + i * 1.5) * 30;
          const sy = bossY - 50 - Math.sin(time * 1.5 + i) * 20;
          k.drawCircle({ pos: k.vec2(sx, sy), radius: 6 + i * 2, color: k.rgb(80, 80, 80), opacity: 0.15 });
        }
      }

      // ── Energy shield (Phase 1) ──
      if (bossPhase === 1 && energyShieldActive && !energyShieldVulnerable) {
        const flickering = energyShieldFlickerTimer > 0;
        const sAlpha = flickering ? (Math.sin(energyShieldFlickerTimer * 30) > 0 ? 0.2 : 0.05) : 0.2;
        k.drawCircle({ pos: k.vec2(bossX, bossY), radius: 80, color: k.rgb(0, 180, 255), opacity: sAlpha });
        k.drawCircle({ pos: k.vec2(bossX, bossY), radius: 76, color: k.rgb(0, 220, 255), opacity: sAlpha * 0.5 });
        // Energy crackling lines
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + k.time() * 2;
          const x1 = bossX + Math.cos(a) * 50;
          const y1 = bossY + Math.sin(a) * 50;
          const x2 = bossX + Math.cos(a + 0.3) * 75;
          const y2 = bossY + Math.sin(a + 0.3) * 75;
          k.drawLine({ p1: k.vec2(x1, y1), p2: k.vec2(x2, y2), color: k.rgb(100, 220, 255), opacity: sAlpha * 1.5, width: 1 });
        }
      }

      // ── Rotating shield (Phase 2) ──
      if (bossPhase === 2 && shieldActive) {
        // Draw 120-degree arc shield
        const arcStart = shieldAngle;
        const arcExtent = Math.PI * 2 / 3; // 120 degrees
        for (let i = 0; i < 20; i++) {
          const a = arcStart + (i / 20) * arcExtent;
          const x1 = bossX + Math.cos(a) * 78;
          const y1 = bossY + Math.sin(a) * 78;
          const a2 = arcStart + ((i + 1) / 20) * arcExtent;
          const x2 = bossX + Math.cos(a2) * 78;
          const y2 = bossY + Math.sin(a2) * 78;
          k.drawLine({ p1: k.vec2(x1, y1), p2: k.vec2(x2, y2), color: k.rgb(0, 180, 255), opacity: 0.6, width: 4 });
        }
      }

      // Boss HP bar
      if (bossHPBarVisible) {
        const barW = 400;
        const barX = W / 2 - barW / 2;
        const barY = 12;
        k.drawRect({ pos: k.vec2(barX, barY), width: barW, height: 14, color: k.rgb(51, 51, 51) });
        const hpRatio = Math.max(0, bossHP / BOSS_BASE_HP);
        let barR = 68, barG = 255, barB = 68;
        if (hpRatio <= 0.3) { barR = 255; barG = 68; barB = 68; }
        else if (hpRatio <= 0.6) { barR = 255; barG = 204; barB = 0; }
        k.drawRect({ pos: k.vec2(barX + 2, barY + 2), width: (barW - 4) * hpRatio, height: 10, color: k.rgb(barR, barG, barB) });
      }
    }

    // ── Laser beam (Phase 3) ──
    if (bossPhase === 3 && laserSweepActive) {
      if (laserChargeTimer > 0) {
        // Charge glow on boss
        const chargePct = 1 - (laserChargeTimer / 1.5);
        k.drawCircle({ pos: k.vec2(bossX, bossY), radius: 30 + chargePct * 20, color: k.rgb(255, 0, 0), opacity: 0.1 + chargePct * 0.2 });
      } else if (laserChargeWarningLine > 0) {
        // Warning line (dashed red)
        const gapTop = laserGapY - 40;
        const gapBottom = laserGapY + 40;
        for (let x = 0; x < W; x += 20) {
          if (x % 40 < 20) {
            k.drawLine({ p1: k.vec2(x, laserSweepY), p2: k.vec2(x + 10, laserSweepY), color: k.rgb(255, 0, 0), opacity: 0.4, width: 2 });
          }
        }
        // Gap indicator
        k.drawRect({ pos: k.vec2(0, gapTop), width: 8, height: 80, color: k.rgb(0, 255, 0), opacity: 0.3 });
      } else if (laserFiring) {
        // Full laser beam with gap
        const gapTop = laserGapY - 40;
        const gapBottom = laserGapY + 40;
        // Beam above gap
        if (gapTop > 0) {
          k.drawRect({ pos: k.vec2(0, laserSweepY - 8), width: W, height: Math.min(16, gapTop), color: k.rgb(255, 30, 0), opacity: 0.7 });
          k.drawRect({ pos: k.vec2(0, laserSweepY - 16), width: W, height: 32, color: k.rgb(255, 0, 0), opacity: 0.15 });
        }
        // Beam below gap
        if (gapBottom < H) {
          k.drawRect({ pos: k.vec2(0, laserSweepY - 8), width: W, height: 16, color: k.rgb(255, 30, 0), opacity: 0.7 });
        }
        // Gap indicator on left edge
        k.drawRect({ pos: k.vec2(0, gapTop), width: 6, height: 80, color: k.rgb(0, 255, 0), opacity: 0.5 });
      }
    }

    // ── Player bullets ──
    for (const b of playerBullets) {
      if (!b.active) continue;
      k.drawRect({ pos: k.vec2(b.x - 3, b.y - 1.5), width: 6, height: 3, color: k.rgb(255, 221, 68), opacity: 0.9 });
    }

    // ── Heavy bombs ──
    for (const bomb of heavyBombs) {
      if (!bomb.active) continue;
      k.drawCircle({ pos: k.vec2(bomb.x, bomb.y), radius: 8, color: k.rgb(255, 68, 0), opacity: 0.5 });
      k.drawCircle({ pos: k.vec2(bomb.x, bomb.y), radius: 5, color: k.rgb(255, 102, 34), opacity: 0.9 });
      k.drawCircle({ pos: k.vec2(bomb.x, bomb.y), radius: 2.5, color: k.rgb(255, 204, 102), opacity: 1 });
    }

    // ── SAM missiles ──
    for (const m of samMissiles) {
      if (!m.active) continue;
      k.drawRect({ pos: k.vec2(m.x - 4, m.y - 2), width: 8, height: 4, color: k.rgb(221, 50, 50), opacity: 1 });
      k.drawCircle({ pos: k.vec2(m.x + 5, m.y), radius: 3, color: k.rgb(255, 136, 0), opacity: 0.7 });
    }

    // ── Boss bullets ──
    for (const b of bossBullets) {
      if (!b.active) continue;
      k.drawCircle({ pos: k.vec2(b.x, b.y), radius: 3, color: k.rgb(255, 68, 34) });
      k.drawCircle({ pos: k.vec2(b.x, b.y), radius: 1.5, color: k.rgb(255, 136, 68) });
    }

    // ── Homing missiles ──
    for (const m of homingMissiles) {
      if (!m.active) continue;
      k.drawCircle({ pos: k.vec2(m.x, m.y), radius: 5, color: k.rgb(255, 34, 34) });
      k.drawCircle({ pos: k.vec2(m.x, m.y), radius: 8, color: k.rgb(255, 100, 0), opacity: 0.4 });
    }

    // ── Drones (Phase 2) ──
    for (const d of drones) {
      if (!d.active) continue;
      k.drawRect({ pos: k.vec2(d.x - 8, d.y - 4), width: 16, height: 8, color: k.rgb(200, 40, 40) });
      k.drawCircle({ pos: k.vec2(d.x, d.y), radius: 3, color: k.rgb(255, 80, 80) });
    }

    // ── Area bombs (Phase 2) ──
    for (const bomb of areaBombs) {
      if (!bomb.active) continue;
      if (!bomb.detonated) {
        // Warning circle (pulsing red)
        const pct = 1 - bomb.warningTimer;
        const pulseA = 0.15 + Math.sin(pct * 20) * 0.1;
        k.drawCircle({ pos: k.vec2(bomb.x, bomb.y), radius: bomb.radius * pct, color: k.rgb(255, 0, 0), opacity: pulseA });
        // Center crosshair
        k.drawLine({ p1: k.vec2(bomb.x - 8, bomb.y), p2: k.vec2(bomb.x + 8, bomb.y), color: k.rgb(255, 0, 0), opacity: 0.5, width: 1 });
        k.drawLine({ p1: k.vec2(bomb.x, bomb.y - 8), p2: k.vec2(bomb.x, bomb.y + 8), color: k.rgb(255, 0, 0), opacity: 0.5, width: 1 });
      } else {
        // Explosion
        const t = 1 - (bomb.explosionTimer / 0.4);
        k.drawCircle({ pos: k.vec2(bomb.x, bomb.y), radius: bomb.radius * t, color: k.rgb(255, 100, 0), opacity: 0.4 * (1 - t) });
        k.drawCircle({ pos: k.vec2(bomb.x, bomb.y), radius: bomb.radius * t * 0.5, color: k.rgb(255, 200, 0), opacity: 0.6 * (1 - t) });
      }
    }

    // ── Player F-16 ──
    if (phase !== 'dead') {
      const playerAlpha = (invulnTimer > 0 && !barrelRollActive) ? (Math.sin(Date.now() * 0.02) > 0 ? 1 : 0.3) :
        barrelRollActive ? (0.5 + Math.sin(barrelRollAngle * 0.1) * 0.3) : 1;

      // Simple F-16 shape drawn procedurally
      const px = playerX, py = playerY;
      // Fuselage
      k.drawRect({ pos: k.vec2(px - 18, py - 3), width: 34, height: 6, color: k.rgb(122, 122, 138), opacity: playerAlpha });
      // Nose
      k.drawRect({ pos: k.vec2(px + 16, py - 2), width: 8, height: 4, color: k.rgb(154, 154, 170), opacity: playerAlpha });
      // Wings (triangles approximated with lines)
      k.drawLine({ p1: k.vec2(px - 6, py - 3), p2: k.vec2(px + 6, py - 10), color: k.rgb(138, 138, 154), opacity: playerAlpha, width: 3 });
      k.drawLine({ p1: k.vec2(px - 6, py + 3), p2: k.vec2(px + 6, py + 10), color: k.rgb(138, 138, 154), opacity: playerAlpha, width: 3 });
      // Tail
      k.drawRect({ pos: k.vec2(px - 22, py - 6), width: 6, height: 12, color: k.rgb(106, 106, 122), opacity: playerAlpha });
      // Cockpit
      k.drawRect({ pos: k.vec2(px + 10, py - 2), width: 6, height: 4, color: k.rgb(68, 136, 204), opacity: playerAlpha });
      // Engine glow
      k.drawRect({ pos: k.vec2(px - 24, py - 2), width: 4, height: 4, color: k.rgb(255, 170, 68), opacity: playerAlpha });
      k.drawRect({ pos: k.vec2(px - 26, py - 1), width: 3, height: 2, color: k.rgb(255, 102, 34), opacity: playerAlpha * 0.8 });
    }

    // ── Anti-missile pulse visual ──
    if (antiMissilePulseActive) {
      const t = antiMissilePulseTimer / 0.4;
      const radius = ANTI_MISSILE_RADIUS * t;
      const alpha = 1 - t;
      k.drawCircle({ pos: k.vec2(antiMissilePulseX, antiMissilePulseY), radius: radius, color: k.rgb(0, 255, 255), opacity: alpha * 0.3 });
      k.drawCircle({ pos: k.vec2(antiMissilePulseX, antiMissilePulseY), radius: radius * 0.8, color: k.rgb(0, 255, 255), opacity: alpha * 0.15 });
    }

    // ── Death particles ──
    for (const p of deathParticles) {
      if (p.life <= 0) continue;
      const alpha = p.life / p.maxLife;
      k.drawCircle({ pos: k.vec2(p.x, p.y), radius: p.size * alpha, color: k.rgb(p.color[0], p.color[1], p.color[2]), opacity: alpha });
    }

    // ── Directional threat indicators ──
    drawThreatIndicators();

    // ── Phase overlay tints ──
    if (bossPhase === 2) {
      const pulseA = 0.03 + Math.sin(k.time() * 2) * 0.01;
      k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(255, 170, 0), opacity: pulseA });
    }
    if (bossPhase === 3) {
      const pulseA = 0.06 + Math.sin(k.time() * 3) * 0.02;
      k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(255, 0, 0), opacity: pulseA });
      // Edge glow bars
      k.drawRect({ pos: k.vec2(0, 0), width: 4, height: H, color: k.rgb(255, 0, 0), opacity: 0.2 + Math.sin(k.time() * 4) * 0.1 });
      k.drawRect({ pos: k.vec2(W - 4, 0), width: 4, height: H, color: k.rgb(255, 0, 0), opacity: 0.2 + Math.sin(k.time() * 4) * 0.1 });
      // Baseline screen shake
      if (Math.random() < 0.02) k.shake(1);
    }

    // ── Center message ──
    if (centerMsgAlpha > 0) {
      k.drawText({
        text: centerMsgText, pos: k.vec2(W / 2, H / 2 - 60),
        size: 28, font: 'monospace',
        color: k.rgb(centerMsgColor[0], centerMsgColor[1], centerMsgColor[2]),
        anchor: 'center', opacity: centerMsgAlpha,
      });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // DRAWING HELPERS
  // ══════════════════════════════════════════════════════════════
  function drawCitySilhouette(offsetX) {
    // Building silhouettes
    const buildings = [
      { x: 50, w: 60, h: 120 }, { x: 130, w: 45, h: 90 }, { x: 200, w: 70, h: 150 },
      { x: 300, w: 50, h: 100 }, { x: 380, w: 55, h: 130 }, { x: 460, w: 40, h: 80 },
      { x: 520, w: 65, h: 140 }, { x: 610, w: 50, h: 110 }, { x: 690, w: 60, h: 95 },
      { x: 770, w: 55, h: 125 }, { x: 850, w: 45, h: 85 }, { x: 910, w: 50, h: 105 },
    ];
    for (const b of buildings) {
      const bx = b.x + offsetX;
      if (bx + b.w < 0 || bx > W) continue;
      const by = H - 70 - b.h;
      k.drawRect({ pos: k.vec2(bx, by), width: b.w, height: b.h, color: k.rgb(30, 30, 40), opacity: 0.3 });
      // Windows (small dots)
      for (let wy = by + 10; wy + 8 < H - 75; wy += 15) {
        for (let wx = bx + 6; wx + 5 < bx + b.w - 3; wx += 12) {
          const hash = (Math.floor(wx) * 7 + Math.floor(wy) * 13 + Math.floor(b.x)) % 10;
          if (hash < 4) {
            k.drawRect({ pos: k.vec2(wx, wy), width: 4, height: 5, color: k.rgb(255, 238, 136), opacity: 0.1 });
          }
        }
      }
    }
    // Minarets
    const minarets = [{ x: 170, h: 60 }, { x: 430, h: 50 }, { x: 710, h: 55 }];
    for (const m of minarets) {
      const mx = m.x + offsetX;
      if (mx < 0 || mx > W) continue;
      const my = H - 70 - m.h;
      k.drawRect({ pos: k.vec2(mx - 2, my), width: 4, height: m.h, color: k.rgb(50, 50, 60), opacity: 0.25 });
    }
  }

  function drawThreatIndicators() {
    // Pulsing red arrows at screen edges for off-screen missiles
    const threats = [...samMissiles, ...homingMissiles].filter(m => m.active);
    for (const t of threats) {
      if (t.x < 10 || t.x > W - 10 || t.y < 10 || t.y > H - 10) continue;
      // Only show for missiles approaching from off-screen
      if (t.x > W - 30 && t.vx < 0) {
        const iy = clamp(t.y, 20, H - 20);
        const pulse = 0.3 + Math.abs(Math.sin(k.time() * 6)) * 0.5;
        k.drawRect({ pos: k.vec2(W - 12, iy - 4), width: 8, height: 8, color: k.rgb(255, 0, 0), opacity: pulse });
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // UTILITY
  // ══════════════════════════════════════════════════════════════
  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
}
