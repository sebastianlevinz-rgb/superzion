// ===================================================================
// Touch Input System -- Kaplay-native multi-touch controls
// Uses raw browser touch events on canvas for reliable coordinates.
// NO DOM overlays -- all visuals are Kaplay game objects with k.fixed()
// ===================================================================

const W = 960, H = 540;

export function isMobile() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Create touch controls for a scene.
 * @param {object} k - Kaplay instance
 * @param {string} preset - 'platformer', 'bomberman', 'stealth', 'aerial', 'drone', 'combat', 'boss', 'cinematic', 'menu'
 * @returns {object|null} state - touch state object, or null if not mobile
 */
export function createTouchControls(k, preset) {
  if (!isMobile()) return null;

  const state = {
    left: false, right: false, up: false, down: false,
    primary: false, secondary: false, tertiary: false, special: false,
    jump: false, pause: false,
    _justPressed: {},
    justPressed(action) {
      const v = this._justPressed[action] || false;
      this._justPressed[action] = false;
      return v;
    },
  };

  const buttons = []; // { x, y, hw, hh, action, obj, label, round }
  const activeTouches = new Map(); // identifier -> action
  const objects = []; // for cleanup

  // Get button definitions based on preset
  const defs = getPresetButtons(preset);

  // Create visual buttons as Kaplay game objects
  for (const def of defs) {
    const size = def.big ? 70 : 56;
    const hw = (def.w || size) / 2;
    const hh = (def.h || size) / 2;

    let obj;
    if (def.round !== false) {
      obj = k.add([
        k.circle(hw),
        k.pos(def.x, def.y),
        k.anchor("center"),
        k.color(...(def.color || [255, 255, 255])),
        k.opacity(0.25),
        k.fixed(),
        k.z(999),
      ]);
    } else {
      obj = k.add([
        k.rect(def.w || size, def.h || size, { radius: 6 }),
        k.pos(def.x, def.y),
        k.anchor("center"),
        k.color(...(def.color || [255, 255, 255])),
        k.opacity(0.25),
        k.fixed(),
        k.z(999),
      ]);
    }
    objects.push(obj);

    // Label
    const label = k.add([
      k.text(def.label, { size: def.big ? 14 : 11, font: "monospace" }),
      k.pos(def.x, def.y),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.opacity(0.7),
      k.fixed(),
      k.z(1000),
    ]);
    objects.push(label);

    buttons.push({ x: def.x, y: def.y, hw, hh, action: def.action, obj, round: def.round !== false });
  }

  // Pause button (always present for gameplay presets)
  if (preset !== 'cinematic' && preset !== 'menu') {
    const pauseObj = k.add([
      k.circle(18),
      k.pos(W - 35, 30),
      k.anchor("center"),
      k.color(100, 100, 100),
      k.opacity(0.25),
      k.fixed(),
      k.z(999),
    ]);
    objects.push(pauseObj);
    const pauseLabel = k.add([
      k.text("||", { size: 12, font: "monospace" }),
      k.pos(W - 35, 30),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.opacity(0.6),
      k.fixed(),
      k.z(1000),
    ]);
    objects.push(pauseLabel);
    buttons.push({ x: W - 35, y: 30, hw: 18, hh: 18, action: 'pause', obj: pauseObj, round: true });
  }

  // -- Raw touch event handling (multi-touch, correct coordinates) --
  const canvas = k.canvas;

  function touchToGame(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) / rect.width * W,
      y: (touch.clientY - rect.top) / rect.height * H,
    };
  }

  function hitTest(gx, gy) {
    // Extra padding for easier touch targets
    const PAD = 12;
    for (const btn of buttons) {
      if (btn.round) {
        const dx = gx - btn.x, dy = gy - btn.y;
        if (Math.sqrt(dx * dx + dy * dy) < btn.hw + PAD) return btn;
      } else {
        if (gx > btn.x - btn.hw - PAD && gx < btn.x + btn.hw + PAD &&
            gy > btn.y - btn.hh - PAD && gy < btn.y + btn.hh + PAD) return btn;
      }
    }
    // For cinematic/menu: tap anywhere = primary (fallback)
    if (preset === 'cinematic') {
      return { action: 'primary', obj: null, round: true };
    }
    return null;
  }

  function onTouchStart(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const pos = touchToGame(touch);
      const btn = hitTest(pos.x, pos.y);
      if (btn) {
        activeTouches.set(touch.identifier, btn.action);
        state[btn.action] = true;
        state._justPressed[btn.action] = true;
        if (btn.obj) btn.obj.opacity = 0.55;
      }
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const action = activeTouches.get(touch.identifier);
      if (action) {
        state[action] = false;
        activeTouches.delete(touch.identifier);
        // Reset button visual
        const btn = buttons.find(b => b.action === action);
        if (btn && btn.obj) btn.obj.opacity = 0.25;
      }
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const oldAction = activeTouches.get(touch.identifier);
      const pos = touchToGame(touch);
      const btn = hitTest(pos.x, pos.y);
      const newAction = btn ? btn.action : null;

      if (oldAction !== newAction) {
        // Finger moved to different button (or off all buttons)
        if (oldAction) {
          state[oldAction] = false;
          const oldBtn = buttons.find(b => b.action === oldAction);
          if (oldBtn && oldBtn.obj) oldBtn.obj.opacity = 0.25;
        }
        if (newAction) {
          activeTouches.set(touch.identifier, newAction);
          state[newAction] = true;
          state._justPressed[newAction] = true;
          if (btn.obj) btn.obj.opacity = 0.55;
        } else {
          activeTouches.delete(touch.identifier);
        }
      }
    }
  }

  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });

  // Cleanup function (call on scene exit)
  state.destroy = () => {
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchend', onTouchEnd);
    canvas.removeEventListener('touchcancel', onTouchEnd);
    canvas.removeEventListener('touchmove', onTouchMove);
    for (const obj of objects) {
      if (obj.exists && obj.exists()) obj.destroy();
    }
    objects.length = 0;
    buttons.length = 0;
    activeTouches.clear();
  };

  return state;
}


// ===================================================================
// Preset button layouts
// ===================================================================

function getPresetButtons(preset) {
  // D-pad positions (left side, bottom)
  const DL = 75, DY = H - 120;
  const DS = 50; // d-pad spacing

  // Action button positions (right side, bottom)
  const AR = W - 80, AY = H - 120;

  const dpad = [
    { x: DL, y: DY - DS, w: 52, h: 52, label: '^', action: 'up', round: false, color: [200, 200, 200] },
    { x: DL, y: DY + DS, w: 52, h: 52, label: 'v', action: 'down', round: false, color: [200, 200, 200] },
    { x: DL - DS, y: DY, w: 52, h: 52, label: '<', action: 'left', round: false, color: [200, 200, 200] },
    { x: DL + DS, y: DY, w: 52, h: 52, label: '>', action: 'right', round: false, color: [200, 200, 200] },
  ];

  switch (preset) {
    case 'cinematic':
      return []; // tap anywhere handled in hitTest fallback

    case 'menu':
      return [
        { x: DL, y: DY - DS, w: 52, h: 52, label: '^', action: 'up', round: false, color: [200, 200, 200] },
        { x: DL, y: DY + DS, w: 52, h: 52, label: 'v', action: 'down', round: false, color: [200, 200, 200] },
        { x: AR, y: AY, label: 'OK', action: 'primary', big: true, color: [255, 215, 0] },
      ];

    case 'platformer':
      return [
        { x: 70, y: H - 70, w: 110, h: 110, label: '<', action: 'left', round: false, color: [200, 200, 200] },
        { x: 190, y: H - 70, w: 110, h: 110, label: '>', action: 'right', round: false, color: [200, 200, 200] },
        { x: AR, y: AY + 10, label: 'JUMP', action: 'jump', big: true, color: [0, 200, 255] },
        { x: AR - 80, y: AY - 50, label: 'FIRE', action: 'primary', color: [255, 80, 80] },
      ];

    case 'bomberman':
      return [
        ...dpad,
        { x: AR, y: AY + 10, label: 'BOMB', action: 'primary', big: true, color: [255, 80, 80] },
        { x: AR - 75, y: AY - 20, label: 'DASH', action: 'secondary', color: [0, 200, 255] },
        { x: AR, y: AY - 60, label: 'ACT', action: 'tertiary', color: [80, 255, 80] },
      ];

    case 'stealth':
      return [
        ...dpad,
        { x: AR, y: AY + 10, label: 'SCAN', action: 'primary', big: true, color: [0, 200, 255] },
        { x: AR - 75, y: AY - 20, label: 'RUN', action: 'secondary', color: [255, 140, 0] },
        { x: AR, y: AY - 60, label: 'PLANT', action: 'tertiary', color: [80, 255, 80] },
        { x: AR - 75, y: AY - 80, label: 'DIST', action: 'special', color: [200, 80, 255] },
      ];

    case 'aerial':
      return [
        ...dpad,
        { x: AR, y: AY + 10, label: 'BOMB', action: 'primary', big: true, color: [255, 80, 80] },
        { x: AR - 75, y: AY - 40, label: 'CHAFF', action: 'secondary', color: [0, 200, 255] },
      ];

    case 'drone':
      return [...dpad];

    case 'combat':
      return [
        ...dpad,
        { x: AR, y: AY + 10, label: 'FIRE', action: 'primary', big: true, color: [255, 80, 80] },
        { x: AR - 75, y: AY - 20, label: 'MSL', action: 'special', color: [255, 140, 0] },
        { x: AR, y: AY - 60, label: 'DASH', action: 'secondary', color: [0, 200, 255] },
      ];

    case 'boss':
      return [
        ...dpad,
        { x: AR, y: AY + 10, label: 'FIRE', action: 'primary', big: true, color: [255, 80, 80] },
        { x: AR - 75, y: AY - 20, label: 'BOMB', action: 'special', color: [255, 140, 0] },
        { x: AR, y: AY - 60, label: 'ROLL', action: 'secondary', color: [0, 200, 255] },
        { x: AR - 75, y: AY - 80, label: 'PULSE', action: 'tertiary', color: [200, 80, 255] },
      ];

    default:
      return [...dpad, { x: AR, y: AY, label: 'ACT', action: 'primary', big: true, color: [255, 215, 0] }];
  }
}
