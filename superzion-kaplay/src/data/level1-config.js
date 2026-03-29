// ===================================================================
// Bomberman-style Level 1 Configuration -- Operation Tehran
// 27x14 tile grid, 2 zones, no scrolling
// Ported from original Phaser LevelConfig.js
// ===================================================================

export const TILE = 34;
export const COLS = 27;
export const ROWS = 14;
export const HUD_H = 60;
export const GRID_X = Math.floor((960 - COLS * TILE) / 2); // 21
export const GRID_Y = HUD_H;

// Tile types
export const T_EMPTY = 0;
export const T_WALL = 1;
export const T_BREAK = 2;
export const T_DOOR = 3;   // bomb-destructible zone door
export const T_GDOOR = 4;  // key-required golden door
export const T_OBJ = 5;    // objective console

// Key positions
export const SPAWN = { col: 1, row: 1 };
export const OBJ = { col: 21, row: 7 };

// Grid <-> pixel helpers
export function gx(col) { return GRID_X + col * TILE + TILE / 2; }
export function gy(row) { return GRID_Y + row * TILE + TILE / 2; }
export function toCol(x) { return Math.floor((x - GRID_X) / TILE); }
export function toRow(y) { return Math.floor((y - GRID_Y) / TILE); }

// Guard definitions -- 2 zones, 6 guards total
export const GUARD_DEFS = [
  // Zone 1 (cols 1-12): 3 patrols
  { type: "patrol", col: 3, row: 3 },
  { type: "patrol", col: 7, row: 5 },
  { type: "patrol", col: 5, row: 9 },
  // Zone 2 (cols 14-25): 2 patrols + 1 chaser
  { type: "patrol", col: 17, row: 3 },
  { type: "patrol", col: 21, row: 9 },
  { type: "chaser", col: 19, row: 5 },
];

// Zone column ranges (interior cols)
const ZONE_RANGES = [[1, 12], [14, 25]];
const ZONE_DENSITY = [0.22, 0.28];

// Pillar columns per zone
const PILLAR_COLS = [[2, 4, 6, 8, 10, 12], [14, 16, 18, 20, 22, 24]];
const PILLAR_ROWS = [2, 4, 6, 8, 10, 12];

// Generate the complete level map
export function generateMap() {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(T_EMPTY));
  const pups = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // 1. Border walls
  for (let c = 0; c < COLS; c++) {
    map[0][c] = T_WALL;
    map[ROWS - 1][c] = T_WALL;
  }
  for (let r = 0; r < ROWS; r++) {
    map[r][0] = T_WALL;
    map[r][COLS - 1] = T_WALL;
  }

  // 2. Zone separator wall at col 13
  for (let r = 0; r < ROWS; r++) {
    map[r][13] = T_WALL;
  }
  map[7][13] = T_DOOR; // bomb-destructible door at row 7

  // 3. Bomberman pillars (even row AND even col within zones)
  for (const cols of PILLAR_COLS) {
    for (const c of cols) {
      for (const r of PILLAR_ROWS) {
        map[r][c] = T_WALL;
      }
    }
  }

  // 4. Objective
  map[OBJ.row][OBJ.col] = T_OBJ;

  // 5. Protected tiles (never breakable)
  const protect = new Set();
  const pr = (c, r) => {
    if (r > 0 && r < ROWS && c > 0 && c < COLS) protect.add(`${c},${r}`);
  };
  // Spawn area (Bomberman L-shape)
  pr(1, 1); pr(2, 1); pr(1, 2);
  // Objective surroundings
  for (const [dc, dr] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    pr(OBJ.col + dc, OBJ.row + dr);
  }
  // Door access tiles (both sides of door at col 13, row 7)
  pr(12, 7); pr(14, 7);
  // Guard spawns
  for (const g of GUARD_DEFS) pr(g.col, g.row);

  // 6. Destructible walls + powerups
  const pupPool = ["bomb", "range", "speed"];
  for (let z = 0; z < 2; z++) {
    const [cMin, cMax] = ZONE_RANGES[z];
    const density = ZONE_DENSITY[z];
    for (let r = 1; r <= ROWS - 2; r++) {
      for (let c = cMin; c <= cMax; c++) {
        if (map[r][c] !== T_EMPTY) continue;
        if (protect.has(`${c},${r}`)) continue;
        if (Math.random() < density) {
          map[r][c] = T_BREAK;
          if (Math.random() < 0.35) {
            pups[r][c] = pupPool[Math.floor(Math.random() * pupPool.length)];
          }
        }
      }
    }
  }

  return { map, powerups: pups };
}
