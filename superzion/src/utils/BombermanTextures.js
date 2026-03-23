// ===================================================================
// BombermanTextures — ALL tile, character, HUD, decoration & boss textures
// for the top-down Bomberman scene (32x32 grid)
// ===================================================================

const T = 32;

// ── Helper: create canvas of given size ──
function mc(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ── Helper: draw Star of David ──
function starOfDavid(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 1.2;
  // Upward triangle
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x - s * 0.87, y + s * 0.5);
  ctx.lineTo(x + s * 0.87, y + s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Downward triangle
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.lineTo(x - s * 0.87, y - s * 0.5);
  ctx.lineTo(x + s * 0.87, y - s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// ── Floor tile 32x32 ──
function drawFloor() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  // Sandy tan base
  ctx.fillStyle = '#c8b888';
  ctx.fillRect(0, 0, T, T);
  // Subtle grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, T, T);
  // Cracks / detail
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(8, 12);
  ctx.lineTo(14, 18);
  ctx.lineTo(22, 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, 6);
  ctx.lineTo(26, 10);
  ctx.stroke();
  // Dust speckles
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  ctx.fillRect(4, 4, 2, 2);
  ctx.fillRect(18, 24, 2, 2);
  ctx.fillRect(26, 8, 2, 2);
  return c;
}

// ── Wall tile 32x32 (indestructible) ──
function drawWall() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  // Dark gray stone base
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(0, 0, T, T);
  // Brick pattern
  ctx.strokeStyle = '#3a3a42';
  ctx.lineWidth = 1;
  // Horizontal mortar lines
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(T, 8);
  ctx.moveTo(0, 16);
  ctx.lineTo(T, 16);
  ctx.moveTo(0, 24);
  ctx.lineTo(T, 24);
  ctx.stroke();
  // Vertical mortar lines (offset rows)
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(16, 8);
  ctx.moveTo(0, 8);
  ctx.lineTo(0, 16);
  ctx.moveTo(16, 16);
  ctx.lineTo(16, 24);
  ctx.moveTo(8, 8);
  ctx.lineTo(8, 16);
  ctx.moveTo(24, 8);
  ctx.lineTo(24, 16);
  ctx.moveTo(8, 24);
  ctx.lineTo(8, 32);
  ctx.moveTo(24, 24);
  ctx.lineTo(24, 32);
  ctx.stroke();
  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, T, 2);
  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, T - 2, T, 2);
  return c;
}

// ── Breakable wall 32x32 (military crate) ──
function drawBreakable() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  // Brown wood base
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(1, 1, T - 2, T - 2);
  // Border
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, T - 2, T - 2);
  // X marking (crate pattern)
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(4, 4);
  ctx.lineTo(T - 4, T - 4);
  ctx.moveTo(T - 4, 4);
  ctx.lineTo(4, T - 4);
  ctx.stroke();
  // Wood grain lines
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(T, 10);
  ctx.moveTo(0, 22);
  ctx.lineTo(T, 22);
  ctx.stroke();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(2, 2, T - 4, 3);
  return c;
}

// ── Door tile 32x32 (bomb-destructible zone door) ──
function drawDoor() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  // Green metal base
  ctx.fillStyle = '#3a6a3a';
  ctx.fillRect(2, 0, T - 4, T);
  // Door frame
  ctx.strokeStyle = '#2a4a2a';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 0, T - 4, T);
  // Lock/handle
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.arc(T / 2, T / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#666';
  ctx.fillRect(T / 2 - 1, T / 2, 2, 6);
  // Horizontal bars
  ctx.strokeStyle = '#2a5a2a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 8);
  ctx.lineTo(T - 4, 8);
  ctx.moveTo(4, 24);
  ctx.lineTo(T - 4, 24);
  ctx.stroke();
  return c;
}

// ── Gold door tile 32x32 (key required) ──
function drawGoldDoor() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  // Gold base
  ctx.fillStyle = '#c8a030';
  ctx.fillRect(2, 0, T - 4, T);
  // Frame
  ctx.strokeStyle = '#a08020';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 0, T - 4, T);
  // Bright highlight
  ctx.fillStyle = 'rgba(255,255,200,0.2)';
  ctx.fillRect(4, 2, T - 8, 4);
  // Keyhole
  ctx.fillStyle = '#4a3010';
  ctx.beginPath();
  ctx.arc(T / 2, T / 2 - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(T / 2 - 1.5, T / 2, 3, 7);
  // Decorative border dots
  ctx.fillStyle = '#dab840';
  for (let i = 6; i < T - 4; i += 6) {
    ctx.fillRect(i, 1, 2, 2);
    ctx.fillRect(i, T - 3, 2, 2);
  }
  return c;
}

// ── Objective console 32x32 ──
function drawObjective() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  // Dark console body
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(4, 4, T - 8, T - 8);
  ctx.strokeStyle = '#1a1a2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, T - 8, T - 8);
  // Green screen
  ctx.fillStyle = '#0a3a0a';
  ctx.fillRect(7, 7, T - 14, T - 18);
  // Screen glow
  const glow = ctx.createRadialGradient(T / 2, 12, 2, T / 2, 12, 10);
  glow.addColorStop(0, 'rgba(0,200,50,0.4)');
  glow.addColorStop(1, 'rgba(0,80,20,0.1)');
  ctx.fillStyle = glow;
  ctx.fillRect(7, 7, T - 14, T - 18);
  // Fake text lines
  ctx.fillStyle = 'rgba(0,255,80,0.4)';
  ctx.fillRect(9, 9, 8, 1);
  ctx.fillRect(9, 12, 12, 1);
  ctx.fillRect(9, 15, 6, 1);
  // Buttons below screen
  ctx.fillStyle = '#555';
  ctx.fillRect(9, T - 10, 3, 3);
  ctx.fillStyle = '#a03030';
  ctx.fillRect(14, T - 10, 3, 3);
  ctx.fillStyle = '#3a6a3a';
  ctx.fillRect(19, T - 10, 3, 3);
  return c;
}

// ── Bomb sprite 32x32 ──
function drawBomb() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  const cx = T / 2, cy = T / 2 + 2;
  // Black sphere
  const grad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 11);
  grad.addColorStop(0, '#4a4a4a');
  grad.addColorStop(0.5, '#1a1a1a');
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 11, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  // Fuse
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 10);
  ctx.quadraticCurveTo(cx + 6, cy - 14, cx + 4, cy - 16);
  ctx.stroke();
  // Fuse spark
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 16, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 16, 1, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

// ── Explosion tiles 32x32 ──
function drawExplosion(type) {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  const cx = T / 2, cy = T / 2;
  if (type === 'center') {
    // Radial fire gradient
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 15);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#ffff00');
    grad.addColorStop(0.5, '#ff8800');
    grad.addColorStop(0.8, '#ff2200');
    grad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, T, T);
  } else if (type === 'h') {
    // Horizontal flame bar
    const grad = ctx.createLinearGradient(0, cy - 8, 0, cy + 8);
    grad.addColorStop(0, 'rgba(255,100,0,0)');
    grad.addColorStop(0.3, '#ff6600');
    grad.addColorStop(0.5, '#ffcc00');
    grad.addColorStop(0.7, '#ff6600');
    grad.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, cy - 8, T, 16);
  } else {
    // Vertical flame bar
    const grad = ctx.createLinearGradient(cx - 8, 0, cx + 8, 0);
    grad.addColorStop(0, 'rgba(255,100,0,0)');
    grad.addColorStop(0.3, '#ff6600');
    grad.addColorStop(0.5, '#ffcc00');
    grad.addColorStop(0.7, '#ff6600');
    grad.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 8, 0, 16, T);
  }
  return c;
}

// ── Power-ups 32x32 ──
function drawPowerup(type) {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  const cx = T / 2, cy = T / 2;
  // White circle background
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.stroke();

  if (type === 'bomb') {
    // Mini bomb icon
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 6, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'range') {
    // Flame/range icon (arrows outward)
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx, cy + 7);
    ctx.moveTo(cx - 7, cy);
    ctx.lineTo(cx + 7, cy);
    ctx.stroke();
    // Arrow tips
    ctx.fillStyle = '#ff4400';
    for (const [ax, ay, angle] of [[0, -7, 0], [0, 7, Math.PI], [-7, 0, -Math.PI / 2], [7, 0, Math.PI / 2]]) {
      ctx.save();
      ctx.translate(cx + ax, cy + ay);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(-2, 0);
      ctx.lineTo(2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (type === 'speed') {
    // Lightning bolt
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 8);
    ctx.lineTo(cx - 3, cy);
    ctx.lineTo(cx + 1, cy);
    ctx.lineTo(cx - 2, cy + 8);
    ctx.lineTo(cx + 4, cy - 1);
    ctx.lineTo(cx, cy - 1);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'key') {
    // Gold key
    ctx.fillStyle = '#c8a030';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c8a030';
    ctx.fillRect(cx, cy - 1, 8, 2);
    ctx.fillRect(cx + 6, cy - 1, 2, 4);
    ctx.fillRect(cx + 3, cy - 1, 2, 3);
    // Key hole
    ctx.fillStyle = '#806020';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

// ── Character drawing 32x32 (player/guard sprites) ──
function drawCharacter(dir, frame, opts = {}) {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  const cx = T / 2, cy = T / 2;

  const {
    bodyColor = '#ffffff',
    headColor = '#e8d4b8',
    kippah = false,
    starOD = false,
    rifle = false,
    beret = false,
  } = opts;

  const isPlayer = kippah && starOD;
  const walkOffset = frame === 1 ? 1 : 0;

  // ── Helper: draw a capsule (rounded rectangle) ──
  function capsule(x, y, w, h, r) {
    const rx = Math.min(r, w / 2);
    const ry = Math.min(r, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rx, y);
    ctx.lineTo(x + w - rx, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + ry);
    ctx.lineTo(x + w, y + h - ry);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
    ctx.lineTo(x + rx, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - ry);
    ctx.lineTo(x, y + ry);
    ctx.quadraticCurveTo(x, y, x + rx, y);
    ctx.closePath();
    ctx.fill();
  }

  // ── Dark outline silhouette (drawn first, 1px larger) ──
  {
    ctx.fillStyle = isPlayer ? '#0a0a0a' : 'rgba(0,0,0,0.3)';
    if (dir === 'down' || dir === 'up') {
      // Torso outline — rounded rect, 1px larger on each side
      capsule(cx - 7, cy - 3, 14, 13, 3);
      // Left leg outline
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy + 10 + (6 + walkOffset) / 2, 3.5, (6 + walkOffset) / 2 + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right leg outline
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy + 10 + (6 - walkOffset) / 2, 3.5, (6 - walkOffset) / 2 + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Left arm outline
      ctx.beginPath();
      ctx.ellipse(cx - 7.5, cy + 4, 2.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right arm outline
      ctx.beginPath();
      ctx.ellipse(cx + 7.5, cy + 4, 2.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Side view torso outline
      capsule(cx - 6, cy - 3, 12, 13, 3);
      // Leg outlines (side)
      ctx.beginPath();
      ctx.ellipse(cx - 1, cy + 10 + (6 + walkOffset) / 2, 3, (6 + walkOffset) / 2 + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy + 10 + (6 - walkOffset) / 2, 3, (6 - walkOffset) / 2 + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Single arm outline (side)
      if (dir === 'left') {
        ctx.beginPath();
        ctx.ellipse(cx - 5.5, cy + 4, 2.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(cx + 5.5, cy + 4, 2.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Head outline (slightly larger circle)
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Body ──
  ctx.fillStyle = bodyColor;
  if (dir === 'down' || dir === 'up') {
    // Torso — rounded rect
    capsule(cx - 6, cy - 2, 12, 12, 3);
    // Tactical vest overlay for player (dark, slightly inset)
    if (isPlayer) {
      ctx.fillStyle = '#333333';
      capsule(cx - 5, cy - 1, 10, 10, 2);
    }
    // Legs — ellipse capsules
    ctx.fillStyle = isPlayer ? '#1a1a1a' : '#3a3a4a';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 10 + (6 + walkOffset) / 2, 2.5, (6 + walkOffset) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 10 + (6 - walkOffset) / 2, 2.5, (6 - walkOffset) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Boots — small rounded caps at leg bottoms
    ctx.fillStyle = isPlayer ? '#0e0e0e' : '#111111';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 14 + walkOffset + 1, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 14 - walkOffset + 1, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Arms — vertical ellipses on each side
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(cx - 7.5, cy + 4, 2, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 7.5, cy + 4, 2, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Side view torso — rounded rect
    capsule(cx - 5, cy - 2, 10, 12, 3);
    // Tactical vest overlay for player
    if (isPlayer) {
      ctx.fillStyle = '#333333';
      capsule(cx - 4, cy - 1, 8, 10, 2);
    }
    // Legs — ellipse capsules (side view, slightly offset)
    ctx.fillStyle = isPlayer ? '#1a1a1a' : '#3a3a4a';
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy + 10 + (6 + walkOffset) / 2, 2.5, (6 + walkOffset) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 10 + (6 - walkOffset) / 2, 2.5, (6 - walkOffset) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Boots — small rounded caps (side)
    ctx.fillStyle = isPlayer ? '#0e0e0e' : '#111111';
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy + 14 + walkOffset + 1, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 14 - walkOffset + 1, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Front arm — single vertical ellipse
    ctx.fillStyle = bodyColor;
    if (dir === 'left') {
      ctx.beginPath();
      ctx.ellipse(cx - 5.5, cy + 4, 2, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx + 5.5, cy + 4, 2, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Hands (skin color) — small ellipses ──
  ctx.fillStyle = headColor;
  if (dir === 'down' || dir === 'up') {
    ctx.beginPath();
    ctx.ellipse(cx - 7.5, cy + 8.5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 7.5, cy + 8.5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Player pistol with silencer in right hand
    if (isPlayer) {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(cx + 7.5, cy + 11, 1.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Silencer tip
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.ellipse(cx + 7.5, cy + 14.5, 1, 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (dir === 'left') {
    ctx.beginPath();
    ctx.ellipse(cx - 5.5, cy + 8.5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Player pistol pointing left
    if (isPlayer) {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(cx - 8, cy + 8.5, 4, 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.beginPath();
    ctx.ellipse(cx + 5.5, cy + 8.5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Player pistol pointing right
    if (isPlayer) {
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(cx + 8, cy + 8.5, 4, 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Head ──
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 7, 0, Math.PI * 2);
  ctx.fill();

  // ── Face (eyes and mouth) — only visible from front and sides ──
  if (dir === 'down') {
    if (isPlayer) {
      // Thick straight eyebrows ABOVE sunglasses — serious look
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(cx - 5.5, cy - 9);
      ctx.lineTo(cx - 0.5, cy - 9.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 0.5, cy - 9.5);
      ctx.lineTo(cx + 5.5, cy - 9);
      ctx.stroke();
      // AVIATOR SUNGLASSES — dark ovals covering eyes (THE defining feature)
      // Left lens
      ctx.fillStyle = '#0A0A0A';
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right lens
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Frame — thin dark gray
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Nose bridge
      ctx.beginPath();
      ctx.moveTo(cx - 0.5, cy - 7.5);
      ctx.lineTo(cx + 0.5, cy - 7.5);
      ctx.stroke();
      // Reflection on lenses (cyan/white diagonal)
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 4.5, cy - 8);
      ctx.lineTo(cx - 1.5, cy - 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 1.5, cy - 8);
      ctx.lineTo(cx + 4.5, cy - 7);
      ctx.stroke();
      // Mouth — serious straight line
      ctx.strokeStyle = '#6a4030';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 3.5);
      ctx.lineTo(cx + 2, cy - 3.5);
      ctx.stroke();
    } else {
      // Guard eyes — small dark ellipses
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy - 7, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy - 7, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Guard mouth — short arc
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy - 3.5, 1.5, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }
  } else if (dir === 'left') {
    if (isPlayer) {
      // Side sunglasses — single dark oval
      ctx.fillStyle = '#0A0A0A';
      ctx.beginPath();
      ctx.ellipse(cx - 3.5, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      // Reflection
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 8);
      ctx.lineTo(cx - 2, cy - 7);
      ctx.stroke();
      // Serious mouth
      ctx.strokeStyle = '#6a4030';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 3.5);
      ctx.lineTo(cx, cy - 3.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(cx - 4, cy - 7, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx - 1.5, cy - 3.5, 1.2, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }
  } else if (dir === 'right') {
    if (isPlayer) {
      // Side sunglasses — single dark oval
      ctx.fillStyle = '#0A0A0A';
      ctx.beginPath();
      ctx.ellipse(cx + 3.5, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      // Reflection
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx + 2, cy - 8);
      ctx.lineTo(cx + 5, cy - 7);
      ctx.stroke();
      // Serious mouth
      ctx.strokeStyle = '#6a4030';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 3.5);
      ctx.lineTo(cx + 3, cy - 3.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy - 7, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx + 1.5, cy - 3.5, 1.2, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }
  }
  // 'up' — no face visible

  // ── Slicked-back hair (professional, groomed — NO kippah) ──
  if (kippah) {
    ctx.fillStyle = '#1A1A1A';
    // Hair swept backward — rounded cap using arcs
    ctx.beginPath();
    ctx.ellipse(cx, cy - 11, 7.5, 4, 0, Math.PI, 0);
    ctx.fill();
    // Hair volume on top — higher in front (subtle pompadour)
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 12);
    ctx.bezierCurveTo(cx - 4, cy - 16, cx + 3, cy - 16.5, cx + 6, cy - 12);
    ctx.bezierCurveTo(cx + 7, cy - 10, cx - 7, cy - 10, cx - 6, cy - 12);
    ctx.closePath();
    ctx.fillStyle = '#1A1A1A';
    ctx.fill();
    // Side hair — small arcs hugging the head
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 9, 2, Math.PI * 0.7, Math.PI * 1.7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 7, cy - 9, 2, Math.PI * 1.3, Math.PI * 0.3);
    ctx.fill();
    // Hair streaks for slicked-back look (bezier curves)
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 0.4;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 2, cy - 15);
      ctx.bezierCurveTo(cx + i * 2.2, cy - 13, cx + i * 2.8, cy - 11, cx + i * 3, cy - 9);
      ctx.stroke();
    }
  }

  // ── Beret ──
  if (beret) {
    ctx.fillStyle = '#3a4a30';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 11, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    capsule(cx - 7, cy - 12, 14, 2, 1);
  }

  // ── Star of David ──
  if (starOD) {
    // Centered on mid-chest / torso middle (vest area cy-1 to cy+9, true center = cy+4)
    starOfDavid(ctx, cx, cy + 5, 4, '#FFD700');
    // Fill inner area with semi-transparent gold
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy + 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Rifle (guard weapon) ──
  if (rifle) {
    ctx.fillStyle = '#3a3a3a';
    if (dir === 'right') {
      ctx.fillRect(cx + 7, cy - 2, 10, 2);
      ctx.fillRect(cx + 15, cy - 4, 2, 4);
    } else if (dir === 'left') {
      ctx.fillRect(cx - 17, cy - 2, 10, 2);
      ctx.fillRect(cx - 17, cy - 4, 2, 4);
    } else if (dir === 'down') {
      ctx.fillRect(cx + 7, cy + 2, 8, 2);
    } else {
      ctx.fillRect(cx - 15, cy + 2, 8, 2);
    }
  }

  return c;
}

// ── HUD: Heart (full) ──
function drawHeart() {
  const c = mc(16, 16);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e83030';
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.bezierCurveTo(2, 10, 0, 5, 4, 2);
  ctx.bezierCurveTo(6, 0, 8, 2, 8, 4);
  ctx.bezierCurveTo(8, 2, 10, 0, 12, 2);
  ctx.bezierCurveTo(16, 5, 14, 10, 8, 14);
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(5, 5, 2, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

// ── HUD: Heart (empty) ──
function drawHeartEmpty() {
  const c = mc(16, 16);
  const ctx = c.getContext('2d');
  ctx.strokeStyle = '#6a2020';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.bezierCurveTo(2, 10, 0, 5, 4, 2);
  ctx.bezierCurveTo(6, 0, 8, 2, 8, 4);
  ctx.bezierCurveTo(8, 2, 10, 0, 12, 2);
  ctx.bezierCurveTo(16, 5, 14, 10, 8, 14);
  ctx.stroke();
  return c;
}

// ── HUD: Key icon (inactive) ──
function drawKeyIcon() {
  const c = mc(16, 16);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(6, 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(9, 5, 6, 2);
  ctx.fillRect(13, 5, 2, 4);
  ctx.fillRect(11, 5, 2, 3);
  // Inner hole
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.arc(6, 6, 2, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

// ── HUD: Key icon (active/collected) ──
function drawKeyIconActive() {
  const c = mc(16, 16);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c8a030';
  ctx.beginPath();
  ctx.arc(6, 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(9, 5, 6, 2);
  ctx.fillRect(13, 5, 2, 4);
  ctx.fillRect(11, 5, 2, 3);
  // Hole
  ctx.fillStyle = '#806020';
  ctx.beginPath();
  ctx.arc(6, 6, 2, 0, Math.PI * 2);
  ctx.fill();
  // Gold glow
  ctx.fillStyle = 'rgba(255,200,50,0.25)';
  ctx.beginPath();
  ctx.arc(8, 8, 8, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

// ── Exit marker 32x32 ──
function drawExitMarker() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  // Green glowing tile
  const grad = ctx.createRadialGradient(T / 2, T / 2, 2, T / 2, T / 2, 14);
  grad.addColorStop(0, '#00ff88');
  grad.addColorStop(0.5, '#008844');
  grad.addColorStop(1, 'rgba(0,68,34,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, T, T);
  // Arrow pointing up
  ctx.fillStyle = '#00ff88';
  ctx.beginPath();
  ctx.moveTo(T / 2, 4);
  ctx.lineTo(T / 2 - 6, 14);
  ctx.lineTo(T / 2 - 2, 14);
  ctx.lineTo(T / 2 - 2, 24);
  ctx.lineTo(T / 2 + 2, 24);
  ctx.lineTo(T / 2 + 2, 14);
  ctx.lineTo(T / 2 + 6, 14);
  ctx.closePath();
  ctx.fill();
  return c;
}

// ── Decoration: Crate 32x32 ──
function drawDecoCrate() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6a5a3a';
  ctx.fillRect(4, 4, T - 8, T - 8);
  ctx.strokeStyle = '#4a3a2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, T - 8, T - 8);
  // Cross strips
  ctx.strokeStyle = '#5a4a2a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 4);
  ctx.lineTo(T - 4, T - 4);
  ctx.moveTo(T - 4, 4);
  ctx.lineTo(4, T - 4);
  ctx.stroke();
  return c;
}

// ── Decoration: Sandbag 32x32 ──
function drawDecoSandbag() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  // Stacked sandbags
  ctx.fillStyle = '#a09060';
  ctx.beginPath();
  ctx.ellipse(T / 2, T / 2 + 4, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b0a070';
  ctx.beginPath();
  ctx.ellipse(T / 2, T / 2 - 2, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c0b080';
  ctx.beginPath();
  ctx.ellipse(T / 2, T / 2 - 7, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Stitching lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(T / 2, T / 2 - 11);
  ctx.lineTo(T / 2, T / 2 - 3);
  ctx.stroke();
  return c;
}

// ── Decoration: Flag 32x32 ──
function drawDecoFlag() {
  const c = mc(T, T);
  const ctx = c.getContext('2d');
  // Pole
  ctx.fillStyle = '#888';
  ctx.fillRect(T / 2 - 1, 4, 2, T - 8);
  // Flag (waving shape)
  ctx.fillStyle = '#3060a0';
  ctx.beginPath();
  ctx.moveTo(T / 2 + 1, 5);
  ctx.quadraticCurveTo(T / 2 + 10, 8, T / 2 + 8, 12);
  ctx.quadraticCurveTo(T / 2 + 12, 16, T / 2 + 1, 17);
  ctx.lineTo(T / 2 + 1, 5);
  ctx.closePath();
  ctx.fill();
  // Star of David on flag
  starOfDavid(ctx, T / 2 + 5, 11, 2.5, '#ffffff');
  return c;
}

// ── Boss 1: Foam Beard (128x128) ──
// Corrupt civilian politician/businessman with short trimmed white beard
// Expressions: 'normal', 'angry', 'furious', 'dead'
function drawBoss1FoamBeard(expression = 'normal') {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const cx = S / 2, cy = S / 2;

  // ── Skin tint based on expression ──
  let skinBase, skinDark, skinLight;
  if (expression === 'furious') {
    skinBase = '#b04838'; skinDark = '#8a3028'; skinLight = '#cc6050';
  } else if (expression === 'angry') {
    skinBase = '#c49478'; skinDark = '#9a7058'; skinLight = '#daa888';
  } else {
    skinBase = '#c8a080'; skinDark = '#a07858'; skinLight = '#ddb898';
  }

  // ── SUIT (shoulders & torso, drawn first behind head) ──
  // Shoulders
  ctx.fillStyle = expression === 'furious' ? '#22182e' : '#1a1a2a';
  ctx.beginPath();
  ctx.moveTo(cx - 44, cy + 42);
  ctx.lineTo(cx - 38, cy + 18);
  ctx.lineTo(cx - 20, cy + 12);
  ctx.lineTo(cx + 20, cy + 12);
  ctx.lineTo(cx + 38, cy + 18);
  ctx.lineTo(cx + 44, cy + 42);
  ctx.lineTo(cx + 48, cy + 64);
  ctx.lineTo(cx - 48, cy + 64);
  ctx.closePath();
  ctx.fill();

  // Suit lapels (V-shape, slightly lighter)
  ctx.fillStyle = '#1e2040';
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy + 12);
  ctx.lineTo(cx - 14, cy + 42);
  ctx.lineTo(cx - 4, cy + 42);
  ctx.lineTo(cx, cy + 20);
  ctx.lineTo(cx + 4, cy + 42);
  ctx.lineTo(cx + 14, cy + 42);
  ctx.lineTo(cx + 18, cy + 12);
  ctx.lineTo(cx, cy + 18);
  ctx.closePath();
  ctx.fill();

  // White shirt collar visible
  ctx.fillStyle = '#e8e4e0';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy + 12);
  ctx.lineTo(cx - 6, cy + 22);
  ctx.lineTo(cx, cy + 18);
  ctx.lineTo(cx + 6, cy + 22);
  ctx.lineTo(cx + 12, cy + 12);
  ctx.lineTo(cx, cy + 16);
  ctx.closePath();
  ctx.fill();

  // Tie
  ctx.fillStyle = '#2a1520';
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 18);
  ctx.lineTo(cx + 3, cy + 18);
  ctx.lineTo(cx + 4, cy + 38);
  ctx.lineTo(cx + 2, cy + 42);
  ctx.lineTo(cx, cy + 43);
  ctx.lineTo(cx - 2, cy + 42);
  ctx.lineTo(cx - 4, cy + 38);
  ctx.closePath();
  ctx.fill();
  // Tie knot
  ctx.fillStyle = '#3a2030';
  ctx.beginPath();
  ctx.arc(cx, cy + 19, 3, 0, Math.PI * 2);
  ctx.fill();

  // ── NECK ──
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 6);
  ctx.lineTo(cx + 10, cy + 6);
  ctx.lineTo(cx + 12, cy + 16);
  ctx.lineTo(cx - 12, cy + 16);
  ctx.closePath();
  ctx.fill();

  // ── BALD HEAD (rounded, no hat) ──
  // Main head shape
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 32, 0, Math.PI * 2);
  ctx.fill();

  // Scalp (bald top, slightly lighter with sheen)
  ctx.fillStyle = skinLight;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 28, 22, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sheen highlight on bald head
  ctx.fillStyle = 'rgba(255, 255, 240, 0.25)';
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy - 34, 10, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Sparse side hair (gray wisps on sides)
  ctx.strokeStyle = '#888880';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const sy = cy - 20 + i * 3;
    // Left side
    ctx.beginPath();
    ctx.moveTo(cx - 30, sy);
    ctx.quadraticCurveTo(cx - 34, sy + 2, cx - 32, sy + 4);
    ctx.stroke();
    // Right side
    ctx.beginPath();
    ctx.moveTo(cx + 30, sy);
    ctx.quadraticCurveTo(cx + 34, sy + 2, cx + 32, sy + 4);
    ctx.stroke();
  }

  // Jaw shape (squarish for old man face)
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.moveTo(cx - 28, cy - 2);
  ctx.lineTo(cx - 26, cy + 10);
  ctx.lineTo(cx - 18, cy + 16);
  ctx.lineTo(cx + 18, cy + 16);
  ctx.lineTo(cx + 26, cy + 10);
  ctx.lineTo(cx + 28, cy - 2);
  ctx.closePath();
  ctx.fill();

  // ── EARS ──
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.ellipse(cx - 32, cy - 8, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 32, cy - 8, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── FOREHEAD WRINKLES (4 lines) ──
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const wy = cy - 30 + i * 4;
    ctx.beginPath();
    ctx.moveTo(cx - 16, wy);
    ctx.quadraticCurveTo(cx, wy - 1.2, cx + 16, wy);
    ctx.stroke();
  }

  // ── EYEBROWS (thin, gray, arrogant arch) ──
  const browColor = expression === 'dead' ? '#555555' : '#6a6a68';
  ctx.strokeStyle = browColor;
  ctx.lineWidth = 2;
  // Left eyebrow (arched, slightly raised)
  ctx.beginPath();
  ctx.moveTo(cx - 22, cy - 13);
  ctx.quadraticCurveTo(cx - 14, cy - 18, cx - 6, cy - 14);
  ctx.stroke();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(cx + 22, cy - 13);
  ctx.quadraticCurveTo(cx + 14, cy - 18, cx + 6, cy - 14);
  ctx.stroke();

  // Angry/furious brow adjustment: thicker, more angled
  if (expression === 'angry' || expression === 'furious') {
    ctx.strokeStyle = expression === 'furious' ? '#3a1a10' : '#4a3a30';
    ctx.lineWidth = expression === 'furious' ? 3 : 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 15);
    ctx.quadraticCurveTo(cx - 14, cy - 14, cx - 6, cy - 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 22, cy - 15);
    ctx.quadraticCurveTo(cx + 14, cy - 14, cx + 6, cy - 12);
    ctx.stroke();
  }

  // ── EYES ──
  if (expression === 'dead') {
    // X eyes for dead
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    for (const ex of [cx - 13, cx + 13]) {
      ctx.beginPath();
      ctx.moveTo(ex - 4, cy - 10); ctx.lineTo(ex + 4, cy - 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex + 4, cy - 10); ctx.lineTo(ex - 4, cy - 4);
      ctx.stroke();
    }
    // Under-eye bruises
    ctx.fillStyle = 'rgba(80, 40, 100, 0.45)';
    ctx.beginPath(); ctx.ellipse(cx - 13, cy - 3, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 13, cy - 3, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    let irisColor, scleraColor;
    if (expression === 'furious') {
      irisColor = '#bb1100'; scleraColor = '#ffcccc';
    } else if (expression === 'angry') {
      irisColor = '#885522'; scleraColor = '#ffe8d8';
    } else {
      irisColor = '#556688'; scleraColor = '#eeeee8';
    }

    for (const side of [-1, 1]) {
      const ex = cx + side * 13;
      const ey = cy - 7;

      // Narrow sclera (squinty, arrogant look)
      ctx.fillStyle = scleraColor;
      ctx.beginPath();
      ctx.moveTo(ex - 7, ey);
      ctx.quadraticCurveTo(ex, ey - 3, ex + 7, ey);
      ctx.quadraticCurveTo(ex, ey + 2.5, ex - 7, ey);
      ctx.closePath();
      ctx.fill();

      // Iris
      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Light reflection
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(ex + 1, ey - 1, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Under-eye bags (old age)
      ctx.strokeStyle = skinDark;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(ex - 6, ey + 4);
      ctx.quadraticCurveTo(ex, ey + 6, ex + 6, ey + 4);
      ctx.stroke();

      // Crow's feet wrinkles
      ctx.strokeStyle = skinDark;
      ctx.lineWidth = 0.6;
      const cfx = ex + side * 8;
      ctx.beginPath(); ctx.moveTo(cfx, ey - 2); ctx.lineTo(cfx + side * 4, ey - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cfx, ey);     ctx.lineTo(cfx + side * 4, ey);     ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cfx, ey + 2); ctx.lineTo(cfx + side * 4, ey + 4); ctx.stroke();
    }
  }

  // ── WIRE-FRAME GLASSES ──
  if (expression !== 'dead') {
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    // Left lens
    ctx.beginPath();
    ctx.ellipse(cx - 13, cy - 7, 8, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Right lens
    ctx.beginPath();
    ctx.ellipse(cx + 13, cy - 7, 8, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Bridge
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 7);
    ctx.quadraticCurveTo(cx, cy - 9, cx + 5, cy - 7);
    ctx.stroke();
    // Temple arms (to ears)
    ctx.beginPath();
    ctx.moveTo(cx - 21, cy - 7);
    ctx.lineTo(cx - 30, cy - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 21, cy - 7);
    ctx.lineTo(cx + 30, cy - 8);
    ctx.stroke();
    // Slight lens glint
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(cx - 15, cy - 9, 3, Math.PI * 1.2, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 11, cy - 9, 3, Math.PI * 1.2, Math.PI * 1.6);
    ctx.stroke();
  }

  // ── NOSE (prominent, slightly bulbous) ──
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 4);
  ctx.lineTo(cx + 2, cy - 4);
  ctx.lineTo(cx + 5, cy + 3);
  ctx.lineTo(cx + 4, cy + 5);
  ctx.lineTo(cx - 4, cy + 5);
  ctx.lineTo(cx - 5, cy + 3);
  ctx.closePath();
  ctx.fill();
  // Nostrils
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath(); ctx.arc(cx - 3, cy + 4, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 3, cy + 4, 1.2, 0, Math.PI * 2); ctx.fill();

  // ── MOUTH (thin, downturned, arrogant) ──
  if (expression === 'dead') {
    ctx.strokeStyle = '#5a3a2a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 10);
    ctx.lineTo(cx - 4, cy + 12);
    ctx.lineTo(cx + 4, cy + 11);
    ctx.lineTo(cx + 10, cy + 13);
    ctx.stroke();
  } else {
    // Thin pursed lips, corners turned down
    ctx.fillStyle = '#6a4040';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 10);
    ctx.quadraticCurveTo(cx, cy + 8, cx + 12, cy + 10);
    ctx.quadraticCurveTo(cx, cy + 12, cx - 12, cy + 10);
    ctx.closePath();
    ctx.fill();

    // Downturned corners (contemptuous expression)
    ctx.strokeStyle = '#5a3030';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + 10);
    ctx.lineTo(cx - 14, cy + 13);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy + 10);
    ctx.lineTo(cx + 14, cy + 13);
    ctx.stroke();

    // Nasolabial folds (nose-to-mouth creases)
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 3);
    ctx.quadraticCurveTo(cx - 10, cy + 7, cx - 13, cy + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 7, cy + 3);
    ctx.quadraticCurveTo(cx + 10, cy + 7, cx + 13, cy + 10);
    ctx.stroke();

    if (expression === 'furious') {
      // Snarl: upper teeth visible
      ctx.fillStyle = '#e8e0d0';
      for (let t = -2; t <= 2; t++) {
        ctx.fillRect(cx + t * 4 - 1, cy + 9, 3, 2);
      }
    }
  }

  // ── SHORT WHITE BEARD (trimmed, "foam" texture at jawline) ──
  const beardBase = '#d8d4cc';
  const beardLight = '#eae6e0';
  const beardDark = '#b0aaa0';

  // Main beard shape: short crescent covering jaw and chin
  ctx.fillStyle = beardBase;
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy + 6);
  ctx.lineTo(cx - 28, cy + 10);
  ctx.lineTo(cx - 26, cy + 16);
  ctx.lineTo(cx - 22, cy + 22);
  ctx.lineTo(cx - 14, cy + 26);
  ctx.lineTo(cx - 6, cy + 28);
  ctx.lineTo(cx + 6, cy + 28);
  ctx.lineTo(cx + 14, cy + 26);
  ctx.lineTo(cx + 22, cy + 22);
  ctx.lineTo(cx + 26, cy + 16);
  ctx.lineTo(cx + 28, cy + 10);
  ctx.lineTo(cx + 26, cy + 6);
  ctx.closePath();
  ctx.fill();

  // Beard texture: short stubble strokes (foam-like dots and micro-lines)
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 60; i++) {
    const bx = cx + (Math.random() - 0.5) * 46;
    const by = cy + 10 + Math.random() * 16;
    // Only draw within beard area
    const dist = Math.abs(bx - cx);
    const maxDist = 26 - (by - (cy + 6)) * 0.4;
    if (dist > maxDist) continue;
    const col = [beardBase, beardLight, beardDark][Math.floor(Math.random() * 3)];
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + (Math.random() - 0.5) * 2, by + 1.5 + Math.random() * 2);
    ctx.stroke();
  }

  // Foam-like soft dots along the beard edge
  ctx.fillStyle = beardLight;
  for (let i = 0; i < 18; i++) {
    const angle = Math.PI * 0.15 + (Math.PI * 0.7 / 18) * i;
    const rx = cx + Math.cos(angle) * (22 + Math.random() * 4) * (i < 9 ? -1 : 1);
    const ry = cy + 18 + Math.sin(angle) * 8 + Math.random() * 4;
    const rr = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mustache (short, trimmed, connects to beard)
  ctx.fillStyle = beardDark;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 7);
  ctx.quadraticCurveTo(cx - 6, cy + 9, cx - 2, cy + 8);
  ctx.lineTo(cx - 2, cy + 10);
  ctx.quadraticCurveTo(cx - 6, cy + 11, cx - 12, cy + 9);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 7);
  ctx.quadraticCurveTo(cx + 6, cy + 9, cx + 2, cy + 8);
  ctx.lineTo(cx + 2, cy + 10);
  ctx.quadraticCurveTo(cx + 6, cy + 11, cx + 12, cy + 9);
  ctx.closePath();
  ctx.fill();

  // ── DAMAGE EXPRESSIONS ──
  if (expression === 'angry' || expression === 'furious') {
    // Cracks on the scalp
    ctx.strokeStyle = expression === 'furious' ? '#cc2020' : '#aa4040';
    ctx.lineWidth = expression === 'furious' ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 38);
    ctx.lineTo(cx - 8, cy - 30);
    ctx.lineTo(cx - 14, cy - 24);
    ctx.lineTo(cx - 10, cy - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 14, cy - 36);
    ctx.lineTo(cx + 10, cy - 28);
    ctx.lineTo(cx + 16, cy - 22);
    ctx.lineTo(cx + 12, cy - 18);
    ctx.stroke();

    // Vein on temple
    ctx.strokeStyle = expression === 'furious' ? '#cc4040' : '#aa6060';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy - 18);
    ctx.quadraticCurveTo(cx - 24, cy - 22, cx - 20, cy - 26);
    ctx.stroke();
  }

  if (expression === 'furious') {
    // Red tint overlay
    ctx.fillStyle = 'rgba(180, 30, 10, 0.12)';
    ctx.fillRect(0, 0, S, S);

    // Extra cracks on suit
    ctx.strokeStyle = '#cc2020';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 30);
    ctx.lineTo(cx - 26, cy + 34);
    ctx.lineTo(cx - 28, cy + 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 30, cy + 30);
    ctx.lineTo(cx + 26, cy + 34);
    ctx.lineTo(cx + 28, cy + 38);
    ctx.stroke();

    // Loosened tie
    ctx.strokeStyle = '#cc4040';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + 20);
    ctx.lineTo(cx - 4, cy + 22);
    ctx.stroke();
  }

  if (expression === 'dead') {
    // Bruises
    ctx.fillStyle = 'rgba(80, 30, 100, 0.4)';
    ctx.beginPath(); ctx.arc(cx - 16, cy - 2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 18, cy + 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 6, cy + 8, 3, 0, Math.PI * 2); ctx.fill();

    // Cracks on scalp
    ctx.strokeStyle = 'rgba(60, 30, 20, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 36);
    ctx.lineTo(cx - 4, cy - 26);
    ctx.lineTo(cx - 10, cy - 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 32);
    ctx.lineTo(cx + 6, cy - 22);
    ctx.lineTo(cx + 12, cy - 12);
    ctx.stroke();

    // Glasses broken: one lens cracked (drawn over the glasses area)
    ctx.strokeStyle = 'rgba(100, 80, 60, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 17, cy - 10);
    ctx.lineTo(cx - 10, cy - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 5);
    ctx.lineTo(cx - 9, cy - 9);
    ctx.stroke();
  }

  return c;
}

// ===================================================================
// generateBombermanTextures — register ALL textures into Phaser scene
// ===================================================================
export function generateBombermanTextures(scene) {
  if (scene.textures.exists('bm_floor')) return;

  // ── Tile textures ──
  scene.textures.addCanvas('bm_floor', drawFloor());
  scene.textures.addCanvas('bm_wall', drawWall());
  scene.textures.addCanvas('bm_breakable', drawBreakable());
  scene.textures.addCanvas('bm_door', drawDoor());
  scene.textures.addCanvas('bm_gold_door', drawGoldDoor());
  scene.textures.addCanvas('bm_objective', drawObjective());
  scene.textures.addCanvas('bm_exit', drawExitMarker());

  // ── Bomb ──
  scene.textures.addCanvas('bm_bomb', drawBomb());

  // ── Explosions ──
  scene.textures.addCanvas('bm_explode_center', drawExplosion('center'));
  scene.textures.addCanvas('bm_explode_h', drawExplosion('h'));
  scene.textures.addCanvas('bm_explode_v', drawExplosion('v'));

  // ── Power-ups ──
  scene.textures.addCanvas('bm_pu_bomb', drawPowerup('bomb'));
  scene.textures.addCanvas('bm_pu_range', drawPowerup('range'));
  scene.textures.addCanvas('bm_pu_speed', drawPowerup('speed'));
  scene.textures.addCanvas('bm_pu_key', drawPowerup('key'));

  // ── Player character (4 dirs x 2 frames) ──
  const playerOpts = { bodyColor: '#222222', headColor: '#D2956A', kippah: true, starOD: true };
  for (const dir of ['up', 'down', 'left', 'right']) {
    for (const frame of [0, 1]) {
      scene.textures.addCanvas(
        `bm_player_${dir}_${frame}`,
        drawCharacter(dir, frame, playerOpts)
      );
    }
  }

  // ── Patrol guard (4 dirs x 2 frames) ──
  const patrolOpts = { bodyColor: '#2D4A1E', headColor: '#3D5A2E', rifle: true, beret: true };
  for (const dir of ['up', 'down', 'left', 'right']) {
    for (const frame of [0, 1]) {
      scene.textures.addCanvas(
        `bm_patrol_${dir}_${frame}`,
        drawCharacter(dir, frame, patrolOpts)
      );
    }
  }

  // ── Chaser guard (4 dirs x 2 frames) ──
  const chaserOpts = { bodyColor: '#8B1A1A', headColor: '#4a2020', rifle: true, beret: true };
  for (const dir of ['up', 'down', 'left', 'right']) {
    for (const frame of [0, 1]) {
      scene.textures.addCanvas(
        `bm_chaser_${dir}_${frame}`,
        drawCharacter(dir, frame, chaserOpts)
      );
    }
  }

  // ── HUD textures ──
  scene.textures.addCanvas('bm_heart', drawHeart());
  scene.textures.addCanvas('bm_heart_empty', drawHeartEmpty());
  scene.textures.addCanvas('bm_key_icon', drawKeyIcon());
  scene.textures.addCanvas('bm_key_active', drawKeyIconActive());

  // ── Decoration textures ──
  scene.textures.addCanvas('bm_deco_crate', drawDecoCrate());
  scene.textures.addCanvas('bm_deco_sandbag', drawDecoSandbag());
  scene.textures.addCanvas('bm_deco_flag', drawDecoFlag());

  // ── Boss textures ──
  scene.textures.addCanvas('bm_boss1_normal', drawBoss1FoamBeard('normal'));
  scene.textures.addCanvas('bm_boss1_angry', drawBoss1FoamBeard('angry'));
  scene.textures.addCanvas('bm_boss1_dead', drawBoss1FoamBeard('dead'));
}
