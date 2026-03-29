// ===================================================================
// Texture Factory — Canvas2D drawing -> Kaplay sprites
// Ports BombermanTextures.js from the original Phaser version
// ===================================================================

const T = 34; // tile size for Kaplay grid

// ── Helper: create canvas of given size ──
function mc(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// ── Core: generate a sprite from a canvas draw function ──
export function makeTexture(k, name, width, height, drawFn) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  drawFn(ctx, width, height);
  k.loadSprite(name, canvas.toDataURL());
}

// ── Helper: draw Star of David ──
function starOfDavid(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "#B8860B";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x - s * 0.87, y + s * 0.5);
  ctx.lineTo(x + s * 0.87, y + s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.lineTo(x - s * 0.87, y - s * 0.5);
  ctx.lineTo(x + s * 0.87, y - s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// ── Helper: draw a capsule (rounded rect) ──
function capsule(ctx, x, y, w, h, r) {
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

// ═══════════════════════════════════════════════════════════════
// TILE TEXTURES
// ═══════════════════════════════════════════════════════════════

function drawFloor() {
  const c = mc(T, T);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#c8b888";
  ctx.fillRect(0, 0, T, T);
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, T, T);
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(8, 12); ctx.lineTo(14, 18); ctx.lineTo(22, 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, 6); ctx.lineTo(26, 10);
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  ctx.fillRect(4, 4, 2, 2);
  ctx.fillRect(18, 24, 2, 2);
  ctx.fillRect(26, 8, 2, 2);
  return c;
}

function drawWall() {
  const c = mc(T, T);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#4a4a52";
  ctx.fillRect(0, 0, T, T);
  ctx.strokeStyle = "#3a3a42";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 8); ctx.lineTo(T, 8);
  ctx.moveTo(0, 17); ctx.lineTo(T, 17);
  ctx.moveTo(0, 26); ctx.lineTo(T, 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(17, 0); ctx.lineTo(17, 8);
  ctx.moveTo(0, 8); ctx.lineTo(0, 17);
  ctx.moveTo(17, 17); ctx.lineTo(17, 26);
  ctx.moveTo(8, 8); ctx.lineTo(8, 17);
  ctx.moveTo(26, 8); ctx.lineTo(26, 17);
  ctx.moveTo(8, 26); ctx.lineTo(8, T);
  ctx.moveTo(26, 26); ctx.lineTo(26, T);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, 0, T, 2);
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(0, T - 2, T, 2);
  return c;
}

function drawBreakable() {
  const c = mc(T, T);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#8a6a3a";
  ctx.fillRect(1, 1, T - 2, T - 2);
  ctx.strokeStyle = "#6a4a2a";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, T - 2, T - 2);
  ctx.strokeStyle = "#5a3a1a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(4, 4); ctx.lineTo(T - 4, T - 4);
  ctx.moveTo(T - 4, 4); ctx.lineTo(4, T - 4);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, 11); ctx.lineTo(T, 11);
  ctx.moveTo(0, 23); ctx.lineTo(T, 23);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(2, 2, T - 4, 3);
  return c;
}

function drawDoor() {
  const c = mc(T, T);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#3a6a3a";
  ctx.fillRect(2, 0, T - 4, T);
  ctx.strokeStyle = "#2a4a2a";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 0, T - 4, T);
  ctx.fillStyle = "#888";
  ctx.beginPath();
  ctx.arc(T / 2, T / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#666";
  ctx.fillRect(T / 2 - 1, T / 2, 2, 6);
  ctx.strokeStyle = "#2a5a2a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(4, 8); ctx.lineTo(T - 4, 8);
  ctx.moveTo(4, 26); ctx.lineTo(T - 4, 26);
  ctx.stroke();
  return c;
}

function drawGoldDoor() {
  const c = mc(T, T);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#c8a030";
  ctx.fillRect(2, 0, T - 4, T);
  ctx.strokeStyle = "#a08020";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 0, T - 4, T);
  ctx.fillStyle = "rgba(255,255,200,0.2)";
  ctx.fillRect(4, 2, T - 8, 4);
  ctx.fillStyle = "#4a3010";
  ctx.beginPath();
  ctx.arc(T / 2, T / 2 - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(T / 2 - 1.5, T / 2, 3, 7);
  ctx.fillStyle = "#dab840";
  for (let i = 6; i < T - 4; i += 6) {
    ctx.fillRect(i, 1, 2, 2);
    ctx.fillRect(i, T - 3, 2, 2);
  }
  return c;
}

function drawObjective() {
  const c = mc(T, T);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#2a2a3a";
  ctx.fillRect(4, 4, T - 8, T - 8);
  ctx.strokeStyle = "#1a1a2a";
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, T - 8, T - 8);
  ctx.fillStyle = "#0a3a0a";
  ctx.fillRect(7, 7, T - 14, T - 18);
  const glow = ctx.createRadialGradient(T / 2, 13, 2, T / 2, 13, 10);
  glow.addColorStop(0, "rgba(0,200,50,0.4)");
  glow.addColorStop(1, "rgba(0,80,20,0.1)");
  ctx.fillStyle = glow;
  ctx.fillRect(7, 7, T - 14, T - 18);
  ctx.fillStyle = "rgba(0,255,80,0.4)";
  ctx.fillRect(9, 9, 8, 1);
  ctx.fillRect(9, 12, 12, 1);
  ctx.fillRect(9, 15, 6, 1);
  ctx.fillStyle = "#555";
  ctx.fillRect(9, T - 10, 3, 3);
  ctx.fillStyle = "#a03030";
  ctx.fillRect(14, T - 10, 3, 3);
  ctx.fillStyle = "#3a6a3a";
  ctx.fillRect(19, T - 10, 3, 3);
  return c;
}

function drawBomb() {
  const c = mc(T, T);
  const ctx = c.getContext("2d");
  const cx = T / 2, cy = T / 2 + 2;
  const grad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 12);
  grad.addColorStop(0, "#4a4a4a");
  grad.addColorStop(0.5, "#1a1a1a");
  grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a6a3a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 10);
  ctx.quadraticCurveTo(cx + 6, cy - 14, cx + 4, cy - 16);
  ctx.stroke();
  ctx.fillStyle = "#ff6600";
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 16, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffcc00";
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 16, 1, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function drawExplosion(type) {
  const c = mc(T, T);
  const ctx = c.getContext("2d");
  const cx = T / 2, cy = T / 2;
  if (type === "center") {
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.2, "#ffff00");
    grad.addColorStop(0.5, "#ff8800");
    grad.addColorStop(0.8, "#ff2200");
    grad.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, T, T);
  } else if (type === "h") {
    const grad = ctx.createLinearGradient(0, cy - 8, 0, cy + 8);
    grad.addColorStop(0, "rgba(255,100,0,0)");
    grad.addColorStop(0.3, "#ff6600");
    grad.addColorStop(0.5, "#ffcc00");
    grad.addColorStop(0.7, "#ff6600");
    grad.addColorStop(1, "rgba(255,100,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, cy - 8, T, 16);
  } else {
    const grad = ctx.createLinearGradient(cx - 8, 0, cx + 8, 0);
    grad.addColorStop(0, "rgba(255,100,0,0)");
    grad.addColorStop(0.3, "#ff6600");
    grad.addColorStop(0.5, "#ffcc00");
    grad.addColorStop(0.7, "#ff6600");
    grad.addColorStop(1, "rgba(255,100,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 8, 0, 16, T);
  }
  return c;
}

function drawExitMarker() {
  const c = mc(T, T);
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(T / 2, T / 2, 2, T / 2, T / 2, 15);
  grad.addColorStop(0, "#00ff88");
  grad.addColorStop(0.5, "#008844");
  grad.addColorStop(1, "rgba(0,68,34,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, T, T);
  ctx.fillStyle = "#00ff88";
  ctx.beginPath();
  ctx.moveTo(T / 2, 4);
  ctx.lineTo(T / 2 - 6, 14);
  ctx.lineTo(T / 2 - 2, 14);
  ctx.lineTo(T / 2 - 2, 26);
  ctx.lineTo(T / 2 + 2, 26);
  ctx.lineTo(T / 2 + 2, 14);
  ctx.lineTo(T / 2 + 6, 14);
  ctx.closePath();
  ctx.fill();
  return c;
}

// ═══════════════════════════════════════════════════════════════
// POWERUP TEXTURES (24x24)
// ═══════════════════════════════════════════════════════════════

function drawPowerup(type) {
  const S = 24;
  const c = mc(S, S);
  const ctx = c.getContext("2d");
  const cx = S / 2, cy = S / 2;

  ctx.fillStyle = "#e8e8e8";
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.stroke();

  if (type === "bomb") {
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff6600";
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "range") {
    ctx.strokeStyle = "#ff4400";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6);
    ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy);
    ctx.stroke();
    ctx.fillStyle = "#ff4400";
    for (const [ax, ay, angle] of [[0, -6, 0], [0, 6, Math.PI], [-6, 0, -Math.PI / 2], [6, 0, Math.PI / 2]]) {
      ctx.save();
      ctx.translate(cx + ax, cy + ay);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -3); ctx.lineTo(-2, 0); ctx.lineTo(2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (type === "speed") {
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 7);
    ctx.lineTo(cx - 3, cy);
    ctx.lineTo(cx + 1, cy);
    ctx.lineTo(cx - 2, cy + 7);
    ctx.lineTo(cx + 4, cy - 1);
    ctx.lineTo(cx, cy - 1);
    ctx.closePath();
    ctx.fill();
  } else if (type === "key") {
    ctx.fillStyle = "#c8a030";
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx, cy - 1, 7, 2);
    ctx.fillRect(cx + 5, cy - 1, 2, 4);
    ctx.fillRect(cx + 2, cy - 1, 2, 3);
    ctx.fillStyle = "#806020";
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  return c;
}

// ═══════════════════════════════════════════════════════════════
// CHARACTER TEXTURES (32x32 — player and guards)
// ═══════════════════════════════════════════════════════════════

function drawCharacter(dir, frame, opts = {}) {
  const S = 32;
  const c = mc(S, S);
  const ctx = c.getContext("2d");
  const cx = S / 2, cy = S / 2;

  const {
    bodyColor = "#ffffff",
    headColor = "#e8d4b8",
    kippah = false,
    starOD = false,
    rifle = false,
    beret = false,
  } = opts;

  const isPlayer = kippah && starOD;
  const walkOffset = frame === 1 ? 1 : 0;

  // ── Dark outline silhouette ──
  ctx.fillStyle = isPlayer ? "#0a0a0a" : "rgba(0,0,0,0.3)";
  if (dir === "down" || dir === "up") {
    capsule(ctx, cx - 7, cy - 3, 14, 13, 3);
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 10 + (6 + walkOffset) / 2, 3.5, (6 + walkOffset) / 2 + 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 10 + (6 - walkOffset) / 2, 3.5, (6 - walkOffset) / 2 + 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 7.5, cy + 4, 2.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 7.5, cy + 4, 2.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    capsule(ctx, cx - 6, cy - 3, 12, 13, 3);
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy + 10 + (6 + walkOffset) / 2, 3, (6 + walkOffset) / 2 + 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 10 + (6 - walkOffset) / 2, 3, (6 - walkOffset) / 2 + 1, 0, 0, Math.PI * 2);
    ctx.fill();
    if (dir === "left") {
      ctx.beginPath();
      ctx.ellipse(cx - 5.5, cy + 4, 2.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx + 5.5, cy + 4, 2.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 8, 0, Math.PI * 2);
  ctx.fill();

  // ── Body ──
  ctx.fillStyle = bodyColor;
  if (dir === "down" || dir === "up") {
    capsule(ctx, cx - 6, cy - 2, 12, 12, 3);
    if (isPlayer) {
      ctx.fillStyle = "#333333";
      capsule(ctx, cx - 5, cy - 1, 10, 10, 2);
    }
    ctx.fillStyle = isPlayer ? "#1a1a1a" : "#3a3a4a";
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 10 + (6 + walkOffset) / 2, 2.5, (6 + walkOffset) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 10 + (6 - walkOffset) / 2, 2.5, (6 - walkOffset) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isPlayer ? "#0e0e0e" : "#111111";
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy + 14 + walkOffset + 1, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 14 - walkOffset + 1, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(cx - 7.5, cy + 4, 2, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 7.5, cy + 4, 2, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    capsule(ctx, cx - 5, cy - 2, 10, 12, 3);
    if (isPlayer) {
      ctx.fillStyle = "#333333";
      capsule(ctx, cx - 4, cy - 1, 8, 10, 2);
    }
    ctx.fillStyle = isPlayer ? "#1a1a1a" : "#3a3a4a";
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy + 10 + (6 + walkOffset) / 2, 2.5, (6 + walkOffset) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 10 + (6 - walkOffset) / 2, 2.5, (6 - walkOffset) / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isPlayer ? "#0e0e0e" : "#111111";
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy + 14 + walkOffset + 1, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 14 - walkOffset + 1, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bodyColor;
    if (dir === "left") {
      ctx.beginPath();
      ctx.ellipse(cx - 5.5, cy + 4, 2, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx + 5.5, cy + 4, 2, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Hands ──
  ctx.fillStyle = headColor;
  if (dir === "down" || dir === "up") {
    ctx.beginPath();
    ctx.ellipse(cx - 7.5, cy + 8.5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 7.5, cy + 8.5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isPlayer) {
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(cx + 7.5, cy + 11, 1.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (dir === "left") {
    ctx.beginPath();
    ctx.ellipse(cx - 5.5, cy + 8.5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isPlayer) {
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(cx - 8, cy + 8.5, 4, 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.beginPath();
    ctx.ellipse(cx + 5.5, cy + 8.5, 2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isPlayer) {
      ctx.fillStyle = "#1a1a1a";
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

  // ── Face ──
  if (dir === "down") {
    if (isPlayer) {
      // Eyebrows
      ctx.strokeStyle = "#1A1A1A";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.moveTo(cx - 5.5, cy - 9); ctx.lineTo(cx - 0.5, cy - 9.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 0.5, cy - 9.5); ctx.lineTo(cx + 5.5, cy - 9);
      ctx.stroke();
      // Aviator sunglasses
      ctx.fillStyle = "#0A0A0A";
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 0.5, cy - 7.5); ctx.lineTo(cx + 0.5, cy - 7.5);
      ctx.stroke();
      // Lens reflection
      ctx.strokeStyle = "rgba(180, 220, 255, 0.4)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 4.5, cy - 8); ctx.lineTo(cx - 1.5, cy - 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 1.5, cy - 8); ctx.lineTo(cx + 4.5, cy - 7);
      ctx.stroke();
      // Mouth
      ctx.strokeStyle = "#6a4030";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy - 3.5); ctx.lineTo(cx + 2, cy - 3.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy - 7, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy - 7, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(cx, cy - 3.5, 1.5, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }
  } else if (dir === "left") {
    if (isPlayer) {
      ctx.fillStyle = "#0A0A0A";
      ctx.beginPath();
      ctx.ellipse(cx - 3.5, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.strokeStyle = "#6a4030";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 3.5); ctx.lineTo(cx, cy - 3.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.ellipse(cx - 4, cy - 7, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (dir === "right") {
    if (isPlayer) {
      ctx.fillStyle = "#0A0A0A";
      ctx.beginPath();
      ctx.ellipse(cx + 3.5, cy - 7.5, 2.5, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.strokeStyle = "#6a4030";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 3.5); ctx.lineTo(cx + 3, cy - 3.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.ellipse(cx + 4, cy - 7, 1.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Hair / Kippah ──
  if (kippah) {
    ctx.fillStyle = "#1A1A1A";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 11, 7.5, 4, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 12);
    ctx.bezierCurveTo(cx - 4, cy - 16, cx + 3, cy - 16.5, cx + 6, cy - 12);
    ctx.bezierCurveTo(cx + 7, cy - 10, cx - 7, cy - 10, cx - 6, cy - 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 9, 2, Math.PI * 0.7, Math.PI * 1.7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 7, cy - 9, 2, Math.PI * 1.3, Math.PI * 0.3);
    ctx.fill();
  }

  // ── Beret (guards) ──
  if (beret) {
    ctx.fillStyle = "#3a4a30";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 11, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    capsule(ctx, cx - 7, cy - 12, 14, 2, 1);
  }

  // ── Star of David on vest ──
  if (starOD) {
    starOfDavid(ctx, cx, cy + 5, 4, "#FFD700");
    ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(cx, cy + 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Rifle (guards) ──
  if (rifle) {
    ctx.fillStyle = "#3a3a3a";
    if (dir === "right") {
      ctx.fillRect(cx + 7, cy - 2, 10, 2);
      ctx.fillRect(cx + 15, cy - 4, 2, 4);
    } else if (dir === "left") {
      ctx.fillRect(cx - 17, cy - 2, 10, 2);
      ctx.fillRect(cx - 17, cy - 4, 2, 4);
    } else if (dir === "down") {
      ctx.fillRect(cx + 7, cy + 2, 8, 2);
    } else {
      ctx.fillRect(cx - 15, cy + 2, 8, 2);
    }
  }

  return c;
}

// ═══════════════════════════════════════════════════════════════
// HUD TEXTURES
// ═══════════════════════════════════════════════════════════════

function drawHeart() {
  const c = mc(16, 16);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#e83030";
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.bezierCurveTo(2, 10, 0, 5, 4, 2);
  ctx.bezierCurveTo(6, 0, 8, 2, 8, 4);
  ctx.bezierCurveTo(8, 2, 10, 0, 12, 2);
  ctx.bezierCurveTo(16, 5, 14, 10, 8, 14);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.arc(5, 5, 2, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function drawHeartEmpty() {
  const c = mc(16, 16);
  const ctx = c.getContext("2d");
  ctx.strokeStyle = "#6a2020";
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

function drawKeyIcon() {
  const c = mc(16, 16);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#666";
  ctx.beginPath();
  ctx.arc(6, 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(9, 5, 6, 2);
  ctx.fillRect(13, 5, 2, 4);
  ctx.fillRect(11, 5, 2, 3);
  ctx.fillStyle = "#444";
  ctx.beginPath();
  ctx.arc(6, 6, 2, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function drawKeyIconActive() {
  const c = mc(16, 16);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#c8a030";
  ctx.beginPath();
  ctx.arc(6, 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(9, 5, 6, 2);
  ctx.fillRect(13, 5, 2, 4);
  ctx.fillRect(11, 5, 2, 3);
  ctx.fillStyle = "#806020";
  ctx.beginPath();
  ctx.arc(6, 6, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,200,50,0.25)";
  ctx.beginPath();
  ctx.arc(8, 8, 8, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

let _generated = false;

export function generateBombermanTextures(k) {
  if (_generated) return;
  _generated = true;

  // --- Tiles ---
  k.loadSprite("bm_floor", drawFloor().toDataURL());
  k.loadSprite("bm_wall", drawWall().toDataURL());
  k.loadSprite("bm_breakable", drawBreakable().toDataURL());
  k.loadSprite("bm_door", drawDoor().toDataURL());
  k.loadSprite("bm_gdoor", drawGoldDoor().toDataURL());
  k.loadSprite("bm_obj", drawObjective().toDataURL());
  k.loadSprite("bm_bomb", drawBomb().toDataURL());
  k.loadSprite("bm_exit", drawExitMarker().toDataURL());

  // --- Explosions ---
  k.loadSprite("bm_explode_center", drawExplosion("center").toDataURL());
  k.loadSprite("bm_explode_h", drawExplosion("h").toDataURL());
  k.loadSprite("bm_explode_v", drawExplosion("v").toDataURL());

  // --- Powerups ---
  for (const type of ["bomb", "range", "speed", "key"]) {
    k.loadSprite(`bm_powerup_${type}`, drawPowerup(type).toDataURL());
  }

  // --- Player character (4 dirs x 2 frames) ---
  const playerOpts = {
    bodyColor: "#2D4A1E",
    headColor: "#e8d4b8",
    kippah: true,
    starOD: true,
  };
  for (const dir of ["down", "up", "left", "right"]) {
    for (const frame of [0, 1]) {
      k.loadSprite(
        `bm_player_${dir}_${frame}`,
        drawCharacter(dir, frame, playerOpts).toDataURL()
      );
    }
  }

  // --- Patrol guard (olive green, beret, rifle) ---
  const patrolOpts = {
    bodyColor: "#2D4A1E",
    headColor: "#c8a080",
    beret: true,
    rifle: true,
  };
  for (const dir of ["down", "up", "left", "right"]) {
    for (const frame of [0, 1]) {
      k.loadSprite(
        `bm_patrol_${dir}_${frame}`,
        drawCharacter(dir, frame, patrolOpts).toDataURL()
      );
    }
  }

  // --- Chaser guard (red-tinted, beret, rifle) ---
  const chaserOpts = {
    bodyColor: "#8B1A1A",
    headColor: "#c8a080",
    beret: true,
    rifle: true,
  };
  for (const dir of ["down", "up", "left", "right"]) {
    for (const frame of [0, 1]) {
      k.loadSprite(
        `bm_chaser_${dir}_${frame}`,
        drawCharacter(dir, frame, chaserOpts).toDataURL()
      );
    }
  }

  // --- HUD ---
  k.loadSprite("bm_heart", drawHeart().toDataURL());
  k.loadSprite("bm_heart_empty", drawHeartEmpty().toDataURL());
  k.loadSprite("bm_key_icon", drawKeyIcon().toDataURL());
  k.loadSprite("bm_key_icon_active", drawKeyIconActive().toDataURL());
}
