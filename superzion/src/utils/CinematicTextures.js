// ═══════════════════════════════════════════════════════════════
// CinematicTextures — Shared procedural textures for cinematics
// ═══════════════════════════════════════════════════════════════

const PAL = {
  skin0: '#8a6040', skin1: '#b08657', skin2: '#c49668',
  skin3: '#d2a679', skin4: '#e0b689',
  hair0: '#0a0a0a', hair1: '#111110', hair2: '#1a1816',
  tac0: '#1a1a1a', tac1: '#222222', tac2: '#2a2a2a',
  tac3: '#333333', tac4: '#3a3a3a',
  vest0: '#4e4e52', vest1: '#58585c', vest2: '#626266',
  blk0: '#121212', blk1: '#1a1a1a', blk2: '#222222', blk3: '#2a2a2a',
  gld0: '#806010', gld1: '#a07a18', gld2: '#c49520',
  gld3: '#FFD700', gld4: '#eab530',
  stubble: 'rgba(30, 22, 16, 0.25)',
};

function px(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

// ── 1. SuperZion side-view character (64×96) ────────────────────
export function createSuperZionCinematic(scene) {
  if (scene.textures.exists('cin_superzion')) return;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 96;
  const ctx = c.getContext('2d');

  // Head (side view)
  ctx.fillStyle = PAL.skin2;
  ctx.beginPath(); ctx.arc(32, 16, 9, 0, Math.PI * 2); ctx.fill();
  // Slicked-back hair
  ctx.fillStyle = PAL.hair0;
  ctx.beginPath(); ctx.ellipse(32, 10, 8, 4, 0, Math.PI, 0); ctx.fill();
  // Side hair
  ctx.fillStyle = PAL.hair1;
  ctx.fillRect(23, 10, 3, 6);
  ctx.fillRect(38, 10, 3, 6);
  // Eye
  ctx.fillStyle = '#eeeee8';
  rect(ctx, 36, 14, 3, 2, '#eeeee8');
  rect(ctx, 37, 14, 1, 2, '#0e0e0e');
  // Ear
  rect(ctx, 23, 14, 2, 4, PAL.skin3);
  // Stubble / beard shadow
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      if ((dx + dy) % 3 === 0) {
        ctx.fillStyle = PAL.stubble;
        ctx.fillRect(32 + dx, 20 + dy, 1, 1);
      }
    }
  }

  // Torso
  rect(ctx, 24, 26, 16, 24, PAL.tac1);
  // Vest straps
  rect(ctx, 25, 26, 3, 20, PAL.vest1);
  rect(ctx, 36, 26, 3, 20, PAL.vest1);
  // Belt
  rect(ctx, 23, 48, 18, 3, PAL.blk1);
  rect(ctx, 30, 48, 4, 3, PAL.gld3);

  // Star of David on chest
  const sx = 31, sy = 36;
  ctx.strokeStyle = PAL.gld3;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 4); ctx.lineTo(sx + 4, sy + 3); ctx.lineTo(sx - 4, sy + 3); ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, sy + 4); ctx.lineTo(sx + 4, sy - 3); ctx.lineTo(sx - 4, sy - 3); ctx.closePath();
  ctx.stroke();

  // Arms
  rect(ctx, 16, 28, 8, 18, PAL.tac2);
  rect(ctx, 40, 28, 8, 18, PAL.tac2);
  // Gloves
  rect(ctx, 16, 44, 8, 4, PAL.blk2);
  rect(ctx, 40, 44, 8, 4, PAL.blk2);

  // Legs
  rect(ctx, 24, 52, 7, 24, PAL.tac0);
  rect(ctx, 33, 52, 7, 24, PAL.tac0);
  // Knee pads
  rect(ctx, 25, 62, 5, 3, PAL.blk2);
  rect(ctx, 34, 62, 5, 3, PAL.blk2);

  // Boots
  rect(ctx, 22, 76, 10, 8, PAL.blk0);
  rect(ctx, 32, 76, 10, 8, PAL.blk0);
  // Soles
  rect(ctx, 21, 83, 12, 2, PAL.blk1);
  rect(ctx, 31, 83, 12, 2, PAL.blk1);

  scene.textures.addCanvas('cin_superzion', c);
}

// ── 2. Radar desk with monitors (200×120) ──────────────────────
export function createRadarDesk(scene) {
  if (scene.textures.exists('cin_radar_desk')) return;
  const c = document.createElement('canvas');
  c.width = 200; c.height = 120;
  const ctx = c.getContext('2d');

  // Desk
  rect(ctx, 20, 70, 160, 8, '#4a3a28');
  // Desk legs
  rect(ctx, 30, 78, 6, 42, '#3a2a18');
  rect(ctx, 164, 78, 6, 42, '#3a2a18');
  // Desk front panel
  rect(ctx, 20, 78, 160, 30, '#3a2818');

  // Left monitor
  rect(ctx, 40, 20, 50, 50, '#1a1a1a');
  rect(ctx, 43, 23, 44, 44, '#041008');
  // Scanlines on left monitor
  for (let y = 23; y < 67; y += 3) {
    ctx.fillStyle = `rgba(0,255,0,${0.06 + Math.random() * 0.04})`;
    ctx.fillRect(43, y, 44, 1);
  }
  // Monitor stand
  rect(ctx, 58, 67, 14, 5, '#2a2a2a');

  // Right monitor
  rect(ctx, 110, 20, 50, 50, '#1a1a1a');
  rect(ctx, 113, 23, 44, 44, '#041008');
  for (let y = 23; y < 67; y += 3) {
    ctx.fillStyle = `rgba(0,180,0,${0.04 + Math.random() * 0.03})`;
    ctx.fillRect(113, y, 44, 1);
  }
  rect(ctx, 128, 67, 14, 5, '#2a2a2a');

  // Chair
  rect(ctx, 80, 85, 40, 6, '#555555');
  rect(ctx, 88, 91, 24, 20, '#444444');
  rect(ctx, 95, 111, 10, 8, '#333333');

  scene.textures.addCanvas('cin_radar_desk', c);
}

// ── 3. F-15 hangar interior (300×200) ──────────────────────────
export function createF15Hangar(scene) {
  if (scene.textures.exists('cin_f15_hangar')) return;
  const c = document.createElement('canvas');
  c.width = 300; c.height = 200;
  const ctx = c.getContext('2d');

  // Hangar walls
  rect(ctx, 0, 0, 300, 200, '#1a1816');
  // Floor
  rect(ctx, 0, 160, 300, 40, '#2a2622');
  // Floor lines
  ctx.strokeStyle = 'rgba(255,255,0,0.15)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath(); ctx.moveTo(0, 175); ctx.lineTo(300, 175); ctx.stroke();
  ctx.setLineDash([]);

  // Overhead lighting strips
  for (let x = 30; x < 280; x += 60) {
    rect(ctx, x, 5, 40, 4, '#aaaaaa');
    // Light glow
    const grad = ctx.createRadialGradient(x + 20, 7, 2, x + 20, 60, 80);
    grad.addColorStop(0, 'rgba(255,255,200,0.08)');
    grad.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - 20, 0, 80, 120);
  }

  // F-15 silhouette
  ctx.fillStyle = '#2a2a30';
  // Fuselage
  ctx.beginPath();
  ctx.moveTo(40, 120);
  ctx.lineTo(80, 110);
  ctx.lineTo(220, 105);
  ctx.lineTo(260, 110);
  ctx.lineTo(260, 130);
  ctx.lineTo(220, 135);
  ctx.lineTo(80, 130);
  ctx.closePath();
  ctx.fill();
  // Wings
  ctx.beginPath();
  ctx.moveTo(120, 105); ctx.lineTo(170, 70); ctx.lineTo(200, 100);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(120, 135); ctx.lineTo(170, 170); ctx.lineTo(200, 140);
  ctx.closePath(); ctx.fill();
  // Tail fins
  ctx.beginPath();
  ctx.moveTo(240, 105); ctx.lineTo(250, 80); ctx.lineTo(265, 100);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(240, 135); ctx.lineTo(250, 158); ctx.lineTo(265, 140);
  ctx.closePath(); ctx.fill();
  // Canopy
  rect(ctx, 82, 112, 30, 16, '#1a2a3a');
  ctx.strokeStyle = 'rgba(100,200,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(82, 112, 30, 16);
  // Nose cone
  ctx.fillStyle = '#222228';
  ctx.beginPath();
  ctx.moveTo(40, 120);
  ctx.lineTo(25, 120);
  ctx.lineTo(40, 115);
  ctx.closePath();
  ctx.fill();

  scene.textures.addCanvas('cin_f15_hangar', c);
}

// ── 4. Operations room (960×540) ───────────────────────────────
export function createOpsRoom(scene) {
  if (scene.textures.exists('cin_ops_room')) return;
  const c = document.createElement('canvas');
  c.width = 960; c.height = 540;
  const ctx = c.getContext('2d');

  // Dark room
  rect(ctx, 0, 0, 960, 540, '#080a0c');
  // Floor
  const floorGrad = ctx.createLinearGradient(0, 380, 0, 540);
  floorGrad.addColorStop(0, '#101214');
  floorGrad.addColorStop(1, '#181a1e');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 380, 960, 160);

  // Wall monitors
  const monitors = [
    { x: 80, y: 60, w: 160, h: 100 },
    { x: 280, y: 40, w: 180, h: 120 },
    { x: 520, y: 40, w: 180, h: 120 },
    { x: 740, y: 60, w: 160, h: 100 },
    { x: 380, y: 200, w: 220, h: 140 },
  ];
  for (const m of monitors) {
    rect(ctx, m.x - 3, m.y - 3, m.w + 6, m.h + 6, '#222222');
    rect(ctx, m.x, m.y, m.w, m.h, '#041008');
    // Scanlines
    for (let y = m.y; y < m.y + m.h; y += 3) {
      ctx.fillStyle = `rgba(0,255,0,${0.02 + Math.random() * 0.02})`;
      ctx.fillRect(m.x, y, m.w, 1);
    }
    // Ambient glow
    const glow = ctx.createRadialGradient(m.x + m.w / 2, m.y + m.h / 2, 10, m.x + m.w / 2, m.y + m.h / 2, m.w);
    glow.addColorStop(0, 'rgba(0,100,50,0.05)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(m.x - m.w / 2, m.y - m.h / 2, m.w * 2, m.h * 2);
  }

  // Blue ambient from below
  const ambGrad = ctx.createLinearGradient(0, 540, 0, 300);
  ambGrad.addColorStop(0, 'rgba(0,40,80,0.08)');
  ambGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ambGrad;
  ctx.fillRect(0, 300, 960, 240);

  scene.textures.addCanvas('cin_ops_room', c);
}

// ── 5. B-2 dark hangar (400×250) ───────────────────────────────
export function createB2Hangar(scene) {
  if (scene.textures.exists('cin_b2_hangar')) return;
  const c = document.createElement('canvas');
  c.width = 400; c.height = 250;
  const ctx = c.getContext('2d');

  // Very dark hangar
  rect(ctx, 0, 0, 400, 250, '#0a0808');
  // Floor
  rect(ctx, 0, 200, 400, 50, '#141210');

  // Spotlight cone from above
  const spot = ctx.createRadialGradient(200, 0, 5, 200, 140, 180);
  spot.addColorStop(0, 'rgba(255,255,220,0.12)');
  spot.addColorStop(0.5, 'rgba(255,255,200,0.04)');
  spot.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, 400, 250);

  // B-2 Spirit shape (flying wing — top view)
  ctx.fillStyle = '#181820';
  ctx.beginPath();
  ctx.moveTo(200, 80);   // nose
  ctx.lineTo(40, 160);   // left wing tip
  ctx.lineTo(80, 170);   // left trailing edge
  ctx.lineTo(160, 150);  // left inner
  ctx.lineTo(190, 165);  // left tail
  ctx.lineTo(200, 155);  // center tail
  ctx.lineTo(210, 165);  // right tail
  ctx.lineTo(240, 150);  // right inner
  ctx.lineTo(320, 170);  // right trailing edge
  ctx.lineTo(360, 160);  // right wing tip
  ctx.closePath();
  ctx.fill();
  // Engine intakes
  rect(ctx, 170, 110, 12, 8, '#101018');
  rect(ctx, 218, 110, 12, 8, '#101018');
  // Cockpit
  ctx.fillStyle = '#0a1020';
  ctx.beginPath();
  ctx.arc(200, 95, 8, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('cin_b2_hangar', c);
}

// ── 6. Documents table (200×100) ───────────────────────────────
export function createDocumentsTable(scene) {
  if (scene.textures.exists('cin_documents_table')) return;
  const c = document.createElement('canvas');
  c.width = 200; c.height = 100;
  const ctx = c.getContext('2d');

  // Table surface
  rect(ctx, 0, 0, 200, 100, '#4a3a28');
  rect(ctx, 0, 0, 200, 2, '#5a4a38');

  // Scattered documents
  const docs = [
    { x: 15, y: 12, w: 40, h: 52, r: -0.08 },
    { x: 65, y: 8,  w: 38, h: 50, r: 0.05 },
    { x: 115, y: 15, w: 42, h: 48, r: -0.12 },
    { x: 148, y: 10, w: 36, h: 46, r: 0.1 },
  ];
  for (const d of docs) {
    ctx.save();
    ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
    ctx.rotate(d.r);
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
    // Text lines
    for (let ly = -d.h / 2 + 5; ly < d.h / 2 - 5; ly += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(-d.w / 2 + 4, ly, d.w - 10 - Math.random() * 10, 1);
    }
    ctx.restore();
  }

  // Photo rectangles
  rect(ctx, 30, 65, 28, 22, '#303030');
  rect(ctx, 31, 66, 26, 20, '#505050');
  rect(ctx, 140, 60, 28, 22, '#303030');
  rect(ctx, 141, 61, 26, 20, '#505050');

  // Red "CLASSIFIED" stamp
  ctx.save();
  ctx.translate(100, 50);
  ctx.rotate(-0.2);
  ctx.strokeStyle = 'rgba(200,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-35, -8, 70, 16);
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = 'rgba(200,0,0,0.6)';
  ctx.fillText('CLASSIFIED', -30, 4);
  ctx.restore();

  scene.textures.addCanvas('cin_documents_table', c);
}

// ── 7. Cliff sunset background (960×540) ───────────────────────
export function createCliffBackground(scene) {
  if (scene.textures.exists('cin_cliff_bg')) return;
  const c = document.createElement('canvas');
  c.width = 960; c.height = 540;
  const ctx = c.getContext('2d');

  // Sunset sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#1a0a2e');
  sky.addColorStop(0.2, '#3a1848');
  sky.addColorStop(0.4, '#8a3030');
  sky.addColorStop(0.6, '#cc6620');
  sky.addColorStop(0.8, '#ee9918');
  sky.addColorStop(1, '#ffcc40');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 400);

  // Sun glow
  const sunGlow = ctx.createRadialGradient(480, 380, 20, 480, 380, 200);
  sunGlow.addColorStop(0, 'rgba(255,220,100,0.6)');
  sunGlow.addColorStop(0.3, 'rgba(255,180,60,0.2)');
  sunGlow.addColorStop(1, 'rgba(255,100,30,0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(200, 200, 560, 300);

  // Distant landscape below
  ctx.fillStyle = '#1a1008';
  ctx.beginPath();
  ctx.moveTo(0, 420);
  for (let x = 0; x <= 960; x += 20) {
    ctx.lineTo(x, 410 + Math.sin(x * 0.008) * 15 + Math.sin(x * 0.02) * 5);
  }
  ctx.lineTo(960, 540); ctx.lineTo(0, 540);
  ctx.closePath(); ctx.fill();

  // Rocky cliff (right side)
  ctx.fillStyle = '#0e0804';
  ctx.beginPath();
  ctx.moveTo(600, 540);
  ctx.lineTo(580, 430);
  ctx.lineTo(600, 390);
  ctx.lineTo(650, 350);
  ctx.lineTo(720, 330);
  ctx.lineTo(780, 340);
  ctx.lineTo(830, 360);
  ctx.lineTo(880, 380);
  ctx.lineTo(960, 400);
  ctx.lineTo(960, 540);
  ctx.closePath(); ctx.fill();

  // Cliff edge detail
  ctx.fillStyle = '#1a1008';
  ctx.beginPath();
  ctx.moveTo(600, 430);
  ctx.lineTo(650, 352);
  ctx.lineTo(660, 354);
  ctx.lineTo(612, 432);
  ctx.closePath(); ctx.fill();

  // Stars in upper sky
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * 960;
    const sy = Math.random() * 200;
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.3 + Math.random() * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('cin_cliff_bg', c);
}

// ── 8. SuperZion on cliff silhouette (128×128) ─────────────────
export function createSuperZionOnCliff(scene) {
  if (scene.textures.exists('cin_superzion_cliff')) return;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');

  // Figure silhouette against sunset
  ctx.fillStyle = '#0a0804';

  // Head
  ctx.beginPath(); ctx.arc(64, 28, 10, 0, Math.PI * 2); ctx.fill();
  // Flat-top hair shape (no dome)
  ctx.fillRect(54, 20, 20, 5);

  // Body
  rect(ctx, 54, 38, 20, 30, '#0a0804');
  // Arms (slightly wind-blown — one arm out)
  rect(ctx, 38, 42, 16, 6, '#0a0804');
  rect(ctx, 74, 40, 18, 6, '#0a0804');
  // Legs (standing pose)
  rect(ctx, 54, 68, 9, 32, '#0a0804');
  rect(ctx, 65, 68, 9, 32, '#0a0804');
  // Boots
  rect(ctx, 52, 98, 13, 6, '#0a0804');
  rect(ctx, 63, 98, 13, 6, '#0a0804');

  // Wind-blown gear strap
  ctx.strokeStyle = '#0a0804';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(74, 50);
  ctx.quadraticCurveTo(88, 46, 95, 52);
  ctx.stroke();

  // Subtle gold Star of David glow on chest
  ctx.strokeStyle = 'rgba(218,165,32,0.4)';
  ctx.lineWidth = 0.8;
  const sx = 64, sy = 52;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 5); ctx.lineTo(sx + 5, sy + 3); ctx.lineTo(sx - 5, sy + 3); ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, sy + 5); ctx.lineTo(sx + 5, sy - 3); ctx.lineTo(sx - 5, sy - 3); ctx.closePath();
  ctx.stroke();

  scene.textures.addCanvas('cin_superzion_cliff', c);
}

// ── 9. Tehran city panorama (960×540) ──────────────────────────
export function createTehranPanorama(scene) {
  if (scene.textures.exists('cin_tehran')) return;
  const c = document.createElement('canvas');
  c.width = 960; c.height = 540;
  const ctx = c.getContext('2d');

  // Night sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#0a0a1a');
  sky.addColorStop(0.5, '#141428');
  sky.addColorStop(1, '#1e1e30');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 400);

  // Stars
  for (let i = 0; i < 60; i++) {
    const sx = Math.random() * 960;
    const sy = Math.random() * 250;
    ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.3 + Math.random() * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // City skyline silhouette
  ctx.fillStyle = '#0e0e18';
  const buildings = [
    { x: 0, w: 60, h: 180 }, { x: 70, w: 45, h: 220 },
    { x: 125, w: 55, h: 160 }, { x: 190, w: 40, h: 250 },
    { x: 240, w: 70, h: 200 }, { x: 320, w: 50, h: 280 },
    { x: 380, w: 60, h: 190 }, { x: 450, w: 45, h: 240 },
    { x: 505, w: 55, h: 210 }, { x: 570, w: 40, h: 260 },
    { x: 620, w: 65, h: 175 }, { x: 695, w: 50, h: 230 },
    { x: 755, w: 55, h: 195 }, { x: 820, w: 45, h: 270 },
    { x: 875, w: 85, h: 200 },
  ];
  for (const b of buildings) {
    const by = 400 - b.h;
    ctx.fillRect(b.x, by, b.w, b.h);
    // Windows
    for (let wy = by + 8; wy < 395; wy += 12) {
      for (let wx = b.x + 5; wx < b.x + b.w - 5; wx += 10) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = `rgba(255,220,120,${0.1 + Math.random() * 0.2})`;
          ctx.fillRect(wx, wy, 4, 4);
        }
      }
    }
    ctx.fillStyle = '#0e0e18';
  }

  // Ground
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 400, 960, 140);

  // Distant mountain ridge
  ctx.fillStyle = '#12121e';
  ctx.beginPath();
  ctx.moveTo(0, 400);
  for (let x = 0; x <= 960; x += 15) {
    ctx.lineTo(x, 385 + Math.sin(x * 0.005) * 20 + Math.sin(x * 0.015) * 8);
  }
  ctx.lineTo(960, 400);
  ctx.closePath();
  ctx.fill();

  scene.textures.addCanvas('cin_tehran', c);
}

// ── 10. Beirut port panorama (960×540) ─────────────────────────
export function createBeirutPortPanorama(scene) {
  if (scene.textures.exists('cin_beirut_port')) return;
  const c = document.createElement('canvas');
  c.width = 960; c.height = 540;
  const ctx = c.getContext('2d');

  // Dawn sky over Mediterranean
  const sky = ctx.createLinearGradient(0, 0, 0, 350);
  sky.addColorStop(0, '#0a1428');
  sky.addColorStop(0.4, '#1a3050');
  sky.addColorStop(0.7, '#2a4060');
  sky.addColorStop(1, '#3a5575');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 350);

  // Sea
  const sea = ctx.createLinearGradient(0, 350, 0, 420);
  sea.addColorStop(0, '#1a3048');
  sea.addColorStop(1, '#0e2030');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 350, 960, 70);

  // Port skyline
  ctx.fillStyle = '#0c0c16';
  const portBuildings = [
    { x: 50, w: 80, h: 120 }, { x: 150, w: 60, h: 160 },
    { x: 230, w: 90, h: 140 }, { x: 340, w: 50, h: 200 },
    { x: 410, w: 70, h: 170 }, { x: 500, w: 80, h: 130 },
    { x: 600, w: 60, h: 190 }, { x: 680, w: 90, h: 150 },
    { x: 790, w: 70, h: 180 }, { x: 880, w: 80, h: 140 },
  ];
  for (const b of portBuildings) {
    ctx.fillRect(b.x, 350 - b.h, b.w, b.h);
  }

  // Ground / dock area
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 420, 960, 120);

  scene.textures.addCanvas('cin_beirut_port', c);
}

// ── 11. Lebanon coast panorama (960×540) ───────────────────────
export function createLebanonCoastPanorama(scene) {
  if (scene.textures.exists('cin_lebanon_coast')) return;
  const c = document.createElement('canvas');
  c.width = 960; c.height = 540;
  const ctx = c.getContext('2d');

  // Twilight sky
  const sky = ctx.createLinearGradient(0, 0, 0, 350);
  sky.addColorStop(0, '#0c1020');
  sky.addColorStop(0.5, '#1a2848');
  sky.addColorStop(1, '#2a3858');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 350);

  // Mediterranean sea
  ctx.fillStyle = '#0e1830';
  ctx.fillRect(0, 350, 960, 100);

  // Coastal mountains
  ctx.fillStyle = '#0a0e1a';
  ctx.beginPath();
  ctx.moveTo(0, 340);
  for (let x = 0; x <= 960; x += 20) {
    ctx.lineTo(x, 300 + Math.sin(x * 0.004) * 40 + Math.sin(x * 0.012) * 15);
  }
  ctx.lineTo(960, 450); ctx.lineTo(0, 450);
  ctx.closePath();
  ctx.fill();

  // Ground
  ctx.fillStyle = '#080a14';
  ctx.fillRect(0, 450, 960, 90);

  scene.textures.addCanvas('cin_lebanon_coast', c);
}

// ── 12. Fortress panorama (960×540) ────────────────────────────
export function createFortressPanorama(scene) {
  if (scene.textures.exists('cin_fortress')) return;
  const c = document.createElement('canvas');
  c.width = 960; c.height = 540;
  const ctx = c.getContext('2d');

  // Dark stormy sky
  const sky = ctx.createLinearGradient(0, 0, 0, 350);
  sky.addColorStop(0, '#080810');
  sky.addColorStop(0.5, '#101020');
  sky.addColorStop(1, '#181828');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 350);

  // Fortress walls
  ctx.fillStyle = '#141420';
  ctx.fillRect(200, 180, 560, 170);
  // Towers
  ctx.fillRect(180, 120, 60, 230);
  ctx.fillRect(720, 120, 60, 230);
  // Battlements
  for (let x = 200; x < 760; x += 30) {
    ctx.fillRect(x, 165, 15, 20);
  }

  // Ground
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 350, 960, 190);

  scene.textures.addCanvas('cin_fortress', c);
}

// ── 13. Natanz panorama (960×540) ──────────────────────────────
export function createNatanzPanorama(scene) {
  if (scene.textures.exists('cin_natanz')) return;
  const c = document.createElement('canvas');
  c.width = 960; c.height = 540;
  const ctx = c.getContext('2d');

  // Desert night sky
  const sky = ctx.createLinearGradient(0, 0, 0, 380);
  sky.addColorStop(0, '#0a0812');
  sky.addColorStop(0.5, '#1a1420');
  sky.addColorStop(1, '#2a2028');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 380);

  // Stars
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.35})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 960, Math.random() * 220, 0.3 + Math.random() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Facility structures
  ctx.fillStyle = '#121218';
  ctx.fillRect(300, 260, 360, 120);
  // Dome
  ctx.beginPath();
  ctx.arc(480, 260, 60, Math.PI, 0);
  ctx.fill();
  // Cooling towers
  ctx.fillRect(200, 240, 40, 140);
  ctx.fillRect(720, 240, 40, 140);

  // Desert ground
  ctx.fillStyle = '#1a1610';
  ctx.fillRect(0, 380, 960, 160);

  scene.textures.addCanvas('cin_natanz', c);
}

// ── 14. Gaza panorama (960×540) ────────────────────────────────
export function createGazaPanorama(scene) {
  if (scene.textures.exists('cin_gaza')) return;
  const c = document.createElement('canvas');
  c.width = 960; c.height = 540;
  const ctx = c.getContext('2d');

  // Dark urban sky
  const sky = ctx.createLinearGradient(0, 0, 0, 360);
  sky.addColorStop(0, '#080810');
  sky.addColorStop(0.5, '#0e0e1a');
  sky.addColorStop(1, '#141420');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 960, 360);

  // Urban skyline — dense low buildings
  ctx.fillStyle = '#0a0a14';
  for (let x = 0; x < 960; x += 25 + Math.floor(Math.random() * 15)) {
    const bw = 20 + Math.floor(Math.random() * 25);
    const bh = 60 + Math.floor(Math.random() * 100);
    ctx.fillRect(x, 360 - bh, bw, bh);
  }

  // Ground
  ctx.fillStyle = '#0c0c10';
  ctx.fillRect(0, 360, 960, 180);

  // Tunnel entrance hint (dark opening)
  ctx.fillStyle = '#040408';
  ctx.beginPath();
  ctx.arc(480, 450, 30, Math.PI, 0);
  ctx.fillRect(450, 430, 60, 40);
  ctx.fill();

  scene.textures.addCanvas('cin_gaza', c);
}
