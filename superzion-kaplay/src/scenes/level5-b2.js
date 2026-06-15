// ===================================================================
// Level 5 — Operation Mountain Breaker (B-2 Stealth Bomber)
// Top-down aerial: Takeoff -> Flight (sea/coast/land) -> Bombing -> Explosion -> Escape
// Ported from B2BomberScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../constants.js';
import { generateB2Textures } from '../systems/texture-factory.js';
import { screenFlash, impactParticles } from '../systems/game-juice.js';

// ── Constants ──
const B2_MOVE_SPEED = 220;
const TERRAIN_SPEED = 280;
const MOUNTAIN_LAYERS = 5;
const CHAFF_TOTAL = 5;
const BUSTER_TOTAL = 6;
const B2_MARGIN = 30;

export function level5B2Scene(k) {
  generateB2Textures(k);

  // ══════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════
  let phase = 'takeoff'; // takeoff, flight, bombing, explosion, escape, victory, dead
  let phaseTimer = 0;
  let startTime = Date.now();

  // B-2 position
  let jetX = W / 2;
  let jetY = H * 0.65;
  let jetBankAngle = 0;
  let jetVY = 0;

  // Terrain
  let terrainOffset = 0;
  let terrainSpeed = TERRAIN_SPEED;

  // Detection/stealth
  let detectionLevel = 0;
  let maxDetection = 0;

  // Combat
  let armor = 3;
  let busters = BUSTER_TOTAL;
  let bustersUsed = 0;
  let chaff = CHAFF_TOTAL;
  let chaffUsed = 0;
  let missilesEvaded = 0;

  // Missile/radar systems
  let missiles = [];
  let bombObjects = [];
  let radarCones = [];
  let samSites = [];
  let chaffDecoys = [];
  let missileSpawnTimer = 0;

  // Mountain bombing
  let mountainHP = MOUNTAIN_LAYERS;
  let mountainLayerHP = [];
  for (let i = 0; i < MOUNTAIN_LAYERS; i++) mountainLayerHP.push(true);
  let layersDestroyed = 0;
  let mtnCenterX = W / 2;
  let mtnTargetY = H * 0.45;
  let mtnBunkerHit = false;

  // Multi-pass bombing
  let passNumber = 1;
  const maxPasses = 6;
  let passDir = 1; // 1 = left->right, -1 = right->left
  const passSpeed = 180;
  const bombsPerPass = 3;
  let bombsThisPass = 3;
  let passPaused = false;
  let passPauseTimer = 0;
  let bombCooldown = 0;
  let bombingEnded = false;
  let samWarning = false;
  let samWarningTimer = 0;

  // Flight phase pre-generated data
  const flightBuildings = [];
  for (let i = 0; i < 30; i++) {
    flightBuildings.push({
      x: 40 + Math.random() * (W - 80),
      yBase: Math.random() * 2000,
      w: 4 + Math.random() * 8,
      h: 4 + Math.random() * 8,
      shade: 0x4a + Math.floor(Math.random() * 0x10),
    });
  }
  const flightRoads = [
    { x: 180 + Math.random() * 40 },
    { x: 580 + Math.random() * 40 },
    { x: 380 + Math.random() * 40 },
  ];

  // Takeoff state
  let takeoffTimer = 0;
  let takeoffStage = 0;
  let takeoffScale = 1.8;
  let takeoffRunwayOffset = 0;
  let takeoffSpeed = 0;

  // Escape state
  let escB2X = 0;
  let escB2Y = 0;
  let escBank = 0;
  let escTimer = 0;

  // Explosion state
  let explosionTimer = 0;
  let explosionPhase = 0;
  let explosionParticles = [];

  // Engine particles
  let engineParticles = [];

  // ══════════════════════════════════════════════════════════════
  // HUD (fixed elements)
  // ══════════════════════════════════════════════════════════════
  const hudTitle = k.add([
    k.text('OPERATION MOUNTAIN BREAKER', { size: 11, font: 'monospace' }),
    k.pos(15, 12), k.color(170, 170, 204), k.fixed(), k.z(30),
  ]);
  const hudArmor = k.add([
    k.text('ARMOR: 3/3', { size: 12, font: 'monospace' }),
    k.pos(15, 30), k.color(255, 255, 255), k.fixed(), k.z(30),
  ]);
  const hudBusters = k.add([
    k.text(`BUSTERS: ${BUSTER_TOTAL}`, { size: 12, font: 'monospace' }),
    k.pos(15, 46), k.color(255, 255, 255), k.fixed(), k.z(30),
  ]);
  const hudChaff = k.add([
    k.text(`CHAFF: ${CHAFF_TOTAL}`, { size: 12, font: 'monospace' }),
    k.pos(15, 62), k.color(255, 255, 255), k.fixed(), k.z(30),
  ]);
  const hudAlt = k.add([
    k.text('ALT: 12000m', { size: 12, font: 'monospace' }),
    k.pos(W - 15, 12), k.anchor('topright'), k.color(170, 170, 170), k.fixed(), k.z(30),
  ]);
  const hudSpeed = k.add([
    k.text('SPD: 450 kts', { size: 12, font: 'monospace' }),
    k.pos(W - 15, 28), k.anchor('topright'), k.color(170, 170, 170), k.fixed(), k.z(30),
  ]);
  const hudDist = k.add([
    k.text('', { size: 11, font: 'monospace' }),
    k.pos(W / 2, 12), k.anchor('center'), k.color(0, 229, 255), k.fixed(), k.z(30),
  ]);
  const hudDetect = k.add([
    k.text('DETECTION: 0%', { size: 9, font: 'monospace' }),
    k.pos(W / 2, 42), k.anchor('center'), k.color(170, 170, 170), k.fixed(), k.z(30),
  ]);

  // Instruction bar
  const instrBg = k.add([
    k.rect(W, 28), k.pos(0, H - 28), k.color(0, 0, 0), k.opacity(0.6), k.fixed(), k.z(29),
  ]);
  const instrText = k.add([
    k.text('', { size: 12, font: 'monospace' }),
    k.pos(W / 2, H - 14), k.anchor('center'), k.color(150, 150, 150), k.fixed(), k.z(30),
  ]);

  function setHUDVisible(visible) {
    const els = [hudTitle, hudArmor, hudBusters, hudChaff, hudAlt, hudSpeed, hudDist, hudDetect, instrBg, instrText];
    for (const el of els) {
      if (el && el.exists()) el.opacity = visible ? 1 : 0;
    }
    if (visible) instrBg.opacity = 0.6;
  }

  function updateHUD() {
    hudArmor.text = `ARMOR: ${Math.max(0, armor)}/3`;
    hudArmor.color = armor <= 1 ? k.rgb(255, 68, 68) : k.rgb(255, 255, 255);
    hudBusters.text = `BUSTERS: ${busters}`;
    hudChaff.text = `CHAFF: ${chaff}`;
  }

  // Hide HUD during takeoff
  setHUDVisible(false);

  // ══════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════
  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // ══════════════════════════════════════════════════════════════
  // DAMAGE
  // ══════════════════════════════════════════════════════════════
  function takeDamage() {
    armor--;
    k.shake(8);
    screenFlash(k, 255, 0, 0, 200, 0.3);
    if (armor <= 0) {
      phase = 'dead';
      showDefeat();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // MISSILE SYSTEM
  // ══════════════════════════════════════════════════════════════
  function spawnMissile(sx, sy) {
    if (missiles.length >= 3) return;
    missiles.push({
      x: sx, y: sy,
      vx: 0, vy: -70,
      tracking: true, life: 6,
      telegraphTimer: 1.0, // telegraph for 1 second before active
    });
  }

  function updateMissiles(dt) {
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];

      // Telegraph phase
      if (m.telegraphTimer > 0) {
        m.telegraphTimer -= dt;
        continue;
      }

      m.life -= dt;

      if (m.tracking && m.life > 0.5) {
        const dx = jetX - m.x;
        const dy = jetY - m.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = 110;
        const targetVX = (dx / d) * speed;
        const targetVY = (dy / d) * speed;
        const turnRate = 100 * dt;
        m.vx += Math.sign(targetVX - m.vx) * Math.min(Math.abs(targetVX - m.vx), turnRate);
        m.vy += Math.sign(targetVY - m.vy) * Math.min(Math.abs(targetVY - m.vy), turnRate);

        // Check chaff decoys
        for (let j = chaffDecoys.length - 1; j >= 0; j--) {
          const cd = chaffDecoys[j];
          const cdDist = dist(m.x, m.y, cd.x, cd.y);
          if (cdDist < 80) {
            const cdx = cd.x - m.x;
            const cdy = cd.y - m.y;
            const cdLen = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
            m.vx = (cdx / cdLen) * 120;
            m.vy = (cdy / cdLen) * 120;
            m.tracking = false;
            break;
          }
        }
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // Hit B-2
      if (dist(m.x, m.y, jetX, jetY) < 22) {
        takeDamage();
        missiles.splice(i, 1);
        continue;
      }

      // Expired or off-screen
      if (m.life <= 0 || m.y < -40 || m.y > H + 40 || m.x < -40 || m.x > W + 40) {
        if (m.life <= 0) missilesEvaded++;
        missiles.splice(i, 1);
      }
    }

    // Update chaff decoys
    for (let i = chaffDecoys.length - 1; i >= 0; i--) {
      const cd = chaffDecoys[i];
      cd.life -= dt;
      if (cd.life <= 0) chaffDecoys.splice(i, 1);
    }
  }

  function releaseChaff() {
    if (chaff <= 0) return;
    chaff--;
    chaffUsed++;
    // Reset detection partially
    detectionLevel = Math.max(0, detectionLevel - 30);

    chaffDecoys.push({
      x: jetX, y: jetY + 30,
      life: 2.5,
    });
  }

  // ══════════════════════════════════════════════════════════════
  // RADAR/SAM SPAWNING
  // ══════════════════════════════════════════════════════════════
  function spawnRadars(count) {
    for (let i = 0; i < count; i++) {
      radarCones.push({
        x: 80 + Math.random() * (W - 160),
        y: -50 - Math.random() * 200,
        angle: Math.random() * Math.PI * 2,
        sweepSpeed: 1.2 + Math.random() * 0.8,
        range: 100 + Math.random() * 60,
        detecting: false,
      });
    }
  }

  function spawnSAMs(count) {
    for (let i = 0; i < count; i++) {
      const spacing = (W - 200) / (count + 1);
      samSites.push({
        x: 100 + spacing * (i + 1) + (Math.random() - 0.5) * 60,
        y: -80 - Math.random() * 200,
        cooldown: 5 + Math.random() * 2,
        timer: i * 2.5,
        active: true,
        telegraphing: false,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: TAKEOFF (cinematic, ~7.5 seconds)
  // ══════════════════════════════════════════════════════════════
  function updateTakeoff(dt) {
    takeoffTimer += dt;
    const t = takeoffTimer;

    if (t < 3) takeoffStage = 0;
    else if (t < 5) takeoffStage = 1;
    else if (t < 7.5) takeoffStage = 2;
    else takeoffStage = 3;

    // Zoom out
    if (takeoffStage >= 1 && takeoffStage < 3) {
      const zoomProgress = Math.min(1, (t - 3) / 2);
      takeoffScale = 1.8 - 0.8 * zoomProgress;
    }

    // Screen shake
    if (takeoffStage >= 1 && takeoffStage < 3) {
      k.shake(1 + (t - 3) * 0.5);
    }

    // B-2 accelerates forward (scrolls runway)
    if (takeoffStage >= 2) {
      const rollT = t - 5;
      takeoffSpeed = Math.min(600, 20 * rollT * rollT + 30 * rollT);
      takeoffRunwayOffset += takeoffSpeed * dt;
    }

    // Transition to flight
    if (takeoffStage === 3) {
      const liftT = t - 7.5;
      if (liftT > 2.2) {
        startFlight();
      }
    }
  }

  function drawTakeoff() {
    const t = takeoffTimer;
    const cx = W / 2;
    const scale = takeoffScale;

    // Dark background
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(10, 10, 18) });

    // Runway (top-down)
    const rwLeft = cx - 50 * scale;
    const rwRight = cx + 50 * scale;
    k.drawRect({
      pos: k.vec2(rwLeft, 0), width: rwRight - rwLeft, height: H,
      color: k.rgb(26, 26, 26),
    });

    // Edge lines
    k.drawLine({ p1: k.vec2(rwLeft, 0), p2: k.vec2(rwLeft, H), color: k.rgb(85, 85, 85), width: 2 * scale });
    k.drawLine({ p1: k.vec2(rwRight, 0), p2: k.vec2(rwRight, H), color: k.rgb(85, 85, 85), width: 2 * scale });

    // Dashed center line (scrolling)
    const dashLen = 30 * scale;
    const gapLen = 20 * scale;
    const dashOff = (takeoffRunwayOffset * scale) % (dashLen + gapLen);
    for (let y = -dashLen + dashOff; y < H; y += dashLen + gapLen) {
      k.drawLine({
        p1: k.vec2(cx, y), p2: k.vec2(cx, Math.min(y + dashLen, H)),
        color: k.rgb(255, 255, 0), width: 2 * scale, opacity: 0.7,
      });
    }

    // Runway edge lights (scrolling)
    const lightSpacing = 60 * scale;
    const lightOff = (takeoffRunwayOffset * scale) % lightSpacing;
    for (let y = -lightSpacing + lightOff; y < H; y += lightSpacing) {
      const brightness = 0.6 + Math.sin(t * 3 + y * 0.01) * 0.2;
      k.drawCircle({ pos: k.vec2(rwLeft - 6 * scale, y), radius: 2 * scale, color: k.rgb(255, 255, 255), opacity: brightness });
      k.drawCircle({ pos: k.vec2(rwRight + 6 * scale, y), radius: 2 * scale, color: k.rgb(255, 255, 255), opacity: brightness });
    }

    // B-2 shape (top-down, nose points up)
    const bs = scale * (takeoffStage === 3 ? Math.max(0.4, 1 - (t - 7.5) * 0.4) : 1);
    const bx = cx;
    const by = H / 2 + 60;

    drawB2TopDown(bx, by, bs, 0);

    // Engine glow (builds with stage)
    const engPulse = Math.sin(t * 12) * 0.2 + 0.8;
    let engAlpha = 0.3;
    let engR = 4;
    if (takeoffStage >= 1) {
      const intensify = Math.min(1, (t - 3) / 2);
      engAlpha = 0.3 + 0.5 * intensify * engPulse;
      engR = 4 + 8 * intensify;
    }
    k.drawCircle({ pos: k.vec2(bx - 14 * bs, by + 16 * bs), radius: engR * bs, color: k.rgb(255, 68, 0), opacity: engAlpha });
    k.drawCircle({ pos: k.vec2(bx + 14 * bs, by + 16 * bs), radius: engR * bs, color: k.rgb(255, 68, 0), opacity: engAlpha });
    k.drawCircle({ pos: k.vec2(bx - 14 * bs, by + 16 * bs), radius: 3 * bs, color: k.rgb(255, 136, 0), opacity: 0.7 * engPulse });
    k.drawCircle({ pos: k.vec2(bx + 14 * bs, by + 16 * bs), radius: 3 * bs, color: k.rgb(255, 136, 0), opacity: 0.7 * engPulse });

    // Title
    if (takeoffStage < 3) {
      const titleAlpha = Math.min(1, t / 1.5);
      k.drawText({
        text: 'OPERATION MOUNTAIN BREAKER', pos: k.vec2(W / 2, 60),
        size: 22, font: 'monospace', color: k.rgb(170, 170, 204), anchor: 'center', opacity: titleAlpha,
      });
    } else {
      // Fade out title and blend to water
      const liftT = t - 7.5;
      const blendAlpha = Math.min(1, liftT / 2);
      k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(10, 22, 40), opacity: blendAlpha * 0.9 });
      k.drawText({
        text: 'OPERATION MOUNTAIN BREAKER', pos: k.vec2(W / 2, 60),
        size: 22, font: 'monospace', color: k.rgb(170, 170, 204), anchor: 'center',
        opacity: Math.max(0, 1 - liftT * 1.5),
      });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // SHARED: Draw B-2 from above (top-down)
  // ══════════════════════════════════════════════════════════════
  function drawB2TopDown(bx, by, scale, bankAngle) {
    const bs = scale || 1;
    const bank = (bankAngle || 0) * 0.35;
    const rightSpan = 60 + bank * 18;
    const leftSpan = 60 - bank * 18;
    const rightTrail = 40 + bank * 12;
    const leftTrail = 40 - bank * 12;
    const noseShift = bank * 3;

    // Main body
    const bodyVerts = [
      k.vec2(bx + noseShift * bs, by - 20 * bs),
      k.vec2(bx + rightSpan * bs, by + 15 * bs),
      k.vec2(bx + rightTrail * bs, by + 20 * bs),
      k.vec2(bx, by + 10 * bs),
      k.vec2(bx - leftTrail * bs, by + 20 * bs),
      k.vec2(bx - leftSpan * bs, by + 15 * bs),
    ];

    // Draw as filled triangles (fan from center)
    for (let i = 0; i < bodyVerts.length; i++) {
      const next = bodyVerts[(i + 1) % bodyVerts.length];
      k.drawTriangle({
        p1: k.vec2(bx, by),
        p2: bodyVerts[i],
        p3: next,
        fill: true,
        color: k.rgb(58, 58, 58),
      });
    }

    // Darker inner surface
    const innerVerts = [
      k.vec2(bx + noseShift * bs, by - 15 * bs),
      k.vec2(bx + (35 + bank * 8) * bs, by + 12 * bs),
      k.vec2(bx, by + 8 * bs),
      k.vec2(bx - (35 - bank * 8) * bs, by + 12 * bs),
    ];
    for (let i = 0; i < innerVerts.length; i++) {
      const next = innerVerts[(i + 1) % innerVerts.length];
      k.drawTriangle({
        p1: k.vec2(bx, by),
        p2: innerVerts[i],
        p3: next,
        fill: true,
        color: k.rgb(46, 46, 46),
        opacity: 0.6,
      });
    }

    // Panel lines
    k.drawLine({
      p1: k.vec2(bx + noseShift * bs, by - 18 * bs), p2: k.vec2(bx, by + 8 * bs),
      color: k.rgb(85, 85, 85), width: 0.5 * bs, opacity: 0.5,
    });
    k.drawLine({
      p1: k.vec2(bx - 20 * bs, by + 5 * bs), p2: k.vec2(bx + 20 * bs, by + 5 * bs),
      color: k.rgb(85, 85, 85), width: 0.5 * bs, opacity: 0.5,
    });

    // Leading edge highlight
    k.drawLine({
      p1: k.vec2(bx - (leftSpan - 2) * bs, by + 14 * bs),
      p2: k.vec2(bx + noseShift * bs, by - 19 * bs),
      color: k.rgb(74, 74, 74), width: 1 * bs, opacity: 0.6,
    });
    k.drawLine({
      p1: k.vec2(bx + noseShift * bs, by - 19 * bs),
      p2: k.vec2(bx + (rightSpan - 2) * bs, by + 14 * bs),
      color: k.rgb(74, 74, 74), width: 1 * bs, opacity: 0.6,
    });

    // Engine glow
    const engLX = bx - 14 * bs;
    const engRX = bx + 14 * bs;
    const engY = by + 16 * bs;
    const pulse = Math.sin(phaseTimer * 12) * 0.2 + 0.8;
    k.drawCircle({ pos: k.vec2(engLX, engY), radius: 7 * bs, color: k.rgb(255, 68, 0), opacity: 0.25 * pulse });
    k.drawCircle({ pos: k.vec2(engRX, engY), radius: 7 * bs, color: k.rgb(255, 68, 0), opacity: 0.25 * pulse });
    k.drawCircle({ pos: k.vec2(engLX, engY), radius: 3 * bs, color: k.rgb(255, 136, 0), opacity: 0.7 * pulse });
    k.drawCircle({ pos: k.vec2(engRX, engY), radius: 3 * bs, color: k.rgb(255, 136, 0), opacity: 0.7 * pulse });
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: FLIGHT (~20 seconds)
  // ══════════════════════════════════════════════════════════════
  function startFlight() {
    phase = 'flight';
    phaseTimer = 0;
    detectionLevel = 0;
    terrainOffset = 0;
    terrainSpeed = TERRAIN_SPEED;
    jetX = W / 2;
    jetY = H * 0.65;
    jetBankAngle = 0;
    missiles = [];
    chaffDecoys = [];
    radarCones = [];
    samSites = [];

    spawnRadars(3);
    spawnSAMs(2);

    setHUDVisible(true);
    instrText.text = 'ARROWS to move -- Avoid radar zones -- C for chaff';
  }

  function updateFlight(dt) {
    phaseTimer += dt;
    const t = phaseTimer;

    // Player movement
    if (k.isKeyDown('left') || k.isKeyDown('a')) jetX -= B2_MOVE_SPEED * dt;
    if (k.isKeyDown('right') || k.isKeyDown('d')) jetX += B2_MOVE_SPEED * dt;
    if (k.isKeyDown('up') || k.isKeyDown('w')) jetY -= B2_MOVE_SPEED * dt;
    if (k.isKeyDown('down') || k.isKeyDown('s')) jetY += B2_MOVE_SPEED * dt;
    jetX = clamp(jetX, B2_MARGIN, W - B2_MARGIN);
    jetY = clamp(jetY, B2_MARGIN + 40, H - B2_MARGIN);

    // Visual bank
    if (k.isKeyDown('left') || k.isKeyDown('a')) jetBankAngle += (-1 - jetBankAngle) * 5 * dt;
    else if (k.isKeyDown('right') || k.isKeyDown('d')) jetBankAngle += (1 - jetBankAngle) * 5 * dt;
    else jetBankAngle += (0 - jetBankAngle) * 3 * dt;

    // HUD altitude/speed
    const altMeters = Math.round(12000 - (jetY / H) * 3000);
    const spdKts = Math.round(450 + Math.abs(jetBankAngle) * 20);
    hudAlt.text = `ALT: ${altMeters}m`;
    hudSpeed.text = `SPD: ${spdKts} kts`;

    // Chaff key
    if (k.isKeyPressed('c')) releaseChaff();

    // Scroll terrain
    terrainOffset += terrainSpeed * dt;

    // Scroll radars and SAMs
    for (const r of radarCones) {
      r.y += terrainSpeed * dt;
      r.angle += r.sweepSpeed * dt;
    }
    for (const sam of samSites) {
      sam.y += terrainSpeed * dt;
      sam.timer += dt;
    }

    // Remove off-screen, spawn new
    radarCones = radarCones.filter(r => r.y < H + 100);
    samSites = samSites.filter(s => s.y < H + 100);
    if (t > 4 && Math.random() < 0.4 * dt) spawnRadars(1);
    if (t > 6 && Math.random() < 0.25 * dt) spawnSAMs(1);

    // Detection logic
    detectionLevel = Math.max(0, detectionLevel - 8 * dt);
    for (const r of radarCones) {
      r.detecting = false;
      const dx = jetX - r.x;
      const dy = jetY - r.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(((angle - r.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (d < r.range && angleDiff < 0.5) {
        detectionLevel += 25 * dt;
        r.detecting = true;
      }
    }

    // SAM firing
    for (const sam of samSites) {
      if (sam.active && sam.y > 0 && sam.y < H && detectionLevel > 40
          && sam.timer >= sam.cooldown && !sam.telegraphing) {
        sam.telegraphing = true;
        const samRef = sam;
        k.wait(1, () => {
          samRef.timer = 0;
          samRef.telegraphing = false;
          if (phase === 'dead' || phase === 'victory') return;
          spawnMissile(samRef.x, samRef.y);
        });
      }
    }

    maxDetection = Math.max(maxDetection, detectionLevel);

    // Detection overload
    if (detectionLevel >= 100) {
      detectionLevel = 40;
      let nearestSam = null;
      let nearDist = Infinity;
      for (const sam of samSites) {
        if (!sam.active || sam.y < 0 || sam.y > H) continue;
        const d = dist(sam.x, sam.y, jetX, jetY);
        if (d < nearDist) { nearDist = d; nearestSam = sam; }
      }
      if (nearestSam) spawnMissile(nearestSam.x, nearestSam.y);
      takeDamage();
    }

    // Terrain transition messages
    if (t >= 7 && t < 7.1) {
      instrText.text = 'Crossing coastline -- Entering hostile territory';
      instrText.color = k.rgb(255, 170, 0);
    }
    if (t >= 12 && t < 12.1) {
      instrText.text = 'Over enemy land -- Heavy air defense ahead';
      instrText.color = k.rgb(255, 102, 102);
      spawnRadars(2);
      spawnSAMs(2);
    }

    // Distance HUD
    const distKm = Math.max(0, Math.round(200 * (1 - t / 20)));
    hudDist.text = `TARGET: ${distKm} km`;

    // Detection text
    const det = Math.min(100, Math.max(0, detectionLevel));
    hudDetect.text = `DETECTION: ${Math.round(det)}%`;
    hudDetect.color = det > 60 ? k.rgb(255, 68, 68) : k.rgb(170, 170, 170);

    updateMissiles(dt);
    updateHUD();

    // Transition to bombing at 20s
    if (t >= 20) {
      missiles = [];
      radarCones = [];
      samSites = [];
      chaffDecoys = [];
      startBombing();
    }
  }

  function drawFlightTerrain(t) {
    const offset = terrainOffset;

    if (t < 7) {
      // ── SEA (dark blue water at night) ──
      k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(10, 22, 40) });

      // Stars (parallax 0.05x)
      const starOffset = offset * 0.05;
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 197 + 53) % W);
        const sy = ((i * 139 + 17 + starOffset) % (H + 20)) - 10;
        const twinkle = 0.15 + Math.sin(t * 2.5 + i * 1.7) * 0.1;
        k.drawRect({ pos: k.vec2(sx, sy), width: 1, height: 1, color: k.rgb(255, 255, 255), opacity: twinkle });
      }

      // Moon
      k.drawCircle({ pos: k.vec2(W * 0.8, 50), radius: 20, color: k.rgb(136, 153, 170), opacity: 0.15 });

      // Wave lines (3-layer parallax)
      const waveLayers = [
        { spacing: 80, alpha: 0.25, width: 1 },
        { spacing: 60, alpha: 0.35, width: 1.5 },
        { spacing: 40, alpha: 0.4, width: 1.5 },
      ];
      for (const wl of waveLayers) {
        const waveOff = offset % wl.spacing;
        for (let y = -wl.spacing + waveOff; y < H + wl.spacing; y += wl.spacing) {
          for (let x = 0; x < W - 16; x += 16) {
            const wy = y + Math.sin(x * 0.04 + t * 1.5) * 3;
            const wy2 = y + Math.sin((x + 16) * 0.04 + t * 1.5) * 3;
            k.drawLine({ p1: k.vec2(x, wy), p2: k.vec2(x + 16, wy2), color: k.rgb(26, 42, 72), width: wl.width, opacity: wl.alpha });
          }
        }
      }

      // Foam (parallax 1.3x)
      const foamOff = offset * 1.3;
      for (let fi = 0; fi < 6; fi++) {
        const ffx = ((fi * 179 + 31) % W);
        const ffy = ((fi * 223 + 70 + foamOff) % (H + 60)) - 30;
        k.drawCircle({ pos: k.vec2(ffx, ffy), radius: 4 + (fi % 3), color: k.rgb(58, 90, 122), opacity: 0.15 });
      }

      // Boats
      for (let i = 0; i < 6; i++) {
        const bx = ((i * 263 + 80 + Math.floor(offset * 0.05)) % W);
        const by = ((i * 181 + 120 + Math.floor(offset * 0.3)) % (H - 50)) + 50;
        const hullLen = i % 3 === 0 ? 12 : 6;
        k.drawTriangle({
          p1: k.vec2(bx, by - 3), p2: k.vec2(bx - hullLen, by + 2), p3: k.vec2(bx + hullLen, by + 2),
          fill: true, color: k.rgb(42, 58, 90), opacity: 0.25,
        });
        if (i % 2 === 0) {
          k.drawCircle({ pos: k.vec2(bx, by - 1), radius: 1, color: k.rgb(255, 238, 136), opacity: 0.3 });
        }
      }

      // Moonlight reflection
      for (let mr = 0; mr < 12; mr++) {
        const shimmer = 0.06 + Math.sin(t * 1.2 + mr * 0.6) * 0.03;
        const mx = W * 0.8 + Math.sin(t * 0.3 + mr * 0.4) * 30;
        const my = ((mr * 45 + offset * 0.2) % (H + 40)) - 20;
        k.drawRect({ pos: k.vec2(mx - 2, my), width: 5, height: 10 + mr % 3 * 4, color: k.rgb(58, 74, 106), opacity: shimmer });
      }

    } else if (t < 12) {
      // ── COAST TRANSITION ──
      const coastProgress = (t - 7) / 5;
      const landH = H * coastProgress;

      // Land at top
      k.drawRect({ pos: k.vec2(0, 0), width: W, height: landH, color: k.rgb(42, 30, 16) });

      // Vegetation
      if (coastProgress > 0.2) {
        const vegColors = [k.rgb(26, 58, 26), k.rgb(42, 74, 42), k.rgb(26, 42, 26)];
        for (let i = 0; i < 15; i++) {
          const vx = (i * 127 + Math.floor(offset * 0.1)) % W;
          const vy = ((i * 89 + Math.floor(offset * 0.3)) % Math.max(1, landH));
          if (vy < landH) {
            k.drawCircle({ pos: k.vec2(vx, vy), radius: 2 + (i % 5), color: vegColors[i % 3], opacity: 0.4 });
          }
        }
      }

      // Beach strip
      const beachY = landH;
      const beachH = 20 + coastProgress * 15;
      k.drawRect({ pos: k.vec2(0, beachY), width: W, height: beachH, color: k.rgb(138, 122, 90), opacity: 0.8 });

      // Palm trees
      if (coastProgress > 0.3) {
        for (let pi = 0; pi < 6; pi++) {
          const px = ((pi * 167 + Math.floor(offset * 0.1)) % W);
          const py = beachY - 2;
          k.drawLine({ p1: k.vec2(px, py), p2: k.vec2(px + 2, py - 14), color: k.rgb(26, 58, 26), width: 1.5, opacity: 0.35 });
          k.drawCircle({ pos: k.vec2(px + 2, py - 16), radius: 6, color: k.rgb(26, 58, 26), opacity: 0.35 });
          k.drawCircle({ pos: k.vec2(px - 2, py - 18), radius: 4, color: k.rgb(26, 58, 26), opacity: 0.35 });
        }
      }

      // Water at bottom
      const waterTop = beachY + beachH;
      k.drawRect({ pos: k.vec2(0, waterTop), width: W, height: H - waterTop, color: k.rgb(10, 22, 40) });
      // Waves
      for (let y = waterTop; y < H + 40; y += 40) {
        for (let x = 0; x < W - 16; x += 16) {
          const wy = y + Math.sin(x * 0.04 + t * 1.5) * 3;
          const wy2 = y + Math.sin((x + 16) * 0.04 + t * 1.5) * 3;
          k.drawLine({ p1: k.vec2(x, wy), p2: k.vec2(x + 16, wy2), color: k.rgb(26, 42, 72), width: 1, opacity: 0.3 });
        }
      }

    } else {
      // ── LAND (desert/brown) ──
      // Gradient
      for (let gs = 0; gs < 8; gs++) {
        const gy = (gs / 8) * H;
        const gh = H / 8 + 1;
        const lerp = gs / 8;
        const r = Math.round(26 + lerp * (42 - 26));
        const g = Math.round(20 + lerp * (30 - 20));
        const b = Math.round(8 + lerp * (16 - 8));
        k.drawRect({ pos: k.vec2(0, gy), width: W, height: gh, color: k.rgb(r, g, b) });
      }

      // Terrain patches
      const patchColors = [k.rgb(42, 32, 24), k.rgb(48, 36, 24), k.rgb(38, 28, 16)];
      for (let pi = 0; pi < 12; pi++) {
        const px = ((pi * 83 + 37) % W);
        const py = ((pi * 131 + 19 + offset * 0.3) % (H + 80)) - 40;
        k.drawRect({ pos: k.vec2(px, py), width: 30 + (pi % 4) * 15, height: 20 + (pi % 3) * 10, color: patchColors[pi % 3], opacity: 0.25 });
      }

      // Roads
      const roadOff = offset % H;
      for (const road of flightRoads) {
        k.drawLine({ p1: k.vec2(road.x, 0), p2: k.vec2(road.x, H), color: k.rgb(58, 58, 58), width: 3, opacity: 0.5 });
        const dashOff = roadOff % 20;
        for (let y = -20 + dashOff; y < H; y += 20) {
          k.drawLine({ p1: k.vec2(road.x, y), p2: k.vec2(road.x, y + 10), color: k.rgb(85, 85, 85), width: 1, opacity: 0.3 });
        }
      }

      // Buildings
      for (const b of flightBuildings) {
        const by = ((b.yBase + offset) % (H + 200)) - 100;
        if (by > -20 && by < H + 20) {
          k.drawRect({ pos: k.vec2(b.x, by), width: b.w, height: b.h, color: k.rgb(b.shade, b.shade, b.shade + 5), opacity: 0.6 });
          // Shadow
          k.drawRect({ pos: k.vec2(b.x + 2, by + 2), width: b.w, height: b.h, color: k.rgb(0, 0, 0), opacity: 0.15 });
          // Lit windows on bigger buildings
          if (b.w > 10 && b.h > 8) {
            k.drawRect({ pos: k.vec2(b.x + 2, by + 2), width: 2, height: 2, color: k.rgb(255, 238, 136), opacity: 0.15 });
          }
        }
      }

      // Mosques
      const mosques = [{ x: 200, yBase: 120 }, { x: 600, yBase: 300 }, { x: 400, yBase: 50 }];
      for (const m of mosques) {
        const my = ((m.yBase + offset) % (H + 200)) - 100;
        if (my > -20 && my < H + 20) {
          k.drawRect({ pos: k.vec2(m.x - 5, my), width: 10, height: 12, color: k.rgb(74, 58, 40), opacity: 0.4 });
          k.drawCircle({ pos: k.vec2(m.x, my), radius: 6, color: k.rgb(74, 58, 40), opacity: 0.4 });
          k.drawRect({ pos: k.vec2(m.x + 8, my - 6), width: 2, height: 18, color: k.rgb(74, 58, 40), opacity: 0.4 });
        }
      }

      // Horizontal roads
      const hRoadOff = offset % 300;
      for (let y = -300 + hRoadOff; y < H + 50; y += 300) {
        k.drawLine({ p1: k.vec2(0, y), p2: k.vec2(W, y), color: k.rgb(58, 58, 58), width: 2, opacity: 0.3 });
      }

      // Dust haze at bottom
      k.drawRect({ pos: k.vec2(0, H - 40), width: W, height: 40, color: k.rgb(74, 58, 40), opacity: 0.1 });
    }
  }

  function drawFlightOverlay(t) {
    // Radar sweep cones
    for (const r of radarCones) {
      if (r.y < -50 || r.y > H + 50) continue;
      const detecting = r.detecting;
      const color = detecting ? k.rgb(255, 68, 0) : k.rgb(0, 255, 0);
      const baseAlpha = detecting ? 0.15 : 0.06;

      // Cone (as 3 triangles to approximate pie slice)
      const a = r.angle;
      const hw = 0.5;
      k.drawTriangle({
        p1: k.vec2(r.x, r.y),
        p2: k.vec2(r.x + Math.cos(a - hw) * r.range, r.y + Math.sin(a - hw) * r.range),
        p3: k.vec2(r.x + Math.cos(a) * r.range, r.y + Math.sin(a) * r.range),
        fill: true, color: color, opacity: baseAlpha,
      });
      k.drawTriangle({
        p1: k.vec2(r.x, r.y),
        p2: k.vec2(r.x + Math.cos(a) * r.range, r.y + Math.sin(a) * r.range),
        p3: k.vec2(r.x + Math.cos(a + hw) * r.range, r.y + Math.sin(a + hw) * r.range),
        fill: true, color: color, opacity: baseAlpha,
      });

      // Sweep line
      k.drawLine({
        p1: k.vec2(r.x, r.y),
        p2: k.vec2(r.x + Math.cos(a) * r.range, r.y + Math.sin(a) * r.range),
        color: color, width: 1, opacity: detecting ? 0.6 : 0.3,
      });

      // Radar dish dot
      k.drawCircle({ pos: k.vec2(r.x, r.y), radius: 4, color: color, opacity: 0.5 });

      if (detecting) {
        const pulseR = 8 + Math.sin(phaseTimer * 10) * 3;
        k.drawCircle({ pos: k.vec2(r.x, r.y), radius: pulseR, color: k.rgb(255, 0, 0), opacity: 0.3 });
      }
    }

    // SAM markers
    for (const sam of samSites) {
      if (sam.y < -20 || sam.y > H + 20) continue;
      const isTelegraphing = sam.telegraphing;
      const samColor = isTelegraphing ? k.rgb(255, 0, 0) : (detectionLevel > 40 ? k.rgb(255, 68, 68) : k.rgb(136, 136, 136));
      const alertLevel = isTelegraphing ? 0.9 : (detectionLevel > 40 ? 0.6 : 0.3);
      const pulseScale = isTelegraphing ? 1.5 + Math.sin(phaseTimer * 15) * 0.5 : 1;

      k.drawTriangle({
        p1: k.vec2(sam.x, sam.y - 8 * pulseScale),
        p2: k.vec2(sam.x - 5 * pulseScale, sam.y + 4 * pulseScale),
        p3: k.vec2(sam.x + 5 * pulseScale, sam.y + 4 * pulseScale),
        fill: true, color: samColor, opacity: alertLevel,
      });

      if (detectionLevel > 40 || isTelegraphing) {
        const pr = (isTelegraphing ? 10 : 6) + Math.sin(phaseTimer * (isTelegraphing ? 12 : 6)) * 3;
        k.drawCircle({ pos: k.vec2(sam.x, sam.y), radius: pr, color: k.rgb(255, 0, 0), opacity: isTelegraphing ? 0.5 : 0.25 });
      }
    }

    // Missiles
    for (const m of missiles) {
      if (m.telegraphTimer > 0) {
        // Telegraph: red flashing circle
        const flashAlpha = 0.3 + Math.sin(phaseTimer * 15) * 0.2;
        k.drawCircle({ pos: k.vec2(m.x, m.y), radius: 14, color: k.rgb(255, 0, 0), opacity: flashAlpha });
      } else {
        // Active missile
        k.drawCircle({ pos: k.vec2(m.x, m.y), radius: 4, color: k.rgb(255, 51, 51) });
        k.drawCircle({ pos: k.vec2(m.x, m.y), radius: 8, color: k.rgb(255, 0, 0), opacity: 0.4 });
        // Tracking line
        if (m.tracking) {
          const d = dist(m.x, m.y, jetX, jetY);
          const lineAlpha = Math.min(0.25, 0.4 * (1 - d / 400));
          if (lineAlpha > 0.02) {
            k.drawLine({ p1: k.vec2(m.x, m.y), p2: k.vec2(jetX, jetY), color: k.rgb(255, 34, 34), width: 1, opacity: lineAlpha });
          }
        }
      }
    }

    // Chaff decoys
    for (const cd of chaffDecoys) {
      k.drawCircle({ pos: k.vec2(cd.x, cd.y), radius: 5, color: k.rgb(255, 255, 0), opacity: cd.life / 2.5 });
    }

    // Red border glow when detection > 60%
    if (detectionLevel > 60) {
      const alpha = 0.05 + (detectionLevel / 100) * 0.15;
      k.drawRect({ pos: k.vec2(0, 0), width: W, height: 8, color: k.rgb(255, 0, 0), opacity: alpha });
      k.drawRect({ pos: k.vec2(0, H - 8), width: W, height: 8, color: k.rgb(255, 0, 0), opacity: alpha });
      k.drawRect({ pos: k.vec2(0, 0), width: 8, height: H, color: k.rgb(255, 0, 0), opacity: alpha });
      k.drawRect({ pos: k.vec2(W - 8, 0), width: 8, height: H, color: k.rgb(255, 0, 0), opacity: alpha });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: BOMBING (multi-pass)
  // ══════════════════════════════════════════════════════════════
  function startBombing() {
    phase = 'bombing';
    phaseTimer = 0;
    bombObjects = [];
    missileSpawnTimer = 0;
    bombingEnded = false;
    terrainSpeed = 0;

    mountainHP = MOUNTAIN_LAYERS;
    mountainLayerHP = [];
    for (let i = 0; i < MOUNTAIN_LAYERS; i++) mountainLayerHP.push(true);
    layersDestroyed = 0;

    passNumber = 1;
    passDir = 1;
    bombsThisPass = bombsPerPass;
    jetX = -40;
    jetY = 100;
    jetVY = 0;
    jetBankAngle = 0;
    bombCooldown = 0;
    bustersUsed = 0;
    samWarning = false;
    samWarningTimer = 0;

    instrText.text = `PASS 1/${maxPasses} -- UP/DOWN: Altitude | SPACE: Drop Bomb`;
    instrText.color = k.rgb(0, 255, 102);

    // Hide detection bar elements (not needed during bombing)
    hudDetect.opacity = 0;
  }

  function updateBombing(dt) {
    phaseTimer += dt;
    const BOMB_GRAVITY = 400;
    const HIT_RADIUS = 70;
    const MIN_ALT = 70;
    const MAX_ALT = H * 0.28;

    // Between-pass pause
    if (passPaused) {
      passPauseTimer -= dt;
      if (passPauseTimer <= 0) {
        passPaused = false;
        passNumber++;
        if (passNumber > maxPasses) {
          if (!bombingEnded && mountainHP > 0) {
            bombingEnded = true;
            instrText.text = 'ALL PASSES COMPLETE -- MISSION FAILED';
            instrText.color = k.rgb(255, 68, 68);
            k.wait(2, () => {
              phase = 'dead';
              showDefeat();
            });
          }
          return;
        }
        passDir *= -1;
        bombsThisPass = bombsPerPass;
        jetX = passDir === 1 ? -40 : W + 40;
        jetVY = 0;
        instrText.text = `PASS ${passNumber}/${maxPasses} -- UP/DOWN: Altitude | SPACE: Drop Bomb`;
      }
      updateFallingBombs(dt, BOMB_GRAVITY, HIT_RADIUS, MIN_ALT);
      hudDist.text = `LAYERS: ${mountainHP}/${MOUNTAIN_LAYERS} | PASS ${passNumber}/${maxPasses} | CHAFF: ${chaff}`;
      return;
    }

    // Auto horizontal movement
    jetX += passSpeed * passDir * dt;

    // Player controls altitude only
    if (k.isKeyDown('up') || k.isKeyDown('w')) {
      jetVY += (-140 - jetVY) * 3 * dt;
    } else if (k.isKeyDown('down') || k.isKeyDown('s')) {
      jetVY += (140 - jetVY) * 3 * dt;
    } else {
      jetVY += (0 - jetVY) * 2.5 * dt;
    }
    jetVY = clamp(jetVY, -160, 160);
    jetY += jetVY * dt;
    jetY = clamp(jetY, MIN_ALT, MAX_ALT);

    // Tilt based on climb/dive
    jetBankAngle = clamp(jetVY / 160, -1, 1) * 12;

    // SPACE = drop bomb
    if (bombCooldown > 0) bombCooldown -= dt;
    if (k.isKeyPressed('space') && bombsThisPass > 0 && bombCooldown <= 0) {
      bombsThisPass--;
      bustersUsed++;
      bombCooldown = 0.35;

      const altFactor = (jetY - MIN_ALT) / (MAX_ALT - MIN_ALT);
      const spread = altFactor * 30;
      const drift = (Math.random() - 0.5) * spread;

      bombObjects.push({
        x: jetX, y: jetY + 15,
        vx: passSpeed * passDir * 0.3 + drift,
        vy: 0,
      });
    }

    // Chaff during SAM warning
    if (k.isKeyPressed('c') && samWarning && chaff > 0) {
      chaff--;
      chaffUsed++;
      samWarning = false;
      missileSpawnTimer = 0;
    }

    // Update falling bombs
    updateFallingBombs(dt, BOMB_GRAVITY, HIT_RADIUS, MIN_ALT);

    // Check end of pass
    const offScreen = passDir === 1 ? jetX > W + 50 : jetX < -50;
    if (offScreen) {
      passPaused = true;
      passPauseTimer = 1.2;
      instrText.text = 'BANKING FOR NEXT PASS...';
    }

    // SAM warnings every 7 seconds
    missileSpawnTimer += dt;
    if (missileSpawnTimer >= 7 && !samWarning) {
      samWarning = true;
      samWarningTimer = 2.5;
    }
    if (samWarning) {
      samWarningTimer -= dt;
      if (samWarningTimer <= 0) {
        samWarning = false;
        missileSpawnTimer = 0;
        k.shake(12);
        jetVY = 80; // force dive
      }
    }

    // Altitude HUD
    const altPct = Math.round((1 - (jetY - MIN_ALT) / (MAX_ALT - MIN_ALT)) * 100);
    const altLabel = altPct > 70 ? 'HIGH (safe)' : altPct > 35 ? 'MED' : 'LOW (accurate!)';
    hudDist.text = `LAYERS: ${mountainHP}/${MOUNTAIN_LAYERS} | PASS ${passNumber}/${maxPasses} | BOMBS: ${bombsThisPass} | ALT: ${altLabel}`;
    updateHUD();
  }

  function updateFallingBombs(dt, gravity, hitRadius, minAlt) {
    for (let i = bombObjects.length - 1; i >= 0; i--) {
      const b = bombObjects[i];
      b.vy += gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Hit mountain target
      if (b.y >= mtnTargetY - 20) {
        const distToTarget = Math.abs(b.x - mtnCenterX);
        bombObjects.splice(i, 1);

        if (distToTarget < hitRadius) {
          // HIT
          const layerIdx = layersDestroyed;
          if (layerIdx < MOUNTAIN_LAYERS && mountainLayerHP[layerIdx]) {
            mountainLayerHP[layerIdx] = false;
            mountainHP--;
            layersDestroyed++;
          }
          k.shake(10 + layersDestroyed * 3);
          screenFlash(k, 255, 136, 0, 200, 0.3);
          impactParticles(k, mtnCenterX, mtnTargetY, 12, [[255, 136, 0], [255, 200, 0], [255, 68, 0]]);

          // WIN
          if (mountainHP <= 0 && !mtnBunkerHit) {
            mtnBunkerHit = true;
            k.wait(0.8, () => startMountainExplosion());
            return;
          }
        } else {
          // MISS
          impactParticles(k, b.x, b.y, 6, [[255, 102, 0], [255, 136, 0]]);
          k.shake(4);
        }
        continue;
      }

      // Off-screen
      if (b.y > H + 20 || b.x < -30 || b.x > W + 30) {
        bombObjects.splice(i, 1);
      }
    }
  }

  function drawBombing(t) {
    // ── THERMAL/IR CAMERA VIEW ──
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(10, 18, 10) });

    // Scanlines
    for (let y = 0; y < H; y += 3) {
      k.drawRect({ pos: k.vec2(0, y), width: W, height: 1, color: k.rgb(0, 0, 0), opacity: 0.15 });
    }

    // Noise/grain
    for (let i = 0; i < 30; i++) {
      k.drawRect({
        pos: k.vec2(Math.random() * W, Math.random() * H),
        width: 1, height: 1, color: k.rgb(0, 255, 0), opacity: 0.03 + Math.random() * 0.04,
      });
    }

    // Mountain (thermal view)
    const mCX = mtnCenterX;
    const mY = mtnTargetY;

    // Outer mountain mass
    k.drawCircle({ pos: k.vec2(mCX, mY), radius: 90, color: k.rgb(26, 58, 26), opacity: 0.7 });
    // Inner ridge
    k.drawCircle({ pos: k.vec2(mCX, mY), radius: 55, color: k.rgb(42, 90, 42), opacity: 0.5 });

    // Bunker entrance (HOT)
    k.drawRect({ pos: k.vec2(mCX - 11, mY - 11), width: 22, height: 22, color: k.rgb(68, 255, 68), opacity: 0.7 });

    // Heat signature rings
    k.drawCircle({ pos: k.vec2(mCX, mY), radius: 30, color: k.rgb(34, 170, 34), opacity: 0.15 });
    k.drawCircle({ pos: k.vec2(mCX, mY), radius: 50, color: k.rgb(34, 170, 34), opacity: 0.1 });

    // Facility hot spots
    const hotSpots = [
      { x: mCX + 60, y: mY - 30, r: 6 },
      { x: mCX - 55, y: mY + 25, r: 5 },
      { x: mCX + 30, y: mY + 55, r: 4 },
      { x: mCX - 40, y: mY - 50, r: 5 },
    ];
    for (const hs of hotSpots) {
      k.drawCircle({ pos: k.vec2(hs.x, hs.y), radius: hs.r, color: k.rgb(51, 204, 51), opacity: 0.4 });
    }

    // Layer indicators
    for (let i = 0; i < MOUNTAIN_LAYERS; i++) {
      const layerR = 35 + i * 12;
      if (mountainLayerHP[i]) {
        // Intact layer
        k.drawCircle({ pos: k.vec2(mCX, mY), radius: layerR, color: k.rgb(0, 170, 68), opacity: 0.2 - i * 0.03 });
      } else {
        // Destroyed layer (dashed ring approximation)
        for (let a = 0; a < Math.PI * 2; a += 0.8) {
          const x1 = mCX + Math.cos(a) * layerR;
          const y1 = mY + Math.sin(a) * layerR;
          const x2 = mCX + Math.cos(a + 0.3) * layerR;
          const y2 = mY + Math.sin(a + 0.3) * layerR;
          k.drawLine({ p1: k.vec2(x1, y1), p2: k.vec2(x2, y2), color: k.rgb(255, 68, 0), width: 1, opacity: 0.15 });
        }
      }
    }

    // B-2 (side view silhouette flying across)
    const jx = jetX;
    const jy = jetY;
    const dir = passDir;

    k.drawTriangle({
      p1: k.vec2(jx + 22 * dir, jy),
      p2: k.vec2(jx - 5 * dir, jy - 14),
      p3: k.vec2(jx - 20 * dir, jy),
      fill: true, color: k.rgb(102, 255, 102), opacity: 0.85,
    });
    k.drawTriangle({
      p1: k.vec2(jx + 22 * dir, jy),
      p2: k.vec2(jx - 20 * dir, jy),
      p3: k.vec2(jx - 5 * dir, jy + 10),
      fill: true, color: k.rgb(102, 255, 102), opacity: 0.85,
    });
    // Cockpit
    k.drawCircle({ pos: k.vec2(jx + 16 * dir, jy), radius: 3, color: k.rgb(170, 255, 170), opacity: 0.6 });
    // Engine glow
    k.drawCircle({ pos: k.vec2(jx - 20 * dir, jy - 2), radius: 3, color: k.rgb(204, 255, 204), opacity: 0.5 });
    k.drawCircle({ pos: k.vec2(jx - 20 * dir, jy + 2), radius: 3, color: k.rgb(204, 255, 204), opacity: 0.5 });

    // Altitude indicator line
    const altPct = (jy - 70) / (H * 0.28 - 70);
    const indicColor = altPct < 0.3 ? k.rgb(255, 68, 0) : altPct < 0.6 ? k.rgb(255, 170, 0) : k.rgb(0, 255, 0);
    k.drawLine({ p1: k.vec2(jx - 25, jy + 16), p2: k.vec2(jx + 25, jy + 16), color: indicColor, width: 1, opacity: 0.3 });

    // Aiming guide (dashed vertical line)
    for (let gy = jy + 20; gy < mY + 60; gy += 12) {
      k.drawLine({ p1: k.vec2(jx, gy), p2: k.vec2(jx, Math.min(gy + 6, mY + 60)), color: k.rgb(0, 255, 0), width: 1, opacity: 0.12 });
    }

    // Falling bombs
    for (const b of bombObjects) {
      k.drawCircle({ pos: k.vec2(b.x, b.y), radius: 4, color: k.rgb(255, 255, 0), opacity: 0.9 });
      k.drawCircle({ pos: k.vec2(b.x, b.y), radius: 7, color: k.rgb(255, 136, 0), opacity: 0.4 });
    }

    // Pass direction arrow
    const arrowX = W / 2;
    const arrowY = 30;
    k.drawTriangle({
      p1: k.vec2(arrowX + 20 * dir, arrowY),
      p2: k.vec2(arrowX - 10 * dir, arrowY - 8),
      p3: k.vec2(arrowX - 10 * dir, arrowY + 8),
      fill: true, color: k.rgb(0, 255, 0), opacity: 0.2,
    });

    // SAM WARNING overlay
    if (samWarning) {
      const warnAlpha = 0.2 + Math.sin(t * 12) * 0.15;
      k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(255, 0, 0), opacity: warnAlpha });
      // Warning bar
      k.drawRect({ pos: k.vec2(W / 2 - 60, 50), width: 120, height: 20, color: k.rgb(255, 0, 0), opacity: 0.5 + Math.sin(t * 10) * 0.3 });
      k.drawText({
        text: 'SAM INCOMING -- C: CHAFF', pos: k.vec2(W / 2, 60),
        size: 10, font: 'monospace', color: k.rgb(255, 255, 255), anchor: 'center',
      });
    }

    // Camera frame brackets
    const bLen = 30;
    const bIn = 15;
    const bColor = k.rgb(0, 255, 0);
    const bOp = 0.3;
    k.drawLine({ p1: k.vec2(bIn, bIn), p2: k.vec2(bIn + bLen, bIn), color: bColor, width: 1.5, opacity: bOp });
    k.drawLine({ p1: k.vec2(bIn, bIn), p2: k.vec2(bIn, bIn + bLen), color: bColor, width: 1.5, opacity: bOp });
    k.drawLine({ p1: k.vec2(W - bIn, bIn), p2: k.vec2(W - bIn - bLen, bIn), color: bColor, width: 1.5, opacity: bOp });
    k.drawLine({ p1: k.vec2(W - bIn, bIn), p2: k.vec2(W - bIn, bIn + bLen), color: bColor, width: 1.5, opacity: bOp });
    k.drawLine({ p1: k.vec2(bIn, H - bIn), p2: k.vec2(bIn + bLen, H - bIn), color: bColor, width: 1.5, opacity: bOp });
    k.drawLine({ p1: k.vec2(bIn, H - bIn), p2: k.vec2(bIn, H - bIn - bLen), color: bColor, width: 1.5, opacity: bOp });
    k.drawLine({ p1: k.vec2(W - bIn, H - bIn), p2: k.vec2(W - bIn - bLen, H - bIn), color: bColor, width: 1.5, opacity: bOp });
    k.drawLine({ p1: k.vec2(W - bIn, H - bIn), p2: k.vec2(W - bIn, H - bIn - bLen), color: bColor, width: 1.5, opacity: bOp });
  }

  // ══════════════════════════════════════════════════════════════
  // MOUNTAIN EXPLOSION
  // ══════════════════════════════════════════════════════════════
  function startMountainExplosion() {
    phase = 'explosion';
    explosionTimer = 0;
    explosionPhase = 0;
    explosionParticles = [];
    instrText.text = '';
    instrBg.opacity = 0;

    // White flash
    screenFlash(k, 255, 255, 255, 300, 1.0);
    k.shake(20);
  }

  function updateExplosion(dt) {
    explosionTimer += dt;

    // Expanding fireball circles (phase 0-3s)
    if (explosionTimer < 3 && explosionPhase === 0) {
      explosionPhase = 1;
    }

    // Debris (3-5s)
    if (explosionTimer > 3 && explosionPhase < 2) {
      explosionPhase = 2;
      k.shake(15);
    }

    // Smoke column (5-7s)
    if (explosionTimer > 5 && explosionPhase < 3) {
      explosionPhase = 3;
    }

    // Text + transition (7-8s)
    if (explosionTimer > 8) {
      startEscape();
    }
  }

  function drawExplosion() {
    const t = explosionTimer;
    const mCX = mtnCenterX;
    const mY = mtnTargetY;

    // Thermal background
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(10, 18, 10) });

    // Mountain remnants
    k.drawCircle({ pos: k.vec2(mCX, mY), radius: 90, color: k.rgb(26, 58, 26), opacity: Math.max(0.1, 0.7 - t * 0.08) });

    // Fireball phases
    if (t > 0.3) {
      const fireR = Math.min(200, 20 + t * 60);
      const fireAlpha = Math.max(0.1, 0.9 - t * 0.1);
      k.drawCircle({ pos: k.vec2(mCX, mY), radius: fireR, color: k.rgb(255, 100, 0), opacity: fireAlpha });
      k.drawCircle({ pos: k.vec2(mCX, mY), radius: fireR * 0.6, color: k.rgb(255, 200, 100), opacity: fireAlpha * 0.8 });
      k.drawCircle({ pos: k.vec2(mCX, mY), radius: fireR * 0.3, color: k.rgb(255, 255, 200), opacity: fireAlpha * 0.6 });
    }

    // Radiating cracks
    if (t > 2) {
      const crackAlpha = Math.max(0, 0.7 - (t - 2) * 0.15);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + (i * 0.3);
        const len = 60 + i * 8;
        let px = mCX, py = mY;
        for (let s = 0; s < 6; s++) {
          const nx = px + Math.cos(angle) * len / 6 + (Math.sin(i * 3 + s * 2) * 7);
          const ny = py + Math.sin(angle) * len / 6 + (Math.cos(i * 5 + s * 3) * 7);
          k.drawLine({ p1: k.vec2(px, py), p2: k.vec2(nx, ny), color: k.rgb(255, 170, 68), width: 2, opacity: crackAlpha });
          k.drawLine({ p1: k.vec2(px, py), p2: k.vec2(nx, ny), color: k.rgb(255, 238, 204), width: 0.8, opacity: crackAlpha * 0.6 });
          px = nx; py = ny;
        }
      }
    }

    // Debris particles
    if (t > 3) {
      for (let i = 0; i < 25; i++) {
        const angle = (i / 25) * Math.PI * 2;
        const d = (t - 3) * (80 + i * 3);
        const dx = mCX + Math.cos(angle + i * 0.2) * d;
        const dy = mY + Math.sin(angle + i * 0.2) * d;
        const alpha = Math.max(0, 0.8 - (t - 3) * 0.2);
        if (dx > -10 && dx < W + 10 && dy > -10 && dy < H + 10) {
          k.drawRect({ pos: k.vec2(dx, dy), width: 4 + i % 5, height: 3, color: k.rgb(60, 52, 40), opacity: alpha });
        }
      }
    }

    // Smoke column
    if (t > 5) {
      const smokeAlpha = Math.max(0.05, 0.4 - (t - 5) * 0.05);
      for (let i = 0; i < 8; i++) {
        const sr = 20 + i * 12 + (t - 5) * 20;
        const sx = mCX + Math.sin(t + i) * 5;
        const sy = mY + Math.cos(t + i) * 5;
        k.drawCircle({ pos: k.vec2(sx, sy), radius: sr, color: k.rgb(80, 80, 75), opacity: smokeAlpha });
      }
      // Inner orange glow
      k.drawCircle({ pos: k.vec2(mCX, mY), radius: 30 + Math.sin(t * 2) * 10, color: k.rgb(255, 102, 0), opacity: 0.3 * smokeAlpha });
    }

    // Text
    if (t > 6.5) {
      const textAlpha = Math.min(1, (t - 6.5) * 2);
      k.drawText({
        text: 'FORDOW FACILITY -- DESTROYED', pos: k.vec2(W / 2, 50),
        size: 24, font: 'monospace', color: k.rgb(0, 255, 0), anchor: 'center', opacity: textAlpha,
      });
    }

    // Scanlines (IR camera)
    for (let y = 0; y < H; y += 3) {
      k.drawRect({ pos: k.vec2(0, y), width: W, height: 1, color: k.rgb(0, 0, 0), opacity: 0.1 });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE: ESCAPE (~8 seconds cinematic)
  // ══════════════════════════════════════════════════════════════
  function startEscape() {
    phase = 'escape';
    phaseTimer = 0;
    escTimer = 0;
    escB2X = W + 80;
    escB2Y = H * 0.55;
    escBank = -0.7;

    setHUDVisible(false);
  }

  function updateEscape(dt) {
    phaseTimer += dt;
    escTimer += dt;

    escB2X -= 220 * dt;
    escB2Y = H * 0.55 + Math.sin(escTimer * 0.8) * 15;

    if (escTimer > 5) {
      escBank += (0 - escBank) * 0.5 * dt;
    }

    terrainOffset += 220 * dt;

    if (escB2X < -120 || escTimer >= 8) {
      showVictory();
    }
  }

  function drawEscape() {
    const t = escTimer;
    const offset = terrainOffset;

    // Night ocean
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(10, 22, 40) });

    // Horizon
    const horizonY = H * 0.38;
    k.drawLine({ p1: k.vec2(0, horizonY), p2: k.vec2(W, horizonY), color: k.rgb(26, 42, 72), width: 1, opacity: 0.4 });

    // Sky
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: horizonY, color: k.rgb(6, 10, 20), opacity: 0.6 });

    // Stars
    for (let i = 0; i < 20; i++) {
      const sx = (i * 137 + 50) % W;
      const sy = (i * 89 + 20) % Math.floor(horizonY - 10);
      const starAlpha = 0.3 + Math.sin(t * 2 + i) * 0.2;
      k.drawCircle({ pos: k.vec2(sx, sy), radius: 0.8, color: k.rgb(255, 255, 255), opacity: starAlpha });
    }

    // Ocean waves
    const waveOff = offset % 60;
    for (let y = horizonY; y < H + 60; y += 25) {
      const waveAlpha = 0.15 + (y - horizonY) / H * 0.2;
      for (let x = 0; x < W - 6; x += 6) {
        const amp = 4 + (y - horizonY) * 0.02;
        const wy = y + waveOff * ((y - horizonY) / H) + Math.sin(x * 0.03 + t * 1.2 + y * 0.1) * amp;
        const wy2 = y + waveOff * ((y - horizonY) / H) + Math.sin((x + 6) * 0.03 + t * 1.2 + y * 0.1) * amp;
        k.drawLine({ p1: k.vec2(x, wy), p2: k.vec2(x + 6, wy2), color: k.rgb(42, 74, 106), width: 1.5, opacity: waveAlpha });
      }
    }

    // Explosion glow fading behind (right side)
    const glowAlpha = Math.max(0.02, 0.4 - t * 0.05);
    const glowX = W + 100 - t * 30;
    k.drawCircle({ pos: k.vec2(glowX, H * 0.3), radius: 120 - t * 8, color: k.rgb(255, 68, 0), opacity: glowAlpha });

    // B-2 (flying left across screen, banked)
    const bx = escB2X;
    const by = escB2Y;
    const bank = escBank;
    const bs = 1.2;
    const upWing = -bank;
    const downWing = bank;

    // B-2 side-ish view
    k.drawTriangle({
      p1: k.vec2(bx - 25 * bs, by),
      p2: k.vec2(bx + 10 * bs, by - (55 + upWing * 25) * bs),
      p3: k.vec2(bx + 12 * bs, by),
      fill: true, color: k.rgb(58, 58, 58),
    });
    k.drawTriangle({
      p1: k.vec2(bx - 25 * bs, by),
      p2: k.vec2(bx + 12 * bs, by),
      p3: k.vec2(bx + 10 * bs, by + (55 + downWing * 25) * bs),
      fill: true, color: k.rgb(58, 58, 58),
    });

    // Engine glow
    const engX = bx + 14 * bs;
    const pulse = Math.sin(phaseTimer * 10) * 0.2 + 0.8;
    k.drawCircle({ pos: k.vec2(engX, by - 8 * bs), radius: 5 * bs, color: k.rgb(255, 68, 0), opacity: 0.3 * pulse });
    k.drawCircle({ pos: k.vec2(engX, by + 8 * bs), radius: 5 * bs, color: k.rgb(255, 68, 0), opacity: 0.3 * pulse });
    k.drawCircle({ pos: k.vec2(engX, by - 8 * bs), radius: 2 * bs, color: k.rgb(255, 136, 0), opacity: 0.7 * pulse });
    k.drawCircle({ pos: k.vec2(engX, by + 8 * bs), radius: 2 * bs, color: k.rgb(255, 136, 0), opacity: 0.7 * pulse });

    // "TARGET DESTROYED" text
    const titleAlpha = Math.min(1, t / 2);
    k.drawText({
      text: 'TARGET DESTROYED', pos: k.vec2(W / 2, H * 0.2),
      size: 28, font: 'monospace', color: k.rgb(255, 215, 0), anchor: 'center', opacity: titleAlpha,
    });
    if (t > 1) {
      const subAlpha = Math.min(0.8, (t - 1) / 2);
      k.drawText({
        text: 'Returning to base...', pos: k.vec2(W / 2, H * 0.3),
        size: 14, font: 'monospace', color: k.rgb(170, 170, 204), anchor: 'center', opacity: subAlpha,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // VICTORY / DEFEAT
  // ══════════════════════════════════════════════════════════════
  function showVictory() {
    if (phase === 'victory') return;
    phase = 'victory';
    setHUDVisible(false);

    const missionSuccess = layersDestroyed >= MOUNTAIN_LAYERS;
    const stealthRating = Math.max(0, Math.round(100 - maxDetection));

    let stars = 0;
    if (missionSuccess && stealthRating >= 70) stars = 3;
    else if (missionSuccess) stars = 2;
    else if (layersDestroyed >= 3) stars = 1;

    // Save progress
    try {
      localStorage.setItem('superzion_stars_5', String(Math.max(stars, parseInt(localStorage.getItem('superzion_stars_5') || '0'))));
      if (missionSuccess) {
        const prev = parseInt(localStorage.getItem('superzion_level_progress') || '1');
        if (6 > prev) localStorage.setItem('superzion_level_progress', '6');
      }
    } catch (e) { /* storage */ }

    const elapsed = Date.now() - startTime;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);

    k.wait(1, () => {
      k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.8), k.fixed(), k.z(500)]);

      const titleText = missionSuccess ? 'MISSION COMPLETE' : 'MISSION FAILED';
      const titleColor = missionSuccess ? [255, 215, 0] : [255, 68, 68];
      k.add([
        k.text(titleText, { size: 32, font: 'monospace' }),
        k.pos(W / 2, 80), k.anchor('center'), k.color(...titleColor), k.fixed(), k.z(501),
      ]);

      const statLines = [
        `Time: ${mins}:${String(secs).padStart(2, '0')}`,
        `Busters used: ${bustersUsed}/${BUSTER_TOTAL}`,
        `Layers penetrated: ${layersDestroyed}/${MOUNTAIN_LAYERS}`,
        `Centrifuges destroyed: ${missionSuccess ? '8,000' : '0'}`,
        `Missiles evaded: ${missilesEvaded}`,
        `Chaff used: ${chaffUsed}/${CHAFF_TOTAL}`,
        `Stealth rating: ${stealthRating}%`,
        `Armor remaining: ${Math.max(0, armor)}/3`,
      ];
      statLines.forEach((line, i) => {
        k.add([
          k.text(line, { size: 13, font: 'monospace' }),
          k.pos(W / 2, 140 + i * 22), k.anchor('center'),
          k.color(200, 200, 200), k.fixed(), k.z(501),
        ]);
      });

      // Stars
      const starStr = '\u2605'.repeat(stars) + '\u2606'.repeat(3 - stars);
      k.add([
        k.text(starStr, { size: 28, font: 'monospace' }),
        k.pos(W / 2, 140 + statLines.length * 22 + 16), k.anchor('center'),
        k.color(255, 215, 0), k.fixed(), k.z(501),
      ]);

      // Prompt
      const promptObj = k.add([
        k.text('SPACE - CONTINUE | M - MENU', { size: 14, font: 'monospace' }),
        k.pos(W / 2, H - 50), k.anchor('center'),
        k.color(200, 200, 200), k.fixed(), k.z(501),
      ]);
      let bt = 0;
      promptObj.onUpdate(() => { bt += k.dt(); promptObj.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3; });

      k.onKeyPress('space', () => { if (phase === 'victory') k.go('laststand-intro'); });
      k.onKeyPress('enter', () => { if (phase === 'victory') k.go('laststand-intro'); });
      k.onKeyPress('m', () => { if (phase === 'victory') k.go('menu'); });
    });
  }

  function showDefeat() {
    if (phase === 'dead' && !instrText.text) return;
    setHUDVisible(false);

    screenFlash(k, 255, 0, 0, 500, 0.5);
    k.shake(12);

    k.wait(1, () => {
      k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.7), k.fixed(), k.z(500)]);

      k.add([
        k.text('B-2 DESTROYED', { size: 32, font: 'monospace' }),
        k.pos(W / 2, H * 0.35), k.anchor('center'), k.color(255, 68, 68), k.fixed(), k.z(501),
      ]);

      const promptObj = k.add([
        k.text('SPACE - RETRY | M - MENU', { size: 14, font: 'monospace' }),
        k.pos(W / 2, H * 0.55), k.anchor('center'),
        k.color(200, 200, 200), k.fixed(), k.z(501),
      ]);
      let bt = 0;
      promptObj.onUpdate(() => { bt += k.dt(); promptObj.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3; });

      k.onKeyPress('space', () => { if (phase === 'dead') k.go('level5-b2'); });
      k.onKeyPress('enter', () => { if (phase === 'dead') k.go('level5-b2'); });
      k.onKeyPress('m', () => { if (phase === 'dead') k.go('menu'); });
    });
  }

  // ══════════════════════════════════════════════════════════════
  // DEBUG SKIP
  // ══════════════════════════════════════════════════════════════
  k.onKeyPress('p', () => {
    if (phase === 'takeoff') {
      startFlight();
    } else if (phase === 'flight') {
      startBombing();
    } else if (phase === 'bombing') {
      mountainHP = 0;
      layersDestroyed = MOUNTAIN_LAYERS;
      for (let i = 0; i < MOUNTAIN_LAYERS; i++) mountainLayerHP[i] = false;
      mtnBunkerHit = true;
      startMountainExplosion();
    } else if (phase === 'explosion') {
      startEscape();
    } else if (phase === 'escape') {
      showVictory();
    }
  });

  k.onKeyPress('escape', () => k.go('menu'));

  // ══════════════════════════════════════════════════════════════
  // MAIN UPDATE LOOP
  // ══════════════════════════════════════════════════════════════
  k.onUpdate(() => {
    const dt = k.dt();
    if (phase === 'takeoff') updateTakeoff(dt);
    else if (phase === 'flight') updateFlight(dt);
    else if (phase === 'bombing') updateBombing(dt);
    else if (phase === 'explosion') updateExplosion(dt);
    else if (phase === 'escape') updateEscape(dt);
  });

  // ══════════════════════════════════════════════════════════════
  // DRAW
  // ══════════════════════════════════════════════════════════════
  k.onDraw(() => {
    if (phase === 'takeoff') {
      drawTakeoff();
    } else if (phase === 'flight') {
      drawFlightTerrain(phaseTimer);
      drawFlightOverlay(phaseTimer);
      drawB2TopDown(jetX, jetY, 1, jetBankAngle);
    } else if (phase === 'bombing') {
      drawBombing(phaseTimer);
    } else if (phase === 'explosion') {
      drawExplosion();
    } else if (phase === 'escape') {
      drawEscape();
    }
    // Detection bar (custom draw during flight)
    if (phase === 'flight') {
      const det = Math.min(100, Math.max(0, detectionLevel));
      const barW = det * 2;
      // Bar bg
      k.drawRect({ pos: k.vec2(W / 2 - 100, 25), width: 200, height: 10, color: k.rgb(85, 85, 85), opacity: 0.6 });
      // Bar fill
      const barColor = det < 30 ? k.rgb(0, 255, 0) : det < 60 ? k.rgb(255, 255, 0) : det < 85 ? k.rgb(255, 136, 0) : k.rgb(255, 0, 0);
      if (barW > 0) {
        k.drawRect({ pos: k.vec2(W / 2 - 100, 25), width: barW, height: 10, color: barColor, opacity: 0.8 });
      }
    }
  });
}
