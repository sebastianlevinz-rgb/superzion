// ═══════════════════════════════════════════════════════════════
// InputManager — Unified keyboard + touch input abstraction
// Each scene creates an InputManager with the actions it needs.
// On desktop: keyboard keys are mapped to actions.
// On mobile: TouchControls provides virtual buttons.
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import TouchControls from './TouchControls.js';

/** Detect if running on a touch-primary device */
function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

// Shared flag — computed once
let _isMobile = null;
export function isMobile() {
  if (_isMobile === null) _isMobile = isTouchDevice();
  return _isMobile;
}

/**
 * Preset button layouts for different scene types.
 * Each preset defines which action buttons appear on the right side.
 * The D-pad (left/right/up/down) is always shown for gameplay presets.
 */
export const INPUT_PRESETS = {
  // Cinematics: just tap anywhere or single button
  cinematic: {
    showDpad: false,
    buttons: [
      { action: 'primary', label: '>', color: 0xFFD700 },   // advance text
    ],
    tapAnywhere: true,  // tap anywhere = primary
  },

  // Menu: d-pad up/down + confirm
  menu: {
    showDpad: 'vertical',  // only up/down
    buttons: [
      { action: 'primary', label: 'OK', color: 0xFFD700 },
    ],
  },

  // Platformer: left/right + jump + shoot
  platformer: {
    showDpad: 'horizontal',  // only left/right
    buttons: [
      { action: 'jump', label: 'JUMP', color: 0x00CCFF, size: 'large' },
      { action: 'primary', label: 'FIRE', color: 0xFF4444 },
    ],
  },

  // Bomberman: 4-dir d-pad + bomb + dodge + interact
  bomberman: {
    showDpad: true,
    buttons: [
      { action: 'primary', label: 'BOMB', color: 0xFF4444, size: 'large' },
      { action: 'secondary', label: 'DASH', color: 0x00CCFF },
      { action: 'tertiary', label: 'ACT', color: 0x44FF44 },
    ],
  },

  // Stealth (PortSwap): 4-dir + scan + sprint + distract + interact
  stealth: {
    showDpad: true,
    buttons: [
      { action: 'primary', label: 'SCAN', color: 0x00CCFF, size: 'large' },
      { action: 'secondary', label: 'RUN', color: 0xFF8800 },
      { action: 'tertiary', label: 'ACT', color: 0x44FF44 },
      { action: 'special', label: 'DIST', color: 0xCC44FF },
    ],
  },

  // Aerial (Bomber/B2): 4-dir + bomb + chaff
  aerial: {
    showDpad: true,
    buttons: [
      { action: 'primary', label: 'BOMB', color: 0xFF4444, size: 'large' },
      { action: 'secondary', label: 'CHAFF', color: 0x00CCFF },
    ],
  },

  // Drone phase 1: 4-dir only
  drone: {
    showDpad: true,
    buttons: [],
  },

  // Drone boss / full combat: 4-dir + shoot + missile + dash
  combat: {
    showDpad: true,
    buttons: [
      { action: 'primary', label: 'FIRE', color: 0xFF4444, size: 'large' },
      { action: 'special', label: 'MSL', color: 0xFF8800 },
      { action: 'secondary', label: 'DASH', color: 0x00CCFF },
    ],
  },

  // Boss fight: 4-dir + shoot + heavy + dodge + pulse
  boss: {
    showDpad: true,
    buttons: [
      { action: 'primary', label: 'FIRE', color: 0xFF4444, size: 'large' },
      { action: 'special', label: 'BOMB', color: 0xFF8800 },
      { action: 'secondary', label: 'ROLL', color: 0x00CCFF },
      { action: 'tertiary', label: 'PULSE', color: 0xCC44FF },
    ],
  },
};

export default class InputManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} opts
   * @param {string} opts.preset - One of INPUT_PRESETS keys
   * @param {object} [opts.keyMap] - Map of action names to keyboard key names
   *   e.g. { primary: 'SPACE', secondary: 'SHIFT', tertiary: 'E', special: 'X' }
   */
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.mobile = isMobile();
    this.preset = opts.preset || 'cinematic';

    // Action states — read these in update()
    // .down = currently held, .justDown = pressed this frame
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.primary = false;       // SPACE — bomb/shoot/advance/confirm
    this.secondary = false;     // SHIFT — dodge/sprint/dash/roll
    this.tertiary = false;      // E/Q — interact/distract/pulse
    this.special = false;       // X — missile/heavy bomb
    this.jump = false;          // separate jump for platformer (UP or dedicated)
    this.pause = false;         // ESC
    this.mute = false;          // M
    this.skip = false;          // P — skip/debug

    // JustDown tracking (single-frame press detection)
    this._justDown = {};
    this._prevDown = {};
    for (const action of ['left','right','up','down','primary','secondary','tertiary','special','jump','pause','mute','skip']) {
      this._justDown[action] = false;
      this._prevDown[action] = false;
    }

    // Setup keyboard (always — even on mobile, for debugging)
    this._keys = {};
    this._setupKeyboard(opts.keyMap || {});

    // Setup touch controls on mobile (pass preset name as string — TouchControls has its own presets)
    this.touchControls = null;
    if (this.mobile) {
      this.touchControls = new TouchControls(scene, this.preset);
    }
  }

  _setupKeyboard(keyMap) {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    // Direction keys (always arrows + WASD)
    this._keys.left = kb.addKey('LEFT');
    this._keys.right = kb.addKey('RIGHT');
    this._keys.up = kb.addKey('UP');
    this._keys.down = kb.addKey('DOWN');
    this._keys.w = kb.addKey('W');
    this._keys.a = kb.addKey('A');
    this._keys.s = kb.addKey('S');
    this._keys.d = kb.addKey('D');

    // Action keys (configurable)
    this._keys.primary = kb.addKey(keyMap.primary || 'SPACE');
    this._keys.secondary = kb.addKey(keyMap.secondary || 'SHIFT');
    this._keys.tertiary = kb.addKey(keyMap.tertiary || 'E');
    this._keys.special = kb.addKey(keyMap.special || 'X');

    // System keys
    this._keys.pause = kb.addKey('ESC');
    this._keys.mute = kb.addKey('M');
    this._keys.skip = kb.addKey('P');
    this._keys.enter = kb.addKey('ENTER');
  }

  /**
   * Call at the START of each scene's update().
   * Updates all action states from keyboard + touch.
   */
  update() {
    // Save previous states for justDown detection
    for (const action of ['left','right','up','down','primary','secondary','tertiary','special','jump','pause','mute','skip']) {
      this._prevDown[action] = this[action];
    }

    // Read raw keyboard state (use _rawIsDown to avoid circular reads from enhanced keys)
    const raw = (key) => key ? (key._rawIsDown !== undefined ? key._rawIsDown : key.isDown) : false;
    const k = this._keys;
    this.left = raw(k.left) || raw(k.a);
    this.right = raw(k.right) || raw(k.d);
    this.up = raw(k.up) || raw(k.w);
    this.down = raw(k.down) || raw(k.s);
    this.primary = raw(k.primary);
    this.secondary = raw(k.secondary);
    this.tertiary = raw(k.tertiary);
    this.special = raw(k.special);
    this.jump = raw(k.up) || raw(k.w);
    this.pause = raw(k.pause);
    this.mute = raw(k.mute);
    this.skip = raw(k.skip);

    // Also check ENTER as alias for primary in some contexts
    if (raw(k.enter)) this.primary = true;

    // Merge touch input (OR with keyboard)
    if (this.touchControls) {
      this.touchControls.updateState(); // read joystick directions
      const t = this.touchControls;
      if (t.left) this.left = true;
      if (t.right) this.right = true;
      if (t.up) this.up = true;
      if (t.down) this.down = true;
      if (t.primary) this.primary = true;
      if (t.secondary) this.secondary = true;
      if (t.tertiary) this.tertiary = true;
      if (t.special) this.special = true;
      if (t.jump) { this.jump = true; this.up = true; }
      if (t.pause) this.pause = true;
    }

    // Compute justDown (went from false to true this frame)
    for (const action of ['left','right','up','down','primary','secondary','tertiary','special','jump','pause','mute','skip']) {
      this._justDown[action] = this[action] && !this._prevDown[action];
    }
  }

  /** Returns true only on the frame the action was first pressed */
  justDown(action) {
    return this._justDown[action] || false;
  }

  /** Change the touch control preset at runtime (e.g., when phase changes) */
  setPreset(presetName) {
    this.preset = presetName;
    if (this.touchControls) {
      this.touchControls.destroy();
      this.touchControls = new TouchControls(this.scene, presetName);
    }
  }

  /**
   * Create enhanced key objects that match the this.keys = { left, right, ... }
   * pattern used by BomberScene/BossScene/DroneScene/etc.
   * Each key object has .isDown getter that ORs keyboard + touch.
   * This allows existing code like `this.keys.left.isDown` to work with touch.
   *
   * @param {object} keyboardKeys - The original keyboard keys object
   *   e.g. { left: addKey('LEFT'), right: addKey('RIGHT'), space: addKey('SPACE'), ... }
   * @param {object} mapping - Maps key names to InputManager actions
   *   e.g. { left: 'left', right: 'right', space: 'primary', shift: 'secondary', ... }
   * @returns {object} Enhanced keys object with .isDown getters
   */
  enhanceKeys(keyboardKeys, mapping) {
    const im = this;
    for (const [keyName, kbKey] of Object.entries(keyboardKeys)) {
      const action = mapping[keyName];
      if (action && kbKey) {
        // Store original isDown descriptor
        const origDesc = Object.getOwnPropertyDescriptor(kbKey, 'isDown') ||
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(kbKey), 'isDown');
        // Override isDown on the actual Phaser Key instance to also check touch
        // Replace isDown with getter+setter that also checks touch
        let _isDownValue = kbKey.isDown || false;
        Object.defineProperty(kbKey, 'isDown', {
          get() {
            return _isDownValue || im[action] || false;
          },
          set(v) {
            _isDownValue = v;
          },
          configurable: true,
        });
        // Expose raw keyboard-only state so InputManager.update() avoids circular reads
        Object.defineProperty(kbKey, '_rawIsDown', {
          get() { return _isDownValue; },
          configurable: true,
        });

        // Also override _justDown to support touch JustDown detection
        // When Phaser reads _justDown, it immediately sets it to false.
        // We mirror that behavior for touch: consume the touch justDown on read.
        let _justDownValue = false;
        Object.defineProperty(kbKey, '_justDown', {
          get() {
            const touchJD = im._justDown[action] || false;
            if (touchJD) {
              // Consume the touch justDown so it's only true once
              im._justDown[action] = false;
              return true;
            }
            return _justDownValue;
          },
          set(v) {
            _justDownValue = v;
          },
          configurable: true,
        });
      }
    }
    // Return the same object (keys are modified in-place)
    return keyboardKeys;
  }

  /** Destroy touch controls and clean up */
  destroy() {
    if (this.touchControls) {
      this.touchControls.destroy();
      this.touchControls = null;
    }
  }
}
