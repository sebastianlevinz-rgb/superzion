// ═══════════════════════════════════════════════════════════════
// TouchControls — HTML/CSS overlay controls for mobile
// Completely independent of Phaser's camera/coordinate system.
// Uses native DOM touch events — guaranteed to work at any zoom.
// ═══════════════════════════════════════════════════════════════

const PRESETS = {
  // Cinematics: tap anywhere
  cinematic: { zones: [], tapAnywhere: true },

  // Menu: up/down + confirm
  menu: { zones: [
    { id: 'up', type: 'btn', label: '▲', pos: 'left-top', action: 'up' },
    { id: 'down', type: 'btn', label: '▼', pos: 'left-bot', action: 'down' },
    { id: 'ok', type: 'btn', label: 'OK', pos: 'right-center', action: 'primary', big: true },
  ]},

  // Platformer: left/right + jump + shoot
  platformer: { zones: [
    { id: 'left', type: 'zone', label: '◀', pos: 'far-left', action: 'left' },
    { id: 'right', type: 'zone', label: '▶', pos: 'mid-left', action: 'right' },
    { id: 'jump', type: 'btn', label: 'JUMP', pos: 'right-bot', action: 'jump', big: true },
    { id: 'fire', type: 'btn', label: 'FIRE', pos: 'right-top', action: 'primary' },
  ]},

  // Bomberman: 4-dir + bomb + dash + interact
  bomberman: { zones: [
    { id: 'up', type: 'dpad-up', label: '▲', action: 'up' },
    { id: 'down', type: 'dpad-down', label: '▼', action: 'down' },
    { id: 'left', type: 'dpad-left', label: '◀', action: 'left' },
    { id: 'right', type: 'dpad-right', label: '▶', action: 'right' },
    { id: 'bomb', type: 'btn', label: 'BOMB', pos: 'right-bot', action: 'primary', big: true },
    { id: 'dash', type: 'btn', label: 'DASH', pos: 'right-mid', action: 'secondary' },
    { id: 'act', type: 'btn', label: 'ACT', pos: 'right-top', action: 'tertiary' },
  ]},

  // Stealth: 4-dir + scan + sprint + distract + interact
  stealth: { zones: [
    { id: 'up', type: 'dpad-up', label: '▲', action: 'up' },
    { id: 'down', type: 'dpad-down', label: '▼', action: 'down' },
    { id: 'left', type: 'dpad-left', label: '◀', action: 'left' },
    { id: 'right', type: 'dpad-right', label: '▶', action: 'right' },
    { id: 'scan', type: 'btn', label: 'SCAN', pos: 'right-bot', action: 'primary', big: true },
    { id: 'run', type: 'btn', label: 'RUN', pos: 'right-mid', action: 'secondary' },
    { id: 'act', type: 'btn', label: 'ACT', pos: 'right-top', action: 'tertiary' },
    { id: 'dist', type: 'btn', label: 'DIST', pos: 'right-far', action: 'special' },
  ]},

  // Aerial: 4-dir + bomb + chaff
  aerial: { zones: [
    { id: 'up', type: 'dpad-up', label: '▲', action: 'up' },
    { id: 'down', type: 'dpad-down', label: '▼', action: 'down' },
    { id: 'left', type: 'dpad-left', label: '◀', action: 'left' },
    { id: 'right', type: 'dpad-right', label: '▶', action: 'right' },
    { id: 'bomb', type: 'btn', label: 'BOMB', pos: 'right-bot', action: 'primary', big: true },
    { id: 'chaff', type: 'btn', label: 'CHAFF', pos: 'right-top', action: 'secondary' },
  ]},

  // Drone phase 1: 4-dir only
  drone: { zones: [
    { id: 'up', type: 'dpad-up', label: '▲', action: 'up' },
    { id: 'down', type: 'dpad-down', label: '▼', action: 'down' },
    { id: 'left', type: 'dpad-left', label: '◀', action: 'left' },
    { id: 'right', type: 'dpad-right', label: '▶', action: 'right' },
  ]},

  // Combat: 4-dir + shoot + missile + dash
  combat: { zones: [
    { id: 'up', type: 'dpad-up', label: '▲', action: 'up' },
    { id: 'down', type: 'dpad-down', label: '▼', action: 'down' },
    { id: 'left', type: 'dpad-left', label: '◀', action: 'left' },
    { id: 'right', type: 'dpad-right', label: '▶', action: 'right' },
    { id: 'fire', type: 'btn', label: 'FIRE', pos: 'right-bot', action: 'primary', big: true },
    { id: 'msl', type: 'btn', label: 'MSL', pos: 'right-top', action: 'special' },
    { id: 'dash', type: 'btn', label: 'DASH', pos: 'right-mid', action: 'secondary' },
  ]},

  // Boss: 4-dir + shoot + heavy + dodge + pulse
  boss: { zones: [
    { id: 'up', type: 'dpad-up', label: '▲', action: 'up' },
    { id: 'down', type: 'dpad-down', label: '▼', action: 'down' },
    { id: 'left', type: 'dpad-left', label: '◀', action: 'left' },
    { id: 'right', type: 'dpad-right', label: '▶', action: 'right' },
    { id: 'fire', type: 'btn', label: 'FIRE', pos: 'right-bot', action: 'primary', big: true },
    { id: 'bomb', type: 'btn', label: 'BOMB', pos: 'right-mid', action: 'special' },
    { id: 'roll', type: 'btn', label: 'ROLL', pos: 'right-top', action: 'secondary' },
    { id: 'pulse', type: 'btn', label: 'PULSE', pos: 'right-far', action: 'tertiary' },
  ]},
};

// CSS positions for buttons
const BTN_POSITIONS = {
  'right-bot':    { right: '10px', bottom: '15px' },
  'right-mid':    { right: '80px', bottom: '70px' },
  'right-top':    { right: '10px', bottom: '120px' },
  'right-far':    { right: '80px', bottom: '170px' },
  'right-center': { right: '20px', bottom: '40%' },
  'left-top':     { left: '20px', bottom: '55%' },
  'left-bot':     { left: '20px', bottom: '35%' },
  // Platformer zones: split left half into two vertical strips
  'far-left':     { left: '0', top: '0', width: '25%', height: '100%' },
  'mid-left':     { left: '25%', top: '0', width: '25%', height: '100%' },
};

// D-pad positions (centered on left side)
const DPAD_CENTER_X = '18%';
const DPAD_CENTER_Y = '68%';
const DPAD_SIZE = '18vw';
const DPAD_POSITIONS = {
  'dpad-up':    { transform: 'translate(-50%, -180%)' },
  'dpad-down':  { transform: 'translate(-50%, 80%)' },
  'dpad-left':  { transform: 'translate(-180%, -50%)' },
  'dpad-right': { transform: 'translate(80%, -50%)' },
};

export default class TouchControls {
  constructor(scene, preset) {
    this.scene = scene;
    this._presetName = preset;

    // Action states
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.primary = false;
    this.secondary = false;
    this.tertiary = false;
    this.special = false;
    this.jump = false;
    this.pause = false;

    // DOM container
    this._container = document.createElement('div');
    this._container.id = 'touch-controls';
    this._container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 10000; pointer-events: none; user-select: none;
      -webkit-user-select: none; touch-action: none;
    `;
    document.body.appendChild(this._container);

    this._elements = [];
    this._build(preset);
  }

  _build(preset) {
    const def = PRESETS[preset] || PRESETS.cinematic;

    if (def.tapAnywhere) {
      this._createTapZone();
    }

    // Pause button (always)
    this._createPauseBtn();

    for (const z of (def.zones || [])) {
      if (z.type === 'zone') {
        this._createTouchZone(z);
      } else if (z.type === 'btn') {
        this._createActionBtn(z);
      } else if (z.type.startsWith('dpad-')) {
        this._createDpadBtn(z);
      }
    }
  }

  // ── Tap anywhere (cinematics) ─────────────────────────────────

  _createTapZone() {
    const el = this._makeEl('div');
    el.style.cssText += `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: auto;
    `;
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.primary = true;
      setTimeout(() => { this.primary = false; }, 80);
    }, { passive: false });
  }

  // ── D-Pad buttons ─────────────────────────────────────────────

  _createDpadBtn(z) {
    const el = this._makeEl('div');
    const pos = DPAD_POSITIONS[z.type];
    el.style.cssText += `
      position: absolute;
      left: ${DPAD_CENTER_X}; top: ${DPAD_CENTER_Y};
      width: ${DPAD_SIZE}; height: ${DPAD_SIZE};
      max-width: 70px; max-height: 70px;
      ${pos.transform ? `transform: ${pos.transform};` : ''}
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.4);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-family: monospace; font-size: 22px; color: rgba(255,255,255,0.7);
      font-weight: bold;
      pointer-events: auto;
    `;
    el.textContent = z.label;

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this[z.action] = true;
      el.style.background = 'rgba(255,255,255,0.4)';
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      this[z.action] = false;
      el.style.background = 'rgba(255,255,255,0.15)';
    }, { passive: false });

    el.addEventListener('touchcancel', () => {
      this[z.action] = false;
      el.style.background = 'rgba(255,255,255,0.15)';
    });
  }

  // ── Touch zones (platformer left/right) ───────────────────────

  _createTouchZone(z) {
    const pos = BTN_POSITIONS[z.pos] || {};
    const el = this._makeEl('div');
    el.style.cssText += `
      position: absolute;
      ${pos.left ? `left: ${pos.left};` : ''}
      ${pos.right ? `right: ${pos.right};` : ''}
      ${pos.top ? `top: ${pos.top};` : ''}
      ${pos.bottom ? `bottom: ${pos.bottom};` : ''}
      ${pos.width ? `width: ${pos.width};` : ''}
      ${pos.height ? `height: ${pos.height};` : ''}
      background: rgba(255,255,255,0.04);
      display: flex; align-items: flex-end; justify-content: center;
      padding-bottom: 20%;
      font-family: monospace; font-size: 32px; color: rgba(255,255,255,0.25);
      font-weight: bold;
      pointer-events: auto;
    `;
    el.textContent = z.label;

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this[z.action] = true;
      el.style.background = 'rgba(255,255,255,0.15)';
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      this[z.action] = false;
      el.style.background = 'rgba(255,255,255,0.04)';
    }, { passive: false });

    el.addEventListener('touchcancel', () => {
      this[z.action] = false;
      el.style.background = 'rgba(255,255,255,0.04)';
    });
  }

  // ── Action buttons ────────────────────────────────────────────

  _createActionBtn(z) {
    const pos = BTN_POSITIONS[z.pos] || {};
    const size = z.big ? '70px' : '56px';
    const fontSize = z.big ? '13px' : '11px';
    const el = this._makeEl('div');
    el.style.cssText += `
      position: absolute;
      ${pos.right ? `right: ${pos.right};` : ''}
      ${pos.left ? `left: ${pos.left};` : ''}
      ${pos.bottom ? `bottom: ${pos.bottom};` : ''}
      ${pos.top ? `top: ${pos.top};` : ''}
      width: ${size}; height: ${size};
      border-radius: 50%;
      background: rgba(255,100,100,0.35);
      border: 2px solid rgba(255,255,255,0.5);
      display: flex; align-items: center; justify-content: center;
      font-family: monospace; font-size: ${fontSize}; color: #fff;
      font-weight: bold;
      pointer-events: auto;
    `;
    el.textContent = z.label;

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this[z.action] = true;
      el.style.background = 'rgba(255,150,150,0.65)';
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      this[z.action] = false;
      el.style.background = 'rgba(255,100,100,0.35)';
    }, { passive: false });

    el.addEventListener('touchcancel', () => {
      this[z.action] = false;
      el.style.background = 'rgba(255,100,100,0.35)';
    });
  }

  // ── Pause button ──────────────────────────────────────────────

  _createPauseBtn() {
    const el = this._makeEl('div');
    el.style.cssText += `
      position: absolute; top: 8px; right: 8px;
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(0,0,0,0.4);
      border: 2px solid rgba(255,255,255,0.4);
      display: flex; align-items: center; justify-content: center;
      font-family: monospace; font-size: 16px; color: #fff;
      font-weight: bold;
      pointer-events: auto;
    `;
    el.textContent = '||';

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.pause = true;
      setTimeout(() => { this.pause = false; }, 120);
    }, { passive: false });
  }

  // ── Helpers ───────────────────────────────────────────────────

  _makeEl(tag) {
    const el = document.createElement(tag);
    el.style.cssText = 'user-select: none; -webkit-user-select: none; touch-action: none;';
    this._container.appendChild(el);
    this._elements.push(el);
    return el;
  }

  /** No-op — state is already live via DOM events */
  updateState() {}

  destroy() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._elements = [];
  }
}
