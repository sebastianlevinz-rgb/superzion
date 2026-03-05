// ═══════════════════════════════════════════════════════════════
// Operation Tehran — Tile textures
// Iranian pavement ground + sandstone/turquoise bazaar platforms
// ═══════════════════════════════════════════════════════════════

const TILE = 32;

// Iranian pavement palette (warm beige/cream)
const PAVE = [
  '#a09080', '#a89888', '#b0a090', '#b8a898', '#c0b0a0',
  '#c8b8a8', '#d0c0b0', '#d8c8b8', '#e0d0c0', '#e8d8c8',
  '#f0e0d0', '#f0e8e0',
];

// Sandstone palette for platforms
const SAND = [
  '#8a7050', '#977d5a', '#a48a64', '#b0966e', '#bca278',
  '#c2a878', '#c8b082', '#d0b88c', '#d8c096', '#e0c8a0',
  '#e8d0aa', '#f0d8b4',
];

// Turquoise accent
const TURQ = '#00CED1';
const TURQ_DK = '#00A8A8';
const TURQ_LT = '#40E8E8';

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function seededNoise(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// ── GROUND TOP TILE (Iranian pavement) ──────────────────────────
export function createGroundTopTile(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');

  const seed = 42;

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const noise = seededNoise(x, y, seed);
      const baseIdx = Math.floor((y / TILE) * 4) + 5;
      const vary = noise > 0.7 ? 1 : noise < 0.2 ? -1 : 0;
      const idx = Math.max(0, Math.min(PAVE.length - 1, baseIdx + vary));
      px(ctx, x, y, PAVE[idx]);
    }
  }

  // Top curb edge (darker stone line)
  for (let x = 0; x < TILE; x++) {
    const n = seededNoise(x, 0, seed + 100);
    px(ctx, x, 0, n > 0.3 ? '#b0a090' : '#a09080');
    px(ctx, x, 1, n > 0.5 ? '#c0b0a0' : '#b0a090');
  }

  // Brick joint pattern
  const jointColor = '#a09080';
  for (let y = 8; y < TILE; y += 8) {
    for (let x = 0; x < TILE; x++) {
      if (seededNoise(x, y, seed + 200) > 0.3) {
        px(ctx, x, y, jointColor);
      }
    }
  }
  // Vertical joints offset per row
  for (let y = 0; y < TILE; y++) {
    const offset = (Math.floor(y / 8) % 2) * 16;
    const jx = (offset + 16) % TILE;
    if (jx > 0 && jx < TILE) {
      px(ctx, jx, y, jointColor);
    }
  }

  // Subtle warm stain
  for (let y = 14; y < 20; y++) {
    for (let x = 20; x < 28; x++) {
      if ((x + y) % 2 === 0) px(ctx, x, y, PAVE[3]);
    }
  }

  // Bottom shadow
  for (let x = 0; x < TILE; x++) {
    px(ctx, x, TILE - 1, PAVE[0]);
  }

  scene.textures.addCanvas('ground_top', canvas);
}

// ── GROUND FILL TILE ────────────────────────────────────────────
export function createGroundFillTile(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');

  const seed = 77;

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const noise = seededNoise(x, y, seed);
      const baseIdx = Math.floor((y / TILE) * 3) + 1;
      const vary = noise > 0.8 ? 1 : 0;
      const idx = Math.max(0, Math.min(5, baseIdx + vary));
      px(ctx, x, y, PAVE[idx]);
    }
  }

  for (let i = 0; i < 15; i++) {
    const rx = Math.floor(seededNoise(i, 0, seed) * TILE);
    const ry = Math.floor(seededNoise(0, i, seed) * TILE);
    px(ctx, rx, ry, PAVE[3]);
  }

  scene.textures.addCanvas('ground_fill', canvas);
}

// ── PLATFORM TILE (sandstone + turquoise border) ────────────────
export function createPlatformTile(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');

  const seed = 99;

  // Sandstone body
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const noise = seededNoise(x, y, seed);
      const baseIdx = 3 + Math.floor((y / TILE) * 4);
      const vary = noise > 0.7 ? 1 : noise < 0.15 ? -1 : 0;
      const idx = Math.max(0, Math.min(SAND.length - 1, baseIdx + vary));
      px(ctx, x, y, SAND[idx]);
    }
  }

  // Top turquoise tile border
  for (let x = 0; x < TILE; x++) {
    px(ctx, x, 0, TURQ);
    px(ctx, x, 1, TURQ_DK);
    // Alternating lighter tiles
    if (x % 4 < 2) {
      px(ctx, x, 0, TURQ_LT);
    }
  }

  // Ornamental carved line
  for (let x = 0; x < TILE; x++) {
    px(ctx, x, 3, SAND[2]);
    if (x % 6 < 3) {
      px(ctx, x, 3, TURQ_DK);
    }
  }

  // Mortar lines
  for (let x = 0; x < TILE; x++) {
    px(ctx, x, 12, SAND[2]);
    px(ctx, x, 22, SAND[2]);
  }
  for (let y = 4; y < TILE; y++) {
    const xLine = (y < 12) ? 16 : (y < 22) ? 8 : 24;
    px(ctx, xLine, y, SAND[2]);
  }

  // Bottom shadow
  for (let x = 0; x < TILE; x++) {
    px(ctx, x, TILE - 1, SAND[0]);
    px(ctx, x, TILE - 2, SAND[1]);
  }

  // Side edges
  for (let y = 2; y < TILE - 2; y++) {
    px(ctx, 0, y, SAND[2]);
    px(ctx, TILE - 1, y, SAND[7]);
  }

  scene.textures.addCanvas('platform', canvas);
}

// ── PLATFORM LEFT EDGE ──────────────────────────────────────────
export function createPlatformLeftTile(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');

  const seed = 101;

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const noise = seededNoise(x, y, seed);
      const baseIdx = 3 + Math.floor((y / TILE) * 4);
      const vary = noise > 0.7 ? 1 : noise < 0.15 ? -1 : 0;
      const idx = Math.max(0, Math.min(SAND.length - 1, baseIdx + vary));
      px(ctx, x, y, SAND[idx]);
    }
  }

  // Top turquoise border
  for (let x = 0; x < TILE; x++) {
    px(ctx, x, 0, TURQ);
    px(ctx, x, 1, TURQ_DK);
    if (x % 4 < 2) px(ctx, x, 0, TURQ_LT);
  }

  // Strong left edge shadow
  for (let y = 0; y < TILE; y++) {
    px(ctx, 0, y, SAND[0]);
    px(ctx, 1, y, SAND[1]);
    px(ctx, 2, y, SAND[2]);
  }
  // Left turquoise accent
  for (let y = 0; y < 2; y++) {
    px(ctx, 0, y, TURQ_DK);
  }

  // Bottom shadow
  for (let x = 0; x < TILE; x++) {
    px(ctx, x, TILE - 1, SAND[0]);
  }

  scene.textures.addCanvas('platform_left', canvas);
}

// ── PLATFORM RIGHT EDGE ─────────────────────────────────────────
export function createPlatformRightTile(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');

  const seed = 103;

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const noise = seededNoise(x, y, seed);
      const baseIdx = 3 + Math.floor((y / TILE) * 4);
      const vary = noise > 0.7 ? 1 : noise < 0.15 ? -1 : 0;
      const idx = Math.max(0, Math.min(SAND.length - 1, baseIdx + vary));
      px(ctx, x, y, SAND[idx]);
    }
  }

  // Top turquoise border
  for (let x = 0; x < TILE; x++) {
    px(ctx, x, 0, TURQ);
    px(ctx, x, 1, TURQ_DK);
    if (x % 4 < 2) px(ctx, x, 0, TURQ_LT);
  }

  // Right edge highlight
  for (let y = 0; y < TILE; y++) {
    px(ctx, TILE - 1, y, SAND[9]);
    px(ctx, TILE - 2, y, SAND[8]);
    px(ctx, TILE - 3, y, SAND[7]);
  }
  // Right turquoise accent
  for (let y = 0; y < 2; y++) {
    px(ctx, TILE - 1, y, TURQ_DK);
  }

  // Bottom shadow
  for (let x = 0; x < TILE; x++) {
    px(ctx, x, TILE - 1, SAND[0]);
  }

  scene.textures.addCanvas('platform_right', canvas);
}
