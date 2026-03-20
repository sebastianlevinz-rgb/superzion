// ===================================================================
// PortSwapTextures — All textures for Level 2: Operation Explosive Interception
// Top-down stealth at Beirut port (32×32 tile base)
// ===================================================================

const T = 32;

function mc(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// ── Concrete dock floor 32×32 ──
function drawFloor() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, T, T);
  // Subtle grid
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, T, T);
  // Cracks
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.moveTo(6, 14); ctx.lineTo(18, 20);
  ctx.stroke();
  // Speckles
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(5, 5, 2, 2);
  ctx.fillRect(22, 26, 2, 2);
  ctx.fillRect(14, 8, 2, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(10, 22, 2, 2);
  ctx.fillRect(26, 12, 2, 2);
  return c;
}

// ── Water tile 32×32 ──
function drawWater() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2a7a9a';
  ctx.fillRect(0, 0, T, T);
  // Wave lines
  ctx.strokeStyle = 'rgba(100,200,230,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.quadraticCurveTo(8, 6, 16, 10);
  ctx.quadraticCurveTo(24, 14, 32, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.quadraticCurveTo(8, 18, 16, 22);
  ctx.quadraticCurveTo(24, 26, 32, 22);
  ctx.stroke();
  // Shimmer
  ctx.fillStyle = 'rgba(180,230,255,0.1)';
  ctx.fillRect(8, 4, 3, 2);
  ctx.fillRect(20, 16, 3, 2);
  return c;
}

// ── Dock edge (concrete with yellow stripe) ──
function drawDockEdge() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#7a7a7a';
  ctx.fillRect(0, 0, T, T);
  // Yellow safety stripe
  ctx.fillStyle = '#ccaa22';
  ctx.fillRect(0, 0, T, 4);
  // Bollard dots
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.arc(16, 16, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#666';
  ctx.beginPath(); ctx.arc(16, 16, 2, 0, Math.PI * 2); ctx.fill();
  return c;
}

// ── Road tile ──
function drawRoad() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, 0, T, T);
  // Center line dashes
  ctx.strokeStyle = 'rgba(200,200,50,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(16, 0); ctx.lineTo(16, T);
  ctx.stroke();
  ctx.setLineDash([]);
  return c;
}

// ── Container top-down (48×24) ──
function drawContainer(color) {
  const c = mc(48, 24);
  const ctx = c.getContext('2d');
  const colors = {
    red:    { base: '#aa2222', top: '#cc3333', shadow: '#881818' },
    blue:   { base: '#2244aa', top: '#3366cc', shadow: '#1a3388' },
    green:  { base: '#228844', top: '#33aa55', shadow: '#186633' },
    yellow: { base: '#aa8822', top: '#ccaa33', shadow: '#886618' },
    orange: { base: '#cc6622', top: '#dd8833', shadow: '#aa4418' },
  };
  const clr = colors[color] || colors.red;

  // Shadow
  ctx.fillStyle = clr.shadow;
  ctx.fillRect(2, 2, 46, 22);
  // Main body
  ctx.fillStyle = clr.base;
  ctx.fillRect(0, 0, 46, 22);
  // Top highlight
  ctx.fillStyle = clr.top;
  ctx.fillRect(0, 0, 46, 4);
  // Ribs (corrugated roof lines)
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  for (let x = 6; x < 44; x += 6) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 22); ctx.stroke();
  }
  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 45, 21);
  return c;
}

// ── Container with farsi/special markings ──
function drawContainerMarked(color) {
  const c = drawContainer(color);
  const ctx = c.getContext('2d');
  // "Markings" — small symbols
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '8px monospace';
  ctx.fillText('☆', 20, 16);
  ctx.fillRect(34, 8, 6, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(35, 9, 4, 4);
  return c;
}

// ── Character drawing 32×32 (top-down) ──
function drawCharacter(dir, frame, opts = {}) {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  const cx = T / 2, cy = T / 2;
  const {
    bodyColor = '#ffffff',
    headColor = '#e8d4b8',
    hardhat = false,
    hatColor = '#ccaa00',
    vest = false,
    vestColor = '#ff6600',
    rifle = false,
    beret = false,
    flashlight = false,
    uniformCap = false,
  } = opts;

  const walkOffset = frame === 1 ? 1 : 0;

  // Body
  ctx.fillStyle = bodyColor;
  if (dir === 'down' || dir === 'up') {
    ctx.fillRect(cx - 6, cy - 2, 12, 12);
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(cx - 5, cy + 10, 4, 6 + walkOffset);
    ctx.fillRect(cx + 1, cy + 10, 4, 6 - walkOffset);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(cx - 9, cy, 3, 8);
    ctx.fillRect(cx + 6, cy, 3, 8);
  } else {
    ctx.fillRect(cx - 5, cy - 2, 10, 12);
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(cx - 3, cy + 10, 4, 6 + walkOffset);
    ctx.fillRect(cx + 1, cy + 10, 4, 6 - walkOffset);
    ctx.fillStyle = bodyColor;
    if (dir === 'left') ctx.fillRect(cx - 7, cy, 3, 8);
    else ctx.fillRect(cx + 5, cy, 3, 8);
  }

  // Vest overlay
  if (vest) {
    ctx.fillStyle = vestColor;
    if (dir === 'down' || dir === 'up') {
      ctx.fillRect(cx - 6, cy - 1, 12, 8);
      // Reflective stripes
      ctx.fillStyle = '#ffff88';
      ctx.fillRect(cx - 5, cy + 1, 10, 1);
      ctx.fillRect(cx - 5, cy + 4, 10, 1);
    } else {
      ctx.fillRect(cx - 5, cy - 1, 10, 8);
      ctx.fillStyle = '#ffff88';
      ctx.fillRect(cx - 4, cy + 1, 8, 1);
      ctx.fillRect(cx - 4, cy + 4, 8, 1);
    }
  }

  // Hands
  ctx.fillStyle = headColor;
  if (dir === 'down' || dir === 'up') {
    ctx.fillRect(cx - 9, cy + 7, 3, 2);
    ctx.fillRect(cx + 6, cy + 7, 3, 2);
  } else if (dir === 'left') {
    ctx.fillRect(cx - 7, cy + 7, 3, 2);
  } else {
    ctx.fillRect(cx + 5, cy + 7, 3, 2);
  }

  // Head
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 7, 0, Math.PI * 2);
  ctx.fill();

  // Face
  if (dir === 'down') {
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - 4, cy - 7, 2, 2);
    ctx.fillRect(cx + 2, cy - 7, 2, 2);
    ctx.fillRect(cx - 1, cy - 3, 3, 1);
  } else if (dir === 'left') {
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - 5, cy - 7, 2, 2);
    ctx.fillRect(cx - 2, cy - 3, 2, 1);
  } else if (dir === 'right') {
    ctx.fillStyle = '#222';
    ctx.fillRect(cx + 3, cy - 7, 2, 2);
    ctx.fillRect(cx + 1, cy - 3, 2, 1);
  }

  // Hardhat — larger, rounder, with visor and highlights
  if (hardhat) {
    // Main dome — rounder, larger arc
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 9, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    // Brim — wider, curved
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Front visor — extends forward
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 8);
    ctx.quadraticCurveTo(cx, cy - 5, cx + 8, cy - 8);
    ctx.quadraticCurveTo(cx, cy - 6.5, cx - 8, cy - 8);
    ctx.closePath();
    ctx.fillStyle = hatColor;
    ctx.fill();
    // Ridge line on top
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 16);
    ctx.quadraticCurveTo(cx, cy - 17.5, cx + 5, cy - 16);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Reflective highlight — bright arc on dome
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 14, 4, Math.PI * 1.2, Math.PI * 1.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Secondary highlight
    ctx.beginPath();
    ctx.arc(cx + 3, cy - 12, 2.5, Math.PI * 1.3, Math.PI * 1.7);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Uniform cap (security)
  if (uniformCap) {
    ctx.fillStyle = '#1a1a3a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 7, cy - 11, 14, 2);
    // Badge
    ctx.fillStyle = '#ccaa44';
    ctx.fillRect(cx - 2, cy - 12, 4, 2);
  }

  // Beret
  if (beret) {
    ctx.fillStyle = '#3a4a30';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 11, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 7, cy - 12, 14, 2);
  }

  // Rifle
  if (rifle) {
    ctx.fillStyle = '#3a3a3a';
    if (dir === 'right') {
      ctx.fillRect(cx + 7, cy - 2, 10, 2);
      ctx.fillRect(cx + 15, cy - 4, 2, 4);
    } else if (dir === 'left') {
      ctx.fillRect(cx - 17, cy - 2, 10, 2);
      ctx.fillRect(cx - 17, cy - 4, 2, 4);
    } else if (dir === 'down') {
      ctx.fillRect(cx + 7, cy + 2, 8, 2);
    } else {
      ctx.fillRect(cx - 15, cy + 2, 8, 2);
    }
  }

  // Flashlight beam hint (small)
  if (flashlight) {
    ctx.fillStyle = 'rgba(255,255,200,0.3)';
    if (dir === 'down') ctx.fillRect(cx + 7, cy + 4, 3, 4);
    else if (dir === 'up') ctx.fillRect(cx - 10, cy - 2, 3, 4);
    else if (dir === 'right') ctx.fillRect(cx + 8, cy + 4, 4, 3);
    else ctx.fillRect(cx - 12, cy + 4, 4, 3);
  }

  return c;
}

// ── Ship (large, 160×48 top-down) ──
function drawShip() {
  const c = mc(160, 48);
  const ctx = c.getContext('2d');
  // Hull
  ctx.fillStyle = '#3a3a4a';
  ctx.beginPath();
  ctx.moveTo(10, 8);
  ctx.lineTo(140, 4);
  ctx.lineTo(155, 24);
  ctx.lineTo(140, 44);
  ctx.lineTo(10, 40);
  ctx.lineTo(2, 24);
  ctx.closePath();
  ctx.fill();
  // Deck
  ctx.fillStyle = '#5a5a6a';
  ctx.fillRect(20, 12, 110, 24);
  // Bridge (superstructure)
  ctx.fillStyle = '#888';
  ctx.fillRect(25, 16, 20, 16);
  ctx.fillStyle = '#aaddff';
  ctx.fillRect(28, 18, 6, 4);
  ctx.fillRect(36, 18, 6, 4);
  // Container stack on deck
  ctx.fillStyle = '#aa3333';
  ctx.fillRect(55, 14, 16, 8);
  ctx.fillStyle = '#3366aa';
  ctx.fillRect(73, 14, 16, 8);
  ctx.fillStyle = '#33aa55';
  ctx.fillRect(55, 24, 16, 8);
  ctx.fillStyle = '#ccaa33';
  ctx.fillRect(73, 24, 16, 8);
  ctx.fillStyle = '#cc6633';
  ctx.fillRect(91, 14, 16, 20);
  // Bow markings
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 12); ctx.lineTo(150, 24); ctx.lineTo(120, 36);
  ctx.stroke();
  return c;
}

// ── Gantry crane (64×40) ──
function drawCrane() {
  const c = mc(64, 40);
  const ctx = c.getContext('2d');
  // Legs
  ctx.fillStyle = '#cc6622';
  ctx.fillRect(4, 0, 4, 40);
  ctx.fillRect(56, 0, 4, 40);
  // Cross beam
  ctx.fillStyle = '#dd7733';
  ctx.fillRect(0, 2, 64, 6);
  // Trolley
  ctx.fillStyle = '#888';
  ctx.fillRect(26, 0, 12, 8);
  // Cable
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 8); ctx.lineTo(32, 30);
  ctx.stroke();
  // Spreader
  ctx.fillStyle = '#666';
  ctx.fillRect(24, 28, 16, 4);
  return c;
}

// ── Office building (64×48) ──
function drawBuilding() {
  const c = mc(64, 48);
  const ctx = c.getContext('2d');
  // Main structure
  ctx.fillStyle = '#7a7a72';
  ctx.fillRect(0, 0, 64, 48);
  // Roof edge
  ctx.fillStyle = '#5a5a55';
  ctx.fillRect(0, 0, 64, 4);
  // Windows
  ctx.fillStyle = '#aaddff';
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.fillRect(6 + col * 15, 10 + row * 16, 8, 6);
    }
  }
  // Door
  ctx.fillStyle = '#4a4a44';
  ctx.fillRect(26, 38, 12, 10);
  return c;
}

// ── Security camera on pole (16×16) ──
function drawCameraSprite() {
  const c = mc(16, 16);
  const ctx = c.getContext('2d');
  // Pole
  ctx.fillStyle = '#666';
  ctx.fillRect(7, 8, 2, 8);
  // Camera body
  ctx.fillStyle = '#333';
  ctx.fillRect(4, 4, 8, 6);
  // Lens
  ctx.fillStyle = '#ff3333';
  ctx.beginPath();
  ctx.arc(8, 6, 2, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

// ── Distraction rock (8×8) ──
function drawRock() {
  const c = mc(8, 8);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(4, 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#888';
  ctx.fillRect(2, 2, 2, 2);
  return c;
}

// ── Distraction icon (16×16 for HUD) ──
function drawDistractionIcon() {
  const c = mc(16, 16);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.arc(8, 10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#aaa';
  ctx.fillRect(5, 6, 3, 3);
  // Sound wave arcs
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(8, 4, 3, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
  ctx.beginPath(); ctx.arc(8, 4, 5, Math.PI * 1.3, Math.PI * 1.7); ctx.stroke();
  return c;
}

// ── Mountain backdrop (960×60) ──
function drawMountainBackdrop() {
  const c = mc(960, 60);
  const ctx = c.getContext('2d');
  // Sky
  const grad = ctx.createLinearGradient(0, 0, 0, 60);
  grad.addColorStop(0, '#87CEEB');
  grad.addColorStop(1, '#aaddee');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 960, 60);
  // Mountains (Lebanon range)
  ctx.fillStyle = '#7a8a6a';
  ctx.beginPath();
  ctx.moveTo(0, 60);
  ctx.lineTo(0, 35); ctx.lineTo(60, 20); ctx.lineTo(120, 30);
  ctx.lineTo(180, 12); ctx.lineTo(250, 28); ctx.lineTo(320, 8);
  ctx.lineTo(400, 25); ctx.lineTo(480, 15); ctx.lineTo(560, 30);
  ctx.lineTo(640, 10); ctx.lineTo(720, 22); ctx.lineTo(800, 18);
  ctx.lineTo(880, 28); ctx.lineTo(960, 20); ctx.lineTo(960, 60);
  ctx.closePath();
  ctx.fill();
  // Snow caps
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.moveTo(172, 16); ctx.lineTo(180, 12); ctx.lineTo(188, 16); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(314, 12); ctx.lineTo(320, 8); ctx.lineTo(326, 12); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(634, 14); ctx.lineTo(640, 10); ctx.lineTo(646, 14); ctx.closePath();
  ctx.fill();
  // City silhouette
  ctx.fillStyle = '#9a9a8a';
  ctx.fillRect(50, 42, 12, 18);
  ctx.fillRect(66, 38, 8, 22);
  ctx.fillRect(78, 44, 10, 16);
  ctx.fillRect(130, 40, 14, 20);
  ctx.fillRect(148, 46, 8, 14);
  ctx.fillRect(700, 42, 10, 18);
  ctx.fillRect(716, 36, 12, 24);
  ctx.fillRect(732, 44, 8, 16);
  return c;
}

// ── Exit marker (32×32 arrow) ──
function drawExitMarker() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#00ff66';
  ctx.beginPath();
  ctx.moveTo(16, 4);
  ctx.lineTo(28, 20);
  ctx.lineTo(20, 20);
  ctx.lineTo(20, 28);
  ctx.lineTo(12, 28);
  ctx.lineTo(12, 20);
  ctx.lineTo(4, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,255,100,0.3)';
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

// ══════════════════════════════════════════════════
// Main export: generate all textures for the scene
// ══════════════════════════════════════════════════
export function generatePortSwapTextures(scene) {
  if (scene.textures.exists('ps_floor')) return; // already generated

  // Tiles
  scene.textures.addCanvas('ps_floor', drawFloor());
  scene.textures.addCanvas('ps_water', drawWater());
  scene.textures.addCanvas('ps_dock_edge', drawDockEdge());
  scene.textures.addCanvas('ps_road', drawRoad());

  // Containers (5 colors)
  for (const color of ['red', 'blue', 'green', 'yellow', 'orange']) {
    scene.textures.addCanvas(`ps_container_${color}`, drawContainer(color));
    scene.textures.addCanvas(`ps_container_${color}_marked`, drawContainerMarked(color));
  }

  // Player (disguised as worker: hardhat + orange vest)
  const playerOpts = {
    bodyColor: '#4466aa', headColor: '#e8d4b8',
    hardhat: true, hatColor: '#ccaa00',
    vest: true, vestColor: '#ff6600',
  };
  for (const dir of ['up', 'down', 'left', 'right']) {
    for (const frame of [0, 1]) {
      scene.textures.addCanvas(
        `ps_player_${dir}_${frame}`,
        drawCharacter(dir, frame, playerOpts)
      );
    }
  }

  // Security guards (dark uniform, cap, rifle)
  const guardOpts = {
    bodyColor: '#1a1a3a', headColor: '#c8b098',
    uniformCap: true, rifle: true, flashlight: true,
  };
  for (const dir of ['up', 'down', 'left', 'right']) {
    for (const frame of [0, 1]) {
      scene.textures.addCanvas(
        `ps_guard_${dir}_${frame}`,
        drawCharacter(dir, frame, guardOpts)
      );
    }
  }

  // Port workers (plain clothes, hardhat)
  const workerOpts = {
    bodyColor: '#557755', headColor: '#d8c4a8',
    hardhat: true, hatColor: '#dddddd',
    vest: true, vestColor: '#ffaa00',
  };
  for (const dir of ['up', 'down', 'left', 'right']) {
    for (const frame of [0, 1]) {
      scene.textures.addCanvas(
        `ps_worker_${dir}_${frame}`,
        drawCharacter(dir, frame, workerOpts)
      );
    }
  }

  // Large objects
  scene.textures.addCanvas('ps_ship', drawShip());
  scene.textures.addCanvas('ps_crane', drawCrane());
  scene.textures.addCanvas('ps_building', drawBuilding());
  scene.textures.addCanvas('ps_camera', drawCameraSprite());

  // Items
  scene.textures.addCanvas('ps_rock', drawRock());
  scene.textures.addCanvas('ps_distraction_icon', drawDistractionIcon());
  scene.textures.addCanvas('ps_exit', drawExitMarker());

  // Backdrop
  scene.textures.addCanvas('ps_mountains_bg', drawMountainBackdrop());
}
