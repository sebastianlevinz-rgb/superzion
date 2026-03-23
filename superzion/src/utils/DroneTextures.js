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

  // Blue gradient sky — bright daytime with slight dust haze
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#5588cc');
  skyGrad.addColorStop(0.5, '#6699cc');
  skyGrad.addColorStop(0.8, '#88bbee');
  skyGrad.addColorStop(1, '#aaccdd');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Warm sunlight wash (upper-right quadrant)
  const sunGrad = ctx.createRadialGradient(W * 0.8, H * 0.15, 20, W * 0.8, H * 0.15, 300);
  sunGrad.addColorStop(0, 'rgba(255, 240, 200, 0.35)');
  sunGrad.addColorStop(0.4, 'rgba(255, 230, 180, 0.15)');
  sunGrad.addColorStop(1, 'rgba(255, 220, 160, 0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, W, H);

  // Dust/haze in the air (semi-transparent tan particles scattered across sky)
  for (let i = 0; i < 80; i++) {
    const hx = Math.random() * W;
    const hy = Math.random() * H;
    const hr = 2 + Math.random() * 6;
    const ha = 0.04 + Math.random() * 0.08;
    ctx.fillStyle = `rgba(200, 180, 140, ${ha})`;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Haze band near horizon (lower third)
  const hazeGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
  hazeGrad.addColorStop(0, 'rgba(200, 185, 150, 0)');
  hazeGrad.addColorStop(0.5, 'rgba(200, 185, 150, 0.1)');
  hazeGrad.addColorStop(1, 'rgba(190, 175, 140, 0.15)');
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, H * 0.6, W, H * 0.4);

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

  // Major cracks on facade — branching pattern
  ctx.strokeStyle = 'rgba(50, 45, 40, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 100);
  ctx.lineTo(55, 150);
  ctx.lineTo(65, 200);
  ctx.lineTo(50, 250);
  ctx.stroke();
  // Branch crack from main
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(55, 150);
  ctx.lineTo(35, 170);
  ctx.lineTo(30, 195);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(65, 200);
  ctx.lineTo(85, 215);
  ctx.lineTo(90, 240);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, 300);
  ctx.lineTo(115, 340);
  ctx.lineTo(125, 380);
  ctx.stroke();
  // Additional branching cracks
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(115, 340);
  ctx.lineTo(100, 350);
  ctx.lineTo(95, 370);
  ctx.stroke();

  // Exposed rebar sticking out of wall holes
  ctx.strokeStyle = '#8A4A2A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(145, 200);
  ctx.lineTo(160, 185);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(155, 250);
  ctx.lineTo(170, 240);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(130, 220);
  ctx.lineTo(125, 195);
  ctx.stroke();

  // Additional wall hole with exposed interior
  ctx.fillStyle = '#2A2218';
  ctx.beginPath();
  ctx.moveTo(20, 380);
  ctx.lineTo(65, 370);
  ctx.lineTo(70, 420);
  ctx.lineTo(50, 430);
  ctx.lineTo(15, 410);
  ctx.closePath();
  ctx.fill();
  // Rebar from second hole
  ctx.strokeStyle = '#8A4A2A';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(20, 380); ctx.lineTo(10, 365); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(65, 370); ctx.lineTo(75, 358); ctx.stroke();

  // Scattered debris on ground (additional larger chunks)
  for (let i = 0; i < 10; i++) {
    const rx = Math.random() * tw;
    const ry = th - 70 + Math.random() * 60;
    const rs = 4 + Math.random() * 14;
    const shade = 100 + Math.random() * 50;
    ctx.fillStyle = `rgba(${shade}, ${shade - 10}, ${shade - 20}, 0.5)`;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + rs * 0.8, ry + Math.random() * 5);
    ctx.lineTo(rx + rs, ry + rs * 0.4);
    ctx.lineTo(rx + rs * 0.3, ry + rs * 0.6);
    ctx.lineTo(rx - 2, ry + rs * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  // Missing pieces of wall — jagged edges at top
  ctx.fillStyle = '#2A2218';
  ctx.beginPath();
  ctx.moveTo(tw * 0.6, 0);
  ctx.lineTo(tw * 0.65, 20);
  ctx.lineTo(tw * 0.75, 10);
  ctx.lineTo(tw * 0.8, 25);
  ctx.lineTo(tw, 15);
  ctx.lineTo(tw, 0);
  ctx.closePath();
  ctx.fill();
  // Sky showing through missing top
  ctx.fillStyle = 'rgba(85, 136, 204, 0.4)';
  ctx.beginPath();
  ctx.moveTo(tw * 0.6, 0);
  ctx.lineTo(tw * 0.65, 20);
  ctx.lineTo(tw * 0.75, 10);
  ctx.lineTo(tw * 0.8, 25);
  ctx.lineTo(tw, 15);
  ctx.lineTo(tw, 0);
  ctx.closePath();
  ctx.fill();

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

  // Additional exposed rebar from damage areas
  ctx.strokeStyle = '#8A4A2A';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(40, 95); ctx.lineTo(35, 75); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(55, 100); ctx.lineTo(65, 80); ctx.stroke();
  // Rebar from collapsed slab
  ctx.beginPath(); ctx.moveTo(tw * 0.6, 290); ctx.lineTo(tw * 0.55, 310); ctx.stroke();

  // Additional debris chunks on ground
  for (let i = 0; i < 12; i++) {
    const rx = Math.random() * tw;
    const ry = th - 60 + Math.random() * 55;
    const rs = 5 + Math.random() * 12;
    const shade = 140 + Math.random() * 50;
    ctx.fillStyle = `rgba(${shade}, ${shade - 15}, ${shade - 40}, 0.45)`;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + rs, ry + 2);
    ctx.lineTo(rx + rs * 0.7, ry + rs * 0.5);
    ctx.lineTo(rx - 3, ry + rs * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  // Major wall crack with branching
  ctx.strokeStyle = 'rgba(80, 60, 30, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tw * 0.5, 0);
  ctx.lineTo(tw * 0.48, 40);
  ctx.lineTo(tw * 0.52, 80);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tw * 0.48, 40);
  ctx.lineTo(tw * 0.38, 55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tw * 0.52, 80);
  ctx.lineTo(tw * 0.62, 95);
  ctx.stroke();

  // Collapsed roof section — jagged missing piece at top
  ctx.fillStyle = '#2A2218';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 15);
  ctx.lineTo(20, 25);
  ctx.lineTo(35, 10);
  ctx.lineTo(55, 20);
  ctx.lineTo(70, 5);
  ctx.lineTo(70, 0);
  ctx.closePath();
  ctx.fill();
  // Sky visible through missing roof
  ctx.fillStyle = 'rgba(85, 136, 204, 0.35)';
  ctx.fillRect(0, 0, 70, 5);

  // Exposed rebar from collapsed roof
  ctx.strokeStyle = '#8A4A2A';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(25, 25); ctx.lineTo(22, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(50, 18); ctx.lineTo(52, 35); ctx.stroke();

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

  // ── BROKEN LAMPS (tilted lamp shapes with cracked bulbs) ──
  // Lamp 1 — left side, fallen over, cracked bulb
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
  // Cracked bulb inside shade
  ctx.fillStyle = 'rgba(220, 210, 180, 0.3)';
  ctx.beginPath();
  ctx.arc(0, -58, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 90, 70, 0.5)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(-2, -60); ctx.lineTo(2, -56); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1, -61); ctx.lineTo(-1, -55); ctx.stroke();
  ctx.fillStyle = '#8A8070';
  ctx.fillRect(-6, 0, 12, 4); // base
  ctx.restore();

  // Lamp 2 — right side, partially standing but bent, cracked bulb
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
  // Cracked bulb
  ctx.fillStyle = 'rgba(220, 210, 180, 0.25)';
  ctx.beginPath();
  ctx.arc(0, -49, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(100, 90, 70, 0.4)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(-2, -51); ctx.lineTo(1, -47); ctx.stroke();
  ctx.restore();

  // Lamp 3 — on back wall, hanging at angle (wall sconce broken)
  ctx.save();
  ctx.translate(W / 2 + 160, backWallTop + 60);
  ctx.rotate(0.5);
  ctx.fillStyle = '#5A5040';
  ctx.fillRect(-1, -20, 3, 20); // short pole
  ctx.fillStyle = '#6A6050';
  ctx.beginPath();
  ctx.moveTo(-6, -24);
  ctx.lineTo(6, -24);
  ctx.lineTo(4, -18);
  ctx.lineTo(-4, -18);
  ctx.closePath();
  ctx.fill();
  // Shattered bulb
  ctx.strokeStyle = 'rgba(180, 170, 150, 0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(3, -26); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-2, -27); ctx.stroke();
  ctx.restore();

  // ── CRACKED/BROKEN MIRRORS on wall (irregular shapes) ──
  // Mirror 1 — large, on back wall right side
  const mirrorX = W - sideInset - 200;
  const mirrorY = backWallTop + 40;
  const mirrorW = 50;
  const mirrorH = 65;
  // Mirror frame (slightly irregular — one corner bent)
  ctx.strokeStyle = '#7A6A50';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(mirrorX, mirrorY);
  ctx.lineTo(mirrorX + mirrorW, mirrorY + 2);
  ctx.lineTo(mirrorX + mirrorW - 3, mirrorY + mirrorH);
  ctx.lineTo(mirrorX + 2, mirrorY + mirrorH - 3);
  ctx.closePath();
  ctx.stroke();
  // Reflective surface (slightly lighter than wall)
  ctx.fillStyle = 'rgba(200, 210, 220, 0.2)';
  ctx.beginPath();
  ctx.moveTo(mirrorX + 3, mirrorY + 3);
  ctx.lineTo(mirrorX + mirrorW - 3, mirrorY + 5);
  ctx.lineTo(mirrorX + mirrorW - 6, mirrorY + mirrorH - 3);
  ctx.lineTo(mirrorX + 5, mirrorY + mirrorH - 6);
  ctx.closePath();
  ctx.fill();
  // Crack lines radiating from impact point
  const crackCx = mirrorX + mirrorW * 0.4;
  const crackCy = mirrorY + mirrorH * 0.3;
  ctx.strokeStyle = 'rgba(60, 50, 40, 0.6)';
  ctx.lineWidth = 1;
  for (let ci = 0; ci < 10; ci++) {
    const angle = (ci / 10) * Math.PI * 2;
    const len = 12 + Math.random() * 22;
    ctx.beginPath();
    ctx.moveTo(crackCx, crackCy);
    ctx.lineTo(crackCx + Math.cos(angle) * len, crackCy + Math.sin(angle) * len);
    ctx.stroke();
    // Sub-branches
    if (ci % 3 === 0) {
      const midLen = len * 0.5;
      const subAngle = angle + (Math.random() - 0.5) * 0.8;
      ctx.beginPath();
      ctx.moveTo(crackCx + Math.cos(angle) * midLen, crackCy + Math.sin(angle) * midLen);
      ctx.lineTo(crackCx + Math.cos(subAngle) * (midLen + 8), crackCy + Math.sin(subAngle) * (midLen + 8));
      ctx.stroke();
    }
  }
  // Missing shard from mirror edge
  ctx.fillStyle = '#C4B498'; // same as wall color
  ctx.beginPath();
  ctx.moveTo(mirrorX + mirrorW - 8, mirrorY + mirrorH - 10);
  ctx.lineTo(mirrorX + mirrorW - 3, mirrorY + mirrorH);
  ctx.lineTo(mirrorX + mirrorW - 14, mirrorY + mirrorH - 3);
  ctx.closePath();
  ctx.fill();

  // Mirror 2 — small, on left wall, half-fallen
  ctx.save();
  ctx.translate(sideInset - 20, backWallTop + 80);
  ctx.rotate(0.35);
  ctx.strokeStyle = '#6A5A40';
  ctx.lineWidth = 2;
  ctx.strokeRect(-15, -20, 30, 40);
  ctx.fillStyle = 'rgba(190, 200, 210, 0.15)';
  ctx.fillRect(-13, -18, 26, 36);
  // Diagonal crack
  ctx.strokeStyle = 'rgba(60, 50, 40, 0.5)';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-13, -18); ctx.lineTo(13, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -16); ctx.lineTo(-8, 14); ctx.stroke();
  ctx.restore();

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

  // ── BROKEN GLASS on floor (small reflective dots scattered) ──
  for (let i = 0; i < 40; i++) {
    const gx = sideInset + 30 + Math.random() * (W - 2 * sideInset - 60);
    const gy = floorTop + 15 + Math.random() * (H - floorTop - 40);
    const gs = 1 + Math.random() * 2;
    // Slightly reflective bright spots
    ctx.fillStyle = `rgba(200, 220, 240, ${0.15 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(gx, gy, gs, 0, Math.PI * 2);
    ctx.fill();
    // Some with a bright highlight
    if (Math.random() > 0.6) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(gx + 0.5, gy - 0.5, gs * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── FALLEN PICTURE FRAMES on walls and floor ──
  // Frame 1 — tilted on back wall
  ctx.save();
  ctx.translate(sideInset + 250, backWallTop + 70);
  ctx.rotate(0.25);
  ctx.strokeStyle = '#6A5A40';
  ctx.lineWidth = 2;
  ctx.strokeRect(-18, -24, 36, 48);
  ctx.fillStyle = 'rgba(60, 50, 35, 0.3)';
  ctx.fillRect(-16, -22, 32, 44);
  // Crack across glass
  ctx.strokeStyle = 'rgba(180, 200, 220, 0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(16, 15); ctx.stroke();
  ctx.restore();

  // Frame 2 — fallen on floor
  ctx.save();
  ctx.translate(W / 2 + 60, floorTop + 140);
  ctx.rotate(-0.6);
  ctx.strokeStyle = '#7A6A50';
  ctx.lineWidth = 2;
  ctx.strokeRect(-14, -20, 28, 40);
  ctx.fillStyle = 'rgba(50, 40, 30, 0.25)';
  ctx.fillRect(-12, -18, 24, 36);
  ctx.restore();

  // Frame 3 — hanging crooked on right wall
  ctx.save();
  ctx.translate(W - sideInset - 40, backWallTop + 100);
  ctx.rotate(-0.15);
  ctx.strokeStyle = '#6A5A40';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-12, -16, 24, 32);
  ctx.fillStyle = 'rgba(70, 60, 40, 0.2)';
  ctx.fillRect(-10, -14, 20, 28);
  ctx.restore();

  // ── CEILING DEBRIS on floor (irregular gray shapes) ──
  const debrisPositions = [
    { x: W / 2 - 130, y: floorTop + 40, s: 14 },
    { x: W / 2 + 40, y: floorTop + 65, s: 10 },
    { x: sideInset + 180, y: floorTop + 90, s: 12 },
    { x: W - sideInset - 120, y: floorTop + 55, s: 16 },
    { x: W / 2 - 60, y: floorTop + 110, s: 8 },
    { x: sideInset + 300, y: floorTop + 130, s: 11 },
    { x: W / 2 + 150, y: floorTop + 95, s: 9 },
  ];
  for (const d of debrisPositions) {
    ctx.fillStyle = `rgba(${120 + Math.random() * 30}, ${115 + Math.random() * 25}, ${95 + Math.random() * 20}, 0.5)`;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + d.s * 0.8, d.y + d.s * 0.2);
    ctx.lineTo(d.x + d.s, d.y + d.s * 0.6);
    ctx.lineTo(d.x + d.s * 0.4, d.y + d.s * 0.8);
    ctx.lineTo(d.x - d.s * 0.2, d.y + d.s * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // ── ADDITIONAL WALL CRACKS (branching lines on wall surfaces) ──
  // Left wall cracks
  ctx.strokeStyle = 'rgba(60, 45, 30, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, 80);
  ctx.lineTo(45, 140);
  ctx.lineTo(35, 200);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(45, 140);
  ctx.lineTo(60, 155);
  ctx.stroke();

  // Right wall cracks
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W - 35, 120);
  ctx.lineTo(W - 50, 180);
  ctx.lineTo(W - 40, 240);
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(W - 50, 180);
  ctx.lineTo(W - 65, 195);
  ctx.stroke();

  // ── DAYTIME LIGHT PATCHES (bright rectangular patches from broken windows) ──
  const lightPatches = [
    { x: sideInset + 30, y: floorTop + 20, w: 70, h: 100 },
    { x: W - sideInset - 100, y: floorTop + 30, w: 60, h: 80 },
    { x: W / 2 - 40, y: floorTop + 10, w: 80, h: 50 },
    // Light on back wall from holes
    { x: sideInset + 90, y: backWallTop + 40, w: 50, h: 60 },
    { x: W - sideInset - 120, y: backWallTop + 35, w: 45, h: 55 },
  ];
  for (const lp of lightPatches) {
    const lightGrad = ctx.createRadialGradient(
      lp.x + lp.w / 2, lp.y + lp.h / 2, 5,
      lp.x + lp.w / 2, lp.y + lp.h / 2, Math.max(lp.w, lp.h)
    );
    lightGrad.addColorStop(0, 'rgba(255, 245, 200, 0.12)');
    lightGrad.addColorStop(0.5, 'rgba(255, 240, 180, 0.06)');
    lightGrad.addColorStop(1, 'rgba(255, 235, 160, 0)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(lp.x, lp.y, lp.w, lp.h);
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

// ── Armchair texture (120x120) — large wingback chair, front perspective ──
export function createArmchairTexture(scene) {
  if (scene.textures.exists('armchair')) return;

  const s = 120;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  const cx = s / 2, cy = s / 2;

  // Main color palette — olive green military armchair
  const mainColor = '#556B2F';
  const darkColor = '#3B4A20';
  const lightColor = '#6B8A3A';
  const legColor = '#2A1A0A';

  // Shadow at base
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 48, 46, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── 4 SHORT LEGS (drawn first, behind everything) ──
  ctx.fillStyle = legColor;
  // Front-left leg
  ctx.fillRect(cx - 38, cy + 34, 7, 14);
  // Front-right leg
  ctx.fillRect(cx + 31, cy + 34, 7, 14);
  // Back-left leg
  ctx.fillRect(cx - 34, cy + 30, 6, 12);
  // Back-right leg
  ctx.fillRect(cx + 28, cy + 30, 6, 12);

  // ── TALL WIDE BACKREST ──
  // Main backrest panel (wide, tall, with rounded top using arcs)
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy - 5);
  ctx.lineTo(cx - 38, cy - 44);
  // Rounded top corners
  ctx.quadraticCurveTo(cx - 38, cy - 54, cx - 28, cy - 54);
  ctx.lineTo(cx + 28, cy - 54);
  ctx.quadraticCurveTo(cx + 38, cy - 54, cx + 38, cy - 44);
  ctx.lineTo(cx + 38, cy - 5);
  ctx.closePath();
  ctx.fill();

  // Backrest padding highlight (slightly lighter oval)
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 28, 28, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Capitone / tufted fabric: vertical lines on backrest
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1.2;
  for (let vx = cx - 24; vx <= cx + 24; vx += 8) {
    ctx.beginPath();
    ctx.moveTo(vx, cy - 50);
    ctx.quadraticCurveTo(vx + (Math.random() - 0.5) * 3, cy - 30, vx, cy - 8);
    ctx.stroke();
  }

  // Tufted button dots (diamond pattern like classic capitone)
  ctx.fillStyle = darkColor;
  const tuftRows = [
    [[-16, -42], [0, -42], [16, -42]],
    [[-8, -32], [8, -32]],
    [[-16, -22], [0, -22], [16, -22]],
    [[-8, -12], [8, -12]],
  ];
  for (const row of tuftRows) {
    for (const [tx, ty] of row) {
      ctx.beginPath();
      ctx.arc(cx + tx, cy + ty, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── SEAT CUSHION (thick, padded, rounded) ──
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(cx - 42, cy - 5);
  ctx.quadraticCurveTo(cx - 44, cy + 4, cx - 42, cy + 12);
  ctx.lineTo(cx + 42, cy + 12);
  ctx.quadraticCurveTo(cx + 44, cy + 4, cx + 42, cy - 5);
  ctx.closePath();
  ctx.fill();

  // Seat cushion highlight (rounded puffy look)
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 32, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Seat crease line (where back meets seat)
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 36, cy - 4);
  ctx.quadraticCurveTo(cx, cy - 2, cx + 36, cy - 4);
  ctx.stroke();

  // ── LEFT ARMREST (padded, rounded top) ──
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(cx - 42, cy - 30);
  // Rounded armrest top
  ctx.quadraticCurveTo(cx - 54, cy - 32, cx - 52, cy - 24);
  ctx.lineTo(cx - 50, cy + 12);
  ctx.lineTo(cx - 40, cy + 12);
  ctx.lineTo(cx - 40, cy - 28);
  ctx.closePath();
  ctx.fill();
  // Armrest top pad (rounded)
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(cx - 47, cy - 28, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── RIGHT ARMREST (padded, rounded top) ──
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(cx + 42, cy - 30);
  ctx.quadraticCurveTo(cx + 54, cy - 32, cx + 52, cy - 24);
  ctx.lineTo(cx + 50, cy + 12);
  ctx.lineTo(cx + 40, cy + 12);
  ctx.lineTo(cx + 40, cy - 28);
  ctx.closePath();
  ctx.fill();
  // Armrest top pad (rounded)
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(cx + 47, cy - 28, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── FRONT SKIRT below seat ──
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(cx - 42, cy + 12);
  ctx.lineTo(cx + 42, cy + 12);
  ctx.lineTo(cx + 40, cy + 34);
  ctx.lineTo(cx - 40, cy + 34);
  ctx.closePath();
  ctx.fill();

  // Front panel decorative band
  ctx.fillStyle = darkColor;
  ctx.fillRect(cx - 38, cy + 18, 76, 2);
  ctx.fillRect(cx - 38, cy + 28, 76, 2);

  // ── Worn fabric patches (subtle) ──
  ctx.fillStyle = 'rgba(80, 90, 50, 0.25)';
  ctx.fillRect(cx - 15, cy - 20, 10, 6);
  ctx.fillRect(cx + 8, cy + 4, 8, 5);

  // ── Fabric texture: horizontal stitching lines ──
  ctx.strokeStyle = 'rgba(40, 50, 20, 0.12)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 6; i++) {
    const ly = cy - 48 + i * 12;
    ctx.beginPath();
    ctx.moveTo(cx - 30, ly);
    ctx.lineTo(cx + 30, ly);
    ctx.stroke();
  }

  scene.textures.addCanvas('armchair', c);
}

// ── Armchair side texture (90x120) — olive green side profile ──
export function createArmchairSideTexture(scene) {
  if (scene.textures.exists('armchair_side')) return;

  const sw = 90, sh = 120;
  const c = document.createElement('canvas');
  c.width = sw; c.height = sh;
  const ctx = c.getContext('2d');

  const mainColor = '#556B2F';
  const darkColor = '#3B4A20';
  const lightColor = '#6B8A3A';
  const legColor = '#2A1A0A';

  // Shadow at base
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(45, sh - 10, 35, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (drawn first, behind chair body)
  ctx.fillStyle = legColor;
  ctx.fillRect(14, 86, 6, 16);
  ctx.fillRect(60, 84, 6, 18);

  // TALL BACKREST (rounded top)
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(10, 55);
  ctx.lineTo(10, 14);
  ctx.quadraticCurveTo(10, 2, 22, 2);
  ctx.lineTo(30, 2);
  ctx.quadraticCurveTo(38, 4, 36, 16);
  ctx.lineTo(36, 55);
  ctx.closePath();
  ctx.fill();

  // Back cushion shading (lighter padded area)
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(22, 28, 9, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Capitone vertical lines on back
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;
  for (let vx = 14; vx <= 30; vx += 8) {
    ctx.beginPath();
    ctx.moveTo(vx, 6);
    ctx.quadraticCurveTo(vx + 1, 28, vx, 52);
    ctx.stroke();
  }

  // Tufted buttons on back
  ctx.fillStyle = darkColor;
  const sideTufts = [[18, 14], [26, 14], [22, 28], [18, 42], [26, 42]];
  for (const [tx, ty] of sideTufts) {
    ctx.beginPath();
    ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // SEAT (side view — thick padded cushion)
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(10, 55);
  ctx.lineTo(66, 52);
  ctx.quadraticCurveTo(70, 58, 68, 68);
  ctx.lineTo(10, 70);
  ctx.closePath();
  ctx.fill();

  // Seat cushion highlight
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(38, 60, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // ARMREST (side profile — thick, padded, rounded)
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(8, 32);
  ctx.quadraticCurveTo(4, 28, 8, 26);
  ctx.lineTo(64, 24);
  ctx.quadraticCurveTo(68, 26, 66, 30);
  ctx.lineTo(66, 38);
  ctx.lineTo(8, 42);
  ctx.closePath();
  ctx.fill();
  // Armrest top pad (rounded)
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(36, 26, 28, 3, -0.03, 0, Math.PI * 2);
  ctx.fill();

  // Front skirt
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(62, 52);
  ctx.lineTo(68, 68);
  ctx.lineTo(68, 86);
  ctx.lineTo(62, 86);
  ctx.closePath();
  ctx.fill();

  // Bottom skirt
  ctx.fillStyle = mainColor;
  ctx.fillRect(10, 70, 58, 16);
  // Decorative band
  ctx.fillStyle = darkColor;
  ctx.fillRect(12, 76, 54, 2);

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


// ── Boss 4 / ANGRY EYEBROWS (256x256) — cabezón political leader ──
/**
 * Draw Boss 4 — Angry Eyebrows: cabezón (big-head) political/military leader.
 * Elongated oval face, short gray hair, THICK signature eyebrows,
 * compact gray beard, kefia on shoulders, dark suit.
 * @param {string} expression — 'normal' | 'angry' | 'furious' | 'dead'
 * @returns {HTMLCanvasElement}
 */
export function drawBoss4AngryEyebrows(expression = 'normal') {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const cx = S / 2; // 128

  // ── Skin tones by expression ──
  let skinBase, skinDark, skinLight;
  if (expression === 'furious') {
    skinBase = '#B07048'; skinDark = '#8A5030'; skinLight = '#D08868';
  } else if (expression === 'angry') {
    skinBase = '#BA8858'; skinDark = '#9A6A40'; skinLight = '#D0A070';
  } else if (expression === 'dead') {
    skinBase = '#8A8A7A'; skinDark = '#6A6A5A'; skinLight = '#A0A090';
  } else {
    skinBase = '#C4956A'; skinDark = '#A07850'; skinLight = '#D8AA80';
  }

  // ── Layout (CABEZÓN: ~40% head, ~60% body) ──
  const headCY = 56;       // head center Y
  const headRX = 40;       // head width radius (80px wide)
  const headRY = 55;       // head height radius — increased 15% for feature spread
  const neckTop = headCY + headRY; // 111
  const shoulderY = 124;
  const torsoBottom = 200;
  const legBottom = 240;

  // ═══════════════════════════════════════════════════
  // BODY (drawn first, behind head/kefia)
  // ═══════════════════════════════════════════════════

  // ── Legs (dark pants) ──
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(cx - 24, torsoBottom, 20, legBottom - torsoBottom);
  ctx.fillRect(cx + 4, torsoBottom, 20, legBottom - torsoBottom);
  // Shoes
  ctx.fillStyle = '#0A0A14';
  ctx.beginPath();
  ctx.moveTo(cx - 28, legBottom);
  ctx.lineTo(cx + 0, legBottom);
  ctx.lineTo(cx - 2, legBottom + 8);
  ctx.lineTo(cx - 30, legBottom + 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 0, legBottom);
  ctx.lineTo(cx + 28, legBottom);
  ctx.lineTo(cx + 30, legBottom + 8);
  ctx.lineTo(cx + 2, legBottom + 8);
  ctx.closePath();
  ctx.fill();

  // ── Torso (dark suit — distinct from pants) ──
  const suitColor = '#2A2A2A';
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.moveTo(cx - 48, shoulderY);
  ctx.lineTo(cx + 48, shoulderY);
  ctx.lineTo(cx + 40, torsoBottom);
  ctx.lineTo(cx - 40, torsoBottom);
  ctx.closePath();
  ctx.fill();

  // Waistline (1px line between suit and pants)
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 40, torsoBottom);
  ctx.lineTo(cx + 40, torsoBottom);
  ctx.stroke();

  // Shoulder pads (wide, authoritative)
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.moveTo(cx - 56, shoulderY);
  ctx.lineTo(cx - 38, shoulderY - 6);
  ctx.lineTo(cx + 38, shoulderY - 6);
  ctx.lineTo(cx + 56, shoulderY);
  ctx.lineTo(cx + 52, shoulderY + 14);
  ctx.lineTo(cx - 52, shoulderY + 14);
  ctx.closePath();
  ctx.fill();

  // Suit lapels (V-shape from neck to chest, lighter than suit)
  ctx.fillStyle = '#4A4A4A';
  ctx.beginPath();
  ctx.moveTo(cx - 12, shoulderY - 2);
  ctx.lineTo(cx - 24, shoulderY + 6);
  ctx.lineTo(cx - 16, shoulderY + 48);
  ctx.lineTo(cx - 4, shoulderY + 40);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 12, shoulderY - 2);
  ctx.lineTo(cx + 24, shoulderY + 6);
  ctx.lineTo(cx + 16, shoulderY + 48);
  ctx.lineTo(cx + 4, shoulderY + 40);
  ctx.closePath();
  ctx.fill();
  // Lapel V-lines (visible diagonal lighter lines)
  ctx.strokeStyle = '#4A4A4A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 4, shoulderY);
  ctx.lineTo(cx - 18, shoulderY + 44);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 4, shoulderY);
  ctx.lineTo(cx + 18, shoulderY + 44);
  ctx.stroke();

  // Buttons (below kefia area)
  ctx.fillStyle = '#555555';
  ctx.beginPath();
  ctx.arc(cx, shoulderY + 50, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, shoulderY + 64, 3, 0, Math.PI * 2);
  ctx.fill();

  // Suit wrinkles
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 28, shoulderY + 12); ctx.lineTo(cx - 20, torsoBottom - 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 28, shoulderY + 12); ctx.lineTo(cx + 20, torsoBottom - 8); ctx.stroke();

  // ── Arms (suit sleeves, visible at sides, 14px wide) ──
  // Left arm
  ctx.fillStyle = '#2E2E2E';
  ctx.beginPath();
  ctx.moveTo(cx - 52, shoulderY + 4);
  ctx.lineTo(cx - 60, shoulderY + 10);
  ctx.lineTo(cx - 64, shoulderY + 62);
  ctx.lineTo(cx - 50, shoulderY + 64);
  ctx.lineTo(cx - 48, shoulderY + 14);
  ctx.closePath();
  ctx.fill();
  // Right arm
  ctx.beginPath();
  ctx.moveTo(cx + 52, shoulderY + 4);
  ctx.lineTo(cx + 60, shoulderY + 10);
  ctx.lineTo(cx + 64, shoulderY + 62);
  ctx.lineTo(cx + 50, shoulderY + 64);
  ctx.lineTo(cx + 48, shoulderY + 14);
  ctx.closePath();
  ctx.fill();
  // Arm edge highlights (1px lighter edge)
  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 50, shoulderY + 14); ctx.lineTo(cx - 50, shoulderY + 64); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 50, shoulderY + 14); ctx.lineTo(cx + 50, shoulderY + 64); ctx.stroke();
  // Hands (skin-colored ovals)
  ctx.fillStyle = skinBase;
  ctx.beginPath(); ctx.ellipse(cx - 57, shoulderY + 66, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 57, shoulderY + 66, 8, 6, 0, 0, Math.PI * 2); ctx.fill();

  // ═══════════════════════════════════════════════════
  // KEFIA ON SHOULDERS (checkered white/dark gray)
  // ═══════════════════════════════════════════════════
  const kefW = '#E8E8E8';
  const kefD = '#3A3A3A';

  // Left drape
  ctx.fillStyle = kefW;
  ctx.beginPath();
  ctx.moveTo(cx - 14, neckTop);
  ctx.lineTo(cx - 54, shoulderY + 6);
  ctx.lineTo(cx - 58, shoulderY + 42);
  ctx.lineTo(cx - 42, shoulderY + 52);
  ctx.lineTo(cx - 16, shoulderY + 38);
  ctx.lineTo(cx - 2, shoulderY + 10);
  ctx.closePath();
  ctx.fill();
  // Right drape
  ctx.beginPath();
  ctx.moveTo(cx + 14, neckTop);
  ctx.lineTo(cx + 54, shoulderY + 6);
  ctx.lineTo(cx + 58, shoulderY + 42);
  ctx.lineTo(cx + 42, shoulderY + 52);
  ctx.lineTo(cx + 16, shoulderY + 38);
  ctx.lineTo(cx + 2, shoulderY + 10);
  ctx.closePath();
  ctx.fill();

  // Center neckpiece
  ctx.fillStyle = kefW;
  ctx.beginPath();
  ctx.moveTo(cx - 16, neckTop - 2);
  ctx.lineTo(cx + 16, neckTop - 2);
  ctx.lineTo(cx + 12, shoulderY + 16);
  ctx.lineTo(cx - 12, shoulderY + 16);
  ctx.closePath();
  ctx.fill();

  // Hanging ends in front (shorter — kefia ends at mid-chest)
  ctx.fillStyle = kefW;
  ctx.fillRect(cx - 10, shoulderY + 16, 7, 24);
  ctx.fillRect(cx + 3, shoulderY + 16, 7, 24);

  // Diagonal crosshatch pattern on left drape
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - 14, neckTop + 6);
  ctx.lineTo(cx - 54, shoulderY + 6);
  ctx.lineTo(cx - 58, shoulderY + 42);
  ctx.lineTo(cx - 42, shoulderY + 52);
  ctx.lineTo(cx - 16, shoulderY + 38);
  ctx.lineTo(cx - 2, shoulderY + 10);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = kefD;
  ctx.lineWidth = 1;
  for (let i = -120; i < 200; i += 8) {
    ctx.beginPath();
    ctx.moveTo(cx - 60 + i, shoulderY);
    ctx.lineTo(cx - 60 + i + 60, shoulderY + 60);
    ctx.stroke();
  }
  for (let i = -120; i < 200; i += 8) {
    ctx.beginPath();
    ctx.moveTo(cx + 60 - i, shoulderY);
    ctx.lineTo(cx + 60 - i - 60, shoulderY + 60);
    ctx.stroke();
  }
  ctx.restore();

  // Diagonal crosshatch pattern on right drape
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx + 14, neckTop + 6);
  ctx.lineTo(cx + 54, shoulderY + 6);
  ctx.lineTo(cx + 58, shoulderY + 42);
  ctx.lineTo(cx + 42, shoulderY + 52);
  ctx.lineTo(cx + 16, shoulderY + 38);
  ctx.lineTo(cx + 2, shoulderY + 10);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = kefD;
  ctx.lineWidth = 1;
  for (let i = -120; i < 200; i += 8) {
    ctx.beginPath();
    ctx.moveTo(cx - 60 + i, shoulderY);
    ctx.lineTo(cx - 60 + i + 60, shoulderY + 60);
    ctx.stroke();
  }
  for (let i = -120; i < 200; i += 8) {
    ctx.beginPath();
    ctx.moveTo(cx + 60 - i, shoulderY);
    ctx.lineTo(cx + 60 - i - 60, shoulderY + 60);
    ctx.stroke();
  }
  ctx.restore();

  // Crosshatch on center neckpiece
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - 16, neckTop + 6);
  ctx.lineTo(cx + 16, neckTop + 6);
  ctx.lineTo(cx + 12, shoulderY + 16);
  ctx.lineTo(cx - 12, shoulderY + 16);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = kefD;
  ctx.lineWidth = 1;
  for (let i = -60; i < 80; i += 8) {
    ctx.beginPath();
    ctx.moveTo(cx - 20 + i, neckTop - 4);
    ctx.lineTo(cx - 20 + i + 40, neckTop + 36);
    ctx.stroke();
  }
  for (let i = -60; i < 80; i += 8) {
    ctx.beginPath();
    ctx.moveTo(cx + 20 - i, neckTop - 4);
    ctx.lineTo(cx + 20 - i - 40, neckTop + 36);
    ctx.stroke();
  }
  ctx.restore();

  // Crosshatch on hanging ends
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - 10, shoulderY + 16, 7, 24);
  ctx.rect(cx + 3, shoulderY + 16, 7, 24);
  ctx.clip();
  ctx.strokeStyle = kefD;
  ctx.lineWidth = 1;
  for (let i = -40; i < 60; i += 8) {
    ctx.beginPath();
    ctx.moveTo(cx - 12 + i, shoulderY + 14);
    ctx.lineTo(cx - 12 + i + 30, shoulderY + 44);
    ctx.stroke();
  }
  for (let i = -40; i < 60; i += 8) {
    ctx.beginPath();
    ctx.moveTo(cx + 12 - i, shoulderY + 14);
    ctx.lineTo(cx + 12 - i - 30, shoulderY + 44);
    ctx.stroke();
  }
  ctx.restore();

  // Fold lines
  ctx.strokeStyle = '#C0C0C0';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 34, shoulderY + 8); ctx.lineTo(cx - 38, shoulderY + 44); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 34, shoulderY + 8); ctx.lineTo(cx + 38, shoulderY + 44); ctx.stroke();

  // ═══════════════════════════════════════════════════
  // NECK (short, thick)
  // ═══════════════════════════════════════════════════
  ctx.fillStyle = skinDark;
  ctx.fillRect(cx - 16, neckTop - 2, 32, shoulderY - neckTop + 6);

  // ═══════════════════════════════════════════════════
  // HEAD (elongated oval — CABEZÓN signature)
  // ═══════════════════════════════════════════════════
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX, headRY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle outline
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX, headRY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ── Ears ──
  ctx.fillStyle = skinBase;
  ctx.beginPath(); ctx.ellipse(cx - headRX - 3, headCY + 6, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + headRX + 3, headCY + 6, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx - headRX - 3, headCY + 6, 4, 0.5, 2.5); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + headRX + 3, headCY + 6, 4, 0.5, 2.5); ctx.stroke();

  // ═══════════════════════════════════════════════════
  // SHORT GRAY HAIR (almost rapado, receding hairline)
  // ═══════════════════════════════════════════════════
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX, headRY, 0, 0, Math.PI * 2);
  ctx.clip();

  // Thin hair layer on top
  ctx.fillStyle = '#8A8A8A';
  ctx.beginPath();
  ctx.ellipse(cx, headCY - 6, headRX - 2, headRY - 4, 0, Math.PI, 0, true);
  ctx.fill();

  // Sides thicker (entradas — receding on top center)
  ctx.fillStyle = '#7A7A7A';
  ctx.beginPath(); ctx.arc(cx - 28, headCY - 24, 16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 28, headCY - 24, 16, 0, Math.PI * 2); ctx.fill();

  // Clear center forehead (receding hairline)
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(cx, headCY - 18, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair texture strands (visible scalp through short hair)
  ctx.strokeStyle = '#6A6A6A';
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 40; i++) {
    const hx = cx + (Math.random() - 0.5) * 70;
    const hy = headCY - headRY + 6 + Math.random() * 24;
    const dx2 = ((hx - cx) / headRX) ** 2;
    const dy2 = ((hy - headCY) / headRY) ** 2;
    if (dx2 + dy2 < 0.92) {
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + (Math.random() - 0.5) * 3, hy - 2 - Math.random() * 3);
      ctx.stroke();
    }
  }
  ctx.restore();

  // ═══════════════════════════════════════════════════
  // EYEBROWS — THE SIGNATURE FEATURE
  // Thick, heavy, V-shaped, almost touching, textured
  // ═══════════════════════════════════════════════════
  const browY = headCY - headRY * 0.4;  // ~30% from top of head
  const browColor = expression === 'dead' ? '#4A4A4A' : '#111111';
  const browH = 10;  // thick and dominant at 256 scale
  const browW = 36;  // extends beyond eyes on both sides
  const browGap = 5; // almost touching
  // Angle: inner end LOWER than outer (V-shape for anger) — increased angles
  const browAngle = expression === 'furious' ? 0.38 : expression === 'angry' ? 0.30 : 0.22;

  ctx.fillStyle = browColor;

  // Left eyebrow — inner end (near nose) is LOWER
  ctx.beginPath();
  ctx.moveTo(cx - browGap / 2 - browW, browY - browH / 2 - browAngle * browW / 2);  // outer top
  ctx.lineTo(cx - browGap / 2, browY - browH / 2 + browAngle * browW / 2 + 2);       // inner top (lower)
  ctx.lineTo(cx - browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 2);       // inner bottom
  ctx.lineTo(cx - browGap / 2 - browW, browY + browH / 2 - browAngle * browW / 2);   // outer bottom
  ctx.closePath();
  ctx.fill();

  // Right eyebrow — mirror
  ctx.beginPath();
  ctx.moveTo(cx + browGap / 2 + browW, browY - browH / 2 - browAngle * browW / 2);
  ctx.lineTo(cx + browGap / 2, browY - browH / 2 + browAngle * browW / 2 + 2);
  ctx.lineTo(cx + browGap / 2, browY + browH / 2 + browAngle * browW / 2 + 2);
  ctx.lineTo(cx + browGap / 2 + browW, browY + browH / 2 - browAngle * browW / 2);
  ctx.closePath();
  ctx.fill();

  // Brow hair texture (irregular strands for thick bushy look)
  ctx.strokeStyle = browColor;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 24; i++) {
    const t = i / 24;
    // Left brow strands
    const lx = cx - browGap / 2 - browW + t * browW;
    const ly = browY + (t - 0.5) * browAngle * browW;
    ctx.beginPath();
    ctx.moveTo(lx, ly - browH / 2 - 1);
    ctx.lineTo(lx + (Math.random() - 0.5) * 3, ly + browH / 2 + Math.random() * 2);
    ctx.stroke();
    // Right brow strands
    const rx = cx + browGap / 2 + t * browW;
    const ry = browY + (0.5 - t) * browAngle * browW;
    ctx.beginPath();
    ctx.moveTo(rx, ry - browH / 2 - 1);
    ctx.lineTo(rx + (Math.random() - 0.5) * 3, ry + browH / 2 + Math.random() * 2);
    ctx.stroke();
  }

  // Eyebrow shadow (2px below each brow — creates depth)
  ctx.fillStyle = 'rgba(20, 15, 10, 0.35)';
  // Left shadow
  const lShadowInner = browY + browH / 2 + browAngle * browW / 2 + 2;
  const lShadowOuter = browY + browH / 2 - browAngle * browW / 2;
  ctx.beginPath();
  ctx.moveTo(cx - browGap / 2 - browW, lShadowOuter);
  ctx.lineTo(cx - browGap / 2, lShadowInner);
  ctx.lineTo(cx - browGap / 2, lShadowInner + 3);
  ctx.lineTo(cx - browGap / 2 - browW, lShadowOuter + 3);
  ctx.closePath();
  ctx.fill();
  // Right shadow
  ctx.beginPath();
  ctx.moveTo(cx + browGap / 2 + browW, lShadowOuter);
  ctx.lineTo(cx + browGap / 2, lShadowInner);
  ctx.lineTo(cx + browGap / 2, lShadowInner + 3);
  ctx.lineTo(cx + browGap / 2 + browW, lShadowOuter + 3);
  ctx.closePath();
  ctx.fill();

  // ═══════════════════════════════════════════════════
  // EYES (small, squinting, intense — partially hidden by brow shadow)
  // ═══════════════════════════════════════════════════
  const eyeY = browY + browH + 10;  // 8-10px below eyebrows at 256 scale
  const eyeSpacing = 20;

  if (expression === 'dead') {
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 3;
    for (const side of [-1, 1]) {
      const ex = cx + side * eyeSpacing;
      ctx.beginPath();
      ctx.moveTo(ex - 7, eyeY - 4); ctx.lineTo(ex + 7, eyeY + 4);
      ctx.moveTo(ex + 7, eyeY - 4); ctx.lineTo(ex - 7, eyeY + 4);
      ctx.stroke();
    }
  } else {
    for (const side of [-1, 1]) {
      const ex = cx + side * eyeSpacing;

      // Narrow slit (squinting, barely open)
      ctx.fillStyle = '#E8E4D8';
      ctx.beginPath();
      ctx.moveTo(ex - 12, eyeY);
      ctx.quadraticCurveTo(ex, eyeY - 4, ex + 12, eyeY);
      ctx.quadraticCurveTo(ex, eyeY + 3, ex - 12, eyeY);
      ctx.closePath();
      ctx.fill();

      // Dark iris (almost black)
      ctx.fillStyle = '#1A1A1A';
      ctx.beginPath();
      ctx.arc(ex, eyeY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(ex, eyeY, 2, 0, Math.PI * 2);
      ctx.fill();

      // 1px white highlight (gives life)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ex + 1.5, eyeY - 2, 1.5, 1.5);

      // Eye outline
      ctx.strokeStyle = '#1a0a05';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ex - 12, eyeY);
      ctx.quadraticCurveTo(ex, eyeY - 4, ex + 12, eyeY);
      ctx.quadraticCurveTo(ex, eyeY + 3, ex - 12, eyeY);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // ═══════════════════════════════════════════════════
  // NOSE (large, prominent, wide — trapezoidal)
  // ═══════════════════════════════════════════════════
  const noseTop = eyeY + 8;
  const noseBot = headCY + headRY * 0.5;  // nose at ~50% of head height

  ctx.fillStyle = '#A07850';
  ctx.beginPath();
  ctx.moveTo(cx - 4, noseTop);
  ctx.lineTo(cx + 4, noseTop);
  ctx.lineTo(cx + 12, noseBot - 4);
  ctx.lineTo(cx + 10, noseBot);
  ctx.lineTo(cx - 10, noseBot);
  ctx.lineTo(cx - 12, noseBot - 4);
  ctx.closePath();
  ctx.fill();

  // Bridge highlight
  ctx.fillStyle = skinLight;
  ctx.beginPath();
  ctx.moveTo(cx - 2, noseTop + 2);
  ctx.lineTo(cx + 2, noseTop + 2);
  ctx.lineTo(cx + 3, noseBot - 8);
  ctx.lineTo(cx - 1, noseBot - 8);
  ctx.closePath();
  ctx.fill();

  // Nostrils
  ctx.fillStyle = '#3A2A1A';
  ctx.beginPath(); ctx.arc(cx - 6, noseBot - 2, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 6, noseBot - 2, 3, 0, Math.PI * 2); ctx.fill();

  // ═══════════════════════════════════════════════════
  // MOUTH (thin frown, asymmetric rictus, never smiles)
  // ═══════════════════════════════════════════════════
  const mouthY = headCY + headRY * 0.7;  // mouth at ~70% of head height

  if (expression === 'dead') {
    ctx.strokeStyle = '#6A5A4A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 18, mouthY);
    ctx.lineTo(cx - 6, mouthY + 3);
    ctx.lineTo(cx + 8, mouthY - 1);
    ctx.lineTo(cx + 18, mouthY + 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#8A6A4A';
    ctx.beginPath();
    ctx.moveTo(cx - 20, mouthY);
    ctx.quadraticCurveTo(cx - 8, mouthY + 3, cx, mouthY + 2);
    ctx.quadraticCurveTo(cx + 8, mouthY + 2, cx + 20, mouthY - 2);
    ctx.quadraticCurveTo(cx + 8, mouthY + 5, cx, mouthY + 4);
    ctx.quadraticCurveTo(cx - 8, mouthY + 6, cx - 20, mouthY);
    ctx.closePath();
    ctx.fill();

    // Lip line
    ctx.strokeStyle = '#5A4A3A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 20, mouthY);
    ctx.quadraticCurveTo(cx - 8, mouthY + 3, cx, mouthY + 2);
    ctx.quadraticCurveTo(cx + 8, mouthY + 2, cx + 20, mouthY - 2);
    ctx.stroke();
  }

  // ═══════════════════════════════════════════════════
  // BEARD (gray, short, compact — follows jawline)
  // ═══════════════════════════════════════════════════
  if (expression !== 'dead') {
    const beardColor = '#7A7A7A';
    ctx.fillStyle = beardColor;
    ctx.beginPath();
    ctx.moveTo(cx - 36, mouthY);
    ctx.quadraticCurveTo(cx - 40, mouthY + 14, cx - 32, headCY + headRY - 2);
    ctx.quadraticCurveTo(cx - 18, headCY + headRY + 8, cx, headCY + headRY + 6);
    ctx.quadraticCurveTo(cx + 18, headCY + headRY + 8, cx + 32, headCY + headRY - 2);
    ctx.quadraticCurveTo(cx + 40, mouthY + 14, cx + 36, mouthY);
    ctx.lineTo(cx + 22, mouthY + 6);
    ctx.lineTo(cx, mouthY + 8);
    ctx.lineTo(cx - 22, mouthY + 6);
    ctx.closePath();
    ctx.fill();

    // Beard texture (granular — dense at chin, sparse at cheeks)
    ctx.fillStyle = '#5A5A5A';
    for (let i = 0; i < 100; i++) {
      const bx = cx + (Math.random() - 0.5) * 64;
      const by = mouthY + 4 + Math.random() * (headCY + headRY - mouthY + 6);
      if (Math.random() > Math.abs(bx - cx) / 50) {
        ctx.fillRect(bx, by, 1 + Math.random(), 1.5 + Math.random());
      }
    }

    // Beard hair strands
    ctx.strokeStyle = '#6A6A6A';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 25; i++) {
      const bx = cx + (Math.random() - 0.5) * 56;
      const by = mouthY + 6 + Math.random() * 18;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + (Math.random() - 0.5) * 3, by + 3 + Math.random() * 5);
      ctx.stroke();
    }
  } else {
    // Dead: disheveled beard remnants
    ctx.fillStyle = 'rgba(100, 100, 90, 0.4)';
    ctx.beginPath();
    ctx.moveTo(cx - 30, mouthY);
    ctx.quadraticCurveTo(cx, headCY + headRY + 10, cx + 30, mouthY);
    ctx.closePath();
    ctx.fill();
  }

  // ═══════════════════════════════════════════════════
  // OUTLINE (1px black around head and body)
  // ═══════════════════════════════════════════════════
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  // Head outline
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headRX + 1, headRY + 1, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Body silhouette outline
  ctx.beginPath();
  ctx.moveTo(cx - 56, shoulderY);
  ctx.lineTo(cx - 48, shoulderY);
  ctx.lineTo(cx - 40, torsoBottom);
  ctx.lineTo(cx - 24, torsoBottom);
  ctx.lineTo(cx - 24, legBottom);
  ctx.lineTo(cx - 30, legBottom + 8);
  ctx.lineTo(cx + 30, legBottom + 8);
  ctx.lineTo(cx + 24, legBottom);
  ctx.lineTo(cx + 24, torsoBottom);
  ctx.lineTo(cx + 40, torsoBottom);
  ctx.lineTo(cx + 48, shoulderY);
  ctx.lineTo(cx + 56, shoulderY);
  ctx.stroke();

  // ═══════════════════════════════════════════════════
  // EXPRESSION-SPECIFIC EFFECTS
  // ═══════════════════════════════════════════════════
  if (expression === 'angry' || expression === 'furious') {
    // Forehead veins
    ctx.strokeStyle = expression === 'furious' ? '#CC2020' : '#AA5050';
    ctx.lineWidth = expression === 'furious' ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 28, headCY - 28);
    ctx.lineTo(cx - 20, headCY - 20);
    ctx.lineTo(cx - 24, headCY - 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 28, headCY - 28);
    ctx.lineTo(cx + 20, headCY - 20);
    ctx.lineTo(cx + 24, headCY - 14);
    ctx.stroke();
  }

  if (expression === 'furious') {
    // Red tint
    ctx.fillStyle = 'rgba(180, 20, 10, 0.12)';
    ctx.fillRect(0, 0, S, S);

    // Temple veins
    ctx.strokeStyle = '#CC2020';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - headRX + 2, headCY - 2);
    ctx.lineTo(cx - headRX + 6, headCY + 6);
    ctx.lineTo(cx - headRX + 2, headCY + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + headRX - 2, headCY - 2);
    ctx.lineTo(cx + headRX - 6, headCY + 6);
    ctx.lineTo(cx + headRX - 2, headCY + 12);
    ctx.stroke();

    // Steam above head
    ctx.fillStyle = 'rgba(200, 200, 200, 0.25)';
    for (let i = 0; i < 6; i++) {
      const sx = cx + (Math.random() - 0.5) * 50;
      const sy = headCY - headRY - 8 - Math.random() * 16;
      ctx.beginPath();
      ctx.arc(sx, sy, 3 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (expression === 'dead') {
    // Heavy bruises
    ctx.fillStyle = 'rgba(80, 30, 100, 0.4)';
    ctx.beginPath(); ctx.arc(cx - 22, headCY + 4, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 26, headCY + 8, 8, 0, Math.PI * 2); ctx.fill();

    // Crack lines
    ctx.strokeStyle = 'rgba(50, 25, 15, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 14, headCY - 30);
    ctx.lineTo(cx - 8, headCY - 14);
    ctx.lineTo(cx - 12, headCY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 18, headCY - 24);
    ctx.lineTo(cx + 12, headCY - 8);
    ctx.lineTo(cx + 20, headCY + 6);
    ctx.stroke();
  }

  return c;
}
