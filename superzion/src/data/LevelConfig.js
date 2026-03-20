// ===================================================================
// Bomberman-style Level 1 Configuration — Operation Tehran
// 29x15 tile grid, 3 zones, no scrolling
// ===================================================================

export const TILE = 32;
export const COLS = 29;
export const ROWS = 15;
export const HUD_H = 60;
export const GRID_X = Math.floor((960 - COLS * TILE) / 2); // 16
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
export const OBJ = { col: 24, row: 7 };

// Grid <-> pixel helpers
export function gx(col) { return GRID_X + col * TILE + TILE / 2; }
export function gy(row) { return GRID_Y + row * TILE + TILE / 2; }
export function toCol(x) { return Math.floor((x - GRID_X) / TILE); }
export function toRow(y) { return Math.floor((y - GRID_Y) / TILE); }

// Guard definitions
export const GUARD_DEFS = [
  // Zone 1 (cols 1-9): 3 patrols
  { type: 'patrol', col: 5, row: 5 },
  { type: 'patrol', col: 3, row: 9 },
  { type: 'patrol', col: 7, row: 11 },
  // Zone 2 (cols 11-19): 5 patrols + 2 chasers
  { type: 'patrol', col: 13, row: 3 },
  { type: 'patrol', col: 15, row: 11 },
  { type: 'patrol', col: 17, row: 5 },
  { type: 'patrol', col: 11, row: 9 },
  { type: 'patrol', col: 19, row: 13 },
  { type: 'chaser', col: 13, row: 7 },
  { type: 'chaser', col: 17, row: 9 },
  // Zone 3 (cols 21-27): 3 chasers
  { type: 'chaser', col: 23, row: 5 },
  { type: 'chaser', col: 25, row: 9 },
  { type: 'chaser', col: 21, row: 11 },
];

// Zone column ranges (interior cols)
const ZONE_RANGES = [[1, 9], [11, 19], [21, 27]];
const ZONE_DENSITY = [0.18, 0.50, 0.28];

// Pillar columns per zone
const PILLAR_COLS = [[2, 4, 6, 8], [12, 14, 16, 18], [22, 24, 26]];
const PILLAR_ROWS = [2, 4, 6, 8, 10, 12];

// Generate the complete level map
export function generateMap() {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(T_EMPTY));
  const pups = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // 1. Border walls
  for (let c = 0; c < COLS; c++) { map[0][c] = T_WALL; map[ROWS - 1][c] = T_WALL; }
  for (let r = 0; r < ROWS; r++) { map[r][0] = T_WALL; map[r][COLS - 1] = T_WALL; }

  // 2. Zone separator walls
  for (let r = 0; r < ROWS; r++) { map[r][10] = T_WALL; map[r][20] = T_WALL; }
  map[7][10] = T_DOOR;   // bomb-destructible door
  map[7][20] = T_GDOOR;  // key-required golden door

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
  const pr = (c, r) => { if (r > 0 && r < ROWS && c > 0 && c < COLS) protect.add(`${c},${r}`); };
  // Spawn area (Bomberman L-shape)
  pr(1, 1); pr(2, 1); pr(1, 2);
  // Objective surroundings
  for (const [dc, dr] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) pr(OBJ.col + dc, OBJ.row + dr);
  // Door access tiles
  pr(9, 7); pr(11, 7); pr(19, 7); pr(21, 7);
  // Guard spawns
  for (const g of GUARD_DEFS) pr(g.col, g.row);

  // 6. Destructible walls + powerups
  const pupPool = ['bomb', 'range', 'speed'];
  for (let z = 0; z < 3; z++) {
    const [cMin, cMax] = ZONE_RANGES[z];
    const density = ZONE_DENSITY[z];
    for (let r = 1; r <= 13; r++) {
      for (let c = cMin; c <= cMax; c++) {
        if (map[r][c] !== T_EMPTY) continue;
        if (protect.has(`${c},${r}`)) continue;
        if (Math.random() < density) {
          map[r][c] = T_BREAK;
          if (Math.random() < 0.25) {
            pups[r][c] = pupPool[Math.floor(Math.random() * pupPool.length)];
          }
        }
      }
    }
  }

  // 7. Force KEY in zone 2 (behind breakable)
  // Verified: key always spawns in accessible location within Zone 2 (Phase 32, LVL1-08)
  const keyCandidates = [];
  for (let r = 3; r <= 11; r++) {
    for (let c = 13; c <= 17; c++) {
      if (map[r][c] === T_BREAK) keyCandidates.push([c, r]);
    }
  }
  if (keyCandidates.length > 0) {
    const [kc, kr] = keyCandidates[Math.floor(Math.random() * keyCandidates.length)];
    pups[kr][kc] = 'key';
  } else {
    // Fallback: create a breakable with key
    for (const [c, r] of [[15, 5], [13, 9], [17, 7]]) {
      if (map[r][c] === T_EMPTY && !protect.has(`${c},${r}`)) {
        map[r][c] = T_BREAK;
        pups[r][c] = 'key';
        break;
      }
    }
  }

  return { map, powerups: pups };
}
