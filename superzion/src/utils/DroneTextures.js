// ═══════════════════════════════════════════════════════════════
// DroneTextures — Level 4: Operation Underground textures
// Top-down drone, desert terrain, tunnel tiles, command room
// ═══════════════════════════════════════════════════════════════

const W = 960;
const H = 540;
const TILE = 40; // tunnel tile size

// ── Drone top-view sprite (64×64) ────────────────────────────
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

// ── Desert terrain (960×540) — Gaza aerial view ──────────────
export function createDesertTerrain(scene) {
  if (scene.textures.exists('desert_terrain')) return;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Sandy base
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#c4a060');
  grad.addColorStop(0.3, '#b89050');
  grad.addColorStop(0.6, '#a88040');
  grad.addColorStop(1, '#c0a058');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Sand texture (noise dots)
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const bright = 0.8 + Math.random() * 0.4;
    ctx.fillStyle = `rgba(${Math.floor(180 * bright)},${Math.floor(150 * bright)},${Math.floor(80 * bright)},0.3)`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1);
  }

  // Dirt roads (lighter tan lines)
  ctx.strokeStyle = 'rgba(200,180,130,0.4)';
  ctx.lineWidth = 4;
  // Horizontal road
  ctx.beginPath();
  ctx.moveTo(0, 200);
  for (let x = 0; x < W; x += 50) {
    ctx.lineTo(x, 200 + Math.sin(x * 0.005) * 15);
  }
  ctx.stroke();
  // Vertical road
  ctx.beginPath();
  ctx.moveTo(500, 0);
  for (let y = 0; y < H; y += 50) {
    ctx.lineTo(500 + Math.sin(y * 0.008) * 10, y);
  }
  ctx.stroke();

  // Building clusters (urban blocks)
  const clusters = [
    { x: 100, y: 80, count: 12 },
    { x: 600, y: 120, count: 15 },
    { x: 300, y: 350, count: 10 },
    { x: 750, y: 400, count: 8 },
    { x: 150, y: 450, count: 6 },
  ];
  for (const cl of clusters) {
    for (let i = 0; i < cl.count; i++) {
      const bx = cl.x + (Math.random() - 0.5) * 80;
      const by = cl.y + (Math.random() - 0.5) * 60;
      const bw = 8 + Math.random() * 16;
      const bh = 8 + Math.random() * 16;
      ctx.fillStyle = `hsl(${30 + Math.random() * 15}, ${20 + Math.random() * 10}%, ${45 + Math.random() * 15}%)`;
      ctx.fillRect(bx, by, bw, bh);
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(bx + 2, by + 2, bw, bh);
    }
  }

  // Tunnel entrance markers (dark spots — these are the recon targets)
  const entrances = [
    { x: 200, y: 160 }, { x: 480, y: 280 }, { x: 700, y: 200 },
    { x: 350, y: 420 }, { x: 820, y: 350 },
  ];
  for (const e of entrances) {
    ctx.fillStyle = 'rgba(40,35,25,0.6)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y, 12, 8, Math.random() * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Camouflage netting
    ctx.fillStyle = 'rgba(60,80,40,0.3)';
    ctx.fillRect(e.x - 15, e.y - 10, 30, 20);
  }

  // Sparse vegetation
  ctx.fillStyle = 'rgba(50,80,30,0.25)';
  for (let i = 0; i < 40; i++) {
    const vx = Math.random() * W;
    const vy = Math.random() * H;
    ctx.beginPath();
    ctx.ellipse(vx, vy, 3 + Math.random() * 6, 2 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rubble/debris
  ctx.fillStyle = 'rgba(100,90,70,0.3)';
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 5, 2 + Math.random() * 3);
  }

  scene.textures.addCanvas('desert_terrain', c);
}

// ── Tunnel wall tile (40×40) ─────────────────────────────────
export function createTunnelWall(scene) {
  if (scene.textures.exists('tunnel_wall')) return;

  const c = document.createElement('canvas');
  c.width = TILE; c.height = TILE;
  const ctx = c.getContext('2d');

  // Concrete wall
  ctx.fillStyle = '#3a3832';
  ctx.fillRect(0, 0, TILE, TILE);

  // Texture variation
  for (let i = 0; i < 15; i++) {
    const shade = 45 + Math.random() * 20;
    ctx.fillStyle = `rgb(${shade + 10},${shade + 8},${shade})`;
    ctx.fillRect(Math.random() * TILE, Math.random() * TILE, 3 + Math.random() * 8, 2 + Math.random() * 6);
  }

  // Cracks
  ctx.strokeStyle = 'rgba(20,18,15,0.4)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * TILE, Math.random() * TILE);
    ctx.lineTo(Math.random() * TILE, Math.random() * TILE);
    ctx.stroke();
  }

  // Border highlight (subtle 3D effect)
  ctx.strokeStyle = 'rgba(80,75,65,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);

  scene.textures.addCanvas('tunnel_wall', c);
}

// ── Tunnel floor tile (40×40) ────────────────────────────────
export function createTunnelFloor(scene) {
  if (scene.textures.exists('tunnel_floor')) return;

  const c = document.createElement('canvas');
  c.width = TILE; c.height = TILE;
  const ctx = c.getContext('2d');

  // Darker floor
  ctx.fillStyle = '#1a1816';
  ctx.fillRect(0, 0, TILE, TILE);

  // Floor texture (slight variation)
  for (let i = 0; i < 10; i++) {
    const shade = 20 + Math.random() * 12;
    ctx.fillStyle = `rgb(${shade + 4},${shade + 2},${shade})`;
    ctx.fillRect(Math.random() * TILE, Math.random() * TILE, 4 + Math.random() * 10, 2 + Math.random() * 6);
  }

  // Dirt/dust
  ctx.fillStyle = 'rgba(60,50,35,0.15)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(Math.random() * TILE, Math.random() * TILE, 2 + Math.random() * 4, 1 + Math.random() * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle grid line
  ctx.strokeStyle = 'rgba(40,36,30,0.2)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, TILE, TILE);

  scene.textures.addCanvas('tunnel_floor', c);
}

// ── Security door tile (40×40) ───────────────────────────────
export function createDoorTile(scene) {
  if (scene.textures.exists('tunnel_door')) return;

  const c = document.createElement('canvas');
  c.width = TILE; c.height = TILE;
  const ctx = c.getContext('2d');

  // Steel door
  ctx.fillStyle = '#5a5850';
  ctx.fillRect(0, 0, TILE, TILE);

  // Metal plate pattern
  ctx.fillStyle = '#626058';
  ctx.fillRect(2, 2, TILE - 4, TILE - 4);

  // Cross bracing
  ctx.strokeStyle = 'rgba(90,85,75,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, 4); ctx.lineTo(TILE - 4, TILE - 4);
  ctx.moveTo(TILE - 4, 4); ctx.lineTo(4, TILE - 4);
  ctx.stroke();

  // Handle/lock
  ctx.fillStyle = '#8a8578';
  ctx.beginPath();
  ctx.arc(TILE / 2, TILE / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(TILE / 2, TILE / 2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#4a4840';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, TILE - 2, TILE - 2);

  scene.textures.addCanvas('tunnel_door', c);
}

// ── Interference zone tile (40×40) ──────────────────────────
export function createInterferenceTile(scene) {
  if (scene.textures.exists('tunnel_interference')) return;

  const c = document.createElement('canvas');
  c.width = TILE; c.height = TILE;
  const ctx = c.getContext('2d');

  // Floor base
  ctx.fillStyle = '#1a1816';
  ctx.fillRect(0, 0, TILE, TILE);

  // Electric/static interference pattern
  ctx.strokeStyle = 'rgba(0,200,255,0.15)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * TILE, Math.random() * TILE);
    for (let j = 0; j < 4; j++) {
      ctx.lineTo(Math.random() * TILE, Math.random() * TILE);
    }
    ctx.stroke();
  }

  // Warning stripes (subtle)
  ctx.fillStyle = 'rgba(255,200,0,0.08)';
  for (let i = 0; i < TILE; i += 8) {
    ctx.fillRect(i, 0, 4, TILE);
  }

  scene.textures.addCanvas('tunnel_interference', c);
}

// ── Command room (960×540) — underground bunker center ──────
export function createCommandRoom(scene) {
  if (scene.textures.exists('command_room')) return;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Dark concrete floor
  ctx.fillStyle = '#1a1816';
  ctx.fillRect(0, 0, W, H);

  // Floor tile grid
  ctx.strokeStyle = 'rgba(40,36,30,0.3)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += TILE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += TILE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Central command table
  ctx.fillStyle = '#2a2826';
  ctx.fillRect(W / 2 - 80, H / 2 - 40, 160, 80);
  ctx.strokeStyle = '#3a3834';
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 80, H / 2 - 40, 160, 80);

  // Maps on table
  ctx.fillStyle = 'rgba(200,180,140,0.2)';
  ctx.fillRect(W / 2 - 60, H / 2 - 30, 50, 35);
  ctx.fillRect(W / 2 + 10, H / 2 - 25, 40, 30);

  // Computer monitors (around edges)
  const monitors = [
    { x: 120, y: 80 }, { x: 200, y: 80 }, { x: 280, y: 80 },
    { x: 680, y: 80 }, { x: 760, y: 80 }, { x: 840, y: 80 },
    { x: 120, y: 440 }, { x: 200, y: 440 },
    { x: 760, y: 440 }, { x: 840, y: 440 },
  ];
  for (const m of monitors) {
    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(m.x - 12, m.y - 8, 24, 16);
    // Screen glow
    ctx.fillStyle = 'rgba(0,100,0,0.3)';
    ctx.fillRect(m.x - 10, m.y - 6, 20, 12);
    // Screen text lines
    ctx.fillStyle = 'rgba(0,200,0,0.2)';
    for (let ly = 0; ly < 3; ly++) {
      ctx.fillRect(m.x - 8, m.y - 4 + ly * 4, 10 + Math.random() * 6, 1);
    }
  }

  // Server racks on walls
  ctx.fillStyle = '#2a2a2e';
  ctx.fillRect(40, 160, 30, 220);
  ctx.fillRect(890, 160, 30, 220);
  // Blinking lights
  for (let y = 170; y < 370; y += 12) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.2)';
    ctx.fillRect(50, y, 3, 3);
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.2)';
    ctx.fillRect(900, y, 3, 3);
  }

  // Weapons crates
  const crates = [
    { x: 150, y: 350 }, { x: 170, y: 360 }, { x: 780, y: 350 }, { x: 800, y: 340 },
  ];
  for (const cr of crates) {
    ctx.fillStyle = '#3a3a28';
    ctx.fillRect(cr.x - 10, cr.y - 8, 20, 16);
    ctx.strokeStyle = '#4a4a38';
    ctx.lineWidth = 1;
    ctx.strokeRect(cr.x - 10, cr.y - 8, 20, 16);
  }

  // Tunnel exits (dark openings on edges)
  ctx.fillStyle = '#0a0a08';
  ctx.fillRect(0, H / 2 - 30, 20, 60);
  ctx.fillRect(W - 20, H / 2 - 30, 20, 60);
  ctx.fillRect(W / 2 - 30, 0, 60, 20);
  ctx.fillRect(W / 2 - 30, H - 20, 60, 20);

  // Cable conduits on floor
  ctx.strokeStyle = 'rgba(50,45,35,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, H / 2); ctx.lineTo(W / 2 - 80, H / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + 80, H / 2); ctx.lineTo(910, H / 2);
  ctx.stroke();

  scene.textures.addCanvas('command_room', c);
}

// ── Drone silhouette (160×120) — for cinematic ──────────────
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
