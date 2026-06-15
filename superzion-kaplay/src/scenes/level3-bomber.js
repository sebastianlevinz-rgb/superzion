// ═══════════════════════════════════════════════════════════════
// Level 3: Operation Deep Strike — F-15 Aerial Bombing
// 6-phase side-scroller: Takeoff -> Sea Flight -> Coast ->
//   Bombing -> Return -> Landing + Victory/Defeat
// Ported from BomberScene.js (Phaser) to Kaplay
// ═══════════════════════════════════════════════════════════════

import { W, H } from '../constants.js';
import { generateAerialTextures } from '../systems/texture-factory.js';
import { screenFlash, impactParticles } from '../systems/game-juice.js';

// ── Constants ──
const GROUND_Y = 420;
const DECK_Y = 395;
const GRAVITY = 480;        // bomb gravity px/s^2
const JET_SPEED = 440;      // base horizontal scroll speed
const BOMB_TOTAL = 8;
const BUNKER_LAYERS = 5;
const BUNKER_X = 480;
const BUNKER_W = 200;
const BUNKER_TOP_Y = 340;
const LAYER_H = 20;

// Distance thresholds
const FLIGHT_COAST_DIST = 2500;
const FLIGHT_MTN_DIST = 4200;
const FLIGHT_TARGET_DIST = 6000;
const RETURN_COAST_DIST = 1100;
const RETURN_SEA_DIST = 2000;
const RETURN_CARRIER_DIST = 3100;

// SAM & defense
const SAM_TURN_RATE = 0.5;
const SAM_LIFETIME = 4.0;
const SAM_SPEED = 182;
const SAM_MAX = 2;
const SAM_WARNING = 1.5;
const CHAFF_TOTAL = 3;
const FLAK_INTERVAL = 1.8;

// Jet physics
const JET_GRAVITY = 30;
const CLIMB_RATE = -180;
const DIVE_RATE = 180;
const VERT_LERP = 3.0;
const VERT_DECAY = 2.0;
const TILT_MAX = 20;         // degrees
const TILT_LERP_SPEED = 6;
const LANDING_CRASH_VY = 150;

// Bombing movement
const HORIZ_SPEED = 200;

// ── Utility ──
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dist(x1, y1, x2, y2) {
  const dx = x1 - x2, dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}
function degToRad(d) { return d * Math.PI / 180; }

// ═════════════════════════════════════════════════════════════
// SCENE
// ═════════════════════════════════════════════════════════════

export function level3BomberScene(k) {
  generateAerialTextures(k);

  // ── State ──
  let phase = 'takeoff'; // takeoff, launching, flight, bombing, explosion, returning, landing, landed, victory, dead
  let phaseTimer = 0;
  let armor = 3;
  let bombs = BOMB_TOTAL;
  let bombsUsed = 0;
  let bunkerHP = BUNKER_LAYERS;
  let bunkerLayerAlive = new Array(BUNKER_LAYERS).fill(true);
  let chaff = CHAFF_TOTAL;
  let chaffCooldown = 0;
  let bombCooldown = 0;
  let jetX = 100, jetY = DECK_Y;
  let jetVX = 0, jetVY = 0;
  let facingRight = true;
  let scrollX = 0;
  let flightDistance = 0;
  let returnDistance = 0;
  let flightTerrainStage = 0;
  let returnTerrainStage = 0;
  let missionSuccess = false;
  let landingQuality = '';
  let landingRetries = 0;
  let crashed = false;
  let startTime = Date.now();

  // Object pools
  let bombObjects = [];     // { x, y, vx, vy }
  let missiles = [];        // { x, y, angle, speed, life, isBoss }
  let explosions = [];       // { x, y, life, radius }
  let engineParticles = [];  // { x, y, life, vx, vy }
  let chaffParticles = [];   // { x, y, vx, vy, life }
  let turretBullets = [];    // { x, y, vx, vy }

  // SAM wave pattern
  let samWaveIndex = 0;
  const samWavePatterns = [
    { side: 'left', delay: 2.0 },
    { side: 'left', delay: 0.5 },
    { side: 'right', delay: 1.5 },
    { side: 'center', delay: 2.0 },
    { side: 'right', delay: 1.5 },
    { side: 'right', delay: 0.5 },
    { side: 'left', delay: 2.0 },
    { side: 'center', delay: 1.5 },
  ];
  let samWaveTimer = 0;

  // Flak
  let flakTimer = 0;
  let flakPatternIndex = 0;

  // Boss state
  let bossMissileTimer = 0;
  let bossBurstTimer = 0;
  let bossBurstCooldown = 10;
  let bossFireRate = 3.5;
  let bossTelegraphing = false;
  let bossBurstTelegraphing = false;

  // Takeoff sub-state
  let takeoffAirborne = false;
  let pullUpHintShown = false;

  // Landing sub-state
  let altBeepTimer = 0;

  // Warning indicators (visual tracking)
  let samWarnings = [];      // { x, timer }
  let flakWarnings = [];     // { x, y, timer }

  // ── HUD ──
  const hudTitle = k.add([
    k.text('OPERATION DEEP STRIKE', { size: 11, font: 'monospace' }),
    k.pos(15, 12), k.color(255, 215, 0), k.fixed(), k.z(30),
  ]);
  const hudArmor = k.add([
    k.text('ARMOR: 3/3', { size: 12, font: 'monospace' }),
    k.pos(15, 30), k.color(255, 255, 255), k.fixed(), k.z(30),
  ]);
  const hudBombs = k.add([
    k.text('BOMBS: 8', { size: 12, font: 'monospace' }),
    k.pos(15, 46), k.color(255, 255, 255), k.fixed(), k.z(30),
  ]);
  const hudChaff = k.add([
    k.text(`CHAFF: ${CHAFF_TOTAL} [C]`, { size: 12, font: 'monospace' }),
    k.pos(150, 46), k.color(136, 204, 255), k.fixed(), k.z(30),
  ]);
  const hudAlt = k.add([
    k.text('ALT: 0m', { size: 12, font: 'monospace' }),
    k.pos(W - 15, 12), k.anchor('topright'), k.color(170, 170, 170), k.fixed(), k.z(30),
  ]);
  const hudSpeed = k.add([
    k.text('SPD: 0 kts', { size: 12, font: 'monospace' }),
    k.pos(W - 15, 28), k.anchor('topright'), k.color(170, 170, 170), k.fixed(), k.z(30),
  ]);
  const hudDist = k.add([
    k.text('', { size: 11, font: 'monospace' }),
    k.pos(W / 2, 12), k.anchor('center'), k.color(0, 229, 255), k.fixed(), k.z(30),
  ]);
  // Instruction bar
  const instrBg = k.add([
    k.rect(W, 28), k.pos(0, H - 49), k.color(0, 0, 0), k.opacity(0.7), k.fixed(), k.z(29),
  ]);
  const instrText = k.add([
    k.text('', { size: 14, font: 'monospace', width: W - 40 }),
    k.pos(W / 2, H - 35), k.anchor('center'), k.color(255, 255, 255), k.fixed(), k.z(30),
  ]);

  function updateHUD() {
    const alt = Math.max(0, Math.round((GROUND_Y - jetY) / GROUND_Y * 3000));
    const effectiveSpeed = (phase === 'flight' || phase === 'returning') ? JET_SPEED : Math.abs(jetVX);
    const spd = Math.round(effectiveSpeed * 1.8);
    hudAlt.text = `ALT: ${alt}m`;
    hudSpeed.text = `SPD: ${spd} kts`;
    hudArmor.text = `ARMOR: ${Math.max(0, armor)}/3`;
    hudArmor.color = armor <= 1 ? k.rgb(255, 68, 68) : k.rgb(255, 255, 255);
    hudBombs.text = `BOMBS: ${bombs}`;
    hudChaff.text = `CHAFF: ${chaff} [C]`;
    hudChaff.color = chaff <= 1 ? k.rgb(255, 136, 68) : k.rgb(136, 204, 255);
  }

  // ═════════════════════════════════════════════════════════════
  // DAMAGE & EXPLOSIONS
  // ═════════════════════════════════════════════════════════════

  function takeDamage() {
    if (crashed || phase === 'dead' || phase === 'victory') return;
    armor--;
    k.shake(8);
    screenFlash(k, 255, 0, 0, 300, 0.3);

    if (armor <= 0) {
      phase = 'dead';
      k.wait(0.8, () => showVictory());
    }
  }

  function addExplosion(x, y, radius) {
    explosions.push({ x, y, life: 0.5, radius });
    if (radius > 20) k.shake(6);
    screenFlash(k, 255, 102, 0, 60, 0.15);
    impactParticles(k, x, y, Math.min(12, Math.max(6, Math.floor(radius / 3))));
  }

  // ═════════════════════════════════════════════════════════════
  // MISSILE SYSTEM (SAMs + Boss)
  // ═════════════════════════════════════════════════════════════

  function spawnMissile(x, y, isBoss) {
    if (!isBoss) {
      // Warning first
      samWarnings.push({ x, timer: SAM_WARNING });
    }

    const spawnFn = () => {
      if (missiles.length >= (isBoss ? 4 : SAM_MAX)) return;
      const dx = jetX - x, dy = jetY - y;
      const angle = Math.atan2(dy, dx);
      const speed = isBoss ? SAM_SPEED + 28 : SAM_SPEED;
      missiles.push({
        x, y, angle, speed,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: isBoss ? SAM_LIFETIME + 1 : SAM_LIFETIME,
        isBoss: !!isBoss,
      });
    };

    if (isBoss) {
      spawnFn();
    } else {
      k.wait(SAM_WARNING, spawnFn);
    }
  }

  function spawnBossMissileFan(angleOffset) {
    if (missiles.length >= 4) return;
    const bx = BUNKER_X, by = BUNKER_TOP_Y + 20;
    const dx = jetX - bx, dy = jetY - by;
    const angle = Math.atan2(dy, dx) + angleOffset;
    const speed = SAM_SPEED + 28;
    missiles.push({
      x: bx, y: by, angle, speed,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: SAM_LIFETIME + 1,
      isBoss: true,
    });
  }

  function updateMissiles(dt) {
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      m.life -= dt;

      if (m.life <= 0) {
        addExplosion(m.x, m.y, 15);
        missiles.splice(i, 1);
        continue;
      }

      // Homing: turn toward jet with limited turn rate
      const tdx = jetX - m.x, tdy = jetY - m.y;
      const targetAngle = Math.atan2(tdy, tdx);
      let angleDiff = targetAngle - m.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      const maxTurn = SAM_TURN_RATE * dt;
      m.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), maxTurn);
      m.vx = Math.cos(m.angle) * m.speed;
      m.vy = Math.sin(m.angle) * m.speed;

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // Hit detection
      if (dist(m.x, m.y, jetX, jetY) < 18) {
        takeDamage();
        addExplosion(m.x, m.y, 18);
        missiles.splice(i, 1);
        continue;
      }

      // Off screen
      if (m.y < -60 || m.y > H + 60 || m.x < -60 || m.x > W + 60) {
        missiles.splice(i, 1);
      }
    }
  }

  // ── Flak ──
  function spawnFlak() {
    const idx = flakPatternIndex++;
    const fx = 100 + ((idx * 137 + 80) % (W - 200));
    const fy = 165 + Math.sin(idx * 0.8) * 85;

    flakWarnings.push({ x: fx, y: fy, timer: 1.0 });

    k.wait(1.0, () => {
      // Damage check
      if (dist(fx, fy, jetX, jetY) < 40) {
        takeDamage();
      }
      addExplosion(fx, fy, 20);
    });
  }

  // ── Chaff ──
  function deployChaff() {
    if (chaff <= 0 || chaffCooldown > 0) return;
    chaff--;
    chaffCooldown = 5.0;

    // Spawn chaff particles
    for (let i = 0; i < 12; i++) {
      chaffParticles.push({
        x: jetX + (Math.random() - 0.5) * 20,
        y: jetY + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200,
        life: 1.2,
      });
    }

    // Divert nearest missile within 120px
    let nearest = null, nearDist = Infinity;
    for (const m of missiles) {
      const d = dist(m.x, m.y, jetX, jetY);
      if (d < nearDist) { nearDist = d; nearest = m; }
    }
    if (nearest && nearDist < 120) {
      nearest.life = Math.min(nearest.life, 0.6);
      const dx = jetX - nearest.x, dy = jetY - nearest.y;
      nearest.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
    }
  }

  function updateChaff(dt) {
    if (chaffCooldown > 0) chaffCooldown -= dt;
    for (let i = chaffParticles.length - 1; i >= 0; i--) {
      const p = chaffParticles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      if (p.life <= 0) chaffParticles.splice(i, 1);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // BOMB SYSTEM
  // ═════════════════════════════════════════════════════════════

  function dropBomb() {
    if (bombs <= 0 || bombCooldown > 0) return;
    bombs--;
    bombsUsed++;
    bombCooldown = 0.35;
    bombObjects.push({
      x: jetX, y: jetY + 20,
      vx: jetVX * 0.5, vy: 0,
    });
  }

  function updateBombs(dt) {
    for (let i = bombObjects.length - 1; i >= 0; i--) {
      const b = bombObjects[i];
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Hit bunker or ground
      if (b.y >= BUNKER_TOP_Y) {
        const bx = Math.abs(b.x - BUNKER_X);
        if (bx < BUNKER_W / 2 && b.y < BUNKER_TOP_Y + BUNKER_LAYERS * LAYER_H) {
          // Hit bunker - destroy topmost alive layer
          const layerIdx = BUNKER_LAYERS - bunkerHP;
          if (layerIdx < BUNKER_LAYERS && bunkerLayerAlive[layerIdx]) {
            bunkerLayerAlive[layerIdx] = false;
            bunkerHP--;
            k.shake(6);
            addExplosion(b.x, BUNKER_TOP_Y + layerIdx * LAYER_H + 10, 35);

            // Progressive difficulty: boss fires faster as bunker breaks
            if (BUNKER_LAYERS - bunkerHP >= 3) {
              bossFireRate = 2;
              bossBurstCooldown = 7;
            }
            if (BUNKER_LAYERS - bunkerHP >= 4) {
              bossFireRate = 1.5;
              bossBurstCooldown = 5;
            }
          }
          bombObjects.splice(i, 1);
          continue;
        } else if (b.y >= GROUND_Y) {
          addExplosion(b.x, GROUND_Y - 5, 12);
          bombObjects.splice(i, 1);
          continue;
        }
        continue; // still falling through bunker zone
      }

      // Off screen
      if (b.x < -20 || b.x > W + 20 || b.y > H + 20) {
        bombObjects.splice(i, 1);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // ENGINE TRAIL
  // ═════════════════════════════════════════════════════════════

  function updateEngineTrail(dt) {
    if (Math.random() < 0.4) {
      const ox = facingRight ? -40 : 40;
      engineParticles.push({
        x: jetX + ox + (Math.random() - 0.5) * 4,
        y: jetY + (Math.random() - 0.5) * 6,
        life: 0.3 + Math.random() * 0.2,
        r: 2 + Math.random() * 2,
      });
    }
    for (let i = engineParticles.length - 1; i >= 0; i--) {
      engineParticles[i].life -= dt;
      if (engineParticles[i].life <= 0) engineParticles.splice(i, 1);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // JET PHYSICS (shared by flight/bombing/return/landing)
  // ═════════════════════════════════════════════════════════════

  function applyJetVertical(dt, climbMult, diveMult) {
    const cm = climbMult || 1;
    const dm = diveMult || 1;
    if (k.isKeyDown('up') || k.isKeyDown('w')) {
      jetVY += (CLIMB_RATE * cm - jetVY) * VERT_LERP * dt;
    } else if (k.isKeyDown('down') || k.isKeyDown('s')) {
      jetVY += (DIVE_RATE * dm - jetVY) * VERT_LERP * dt;
    } else {
      jetVY += (0 - jetVY) * VERT_DECAY * dt;
      jetVY += JET_GRAVITY * dt;
    }
    jetVY = clamp(jetVY, CLIMB_RATE * 1.2, DIVE_RATE * 1.2);
    jetY += jetVY * dt;
  }

  function applyJetHorizontal(dt) {
    if (k.isKeyDown('right') || k.isKeyDown('d')) {
      jetVX += (HORIZ_SPEED - jetVX) * 4 * dt;
    } else if (k.isKeyDown('left') || k.isKeyDown('a')) {
      jetVX += (-HORIZ_SPEED - jetVX) * 4 * dt;
    } else {
      jetVX += (0 - jetVX) * 3 * dt;
    }
    jetX += jetVX * dt;
    jetX = clamp(jetX, 60, W - 60);
  }

  function crashJet(reason) {
    if (crashed) return;
    crashed = true;
    phase = 'dead';
    k.shake(20);
    screenFlash(k, 255, 68, 0, 600, 0.5);
    addExplosion(jetX, jetY, 40);
    k.wait(3, () => showVictory());
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 1 — TAKEOFF
  // ═════════════════════════════════════════════════════════════

  function startTakeoff() {
    phase = 'takeoff';
    jetX = 100;
    jetY = DECK_Y;
    jetVX = 0;
    jetVY = 0;
    facingRight = true;
    takeoffAirborne = false;
    pullUpHintShown = false;
    instrText.text = 'Engines spooling up... get ready to PULL UP!';
    instrText.color = k.rgb(170, 170, 170);
  }

  function updateTakeoff(dt) {
    const takeoffAccel = 160;
    jetVX = Math.min(JET_SPEED, jetVX + takeoffAccel * dt);
    jetX += jetVX * dt;

    const edgeX = 480;

    if (!takeoffAirborne) {
      jetY = DECK_Y;
      const speedPct = Math.round((jetVX / JET_SPEED) * 100);

      if (jetVX >= JET_SPEED / 2 && !pullUpHintShown) {
        pullUpHintShown = true;
        instrText.text = 'PULL UP!  Press UP to launch!';
        instrText.color = k.rgb(255, 136, 0);
      } else if (!pullUpHintShown) {
        instrText.text = `Accelerating... ${speedPct}%`;
        instrText.color = k.rgb(170, 170, 170);
      }

      if ((k.isKeyDown('up') || k.isKeyDown('w')) && jetVX >= JET_SPEED / 2) {
        instrText.text = '';
        phase = 'launching';
        jetVY = -200;
        return;
      }

      if (jetX > edgeX) {
        takeoffAirborne = true;
        jetVY = 0;
        if ((k.isKeyDown('up') || k.isKeyDown('w')) && jetVX >= JET_SPEED / 2) {
          phase = 'launching';
          jetVY = -200;
          return;
        }
        instrText.text = 'PULL UP! PULL UP!';
        instrText.color = k.rgb(255, 0, 0);
      }
    } else {
      jetVY += 300 * dt;
      if (k.isKeyDown('up') || k.isKeyDown('w')) {
        jetVY += CLIMB_RATE * VERT_LERP * dt;
      }
      jetY += jetVY * dt;

      if (jetVY < -50) {
        phase = 'launching';
        return;
      }

      if (jetY >= GROUND_Y + 20) {
        crashJet('water');
        return;
      }
    }
  }

  function updateLaunching(dt) {
    jetVX = Math.min(JET_SPEED, jetVX + 200 * dt);
    jetX += jetVX * dt;
    jetY += jetVY * dt;
    jetVY += JET_GRAVITY * 0.3 * dt;

    scrollX += jetVX * 0.5 * dt;

    if (jetY < 200 && jetX > 500) {
      jetX = 280;
      jetY = 200;
      jetVX = JET_SPEED;
      startFlight();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 2 — FLIGHT (sea -> coast -> mountains)
  // ═════════════════════════════════════════════════════════════

  function startFlight() {
    phase = 'flight';
    phaseTimer = 0;
    flakTimer = 0;
    missiles = [];
    facingRight = true;
    jetVX = 0;
    jetVY = 0;
    flightDistance = 0;
    flightTerrainStage = 0;
    samWaveTimer = 0;
    samWaveIndex = 0;
    instrText.text = 'ARROWS to dodge \u2014 C for chaff \u2014 Approaching target...';
    instrText.color = k.rgb(136, 136, 136);
  }

  function updateFlight(dt) {
    phaseTimer += dt;

    // Horizontal control (player moves jet on screen, world scrolls at constant speed)
    applyJetHorizontal(dt);

    // Vertical control (airplane physics)
    applyJetVertical(dt);

    if (jetY < 40) { jetY = 40; jetVY = Math.max(0, jetVY); }
    if (jetY >= GROUND_Y - 10) { crashJet(flightTerrainStage <= 1 ? 'water' : 'ground'); return; }

    // World scroll
    scrollX += JET_SPEED * dt;
    flightDistance += JET_SPEED * dt;

    // Terrain transitions
    if (flightDistance > FLIGHT_COAST_DIST && flightTerrainStage === 0) {
      flightTerrainStage = 1;
      instrText.text = 'Approaching Lebanon...';
    }
    if (flightDistance > FLIGHT_MTN_DIST && flightTerrainStage === 1) {
      flightTerrainStage = 2;
      instrText.text = 'Over the mountains...';
    }

    // Distance HUD
    const distKm = Math.max(0, Math.round(90 * (1 - flightDistance / FLIGHT_TARGET_DIST)));
    hudDist.text = `TARGET: ${distKm} km`;

    // SAM wave spawning
    samWaveTimer += dt;
    const waveEntry = samWavePatterns[samWaveIndex % samWavePatterns.length];
    if (samWaveTimer >= waveEntry.delay) {
      samWaveTimer = 0;
      let spawnX;
      if (waveEntry.side === 'left') spawnX = 120 + (samWaveIndex % 3) * 40;
      else if (waveEntry.side === 'right') spawnX = W - 120 - (samWaveIndex % 3) * 40;
      else spawnX = W / 2 + ((samWaveIndex % 2) * 2 - 1) * 60;
      spawnMissile(spawnX, GROUND_Y + 20, false);
      samWaveIndex++;
    }

    // Flak
    flakTimer += dt;
    if (flakTimer >= FLAK_INTERVAL) {
      flakTimer = 0;
      spawnFlak();
    }

    updateMissiles(dt);
    updateChaff(dt);

    // Transition to bombing
    if (flightDistance >= FLIGHT_TARGET_DIST) {
      startBombing();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 3 — BOMBING
  // ═════════════════════════════════════════════════════════════

  function startBombing() {
    phase = 'bombing';
    phaseTimer = 0;
    bombObjects = [];
    missiles = [];
    jetX = 80;
    jetY = 150;
    jetVX = 0;
    jetVY = 0;
    facingRight = true;
    bombCooldown = 0;
    bossMissileTimer = 0;
    bossBurstTimer = 0;
    bossTelegraphing = false;
    bossBurstTelegraphing = false;
    turretBullets = [];
    instrText.text = 'ARROWS to position \u2014 SPACE to drop bomb \u2014 C for chaff';
    instrText.color = k.rgb(255, 136, 0);
  }

  function updateBombing(dt) {
    phaseTimer += dt;

    // Horizontal + vertical
    applyJetHorizontal(dt);
    if (k.isKeyDown('right') || k.isKeyDown('d')) facingRight = true;
    if (k.isKeyDown('left') || k.isKeyDown('a')) facingRight = false;
    applyJetVertical(dt);

    if (jetY < 60) { jetY = 60; jetVY = Math.max(0, jetVY); }
    if (jetY >= GROUND_Y - 10) { crashJet('ground'); return; }

    // Bomb cooldown
    if (bombCooldown > 0) bombCooldown -= dt;

    // Boss attacks
    updateBossAttacks(dt);
    updateMissiles(dt);
    updateChaff(dt);
    updateBombs(dt);
    updateTurretBullets(dt);

    // Check end conditions
    if (bunkerHP <= 0) {
      startExplosionSequence();
      return;
    }
    if (bombs <= 0 && bombObjects.length === 0) {
      if (bunkerHP <= 0) {
        startExplosionSequence();
      } else {
        instrText.text = 'OUT OF ORDNANCE';
        instrText.color = k.rgb(255, 68, 68);
        k.wait(1.5, () => startReturn());
      }
    }
  }

  // ── Boss attacks ──
  function updateBossAttacks(dt) {
    if (bunkerHP <= 0) return;
    bossMissileTimer += dt;
    bossBurstTimer += dt;

    // Single missile
    if (bossMissileTimer >= bossFireRate && !bossTelegraphing) {
      bossMissileTimer = 0;
      bossTelegraphing = true;
      k.wait(0.5, () => {
        bossTelegraphing = false;
        spawnBossMissileFan(0);
      });
    }

    // Burst of 3 every bossBurstCooldown
    if (bossBurstTimer >= bossBurstCooldown && !bossBurstTelegraphing) {
      bossBurstTimer = 0;
      bossBurstTelegraphing = true;
      k.wait(0.5, () => {
        bossBurstTelegraphing = false;
        spawnBossMissileFan(-0.3);
        spawnBossMissileFan(0);
        spawnBossMissileFan(0.3);
      });
    }

    // Turret firing
    if (phaseTimer > 2) {
      // Simple timer-based turret
      const turretInterval = Math.max(1, 2.5 - phaseTimer * 0.05);
      if (bossMissileTimer % turretInterval < dt) {
        const tx = BUNKER_X + (Math.random() - 0.5) * 40;
        const ty = BUNKER_TOP_Y - 5;
        const tdx = jetX - tx, tdy = jetY - ty;
        const tdist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
        turretBullets.push({
          x: tx, y: ty,
          vx: (tdx / tdist) * 160,
          vy: (tdy / tdist) * 160,
        });
      }
    }
  }

  function updateTurretBullets(dt) {
    for (let i = turretBullets.length - 1; i >= 0; i--) {
      const b = turretBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (dist(b.x, b.y, jetX, jetY) < 20) {
        turretBullets.splice(i, 1);
        takeDamage();
        continue;
      }
      if (b.y < -20 || b.y > H + 20 || b.x < -20 || b.x > W + 20) {
        turretBullets.splice(i, 1);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // EXPLOSION SEQUENCE (bunker destroyed)
  // ═════════════════════════════════════════════════════════════

  function startExplosionSequence() {
    phase = 'explosion';
    instrText.text = '';
    bombObjects = [];
    missiles = [];
    turretBullets = [];

    // Flash + shake
    screenFlash(k, 255, 255, 255, 400, 0.6);
    k.shake(25);

    // Multiple delayed explosions
    for (let i = 0; i < 12; i++) {
      k.wait(i * 0.07, () => {
        const ex = BUNKER_X + (Math.random() - 0.5) * 200;
        const ey = BUNKER_TOP_Y + Math.random() * 100;
        addExplosion(ex, ey, 25 + Math.random() * 35);
      });
    }

    // TARGET ELIMINATED text + transition to return
    k.wait(1.8, () => {
      // Will show in draw
      k.wait(3.2, () => {
        startReturn();
      });
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 5 — RETURN FLIGHT
  // ═════════════════════════════════════════════════════════════

  function startReturn() {
    phase = 'returning';
    phaseTimer = 0;
    facingRight = false;
    jetX = W - 280;
    jetY = 180;
    jetVX = -JET_SPEED;
    jetVY = 0;
    missiles = [];
    returnTerrainStage = 0;
    returnDistance = 0;
    instrText.text = 'Returning to carrier \u2014 UP/DOWN to control altitude';
    instrText.color = k.rgb(136, 136, 136);
  }

  function updateReturn(dt) {
    phaseTimer += dt;

    jetVX = -JET_SPEED;
    facingRight = false;

    applyJetVertical(dt);

    if (jetY < 60) { jetY = 60; jetVY = Math.max(0, jetVY); }
    if (jetY >= GROUND_Y - 10) { crashJet(returnTerrainStage >= 2 ? 'water' : 'ground'); return; }

    jetX = W - 280;
    jetX = clamp(jetX, 60, W - 60);

    scrollX += jetVX * dt;
    returnDistance += Math.abs(jetVX) * dt;

    // Terrain transitions (reverse)
    if (returnDistance > RETURN_COAST_DIST && returnTerrainStage === 0) {
      returnTerrainStage = 1;
      instrText.text = 'Passing over Lebanon...';
    }
    if (returnDistance > RETURN_SEA_DIST && returnTerrainStage === 1) {
      returnTerrainStage = 2;
      instrText.text = 'Over the sea... carrier ahead';
    }

    // Occasional SAM on return
    samWaveTimer += dt;
    if (samWaveTimer > 4 && missiles.length < 1) {
      samWaveTimer = 0;
      spawnMissile(Math.random() * W, GROUND_Y + 20, false);
    }

    updateMissiles(dt);

    const distKm = Math.max(0, Math.round(80 * (1 - returnDistance / RETURN_CARRIER_DIST)));
    hudDist.text = `CARRIER: ${distKm} km`;

    if (returnDistance >= RETURN_CARRIER_DIST) {
      startLanding();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PHASE 6 — LANDING
  // ═════════════════════════════════════════════════════════════

  function startLanding() {
    phase = 'landing';
    facingRight = false;
    jetX = W - 150;
    jetY = 180;
    jetVY = 0;
    landingRetries = 0;
    altBeepTimer = 0;
    instrText.text = 'UP to slow descent \u2014 DOWN to descend \u2014 Land gently!';
    instrText.color = k.rgb(255, 170, 0);
  }

  function updateLanding(dt) {
    // Gentle leftward drift
    jetX -= 50 * dt;
    jetX = clamp(jetX, 30, W - 30);

    // Vertical: gentler for landing
    if (k.isKeyDown('up') || k.isKeyDown('w')) {
      jetVY += (CLIMB_RATE * 0.6 - jetVY) * VERT_LERP * dt;
    } else if (k.isKeyDown('down') || k.isKeyDown('s')) {
      jetVY += (DIVE_RATE * 0.6 - jetVY) * VERT_LERP * dt;
    } else {
      jetVY += (40 - jetVY) * VERT_DECAY * dt;
      jetVY += JET_GRAVITY * dt;
    }
    jetVY = clamp(jetVY, CLIMB_RATE * 0.8, DIVE_RATE * 0.8);
    jetY += jetVY * dt;

    // Altimeter beep
    altBeepTimer -= dt;
    if (altBeepTimer <= 0) {
      const altPct = (GROUND_Y - jetY) / GROUND_Y;
      altBeepTimer = 0.3 + altPct * 1.2;
      // Visual beep indicator (handled in draw)
    }

    // Carrier deck check
    if (jetY >= DECK_Y) {
      // Carrier occupies roughly X 40..440
      const carrierLeft = 40, carrierRight = 440;
      if (jetX >= carrierLeft && jetX <= carrierRight) {
        if (jetVY > LANDING_CRASH_VY) {
          crashJet('ground');
          return;
        }

        jetY = DECK_Y;
        jetVY = 0;

        const carrierCenterX = 240;
        const offset = Math.abs(jetX - carrierCenterX);
        if (offset < 50) {
          landingQuality = 'perfect';
          instrText.text = 'PERFECT LANDING!';
          instrText.color = k.rgb(0, 255, 0);
        } else if (offset < 120) {
          landingQuality = 'good';
          instrText.text = 'GOOD LANDING';
          instrText.color = k.rgb(136, 255, 0);
        } else {
          landingQuality = 'rough';
          instrText.text = 'ROUGH LANDING';
          instrText.color = k.rgb(255, 136, 0);
        }

        phase = 'landed';
        k.wait(2, () => showVictory());
      } else {
        // Missed carrier
        if (landingRetries < 1) {
          landingRetries++;
          instrText.text = 'WAVE OFF \u2014 Go around!';
          instrText.color = k.rgb(255, 68, 68);
          jetY = 180;
          jetX = W - 150;
          jetVY = 0;
          k.wait(1.5, () => {
            if (phase === 'landing') {
              instrText.text = 'UP to slow descent \u2014 DOWN to descend \u2014 Land gently!';
              instrText.color = k.rgb(255, 170, 0);
            }
          });
        } else {
          crashJet('water');
        }
      }
    }

    // Crashed into water below
    if (jetY > GROUND_Y + 20 && phase === 'landing') {
      crashJet('water');
    }
  }

  // ═════════════════════════════════════════════════════════════
  // VICTORY / DEFEAT
  // ═════════════════════════════════════════════════════════════

  function showVictory() {
    if (phase === 'victory') return;
    phase = 'victory';
    instrText.text = '';
    instrBg.opacity = 0;

    const layersDestroyed = BUNKER_LAYERS - Math.max(0, bunkerHP);
    missionSuccess = layersDestroyed >= BUNKER_LAYERS;

    let starCount = 0;
    if (!missionSuccess) starCount = 0;
    else if (layersDestroyed >= 5 && landingQuality === 'perfect') starCount = 3;
    else if ((layersDestroyed >= 5 && landingQuality === 'good') || layersDestroyed >= 3) starCount = 2;
    else starCount = 1;

    // Save progress
    try {
      localStorage.setItem('superzion_stars_3', String(Math.max(starCount, parseInt(localStorage.getItem('superzion_stars_3') || '0'))));
      if (missionSuccess) {
        const prev = parseInt(localStorage.getItem('superzion_level_progress') || '1');
        if (4 > prev) localStorage.setItem('superzion_level_progress', '4');
      }
    } catch (e) { /* storage */ }

    const elapsed = Date.now() - startTime;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);

    // ── Full-screen overlay ──
    k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.85), k.fixed(), k.z(500)]);

    const title = missionSuccess ? 'MISSION COMPLETE' : 'MISSION FAILED';
    const titleColor = missionSuccess ? [0, 255, 0] : [255, 68, 68];

    k.add([
      k.text(title, { size: 32, font: 'monospace' }),
      k.pos(W / 2, 80), k.anchor('center'), k.color(...titleColor), k.fixed(), k.z(501),
    ]);

    // Stats
    const stats = [
      `BUNKER LAYERS: ${layersDestroyed}/${BUNKER_LAYERS}`,
      `BOMBS USED: ${bombsUsed}/${BOMB_TOTAL}`,
      `ARMOR: ${Math.max(0, armor)}/3`,
      `LANDING: ${(landingQuality || 'N/A').toUpperCase()}`,
      `TIME: ${mins}:${String(secs).padStart(2, '0')}`,
    ];
    stats.forEach((s, i) => {
      k.add([
        k.text(s, { size: 14, font: 'monospace' }),
        k.pos(W / 2, 150 + i * 28), k.anchor('center'),
        k.color(200, 200, 200), k.fixed(), k.z(501),
      ]);
    });

    // Stars
    const starY = 310;
    for (let i = 0; i < 3; i++) {
      const filled = i < starCount;
      k.add([
        k.text(filled ? '\u2605' : '\u2606', { size: 36, font: 'monospace' }),
        k.pos(W / 2 - 50 + i * 50, starY), k.anchor('center'),
        k.color(filled ? 255 : 80, filled ? 215 : 80, filled ? 0 : 80), k.fixed(), k.z(501),
      ]);
    }

    // Buttons
    const nextLabel = missionSuccess ? 'PRESS SPACE - CONTINUE' : 'PRESS SPACE - RETRY';
    const promptObj = k.add([
      k.text(nextLabel, { size: 14, font: 'monospace' }),
      k.pos(W / 2, 380), k.anchor('center'),
      k.color(255, 215, 0), k.fixed(), k.z(501),
    ]);
    let bt = 0;
    promptObj.onUpdate(() => { bt += k.dt(); promptObj.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3; });

    k.add([
      k.text('M - MENU', { size: 12, font: 'monospace' }),
      k.pos(W / 2, 420), k.anchor('center'),
      k.color(120, 120, 140), k.fixed(), k.z(501),
    ]);

    // Input
    k.onKeyPress('space', () => {
      if (phase !== 'victory') return;
      if (missionSuccess) k.go('underground-intro');
      else k.go('level3-bomber');
    });
    k.onKeyPress('enter', () => {
      if (phase !== 'victory') return;
      if (missionSuccess) k.go('underground-intro');
      else k.go('level3-bomber');
    });
    k.onKeyPress('m', () => { if (phase === 'victory') k.go('menu'); });
  }

  // ═════════════════════════════════════════════════════════════
  // INPUT
  // ═════════════════════════════════════════════════════════════

  k.onKeyPress('space', () => {
    if (phase === 'bombing') dropBomb();
  });
  k.onKeyPress('c', () => {
    if (phase === 'flight' || phase === 'bombing' || phase === 'returning') deployChaff();
  });
  k.onKeyPress('escape', () => k.go('menu'));

  // Debug skip
  k.onKeyPress('p', () => {
    if (phase !== 'victory' && phase !== 'dead') {
      bunkerHP = 0;
      bombsUsed = 5;
      landingQuality = 'good';
      armor = 2;
      missionSuccess = true;
      showVictory();
    }
  });

  // ═════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ═════════════════════════════════════════════════════════════

  k.onUpdate(() => {
    const dt = k.dt();
    if (dt <= 0) return;

    switch (phase) {
      case 'takeoff':    updateTakeoff(dt); break;
      case 'launching':  updateLaunching(dt); break;
      case 'flight':     updateFlight(dt); break;
      case 'bombing':    updateBombing(dt); break;
      case 'returning':  updateReturn(dt); break;
      case 'landing':    updateLanding(dt); break;
    }

    // Update shared systems
    const activePhases = ['takeoff', 'launching', 'flight', 'bombing', 'returning', 'landing'];
    if (activePhases.includes(phase)) {
      updateEngineTrail(dt);
      updateHUD();

      // Update warnings
      for (let i = samWarnings.length - 1; i >= 0; i--) {
        samWarnings[i].timer -= dt;
        if (samWarnings[i].timer <= 0) samWarnings.splice(i, 1);
      }
      for (let i = flakWarnings.length - 1; i >= 0; i--) {
        flakWarnings[i].timer -= dt;
        if (flakWarnings[i].timer <= 0) flakWarnings.splice(i, 1);
      }

      // Update explosions
      for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].life -= dt;
        if (explosions[i].life <= 0) explosions.splice(i, 1);
      }
    }

    if (phase !== 'flight' && phase !== 'returning') {
      hudDist.text = '';
    }
  });

  // ═════════════════════════════════════════════════════════════
  // RENDERING (k.onDraw)
  // ═════════════════════════════════════════════════════════════

  k.onDraw(() => {
    // ── SKY GRADIENT ──
    // Sunset colors: dark blue top -> purple -> orange at horizon
    for (let y = 0; y < GROUND_Y; y += 4) {
      const t = y / GROUND_Y;
      let r, g, b;
      if (t < 0.3) {
        // Dark blue top
        r = Math.floor(8 + t * 30);
        g = Math.floor(8 + t * 20);
        b = Math.floor(30 + t * 60);
      } else if (t < 0.7) {
        // Purple middle
        const p = (t - 0.3) / 0.4;
        r = Math.floor(17 + p * 80);
        g = Math.floor(14 + p * 20);
        b = Math.floor(48 + p * 30);
      } else {
        // Orange horizon
        const p = (t - 0.7) / 0.3;
        r = Math.floor(97 + p * 130);
        g = Math.floor(34 + p * 60);
        b = Math.floor(78 - p * 40);
      }
      k.drawRect({ pos: k.vec2(0, y), width: W, height: 4, color: k.rgb(r, g, b) });
    }

    // Sun disc near horizon
    k.drawCircle({ pos: k.vec2(W * 0.7, GROUND_Y - 30), radius: 40, color: k.rgb(255, 102, 0), opacity: 0.25 });
    k.drawCircle({ pos: k.vec2(W * 0.7, GROUND_Y - 30), radius: 55, color: k.rgb(255, 170, 51), opacity: 0.1 });

    // ── CLOUDS ──
    const cloudOff = scrollX * 0.1;
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 180 + 50) - cloudOff) % (W + 200) - 100;
      const cy = 60 + (i % 3) * 40 + Math.sin(i * 1.7) * 20;
      const cw = 60 + (i % 3) * 30;
      k.drawRect({ pos: k.vec2(cx, cy), width: cw, height: 12, color: k.rgb(180, 160, 200), opacity: 0.12 });
      k.drawRect({ pos: k.vec2(cx + 10, cy - 4), width: cw * 0.6, height: 8, color: k.rgb(200, 180, 220), opacity: 0.08 });
    }

    // ── TERRAIN / GROUND ──
    const groundScroll = scrollX * 0.8;

    if (phase === 'takeoff' || phase === 'launching' || phase === 'landing' || phase === 'landed') {
      // SEA + CARRIER
      drawSea(groundScroll);
      drawCarrier(phase === 'landing' || phase === 'landed');
    } else if (phase === 'flight' || phase === 'returning') {
      const stage = phase === 'flight' ? flightTerrainStage : (returnTerrainStage >= 2 ? 0 : returnTerrainStage === 1 ? 1 : 2);
      if (stage === 0) {
        drawSea(groundScroll);
      } else if (stage === 1) {
        drawCoast(groundScroll);
      } else {
        drawMountains(groundScroll);
      }
    } else if (phase === 'bombing' || phase === 'explosion') {
      drawMountains(groundScroll);
      drawBunker();
    } else {
      drawSea(groundScroll);
    }

    // ── RUNWAY LIGHTS (takeoff) ──
    if (phase === 'takeoff') {
      for (let i = 0; i < 10; i++) {
        const lx = ((i * 50 + 20) - scrollX * 0.5) % 500;
        if (lx > 0 && lx < W) {
          k.drawCircle({ pos: k.vec2(lx, DECK_Y + 2), radius: 2, color: k.rgb(255, 255, 100), opacity: 0.6 });
        }
      }
    }

    // ── JET ──
    if (phase !== 'victory' && phase !== 'dead') {
      drawJet();
    }

    // ── BOMBS (falling) ──
    for (const b of bombObjects) {
      k.drawCircle({ pos: k.vec2(b.x, b.y), radius: 5, color: k.rgb(255, 204, 0) });
      k.drawCircle({ pos: k.vec2(b.x, b.y), radius: 7, color: k.rgb(255, 136, 0), opacity: 0.3 });
    }

    // ── MISSILES ──
    for (const m of missiles) {
      const mColor = m.isBoss ? k.rgb(255, 34, 34) : k.rgb(255, 51, 51);
      const mRadius = m.isBoss ? 5 : 3;
      k.drawCircle({ pos: k.vec2(m.x, m.y), radius: mRadius, color: mColor });
      k.drawCircle({ pos: k.vec2(m.x, m.y), radius: mRadius + 2, color: k.rgb(255, 0, 0), opacity: 0.3 });
      // Smoke trail (simple)
      k.drawCircle({ pos: k.vec2(m.x - m.vx * 0.02, m.y - m.vy * 0.02), radius: 2, color: k.rgb(150, 50, 50), opacity: 0.3 });
    }

    // ── TURRET BULLETS ──
    for (const b of turretBullets) {
      k.drawCircle({ pos: k.vec2(b.x, b.y), radius: 3, color: k.rgb(255, 68, 68) });
    }

    // ── ENGINE PARTICLES ──
    for (const p of engineParticles) {
      const alpha = Math.max(0, p.life * 2);
      const scale = Math.max(0.2, p.life);
      k.drawCircle({ pos: k.vec2(p.x, p.y), radius: p.r * scale, color: k.rgb(255, 120 + Math.random() * 60, 0), opacity: alpha * 0.6 });
    }

    // ── CHAFF PARTICLES ──
    for (const p of chaffParticles) {
      const alpha = Math.max(0, p.life * 0.8);
      k.drawCircle({ pos: k.vec2(p.x, p.y), radius: 2, color: k.rgb(255, 255, 255), opacity: alpha });
    }

    // ── EXPLOSIONS ──
    for (const e of explosions) {
      const scale = 1 + (0.5 - e.life);
      const alpha = Math.max(0, e.life * 2);
      k.drawCircle({
        pos: k.vec2(e.x, e.y),
        radius: e.radius * scale,
        color: k.rgb(255, 102, 0),
        opacity: alpha * 0.8,
      });
      k.drawCircle({
        pos: k.vec2(e.x, e.y),
        radius: e.radius * scale * 0.5,
        color: k.rgb(255, 204, 0),
        opacity: alpha * 0.6,
      });
    }

    // ── SAM WARNINGS ──
    for (const w of samWarnings) {
      const blink = Math.sin(w.timer * 12) > 0 ? 1 : 0.2;
      k.drawText({ text: '\u25B2', pos: k.vec2(w.x, H - 20), size: 16, font: 'monospace', color: k.rgb(255, 51, 51), opacity: blink, anchor: 'center' });
      k.drawText({ text: 'WARNING', pos: k.vec2(w.x, H - 38), size: 9, font: 'monospace', color: k.rgb(255, 51, 51), opacity: blink, anchor: 'center' });
    }

    // ── FLAK WARNINGS ──
    for (const w of flakWarnings) {
      const blink = Math.sin(w.timer * 12) > 0 ? 0.6 : 0.2;
      k.drawCircle({ pos: k.vec2(w.x, w.y), radius: 25, color: k.rgb(255, 0, 0), opacity: blink * 0.35 });
      k.drawText({ text: '+', pos: k.vec2(w.x, w.y), size: 20, font: 'monospace', color: k.rgb(255, 68, 68), opacity: blink, anchor: 'center' });
    }

    // ── EXPLOSION SEQUENCE TEXT ──
    if (phase === 'explosion') {
      const t = k.time();
      if (Math.sin(t * 8) > 0) {
        k.drawText({ text: 'TARGET ELIMINATED', pos: k.vec2(W / 2, 60), size: 28, font: 'monospace', color: k.rgb(255, 68, 0), anchor: 'center' });
      }
      k.drawText({ text: 'RTB \u2014 RETURN TO BASE', pos: k.vec2(W / 2, 95), size: 16, font: 'monospace', color: k.rgb(0, 255, 0), anchor: 'center' });
    }

    // ── BOSS HP BAR (bombing phase) ──
    if ((phase === 'bombing' || phase === 'explosion') && bunkerHP > 0) {
      const barW = 200;
      const barY = 20;
      const ratio = Math.max(0, bunkerHP / BUNKER_LAYERS);
      k.drawRect({ pos: k.vec2(W / 2 - barW / 2 - 2, barY - 8), width: barW + 4, height: 16, color: k.rgb(51, 51, 51) });
      const barColor = ratio > 0.6 ? k.rgb(68, 255, 68) : ratio > 0.3 ? k.rgb(255, 204, 0) : k.rgb(255, 68, 68);
      k.drawRect({ pos: k.vec2(W / 2 - barW / 2, barY - 6), width: barW * ratio, height: 12, color: barColor });
      k.drawText({ text: 'HASSAN NASRALLAH', pos: k.vec2(W / 2, barY - 14), size: 11, font: 'monospace', color: k.rgb(255, 136, 0), anchor: 'center' });
    }

    // ── ALTIMETER BAR (landing) ──
    if (phase === 'landing') {
      const altPct = clamp((GROUND_Y - jetY) / (GROUND_Y - 60), 0, 1);
      const barH = 200;
      const barX = W - 30;
      k.drawRect({ pos: k.vec2(barX, H / 2 - barH / 2), width: 8, height: barH, color: k.rgb(30, 30, 30), opacity: 0.6 });
      const fillH = barH * altPct;
      const altColor = jetVY > LANDING_CRASH_VY * 0.8 ? k.rgb(255, 0, 0) : jetVY > LANDING_CRASH_VY * 0.5 ? k.rgb(255, 170, 0) : k.rgb(0, 255, 0);
      k.drawRect({ pos: k.vec2(barX, H / 2 + barH / 2 - fillH), width: 8, height: fillH, color: altColor, opacity: 0.7 });
      k.drawText({ text: 'ALT', pos: k.vec2(barX + 4, H / 2 - barH / 2 - 12), size: 9, font: 'monospace', color: k.rgb(200, 200, 200), anchor: 'center' });
    }

    // ── CRASHED overlay ──
    if (phase === 'dead') {
      k.drawText({ text: 'CRASHED', pos: k.vec2(W / 2, H / 2), size: 48, font: 'monospace', color: k.rgb(255, 68, 68), anchor: 'center' });
    }
  });

  // ═════════════════════════════════════════════════════════════
  // DRAW HELPERS
  // ═════════════════════════════════════════════════════════════

  function drawSea(scrollOff) {
    // Dark blue water
    k.drawRect({ pos: k.vec2(0, GROUND_Y), width: W, height: H - GROUND_Y, color: k.rgb(12, 24, 48) });

    // Wave lines
    for (let i = 0; i < 8; i++) {
      const wy = GROUND_Y + 10 + i * 15;
      for (let wx = 0; wx < W; wx += 30) {
        const waveX = ((wx - scrollOff * 0.3) % (W + 60)) - 30;
        const waveOff = Math.sin((wx + scrollOff * 0.02 + i) * 0.1) * 3;
        k.drawLine({
          p1: k.vec2(waveX, wy + waveOff),
          p2: k.vec2(waveX + 20, wy + waveOff + 1),
          color: k.rgb(30, 50, 80),
          opacity: 0.3,
          width: 1,
        });
      }
    }

    // Moonlight shimmer on water
    for (let i = 0; i < 6; i++) {
      const sx = ((i * 170 + 50) - scrollOff * 0.2) % W;
      const shimmer = Math.sin(scrollOff * 0.01 + i) * 2;
      k.drawRect({ pos: k.vec2(sx < 0 ? sx + W : sx, GROUND_Y + 10 + shimmer), width: 3, height: 12, color: k.rgb(255, 255, 255), opacity: 0.06 });
    }
  }

  function drawCoast(scrollOff) {
    // Brown/green ground
    k.drawRect({ pos: k.vec2(0, GROUND_Y), width: W, height: H - GROUND_Y, color: k.rgb(58, 72, 48) });

    // Coastline details
    for (let i = 0; i < 4; i++) {
      const hx = ((i * 250 + 100) - scrollOff * 0.3) % (W + 200) - 100;
      k.drawRect({ pos: k.vec2(hx, GROUND_Y - 30 - i * 5), width: 80, height: 30 + i * 5, color: k.rgb(45, 60, 38), opacity: 0.6 });
    }

    // Water transition at bottom
    k.drawRect({ pos: k.vec2(0, H - 30), width: W, height: 30, color: k.rgb(20, 36, 60), opacity: 0.4 });

    // Roads
    for (let i = 0; i < 3; i++) {
      const rx = ((i * 330 + 100) - scrollOff * 0.8) % (W + 200) - 100;
      k.drawLine({ p1: k.vec2(rx, GROUND_Y + 5), p2: k.vec2(rx, GROUND_Y + 90), color: k.rgb(85, 85, 80), opacity: 0.2, width: 1 });
    }

    // Far mountains (background)
    for (let i = 0; i < 5; i++) {
      const mx = ((i * 220 + 80) - scrollOff * 0.15) % (W + 300) - 150;
      const mh = 40 + (i % 3) * 20;
      // Triangle mountain
      k.drawTriangle({
        p1: k.vec2(mx, GROUND_Y),
        p2: k.vec2(mx + 60, GROUND_Y),
        p3: k.vec2(mx + 30, GROUND_Y - mh),
        color: k.rgb(40, 50, 55),
        opacity: 0.4,
      });
    }
  }

  function drawMountains(scrollOff) {
    // Dark brown/olive ground
    k.drawRect({ pos: k.vec2(0, GROUND_Y), width: W, height: H - GROUND_Y, color: k.rgb(48, 42, 32) });

    // Mountain range (background, parallax)
    for (let i = 0; i < 7; i++) {
      const mx = ((i * 160 + 40) - scrollOff * 0.15) % (W + 400) - 200;
      const mh = 60 + (i % 4) * 25;
      k.drawTriangle({
        p1: k.vec2(mx, GROUND_Y),
        p2: k.vec2(mx + 100, GROUND_Y),
        p3: k.vec2(mx + 50, GROUND_Y - mh),
        color: k.rgb(35, 40, 45),
        opacity: 0.5,
      });
    }

    // Closer mountains (darker, faster parallax)
    for (let i = 0; i < 5; i++) {
      const mx = ((i * 210 + 70) - scrollOff * 0.3) % (W + 300) - 150;
      const mh = 30 + (i % 3) * 15;
      k.drawTriangle({
        p1: k.vec2(mx - 10, GROUND_Y),
        p2: k.vec2(mx + 80, GROUND_Y),
        p3: k.vec2(mx + 35, GROUND_Y - mh),
        color: k.rgb(55, 50, 40),
        opacity: 0.6,
      });
    }

    // Building clusters on ground
    for (let i = 0; i < 8; i++) {
      const bx = ((i * 137 + 50) - scrollOff * 0.6) % (W + 100) - 50;
      const bh = 4 + (i % 3) * 3;
      k.drawRect({ pos: k.vec2(bx, GROUND_Y + 15 + (i % 4) * 8), width: 6, height: bh, color: k.rgb(138, 122, 106), opacity: 0.15 });
    }
  }

  function drawCarrier(isLanding) {
    // Carrier deck at bottom
    const carrierX = isLanding ? 140 : 140;
    const deckY = GROUND_Y - 10;

    // Hull (dark gray)
    k.drawRect({ pos: k.vec2(carrierX - 100, deckY + 5), width: 280, height: 30, color: k.rgb(58, 58, 66) });

    // Deck surface (lighter)
    k.drawRect({ pos: k.vec2(carrierX - 100, deckY), width: 280, height: 8, color: k.rgb(106, 106, 114) });

    // Runway lines
    for (let i = 0; i < 8; i++) {
      const lx = carrierX - 80 + i * 35;
      k.drawRect({ pos: k.vec2(lx, deckY + 2), width: 20, height: 1, color: k.rgb(255, 255, 255), opacity: 0.4 });
    }

    // Bridge/island
    k.drawRect({ pos: k.vec2(carrierX + 120, deckY - 15), width: 25, height: 15, color: k.rgb(74, 74, 82) });

    // Antenna
    k.drawLine({ p1: k.vec2(carrierX + 130, deckY - 15), p2: k.vec2(carrierX + 130, deckY - 22), color: k.rgb(136, 136, 136), width: 1, opacity: 0.6 });
  }

  function drawBunker() {
    // Bunker area detail
    // Perimeter wall
    k.drawRect({ pos: k.vec2(BUNKER_X - 200, BUNKER_TOP_Y - 30), width: 400, height: GROUND_Y - BUNKER_TOP_Y + 30, color: k.rgb(0, 0, 0), opacity: 0 });
    // Perimeter outline
    const wallColor = k.rgb(106, 106, 90);
    k.drawLine({ p1: k.vec2(BUNKER_X - 200, BUNKER_TOP_Y - 30), p2: k.vec2(BUNKER_X + 200, BUNKER_TOP_Y - 30), color: wallColor, opacity: 0.4, width: 2 });
    k.drawLine({ p1: k.vec2(BUNKER_X - 200, BUNKER_TOP_Y - 30), p2: k.vec2(BUNKER_X - 200, GROUND_Y), color: wallColor, opacity: 0.4, width: 2 });
    k.drawLine({ p1: k.vec2(BUNKER_X + 200, BUNKER_TOP_Y - 30), p2: k.vec2(BUNKER_X + 200, GROUND_Y), color: wallColor, opacity: 0.4, width: 2 });

    // Guard towers at corners
    for (const tp of [
      { x: BUNKER_X - 200, y: BUNKER_TOP_Y - 30 },
      { x: BUNKER_X + 200, y: BUNKER_TOP_Y - 30 },
    ]) {
      k.drawRect({ pos: k.vec2(tp.x - 6, tp.y - 12), width: 12, height: 12, color: k.rgb(106, 106, 90), opacity: 0.5 });
      k.drawCircle({ pos: k.vec2(tp.x, tp.y - 16), radius: 2, color: k.rgb(255, 255, 136), opacity: 0.3 });
    }

    // Road
    k.drawLine({ p1: k.vec2(0, GROUND_Y - 5), p2: k.vec2(BUNKER_X - 200, GROUND_Y - 5), color: k.rgb(85, 85, 80), opacity: 0.3, width: 3 });

    // Camouflage netting
    k.drawRect({ pos: k.vec2(BUNKER_X - 130, BUNKER_TOP_Y - 12), width: 260, height: 15, color: k.rgb(58, 85, 48), opacity: 0.3 });

    // Bunker interior (dark room)
    const bunkW = BUNKER_W + 40;
    const bunkLeft = BUNKER_X - bunkW / 2;
    const bunkTop = BUNKER_TOP_Y - 5;
    const bunkH = BUNKER_LAYERS * LAYER_H + 10;
    k.drawRect({ pos: k.vec2(bunkLeft + 5, bunkTop + 2), width: bunkW - 10, height: bunkH - 4, color: k.rgb(10, 10, 20), opacity: 0.9 });

    // Bunker layers
    const layerColors = [
      [138, 138, 146], [122, 122, 130], [106, 106, 114],
      [90, 90, 98], [74, 74, 82],
    ];
    for (let i = 0; i < BUNKER_LAYERS; i++) {
      if (!bunkerLayerAlive[i]) continue;
      const ly = BUNKER_TOP_Y + i * LAYER_H;
      const c = layerColors[i];
      // Left wall
      k.drawRect({ pos: k.vec2(bunkLeft, ly), width: 30, height: LAYER_H - 2, color: k.rgb(c[0], c[1], c[2]) });
      // Right wall
      k.drawRect({ pos: k.vec2(bunkLeft + bunkW - 30, ly), width: 30, height: LAYER_H - 2, color: k.rgb(c[0], c[1], c[2]) });
      // Top bar
      k.drawRect({ pos: k.vec2(BUNKER_X - (bunkW - 60) / 2, ly + 1), width: bunkW - 60, height: 3, color: k.rgb(c[0], c[1], c[2]), opacity: 0.6 });
      // Edge outline
      k.drawLine({ p1: k.vec2(bunkLeft, ly), p2: k.vec2(bunkLeft + bunkW, ly), color: k.rgb(153, 153, 153), opacity: 0.3, width: 1 });
    }

    // Boss figure inside bunker (when alive)
    if (bunkerHP > 0) {
      const bossX = BUNKER_X, bossY = BUNKER_TOP_Y + 36;
      // Body
      k.drawRect({ pos: k.vec2(bossX - 10, bossY - 15), width: 20, height: 30, color: k.rgb(60, 30, 30) });
      // Head
      k.drawCircle({ pos: k.vec2(bossX, bossY - 25), radius: 8, color: k.rgb(80, 40, 30) });
      // Turban
      k.drawRect({ pos: k.vec2(bossX - 12, bossY - 36), width: 24, height: 8, color: k.rgb(70, 35, 25) });
      // Console in front
      k.drawRect({ pos: k.vec2(bossX - 25, bossY + 15), width: 50, height: 12, color: k.rgb(42, 42, 58) });
      k.drawRect({ pos: k.vec2(bossX - 22, bossY + 16), width: 44, height: 6, color: k.rgb(17, 68, 170), opacity: 0.5 });

      // Interior screens
      for (const sp of [
        { x: bunkLeft + 40, y: bunkTop + 15 },
        { x: bunkLeft + 55, y: bunkTop + 15 },
        { x: bunkLeft + bunkW - 40, y: bunkTop + 15 },
        { x: bunkLeft + bunkW - 55, y: bunkTop + 15 },
      ]) {
        const destroyed = BUNKER_LAYERS - bunkerHP;
        const screenAlive = destroyed < 2;
        if (screenAlive) {
          k.drawRect({ pos: k.vec2(sp.x - 5, sp.y - 4), width: 10, height: 8, color: k.rgb(17, 68, 136), opacity: 0.6 });
        } else {
          k.drawRect({ pos: k.vec2(sp.x - 5, sp.y - 4), width: 10, height: 8, color: k.rgb(17, 8, 8), opacity: 0.6 });
        }
      }

      // Damage effects (fires, smoke)
      const destroyed = BUNKER_LAYERS - bunkerHP;
      if (destroyed >= 3) {
        // Fire circles
        const ft = k.time();
        for (const fp of [{ x: bunkLeft + 45, y: BUNKER_TOP_Y + 35 }, { x: bunkLeft + bunkW - 45, y: BUNKER_TOP_Y + 40 }]) {
          const flicker = 0.4 + Math.sin(ft * 10 + fp.x) * 0.3;
          k.drawCircle({ pos: k.vec2(fp.x, fp.y), radius: 6, color: k.rgb(255, 102, 0), opacity: flicker });
          k.drawCircle({ pos: k.vec2(fp.x, fp.y - 2), radius: 3, color: k.rgb(255, 204, 0), opacity: flicker + 0.2 });
        }
      }
      if (destroyed >= 1) {
        // Smoke
        k.drawCircle({ pos: k.vec2(BUNKER_X - 30, BUNKER_TOP_Y + 20), radius: 15, color: k.rgb(51, 51, 51), opacity: 0.2 });
      }
    }

    // Turrets near bunker
    for (const tp of [BUNKER_X - 150, BUNKER_X + 150]) {
      k.drawRect({ pos: k.vec2(tp - 6, GROUND_Y - 15), width: 12, height: 10, color: k.rgb(170, 32, 32) });
    }
  }

  function drawJet() {
    // Calculate tilt angle based on vertical velocity
    const maxVY = DIVE_RATE * 1.2;
    const tiltNorm = clamp(jetVY / maxVY, -1, 1);
    const tiltAngle = tiltNorm * degToRad(TILT_MAX);

    // Draw jet body (simplified F-15 silhouette)
    // Since we can't rotate drawRect, we'll use the sprite if loaded, or draw a simple shape

    // Fuselage
    const fLen = 40, fH = 8;
    const cos = Math.cos(tiltAngle), sin = Math.sin(tiltAngle);
    const flip = facingRight ? 1 : -1;

    // Fuselage center
    k.drawRect({
      pos: k.vec2(jetX - fLen / 2 * flip, jetY - fH / 2),
      width: fLen, height: fH,
      color: k.rgb(122, 122, 136),
    });

    // Wings
    const wingY1 = jetY - 14, wingY2 = jetY + 14;
    k.drawRect({ pos: k.vec2(jetX - 5 * flip, wingY1 - 2), width: 18, height: 4, color: k.rgb(106, 106, 120) });
    k.drawRect({ pos: k.vec2(jetX - 5 * flip, wingY2 - 2), width: 18, height: 4, color: k.rgb(106, 106, 120) });

    // Twin tail fins
    const tailX = jetX + (facingRight ? -18 : 18);
    k.drawRect({ pos: k.vec2(tailX, jetY - 10), width: 4, height: 8, color: k.rgb(90, 90, 104) });
    k.drawRect({ pos: k.vec2(tailX, jetY + 2), width: 4, height: 8, color: k.rgb(90, 90, 104) });

    // Cockpit
    const cockpitX = jetX + (facingRight ? 16 : -16);
    k.drawCircle({ pos: k.vec2(cockpitX, jetY), radius: 3, color: k.rgb(85, 136, 170) });

    // Engine glow
    const engineX = jetX + (facingRight ? -22 : 22);
    const glowSize = 4 + Math.sin(k.time() * 20) * 1;
    k.drawCircle({ pos: k.vec2(engineX, jetY), radius: glowSize, color: k.rgb(255, 102, 0), opacity: 0.7 });
    k.drawCircle({ pos: k.vec2(engineX, jetY), radius: glowSize * 0.5, color: k.rgb(255, 200, 0), opacity: 0.9 });

    // Tilt indicator (nose up/down visual)
    if (Math.abs(tiltNorm) > 0.1) {
      const noseX = jetX + (facingRight ? 22 : -22);
      const noseY = jetY + tiltNorm * 6;
      k.drawCircle({ pos: k.vec2(noseX, noseY), radius: 2, color: k.rgb(200, 200, 200), opacity: 0.4 });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // START
  // ═════════════════════════════════════════════════════════════

  startTakeoff();
}
