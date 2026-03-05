// ═══════════════════════════════════════════════════════════════
// Operation Tehran — Side-scroller Level Configuration
// ═══════════════════════════════════════════════════════════════

export const TILE = 32;
export const LEVEL_WIDTH = 200;   // tiles
export const LEVEL_HEIGHT = 25;   // tiles
export const GROUND_Y = 24;       // ground tile row
export const BUILDING_CENTER_TILE = 196;

// ── PLATFORM DEFINITIONS (24 platforms across 4 zones) ───────
export const PLATFORM_DEFS = [
  // Zone A (tiles 0–50): intro / easy
  { x: 8,  y: 20, w: 5 },
  { x: 16, y: 17, w: 4 },
  { x: 22, y: 19, w: 6 },
  { x: 30, y: 15, w: 4 },
  { x: 36, y: 18, w: 5 },
  { x: 44, y: 16, w: 4 },

  // Zone B (tiles 50–100): medium
  { x: 53, y: 19, w: 5 },
  { x: 60, y: 16, w: 6 },
  { x: 68, y: 14, w: 4 },
  { x: 75, y: 18, w: 5 },
  { x: 82, y: 15, w: 4 },
  { x: 90, y: 17, w: 6 },

  // Zone C (tiles 100–150): hard
  { x: 104, y: 18, w: 5 },
  { x: 112, y: 14, w: 4 },
  { x: 118, y: 20, w: 6 },
  { x: 126, y: 16, w: 5 },
  { x: 133, y: 13, w: 4 },
  { x: 140, y: 19, w: 5 },

  // Zone D (tiles 150–200): near building
  { x: 155, y: 17, w: 5 },
  { x: 163, y: 15, w: 4 },
  { x: 170, y: 19, w: 6 },
  { x: 178, y: 16, w: 4 },
  { x: 185, y: 18, w: 5 },
  { x: 192, y: 20, w: 4 },
];

// ── DECORATION DEFINITIONS (15 decorations) ──────────────────
export const DECORATION_DEFS = [
  // Zone A
  { type: 'cat',     x: 10  },
  { type: 'plant',   x: 20  },
  { type: 'flag',    x: 35  },

  // Zone B
  { type: 'samovar', x: 55  },
  { type: 'cat',     x: 70  },
  { type: 'plant',   x: 85  },
  { type: 'flag',    x: 95  },

  // Zone C
  { type: 'samovar', x: 108 },
  { type: 'cat',     x: 120 },
  { type: 'plant',   x: 130 },
  { type: 'flag',    x: 142 },

  // Zone D
  { type: 'samovar', x: 158 },
  { type: 'cat',     x: 168 },
  { type: 'plant',   x: 180 },
  { type: 'flag',    x: 190 },
];

// ── OBSTACLE DEFINITIONS (~20 obstacles) ─────────────────────
export const OBSTACLE_DEFS = [
  // Zone A (0–50): 2 guards, 1 camera, 1 laser — intro/easy
  { type: 'flashlight_guard', x: 14, patrolMin: 10, patrolMax: 22, speed: 50 },
  { type: 'flashlight_guard', x: 38, patrolMin: 34, patrolMax: 46, speed: 55 },
  { type: 'security_camera',  x: 22, y: 19, sweepMin: 0.4, sweepMax: 1.4, sweepSpeed: 0.5, coneLength: 140 },
  { type: 'security_laser',   x: 28, y1: 15, y2: 24, onDuration: 2500, offDuration: 2500 },

  // Zone B (50–100): 2 guards, 2 cameras, 2 lasers — medium
  { type: 'flashlight_guard', x: 58, patrolMin: 53, patrolMax: 66, speed: 60 },
  { type: 'flashlight_guard', x: 80, patrolMin: 75, patrolMax: 88, speed: 55 },
  { type: 'security_camera',  x: 60, y: 16, sweepMin: 0.3, sweepMax: 1.3, sweepSpeed: 0.6, coneLength: 160 },
  { type: 'security_camera',  x: 90, y: 17, sweepMin: 0.4, sweepMax: 1.5, sweepSpeed: 0.55, coneLength: 150 },
  { type: 'security_laser',   x: 70, y1: 14, y2: 24, onDuration: 2000, offDuration: 2000 },
  { type: 'security_laser',   x: 86, y1: 15, y2: 24, onDuration: 2200, offDuration: 1800, phase: 1000 },

  // Zone C (100–150): 2 guards, 2 cameras, 3 lasers — hard
  { type: 'flashlight_guard', x: 110, patrolMin: 104, patrolMax: 118, speed: 65 },
  { type: 'flashlight_guard', x: 135, patrolMin: 130, patrolMax: 142, speed: 60 },
  { type: 'security_camera',  x: 112, y: 14, sweepMin: 0.3, sweepMax: 1.4, sweepSpeed: 0.7, coneLength: 170 },
  { type: 'security_camera',  x: 140, y: 19, sweepMin: 0.4, sweepMax: 1.5, sweepSpeed: 0.65, coneLength: 160 },
  { type: 'security_laser',   x: 106, y1: 14, y2: 24, onDuration: 1800, offDuration: 1600 },
  { type: 'security_laser',   x: 124, y1: 13, y2: 24, onDuration: 2000, offDuration: 1500, phase: 800 },
  { type: 'security_laser',   x: 146, y1: 16, y2: 24, onDuration: 1600, offDuration: 1400, phase: 500 },

  // Zone D (150–200): 1 guard, 1 camera, 2 lasers — near building
  { type: 'flashlight_guard', x: 165, patrolMin: 160, patrolMax: 175, speed: 55 },
  { type: 'security_camera',  x: 178, y: 16, sweepMin: 0.3, sweepMax: 1.3, sweepSpeed: 0.6, coneLength: 150 },
  { type: 'security_laser',   x: 172, y1: 15, y2: 24, onDuration: 2000, offDuration: 2000 },
  { type: 'security_laser',   x: 188, y1: 16, y2: 24, onDuration: 1800, offDuration: 1800, phase: 900 },
];
