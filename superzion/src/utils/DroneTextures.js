// ═══════════════════════════════════════════════════════════════
// DroneTextures — Level 4: Operation Underground textures
// Top-down drone, daytime ruined city, boss room (daylight)
// ═══════════════════════════════════════════════════════════════

const W = 960;
const H = 540;

// ── Drone top-view sprite (64x64) ────────────────────────────
export function createDroneSprite(scene) {
  if (scene.textures.exists('drone_top')) return;

  const s = 64;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2, cy = s / 2;

  // Main body (rounded rectangle shape)
  ctx.fillStyle = '#3a3a42';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 14);
  ctx.lineTo(cx + 8, cy - 14);
  ctx.lineTo(cx + 10, cy - 8);
  ctx.lineTo(cx + 10, cy + 10);
  ctx.lineTo(cx + 6, cy + 14);
  ctx.lineTo(cx - 6, cy + 14);
  ctx.lineTo(cx - 10, cy + 10);
  ctx.lineTo(cx - 10, cy - 8);
  ctx.closePath();
  ctx.fill();

  // Body highlight
  ctx.fillStyle = '#5a5a62';
  ctx.fillRect(cx - 6, cy - 12, 12, 8);

  // Camera lens (front)
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.arc(cx, cy - 10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,200,255,0.5)';
  ctx.beginPath();
  ctx.arc(cx, cy - 10, 2, 0, Math.PI * 2);
  ctx.fill();

  // Arms (4 diagonal)
  ctx.strokeStyle = '#4a4a52';
  ctx.lineWidth = 3;
  const armLen = 18;
  const armAngles = [-0.7, 0.7, Math.PI - 0.7, Math.PI + 0.7];
  const rotorPositions = [];
  for (const a of armAngles) {
    const ex = cx + Math.cos(a) * armLen;
    const ey = cy + Math.sin(a) * armLen;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    rotorPositions.push({ x: ex, y: ey });
  }

  // Rotors (circles at arm ends)
  for (const rp of rotorPositions) {
    // Rotor disc
    ctx.fillStyle = 'rgba(150,150,160,0.3)';
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, 8, 0, Math.PI * 2);
    ctx.fill();
    // Motor hub
    ctx.fillStyle = '#2a2a32';
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // LED indicators
  ctx.fillStyle = '#00ff00';
  ctx.beginPath(); ctx.arc(cx - 6, cy + 12, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff0000';
  ctx.beginPath(); ctx.arc(cx + 6, cy + 12, 1.5, 0, Math.PI * 2); ctx.fill();

  // Star of David (small, on body)
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 0.6;
  const sr = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 2 - sr);
  ctx.lineTo(cx - sr * 0.87, cy + 2 + sr * 0.5);
  ctx.lineTo(cx + sr * 0.87, cy + 2 + sr * 0.5);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + 2 + sr);
  ctx.lineTo(cx - sr * 0.87, cy + 2 - sr * 0.5);
  ctx.lineTo(cx + sr * 0.87, cy + 2 - sr * 0.5);
  ctx.closePath();
  ctx.stroke();

  scene.textures.addCanvas('drone_top', c);
}

// ── Daytime sky (960x540) ────────────────────────────────────
export function createDaytimeSky(scene) {
  if (scene.textures.exists('daytime_sky')) return;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Blue gradient sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#87CEEB');
  skyGrad.addColorStop(0.6, '#B8E0F0');
  skyGrad.addColorStop(1, '#E0F0FF');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Warm sunlight wash (upper-right quadrant)
  const sunGrad = ctx.createRadialGradient(W * 0.8, H * 0.15, 20, W * 0.8, H * 0.15, 300);
  sunGrad.addColorStop(0, 'rgba(255, 240, 200, 0.35)');
  sunGrad.addColorStop(0.4, 'rgba(255, 230, 180, 0.15)');
  sunGrad.addColorStop(1, 'rgba(255, 220, 160, 0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, W, H);

  // Wispy clouds
  const clouds = [
    { x: 120, y: 60, w: 180, h: 35 },
    { x: 400, y: 90, w: 220, h: 40 },
    { x: 650, y: 40, w: 160, h: 28 },
    { x: 280, y: 150, w: 140, h: 25 },
    { x: 780, y: 120, w: 130, h: 22 },
  ];
  for (const cl of clouds) {
    // Cloud body (multiple overlapping ellipses)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 5; i++) {
      const ox = cl.x + (i - 2) * (cl.w / 5);
      const oy = cl.y + (Math.random() - 0.5) * cl.h * 0.3;
      const rw = cl.w / 3 + Math.random() * cl.w / 6;
      const rh = cl.h * 0.6 + Math.random() * cl.h * 0.4;
      ctx.beginPath();
      ctx.ellipse(ox, oy, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Lighter core
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(cl.x, cl.y, cl.w * 0.3, cl.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('daytime_sky', c);
}

// ── Ruined city tile variant 1 (200x540) ─────────────────────
export function createRuinedCityTile(scene) {
  if (scene.textures.exists('ruined_city_tile')) return;

  const tw = 200, th = 540;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Building facade base — concrete gray
  ctx.fillStyle = '#8A8A8A';
  ctx.fillRect(0, 0, tw, th);

  // Building surface texture
  for (let i = 0; i < 300; i++) {
    const shade = 120 + Math.random() * 40;
    ctx.fillStyle = `rgba(${shade}, ${shade - 5}, ${shade - 10}, 0.15)`;
    ctx.fillRect(Math.random() * tw, Math.random() * th, 2 + Math.random() * 6, 1 + Math.random() * 4);
  }

  // Floors (3-4 visible)
  const floors = [0, 135, 270, 405];
  const floorH = 130;
  for (let fi = 0; fi < floors.length; fi++) {
    const fy = floors[fi];

    // Floor line
    ctx.fillStyle = '#6A6A6A';
    ctx.fillRect(0, fy, tw, 3);

    // Windows on this floor
    const numWins = 3;
    for (let wi = 0; wi < numWins; wi++) {
      const wx = 20 + wi * 60;
      const wy = fy + 20;
      const ww = 40, wh = 55;

      // Some windows are blown out (missing)
      if ((fi + wi) % 3 === 0) {
        // Missing wall section — dark interior
        ctx.fillStyle = '#2A2520';
        ctx.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
        // Exposed interior room
        ctx.fillStyle = '#3A3530';
        ctx.fillRect(wx, wy, ww, wh);
        // Furniture visible: table shape
        if (fi === 1) {
          ctx.fillStyle = '#5A4A3A';
          ctx.fillRect(wx + 8, wy + 30, 24, 4);
          ctx.fillRect(wx + 10, wy + 34, 3, 15);
          ctx.fillRect(wx + 28, wy + 34, 3, 15);
        }
        // Shelf shape
        if (fi === 2) {
          ctx.fillStyle = '#4A3A28';
          ctx.fillRect(wx + 5, wy + 10, 30, 3);
          ctx.fillRect(wx + 5, wy + 25, 30, 3);
          ctx.fillRect(wx + 5, wy + 40, 30, 3);
        }
      } else {
        // Intact but dirty window
        ctx.fillStyle = '#1A1A22';
        ctx.fillRect(wx, wy, ww, wh);
        // Glass reflection
        ctx.fillStyle = 'rgba(135, 206, 235, 0.15)';
        ctx.fillRect(wx + 2, wy + 2, ww / 2 - 2, wh / 2 - 2);
        // Frame
        ctx.strokeStyle = '#6A6A6A';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, wy, ww, wh);
        // Cross bar
        ctx.beginPath();
        ctx.moveTo(wx + ww / 2, wy);
        ctx.lineTo(wx + ww / 2, wy + wh);
        ctx.moveTo(wx, wy + wh / 2);
        ctx.lineTo(wx + ww, wy + wh / 2);
        ctx.stroke();
      }
    }
  }

  // Collapsed roof edge with rebar
  ctx.fillStyle = '#7A7A7A';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tw * 0.6, 0);
  ctx.lineTo(tw * 0.5, 15);
  ctx.lineTo(tw * 0.3, 8);
  ctx.lineTo(0, 12);
  ctx.closePath();
  ctx.fill();
  // Rebar sticking out
  ctx.strokeStyle = '#8A4A2A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tw * 0.5, 12);
  ctx.lineTo(tw * 0.55, -5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tw * 0.35, 6);
  ctx.lineTo(tw * 0.4, -8);
  ctx.stroke();

  // Damage: missing wall section (large hole)
  ctx.fillStyle = '#2A2218';
  ctx.beginPath();
  ctx.moveTo(140, 180);
  ctx.lineTo(195, 200);
  ctx.lineTo(200, 260);
  ctx.lineTo(180, 270);
  ctx.lineTo(150, 250);
  ctx.lineTo(130, 210);
  ctx.closePath();
  ctx.fill();

  // Hanging cables from broken walls
  ctx.strokeStyle = 'rgba(60, 60, 70, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(145, 180);
  ctx.quadraticCurveTo(155, 230, 140, 270);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(100, 40, 30, 0.6)';
  ctx.beginPath();
  ctx.moveTo(170, 195);
  ctx.quadraticCurveTo(180, 240, 165, 280);
  ctx.stroke();

  // Rubble at base
  const rubbleY = th - 60;
  ctx.fillStyle = '#9A9080';
  for (let i = 0; i < 20; i++) {
    const rx = Math.random() * tw;
    const ry = rubbleY + Math.random() * 50;
    const rs = 3 + Math.random() * 12;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + rs, ry + Math.random() * 4);
    ctx.lineTo(rx + rs - 2, ry + rs * 0.6);
    ctx.lineTo(rx - 1, ry + rs * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // Craters in street area at bottom
  ctx.fillStyle = 'rgba(60, 55, 45, 0.5)';
  ctx.beginPath();
  ctx.ellipse(80, th - 20, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(40, 35, 28, 0.3)';
  ctx.beginPath();
  ctx.ellipse(150, th - 12, 18, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Destroyed car at street level
  ctx.fillStyle = '#3A3530';
  ctx.fillRect(30, th - 35, 45, 18);
  ctx.fillStyle = '#2A2520';
  ctx.fillRect(35, th - 42, 35, 10);
  // Burned marks on car
  ctx.fillStyle = 'rgba(10, 8, 5, 0.4)';
  ctx.beginPath();
  ctx.ellipse(52, th - 30, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dust particles (semi-transparent dots)
  ctx.fillStyle = 'rgba(180, 170, 140, 0.2)';
  for (let i = 0; i < 30; i++) {
    const dx = Math.random() * tw;
    const dy = Math.random() * th;
    ctx.beginPath();
    ctx.arc(dx, dy, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cracks on facade
  ctx.strokeStyle = 'rgba(50, 45, 40, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 100);
  ctx.lineTo(55, 150);
  ctx.lineTo(65, 200);
  ctx.lineTo(50, 250);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(120, 300);
  ctx.lineTo(115, 340);
  ctx.lineTo(125, 380);
  ctx.stroke();

  scene.textures.addCanvas('ruined_city_tile', c);
}

// ── Ruined city tile variant 2 (200x540) ─────────────────────
export function createRuinedCityTile2(scene) {
  if (scene.textures.exists('ruined_city_tile2')) return;

  const tw = 200, th = 540;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Building facade — sandy tan base
  ctx.fillStyle = '#C4A060';
  ctx.fillRect(0, 0, tw, th);

  // Surface texture
  for (let i = 0; i < 250; i++) {
    const shade = 160 + Math.random() * 40;
    ctx.fillStyle = `rgba(${shade}, ${shade - 20}, ${shade - 50}, 0.12)`;
    ctx.fillRect(Math.random() * tw, Math.random() * th, 2 + Math.random() * 5, 1 + Math.random() * 3);
  }

  // Floors
  const floors = [0, 140, 280, 420];
  for (let fi = 0; fi < floors.length; fi++) {
    const fy = floors[fi];

    // Floor separator
    ctx.fillStyle = '#A08040';
    ctx.fillRect(0, fy, tw, 4);

    // Windows
    for (let wi = 0; wi < 3; wi++) {
      const wx = 15 + wi * 65;
      const wy = fy + 25;
      const ww = 45, wh = 50;

      if ((fi * 3 + wi) % 4 === 1) {
        // Intact window
        ctx.fillStyle = '#1A1A22';
        ctx.fillRect(wx, wy, ww, wh);
        ctx.fillStyle = 'rgba(135, 206, 235, 0.12)';
        ctx.fillRect(wx + 2, wy + 2, ww - 4, wh / 3);
        ctx.strokeStyle = '#9A8050';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, wy, ww, wh);
      } else {
        // Blown-out window
        ctx.fillStyle = '#1A1510';
        ctx.fillRect(wx, wy, ww, wh);
        // Jagged edges of broken glass
        ctx.strokeStyle = 'rgba(180, 200, 220, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + 8, wy + 12);
        ctx.lineTo(wx, wy + 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(wx + ww, wy + wh);
        ctx.lineTo(wx + ww - 6, wy + wh - 10);
        ctx.lineTo(wx + ww, wy + wh - 16);
        ctx.stroke();
      }
    }
  }

  // Fire damage marks (black scorch)
  ctx.fillStyle = 'rgba(10, 8, 5, 0.3)';
  ctx.beginPath();
  ctx.ellipse(100, 200, 40, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(15, 10, 5, 0.2)';
  ctx.beginPath();
  ctx.ellipse(50, 350, 30, 45, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Partially collapsed floor slab hanging at angle
  ctx.save();
  ctx.translate(tw * 0.7, 285);
  ctx.rotate(0.35);
  ctx.fillStyle = '#8A8070';
  ctx.fillRect(-40, -5, 80, 10);
  // Rebar from slab
  ctx.strokeStyle = '#8A4A2A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-35, 5);
  ctx.lineTo(-38, 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(30, 5);
  ctx.lineTo(35, 25);
  ctx.stroke();
  ctx.restore();

  // Missing wall section exposing interior
  ctx.fillStyle = '#2A2218';
  ctx.fillRect(0, 90, 60, 80);
  ctx.fillStyle = '#3A3228';
  ctx.fillRect(5, 95, 50, 70);

  // Rubble at base
  ctx.fillStyle = '#B09870';
  for (let i = 0; i < 18; i++) {
    const rx = Math.random() * tw;
    const ry = th - 50 + Math.random() * 45;
    const rs = 3 + Math.random() * 10;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + rs, ry + 2);
    ctx.lineTo(rx + rs - 1, ry + rs * 0.5);
    ctx.lineTo(rx - 2, ry + rs * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  // Hanging cable
  ctx.strokeStyle = 'rgba(50, 50, 60, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 90);
  ctx.quadraticCurveTo(70, 140, 55, 180);
  ctx.stroke();

  // Cracks
  ctx.strokeStyle = 'rgba(80, 60, 30, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tw * 0.3, 50);
  ctx.lineTo(tw * 0.28, 110);
  ctx.lineTo(tw * 0.35, 170);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tw * 0.7, 350);
  ctx.lineTo(tw * 0.65, 400);
  ctx.lineTo(tw * 0.72, 450);
  ctx.stroke();

  // Dust particles
  ctx.fillStyle = 'rgba(200, 180, 140, 0.18)';
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * tw, Math.random() * th, 1 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('ruined_city_tile2', c);
}

// ── Target building texture (200x540) ────────────────────────
export function createTargetBuildingTexture(scene) {
  if (scene.textures.exists('target_building')) return;

  const tw = 200, th = 540;
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  const ctx = c.getContext('2d');

  // Building facade — similar ruined style (concrete)
  ctx.fillStyle = '#8A8A8A';
  ctx.fillRect(0, 0, tw, th);

  // Surface texture
  for (let i = 0; i < 250; i++) {
    const shade = 115 + Math.random() * 35;
    ctx.fillStyle = `rgba(${shade}, ${shade - 3}, ${shade - 8}, 0.12)`;
    ctx.fillRect(Math.random() * tw, Math.random() * th, 2 + Math.random() * 5, 1 + Math.random() * 3);
  }

  // Floors
  const floors = [0, 135, 270, 405];
  for (let fi = 0; fi < floors.length; fi++) {
    const fy = floors[fi];
    ctx.fillStyle = '#6A6A6A';
    ctx.fillRect(0, fy, tw, 3);

    for (let wi = 0; wi < 3; wi++) {
      const wx = 20 + wi * 60;
      const wy = fy + 20;
      const ww = 40, wh = 55;

      // The target window: 2nd floor (fi===1), middle window (wi===1)
      if (fi === 1 && wi === 1) {
        // Open window with warm amber glow
        ctx.fillStyle = '#1A1510';
        ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
        // Warm interior glow
        const glowGrad = ctx.createRadialGradient(wx + ww / 2, wy + wh / 2, 5, wx + ww / 2, wy + wh / 2, 40);
        glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        glowGrad.addColorStop(0.5, 'rgba(255, 200, 50, 0.15)');
        glowGrad.addColorStop(1, 'rgba(255, 180, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(wx - 10, wy - 10, ww + 20, wh + 20);
        // Interior warm color
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fillRect(wx, wy, ww, wh);
        // Window frame (partially broken)
        ctx.strokeStyle = '#6A6A6A';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, wy, ww, wh);
      } else {
        // Regular dark/damaged window
        ctx.fillStyle = (fi + wi) % 3 === 0 ? '#2A2520' : '#1A1A22';
        ctx.fillRect(wx, wy, ww, wh);
        ctx.strokeStyle = '#6A6A6A';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wx, wy, ww, wh);
      }
    }
  }

  // Damage similar to tile1
  ctx.fillStyle = '#2A2218';
  ctx.beginPath();
  ctx.moveTo(150, 350);
  ctx.lineTo(200, 370);
  ctx.lineTo(200, 430);
  ctx.lineTo(160, 420);
  ctx.lineTo(140, 380);
  ctx.closePath();
  ctx.fill();

  // Rubble at base
  ctx.fillStyle = '#9A9080';
  for (let i = 0; i < 15; i++) {
    const rx = Math.random() * tw;
    const ry = th - 55 + Math.random() * 50;
    const rs = 3 + Math.random() * 10;
    ctx.fillRect(rx, ry, rs, rs * 0.5);
  }

  // Cracks
  ctx.strokeStyle = 'rgba(50, 45, 40, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 50);
  ctx.lineTo(75, 100);
  ctx.lineTo(85, 150);
  ctx.stroke();

  scene.textures.addCanvas('target_building', c);
}

// ── Command room (960x540) — DAYTIME interior with light through holes ──
export function createCommandRoom(scene) {
  if (scene.textures.exists('command_room')) return;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // ── Warm daylight ambient base ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#D4C4A0');
  bgGrad.addColorStop(0.3, '#C8B890');
  bgGrad.addColorStop(1, '#B8A880');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Perspective guides ──
  const backWallTop = 20;
  const backWallBottom = H * 0.42;
  const floorTop = backWallBottom;
  const sideInset = 120;

  // ── BACK WALL — sandy beige ──
  const wallGrad = ctx.createLinearGradient(0, backWallTop, 0, backWallBottom);
  wallGrad.addColorStop(0, '#D4C4A0');
  wallGrad.addColorStop(0.5, '#C8B890');
  wallGrad.addColorStop(1, '#BCAC88');
  ctx.fillStyle = wallGrad;
  ctx.beginPath();
  ctx.moveTo(sideInset, backWallTop);
  ctx.lineTo(W - sideInset, backWallTop);
  ctx.lineTo(W - sideInset, backWallBottom);
  ctx.lineTo(sideInset, backWallBottom);
  ctx.closePath();
  ctx.fill();

  // Back wall plaster texture
  for (let i = 0; i < 200; i++) {
    const px = sideInset + Math.random() * (W - 2 * sideInset);
    const py = backWallTop + Math.random() * (backWallBottom - backWallTop);
    const shade = 180 + Math.random() * 30;
    ctx.fillStyle = `rgba(${shade}, ${shade - 10}, ${shade - 30}, 0.1)`;
    ctx.fillRect(px, py, 2 + Math.random() * 5, 1 + Math.random() * 3);
  }

  // Exposed brick patches
  const brickAreas = [
    { x: sideInset + 40, y: backWallTop + 20, w: 90, h: 50 },
    { x: W - sideInset - 130, y: backWallTop + 40, w: 80, h: 60 },
    { x: W / 2 - 50, y: backWallBottom - 70, w: 100, h: 45 },
    { x: sideInset + 200, y: backWallTop + 10, w: 60, h: 35 },
  ];
  const brickColors = ['#8a6a4a', '#7a5a3a', '#6a4a2a', '#9a7a5a', '#6e5030'];
  for (const area of brickAreas) {
    ctx.fillStyle = 'rgba(50, 40, 30, 0.4)';
    ctx.fillRect(area.x, area.y, area.w, area.h);
    for (let by = area.y + 2; by < area.y + area.h - 4; by += 9) {
      const offset = ((by - area.y) / 9) % 2 === 0 ? 0 : 10;
      for (let bx = area.x + 2 + offset; bx < area.x + area.w - 4; bx += 20) {
        const bw = 16 + Math.random() * 4;
        const bh = 6 + Math.random() * 2;
        ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)];
        ctx.fillRect(bx, by, Math.min(bw, area.x + area.w - bx - 2), bh);
        ctx.strokeStyle = 'rgba(40, 35, 25, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, by, Math.min(bw, area.x + area.w - bx - 2), bh);
      }
    }
  }

  // Back wall cracks
  ctx.strokeStyle = 'rgba(80, 60, 40, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 + 30, backWallTop);
  ctx.lineTo(W / 2 + 25, backWallTop + 40);
  ctx.lineTo(W / 2 + 35, backWallTop + 80);
  ctx.lineTo(W / 2 + 28, backWallTop + 120);
  ctx.lineTo(W / 2 + 40, backWallBottom - 30);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 + 25, backWallTop + 40);
  ctx.lineTo(W / 2 + 60, backWallTop + 55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + 35, backWallTop + 80);
  ctx.lineTo(W / 2 - 10, backWallTop + 95);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sideInset + 60, backWallTop + 30);
  ctx.lineTo(sideInset + 70, backWallTop + 70);
  ctx.lineTo(sideInset + 55, backWallTop + 110);
  ctx.stroke();

  // ── HOLES IN CEILING/WALLS showing bright blue sky ──
  const holes = [
    { x: sideInset + 70, y: backWallTop + 30, w: 65, h: 80 },
    { x: W - sideInset - 135, y: backWallTop + 25, w: 65, h: 85 },
    { x: W / 2 - 30, y: backWallTop - 5, w: 80, h: 40 },
  ];
  for (const hole of holes) {
    // Bright daytime sky through hole
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(hole.x, hole.y, hole.w, hole.h);
    // Sky gradient
    const holeSkyGrad = ctx.createLinearGradient(hole.x, hole.y, hole.x, hole.y + hole.h);
    holeSkyGrad.addColorStop(0, '#87CEEB');
    holeSkyGrad.addColorStop(1, '#A8D8F0');
    ctx.fillStyle = holeSkyGrad;
    ctx.fillRect(hole.x, hole.y, hole.w, hole.h);
    // Jagged edge around hole
    ctx.strokeStyle = '#9A8A70';
    ctx.lineWidth = 3;
    ctx.strokeRect(hole.x, hole.y, hole.w, hole.h);
    // Glass shards
    ctx.fillStyle = 'rgba(120, 140, 160, 0.15)';
    ctx.beginPath();
    ctx.moveTo(hole.x, hole.y);
    ctx.lineTo(hole.x + 15, hole.y);
    ctx.lineTo(hole.x, hole.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hole.x + hole.w, hole.y + hole.h);
    ctx.lineTo(hole.x + hole.w - 12, hole.y + hole.h);
    ctx.lineTo(hole.x + hole.w, hole.y + hole.h - 18);
    ctx.closePath();
    ctx.fill();
  }

  // ── SUNBEAMS through holes (angled bright stripes on floor) ──
  ctx.save();
  ctx.globalAlpha = 0.15;
  for (let si = 0; si < holes.length; si++) {
    const hole = holes[si];
    const beamGrad = ctx.createLinearGradient(
      hole.x, hole.y,
      hole.x + 80, H
    );
    beamGrad.addColorStop(0, '#FFFDE0');
    beamGrad.addColorStop(0.3, '#FFF8C0');
    beamGrad.addColorStop(1, 'rgba(255, 255, 220, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(hole.x, hole.y + hole.h);
    ctx.lineTo(hole.x + hole.w, hole.y + hole.h);
    ctx.lineTo(hole.x + hole.w + 60, H);
    ctx.lineTo(hole.x - 20, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ── LEFT SIDE WALL ──
  const leftWallGrad = ctx.createLinearGradient(0, 0, sideInset, 0);
  leftWallGrad.addColorStop(0, '#B0A080');
  leftWallGrad.addColorStop(1, '#C4B498');
  ctx.fillStyle = leftWallGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(sideInset, backWallTop);
  ctx.lineTo(sideInset, backWallBottom);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Left wall texture
  for (let i = 0; i < 60; i++) {
    const t = Math.random();
    const py = t * H;
    const wallWidth = sideInset * (1 - 0.3 * Math.abs(py / H - 0.5));
    const px = Math.random() * wallWidth;
    const shade = 160 + Math.random() * 30;
    ctx.fillStyle = `rgba(${shade}, ${shade - 10}, ${shade - 25}, 0.12)`;
    ctx.fillRect(px, py, 3 + Math.random() * 6, 2 + Math.random() * 4);
  }

  // Left wall exposed bricks
  for (let i = 0; i < 12; i++) {
    const py = 30 + Math.random() * (H - 60);
    const maxX = sideInset * (0.7 + 0.3 * (1 - py / H));
    const px = 5 + Math.random() * (maxX - 20);
    ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)];
    const bw = 8 + Math.random() * 10;
    const bh = 4 + Math.random() * 3;
    ctx.fillRect(px, py, bw, bh);
  }

  // ── RIGHT SIDE WALL ──
  const rightWallGrad = ctx.createLinearGradient(W, 0, W - sideInset, 0);
  rightWallGrad.addColorStop(0, '#B0A080');
  rightWallGrad.addColorStop(1, '#C4B498');
  ctx.fillStyle = rightWallGrad;
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(W - sideInset, backWallTop);
  ctx.lineTo(W - sideInset, backWallBottom);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // Right wall texture
  for (let i = 0; i < 60; i++) {
    const t = Math.random();
    const py = t * H;
    const wallWidth = sideInset * (1 - 0.3 * Math.abs(py / H - 0.5));
    const px = W - Math.random() * wallWidth;
    const shade = 160 + Math.random() * 30;
    ctx.fillStyle = `rgba(${shade}, ${shade - 10}, ${shade - 25}, 0.12)`;
    ctx.fillRect(px, py, 3 + Math.random() * 6, 2 + Math.random() * 4);
  }

  // Right wall exposed bricks
  for (let i = 0; i < 12; i++) {
    const py = 30 + Math.random() * (H - 60);
    const maxX = sideInset * (0.7 + 0.3 * (1 - py / H));
    const px = W - 5 - Math.random() * (maxX - 20);
    ctx.fillStyle = brickColors[Math.floor(Math.random() * brickColors.length)];
    const bw = 8 + Math.random() * 10;
    const bh = 4 + Math.random() * 3;
    ctx.fillRect(px - bw, py, bw, bh);
  }

  // ── FLOOR (lighter, warm daylight) ──
  const floorGrad = ctx.createLinearGradient(0, floorTop, 0, H);
  floorGrad.addColorStop(0, '#B8A888');
  floorGrad.addColorStop(0.5, '#C4B498');
  floorGrad.addColorStop(1, '#B8A888');
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(sideInset, floorTop);
  ctx.lineTo(W - sideInset, floorTop);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Floor tile grid (perspective lines)
  ctx.strokeStyle = 'rgba(140, 120, 90, 0.2)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    const y = floorTop + (H - floorTop) * t;
    const leftX = sideInset * (1 - t);
    const rightX = W - sideInset * (1 - t);
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.lineTo(rightX, y);
    ctx.stroke();
  }
  const vanishX = W / 2;
  for (let i = 0; i < 12; i++) {
    const bottomX = (i / 11) * W;
    ctx.beginPath();
    ctx.moveTo(bottomX, H);
    ctx.lineTo(bottomX + (vanishX - bottomX) * 0.7, floorTop);
    ctx.stroke();
  }

  // Floor cracks
  ctx.strokeStyle = 'rgba(80, 60, 40, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 80, floorTop + 40);
  ctx.lineTo(W / 2 - 60, floorTop + 80);
  ctx.lineTo(W / 2 - 90, floorTop + 130);
  ctx.lineTo(W / 2 - 70, floorTop + 180);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + 60, floorTop + 30);
  ctx.lineTo(W / 2 + 80, floorTop + 70);
  ctx.lineTo(W / 2 + 55, floorTop + 120);
  ctx.stroke();

  // Scorch marks
  const scorchPositions = [
    { x: W / 2 + 100, y: floorTop + 60, rx: 35, ry: 15 },
    { x: W / 2 - 120, y: floorTop + 100, rx: 25, ry: 12 },
    { x: W / 2 - 30, y: floorTop + 150, rx: 40, ry: 18 },
    { x: sideInset + 60, y: floorTop + 80, rx: 18, ry: 8 },
  ];
  for (const sc of scorchPositions) {
    ctx.fillStyle = 'rgba(30, 25, 15, 0.2)';
    ctx.beginPath();
    ctx.ellipse(sc.x, sc.y, sc.rx, sc.ry, Math.random() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── RUBBLE on floor ──
  for (let i = 0; i < 60; i++) {
    const rx = sideInset + 20 + Math.random() * (W - 2 * sideInset - 40);
    const ry = floorTop + 10 + Math.random() * (H - floorTop - 30);
    const rs = 2 + Math.random() * 8;
    ctx.fillStyle = `rgba(${120 + Math.random() * 40}, ${110 + Math.random() * 30}, ${80 + Math.random() * 25}, 0.4)`;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + rs, ry + Math.random() * 3);
    ctx.lineTo(rx + rs - 1, ry + rs);
    ctx.lineTo(rx - 2, ry + rs - 1);
    ctx.closePath();
    ctx.fill();
  }

  // ── BULLET HOLES on walls ──
  const bulletHoles = [
    { x: sideInset + 180, y: backWallTop + 50 },
    { x: sideInset + 320, y: backWallTop + 80 },
    { x: W - sideInset - 180, y: backWallTop + 60 },
    { x: W - sideInset - 280, y: backWallTop + 100 },
    { x: W / 2 + 70, y: backWallTop + 40 },
    { x: W / 2 - 100, y: backWallTop + 120 },
    { x: 50, y: 150 },
    { x: 70, y: 280 },
    { x: W - 50, y: 180 },
    { x: W - 60, y: 320 },
  ];
  for (const bh of bulletHoles) {
    ctx.fillStyle = '#3A3020';
    ctx.beginPath();
    ctx.arc(bh.x, bh.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 45, 30, 0.4)';
    ctx.lineWidth = 0.6;
    const numCracks = 3 + Math.floor(Math.random() * 4);
    for (let cr = 0; cr < numCracks; cr++) {
      const angle = (cr / numCracks) * Math.PI * 2 + Math.random() * 0.5;
      const len = 4 + Math.random() * 8;
      ctx.beginPath();
      ctx.moveTo(bh.x + Math.cos(angle) * 2, bh.y + Math.sin(angle) * 2);
      ctx.lineTo(bh.x + Math.cos(angle) * len, bh.y + Math.sin(angle) * len);
      ctx.stroke();
    }
  }

  // ── HANGING WIRES from ceiling ──
  const wireColors = ['rgba(120, 100, 70, 0.5)', 'rgba(80, 80, 90, 0.4)', 'rgba(140, 60, 50, 0.4)', 'rgba(90, 110, 80, 0.35)'];
  const wireStartXs = [sideInset + 150, W / 2 - 60, W / 2 + 100, W - sideInset - 160];
  for (let wi = 0; wi < wireStartXs.length; wi++) {
    const wx = wireStartXs[wi];
    const wyStart = backWallTop + 2;
    const wyEnd = backWallTop + 40 + Math.random() * 50;
    ctx.strokeStyle = wireColors[wi % wireColors.length];
    ctx.lineWidth = 1 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.moveTo(wx, wyStart);
    const midX = wx + (Math.random() - 0.5) * 20;
    const midY = (wyStart + wyEnd) / 2 + Math.random() * 15;
    ctx.quadraticCurveTo(midX, midY, wx + (Math.random() - 0.5) * 10, wyEnd);
    ctx.stroke();
    ctx.fillStyle = 'rgba(180, 120, 50, 0.4)';
    ctx.beginPath();
    ctx.arc(wx + (Math.random() - 0.5) * 10, wyEnd, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── COLLAPSED CEILING BEAM ──
  ctx.save();
  ctx.translate(sideInset + 300, backWallTop + 8);
  ctx.rotate(0.15);
  ctx.fillStyle = '#5A4A30';
  ctx.fillRect(-80, -6, 160, 12);
  ctx.strokeStyle = '#4A3A20';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(-75, -3); ctx.lineTo(75, -3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-75, 0); ctx.lineTo(75, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-75, 3); ctx.lineTo(75, 3); ctx.stroke();
  ctx.strokeStyle = '#3A2A15';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, -6); ctx.lineTo(35, 0); ctx.lineTo(28, 6);
  ctx.stroke();
  ctx.restore();

  // ── BROKEN LAMPS (bent floor lamp shapes) ──
  // Lamp 1 — left side, fallen over
  ctx.save();
  ctx.translate(sideInset + 60, floorTop + 50);
  ctx.rotate(0.8);
  ctx.fillStyle = '#5A5040';
  ctx.fillRect(-2, -60, 4, 60); // pole
  ctx.fillStyle = '#6A6050';
  ctx.beginPath();
  ctx.moveTo(-10, -65);
  ctx.lineTo(10, -65);
  ctx.lineTo(6, -55);
  ctx.lineTo(-6, -55);
  ctx.closePath();
  ctx.fill(); // lamp shade
  ctx.fillStyle = '#8A8070';
  ctx.fillRect(-6, 0, 12, 4); // base
  ctx.restore();

  // Lamp 2 — right side, partially standing but bent
  ctx.save();
  ctx.translate(W - sideInset - 50, floorTop + 70);
  ctx.rotate(-0.3);
  ctx.fillStyle = '#5A5040';
  ctx.fillRect(-2, -50, 4, 50);
  ctx.fillStyle = '#6A6050';
  ctx.beginPath();
  ctx.moveTo(-8, -55);
  ctx.lineTo(8, -55);
  ctx.lineTo(5, -46);
  ctx.lineTo(-5, -46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── CRACKED MIRROR on wall ──
  const mirrorX = W - sideInset - 200;
  const mirrorY = backWallTop + 40;
  const mirrorW = 50;
  const mirrorH = 65;
  // Mirror frame
  ctx.strokeStyle = '#7A6A50';
  ctx.lineWidth = 3;
  ctx.strokeRect(mirrorX, mirrorY, mirrorW, mirrorH);
  // Reflective surface (slightly lighter than wall)
  ctx.fillStyle = 'rgba(200, 210, 220, 0.2)';
  ctx.fillRect(mirrorX + 2, mirrorY + 2, mirrorW - 4, mirrorH - 4);
  // Crack lines radiating from impact point
  const crackCx = mirrorX + mirrorW * 0.4;
  const crackCy = mirrorY + mirrorH * 0.3;
  ctx.strokeStyle = 'rgba(60, 50, 40, 0.6)';
  ctx.lineWidth = 1;
  for (let ci = 0; ci < 8; ci++) {
    const angle = (ci / 8) * Math.PI * 2;
    const len = 15 + Math.random() * 20;
    ctx.beginPath();
    ctx.moveTo(crackCx, crackCy);
    ctx.lineTo(crackCx + Math.cos(angle) * len, crackCy + Math.sin(angle) * len);
    ctx.stroke();
  }

  // ── OVERTURNED TABLES ──
  ctx.fillStyle = '#5A4A30';
  ctx.save();
  ctx.translate(sideInset + 80, floorTop + 80);
  ctx.rotate(0.5);
  ctx.fillRect(-25, -4, 50, 8);
  ctx.restore();
  // Table leg sticking up
  ctx.fillStyle = '#4A3A20';
  ctx.fillRect(sideInset + 105, floorTop + 65, 4, 18);

  // Overturned table 2
  ctx.fillStyle = '#5A4A30';
  ctx.save();
  ctx.translate(W - sideInset - 100, floorTop + 100);
  ctx.rotate(-0.4);
  ctx.fillRect(-20, -3, 40, 6);
  ctx.restore();

  // ── BROKEN CHAIRS ──
  ctx.fillStyle = '#6A5A40';
  ctx.save();
  ctx.translate(W - sideInset - 70, floorTop + 50);
  ctx.rotate(-0.6);
  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillRect(-10, -16, 20, 8);
  ctx.fillStyle = '#4A3A20';
  ctx.fillRect(-7, 8, 3, 12);
  ctx.fillRect(4, 8, 3, 10);
  ctx.restore();

  // ── CABLES on floor ──
  ctx.strokeStyle = 'rgba(60, 60, 70, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sideInset + 100, floorTop + 40);
  ctx.quadraticCurveTo(W / 2 - 50, floorTop + 120, W / 2 + 100, floorTop + 90);
  ctx.stroke();

  // ── DUST PARTICLES in the air ──
  for (let i = 0; i < 25; i++) {
    const px = sideInset + 30 + Math.random() * (W - 2 * sideInset - 60);
    const py = backWallTop + 10 + Math.random() * (floorTop - backWallTop - 20);
    const pr = 2 + Math.random() * 5;
    ctx.fillStyle = `rgba(${200 + Math.random() * 30}, ${190 + Math.random() * 25}, ${160 + Math.random() * 20}, ${0.06 + Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── WATER DAMAGE STAINS ──
  const waterStains = [
    { x: sideInset + 100, y: backWallTop + 10, w: 40, h: 80 },
    { x: W - sideInset - 90, y: backWallTop + 5, w: 30, h: 60 },
  ];
  for (const ws of waterStains) {
    const stainGrad = ctx.createLinearGradient(ws.x, ws.y, ws.x, ws.y + ws.h);
    stainGrad.addColorStop(0, 'rgba(100, 90, 60, 0.15)');
    stainGrad.addColorStop(0.5, 'rgba(90, 80, 55, 0.2)');
    stainGrad.addColorStop(1, 'rgba(100, 90, 60, 0.08)');
    ctx.fillStyle = stainGrad;
    ctx.beginPath();
    ctx.ellipse(ws.x + ws.w / 2, ws.y + ws.h / 2, ws.w / 2, ws.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Back wall baseboard ──
  ctx.fillStyle = '#9A8A70';
  ctx.fillRect(sideInset, backWallBottom - 8, W - 2 * sideInset, 8);

  // ── Ceiling line ──
  ctx.fillStyle = '#A09080';
  ctx.fillRect(sideInset, backWallTop, W - 2 * sideInset, 6);

  // ── Broken front wall frame (jagged destroyed wall pieces) ──
  ctx.fillStyle = '#9A8A70';
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H - 40);
  ctx.lineTo(20, H - 50);
  ctx.lineTo(35, H - 30);
  ctx.lineTo(50, H - 45);
  ctx.lineTo(60, H - 25);
  ctx.lineTo(70, H);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, H);
  ctx.lineTo(W, H - 35);
  ctx.lineTo(W - 15, H - 48);
  ctx.lineTo(W - 30, H - 28);
  ctx.lineTo(W - 50, H - 42);
  ctx.lineTo(W - 65, H - 20);
  ctx.lineTo(W - 75, H);
  ctx.closePath();
  ctx.fill();

  // ── Warm vignette (subtle, lighter than night version) ──
  const topVignette = ctx.createLinearGradient(0, 0, 0, 30);
  topVignette.addColorStop(0, 'rgba(180, 160, 120, 0.3)');
  topVignette.addColorStop(1, 'rgba(180, 160, 120, 0)');
  ctx.fillStyle = topVignette;
  ctx.fillRect(0, 0, W, 30);

  scene.textures.addCanvas('command_room', c);
}

// ── Armchair texture (80x80) — front perspective ─────────────
export function createArmchairTexture(scene) {
  if (scene.textures.exists('armchair')) return;

  const s = 80;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2, cy = s / 2;

  // Back of chair (rounded, taller than seat)
  ctx.fillStyle = '#4A3A2A';
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy - 30);
  ctx.quadraticCurveTo(cx - 30, cy - 38, cx - 20, cy - 38);
  ctx.lineTo(cx + 20, cy - 38);
  ctx.quadraticCurveTo(cx + 30, cy - 38, cx + 28, cy - 30);
  ctx.lineTo(cx + 28, cy - 5);
  ctx.lineTo(cx - 28, cy - 5);
  ctx.closePath();
  ctx.fill();

  // Back cushion padding highlight
  ctx.fillStyle = '#5A4A38';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 20, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Seat cushion
  ctx.fillStyle = '#4A3A2A';
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy - 5);
  ctx.lineTo(cx + 28, cy - 5);
  ctx.lineTo(cx + 30, cy + 10);
  ctx.lineTo(cx - 30, cy + 10);
  ctx.closePath();
  ctx.fill();

  // Seat padding
  ctx.fillStyle = '#5A4A35';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Left armrest
  ctx.fillStyle = '#3A2A1A';
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy - 25);
  ctx.lineTo(cx - 36, cy - 22);
  ctx.lineTo(cx - 36, cy + 10);
  ctx.lineTo(cx - 30, cy + 10);
  ctx.closePath();
  ctx.fill();
  // Armrest top
  ctx.fillStyle = '#4A3828';
  ctx.fillRect(cx - 37, cy - 25, 8, 4);

  // Right armrest
  ctx.fillStyle = '#3A2A1A';
  ctx.beginPath();
  ctx.moveTo(cx + 30, cy - 25);
  ctx.lineTo(cx + 36, cy - 22);
  ctx.lineTo(cx + 36, cy + 10);
  ctx.lineTo(cx + 30, cy + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4A3828';
  ctx.fillRect(cx + 29, cy - 25, 8, 4);

  // Front panel below seat
  ctx.fillStyle = '#3A2A1A';
  ctx.fillRect(cx - 28, cy + 10, 56, 14);

  // Visible leg at bottom center
  ctx.fillStyle = '#2A1A0A';
  ctx.fillRect(cx - 4, cy + 24, 8, 12);

  // Worn/torn fabric patches
  ctx.fillStyle = 'rgba(90, 70, 40, 0.3)';
  ctx.fillRect(cx - 10, cy - 15, 8, 5);
  ctx.fillRect(cx + 5, cy + 3, 6, 4);

  // Shadow at base
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 35, 28, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('armchair', c);
}

// ── Armchair side texture (60x80) — side profile ─────────────
export function createArmchairSideTexture(scene) {
  if (scene.textures.exists('armchair_side')) return;

  const sw = 60, sh = 80;
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  const ctx = c.getContext('2d');

  // Back of chair (side profile — curved)
  ctx.fillStyle = '#4A3A2A';
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.quadraticCurveTo(5, 5, 12, 2);
  ctx.lineTo(22, 2);
  ctx.quadraticCurveTo(28, 5, 25, 15);
  ctx.lineTo(25, 40);
  ctx.lineTo(10, 40);
  ctx.closePath();
  ctx.fill();

  // Seat depth (side view)
  ctx.fillStyle = '#4A3A2A';
  ctx.beginPath();
  ctx.moveTo(10, 40);
  ctx.lineTo(50, 38);
  ctx.lineTo(52, 50);
  ctx.lineTo(10, 52);
  ctx.closePath();
  ctx.fill();

  // Seat cushion highlight
  ctx.fillStyle = '#5A4A35';
  ctx.beginPath();
  ctx.ellipse(30, 44, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Armrest (side profile)
  ctx.fillStyle = '#3A2A1A';
  ctx.beginPath();
  ctx.moveTo(8, 25);
  ctx.lineTo(48, 22);
  ctx.lineTo(50, 28);
  ctx.lineTo(8, 32);
  ctx.closePath();
  ctx.fill();

  // Front panel
  ctx.fillStyle = '#3A2A1A';
  ctx.beginPath();
  ctx.moveTo(48, 38);
  ctx.lineTo(52, 50);
  ctx.lineTo(52, 60);
  ctx.lineTo(48, 60);
  ctx.closePath();
  ctx.fill();

  // Leg
  ctx.fillStyle = '#2A1A0A';
  ctx.fillRect(12, 58, 5, 16);
  ctx.fillRect(45, 56, 5, 18);

  // Back cushion shading
  ctx.fillStyle = '#5A4A38';
  ctx.beginPath();
  ctx.ellipse(17, 22, 6, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('armchair_side', c);
}

// ── Drone silhouette (160x120) — for cinematic ──────────────
export function createDroneSilhouette(scene) {
  if (scene.textures.exists('drone_silhouette')) return;

  const sw = 160, sh = 120;
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  const ctx = c.getContext('2d');
  const cx = sw / 2, cy = sh / 2;

  // Drone silhouette (top-down, larger version)
  ctx.fillStyle = '#111111';

  // Body
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 24);
  ctx.lineTo(cx + 14, cy - 24);
  ctx.lineTo(cx + 18, cy - 14);
  ctx.lineTo(cx + 18, cy + 16);
  ctx.lineTo(cx + 10, cy + 24);
  ctx.lineTo(cx - 10, cy + 24);
  ctx.lineTo(cx - 18, cy + 16);
  ctx.lineTo(cx - 18, cy - 14);
  ctx.closePath();
  ctx.fill();

  // Arms
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#111111';
  const armLen = 32;
  const angles = [-0.7, 0.7, Math.PI - 0.7, Math.PI + 0.7];
  for (const a of angles) {
    const ex = cx + Math.cos(a) * armLen;
    const ey = cy + Math.sin(a) * armLen;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // Rotor disc
    ctx.beginPath();
    ctx.arc(ex, ey, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Camera eye glow
  const camGrad = ctx.createRadialGradient(cx, cy - 16, 2, cx, cy - 16, 12);
  camGrad.addColorStop(0, 'rgba(0,200,255,0.6)');
  camGrad.addColorStop(0.5, 'rgba(0,150,200,0.2)');
  camGrad.addColorStop(1, 'rgba(0,100,150,0)');
  ctx.fillStyle = camGrad;
  ctx.fillRect(cx - 12, cy - 28, 24, 24);

  scene.textures.addCanvas('drone_silhouette', c);
}

// ── Boss 4 / THE WARDEN (256x256) — brutish, keffiyeh, pure rage ──
/**
 * Draw Boss 4 — Angry Eyebrows / THE WARDEN: the most physical boss.
 * Brutish face with thick neck, heavy jaw, battle-worn keffiyeh.
 * Pure rage even in 'normal' state.
 * @param {string} expression — 'normal' | 'angry' | 'furious' | 'dead'
 * @returns {HTMLCanvasElement}
 */
export function drawBoss4AngryEyebrows(expression = 'normal') {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const cx = S / 2, cy = S / 2;

  // ── Skin tint based on expression ──
  let skinBase, skinDark, skinLight;
  if (expression === 'furious') {
    skinBase = '#a03020'; skinDark = '#702015'; skinLight = '#c04535';
  } else if (expression === 'angry') {
    skinBase = '#8a5535'; skinDark = '#6a3a20'; skinLight = '#a06545';
  } else {
    // Even 'normal' looks angry for THE WARDEN
    skinBase = '#7a5030'; skinDark = '#5a3820'; skinLight = '#906040';
  }

  // ── THICK NECK (drawn first, behind head) ──
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 40);
  ctx.lineTo(cx - 36, cy + 80);
  ctx.lineTo(cx - 50, cy + 100);
  ctx.lineTo(cx + 50, cy + 100);
  ctx.lineTo(cx + 36, cy + 80);
  ctx.lineTo(cx + 40, cy + 40);
  ctx.closePath();
  ctx.fill();

  // Neck tendons
  ctx.strokeStyle = skinBase;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy + 42);
  ctx.lineTo(cx - 24, cy + 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 20, cy + 42);
  ctx.lineTo(cx + 24, cy + 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy + 45);
  ctx.lineTo(cx, cy + 78);
  ctx.stroke();

  // ── ANGULAR HEAD SHAPE — heavy jaw, brutish ──
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.moveTo(cx - 48, cy - 40);   // top-left
  ctx.lineTo(cx + 48, cy - 40);   // top-right
  ctx.lineTo(cx + 56, cy - 25);   // right temple
  ctx.lineTo(cx + 60, cy - 5);    // right cheekbone
  ctx.lineTo(cx + 58, cy + 15);   // right mid-face
  ctx.lineTo(cx + 52, cy + 30);   // right jaw (heavy)
  ctx.lineTo(cx + 44, cy + 40);   // right jaw corner (SQUARE)
  ctx.lineTo(cx + 30, cy + 44);   // right chin
  ctx.lineTo(cx, cy + 46);        // chin center
  ctx.lineTo(cx - 30, cy + 44);   // left chin
  ctx.lineTo(cx - 44, cy + 40);   // left jaw corner
  ctx.lineTo(cx - 52, cy + 30);   // left jaw
  ctx.lineTo(cx - 58, cy + 15);   // left mid-face
  ctx.lineTo(cx - 60, cy - 5);    // left cheekbone
  ctx.lineTo(cx - 56, cy - 25);   // left temple
  ctx.closePath();
  ctx.fill();

  // Cheekbone highlights (angular, pronounced)
  ctx.fillStyle = skinLight;
  ctx.beginPath();
  ctx.moveTo(cx + 48, cy - 10);
  ctx.lineTo(cx + 58, cy - 2);
  ctx.lineTo(cx + 54, cy + 10);
  ctx.lineTo(cx + 44, cy + 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 48, cy - 10);
  ctx.lineTo(cx - 58, cy - 2);
  ctx.lineTo(cx - 54, cy + 10);
  ctx.lineTo(cx - 44, cy + 5);
  ctx.closePath();
  ctx.fill();

  // Heavy jaw shadow
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx - 44, cy + 34);
  ctx.lineTo(cx + 44, cy + 34);
  ctx.lineTo(cx + 30, cy + 44);
  ctx.lineTo(cx, cy + 46);
  ctx.lineTo(cx - 30, cy + 44);
  ctx.closePath();
  ctx.fill();

  // ── EARS (thick, brutish) ──
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx - 60, cy - 15);
  ctx.lineTo(cx - 66, cy - 5);
  ctx.lineTo(cx - 64, cy + 10);
  ctx.lineTo(cx - 60, cy + 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 60, cy - 15);
  ctx.lineTo(cx + 66, cy - 5);
  ctx.lineTo(cx + 64, cy + 10);
  ctx.lineTo(cx + 60, cy + 5);
  ctx.closePath();
  ctx.fill();

  // ── BATTLE-WORN KEFFIYEH ──
  const keffBase = '#8a8070';
  const keffDark = '#6a6055';

  // Main keffiyeh head covering
  ctx.fillStyle = keffBase;
  ctx.beginPath();
  ctx.moveTo(cx - 52, cy - 40);
  ctx.lineTo(cx + 52, cy - 40);
  ctx.lineTo(cx + 54, cy - 50);
  ctx.lineTo(cx + 44, cy - 62);
  ctx.lineTo(cx + 20, cy - 70);
  ctx.lineTo(cx - 20, cy - 70);
  ctx.lineTo(cx - 44, cy - 62);
  ctx.lineTo(cx - 54, cy - 50);
  ctx.closePath();
  ctx.fill();

  // Keffiyeh drape (left and right sides hanging down)
  ctx.fillStyle = keffBase;
  // Left drape
  ctx.beginPath();
  ctx.moveTo(cx - 56, cy - 30);
  ctx.lineTo(cx - 64, cy - 20);
  ctx.lineTo(cx - 68, cy + 10);
  ctx.lineTo(cx - 62, cy + 40);
  ctx.lineTo(cx - 54, cy + 50);
  ctx.lineTo(cx - 48, cy + 30);
  ctx.lineTo(cx - 56, cy - 5);
  ctx.closePath();
  ctx.fill();
  // Right drape
  ctx.beginPath();
  ctx.moveTo(cx + 56, cy - 30);
  ctx.lineTo(cx + 64, cy - 20);
  ctx.lineTo(cx + 68, cy + 10);
  ctx.lineTo(cx + 62, cy + 40);
  ctx.lineTo(cx + 54, cy + 50);
  ctx.lineTo(cx + 48, cy + 30);
  ctx.lineTo(cx + 56, cy - 5);
  ctx.closePath();
  ctx.fill();

  // Keffiyeh pattern (crosshatch lines for traditional pattern)
  ctx.strokeStyle = keffDark;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const ky = cy - 65 + i * 6;
    ctx.beginPath();
    ctx.moveTo(cx - 42 + i * 3, ky);
    ctx.lineTo(cx + 42 - i * 3, ky);
    ctx.stroke();
  }

  // Battle damage on keffiyeh (tears, dark spots)
  ctx.fillStyle = 'rgba(40, 30, 20, 0.3)';
  ctx.fillRect(cx - 40, cy - 58, 8, 4);
  ctx.fillRect(cx + 20, cy - 52, 6, 5);
  ctx.fillRect(cx - 60, cy + 10, 5, 8);
  // Torn edge
  ctx.strokeStyle = keffDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 54, cy + 46);
  ctx.lineTo(cx - 56, cy + 50);
  ctx.lineTo(cx - 52, cy + 52);
  ctx.lineTo(cx - 50, cy + 48);
  ctx.stroke();

  // Agal (black rope band)
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy - 42);
  ctx.lineTo(cx + 50, cy - 42);
  ctx.lineTo(cx + 48, cy - 38);
  ctx.lineTo(cx - 48, cy - 38);
  ctx.closePath();
  ctx.fill();
  // Second ring
  ctx.beginPath();
  ctx.moveTo(cx - 48, cy - 38);
  ctx.lineTo(cx + 48, cy - 38);
  ctx.lineTo(cx + 46, cy - 35);
  ctx.lineTo(cx - 46, cy - 35);
  ctx.closePath();
  ctx.fill();

  // ── MASSIVE THICK ANGRY EYEBROWS — dominate upper face ──
  const browColor = expression === 'dead' ? '#3a3a3a' : '#0a0804';
  ctx.fillStyle = browColor;

  // Left eyebrow — massive thick wedge, permanently furrowed
  ctx.beginPath();
  ctx.moveTo(cx - 48, cy - 28);   // outer top
  ctx.lineTo(cx - 8, cy - 14);    // inner bottom (deep furrow)
  ctx.lineTo(cx - 8, cy - 20);    // inner top
  ctx.lineTo(cx - 48, cy - 36);   // outer higher
  ctx.closePath();
  ctx.fill();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(cx + 48, cy - 28);
  ctx.lineTo(cx + 8, cy - 14);
  ctx.lineTo(cx + 8, cy - 20);
  ctx.lineTo(cx + 48, cy - 36);
  ctx.closePath();
  ctx.fill();

  // Extra brow thickness/texture (hair strands on brows)
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = browColor;
  for (let i = 0; i < 12; i++) {
    const bx = cx - 44 + i * 7;
    const by = cy - 32 + (i * 2);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 4, by + 3);
    ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const bx = cx + 44 - i * 7;
    const by = cy - 32 + (i * 2);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 4, by + 3);
    ctx.stroke();
  }

  // ── EYES — small, narrow, HATEFUL (pure rage even in normal) ──
  if (expression === 'dead') {
    // Spiral eyes
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 3;
    for (const ex of [cx - 26, cx + 26]) {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.2) {
        const r = a * 1.5;
        ctx.lineTo(ex + Math.cos(a) * r, cy - 8 + Math.sin(a) * r);
      }
      ctx.stroke();
    }
    // Heavy bruises
    ctx.fillStyle = 'rgba(80, 30, 100, 0.5)';
    ctx.beginPath(); ctx.ellipse(cx - 26, cy - 2, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 26, cy - 2, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    let irisColor, scleraColor;
    if (expression === 'furious') {
      irisColor = '#dd0000'; scleraColor = '#ffaaaa';
    } else if (expression === 'angry') {
      irisColor = '#cc3300'; scleraColor = '#ffe0d0';
    } else {
      // Even normal is angry-looking
      irisColor = '#aa4400'; scleraColor = '#eee8d8';
    }

    for (const side of [-1, 1]) {
      const ex = cx + side * 26;
      const ey = cy - 8;

      // Very narrow slit eyes (pure rage)
      ctx.fillStyle = scleraColor;
      ctx.beginPath();
      ctx.moveTo(ex - 14, ey);
      ctx.quadraticCurveTo(ex, ey - 5, ex + 14, ey);
      ctx.quadraticCurveTo(ex, ey + 4, ex - 14, ey);
      ctx.closePath();
      ctx.fill();

      // Small intense iris
      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();

      // Tiny pupil
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fill();

      // Red/yellow glow
      const glowAlpha = expression === 'furious' ? 0.5 : expression === 'angry' ? 0.35 : 0.2;
      ctx.fillStyle = `rgba(255, 40, 0, ${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 8, 0, Math.PI * 2);
      ctx.fill();

      // Heavy dark circles
      ctx.fillStyle = 'rgba(30, 15, 20, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ex, ey + 8, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye outline (intense stare)
      ctx.strokeStyle = '#1a0a05';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex - 14, ey);
      ctx.quadraticCurveTo(ex, ey - 5, ex + 14, ey);
      ctx.quadraticCurveTo(ex, ey + 4, ex - 14, ey);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // ── NOSE — broad, broken-looking ──
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx + 8, cy + 6);
  ctx.lineTo(cx + 10, cy + 10);
  ctx.lineTo(cx + 6, cy + 12);
  ctx.lineTo(cx - 6, cy + 12);
  ctx.lineTo(cx - 10, cy + 10);
  ctx.lineTo(cx - 8, cy + 6);
  ctx.closePath();
  ctx.fill();
  // Nose bridge bump (broken nose)
  ctx.fillStyle = skinLight;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 4);
  ctx.lineTo(cx + 4, cy - 2);
  ctx.lineTo(cx + 3, cy + 2);
  ctx.lineTo(cx - 2, cy);
  ctx.closePath();
  ctx.fill();
  // Nostrils
  ctx.fillStyle = '#1a0a05';
  ctx.beginPath(); ctx.arc(cx - 5, cy + 10, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 5, cy + 10, 3, 0, Math.PI * 2); ctx.fill();

  // ── MOUTH — rage grimace with bared teeth ──
  if (expression === 'dead') {
    ctx.strokeStyle = '#4a2a1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 22);
    ctx.lineTo(cx - 8, cy + 26);
    ctx.lineTo(cx + 6, cy + 23);
    ctx.lineTo(cx + 20, cy + 25);
    ctx.stroke();
    // Broken tooth
    ctx.fillStyle = '#ccc8b8';
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 22);
    ctx.lineTo(cx - 2, cy + 26);
    ctx.lineTo(cx + 2, cy + 24);
    ctx.closePath();
    ctx.fill();
  } else {
    // Wide snarling mouth
    ctx.fillStyle = '#2a0a05';
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 18);
    ctx.quadraticCurveTo(cx - 12, cy + 14, cx, cy + 16);
    ctx.quadraticCurveTo(cx + 12, cy + 14, cx + 24, cy + 18);
    ctx.lineTo(cx + 22, cy + 28);
    ctx.quadraticCurveTo(cx, cy + 32, cx - 22, cy + 28);
    ctx.closePath();
    ctx.fill();

    // Upper teeth row
    ctx.fillStyle = '#ddd8c0';
    const teethY = cy + 17;
    const teethH = expression === 'furious' ? 7 : expression === 'angry' ? 6 : 5;
    for (let t = -4; t <= 4; t++) {
      const tw = 4;
      ctx.fillRect(cx + t * 5 - 2, teethY, tw, teethH);
    }
    // Lower teeth
    const lTeethY = cy + 24;
    for (let t = -3; t <= 3; t++) {
      ctx.fillRect(cx + t * 5 - 1, lTeethY, 3, teethH - 2);
    }
    // Gaps
    ctx.fillStyle = '#0a0505';
    for (let t = -4; t <= 3; t++) {
      ctx.fillRect(cx + t * 5 + 2, teethY, 1, teethH);
    }
    for (let t = -3; t <= 2; t++) {
      ctx.fillRect(cx + t * 5 + 2, lTeethY, 1, teethH - 2);
    }
  }

  // ── STUBBLE / FACIAL HAIR TEXTURE ──
  ctx.fillStyle = 'rgba(10, 8, 5, 0.2)';
  for (let i = 0; i < 100; i++) {
    const hx = cx + (Math.random() - 0.5) * 80;
    const hy = cy + 10 + Math.random() * 30;
    ctx.fillRect(hx, hy, 1, 1 + Math.random());
  }

  // ── SCARS (battle-worn) ──
  ctx.strokeStyle = 'rgba(160, 100, 80, 0.5)';
  ctx.lineWidth = 2;
  // Scar across left cheek
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 5);
  ctx.lineTo(cx - 30, cy + 15);
  ctx.lineTo(cx - 24, cy + 12);
  ctx.stroke();
  // Small scar on forehead
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy - 34);
  ctx.lineTo(cx + 16, cy - 28);
  ctx.stroke();

  // ── DAMAGE EXPRESSIONS ──
  if (expression === 'angry' || expression === 'furious') {
    // Forehead veins (multiple)
    ctx.strokeStyle = expression === 'furious' ? '#dd2020' : '#bb4040';
    ctx.lineWidth = expression === 'furious' ? 3 : 2;
    // Left vein cluster
    ctx.beginPath();
    ctx.moveTo(cx - 36, cy - 36);
    ctx.lineTo(cx - 28, cy - 28);
    ctx.lineTo(cx - 32, cy - 22);
    ctx.lineTo(cx - 24, cy - 18);
    ctx.stroke();
    // Right vein cluster
    ctx.beginPath();
    ctx.moveTo(cx + 36, cy - 36);
    ctx.lineTo(cx + 28, cy - 28);
    ctx.lineTo(cx + 32, cy - 22);
    ctx.lineTo(cx + 24, cy - 18);
    ctx.stroke();
    // Center vein
    ctx.beginPath();
    ctx.moveTo(cx, cy - 38);
    ctx.lineTo(cx - 4, cy - 30);
    ctx.lineTo(cx + 2, cy - 24);
    ctx.stroke();
  }

  if (expression === 'furious') {
    // Deep red tint overlay
    ctx.fillStyle = 'rgba(180, 20, 10, 0.15)';
    ctx.fillRect(0, 0, S, S);

    // Throbbing temple veins
    ctx.strokeStyle = '#dd2020';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx - 56, cy - 10);
    ctx.lineTo(cx - 50, cy - 4);
    ctx.lineTo(cx - 54, cy + 2);
    ctx.lineTo(cx - 48, cy + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 56, cy - 10);
    ctx.lineTo(cx + 50, cy - 4);
    ctx.lineTo(cx + 54, cy + 2);
    ctx.lineTo(cx + 48, cy + 8);
    ctx.stroke();

    // Steam/smoke above head
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    for (let i = 0; i < 8; i++) {
      const px = cx + (Math.random() - 0.5) * 60;
      const py = cy - 72 - Math.random() * 20;
      const pr = 4 + Math.random() * 6;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (expression === 'dead') {
    // Heavy bruises
    ctx.fillStyle = 'rgba(80, 30, 100, 0.45)';
    ctx.beginPath(); ctx.arc(cx - 30, cy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 34, cy + 6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 10, cy + 16, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 16, cy + 20, 6, 0, Math.PI * 2); ctx.fill();

    // Crack lines across face
    ctx.strokeStyle = 'rgba(50, 25, 15, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 30);
    ctx.lineTo(cx - 12, cy - 15);
    ctx.lineTo(cx - 18, cy);
    ctx.lineTo(cx - 10, cy + 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 22, cy - 26);
    ctx.lineTo(cx + 16, cy - 10);
    ctx.lineTo(cx + 24, cy + 5);
    ctx.stroke();
  }

  return c;
}
