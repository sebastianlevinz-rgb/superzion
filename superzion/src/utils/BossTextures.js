// ═══════════════════════════════════════════════════════════════
// BossTextures — Level 6: Operation Last Stand textures
// Morning Beirut approach: sky, city, ground, bunker, fighter, projectiles
// ═══════════════════════════════════════════════════════════════

const W = 960;
const H = 540;

// ── Player Fighter (64×64) — top-down fighter jet ─────────────
export function createPlayerFighter(scene) {
  if (scene.textures.exists('player_fighter')) scene.textures.remove('player_fighter');

  const w = 64, h = 64;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  const cx = w / 2, cy = h / 2;

  // Delta wings
  ctx.fillStyle = '#3a6a9f';
  ctx.beginPath();
  ctx.moveTo(cx, 6);           // nose
  ctx.lineTo(cx + 28, 50);     // right wing tip
  ctx.lineTo(cx + 8, 44);      // right wing root
  ctx.lineTo(cx - 8, 44);      // left wing root
  ctx.lineTo(cx - 28, 50);     // left wing tip
  ctx.closePath();
  ctx.fill();

  // Fuselage body
  ctx.fillStyle = '#4a7ab5';
  ctx.beginPath();
  ctx.moveTo(cx, 4);           // pointed nose
  ctx.lineTo(cx + 7, 20);
  ctx.lineTo(cx + 8, 52);
  ctx.lineTo(cx + 4, 58);      // engine rear
  ctx.lineTo(cx - 4, 58);
  ctx.lineTo(cx - 8, 52);
  ctx.lineTo(cx - 7, 20);
  ctx.closePath();
  ctx.fill();

  // Wing edge highlights
  ctx.strokeStyle = '#8ac4ff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 2, 6);
  ctx.lineTo(cx - 28, 50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 2, 6);
  ctx.lineTo(cx + 28, 50);
  ctx.stroke();

  // Cockpit
  ctx.fillStyle = '#b0d8ff';
  ctx.beginPath();
  ctx.ellipse(cx, 18, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gold Star of David (small on fuselage)
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1;
  const sx = cx, sy = 30, sr = 4;
  // Triangle up
  ctx.beginPath();
  ctx.moveTo(sx, sy - sr);
  ctx.lineTo(sx + sr * 0.866, sy + sr * 0.5);
  ctx.lineTo(sx - sr * 0.866, sy + sr * 0.5);
  ctx.closePath();
  ctx.stroke();
  // Triangle down
  ctx.beginPath();
  ctx.moveTo(sx, sy + sr);
  ctx.lineTo(sx + sr * 0.866, sy - sr * 0.5);
  ctx.lineTo(sx - sr * 0.866, sy - sr * 0.5);
  ctx.closePath();
  ctx.stroke();

  // Engine glow at rear
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.ellipse(cx - 3, 58, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 3, 58, 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath();
  ctx.ellipse(cx - 3, 58, 1, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 3, 58, 1, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('player_fighter', c);
}

// ── Bunker Fortress (256×256) — fortified military bunker ─────
export function createBunkerFortress(scene) {
  if (scene.textures.exists('bunker_fortress')) scene.textures.remove('bunker_fortress');

  const w = 256, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  const cx = w / 2, cy = h / 2;

  // ── Main bunker body — thick concrete walls ──
  const bodyGrad = ctx.createLinearGradient(cx - 90, cy - 50, cx + 90, cy + 70);
  bodyGrad.addColorStop(0, '#5a5a5a');
  bodyGrad.addColorStop(0.4, '#4a4a4a');
  bodyGrad.addColorStop(0.7, '#3a3a3a');
  bodyGrad.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 100, cy - 50);
  ctx.lineTo(cx + 100, cy - 50);
  ctx.lineTo(cx + 110, cy - 30);
  ctx.lineTo(cx + 110, cy + 70);
  ctx.lineTo(cx + 100, cy + 80);
  ctx.lineTo(cx - 100, cy + 80);
  ctx.lineTo(cx - 110, cy + 70);
  ctx.lineTo(cx - 110, cy - 30);
  ctx.closePath();
  ctx.fill();

  // Outer concrete border
  ctx.strokeStyle = '#6a6a6a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Reinforced layers (horizontal concrete bands) ──
  ctx.fillStyle = '#4a4a50';
  ctx.fillRect(cx - 108, cy - 28, 216, 6);
  ctx.fillRect(cx - 108, cy + 10, 216, 6);
  ctx.fillRect(cx - 108, cy + 45, 216, 6);

  // ── Reinforced steel door (center) ──
  ctx.fillStyle = '#4a4a55';
  ctx.fillRect(cx - 20, cy + 30, 40, 50);
  ctx.strokeStyle = '#3a3a40';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 20, cy + 30, 40, 50);
  // Door rivets
  ctx.fillStyle = '#5a5a60';
  ctx.beginPath(); ctx.arc(cx - 12, cy + 42, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 12, cy + 42, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 12, cy + 66, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 12, cy + 66, 2, 0, Math.PI * 2); ctx.fill();
  // Door handle
  ctx.fillStyle = '#666670';
  ctx.fillRect(cx + 6, cy + 52, 8, 4);

  // ── SAM launcher on roof (angled tube pointing left) ──
  ctx.fillStyle = '#3a4a3a';
  ctx.save();
  ctx.translate(cx + 30, cy - 55);
  ctx.rotate(-0.5); // angled left
  ctx.fillRect(-4, -20, 8, 24);
  // SAM tube
  ctx.fillStyle = '#555';
  ctx.fillRect(-3, -22, 6, 6);
  ctx.restore();

  // Second SAM mount
  ctx.fillStyle = '#3a4a3a';
  ctx.save();
  ctx.translate(cx - 20, cy - 55);
  ctx.rotate(-0.4);
  ctx.fillRect(-3, -16, 6, 20);
  ctx.fillStyle = '#555';
  ctx.fillRect(-2, -18, 4, 5);
  ctx.restore();

  // ── Radar dish on top ──
  ctx.fillStyle = '#555560';
  ctx.fillRect(cx - 2, cy - 80, 4, 25);
  // Dish
  ctx.fillStyle = '#6a6a72';
  ctx.beginPath();
  ctx.arc(cx, cy - 82, 12, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Dish arm
  ctx.fillStyle = '#777';
  ctx.fillRect(cx - 1, cy - 94, 2, 12);

  // ── Antenna array ──
  ctx.fillStyle = '#555';
  ctx.fillRect(cx + 50, cy - 70, 2, 22);
  ctx.fillRect(cx + 46, cy - 68, 10, 2);
  ctx.fillRect(cx + 46, cy - 60, 10, 2);
  // Antenna tip light
  ctx.fillStyle = '#ff4444';
  ctx.beginPath(); ctx.arc(cx + 51, cy - 72, 2, 0, Math.PI * 2); ctx.fill();

  // ── Gun ports (dark slits with red interior glow) ──
  const gunPorts = [
    [cx - 108, cy - 15, 14, 6],
    [cx - 108, cy + 20, 14, 6],
    [cx + 94, cy - 15, 14, 6],
    [cx + 94, cy + 20, 14, 6],
    [cx - 108, cy + 55, 14, 6],
    [cx + 94, cy + 55, 14, 6],
  ];
  for (const [gx, gy, gw, gh] of gunPorts) {
    // Dark slit
    ctx.fillStyle = '#111118';
    ctx.fillRect(gx, gy, gw, gh);
    // Red interior glow
    ctx.fillStyle = 'rgba(255, 50, 20, 0.5)';
    ctx.fillRect(gx + 2, gy + 1, gw - 4, gh - 2);
    // Muzzle glow
    ctx.fillStyle = 'rgba(255, 100, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(gx < cx ? gx : gx + gw, gy + gh / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Sandbag positions at base ──
  ctx.fillStyle = '#6a6040';
  for (let sx = cx - 95; sx < cx - 25; sx += 18) {
    // Row of sandbags
    ctx.beginPath();
    ctx.ellipse(sx + 9, cy + 82, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let sx = cx + 25; sx < cx + 95; sx += 18) {
    ctx.beginPath();
    ctx.ellipse(sx + 9, cy + 82, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Second row (stacked)
  ctx.fillStyle = '#5a5035';
  for (let sx = cx - 90; sx < cx - 30; sx += 18) {
    ctx.beginPath();
    ctx.ellipse(sx + 12, cy + 76, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let sx = cx + 30; sx < cx + 90; sx += 18) {
    ctx.beginPath();
    ctx.ellipse(sx + 6, cy + 76, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Camouflage netting hints (olive green patches) ──
  ctx.fillStyle = 'rgba(60, 80, 40, 0.35)';
  ctx.fillRect(cx - 80, cy - 48, 40, 20);
  ctx.fillRect(cx + 40, cy - 48, 35, 18);
  ctx.fillStyle = 'rgba(50, 70, 35, 0.25)';
  ctx.fillRect(cx - 60, cy - 20, 50, 15);

  // ── Red warning lights ──
  ctx.fillStyle = '#ff2222';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(cx - 90, cy - 45, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 90, cy - 45, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy - 52, 3, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // ── Surface detail — rivet lines ──
  ctx.strokeStyle = '#2a2a30';
  ctx.lineWidth = 1;
  // Vertical panel seams
  ctx.beginPath(); ctx.moveTo(cx - 40, cy - 48); ctx.lineTo(cx - 40, cy + 78); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 40, cy - 48); ctx.lineTo(cx + 40, cy + 78); ctx.stroke();

  // ── Corner bolts ──
  ctx.fillStyle = '#7a7a82';
  const boltPositions = [
    [cx - 95, cy - 45], [cx + 95, cy - 45],
    [cx - 95, cy + 70], [cx + 95, cy + 70],
    [cx - 40, cy - 45], [cx + 40, cy - 45],
    [cx - 40, cy + 70], [cx + 40, cy + 70],
  ];
  for (const [bx, by] of boltPositions) {
    ctx.beginPath();
    ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Edge highlights ──
  ctx.strokeStyle = 'rgba(140, 140, 140, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 100, cy - 50);
  ctx.lineTo(cx + 100, cy - 50);
  ctx.lineTo(cx + 110, cy - 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 100, cy - 50);
  ctx.lineTo(cx - 110, cy - 30);
  ctx.stroke();

  scene.textures.addCanvas('bunker_fortress', c);
}

// ── Beirut Morning Sky (960×540) — sunrise gradient ───────────
export function createBeirutMorningSky(scene) {
  if (scene.textures.exists('beirut_sky')) scene.textures.remove('beirut_sky');

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Sunrise gradient: deep blue-purple top → orange-gold horizon
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#1a1a3a');
  skyGrad.addColorStop(0.3, '#2a2a5a');
  skyGrad.addColorStop(0.55, '#5a3a5a');
  skyGrad.addColorStop(0.75, '#ff8844');
  skyGrad.addColorStop(0.9, '#ffcc66');
  skyGrad.addColorStop(1, '#ffddaa');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Sun glow near right-center horizon
  const sunX = W * 0.65, sunY = H * 0.78;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
  sunGrad.addColorStop(0, 'rgba(255, 240, 180, 0.9)');
  sunGrad.addColorStop(0.2, 'rgba(255, 220, 120, 0.6)');
  sunGrad.addColorStop(0.5, 'rgba(255, 180, 80, 0.3)');
  sunGrad.addColorStop(1, 'rgba(255, 150, 60, 0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, W, H);

  // Sun disc
  ctx.fillStyle = 'rgba(255, 250, 200, 0.95)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 230, 1)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 10, 0, Math.PI * 2);
  ctx.fill();

  // Thin clouds with warm light
  ctx.fillStyle = 'rgba(255, 221, 170, 0.15)';
  // Cloud 1
  ctx.beginPath();
  ctx.ellipse(200, 100, 80, 12, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Cloud 2
  ctx.beginPath();
  ctx.ellipse(600, 150, 60, 8, -0.05, 0, Math.PI * 2);
  ctx.fill();
  // Cloud 3
  ctx.beginPath();
  ctx.ellipse(800, 80, 50, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloud 4
  ctx.fillStyle = 'rgba(255, 200, 150, 0.12)';
  ctx.beginPath();
  ctx.ellipse(400, 200, 70, 10, 0.08, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('beirut_sky', c);
}

// ── Beirut City Layer (960×150) — building silhouettes ────────
export function createBeirutCityLayer(scene) {
  if (scene.textures.exists('beirut_city')) scene.textures.remove('beirut_city');

  const w = 960, h = 150;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  const baseY = h - 10;

  // Building silhouettes — dark against sunrise
  ctx.fillStyle = '#1a1a22';

  // Modern buildings (rectangles of varying height)
  const buildings = [
    [10, 50, 40], [55, 70, 30], [90, 90, 35], [130, 60, 25],
    [160, 110, 30], [200, 45, 20], [225, 80, 35], [265, 55, 28],
    [300, 95, 32], [340, 40, 20], [365, 75, 30], [400, 100, 40],
    [445, 60, 25], [475, 85, 35], [515, 50, 22], [542, 70, 30],
    [580, 105, 38], [625, 45, 20], [650, 80, 32], [690, 65, 28],
    [725, 95, 35], [765, 50, 24], [795, 75, 30], [830, 55, 26],
    [860, 90, 34], [900, 60, 28], [932, 70, 28],
  ];

  for (const [bx, bh, bw] of buildings) {
    ctx.fillRect(bx, baseY - bh, bw, bh);
  }

  // Minarets (thin towers with domes)
  const minarets = [
    [185, 120], [490, 100], [750, 110], [920, 95],
  ];
  for (const [mx, mh] of minarets) {
    // Tower
    ctx.fillRect(mx - 3, baseY - mh, 6, mh);
    // Dome
    ctx.beginPath();
    ctx.arc(mx, baseY - mh, 6, Math.PI, Math.PI * 2);
    ctx.fill();
    // Spire
    ctx.fillRect(mx - 1, baseY - mh - 10, 2, 10);
    // Crescent hint
    ctx.beginPath();
    ctx.arc(mx, baseY - mh - 12, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Warm window lights (orange/yellow dots scattered)
  const windowColors = ['#ffaa44', '#ffcc66', '#ff9933', '#ffdd88'];
  for (const [bx, bh, bw] of buildings) {
    if (bh < 50) continue;
    const cols = Math.floor(bw / 8);
    const rows = Math.floor(bh / 12);
    for (let wy = 0; wy < rows; wy++) {
      for (let wx = 0; wx < cols; wx++) {
        if (Math.random() > 0.3) continue; // sparse windows
        ctx.fillStyle = windowColors[Math.floor(Math.random() * windowColors.length)];
        ctx.fillRect(bx + 3 + wx * 8, baseY - bh + 6 + wy * 12, 3, 4);
      }
    }
  }

  scene.textures.addCanvas('beirut_city', c);
}

// ── Beirut Ground Layer (960×120) — sandy terrain ─────────────
export function createBeirutGroundLayer(scene) {
  if (scene.textures.exists('beirut_ground')) scene.textures.remove('beirut_ground');

  const w = 960, h = 120;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Sandy terrain gradient
  const groundGrad = ctx.createLinearGradient(0, 0, 0, h);
  groundGrad.addColorStop(0, '#8a7a60');
  groundGrad.addColorStop(0.4, '#7a6a50');
  groundGrad.addColorStop(1, '#6a5a40');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 0, w, h);

  // Sandy texture noise
  for (let i = 0; i < 600; i++) {
    const nx = Math.random() * w;
    const ny = Math.random() * h;
    ctx.fillStyle = `rgba(${140 + Math.random() * 30}, ${120 + Math.random() * 30}, ${80 + Math.random() * 20}, 0.3)`;
    ctx.fillRect(nx, ny, 2, 1);
  }

  // Road lines
  ctx.fillStyle = '#555045';
  ctx.fillRect(0, 25, w, 16);
  // Center dashes
  ctx.fillStyle = '#999070';
  for (let dx = 0; dx < w; dx += 40) {
    ctx.fillRect(dx, 32, 20, 2);
  }

  // Vegetation patches (dark green)
  ctx.fillStyle = '#2a4020';
  const vegPatches = [50, 180, 340, 500, 620, 780, 890];
  for (const vx of vegPatches) {
    const vw = 15 + Math.random() * 20;
    ctx.beginPath();
    ctx.ellipse(vx, 60 + Math.random() * 30, vw / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Darker green tufts
  ctx.fillStyle = '#1a3015';
  for (let i = 0; i < 10; i++) {
    const tx = Math.random() * w;
    ctx.beginPath();
    ctx.ellipse(tx, 55 + Math.random() * 40, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Military checkpoint structures (small dark rectangles)
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(300, 50, 20, 12);
  ctx.fillRect(300, 62, 4, 25);
  ctx.fillRect(700, 55, 18, 10);
  ctx.fillRect(700, 65, 3, 20);
  // Barrier poles
  ctx.fillStyle = '#aa3333';
  ctx.fillRect(320, 46, 2, 20);
  ctx.fillRect(718, 50, 2, 18);

  scene.textures.addCanvas('beirut_ground', c);
}

// ── SAM Missile (12×4) — white body, red nose, fins ───────────
export function createSAMMissile(scene) {
  if (scene.textures.exists('sam_missile')) scene.textures.remove('sam_missile');

  const w = 12, h = 4;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // White body
  ctx.fillStyle = '#dddddd';
  ctx.fillRect(2, 0, 8, h);

  // Red nose
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(0, 0, 3, h);

  // Small fins
  ctx.fillStyle = '#bbbbbb';
  ctx.fillRect(9, -1, 3, 1);
  ctx.fillRect(9, h, 3, 1);

  // Exhaust glow at rear
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.arc(11, h / 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(11, h / 2, 1, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('sam_missile', c);
}

// ── Bunker Silhouette (200×150) — for cinematic ───────────────
export function createBunkerSilhouette(scene) {
  if (scene.textures.exists('bunker_silhouette')) scene.textures.remove('bunker_silhouette');

  const w = 200, h = 150;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  const cx = w / 2, cy = h / 2 + 10;

  // Black silhouette bunker body
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(cx - 70, cy - 30);
  ctx.lineTo(cx + 70, cy - 30);
  ctx.lineTo(cx + 78, cy - 15);
  ctx.lineTo(cx + 78, cy + 40);
  ctx.lineTo(cx + 70, cy + 48);
  ctx.lineTo(cx - 70, cy + 48);
  ctx.lineTo(cx - 78, cy + 40);
  ctx.lineTo(cx - 78, cy - 15);
  ctx.closePath();
  ctx.fill();

  // Radar dish silhouette
  ctx.fillRect(cx - 2, cy - 55, 4, 26);
  ctx.beginPath();
  ctx.arc(cx, cy - 56, 10, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 1, cy - 66, 2, 10);

  // SAM launcher silhouettes
  ctx.save();
  ctx.translate(cx + 25, cy - 32);
  ctx.rotate(-0.5);
  ctx.fillRect(-3, -14, 6, 18);
  ctx.restore();
  ctx.save();
  ctx.translate(cx - 15, cy - 32);
  ctx.rotate(-0.4);
  ctx.fillRect(-2, -12, 5, 16);
  ctx.restore();

  // Gun port slits
  ctx.fillRect(cx - 76, cy - 8, 10, 4);
  ctx.fillRect(cx + 66, cy - 8, 10, 4);
  ctx.fillRect(cx - 76, cy + 14, 10, 4);
  ctx.fillRect(cx + 66, cy + 14, 10, 4);

  // Red warning light glow
  ctx.fillStyle = '#ff2222';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(cx - 60, cy - 26, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 60, cy - 26, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy - 32, 3, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Antenna tip
  ctx.fillStyle = '#ff4444';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(cx + 40, cy - 42, 2, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  scene.textures.addCanvas('bunker_silhouette', c);
}

// ── Player Bullet (8×16) — cyan elongated projectile ──────────
export function createBullet(scene) {
  if (scene.textures.exists('player_bullet')) scene.textures.remove('player_bullet');

  const w = 8, h = 16;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Shadow glow
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 4;

  // Outer glow
  ctx.fillStyle = '#005577';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main bullet body
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 3, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // White core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 1.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  scene.textures.addCanvas('player_bullet', c);
}

// ── Boss Bullet (10×10) — red circle projectile ───────────────
export function createBossBullet(scene) {
  if (scene.textures.exists('boss_bullet')) scene.textures.remove('boss_bullet');

  const w = 10, h = 10;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Shadow glow
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 6;

  // Orange edge
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Red center
  ctx.fillStyle = '#ff2222';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Bright core
  ctx.fillStyle = '#ff8844';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  scene.textures.addCanvas('boss_bullet', c);
}
