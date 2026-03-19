// =================================================================
// FlightRouteScene -- Mini flight animation from Israel to destination
// Plays between level cinematic and gameplay scene
// =================================================================

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';

const W = 960;
const H = 540;

// Israel origin (east Mediterranean coast)
const ISRAEL = { x: 420, y: 280 };

// Route destinations per level
const ROUTES = {
  1: { city: 'TEHRAN',         dest: { x: 750, y: 200 } },
  2: { city: 'BEIRUT',         dest: { x: 430, y: 240 } },
  3: { city: 'LEBANON COAST',  dest: { x: 400, y: 220 } },
  4: { city: 'GAZA',           dest: { x: 400, y: 310 } },
  5: { city: 'NATANZ',         dest: { x: 700, y: 250 } },
  6: { city: 'ENEMY FORTRESS', dest: { x: 450, y: 200 } },
};

// Simplified Middle East landmass polygons (approximate shapes)
// Each is an array of {x,y} points forming a closed polygon
const LANDMASSES = [
  // Turkey (north)
  { color: 0x1a2a18, points: [220,60, 480,40, 560,80, 580,130, 520,150, 440,140, 380,160, 300,140, 220,100] },
  // Syria / Iraq block
  { color: 0x1c2c1a, points: [440,140, 520,150, 580,130, 640,140, 700,170, 720,240, 680,280, 600,300, 520,300, 460,280, 430,240, 420,200, 400,170] },
  // Iran (large, east)
  { color: 0x1a2818, points: [640,140, 720,100, 820,110, 900,150, 940,220, 920,320, 860,380, 780,400, 720,380, 680,320, 680,280, 700,240, 720,170] },
  // Saudi Arabia / Arabian Peninsula (south)
  { color: 0x1e2a1a, points: [420,320, 460,280, 520,300, 600,300, 680,320, 720,380, 740,440, 700,500, 600,540, 500,540, 400,500, 360,440, 380,360] },
  // Egypt (southwest)
  { color: 0x1c2818, points: [140,240, 200,220, 260,240, 300,260, 340,280, 380,300, 380,360, 360,440, 320,500, 260,540, 180,540, 140,480, 120,400, 110,320] },
  // Israel + Lebanon + Jordan strip (highlighted separately)
  { color: 0x182418, points: [380,170, 430,160, 440,200, 440,240, 430,280, 420,320, 380,360, 360,340, 350,300, 360,260, 370,220] },
  // Cyprus (island)
  { color: 0x1a2a18, points: [340,130, 380,125, 400,135, 380,145, 340,140] },
];

// Mediterranean Sea highlight area (slightly brighter blue)
const MEDITERRANEAN = [
  { x: 80, y: 60 }, { x: 220, y: 60 }, { x: 340, y: 100 },
  { x: 400, y: 135 }, { x: 420, y: 160 }, { x: 400, y: 170 },
  { x: 370, y: 220 }, { x: 350, y: 260 }, { x: 300, y: 260 },
  { x: 260, y: 240 }, { x: 200, y: 220 }, { x: 140, y: 240 },
  { x: 80, y: 220 }, { x: 40, y: 160 },
];

// Israel highlight polygon (small, brighter)
const ISRAEL_SHAPE = [
  { x: 405, y: 245 }, { x: 420, y: 235 }, { x: 430, y: 245 },
  { x: 430, y: 270 }, { x: 425, y: 290 }, { x: 420, y: 310 },
  { x: 410, y: 300 }, { x: 405, y: 275 },
];

export default class FlightRouteScene extends Phaser.Scene {
  constructor() { super('FlightRouteScene'); }

  create(data) {
    const level = data.level || 1;
    const nextScene = data.nextScene || 'GameScene';
    const route = ROUTES[level] || ROUTES[1];
    this.nextScene = nextScene;
    this.skipped = false;

    this.cameras.main.setBackgroundColor('#0a0a14');
    this.cameras.main.fadeIn(300, 10, 10, 20);

    // -- Keys --
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.escKey = this.input.keyboard.addKey('ESC');
    this.enterKey = this.input.keyboard.addKey('ENTER');
    this.mKey = this.input.keyboard.addKey('M');

    // -- Draw map --
    const mapGfx = this.add.graphics().setDepth(1);

    // Mediterranean Sea
    mapGfx.fillStyle(0x0e1a2e, 0.6);
    mapGfx.beginPath();
    mapGfx.moveTo(MEDITERRANEAN[0].x, MEDITERRANEAN[0].y);
    for (let i = 1; i < MEDITERRANEAN.length; i++) {
      mapGfx.lineTo(MEDITERRANEAN[i].x, MEDITERRANEAN[i].y);
    }
    mapGfx.closePath();
    mapGfx.fill();

    // Landmasses
    for (const land of LANDMASSES) {
      mapGfx.fillStyle(land.color, 0.7);
      mapGfx.beginPath();
      mapGfx.moveTo(land.points[0], land.points[1]);
      for (let i = 2; i < land.points.length; i += 2) {
        mapGfx.lineTo(land.points[i], land.points[i + 1]);
      }
      mapGfx.closePath();
      mapGfx.fill();
    }

    // Israel highlight
    mapGfx.fillStyle(0x4488ff, 0.5);
    mapGfx.beginPath();
    mapGfx.moveTo(ISRAEL_SHAPE[0].x, ISRAEL_SHAPE[0].y);
    for (let i = 1; i < ISRAEL_SHAPE.length; i++) {
      mapGfx.lineTo(ISRAEL_SHAPE[i].x, ISRAEL_SHAPE[i].y);
    }
    mapGfx.closePath();
    mapGfx.fill();

    // Israel glow
    mapGfx.fillStyle(0x4488ff, 0.15);
    mapGfx.fillCircle(ISRAEL.x, ISRAEL.y, 30);
    mapGfx.fillStyle(0x4488ff, 0.08);
    mapGfx.fillCircle(ISRAEL.x, ISRAEL.y, 50);

    // Israel label
    this.add.text(ISRAEL.x, ISRAEL.y + 35, 'ISRAEL', {
      fontFamily: 'monospace', fontSize: '10px', color: '#4488ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#4488ff', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(5);

    // Destination pulse
    const destGfx = this.add.graphics().setDepth(2);
    destGfx.fillStyle(0xff4444, 0.3);
    destGfx.fillCircle(route.dest.x, route.dest.y, 8);
    this.tweens.add({
      targets: destGfx, alpha: { from: 1, to: 0.3 },
      duration: 400, yoyo: true, repeat: -1,
    });

    // Destination label
    this.add.text(route.dest.x, route.dest.y + 20, route.city, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ff6644',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff4444', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(5);

    // Country borders - faint grid lines for map texture
    const gridGfx = this.add.graphics().setDepth(0).setAlpha(0.08);
    for (let x = 0; x < W; x += 40) {
      gridGfx.lineStyle(1, 0x335566);
      gridGfx.lineBetween(x, 0, x, H);
    }
    for (let y = 0; y < H; y += 40) {
      gridGfx.lineStyle(1, 0x335566);
      gridGfx.lineBetween(0, y, W, y);
    }

    // -- Flight route animation --
    const dx = route.dest.x - ISRAEL.x;
    const dy = route.dest.y - ISRAEL.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Dotted route line (drawn progressively)
    const routeGfx = this.add.graphics().setDepth(10);
    const totalDots = Math.floor(dist / 8);
    const FLIGHT_DURATION = 3000;

    // Plane icon (triangle)
    const planeGfx = this.add.graphics().setDepth(15);
    this._drawPlane(planeGfx, 0, 0, angle);
    planeGfx.x = ISRAEL.x;
    planeGfx.y = ISRAEL.y;

    // Trail glow
    const trailGfx = this.add.graphics().setDepth(9);

    // -- "EN ROUTE TO [CITY]" header --
    const headerText = this.add.text(W / 2, 30, `EN ROUTE TO ${route.city}`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffcc00', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffcc00', blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(20).setAlpha(0);

    this.tweens.add({ targets: headerText, alpha: 1, duration: 600 });

    // Mission level indicator
    this.add.text(W / 2, 60, `MISSION ${level}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#666666',
    }).setOrigin(0.5).setDepth(20);

    // Skip hint
    const skipHint = this.add.text(W - 16, H - 14, 'SPACE TO SKIP', {
      fontFamily: 'monospace', fontSize: '10px', color: '#444444',
    }).setOrigin(1, 1).setDepth(20);

    // -- Animate flight --
    let progress = { t: 0 };

    this.tweens.add({
      targets: progress,
      t: 1,
      duration: FLIGHT_DURATION,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (this.skipped) return;
        const t = progress.t;

        // Update plane position
        const px = ISRAEL.x + dx * t;
        const py = ISRAEL.y + dy * t;
        planeGfx.x = px;
        planeGfx.y = py;

        // Draw dotted route up to current position
        routeGfx.clear();
        const dotsToShow = Math.floor(totalDots * t);
        for (let i = 0; i < dotsToShow; i++) {
          const dt = i / totalDots;
          const dotX = ISRAEL.x + dx * dt;
          const dotY = ISRAEL.y + dy * dt;
          routeGfx.fillStyle(0xffcc00, 0.4 + dt * 0.4);
          routeGfx.fillCircle(dotX, dotY, 1.5);
        }

        // Trail glow behind plane
        trailGfx.clear();
        const trailLen = 5;
        for (let i = 0; i < trailLen; i++) {
          const tt = Math.max(0, t - (i * 0.02));
          const tx = ISRAEL.x + dx * tt;
          const ty = ISRAEL.y + dy * tt;
          trailGfx.fillStyle(0xffcc00, 0.2 - i * 0.035);
          trailGfx.fillCircle(tx, ty, 6 - i);
        }
      },
      onComplete: () => {
        if (this.skipped) return;
        // Arrival flash
        this._arrivalFlash(route.dest.x, route.dest.y);
        // Transition after brief pause
        this.time.delayedCall(700, () => {
          if (!this.skipped) this._goToNextScene();
        });
      },
    });

    // Subtle radar sweep effect from Israel
    this._radarSweep(ISRAEL.x, ISRAEL.y);
  }

  /** Draw a small plane icon pointing in the given angle */
  _drawPlane(gfx, x, y, angle) {
    gfx.clear();
    // Plane body (rotated triangle)
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
    gfx.fillStyle(0xffcc00, 0.2);
    gfx.fillCircle(x, y, 12);

    // Body
    gfx.fillStyle(0xffffff, 0.9);
    gfx.beginPath();
    gfx.moveTo(nx, ny);
    gfx.lineTo(lx, ly);
    gfx.lineTo(tx, ty);
    gfx.lineTo(rx, ry);
    gfx.closePath();
    gfx.fill();

    // Engine glow
    gfx.fillStyle(0xffaa00, 0.6);
    gfx.fillCircle(tx, ty, 3);
  }

  /** Flash effect at arrival */
  _arrivalFlash(x, y) {
    const flash = this.add.graphics().setDepth(25);
    flash.fillStyle(0xffffff, 0.6);
    flash.fillCircle(x, y, 20);
    flash.fillStyle(0xff4444, 0.3);
    flash.fillCircle(x, y, 40);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2, scaleY: 2,
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Camera shake
    this.cameras.main.shake(200, 0.005);
    SoundManager.get().playExplosion();
  }

  /** Subtle rotating radar sweep from origin */
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
        sweep.fillStyle(0x4488ff, 0.3);
        sweep.beginPath();
        sweep.moveTo(cx, cy);
        sweep.arc(cx, cy, 60, sweepAngle.a, sweepAngle.a + 0.4, false);
        sweep.closePath();
        sweep.fill();
      },
    });
  }

  /** Transition to the actual gameplay scene */
  _goToNextScene() {
    if (this.skipped) return;
    this.skipped = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(350, () => this.scene.start(this.nextScene));
  }

  update() {
    // Mute toggle
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      const muted = SoundManager.get().toggleMute();
      // If MusicManager available
      try {
        const { default: MusicManager } = { default: null };
      } catch (e) { /* no-op */ }
    }

    if (this.skipped) return;

    // Skip with SPACE, ENTER, or ESC
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
        Phaser.Input.Keyboard.JustDown(this.enterKey) ||
        Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this._goToNextScene();
    }
  }
}
