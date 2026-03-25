// =================================================================
// FlightRouteScene -- Military radar-style map with animated flight route
// Plays between level cinematic and gameplay scene
// =================================================================

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';

const W = 960;
const H = 540;

// Israel origin (Tel Aviv approximate position on our map)
const TEL_AVIV = { x: 280, y: 275 };

// Route destinations per level with full labels and waypoints
const ROUTES = {
  1: {
    city: 'TEHRAN, IRAN',
    dest: { x: 800, y: 180 },
    waypoints: [
      { x: 280, y: 275 },  // Tel Aviv
      { x: 380, y: 260 },  // across Jordan
      { x: 520, y: 230 },  // into Iraq
      { x: 660, y: 200 },  // central Iraq
      { x: 800, y: 180 },  // Tehran
    ],
  },
  2: {
    city: 'BEIRUT, LEBANON',
    dest: { x: 275, y: 220 },
    waypoints: [
      { x: 280, y: 275 },  // Tel Aviv
      { x: 278, y: 250 },  // north along coast
      { x: 275, y: 220 },  // Beirut
    ],
  },
  3: {
    city: 'LEBANON MOUNTAINS',
    dest: { x: 310, y: 200 },
    waypoints: [
      { x: 280, y: 275 },  // Tel Aviv
      { x: 290, y: 245 },  // north
      { x: 305, y: 218 },  // into mountains
      { x: 310, y: 200 },  // deep Lebanon
    ],
  },
  4: {
    city: 'GAZA STRIP',
    dest: { x: 250, y: 310 },
    waypoints: [
      { x: 280, y: 275 },  // Tel Aviv
      { x: 265, y: 290 },  // south-west
      { x: 250, y: 310 },  // Gaza
    ],
  },
  5: {
    city: 'FORDOW, IRAN',
    dest: { x: 760, y: 230 },
    waypoints: [
      { x: 280, y: 275 },  // Tel Aviv
      { x: 380, y: 260 },  // across Jordan
      { x: 500, y: 240 },  // into Iraq
      { x: 630, y: 230 },  // eastern Iraq
      { x: 760, y: 230 },  // Natanz (central Iran)
    ],
  },
  6: {
    city: 'UNKNOWN TERRITORY',
    dest: { x: 420, y: 160 },
    waypoints: [
      { x: 280, y: 275 },  // Tel Aviv
      { x: 320, y: 240 },  // north-east
      { x: 370, y: 200 },  // into Syria
      { x: 420, y: 160 },  // unknown
    ],
  },
};

// =============================================
// Country outlines (simplified silhouettes)
// Each country is an array of [x, y] pairs
// =============================================

// Mediterranean Sea area (blue-black)
const MEDITERRANEAN = [
  [20, 40], [120, 30], [200, 50], [240, 100], [260, 150],
  [270, 200], [265, 250], [260, 280], [250, 310], [230, 340],
  [200, 360], [160, 340], [120, 300], [80, 260], [50, 200],
  [30, 140], [20, 80],
];

// Israel (small bright shape)
const ISRAEL_SHAPE = [
  [270, 248], [280, 242], [288, 248], [290, 265],
  [288, 285], [282, 305], [275, 310], [268, 300],
  [265, 280], [267, 260],
];

// Lebanon (above Israel)
const LEBANON_SHAPE = [
  [260, 205], [275, 195], [295, 200], [305, 210],
  [300, 225], [285, 238], [270, 242], [260, 235],
  [255, 220],
];

// Syria (above Lebanon, larger)
const SYRIA_SHAPE = [
  [290, 130], [340, 110], [420, 115], [460, 130],
  [470, 170], [450, 200], [420, 220], [380, 225],
  [340, 220], [310, 210], [295, 195], [285, 170],
  [280, 150],
];

// Iraq (right of Syria, large)
const IRAQ_SHAPE = [
  [420, 115], [490, 110], [550, 130], [580, 170],
  [590, 220], [580, 280], [560, 320], [520, 340],
  [480, 330], [450, 300], [430, 260], [420, 220],
  [440, 180], [450, 150], [440, 130],
];

// Iran (far right, large)
const IRAN_SHAPE = [
  [580, 100], [660, 80], [750, 90], [830, 110],
  [890, 150], [920, 210], [910, 290], [880, 350],
  [830, 390], [770, 400], [710, 380], [660, 340],
  [630, 290], [610, 250], [590, 210], [580, 170],
  [570, 130],
];

// Egypt (below-left)
const EGYPT_SHAPE = [
  [100, 280], [150, 260], [200, 270], [230, 290],
  [250, 315], [250, 350], [240, 400], [220, 450],
  [190, 490], [150, 510], [110, 500], [80, 460],
  [70, 400], [75, 340],
];

// Jordan (right of Israel)
const JORDAN_SHAPE = [
  [290, 265], [330, 250], [370, 260], [390, 290],
  [385, 330], [370, 360], [340, 370], [310, 360],
  [295, 330], [285, 305], [288, 285],
];

// Gaza strip (small, below-left of Israel)
const GAZA_SHAPE = [
  [255, 300], [265, 298], [268, 305], [265, 318],
  [258, 322], [252, 315], [250, 308],
];

// Saudi Arabia (south, large)
const SAUDI_SHAPE = [
  [340, 370], [400, 350], [480, 330], [560, 320],
  [630, 340], [700, 380], [740, 430], [720, 490],
  [660, 530], [560, 540], [440, 530], [360, 500],
  [320, 450], [310, 400],
];

// Turkey (north)
const TURKEY_SHAPE = [
  [180, 60], [250, 40], [350, 35], [440, 50],
  [520, 70], [560, 100], [540, 130], [490, 120],
  [420, 115], [350, 110], [290, 130], [260, 120],
  [220, 100], [190, 80],
];

// Collect country data for rendering
const COUNTRIES = [
  { name: 'Turkey',       shape: TURKEY_SHAPE,   fill: 0x1A4A1A, alpha: 0.25 },
  { name: 'Syria',        shape: SYRIA_SHAPE,    fill: 0x1A4A1A, alpha: 0.3 },
  { name: 'Iraq',         shape: IRAQ_SHAPE,     fill: 0x1A4A1A, alpha: 0.25 },
  { name: 'Iran',         shape: IRAN_SHAPE,     fill: 0x1A4A1A, alpha: 0.3 },
  { name: 'Egypt',        shape: EGYPT_SHAPE,    fill: 0x1A4A1A, alpha: 0.25 },
  { name: 'Jordan',       shape: JORDAN_SHAPE,   fill: 0x1A4A1A, alpha: 0.3 },
  { name: 'Saudi Arabia', shape: SAUDI_SHAPE,    fill: 0x1A4A1A, alpha: 0.2 },
  { name: 'Lebanon',      shape: LEBANON_SHAPE,  fill: 0x1A4A1A, alpha: 0.3 },
  { name: 'Gaza',         shape: GAZA_SHAPE,     fill: 0x1A4A1A, alpha: 0.3 },
];


export default class FlightRouteScene extends Phaser.Scene {
  constructor() { super('FlightRouteScene'); }

  create(data) {
    const level = data.level || 1;
    const nextScene = data.nextScene || 'GameScene';
    const route = ROUTES[level] || ROUTES[1];
    this.nextScene = nextScene;
    this.nextSceneData = data;
    this.skipped = false;
    this.transitioning = false;

    this.cameras.main.setBackgroundColor('#0A1A0A');
    this.cameras.main.fadeIn(300, 10, 26, 10);

    // -- Keys --
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.escKey = this.input.keyboard.addKey('ESC');
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.mKey = this.input.keyboard.addKey('M');

    // ========================================
    // Layer 0: Radar grid background
    // ========================================
    this._drawRadarGrid();

    // ========================================
    // Layer 1: Mediterranean Sea
    // ========================================
    const mapGfx = this.add.graphics().setDepth(1);
    mapGfx.fillStyle(0x0A0A2A, 0.5);
    this._fillPoly(mapGfx, MEDITERRANEAN);

    // ========================================
    // Layer 2: Country outlines (dark green)
    // ========================================
    const countriesGfx = this.add.graphics().setDepth(2);
    for (const country of COUNTRIES) {
      // Fill
      countriesGfx.fillStyle(country.fill, country.alpha);
      this._fillPoly(countriesGfx, country.shape);
      // Outline
      countriesGfx.lineStyle(1, 0x2A6A2A, 0.4);
      this._strokePoly(countriesGfx, country.shape);
    }

    // ========================================
    // Layer 3: Israel highlight (bright green)
    // ========================================
    const israelGfx = this.add.graphics().setDepth(3);
    israelGfx.fillStyle(0x00FF44, 0.5);
    this._fillPoly(israelGfx, ISRAEL_SHAPE);
    israelGfx.lineStyle(1.5, 0x00FF44, 0.7);
    this._strokePoly(israelGfx, ISRAEL_SHAPE);

    // Pulsing dot for Tel Aviv
    const telAvivDot = this.add.graphics().setDepth(4);
    telAvivDot.fillStyle(0x00FF44, 0.9);
    telAvivDot.fillCircle(TEL_AVIV.x, TEL_AVIV.y, 4);
    telAvivDot.fillStyle(0x00FF44, 0.3);
    telAvivDot.fillCircle(TEL_AVIV.x, TEL_AVIV.y, 10);

    this.tweens.add({
      targets: telAvivDot,
      alpha: { from: 1, to: 0.4 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Tel Aviv label
    this.add.text(TEL_AVIV.x + 15, TEL_AVIV.y - 8, 'TEL AVIV', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00FF44',
      shadow: { offsetX: 0, offsetY: 0, color: '#00FF44', blur: 4, fill: true },
    }).setOrigin(0, 0.5).setDepth(5);

    // Israel label
    this.add.text(TEL_AVIV.x + 15, TEL_AVIV.y + 6, 'ISRAEL', {
      fontFamily: 'monospace', fontSize: '8px', color: '#00AA33',
    }).setOrigin(0, 0.5).setDepth(5);

    // ========================================
    // Layer 4: Destination blinking red dot
    // ========================================
    const destDot = this.add.graphics().setDepth(4);
    destDot.fillStyle(0xFF0000, 0.8);
    destDot.fillCircle(route.dest.x, route.dest.y, 5);
    destDot.fillStyle(0xFF0000, 0.2);
    destDot.fillCircle(route.dest.x, route.dest.y, 12);

    this.tweens.add({
      targets: destDot,
      alpha: { from: 1, to: 0.2 },
      duration: 350,
      yoyo: true,
      repeat: -1,
    });

    // Destination label (hidden until arrival)
    this.destLabel = this.add.text(route.dest.x, route.dest.y + 20, route.city, {
      fontFamily: 'monospace', fontSize: '14px', color: '#00FF44',
      shadow: { offsetX: 0, offsetY: 0, color: '#00FF44', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(15).setAlpha(0);

    // ========================================
    // Layer 5: Radar sweep from Tel Aviv
    // ========================================
    this._radarSweep(TEL_AVIV.x, TEL_AVIV.y);

    // ========================================
    // Layer 6: Scanlines overlay
    // ========================================
    this._drawScanlines();

    // ========================================
    // HUD elements
    // ========================================
    this._drawHUD(level);

    // ========================================
    // Flight route animation
    // ========================================
    this._animateFlightRoute(route);

    // ========================================
    // Running timestamp (bottom-right)
    // ========================================
    this.timestampText = this.add.text(W - 20, H - 20, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#1A6A1A',
    }).setOrigin(1, 1).setDepth(20);
    this.timestampStart = Date.now();

    // Skip hint
    this.add.text(W - 20, H - 36, 'ESC TO SKIP', {
      fontFamily: 'monospace', fontSize: '9px', color: '#1A4A1A',
    }).setOrigin(1, 1).setDepth(20);
  }

  // =============================================
  // DRAWING HELPERS
  // =============================================

  /** Fill a polygon from array of [x,y] pairs */
  _fillPoly(gfx, points) {
    gfx.beginPath();
    gfx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      gfx.lineTo(points[i][0], points[i][1]);
    }
    gfx.closePath();
    gfx.fill();
  }

  /** Stroke a polygon outline from array of [x,y] pairs */
  _strokePoly(gfx, points) {
    gfx.beginPath();
    gfx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      gfx.lineTo(points[i][0], points[i][1]);
    }
    gfx.closePath();
    gfx.strokePath();
  }

  // =============================================
  // RADAR GRID (concentric circles + grid lines)
  // =============================================

  _drawRadarGrid() {
    const gridGfx = this.add.graphics().setDepth(0);

    // Grid lines every 40px
    gridGfx.lineStyle(1, 0x1A3A1A, 0.15);
    for (let x = 0; x <= W; x += 40) {
      gridGfx.lineBetween(x, 0, x, H);
    }
    for (let y = 0; y <= H; y += 40) {
      gridGfx.lineBetween(0, y, W, y);
    }

    // Concentric circles from center of map
    const cx = W / 2;
    const cy = H / 2;
    gridGfx.lineStyle(1, 0x1A4A1A, 0.2);
    for (let r = 60; r < 500; r += 60) {
      gridGfx.strokeCircle(cx, cy, r);
    }

    // Cross-hairs through center
    gridGfx.lineStyle(1, 0x1A4A1A, 0.12);
    gridGfx.lineBetween(cx, 0, cx, H);
    gridGfx.lineBetween(0, cy, W, cy);
  }

  // =============================================
  // SCANLINES OVERLAY
  // =============================================

  _drawScanlines() {
    const scanGfx = this.add.graphics().setDepth(30);
    scanGfx.fillStyle(0x000000, 0.06);
    for (let y = 0; y < H; y += 2) {
      scanGfx.fillRect(0, y, W, 1);
    }
  }

  // =============================================
  // HUD (military style)
  // =============================================

  _drawHUD(level) {
    // Top header
    this.add.text(W / 2, 24, 'FLIGHT ROUTE \u2014 CLASSIFIED', {
      fontFamily: 'monospace', fontSize: '18px', color: '#00DD33', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#00FF44', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(20);

    // Mission subheader
    this.add.text(W / 2, 46, `MISSION ${level}  //  PRIORITY ALPHA`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#1A6A1A',
    }).setOrigin(0.5).setDepth(20);

    // Corner brackets (top-left)
    const bracketGfx = this.add.graphics().setDepth(20);
    bracketGfx.lineStyle(2, 0x00DD33, 0.5);
    // Top-left
    bracketGfx.lineBetween(10, 10, 10, 35);
    bracketGfx.lineBetween(10, 10, 35, 10);
    // Top-right
    bracketGfx.lineBetween(W - 10, 10, W - 10, 35);
    bracketGfx.lineBetween(W - 10, 10, W - 35, 10);
    // Bottom-left
    bracketGfx.lineBetween(10, H - 10, 10, H - 35);
    bracketGfx.lineBetween(10, H - 10, 35, H - 10);
    // Bottom-right
    bracketGfx.lineBetween(W - 10, H - 10, W - 10, H - 35);
    bracketGfx.lineBetween(W - 10, H - 10, W - 35, H - 10);

    // Classification label top-left
    this.add.text(15, 52, 'CLASS: TOP SECRET', {
      fontFamily: 'monospace', fontSize: '9px', color: '#FF3333',
    }).setDepth(20);

    // Coordinates display bottom-left
    this.add.text(15, H - 26, `LAT 32.0853  LON 34.7818`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#1A6A1A',
    }).setDepth(20);
  }

  // =============================================
  // RADAR SWEEP (rotating green wedge from Tel Aviv)
  // =============================================

  _radarSweep(cx, cy) {
    const sweep = this.add.graphics().setDepth(3).setAlpha(0.15);
    let sweepAngle = { a: 0 };

    this.tweens.add({
      targets: sweepAngle,
      a: Math.PI * 2,
      duration: 2500,
      repeat: -1,
      onUpdate: () => {
        sweep.clear();
        // Green wedge
        sweep.fillStyle(0x00FF44, 0.25);
        sweep.beginPath();
        sweep.moveTo(cx, cy);
        sweep.arc(cx, cy, 80, sweepAngle.a, sweepAngle.a + 0.5, false);
        sweep.closePath();
        sweep.fill();
        // Concentric pulse rings from origin
        sweep.lineStyle(1, 0x00FF44, 0.1);
        sweep.strokeCircle(cx, cy, 30);
        sweep.strokeCircle(cx, cy, 60);
      },
    });
  }

  // =============================================
  // FLIGHT ROUTE ANIMATION (along waypoints)
  // =============================================

  _animateFlightRoute(route) {
    const waypoints = route.waypoints;
    const FLIGHT_DURATION = 3000; // 3 seconds

    // Calculate total path length
    let totalLength = 0;
    const segments = [];
    for (let i = 1; i < waypoints.length; i++) {
      const dx = waypoints[i].x - waypoints[i - 1].x;
      const dy = waypoints[i].y - waypoints[i - 1].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segments.push({ from: waypoints[i - 1], to: waypoints[i], len });
      totalLength += len;
    }

    // Route graphics
    const routeGfx = this.add.graphics().setDepth(10);
    // Trail graphics
    const trailGfx = this.add.graphics().setDepth(9);

    // Plane icon
    const planeGfx = this.add.graphics().setDepth(15);
    planeGfx.x = waypoints[0].x;
    planeGfx.y = waypoints[0].y;

    // Draw initial plane facing first segment direction
    const initAngle = Math.atan2(
      waypoints[1].y - waypoints[0].y,
      waypoints[1].x - waypoints[0].x,
    );
    this._drawPlane(planeGfx, 0, 0, initAngle);

    // Track previous positions for trail dots
    const trailDots = [];

    let progress = { t: 0 };
    this.flightTween = this.tweens.add({
      targets: progress,
      t: 1,
      duration: FLIGHT_DURATION,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (this.skipped) return;
        const t = progress.t;

        // Find position along path
        const pos = this._getPositionOnPath(waypoints, segments, totalLength, t);

        // Update plane
        planeGfx.x = pos.x;
        planeGfx.y = pos.y;
        planeGfx.clear();
        this._drawPlane(planeGfx, 0, 0, pos.angle);

        // Draw dashed yellow route line up to current position
        routeGfx.clear();
        this._drawDashedRoute(routeGfx, waypoints, segments, totalLength, t);

        // Add trail dot every few frames
        if (trailDots.length === 0 || this._dist(trailDots[trailDots.length - 1], pos) > 8) {
          trailDots.push({ x: pos.x, y: pos.y });
        }

        // Draw trail dots
        trailGfx.clear();
        for (let i = 0; i < trailDots.length; i++) {
          const alpha = 0.15 + (i / trailDots.length) * 0.35;
          trailGfx.fillStyle(0x00FF44, alpha);
          trailGfx.fillCircle(trailDots[i].x, trailDots[i].y, 2);
        }
      },
      onComplete: () => {
        if (this.skipped) return;
        // Arrival: show destination label
        this._onArrival(route);
      },
    });
  }

  /** Get position and angle at t (0-1) along the multi-segment path */
  _getPositionOnPath(waypoints, segments, totalLength, t) {
    let targetDist = t * totalLength;
    let accumulated = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (accumulated + seg.len >= targetDist || i === segments.length - 1) {
        const segT = seg.len > 0 ? (targetDist - accumulated) / seg.len : 0;
        const clampT = Math.min(1, Math.max(0, segT));
        return {
          x: seg.from.x + (seg.to.x - seg.from.x) * clampT,
          y: seg.from.y + (seg.to.y - seg.from.y) * clampT,
          angle: Math.atan2(seg.to.y - seg.from.y, seg.to.x - seg.from.x),
        };
      }
      accumulated += seg.len;
    }

    // Fallback to last point
    const last = waypoints[waypoints.length - 1];
    return { x: last.x, y: last.y, angle: 0 };
  }

  /** Draw dashed yellow route line up to given t */
  _drawDashedRoute(gfx, waypoints, segments, totalLength, t) {
    const targetDist = t * totalLength;
    let accumulated = 0;
    const DASH = 10;
    const GAP = 6;
    let drawn = 0;

    gfx.lineStyle(2, 0xFFCC00, 0.7);

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const segEnd = Math.min(accumulated + seg.len, targetDist);
      const segDrawLen = segEnd - accumulated;

      if (segDrawLen <= 0) break;

      // Draw dashes along this segment
      const angle = Math.atan2(seg.to.y - seg.from.y, seg.to.x - seg.from.x);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      let d = 0;
      while (d < segDrawLen) {
        const dashStart = d;
        const dashEnd = Math.min(d + DASH, segDrawLen);

        const x1 = seg.from.x + cos * dashStart;
        const y1 = seg.from.y + sin * dashStart;
        const x2 = seg.from.x + cos * dashEnd;
        const y2 = seg.from.y + sin * dashEnd;

        gfx.beginPath();
        gfx.moveTo(x1, y1);
        gfx.lineTo(x2, y2);
        gfx.strokePath();

        d += DASH + GAP;
        drawn += DASH + GAP;
      }

      accumulated += seg.len;
      if (accumulated >= targetDist) break;
    }
  }

  /** Distance between two points */
  _dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // =============================================
  // PLANE ICON (green triangle with glow)
  // =============================================

  _drawPlane(gfx, x, y, angle) {
    const size = 10;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Nose
    const nx = x + cos * size;
    const ny = y + sin * size;
    // Left wing
    const lx = x + Math.cos(angle + 2.5) * size * 0.7;
    const ly = y + Math.sin(angle + 2.5) * size * 0.7;
    // Right wing
    const rx = x + Math.cos(angle - 2.5) * size * 0.7;
    const ry = y + Math.sin(angle - 2.5) * size * 0.7;
    // Tail
    const tx = x - cos * size * 0.5;
    const ty = y - sin * size * 0.5;

    // Glow
    gfx.fillStyle(0x00FF44, 0.15);
    gfx.fillCircle(x, y, 14);
    gfx.fillStyle(0x00FF44, 0.08);
    gfx.fillCircle(x, y, 22);

    // Body (bright green)
    gfx.fillStyle(0x00FF44, 0.9);
    gfx.beginPath();
    gfx.moveTo(nx, ny);
    gfx.lineTo(lx, ly);
    gfx.lineTo(tx, ty);
    gfx.lineTo(rx, ry);
    gfx.closePath();
    gfx.fill();

    // Engine glow
    gfx.fillStyle(0xFFCC00, 0.6);
    gfx.fillCircle(tx, ty, 3);
  }

  // =============================================
  // ARRIVAL SEQUENCE
  // =============================================

  _onArrival(route) {
    // Flash at destination
    this._arrivalFlash(route.dest.x, route.dest.y);

    // Show destination label with typewriter
    this.tweens.add({
      targets: this.destLabel,
      alpha: 1,
      duration: 300,
    });

    // Pause 1 second, then transition out
    this.time.delayedCall(1000, () => {
      if (!this.skipped) this._transitionOut();
    });
  }

  /** Flash effect at arrival */
  _arrivalFlash(x, y) {
    const flash = this.add.graphics().setDepth(25);
    flash.fillStyle(0x00FF44, 0.5);
    flash.fillCircle(x, y, 20);
    flash.fillStyle(0xFF4444, 0.3);
    flash.fillCircle(x, y, 40);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2, scaleY: 2,
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    this.cameras.main.shake(200, 0.005);
    SoundManager.get().playCinematicExplosion();
  }

  // =============================================
  // TRANSITION OUT (static/glitch + fade)
  // =============================================

  _transitionOut() {
    if (this.transitioning) return;
    this.transitioning = true;

    // Static/glitch effect: randomize rectangles
    const glitchGfx = this.add.graphics().setDepth(50);
    const glitchColors = [0x00FF44, 0xFF0000, 0xFFCC00, 0x0A1A0A, 0xFFFFFF];

    let glitchCount = 0;
    const glitchTimer = this.time.addEvent({
      delay: 33,  // ~30fps
      repeat: 5,  // 6 frames = ~0.2 seconds
      callback: () => {
        glitchGfx.clear();
        // Draw 15 random rectangles for static
        for (let i = 0; i < 15; i++) {
          const rx = Math.random() * W;
          const ry = Math.random() * H;
          const rw = 20 + Math.random() * 100;
          const rh = 2 + Math.random() * 8;
          const color = glitchColors[Math.floor(Math.random() * glitchColors.length)];
          glitchGfx.fillStyle(color, 0.3 + Math.random() * 0.4);
          glitchGfx.fillRect(rx, ry, rw, rh);
        }
        glitchCount++;
      },
    });

    // After glitch, fade to black and go to next scene
    this.time.delayedCall(200, () => {
      glitchGfx.clear();
      glitchGfx.destroy();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(350, () => {
        this.scene.start(this.nextScene, this.nextSceneData);
      });
    });
  }

  // =============================================
  // SKIP (immediate transition)
  // =============================================

  _goToNextScene() {
    if (this.skipped) return;
    this.skipped = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start(this.nextScene, this.nextSceneData);
    });
  }

  // =============================================
  // UPDATE LOOP
  // =============================================

  update() {
    // Mute toggle
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      SoundManager.get().toggleMute();
    }

    if (this.skipped) return;

    // Running timestamp
    if (this.timestampText) {
      const elapsed = ((Date.now() - this.timestampStart) / 1000).toFixed(1);
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      this.timestampText.setText(`${h}:${m}:${s}  T+${elapsed}s`);
    }

    // Skip with ESC, SPACE, or ENTER
    if (Phaser.Input.Keyboard.JustDown(this.escKey) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
        Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this._goToNextScene();
    }
  }
}
