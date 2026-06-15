// ===================================================================
// Level 2: Operation Grim Beeper -- Port Infiltration (Stealth)
// Ported from PortSwapScene.js (Phaser) to Kaplay
// Top-down stealth: infiltrate port, find container, plant, escape
// ===================================================================

import { W, H } from '../constants.js';
import { generateStealthTextures } from '../systems/texture-factory.js';
import { screenFlash } from '../systems/game-juice.js';

// ── Constants ──
const PLAYER_SPEED = 100;
const SPRINT_SPEED = 170;
const GUARD_SPEED = 40;
const GUARD_ALERT_SPEED = 55;
const GUARD_CONE_RANGE = 100;
const GUARD_CONE_ANGLE = Math.PI / 3; // 60 degrees
const CAM_CONE_RANGE = 90;
const CAM_CONE_HALF = 0.5; // radians half-angle
const SCAN_TIME = 1.5; // seconds
const PLANT_TIME = 4.3; // seconds
const MAX_DISTRACTIONS = 3;
const SUS_GUARD_RATE = 14;
const SUS_CAMERA_RATE = 10;
const SUS_DECAY_RATE = 8;
const SUS_WORKER_DECAY = 4;
const SUS_SPRINT_ADD = 3;
const CONT_ROW_SPACING = 48;
const CONT_COL_SPACING = 72;

// ── Container layout (matches original PortSwapScene) ──
function generateContainers() {
  const containers = [];
  const colors = ['red', 'blue', 'green', 'yellow', 'orange'];

  // North yard: 3 rows x 5 cols
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      containers.push({
        x: 160 + col * CONT_COL_SPACING,
        y: 150 + row * CONT_ROW_SPACING,
        color: colors[(row * 5 + col) % 5],
        zone: 'north',
      });
    }
  }
  // South yard: 3 rows x 5 cols
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      containers.push({
        x: 160 + col * CONT_COL_SPACING,
        y: 340 + row * CONT_ROW_SPACING,
        color: colors[(row * 5 + col + 2) % 5],
        zone: 'south',
      });
    }
  }
  // East yard: 2 rows x 4 cols + scattered
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      containers.push({
        x: 560 + col * CONT_COL_SPACING,
        y: 160 + row * CONT_ROW_SPACING,
        color: colors[(row * 4 + col + 1) % 5],
        zone: 'east',
      });
    }
  }
  containers.push({ x: 560, y: 340, color: 'red', zone: 'east' });
  containers.push({ x: 632, y: 340, color: 'blue', zone: 'east' });
  containers.push({ x: 704, y: 340, color: 'red', zone: 'east' });
  containers.push({ x: 560, y: 388, color: 'green', zone: 'east' });
  containers.push({ x: 632, y: 388, color: 'orange', zone: 'east' });

  return containers;
}

// Guard patrol routes (from original, adjusted for corridors between yards)
const GUARD_PATROLS = [
  [{ x: 130, y: 120 }, { x: 490, y: 120 }, { x: 490, y: 260 }, { x: 130, y: 260 }],
  [{ x: 130, y: 320 }, { x: 490, y: 320 }, { x: 490, y: 450 }, { x: 130, y: 450 }],
  [{ x: 100, y: 280 }, { x: 520, y: 280 }, { x: 750, y: 280 }, { x: 520, y: 280 }],
  [{ x: 60, y: 460 }, { x: 200, y: 460 }, { x: 200, y: 510 }, { x: 60, y: 510 }],
  [{ x: 530, y: 140 }, { x: 810, y: 140 }, { x: 810, y: 260 }, { x: 530, y: 260 }],
  [{ x: 200, y: 90 }, { x: 500, y: 90 }, { x: 700, y: 90 }, { x: 500, y: 90 }],
  [{ x: 780, y: 320 }, { x: 880, y: 320 }, { x: 880, y: 460 }, { x: 780, y: 460 }],
  [{ x: 510, y: 110 }, { x: 510, y: 280 }, { x: 510, y: 450 }, { x: 510, y: 280 }],
];

// Security camera positions
const SEC_CAMERAS = [
  { x: 100, y: 100, baseAngle: Math.PI / 2 },
  { x: 500, y: 100, baseAngle: Math.PI },
  { x: 750, y: 180, baseAngle: Math.PI * 1.2 },
  { x: 350, y: 280, baseAngle: 0 },
  { x: 800, y: 420, baseAngle: Math.PI * 0.7 },
];

// ════════════════════════════════════════════════════════════════
// SCENE
// ════════════════════════════════════════════════════════════════

export function level2StealthScene(k) {
  k.setGravity(0);
  generateStealthTextures(k);

  // ── STATE ──
  let suspicion = 0;
  let missionPhase = 'infiltrate'; // infiltrate -> scan -> plant -> escape -> done
  let targetContainerIdx = -1;
  let distractionsLeft = MAX_DISTRACTIONS;
  let scanProgress = 0;
  let isScanning = false;
  let plantProgress = 0;
  let isPlanting = false;
  let missionComplete = false;
  let missionFailed = false;
  let nearestContainer = null;
  let susFlashCD = 0;
  let startTime = Date.now();

  // ── BACKGROUND: Water ──
  // Top water strip (3 tiles high)
  for (let x = 0; x < 30; x++) {
    for (let y = 0; y < 3; y++) {
      k.add([k.sprite('ps_water'), k.pos(x * 32, y * 32), k.z(-5)]);
    }
  }
  // Left water strip
  for (let y = 3; y < 17; y++) {
    k.add([k.sprite('ps_water'), k.pos(0, y * 32), k.z(-5)]);
  }

  // ── BACKGROUND: Dock floor ──
  for (let x = 1; x < 30; x++) {
    for (let y = 3; y < 17; y++) {
      k.add([k.sprite('ps_floor'), k.pos(x * 32, y * 32), k.z(-4)]);
    }
  }

  // ── Dock edge (yellow stripe along water) ──
  for (let x = 1; x < 27; x++) {
    k.add([k.sprite('ps_dock_edge'), k.pos(x * 32, 3 * 32), k.z(-3)]);
  }

  // ── Ships ──
  k.add([k.sprite('ps_ship'), k.pos(240, 40), k.z(-2), k.opacity(0.9)]);
  k.add([k.sprite('ps_ship'), k.pos(610, 40), k.z(-2), k.opacity(0.9)]);

  // ── Cranes ──
  k.add([k.sprite('ps_crane'), k.pos(170, 80), k.z(3), k.opacity(0.7)]);
  k.add([k.sprite('ps_crane'), k.pos(430, 80), k.z(3), k.opacity(0.7)]);
  k.add([k.sprite('ps_crane'), k.pos(590, 80), k.z(3), k.opacity(0.7)]);

  // ── Office buildings ──
  k.add([k.sprite('ps_building'), k.pos(818, 356), k.z(0),
    k.area({ width: 64, height: 48 }), k.body({ isStatic: true })]);
  k.add([k.sprite('ps_building'), k.pos(818, 416), k.z(0),
    k.area({ width: 64, height: 48 }), k.body({ isStatic: true })]);

  // ── Wall colliders (boundaries) ──
  // Top water wall
  k.add([k.rect(W, 110), k.pos(0, 0), k.opacity(0),
    k.area({ width: W, height: 110 }), k.body({ isStatic: true })]);
  // Left water wall
  k.add([k.rect(32, H), k.pos(0, 0), k.opacity(0),
    k.area({ width: 32, height: H }), k.body({ isStatic: true })]);
  // Bottom boundary
  k.add([k.rect(W, 16), k.pos(0, H), k.opacity(0),
    k.area({ width: W, height: 16 }), k.body({ isStatic: true })]);
  // Right boundary
  k.add([k.rect(16, H), k.pos(W, 0), k.opacity(0),
    k.area({ width: 16, height: H }), k.body({ isStatic: true })]);

  // ── CONTAINERS ──
  const containerDefs = generateContainers();
  const containerObjs = [];

  // Pick random target
  targetContainerIdx = Math.floor(Math.random() * containerDefs.length);

  for (let i = 0; i < containerDefs.length; i++) {
    const def = containerDefs[i];
    const isTarget = i === targetContainerIdx;
    const spriteName = isTarget ? 'ps_container_target' : `ps_container_${def.color}`;
    const cont = k.add([
      k.sprite(spriteName),
      k.pos(def.x, def.y),
      k.area({ width: 40, height: 18 }),
      k.body({ isStatic: true }),
      k.z(2),
      k.anchor("center"),
      "container",
      { idx: i, isTarget, scanned: false, revealed: false, color: def.color, zone: def.zone },
    ]);
    containerObjs.push(cont);
  }

  // ── PLAYER ──
  const player = k.add([
    k.sprite('ps_player'),
    k.pos(80, 490),
    k.area({ width: 12, height: 12 }),
    k.body(),
    k.z(10),
    k.anchor("center"),
    "player",
  ]);

  // ── GUARDS ──
  const guards = [];
  for (const route of GUARD_PATROLS) {
    const g = k.add([
      k.sprite('ps_guard_down'),
      k.pos(route[0].x, route[0].y),
      k.area({ width: 18, height: 18 }),
      k.anchor("center"),
      k.z(8),
      "guard",
      {
        route, waypointIdx: 0,
        speed: GUARD_SPEED,
        alertSpeed: GUARD_ALERT_SPEED,
        facing: Math.PI / 2,
        alertTimer: 0,
        facingDir: 'down',
      },
    ]);
    guards.push(g);
  }

  // ── SECURITY CAMERAS ──
  const cameras = SEC_CAMERAS.map(cp => ({
    x: cp.x, y: cp.y,
    angle: cp.baseAngle,
    baseAngle: cp.baseAngle,
    sweepSpeed: 0.5,
  }));
  // Camera visual dots (static objects)
  for (const cp of SEC_CAMERAS) {
    k.add([k.sprite('ps_camera'), k.pos(cp.x, cp.y), k.anchor("center"), k.z(6)]);
  }

  // ── WORKERS ──
  const workerSpawns = [
    { x: 130, y: 174 }, { x: 490, y: 174 }, { x: 300, y: 260 },
    { x: 400, y: 280 }, { x: 130, y: 388 }, { x: 490, y: 388 },
    { x: 450, y: 450 }, { x: 530, y: 200 }, { x: 810, y: 200 },
    { x: 530, y: 370 }, { x: 700, y: 300 }, { x: 300, y: 470 },
  ];
  const workers = [];
  for (const sp of workerSpawns) {
    const w = k.add([
      k.sprite('ps_worker'), k.pos(sp.x, sp.y), k.anchor("center"),
      k.z(3), "worker",
      { vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15 },
    ]);
    workers.push(w);
  }

  // ── EXTRACTION ZONE (entrance area) ──
  k.add([k.sprite('ps_exit'), k.pos(80, 490), k.anchor("center"), k.z(1), k.opacity(0.7)]);
  const extrText = k.add([
    k.text("ENTRANCE", { size: 7, font: "monospace" }),
    k.pos(80, 512), k.anchor("center"), k.color(0, 255, 102), k.z(2),
  ]);
  // Extraction collider (invisible, only active during escape phase)
  const extraction = k.add([
    k.rect(40, 40), k.pos(80, 490), k.opacity(0),
    k.area({ width: 40, height: 40 }), k.anchor("center"), k.z(1), "extraction",
  ]);

  // ── HUD ──
  // Suspicion bar
  k.add([k.rect(200, 10), k.pos(W / 2 - 100, 8), k.color(40, 40, 40),
    k.opacity(0.8), k.fixed(), k.z(100)]);
  const susBarFill = k.add([k.rect(1, 10), k.pos(W / 2 - 100, 8),
    k.color(0, 200, 0), k.opacity(0.8), k.fixed(), k.z(101)]);
  const susLabel = k.add([k.text("SUSPICION: 0%", { size: 10, font: "monospace" }),
    k.pos(W / 2, 22), k.anchor("center"), k.color(200, 200, 200), k.fixed(), k.z(102)]);

  // Objective text
  const objText = k.add([k.text("SCAN CONTAINERS TO FIND THE TARGET", { size: 12, font: "monospace" }),
    k.pos(W / 2, H - 15), k.anchor("center"), k.color(255, 215, 0), k.fixed(), k.z(100)]);

  // Distractions counter
  const distText = k.add([k.text(`DISTRACTIONS: ${distractionsLeft}  [Q]`, { size: 10, font: "monospace" }),
    k.pos(15, 8), k.color(200, 200, 200), k.fixed(), k.z(100)]);

  // Controls hint
  k.add([k.text("WASD:Move  SHIFT:Sprint  SPACE:Scan  E:Plant  Q:Distract", { size: 8, font: "monospace" }),
    k.pos(W / 2, H - 3), k.anchor("center"), k.color(80, 80, 80), k.fixed(), k.z(99)]);

  // Minimap background
  const mmX = W - 135, mmY = H - 85;
  k.add([k.rect(120, 70), k.pos(mmX, mmY), k.color(0, 0, 0),
    k.opacity(0.6), k.fixed(), k.z(99)]);

  // ── Intel messages (timed radio intel) ──
  const intelColors = ['red', 'blue', 'green'];
  const intelZones = ['north', 'south', 'east'];
  const targetDef = containerDefs[targetContainerIdx];
  const intelMessages = [
    `INTEL: Container is ${targetDef.color.toUpperCase()}`,
    `INTEL: Located in ${targetDef.zone.toUpperCase()} yard`,
    `INTEL: Has encrypted marking`,
  ];
  for (let i = 0; i < intelMessages.length; i++) {
    k.wait(5 + i * 3, () => {
      if (missionComplete || missionFailed) return;
      const msg = k.add([
        k.text(intelMessages[i], { size: 14, font: "monospace" }),
        k.pos(W / 2, 50), k.anchor("center"), k.color(0, 200, 255), k.fixed(), k.z(200),
        k.opacity(0),
      ]);
      k.tween(0, 1, 0.3, (v) => { if (msg.exists()) msg.opacity = v; });
      k.wait(3, () => {
        k.tween(1, 0, 0.5, (v) => { if (msg.exists()) msg.opacity = v; })
          .onEnd(() => { if (msg.exists()) msg.destroy(); });
      });
    });
  }

  // ── HELPERS ──
  function isInCone(gx, gy, gAngle, tx, ty, range, halfAngle) {
    const dx = tx - gx, dy = ty - gy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > range) return false;
    const a = Math.atan2(dy, dx);
    let diff = a - gAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) < halfAngle;
  }

  function isLineBlocked(x1, y1, x2, y2) {
    for (const c of containerObjs) {
      const cx = c.pos.x, cy = c.pos.y;
      for (let t = 0.2; t <= 0.8; t += 0.15) {
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        if (px > cx - 22 && px < cx + 22 && py > cy - 11 && py < cy + 11) return true;
      }
    }
    return false;
  }

  function getFacingDir(angle) {
    const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (a >= Math.PI * 0.25 && a < Math.PI * 0.75) return 'down';
    if (a >= Math.PI * 0.75 && a < Math.PI * 1.25) return 'left';
    if (a >= Math.PI * 1.25 && a < Math.PI * 1.75) return 'up';
    return 'right';
  }

  // ── MAIN UPDATE LOOP ──
  k.onUpdate(() => {
    if (missionComplete || missionFailed) return;

    // ── PLAYER INPUT ──
    const sprint = k.isKeyDown("shift");
    const spd = sprint ? SPRINT_SPEED : PLAYER_SPEED;
    let vx = 0, vy = 0;
    if (k.isKeyDown("left") || k.isKeyDown("a")) vx = -1;
    if (k.isKeyDown("right") || k.isKeyDown("d")) vx = 1;
    if (k.isKeyDown("up") || k.isKeyDown("w")) vy = -1;
    if (k.isKeyDown("down") || k.isKeyDown("s")) vy = 1;
    if (vx && vy) { vx *= 0.707; vy *= 0.707; }
    player.move(vx * spd, vy * spd);

    // Clamp to play area (within walls)
    player.pos.x = Math.max(40, Math.min(W - 8, player.pos.x));
    player.pos.y = Math.max(115, Math.min(H - 8, player.pos.y));

    // ── GUARD AI ──
    for (const g of guards) {
      const route = g.route;
      const target = route[g.waypointIdx];
      const dx = target.x - g.pos.x, dy = target.y - g.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const moveSpd = g.alertTimer > 0 ? g.alertSpeed : g.speed;

      if (dist < 5) {
        g.waypointIdx = (g.waypointIdx + 1) % route.length;
      } else {
        g.pos.x += (dx / dist) * moveSpd * k.dt();
        g.pos.y += (dy / dist) * moveSpd * k.dt();
        g.facing = Math.atan2(dy, dx);
      }

      if (g.alertTimer > 0) {
        g.alertTimer -= k.dt();
      }

      // Update guard sprite direction
      const newDir = getFacingDir(g.facing);
      if (newDir !== g.facingDir) {
        g.facingDir = newDir;
        if (g.exists()) {
          try { g.use(k.sprite(`ps_guard_${newDir}`)); } catch (e) { /* sprite swap */ }
        }
      }
    }

    // ── CAMERA SWEEP ──
    for (const cam of cameras) {
      cam.angle = cam.baseAngle + Math.sin(k.time() * cam.sweepSpeed) * 0.8;
    }

    // ── WORKER WANDER ──
    for (const w of workers) {
      w.pos.x += w.vx * k.dt();
      w.pos.y += w.vy * k.dt();
      if (w.pos.x < 50 || w.pos.x > W - 50) w.vx *= -1;
      if (w.pos.y < 100 || w.pos.y > H - 30) w.vy *= -1;
    }

    // ── SUSPICION CALCULATION ──
    let susRate = -SUS_DECAY_RATE; // base decay

    // Guard detection
    for (const g of guards) {
      if (isInCone(g.pos.x, g.pos.y, g.facing, player.pos.x, player.pos.y,
          GUARD_CONE_RANGE, GUARD_CONE_ANGLE / 2)) {
        if (!isLineBlocked(g.pos.x, g.pos.y, player.pos.x, player.pos.y)) {
          susRate += SUS_GUARD_RATE;
          // Alert nearby guards when suspicion is high
          if (suspicion > 70) {
            for (const og of guards) {
              if (og === g) continue;
              const d = Math.sqrt((og.pos.x - g.pos.x) ** 2 + (og.pos.y - g.pos.y) ** 2);
              if (d < 200) og.alertTimer = 5;
            }
          }
        }
      }
    }

    // Camera detection
    for (const cam of cameras) {
      if (isInCone(cam.x, cam.y, cam.angle, player.pos.x, player.pos.y,
          CAM_CONE_RANGE, CAM_CONE_HALF)) {
        if (!isLineBlocked(cam.x, cam.y, player.pos.x, player.pos.y)) {
          susRate += SUS_CAMERA_RATE;
        }
      }
    }

    // Worker proximity reduces suspicion (blending in)
    for (const w of workers) {
      const d = Math.sqrt((w.pos.x - player.pos.x) ** 2 + (w.pos.y - player.pos.y) ** 2);
      if (d < 40) {
        susRate -= SUS_WORKER_DECAY;
        break; // one worker is enough
      }
    }

    // Sprint penalty
    if (sprint && (vx || vy)) susRate += SUS_SPRINT_ADD;

    // Planting penalty (exposed while working)
    if (isPlanting) susRate += 5;

    suspicion = Math.max(0, Math.min(100, suspicion + susRate * k.dt()));

    // Suspicion flash warning
    susFlashCD -= k.dt();
    if (suspicion > 50 && susFlashCD <= 0) {
      screenFlash(k, 255, 0, 0, 100, 0.08);
      susFlashCD = 3;
    }

    // ── MISSION FAILED (suspicion maxed) ──
    if (suspicion >= 100 && !missionFailed) {
      missionFailed = true;
      screenFlash(k, 255, 0, 0, 500, 0.5);
      k.shake(12);
      objText.text = "DETECTED -- MISSION FAILED";
      objText.color = k.rgb(255, 50, 50);
      k.wait(2.5, () => k.go("menu"));
      return;
    }

    // ── HUD UPDATE ──
    susBarFill.width = Math.max(1, suspicion * 2);
    const sr = suspicion / 100;
    susBarFill.color = sr < 0.3 ? k.rgb(0, 200, 0)
      : sr < 0.6 ? k.rgb(200, 200, 0)
      : sr < 0.8 ? k.rgb(200, 130, 0)
      : k.rgb(200, 0, 0);
    susLabel.text = `SUSPICION: ${Math.floor(suspicion)}%`;
    distText.text = `DISTRACTIONS: ${distractionsLeft}  [Q]`;

    // ── FIND NEAREST SCANNABLE CONTAINER ──
    nearestContainer = null;
    let nearDist = 50;
    for (const c of containerObjs) {
      const d = Math.sqrt((c.pos.x - player.pos.x) ** 2 + (c.pos.y - player.pos.y) ** 2);
      if (d < nearDist && !c.scanned) {
        nearDist = d;
        nearestContainer = c;
      }
    }

    // ── SCAN (SPACE held) ──
    if (k.isKeyDown("space") && nearestContainer && !isPlanting) {
      isScanning = true;
      scanProgress += k.dt() / SCAN_TIME;
      if (scanProgress >= 1) {
        nearestContainer.scanned = true;
        nearestContainer.revealed = true;
        scanProgress = 0;
        isScanning = false;
        if (nearestContainer.isTarget) {
          objText.text = "TARGET FOUND! Hold E to plant explosives";
          objText.color = k.rgb(0, 255, 100);
          missionPhase = 'plant';
        }
      }
    } else {
      scanProgress = Math.max(0, scanProgress - k.dt() * 2);
      isScanning = false;
    }

    // ── PLANT (E held) ──
    if (k.isKeyDown("e") && missionPhase === 'plant') {
      // Must be near the target container
      let nearTarget = false;
      for (const c of containerObjs) {
        if (!c.isTarget) continue;
        const d = Math.sqrt((c.pos.x - player.pos.x) ** 2 + (c.pos.y - player.pos.y) ** 2);
        if (d < 50) { nearTarget = true; break; }
      }
      if (nearTarget) {
        isPlanting = true;
        plantProgress += k.dt() / PLANT_TIME;
        if (plantProgress >= 1) {
          isPlanting = false;
          plantProgress = 0;
          missionPhase = 'escape';
          objText.text = "EXPLOSIVES PLANTED -- GET TO EXTRACTION!";
          objText.color = k.rgb(255, 215, 0);
          extrText.text = "EXTRACT";
          extrText.color = k.rgb(0, 255, 0);
          // Flash extraction marker
          extraction.use(k.color(0, 255, 0));
          extraction.opacity = 0.3;
        }
      } else {
        isPlanting = false;
      }
    } else {
      if (isPlanting) isPlanting = false;
    }
  });

  // ── DISTRACTION (Q press) ──
  k.onKeyPress("q", () => {
    if (distractionsLeft <= 0 || missionFailed || missionComplete) return;
    distractionsLeft--;

    // Rock throw: distraction at random nearby position
    const dx = player.pos.x + (Math.random() - 0.5) * 200;
    const dy = player.pos.y + (Math.random() - 0.5) * 200;

    // Visual flash at distraction point
    const rock = k.add([k.sprite('ps_rock'), k.pos(dx, dy), k.anchor("center"), k.z(15)]);
    k.tween(1, 0, 1.5, (v) => { if (rock.exists()) rock.opacity = v; })
      .onEnd(() => { if (rock.exists()) rock.destroy(); });

    // Impact ripple
    const ripple = k.add([k.circle(6), k.pos(dx, dy), k.color(255, 255, 0),
      k.opacity(0.6), k.z(14)]);
    k.tween(0.6, 0, 0.8, (v) => { if (ripple.exists()) ripple.opacity = v; })
      .onEnd(() => { if (ripple.exists()) ripple.destroy(); });

    // Alert guards near the distraction
    for (const g of guards) {
      const d = Math.sqrt((g.pos.x - dx) ** 2 + (g.pos.y - dy) ** 2);
      if (d < 150) {
        g.alertTimer = 5;
        g.facing = Math.atan2(dy - g.pos.y, dx - g.pos.x);
      }
    }
  });

  // ── EXTRACTION COLLISION ──
  k.onCollide("player", "extraction", () => {
    if (missionPhase === 'escape' && !missionComplete) {
      missionComplete = true;
      showVictory();
    }
  });

  // ── VICTORY SCREEN ──
  function showVictory() {
    screenFlash(k, 255, 255, 255, 300, 0.5);

    const elapsed = Date.now() - startTime;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    const rating = suspicion < 20 ? 'GHOST' : suspicion < 50 ? 'SHADOW' : suspicion < 80 ? 'OPERATIVE' : 'SURVIVOR';
    const stars = suspicion < 20 ? 3 : suspicion < 50 ? 2 : suspicion < 80 ? 1 : 0;

    // Save progress
    try {
      localStorage.setItem('superzion_stars_2', String(stars));
      const prev = parseInt(localStorage.getItem('superzion_level_progress') || '1');
      if (3 > prev) localStorage.setItem('superzion_level_progress', '3');
    } catch (e) { /* storage */ }

    // Overlay
    k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.85), k.fixed(), k.z(500)]);

    k.add([k.text("MISSION COMPLETE", { size: 36, font: "monospace" }),
      k.pos(W / 2, 100), k.anchor("center"), k.color(0, 255, 100), k.fixed(), k.z(501)]);
    k.add([k.text("OPERATION GRIM BEEPER", { size: 14, font: "monospace" }),
      k.pos(W / 2, 140), k.anchor("center"), k.color(0, 170, 68), k.fixed(), k.z(501)]);
    k.add([k.rect(400, 2), k.pos(W / 2, 160), k.anchor("center"),
      k.color(255, 215, 0), k.opacity(0.5), k.fixed(), k.z(501)]);

    const statLines = [
      { label: 'TIME', value: timeStr },
      { label: 'PEAK SUSPICION', value: `${Math.floor(suspicion)}%` },
      { label: 'DISTRACTIONS USED', value: `${MAX_DISTRACTIONS - distractionsLeft}` },
      { label: 'RATING', value: rating },
    ];
    statLines.forEach((s, i) => {
      const y = 190 + i * 32;
      k.add([k.text(s.label, { size: 14, font: "monospace" }),
        k.pos(W / 2 - 120, y), k.color(150, 150, 170), k.fixed(), k.z(501)]);
      k.add([k.text(s.value, { size: 14, font: "monospace" }),
        k.pos(W / 2 + 120, y), k.anchor("topright"), k.color(255, 215, 0), k.fixed(), k.z(501)]);
    });

    // Stars
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      k.add([k.text(filled ? '\u2605' : '\u2606', { size: 36, font: "monospace" }),
        k.pos(W / 2 - 40 + i * 40, 340), k.anchor("center"),
        k.color(filled ? 255 : 80, filled ? 215 : 80, filled ? 0 : 80), k.fixed(), k.z(501)]);
    }

    // Continue prompt
    const prompt = k.add([k.text("PRESS SPACE TO CONTINUE", { size: 16, font: "monospace" }),
      k.pos(W / 2, 400), k.anchor("center"), k.color(255, 215, 0), k.fixed(), k.z(501)]);
    let bt = 0;
    prompt.onUpdate(() => { bt += k.dt(); prompt.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3; });

    k.add([k.text("M - MENU", { size: 12, font: "monospace" }),
      k.pos(W / 2, 440), k.anchor("center"), k.color(120, 120, 140), k.fixed(), k.z(501)]);

    k.onKeyPress('space', () => { if (missionComplete) k.go('deepstrike-intro'); });
    k.onKeyPress('enter', () => { if (missionComplete) k.go('deepstrike-intro'); });
    k.onKeyPress('m', () => { if (missionComplete) k.go('menu'); });
  }

  // ── DRAW: Vision cones, minimap, progress bars (every frame) ──
  k.onDraw(() => {
    // Guard vision cones
    for (const g of guards) {
      const detecting = isInCone(g.pos.x, g.pos.y, g.facing, player.pos.x, player.pos.y,
        GUARD_CONE_RANGE, GUARD_CONE_ANGLE / 2)
        && !isLineBlocked(g.pos.x, g.pos.y, player.pos.x, player.pos.y);
      const alert = g.alertTimer > 0;
      const color = detecting ? k.rgb(255, 80, 0) : alert ? k.rgb(255, 170, 0) : k.rgb(0, 200, 0);
      const a = g.facing;
      const range = GUARD_CONE_RANGE;
      const ha = GUARD_CONE_ANGLE / 2;

      // Draw cone as polygon (3 points)
      k.drawTriangle({
        p1: k.vec2(g.pos.x, g.pos.y),
        p2: k.vec2(g.pos.x + Math.cos(a - ha) * range, g.pos.y + Math.sin(a - ha) * range),
        p3: k.vec2(g.pos.x + Math.cos(a + ha) * range, g.pos.y + Math.sin(a + ha) * range),
        color: color,
        opacity: detecting ? 0.15 : 0.06,
      });
    }

    // Camera vision cones
    for (const cam of cameras) {
      const detecting = isInCone(cam.x, cam.y, cam.angle, player.pos.x, player.pos.y,
        CAM_CONE_RANGE, CAM_CONE_HALF)
        && !isLineBlocked(cam.x, cam.y, player.pos.x, player.pos.y);
      const color = detecting ? k.rgb(255, 80, 0) : k.rgb(100, 100, 255);
      k.drawTriangle({
        p1: k.vec2(cam.x, cam.y),
        p2: k.vec2(cam.x + Math.cos(cam.angle - CAM_CONE_HALF) * CAM_CONE_RANGE,
                    cam.y + Math.sin(cam.angle - CAM_CONE_HALF) * CAM_CONE_RANGE),
        p3: k.vec2(cam.x + Math.cos(cam.angle + CAM_CONE_HALF) * CAM_CONE_RANGE,
                    cam.y + Math.sin(cam.angle + CAM_CONE_HALF) * CAM_CONE_RANGE),
        color: color,
        opacity: detecting ? 0.12 : 0.05,
      });
    }

    // Scan progress bar (above container)
    if (isScanning && nearestContainer) {
      const bx = nearestContainer.pos.x - 20, by = nearestContainer.pos.y - 16;
      k.drawRect({ pos: k.vec2(bx, by), width: 40, height: 4, color: k.rgb(0, 0, 0), opacity: 0.7 });
      k.drawRect({ pos: k.vec2(bx, by), width: 40 * scanProgress, height: 4, color: k.rgb(0, 200, 255), opacity: 0.8 });
    }

    // Plant progress bar (above player)
    if (isPlanting) {
      const bx = player.pos.x - 20, by = player.pos.y - 18;
      k.drawRect({ pos: k.vec2(bx, by), width: 40, height: 4, color: k.rgb(0, 0, 0), opacity: 0.7 });
      k.drawRect({ pos: k.vec2(bx, by), width: 40 * plantProgress, height: 4, color: k.rgb(255, 100, 0), opacity: 0.8 });
    }

    // Scanned container indicators
    for (const c of containerObjs) {
      if (c.revealed && !c.isTarget) {
        k.drawText({
          text: "X", pos: k.vec2(c.pos.x, c.pos.y),
          size: 14, color: k.rgb(150, 150, 150), anchor: "center",
        });
      }
      if (c.revealed && c.isTarget && missionPhase !== 'escape') {
        // Pulse marker on target
        const pulse = 0.5 + Math.sin(k.time() * 4) * 0.3;
        k.drawCircle({
          pos: k.vec2(c.pos.x, c.pos.y),
          radius: 12, color: k.rgb(255, 215, 0), opacity: pulse,
        });
      }
    }

    // Proximity hint (near scannable container)
    if (nearestContainer && !isScanning && !isPlanting && missionPhase !== 'escape') {
      k.drawText({
        text: missionPhase === 'plant' && nearestContainer.isTarget ? "[E] PLANT" : "[SPACE] SCAN",
        pos: k.vec2(nearestContainer.pos.x, nearestContainer.pos.y - 14),
        size: 8, color: k.rgb(255, 255, 200), anchor: "center",
      });
    }

    // ── MINIMAP ──
    const mx = mmX, my = mmY;
    const sx = 120 / W, sy = 70 / H;
    // Minimap border
    k.drawRect({ pos: k.vec2(mx, my), width: 120, height: 70, outline: { color: k.rgb(0, 200, 100), width: 1 }, color: k.rgb(0, 0, 0), opacity: 0 });
    // Player dot
    k.drawCircle({ pos: k.vec2(mx + player.pos.x * sx, my + player.pos.y * sy), radius: 2, color: k.rgb(255, 255, 255) });
    // Guards
    for (const g of guards) {
      const gc = g.alertTimer > 0 ? k.rgb(255, 170, 0) : k.rgb(255, 50, 50);
      k.drawCircle({ pos: k.vec2(mx + g.pos.x * sx, my + g.pos.y * sy), radius: 1.5, color: gc });
    }
    // Containers
    for (const c of containerObjs) {
      const col = c.isTarget && c.revealed ? k.rgb(255, 255, 0) : k.rgb(100, 100, 100);
      k.drawRect({ pos: k.vec2(mx + c.pos.x * sx - 1.5, my + c.pos.y * sy - 0.75), width: 3, height: 1.5, color: col, opacity: 0.6 });
    }
    // Extraction
    if (missionPhase === 'escape') {
      const pulse = 0.4 + Math.sin(k.time() * 5) * 0.4;
      k.drawCircle({ pos: k.vec2(mx + 80 * sx, my + 490 * sy), radius: 3, color: k.rgb(0, 255, 100), opacity: pulse });
    }
  });

  // ── ESC to menu ──
  k.onKeyPress("escape", () => {
    k.go("menu");
  });
}
