// ═══════════════════════════════════════════════════════════════
// Operation Tehran — Enemy sprite generators
// Drone, Guard, Turret (64x64 canvas sprites)
// ═══════════════════════════════════════════════════════════════

const SIZE = 64;

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function shadedRect(ctx, x, y, w, h, colors) {
  const n = colors.length;
  for (let row = 0; row < h; row++) {
    const ci = Math.min(Math.floor((row / h) * n), n - 1);
    pxRect(ctx, x, y + row, w, 1, colors[ci]);
  }
}

// ── DRONE SPRITES ───────────────────────────────────────────────
export function generateDroneSprites(scene) {
  const metal = ['#555555', '#666666', '#777777', '#888888', '#999999'];
  const dark = '#333333';
  const led = '#ff2020';
  const ledDim = '#881010';
  const rotor = '#444444';

  function drawDrone(ctx, frame, hit) {
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    // Body
    shadedRect(ctx, cx - 12, cy - 4, 24, 10, hit ? ['#aa4444', '#993333', '#882222'] : [metal[3], metal[2], metal[1]]);
    pxRect(ctx, cx - 10, cy - 6, 20, 3, hit ? '#aa4444' : metal[4]);
    pxRect(ctx, cx - 8, cy + 6, 16, 2, hit ? '#662222' : metal[0]);

    // Canopy
    pxRect(ctx, cx - 5, cy - 8, 10, 3, hit ? '#884444' : '#4477aa');
    pxRect(ctx, cx - 3, cy - 9, 6, 2, hit ? '#aa5555' : '#5599cc');

    // LED eye
    pxRect(ctx, cx - 2, cy, 4, 2, hit ? '#ffffff' : led);
    if (!hit) pxRect(ctx, cx - 1, cy, 2, 1, '#ff6060');

    // Rotors (alternate position per frame)
    const rotorOffset = frame % 2 === 0 ? 0 : 2;
    // Left rotor
    pxRect(ctx, cx - 22 + rotorOffset, cy - 8, 12, 2, rotor);
    pxRect(ctx, cx - 20 + rotorOffset, cy - 9, 8, 1, dark);
    // Right rotor
    pxRect(ctx, cx + 10 - rotorOffset, cy - 8, 12, 2, rotor);
    pxRect(ctx, cx + 12 - rotorOffset, cy - 9, 8, 1, dark);

    // Rotor mounts
    pxRect(ctx, cx - 14, cy - 6, 3, 4, metal[1]);
    pxRect(ctx, cx + 11, cy - 6, 3, 4, metal[1]);

    // Underside gun
    pxRect(ctx, cx - 1, cy + 8, 2, 5, dark);
    pxRect(ctx, cx - 2, cy + 7, 4, 2, metal[0]);
  }

  // fly_0 and fly_1
  for (let i = 0; i < 2; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    drawDrone(canvas.getContext('2d'), i, false);
    scene.textures.addCanvas(`drone_fly_${i}`, canvas);
  }

  // hit
  const hitCanvas = document.createElement('canvas');
  hitCanvas.width = SIZE;
  hitCanvas.height = SIZE;
  drawDrone(hitCanvas.getContext('2d'), 0, true);
  scene.textures.addCanvas('drone_hit', hitCanvas);

  // death (explosion particles)
  const deathCanvas = document.createElement('canvas');
  deathCanvas.width = SIZE;
  deathCanvas.height = SIZE;
  const dctx = deathCanvas.getContext('2d');
  const sparks = ['#ff6600', '#ffaa00', '#ffcc44', '#888888', '#666666'];
  for (let i = 0; i < 30; i++) {
    const sx = SIZE / 2 + (Math.random() - 0.5) * 40;
    const sy = SIZE / 2 + (Math.random() - 0.5) * 30;
    const s = 1 + Math.floor(Math.random() * 3);
    pxRect(dctx, sx, sy, s, s, sparks[Math.floor(Math.random() * sparks.length)]);
  }
  scene.textures.addCanvas('drone_death', deathCanvas);
}

// ── GUARD SPRITES ───────────────────────────────────────────────
export function generateGuardSprites(scene) {
  const uniform = ['#2a3a2a', '#334433', '#3d4e3d', '#475847'];
  const skin = ['#8a6a4a', '#a08060', '#b89070'];
  const beret = '#3a2020';
  const beretLt = '#4a3030';
  const boot = ['#1a1a1a', '#2a2a2a', '#333333'];
  const rifle = ['#222222', '#333333', '#444444'];

  function drawGuard(ctx, frame, shooting, hit) {
    const cx = SIZE / 2;
    const legOffset = (frame === 1 || frame === 3) ? 3 : frame === 2 ? -3 : 0;

    // Legs
    const lx1 = cx - 6;
    const lx2 = cx + 2;
    shadedRect(ctx, lx1, 42 + legOffset, 5, 12, hit ? ['#664444', '#553333'] : [uniform[1], uniform[0]]);
    shadedRect(ctx, lx2, 42 - legOffset, 5, 12, hit ? ['#664444', '#553333'] : [uniform[1], uniform[0]]);
    // Boots
    pxRect(ctx, lx1, 54 + legOffset, 6, 4, hit ? '#442222' : boot[0]);
    pxRect(ctx, lx1, 54 + legOffset, 6, 1, hit ? '#553333' : boot[2]);
    pxRect(ctx, lx2, 54 - legOffset, 6, 4, hit ? '#442222' : boot[0]);
    pxRect(ctx, lx2, 54 - legOffset, 6, 1, hit ? '#553333' : boot[2]);

    // Torso
    shadedRect(ctx, cx - 8, 24, 16, 18, hit ? ['#884444', '#773333', '#662222'] : [uniform[3], uniform[2], uniform[1]]);
    // Belt
    pxRect(ctx, cx - 8, 40, 16, 2, hit ? '#442222' : '#1a1a1a');

    // Arms
    const armY = shooting ? 28 : 30;
    shadedRect(ctx, cx - 12, armY, 4, 12, hit ? ['#774444', '#663333'] : [uniform[2], uniform[1]]);
    shadedRect(ctx, cx + 8, armY, 4, 12, hit ? ['#774444', '#663333'] : [uniform[2], uniform[1]]);

    // Head
    pxRect(ctx, cx - 5, 12, 10, 12, hit ? '#886655' : skin[1]);
    pxRect(ctx, cx - 4, 13, 8, 2, hit ? '#997766' : skin[2]);
    // Eyes
    px(ctx, cx - 3, 17, '#111111');
    px(ctx, cx + 2, 17, '#111111');
    // Mouth
    pxRect(ctx, cx - 2, 21, 4, 1, hit ? '#664444' : skin[0]);

    // Beret
    pxRect(ctx, cx - 6, 8, 12, 5, hit ? '#553333' : beret);
    pxRect(ctx, cx - 7, 11, 14, 2, hit ? '#664444' : beretLt);
    pxRect(ctx, cx - 4, 6, 8, 3, hit ? '#553333' : beret);

    // Rifle (when shooting, horizontal; otherwise angled down)
    if (shooting) {
      pxRect(ctx, cx + 10, 30, 18, 3, rifle[0]);
      pxRect(ctx, cx + 10, 30, 18, 1, rifle[2]);
      // Muzzle flash
      pxRect(ctx, cx + 28, 28, 3, 6, '#ffaa00');
      pxRect(ctx, cx + 29, 29, 2, 4, '#ffcc44');
    } else {
      pxRect(ctx, cx + 8, 32, 3, 14, rifle[0]);
      pxRect(ctx, cx + 8, 32, 1, 14, rifle[2]);
    }
  }

  // idle
  const idleCanvas = document.createElement('canvas');
  idleCanvas.width = SIZE;
  idleCanvas.height = SIZE;
  drawGuard(idleCanvas.getContext('2d'), 0, false, false);
  scene.textures.addCanvas('guard_idle', idleCanvas);

  // walk frames (4)
  for (let i = 0; i < 4; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    drawGuard(canvas.getContext('2d'), i, false, false);
    scene.textures.addCanvas(`guard_walk_${i}`, canvas);
  }

  // shoot
  const shootCanvas = document.createElement('canvas');
  shootCanvas.width = SIZE;
  shootCanvas.height = SIZE;
  drawGuard(shootCanvas.getContext('2d'), 0, true, false);
  scene.textures.addCanvas('guard_shoot', shootCanvas);

  // hit
  const hitCanvas = document.createElement('canvas');
  hitCanvas.width = SIZE;
  hitCanvas.height = SIZE;
  drawGuard(hitCanvas.getContext('2d'), 0, false, true);
  scene.textures.addCanvas('guard_hit', hitCanvas);

  // death
  const deathCanvas = document.createElement('canvas');
  deathCanvas.width = SIZE;
  deathCanvas.height = SIZE;
  const dctx = deathCanvas.getContext('2d');
  // Fallen guard silhouette
  shadedRect(dctx, 10, 40, 44, 10, ['#3a3a3a', '#2a2a2a', '#1a1a1a']);
  pxRect(dctx, 14, 38, 10, 5, '#664444');
  scene.textures.addCanvas('guard_death', deathCanvas);
}

// ── TURRET SPRITES ──────────────────────────────────────────────
export function generateTurretSprites(scene) {
  const metal = ['#444444', '#555555', '#666666', '#777777', '#888888'];
  const sensor = '#ff2020';
  const sensorAlert = '#ffaa00';

  function drawTurret(ctx, alert, shooting, hit) {
    const cx = SIZE / 2;
    const baseY = 38;

    // Pedestal
    shadedRect(ctx, cx - 8, baseY, 16, 18, hit ? ['#664444', '#553333', '#442222'] : [metal[3], metal[2], metal[1]]);
    pxRect(ctx, cx - 10, baseY + 16, 20, 4, hit ? '#442222' : metal[0]);
    pxRect(ctx, cx - 10, baseY + 16, 20, 1, hit ? '#553333' : metal[4]);
    pxRect(ctx, cx - 12, baseY + 18, 24, 2, hit ? '#331111' : metal[0]);

    // Head/turret housing
    shadedRect(ctx, cx - 10, baseY - 10, 20, 12, hit ? ['#884444', '#773333', '#662222'] : [metal[4], metal[3], metal[2]]);
    pxRect(ctx, cx - 8, baseY - 12, 16, 3, hit ? '#775555' : metal[4]);

    // Sensor eye
    const sensorColor = hit ? '#ffffff' : alert ? sensorAlert : sensor;
    pxRect(ctx, cx - 3, baseY - 6, 6, 4, sensorColor);
    if (!hit) pxRect(ctx, cx - 1, baseY - 5, 2, 2, '#ffffff');

    // Barrel
    const barrelY = baseY - 4;
    if (shooting) {
      pxRect(ctx, cx + 10, barrelY, 20, 4, hit ? '#553333' : metal[1]);
      pxRect(ctx, cx + 10, barrelY, 20, 1, hit ? '#664444' : metal[3]);
      // Muzzle flash
      pxRect(ctx, cx + 30, barrelY - 2, 4, 8, '#ffaa00');
      pxRect(ctx, cx + 31, barrelY - 1, 3, 6, '#ffcc44');
      px(ctx, cx + 32, barrelY, '#ffffff');
    } else {
      pxRect(ctx, cx + 10, barrelY, 14, 4, hit ? '#553333' : metal[1]);
      pxRect(ctx, cx + 10, barrelY, 14, 1, hit ? '#664444' : metal[3]);
    }

    // Barrel mount
    pxRect(ctx, cx + 8, barrelY - 1, 4, 6, hit ? '#663333' : metal[2]);

    // Armor plating lines
    for (let i = 0; i < 3; i++) {
      pxRect(ctx, cx - 9, baseY - 8 + i * 4, 18, 1, hit ? '#553333' : metal[1]);
    }
  }

  // idle
  const idleCanvas = document.createElement('canvas');
  idleCanvas.width = SIZE;
  idleCanvas.height = SIZE;
  drawTurret(idleCanvas.getContext('2d'), false, false, false);
  scene.textures.addCanvas('turret_idle', idleCanvas);

  // alert
  const alertCanvas = document.createElement('canvas');
  alertCanvas.width = SIZE;
  alertCanvas.height = SIZE;
  drawTurret(alertCanvas.getContext('2d'), true, false, false);
  scene.textures.addCanvas('turret_alert', alertCanvas);

  // shoot
  const shootCanvas = document.createElement('canvas');
  shootCanvas.width = SIZE;
  shootCanvas.height = SIZE;
  drawTurret(shootCanvas.getContext('2d'), true, true, false);
  scene.textures.addCanvas('turret_shoot', shootCanvas);

  // hit
  const hitCanvas = document.createElement('canvas');
  hitCanvas.width = SIZE;
  hitCanvas.height = SIZE;
  drawTurret(hitCanvas.getContext('2d'), false, false, true);
  scene.textures.addCanvas('turret_hit', hitCanvas);

  // death
  const deathCanvas = document.createElement('canvas');
  deathCanvas.width = SIZE;
  deathCanvas.height = SIZE;
  const dctx = deathCanvas.getContext('2d');
  const sparks = ['#ff6600', '#ffaa00', '#888888', '#555555'];
  for (let i = 0; i < 25; i++) {
    const sx = SIZE / 2 + (Math.random() - 0.5) * 30;
    const sy = 40 + (Math.random() - 0.5) * 20;
    const s = 1 + Math.floor(Math.random() * 3);
    pxRect(dctx, sx, sy, s, s, sparks[Math.floor(Math.random() * sparks.length)]);
  }
  // Wrecked base
  shadedRect(dctx, SIZE / 2 - 10, 48, 20, 8, ['#3a3a3a', '#2a2a2a', '#1a1a1a']);
  scene.textures.addCanvas('turret_death', deathCanvas);
}

// ── ENEMY PROJECTILE ────────────────────────────────────────────
export function createEnemyProjectileTexture(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');

  ctx.shadowColor = '#ff3300';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#ff3300';
  ctx.beginPath();
  ctx.ellipse(8, 4, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffaa66';
  ctx.beginPath();
  ctx.ellipse(8, 4, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('enemy_bullet', canvas);
}
