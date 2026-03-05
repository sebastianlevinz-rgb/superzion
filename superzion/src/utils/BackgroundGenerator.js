// ═══════════════════════════════════════════════════════════════
// Operation Tehran — Background layers (DAY SCENE)
// Blue sky, sun, Alborz mountains, clouds, Tehran skyline
// with daytime windows, Persian facades with warm tones
// ═══════════════════════════════════════════════════════════════

const SKY_W = 960;
const SKY_H = 540;
const BG_W = 2880; // 3x screen width for tileSprite

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// ── DAY SKY GRADIENT ──────────────────────────────────────────
export function createSkyGradient(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = SKY_W;
  canvas.height = SKY_H;
  const ctx = canvas.getContext('2d');

  const skyColors = [
    '#4A90D9', '#5198DD', '#5CA0E0', '#68A8E3', '#74B0E6',
    '#80B8E9', '#87CEEB', '#90D2ED', '#99D6EF', '#A2DAF1',
    '#ABDEF3', '#B0E9F6',
  ];
  for (let y = 0; y < SKY_H; y++) {
    const t = y / SKY_H;
    const idx = t * (skyColors.length - 1);
    const ci = Math.floor(idx);
    const frac = idx - ci;
    const c1 = skyColors[Math.min(ci, skyColors.length - 1)];
    const c2 = skyColors[Math.min(ci + 1, skyColors.length - 1)];
    for (let x = 0; x < SKY_W; x++) {
      const pick = frac > 0.5 ? c2 : ((x + y) % 2 === 0 && frac > 0.2) ? c2 : c1;
      px(ctx, x, y, pick);
    }
  }

  // No stars in daytime

  scene.textures.addCanvas('sky_gradient', canvas);
}

// ── SUN (replaces moon) ─────────────────────────────────────
export function createSun(scene) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2;
  const r = 14;

  // Warm glow rings
  const glowColors = [
    'rgba(255,220,100,0.03)',
    'rgba(255,210,80,0.06)',
    'rgba(255,200,60,0.10)',
    'rgba(255,190,40,0.15)',
  ];
  for (let g = glowColors.length - 1; g >= 0; g--) {
    ctx.fillStyle = glowColors[g];
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6 + g * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sun surface — golden yellow
  const rng = seededRandom(888);
  const sunPal = ['#FFD700', '#FFCC00', '#FFE040', '#FFC820', '#FFE860', '#FFFFFF'];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const dist = Math.sqrt(dx * dx + dy * dy) / r;
        const noise = rng();
        let ci;
        if (dist < 0.3) ci = noise > 0.5 ? 5 : 4;
        else if (dist < 0.6) ci = noise > 0.5 ? 0 : 3;
        else if (dist < 0.85) ci = noise > 0.5 ? 1 : 0;
        else ci = noise > 0.5 ? 2 : 1;
        px(ctx, cx + dx, cy + dy, sunPal[ci]);
      }
    }
  }

  // No craters on the sun

  scene.textures.addCanvas('sun', canvas);
}

// ── ALBORZ MOUNTAINS (warm brown daytime) ────────────────────
export function createMountainLayer(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = BG_W;
  canvas.height = SKY_H;
  const ctx = canvas.getContext('2d');
  const rng = seededRandom(9999);

  const rockDk = '#7A6B55';
  const rockMd = '#9A8A70';
  const rockLt = '#B8A888';
  const snow = '#F0F0F0';
  const snowBright = '#FFFFFF';

  const points = [];
  const segW = 60;
  for (let i = 0; i <= BG_W / segW + 1; i++) {
    const baseH = 180 + rng() * 120;
    const peak = (i % 5 === 2 || i % 7 === 3) ? 60 + rng() * 40 : 0;
    points.push(baseH + peak);
  }

  for (let x = 0; x < BG_W; x++) {
    const seg = x / segW;
    const si = Math.floor(seg);
    const frac = seg - si;
    const h1 = points[Math.min(si, points.length - 1)];
    const h2 = points[Math.min(si + 1, points.length - 1)];
    const t = frac * frac * (3 - 2 * frac);
    const height = h1 + (h2 - h1) * t;
    const mountTop = SKY_H - height;

    for (let y = Math.floor(mountTop); y < SKY_H; y++) {
      if (y < 0) continue;
      const depth = (y - mountTop) / height;
      let color;
      if (depth < 0.08) color = snowBright;
      else if (depth < 0.15) color = snow;
      else if (depth < 0.4) color = rockLt;
      else if (depth < 0.7) color = rockMd;
      else color = rockDk;

      const n = rng();
      if (n > 0.92 && depth > 0.1) color = rockDk;
      else if (n > 0.85 && depth < 0.2) color = snow;

      px(ctx, x, y, color);
    }
  }

  // Second range (further back, slightly muted)
  const points2 = [];
  for (let i = 0; i <= BG_W / segW + 1; i++) {
    points2.push(130 + rng() * 80);
  }
  for (let x = 0; x < BG_W; x++) {
    const seg = x / segW;
    const si = Math.floor(seg);
    const frac = seg - si;
    const h1 = points2[Math.min(si, points2.length - 1)];
    const h2 = points2[Math.min(si + 1, points2.length - 1)];
    const t = frac * frac * (3 - 2 * frac);
    const height = h1 + (h2 - h1) * t;
    const mountTop = SKY_H - height;

    for (let y = Math.max(0, Math.floor(mountTop)); y < SKY_H; y++) {
      const depth = (y - mountTop) / height;
      if (depth > 0.6) break;
      const n = rng();
      let color = '#8A7A68';
      if (depth < 0.1) color = n > 0.3 ? '#E0E0E0' : '#D0D0D0';
      else if (depth < 0.3) color = '#A09080';
      const imgData = ctx.getImageData(x, y, 1, 1).data;
      if (imgData[3] === 0) {
        px(ctx, x, y, color);
      }
    }
  }

  scene.textures.addCanvas('mountains', canvas);
}

// ── CLOUD LAYER (bright white daytime clouds) ─────────────────
export function createCloudLayer(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = BG_W;
  canvas.height = SKY_H;
  const ctx = canvas.getContext('2d');

  const rng = seededRandom(54321);

  const cloudTop = [
    'rgba(255,255,255,0.80)',
    'rgba(250,250,255,0.70)',
    'rgba(245,248,255,0.60)',
  ];
  const cloudMid = [
    'rgba(240,245,255,0.55)',
    'rgba(235,240,250,0.50)',
  ];
  const cloudBot = [
    'rgba(220,230,245,0.50)',
    'rgba(210,220,240,0.45)',
  ];

  for (let c = 0; c < 10; c++) {
    const baseX = Math.floor(rng() * BG_W);
    const baseY = 30 + Math.floor(rng() * (SKY_H * 0.3));
    const cloudW = 50 + Math.floor(rng() * 100);
    const cloudH = 15 + Math.floor(rng() * 25);

    for (let blob = 0; blob < 6; blob++) {
      const bx = baseX + Math.floor(rng() * cloudW) - cloudW / 2;
      const by = baseY + Math.floor(rng() * cloudH) - cloudH / 2;
      const bw = 20 + Math.floor(rng() * 35);
      const bh = 8 + Math.floor(rng() * 12);

      for (let dy = -bh; dy <= bh; dy++) {
        for (let dx = -bw; dx <= bw; dx++) {
          const dist = (dx * dx) / (bw * bw) + (dy * dy) / (bh * bh);
          if (dist < 1) {
            const px2 = bx + dx;
            const py2 = by + dy;
            if (px2 >= 0 && px2 < canvas.width && py2 >= 0 && py2 < canvas.height) {
              const vertPos = (dy + bh) / (bh * 2);
              let colors;
              if (vertPos < 0.3) colors = cloudTop;
              else if (vertPos < 0.7) colors = cloudMid;
              else colors = cloudBot;

              const edgeFade = dist > 0.6 ? 0.5 : 1;
              if (edgeFade < 1 && (dx + dy) % 2 !== 0) continue;

              const ci = Math.floor(rng() * colors.length);
              ctx.fillStyle = colors[ci];
              ctx.fillRect(px2, py2, 1, 1);
            }
          }
        }
      }
    }
  }

  scene.textures.addCanvas('clouds', canvas);
}

// ── TEHRAN SKYLINE (beige/sand buildings with dark windows) ───
export function createSkylineLayer(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = BG_W;
  canvas.height = SKY_H;
  const ctx = canvas.getContext('2d');
  const rng = seededRandom(12345);

  const bldgDk = '#C8B898';
  const bldgMd = '#D8C8A8';
  const bldgLt = '#E8D8C0';
  const bldgEdge = '#B8A888';
  const turq = '#00AAAA';
  const turqLt = '#00CCCC';
  const gold = '#C09020';
  const goldLt = '#D0A030';

  // Window colors — dark (daytime interior)
  const winDark = ['rgba(40,30,20,0.7)', 'rgba(50,40,30,0.6)', 'rgba(35,25,15,0.5)'];
  const winFrame = '#A09070';

  function drawBuilding(bx, bw, bh) {
    const by = SKY_H - bh;
    pxRect(ctx, bx, by, bw, bh, bldgMd);
    pxRect(ctx, bx, by, bw, 2, bldgLt);
    pxRect(ctx, bx, by, 2, bh, bldgEdge);
    pxRect(ctx, bx + bw - 2, by, 2, bh, bldgEdge);
    // Windows — dark interior during day
    for (let wy = by + 6; wy < SKY_H - 8; wy += 10) {
      for (let wx = bx + 4; wx < bx + bw - 4; wx += 7) {
        const darkColor = winDark[Math.floor(rng() * winDark.length)];
        ctx.fillStyle = darkColor;
        ctx.fillRect(wx, wy, 3, 4);
        // Window frame
        pxRect(ctx, wx - 1, wy - 1, 5, 1, winFrame);
      }
    }
  }

  function drawDome(dx, dy, r, color, accent) {
    for (let a = 0; a < Math.PI; a += 0.02) {
      const x = dx + Math.cos(a + Math.PI) * r;
      const y = dy - Math.sin(a) * r * 1.3;
      pxRect(ctx, x - 1, y, 3, 1, color);
    }
    for (let row = 0; row < r * 1.3; row++) {
      const w = Math.sqrt(1 - (row / (r * 1.3)) ** 2) * r;
      const y = dy - row;
      pxRect(ctx, dx - w, y, w * 2, 1, row < r * 0.3 ? accent : color);
    }
  }

  function drawMinaret(mx, my, h) {
    pxRect(ctx, mx - 2, my - h, 4, h, bldgLt);
    pxRect(ctx, mx - 1, my - h, 1, h, bldgMd);
    pxRect(ctx, mx - 4, my - h * 0.6, 8, 3, bldgEdge);
    pxRect(ctx, mx - 4, my - h * 0.6, 8, 1, bldgLt);
    pxRect(ctx, mx - 1, my - h - 6, 2, 8, gold);
    px(ctx, mx, my - h - 7, goldLt);
  }

  for (let x = 0; x < BG_W; x += 30 + Math.floor(rng() * 40)) {
    const bw = 20 + Math.floor(rng() * 30);
    const bh = 40 + Math.floor(rng() * 60);
    drawBuilding(x, bw, bh);
  }

  // Azadi Tower
  const azX = 600;
  const azBase = SKY_H - 60;
  for (let i = 0; i < 30; i++) {
    const spread = 20 - i * 0.4;
    pxRect(ctx, azX - spread - 4, azBase - i * 2, 8, 2, bldgLt);
    pxRect(ctx, azX + spread - 4, azBase - i * 2, 8, 2, bldgLt);
  }
  for (let a = 0; a < Math.PI; a += 0.03) {
    const ax = azX + Math.cos(a + Math.PI) * 18;
    const ay = azBase - 30 - Math.sin(a) * 15;
    pxRect(ctx, ax, ay, 2, 2, bldgLt);
  }
  pxRect(ctx, azX - 10, azBase - 70, 20, 12, bldgLt);
  pxRect(ctx, azX - 8, azBase - 78, 16, 10, bldgMd);
  pxRect(ctx, azX - 6, azBase - 84, 12, 8, bldgLt);
  pxRect(ctx, azX - 3, azBase - 90, 6, 8, bldgMd);
  for (let i = 0; i < 8; i++) {
    pxRect(ctx, azX - 3 + i * 0.3, azBase - 90 - i, Math.max(1, 6 - i * 0.6), 1, bldgLt);
  }

  // Milad Tower
  const mlX = 1400;
  const mlBase = SKY_H - 50;
  pxRect(ctx, mlX - 2, mlBase - 140, 4, 140, '#B0A090');
  pxRect(ctx, mlX - 1, mlBase - 140, 1, 140, '#C0B0A0');
  for (let r = 12; r > 0; r--) {
    const col = r > 8 ? '#C8B8A8' : r > 4 ? '#D8C8B8' : '#E8D8C8';
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const x = mlX + Math.cos(a) * r;
      const y = mlBase - 100 + Math.sin(a) * r * 0.5;
      px(ctx, x, y, col);
    }
  }
  pxRect(ctx, mlX - 1, mlBase - 170, 2, 30, '#A09080');
  px(ctx, mlX, mlBase - 172, '#ff2020');

  // Mosque domes
  const mosquePositions = [200, 900, 1800, 2400];
  for (const mpos of mosquePositions) {
    const mbase = SKY_H - 50 - Math.floor(rng() * 30);
    pxRect(ctx, mpos - 25, mbase, 50, 40, bldgMd);
    pxRect(ctx, mpos - 25, mbase, 50, 2, bldgLt);
    drawDome(mpos, mbase, 18, turq, turqLt);
    pxRect(ctx, mpos - 1, mbase - 26, 2, 5, gold);
    px(ctx, mpos, mbase - 28, goldLt);
    drawMinaret(mpos - 22, mbase, 50);
    drawMinaret(mpos + 22, mbase, 50);
  }

  const minaretPositions = [400, 1100, 1600, 2100, 2650];
  for (const mp of minaretPositions) {
    drawMinaret(mp, SKY_H - 50, 40 + Math.floor(rng() * 20));
  }

  scene.textures.addCanvas('skyline', canvas);
}

// ── PERSIAN FACADES (cream walls, visible wood, bright rugs) ──
export function createFacadeLayer(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = BG_W;
  canvas.height = SKY_H;
  const ctx = canvas.getContext('2d');
  const rng = seededRandom(67890);

  const wall = '#E8D8C0';
  const wallDk = '#D0C0A8';
  const wallLt = '#F0E8D8';
  const turq = '#00AAAA';
  const turqDk = '#008888';
  const wood = '#8A6A3A';
  const woodDk = '#6A4A2A';
  const rug = ['#AA2020', '#CC3030', '#882828', '#BB6630'];
  const lantern = '#A08020';

  const facadeBase = SKY_H - 20;

  for (let fx = 0; fx < BG_W; fx += 60 + Math.floor(rng() * 40)) {
    const fw = 50 + Math.floor(rng() * 30);
    const fh = 80 + Math.floor(rng() * 50);
    const fy = facadeBase - fh;

    pxRect(ctx, fx, fy, fw, fh + 20, wall);
    pxRect(ctx, fx, fy, fw, 2, wallLt);
    pxRect(ctx, fx, fy, 2, fh + 20, wallDk);
    pxRect(ctx, fx + fw - 2, fy, 2, fh + 20, wallDk);

    // Arched windows — dark interior during day
    const numWindows = 2 + Math.floor(rng() * 2);
    const winSpacing = fw / (numWindows + 1);
    for (let w = 0; w < numWindows; w++) {
      const wx = fx + winSpacing * (w + 1) - 5;
      const wy = fy + 12 + Math.floor(rng() * 10);

      // Dark window interior
      pxRect(ctx, wx, wy, 10, 14, '#2A2018');

      // Arch top
      for (let a = 0; a < Math.PI; a += 0.1) {
        const ax = wx + 5 + Math.cos(a + Math.PI) * 5;
        const ay = wy - Math.sin(a) * 5;
        px(ctx, ax, ay, '#2A2018');
      }
      // Turquoise tile border
      for (let i = 0; i < 16; i++) {
        const bx = wx - 1 + (i < 4 ? 0 : i < 8 ? 11 : (i - 8) * 1.3);
        const by = i < 4 ? wy + i * 3.5 : i < 8 ? wy + (i - 4) * 3.5 : wy - 2;
        pxRect(ctx, bx, by, 1, 2, i % 2 === 0 ? turq : turqDk);
      }
    }

    // Turquoise tile band
    const bandY = fy + fh * 0.5;
    for (let bx = fx + 2; bx < fx + fw - 2; bx += 4) {
      const t = rng();
      pxRect(ctx, bx, bandY, 3, 3, t > 0.5 ? turq : turqDk);
      pxRect(ctx, bx + 1, bandY + 1, 1, 1, wallLt);
    }

    // Balcony with rug
    if (rng() > 0.4) {
      const balY = fy + 35 + Math.floor(rng() * 15);
      const balW = 14 + Math.floor(rng() * 6);
      const balX = fx + fw / 2 - balW / 2;
      pxRect(ctx, balX, balY, balW, 2, wood);
      pxRect(ctx, balX, balY - 10, 2, 10, wood);
      pxRect(ctx, balX + balW - 2, balY - 10, 2, 10, wood);
      const rugColor = rug[Math.floor(rng() * rug.length)];
      pxRect(ctx, balX + 1, balY + 2, balW - 2, 8, rugColor);
      for (let i = 0; i < balW - 2; i += 2) {
        px(ctx, balX + 1 + i, balY + 10, '#C09020');
      }
      pxRect(ctx, balX + 3, balY + 4, balW - 6, 1, '#C09020');
      pxRect(ctx, balX + 3, balY + 7, balW - 6, 1, '#C09020');
    }

    // Farsi-like sign
    if (rng() > 0.5) {
      const signY = fy + fh - 20;
      const signW = 16 + Math.floor(rng() * 10);
      const signX = fx + fw / 2 - signW / 2;
      pxRect(ctx, signX, signY, signW, 8, '#F0E8D8');
      pxRect(ctx, signX, signY, signW, 1, wallDk);
      pxRect(ctx, signX, signY + 7, signW, 1, wallDk);
      for (let i = 0; i < signW - 4; i += 3) {
        pxRect(ctx, signX + 2 + i, signY + 2, 2, 1, '#555555');
        if (rng() > 0.3) px(ctx, signX + 2 + i, signY + 4, '#555555');
        if (rng() > 0.5) pxRect(ctx, signX + 2 + i, signY + 3, 1, 2, '#555555');
      }
    }

    // Hanging lantern with reduced glow (daytime)
    if (rng() > 0.6) {
      const lx = fx + 4 + Math.floor(rng() * (fw - 8));
      const ly = fy - 2;
      for (let i = 0; i < 6; i++) {
        px(ctx, lx, ly + i, '#888888');
      }
      pxRect(ctx, lx - 2, ly + 6, 4, 6, lantern);
      pxRect(ctx, lx - 1, ly + 7, 2, 4, '#cc9020');
      pxRect(ctx, lx - 2, ly + 12, 4, 1, woodDk);
      px(ctx, lx - 1, ly + 5, lantern);
      px(ctx, lx, ly + 5, lantern);
      // Reduced glow (daytime — barely visible)
      ctx.fillStyle = 'rgba(255,180,60,0.02)';
      ctx.fillRect(lx - 6, ly + 2, 12, 14);
    }
  }

  scene.textures.addCanvas('facades', canvas);
}
