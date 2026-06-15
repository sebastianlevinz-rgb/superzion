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

// ═══════════════════════════════════════════════════════════════
// PLATFORMER TEXTURES (Level 1 — Tehran Rooftop Run)
// ═══════════════════════════════════════════════════════════════

function drawPlatformerPlayer(pose, frame) {
  const S = 32;
  const c = mc(S, S);
  const ctx = c.getContext("2d");
  const cx = S / 2, cy = S / 2;

  // Leg offsets for run animation
  let leftLegOff = 0, rightLegOff = 0;
  if (pose === "run") {
    const offsets = [
      [3, -3], [-1, 2], [-3, 3], [1, -2],
    ];
    leftLegOff = offsets[frame][0];
    rightLegOff = offsets[frame][1];
  } else if (pose === "jump") {
    leftLegOff = -2;
    rightLegOff = 2;
  }

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(cx, S - 2, 8, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brown boots
  ctx.fillStyle = "#5a3a1a";
  ctx.fillRect(cx - 5, 24 + leftLegOff, 4, 4);
  ctx.fillRect(cx + 1, 24 + rightLegOff, 4, 4);

  // Brown pants / legs
  ctx.fillStyle = "#6a4a2a";
  ctx.fillRect(cx - 5, 18 + leftLegOff, 4, 7);
  ctx.fillRect(cx + 1, 18 + rightLegOff, 4, 7);

  // Green tactical vest (body)
  ctx.fillStyle = "#2D4A1E";
  ctx.fillRect(cx - 6, 8, 12, 11);
  // Vest pockets
  ctx.fillStyle = "#243F18";
  ctx.fillRect(cx - 5, 10, 4, 3);
  ctx.fillRect(cx + 1, 10, 4, 3);

  // Gold Star of David on chest
  starOfDavid(ctx, cx, 14, 3, "#FFD700");

  // Arms
  ctx.fillStyle = "#2D4A1E";
  if (pose === "jump") {
    // Arms up
    ctx.fillRect(cx - 8, 6, 3, 6);
    ctx.fillRect(cx + 5, 6, 3, 6);
  } else if (pose === "run") {
    // Arms swing
    const armOff = frame % 2 === 0 ? -1 : 1;
    ctx.fillRect(cx - 8, 10 + armOff, 3, 6);
    ctx.fillRect(cx + 5, 10 - armOff, 3, 6);
  } else {
    // Arms down
    ctx.fillRect(cx - 8, 10, 3, 6);
    ctx.fillRect(cx + 5, 10, 3, 6);
  }
  // Hands (skin)
  ctx.fillStyle = "#e8d4b8";
  if (pose === "jump") {
    ctx.fillRect(cx - 8, 5, 3, 2);
    ctx.fillRect(cx + 5, 5, 3, 2);
  } else {
    ctx.fillRect(cx - 8, 15, 3, 2);
    ctx.fillRect(cx + 5, 15, 3, 2);
  }

  // Head (skin)
  ctx.fillStyle = "#e8d4b8";
  ctx.beginPath();
  ctx.arc(cx, 5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Hair (dark)
  ctx.fillStyle = "#1A1A1A";
  ctx.beginPath();
  ctx.ellipse(cx, 2, 6, 3, 0, Math.PI, 0);
  ctx.fill();

  // Blue kippah
  ctx.fillStyle = "#2244aa";
  ctx.beginPath();
  ctx.ellipse(cx, 1, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // White stripe on kippah
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx - 4, 1);
  ctx.lineTo(cx + 4, 1);
  ctx.stroke();

  // Aviator sunglasses
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(cx - 5, 3, 4, 2);
  ctx.fillRect(cx + 1, 3, 4, 2);
  // Bridge
  ctx.fillRect(cx - 1, 3, 2, 1);
  // Lens reflection
  ctx.fillStyle = "rgba(150,200,255,0.3)";
  ctx.fillRect(cx - 4, 3, 2, 1);
  ctx.fillRect(cx + 2, 3, 2, 1);

  // Mouth
  ctx.fillStyle = "#8a5a40";
  ctx.fillRect(cx - 1, 7, 3, 1);

  return c;
}

function drawPlatformerGuard(frame) {
  const S = 32;
  const c = mc(S, S);
  const ctx = c.getContext("2d");
  const cx = S / 2, cy = S / 2;

  // Leg offsets for walk
  const offsets = [
    [2, -2], [0, 0], [-2, 2], [0, 0],
  ];
  const leftLegOff = offsets[frame][0];
  const rightLegOff = offsets[frame][1];

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(cx, S - 2, 8, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Black boots
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - 5, 24 + leftLegOff, 4, 4);
  ctx.fillRect(cx + 1, 24 + rightLegOff, 4, 4);

  // Olive pants
  ctx.fillStyle = "#3a4a30";
  ctx.fillRect(cx - 5, 18 + leftLegOff, 4, 7);
  ctx.fillRect(cx + 1, 18 + rightLegOff, 4, 7);

  // Olive uniform body
  ctx.fillStyle = "#4a5a40";
  ctx.fillRect(cx - 6, 8, 12, 11);
  // Belt
  ctx.fillStyle = "#2a2a20";
  ctx.fillRect(cx - 6, 17, 12, 2);

  // Arms
  ctx.fillStyle = "#4a5a40";
  ctx.fillRect(cx - 8, 10, 3, 6);
  ctx.fillRect(cx + 5, 10, 3, 6);
  // Rifle in right hand
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(cx + 7, 8, 2, 10);
  ctx.fillRect(cx + 6, 7, 4, 2);

  // Hands
  ctx.fillStyle = "#c8a080";
  ctx.fillRect(cx - 8, 15, 3, 2);
  ctx.fillRect(cx + 5, 15, 3, 2);

  // Head
  ctx.fillStyle = "#c8a080";
  ctx.beginPath();
  ctx.arc(cx, 5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Beret (olive)
  ctx.fillStyle = "#3a4a30";
  ctx.beginPath();
  ctx.ellipse(cx, 1, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Beret brim
  ctx.fillRect(cx - 7, 2, 14, 2);

  // Eyes (dark dots)
  ctx.fillStyle = "#222";
  ctx.fillRect(cx - 3, 4, 2, 2);
  ctx.fillRect(cx + 1, 4, 2, 2);

  // Frown
  ctx.strokeStyle = "#6a4a3a";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 2, 8);
  ctx.lineTo(cx + 2, 8);
  ctx.stroke();

  return c;
}

function drawPlatBlock() {
  const c = mc(32, 32);
  const ctx = c.getContext("2d");
  // Concrete gray
  ctx.fillStyle = "#666666";
  ctx.fillRect(0, 0, 32, 32);
  // Lighter top edge
  ctx.fillStyle = "#888888";
  ctx.fillRect(0, 0, 32, 3);
  // Subtle horizontal mortar line
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(32, 16);
  ctx.stroke();
  // Random specks for texture
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(5, 8, 2, 2);
  ctx.fillRect(18, 22, 2, 2);
  ctx.fillRect(26, 6, 2, 2);
  return c;
}

function drawGroundBlock() {
  const c = mc(32, 32);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#555555";
  ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = "#666666";
  ctx.fillRect(0, 0, 32, 2);
  // Darker patches
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(3, 10, 6, 4);
  ctx.fillRect(16, 20, 8, 3);
  return c;
}

function drawPlatBullet() {
  const c = mc(8, 4);
  const ctx = c.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 8, 0);
  grad.addColorStop(0, "#ffee66");
  grad.addColorStop(0.5, "#ffcc00");
  grad.addColorStop(1, "#ff8800");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(4, 2, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bright core
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(1, 1, 3, 2);
  return c;
}

function drawPlatTarget() {
  const c = mc(32, 48);
  const ctx = c.getContext("2d");
  // Door frame (dark)
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(2, 0, 28, 48);
  // Door
  ctx.fillStyle = "#5a3a2a";
  ctx.fillRect(4, 4, 24, 44);
  // Door handle
  ctx.fillStyle = "#888";
  ctx.beginPath();
  ctx.arc(22, 28, 2, 0, Math.PI * 2);
  ctx.fill();
  // Red glow around door
  const glow = ctx.createRadialGradient(16, 24, 4, 16, 24, 24);
  glow.addColorStop(0, "rgba(255,50,50,0.3)");
  glow.addColorStop(1, "rgba(255,50,50,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 32, 48);
  // Arrow marker above door
  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(10, 6);
  ctx.lineTo(22, 6);
  ctx.closePath();
  ctx.fill();
  return c;
}

let _pltGenerated = false;

export function generatePlatformerTextures(k) {
  if (_pltGenerated) return;
  _pltGenerated = true;

  // Player idle
  k.loadSprite("plt_player_idle", drawPlatformerPlayer("idle", 0).toDataURL());

  // Player run frames (4)
  for (let i = 0; i < 4; i++) {
    k.loadSprite(`plt_player_run_${i}`, drawPlatformerPlayer("run", i).toDataURL());
  }

  // Player jump
  k.loadSprite("plt_player_jump", drawPlatformerPlayer("jump", 0).toDataURL());

  // Guard walk frames (4)
  for (let i = 0; i < 4; i++) {
    k.loadSprite(`plt_guard_walk_${i}`, drawPlatformerGuard(i).toDataURL());
  }

  // Platform block
  k.loadSprite("plt_platform", drawPlatBlock().toDataURL());

  // Ground block
  k.loadSprite("plt_ground", drawGroundBlock().toDataURL());

  // Bullet
  k.loadSprite("plt_bullet", drawPlatBullet().toDataURL());

  // Target entrance
  k.loadSprite("plt_target", drawPlatTarget().toDataURL());

  // HUD hearts (reuse bomberman hearts)
  // They are separate — generate them here too for independence
  k.loadSprite("plt_heart", drawHeart().toDataURL());
  k.loadSprite("plt_heart_empty", drawHeartEmpty().toDataURL());
}

// ═══════════════════════════════════════════════════════════════
// STEALTH / PORT SWAP TEXTURES (Level 2)
// ═══════════════════════════════════════════════════════════════

function drawPortFloor() {
  const c = mc(32, 32);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#6e6e6e";
  ctx.fillRect(0, 0, 32, 32);
  // Concrete texture
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, 32, 32);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(2, 2, 12, 6);
  ctx.fillRect(16, 14, 10, 8);
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(8, 18, 8, 4);
  ctx.fillRect(22, 4, 6, 6);
  return c;
}

function drawPortWater() {
  const c = mc(32, 32);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1a3a5a";
  ctx.fillRect(0, 0, 32, 32);
  // Wave hints
  ctx.strokeStyle = "rgba(80,160,220,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.quadraticCurveTo(8, 7, 16, 10);
  ctx.quadraticCurveTo(24, 13, 32, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 22);
  ctx.quadraticCurveTo(10, 19, 20, 22);
  ctx.quadraticCurveTo(28, 25, 32, 22);
  ctx.stroke();
  // Deep spots
  ctx.fillStyle = "rgba(0,20,50,0.2)";
  ctx.fillRect(4, 4, 6, 4);
  ctx.fillRect(20, 16, 8, 4);
  return c;
}

function drawContainer(color) {
  const c = mc(40, 18);
  const ctx = c.getContext("2d");
  const colorMap = {
    red: "#c0392b",
    blue: "#2980b9",
    green: "#27ae60",
    yellow: "#f1c40f",
    orange: "#e67e22",
  };
  ctx.fillStyle = colorMap[color] || "#888";
  ctx.fillRect(0, 0, 40, 18);
  // Edge highlights
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(0, 0, 40, 2);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 16, 40, 2);
  // Door lines
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(19, 2);
  ctx.lineTo(19, 16);
  ctx.moveTo(21, 2);
  ctx.lineTo(21, 16);
  ctx.stroke();
  // Corrugation
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  for (let x = 4; x < 40; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 18);
    ctx.stroke();
  }
  return c;
}

function drawContainerTarget() {
  const c = mc(40, 18);
  const ctx = c.getContext("2d");
  // Base (dark gray)
  ctx.fillStyle = "#555";
  ctx.fillRect(0, 0, 40, 18);
  // Diagonal stripes (yellow/black warning)
  ctx.strokeStyle = "#f1c40f";
  ctx.lineWidth = 3;
  for (let i = -18; i < 60; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 18, 18);
    ctx.stroke();
  }
  // Border
  ctx.strokeStyle = "#f1c40f";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, 38, 16);
  return c;
}

function drawStealthPlayer() {
  const c = mc(14, 14);
  const ctx = c.getContext("2d");
  // Body (dark operative suit)
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(3, 4, 8, 8);
  // Head
  ctx.fillStyle = "#2d5a27";
  ctx.beginPath();
  ctx.arc(7, 4, 3, 0, Math.PI * 2);
  ctx.fill();
  // Night vision dot
  ctx.fillStyle = "#00ff44";
  ctx.beginPath();
  ctx.arc(7, 3, 1, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.fillStyle = "#111";
  ctx.fillRect(4, 11, 2, 3);
  ctx.fillRect(8, 11, 2, 3);
  return c;
}

function drawStealthGuard(dir) {
  const c = mc(20, 20);
  const ctx = c.getContext("2d");
  // Olive uniform body
  ctx.fillStyle = "#4a5a3a";
  ctx.fillRect(5, 6, 10, 10);
  // Head
  ctx.fillStyle = "#c8a882";
  ctx.beginPath();
  ctx.arc(10, 6, 4, 0, Math.PI * 2);
  ctx.fill();
  // Beret
  ctx.fillStyle = "#3a3a2a";
  ctx.fillRect(6, 2, 8, 3);
  // Facing indicator
  ctx.fillStyle = "#222";
  const indicators = {
    down:  [9, 8, 2, 2],
    up:    [9, 3, 2, 2],
    left:  [5, 6, 2, 2],
    right: [13, 6, 2, 2],
  };
  const ind = indicators[dir] || indicators.down;
  ctx.fillRect(ind[0], ind[1], ind[2], ind[3]);
  // Legs
  ctx.fillStyle = "#3a4a2a";
  ctx.fillRect(6, 15, 3, 4);
  ctx.fillRect(11, 15, 3, 4);
  return c;
}

function drawSecCamera() {
  const c = mc(12, 12);
  const ctx = c.getContext("2d");
  // Mount
  ctx.fillStyle = "#444";
  ctx.fillRect(4, 0, 4, 4);
  // Camera body
  ctx.fillStyle = "#222";
  ctx.fillRect(2, 4, 8, 6);
  // Lens
  ctx.fillStyle = "#ff2222";
  ctx.beginPath();
  ctx.arc(6, 7, 2, 0, Math.PI * 2);
  ctx.fill();
  // Blink dot
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(6, 7, 1, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function drawPortWorker() {
  const c = mc(12, 12);
  const ctx = c.getContext("2d");
  // Blue outfit
  ctx.fillStyle = "#2266aa";
  ctx.fillRect(3, 4, 6, 6);
  // Head
  ctx.fillStyle = "#d4a574";
  ctx.beginPath();
  ctx.arc(6, 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Hard hat
  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(3, 0, 6, 2);
  return c;
}

function drawCrane() {
  const c = mc(60, 20);
  const ctx = c.getContext("2d");
  // Vertical mast
  ctx.fillStyle = "#555";
  ctx.fillRect(28, 0, 4, 20);
  // Boom arm
  ctx.fillStyle = "#666";
  ctx.fillRect(0, 2, 60, 3);
  // Cable
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 5);
  ctx.lineTo(10, 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(50, 5);
  ctx.lineTo(50, 14);
  ctx.stroke();
  // Hook
  ctx.fillStyle = "#999";
  ctx.fillRect(8, 14, 4, 3);
  return c;
}

function drawShip() {
  const c = mc(80, 30);
  const ctx = c.getContext("2d");
  // Hull
  ctx.fillStyle = "#3a3a4a";
  ctx.beginPath();
  ctx.moveTo(5, 15);
  ctx.lineTo(0, 28);
  ctx.lineTo(80, 28);
  ctx.lineTo(75, 15);
  ctx.closePath();
  ctx.fill();
  // Deck
  ctx.fillStyle = "#4a4a5a";
  ctx.fillRect(8, 12, 64, 4);
  // Bridge
  ctx.fillStyle = "#555";
  ctx.fillRect(55, 2, 14, 12);
  // Windows
  ctx.fillStyle = "#8ac";
  ctx.fillRect(57, 4, 4, 3);
  ctx.fillRect(63, 4, 4, 3);
  // Waterline
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(2, 25, 76, 3);
  return c;
}

function drawDockEdge() {
  const c = mc(32, 32);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#6e6e6e";
  ctx.fillRect(0, 0, 32, 32);
  // Yellow stripe
  ctx.fillStyle = "#f1c40f";
  ctx.fillRect(0, 0, 32, 6);
  ctx.fillStyle = "#222";
  for (let x = 0; x < 32; x += 8) {
    ctx.fillRect(x, 0, 4, 6);
  }
  return c;
}

function drawBuilding() {
  const c = mc(64, 48);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#5a5a6a";
  ctx.fillRect(0, 0, 64, 48);
  ctx.strokeStyle = "#4a4a5a";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 64, 48);
  // Windows
  ctx.fillStyle = "#8ab";
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.fillRect(6 + col * 15, 6 + row * 14, 8, 8);
    }
  }
  // Door
  ctx.fillStyle = "#333";
  ctx.fillRect(26, 34, 12, 14);
  return c;
}

function drawRock() {
  const c = mc(6, 6);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#888";
  ctx.beginPath();
  ctx.arc(3, 3, 3, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function drawExitMarkerStealth() {
  const c = mc(32, 32);
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 14);
  grad.addColorStop(0, "#00ff88");
  grad.addColorStop(0.5, "#008844");
  grad.addColorStop(1, "rgba(0,68,34,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  // Arrow
  ctx.fillStyle = "#00ff88";
  ctx.beginPath();
  ctx.moveTo(16, 6);
  ctx.lineTo(10, 16);
  ctx.lineTo(13, 16);
  ctx.lineTo(13, 26);
  ctx.lineTo(19, 26);
  ctx.lineTo(19, 16);
  ctx.lineTo(22, 16);
  ctx.closePath();
  ctx.fill();
  return c;
}

let _stealthGenerated = false;

export function generateStealthTextures(k) {
  if (_stealthGenerated) return;
  _stealthGenerated = true;

  // Floor and water
  k.loadSprite("ps_floor", drawPortFloor().toDataURL());
  k.loadSprite("ps_water", drawPortWater().toDataURL());
  k.loadSprite("ps_dock_edge", drawDockEdge().toDataURL());

  // Containers (5 colors + target)
  for (const color of ["red", "blue", "green", "yellow", "orange"]) {
    k.loadSprite(`ps_container_${color}`, drawContainer(color).toDataURL());
  }
  k.loadSprite("ps_container_target", drawContainerTarget().toDataURL());

  // Player
  k.loadSprite("ps_player", drawStealthPlayer().toDataURL());

  // Guards (4 directions)
  for (const dir of ["down", "up", "left", "right"]) {
    k.loadSprite(`ps_guard_${dir}`, drawStealthGuard(dir).toDataURL());
  }

  // Security camera
  k.loadSprite("ps_camera", drawSecCamera().toDataURL());

  // Worker
  k.loadSprite("ps_worker", drawPortWorker().toDataURL());

  // Crane and ship
  k.loadSprite("ps_crane", drawCrane().toDataURL());
  k.loadSprite("ps_ship", drawShip().toDataURL());

  // Buildings
  k.loadSprite("ps_building", drawBuilding().toDataURL());

  // Rock (distraction projectile)
  k.loadSprite("ps_rock", drawRock().toDataURL());

  // Exit marker
  k.loadSprite("ps_exit", drawExitMarkerStealth().toDataURL());
}

// ═══════════════════════════════════════════════════════════════
// AERIAL TEXTURES (Level 3 — Bomber Scene)
// ═══════════════════════════════════════════════════════════════

function drawJetF15() {
  const c = mc(60, 20);
  const ctx = c.getContext("2d");

  // Fuselage (gray body)
  ctx.fillStyle = "#7a7a88";
  ctx.beginPath();
  ctx.moveTo(2, 10);   // nose
  ctx.lineTo(8, 6);
  ctx.lineTo(40, 4);
  ctx.lineTo(52, 5);   // tail section
  ctx.lineTo(55, 8);
  ctx.lineTo(55, 12);
  ctx.lineTo(52, 15);
  ctx.lineTo(40, 16);
  ctx.lineTo(8, 14);
  ctx.closePath();
  ctx.fill();

  // Darker belly
  ctx.fillStyle = "#5a5a68";
  ctx.fillRect(8, 12, 38, 3);

  // Delta wings (swept back)
  ctx.fillStyle = "#6a6a78";
  ctx.beginPath();
  ctx.moveTo(18, 6);
  ctx.lineTo(32, 0);
  ctx.lineTo(38, 1);
  ctx.lineTo(28, 6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, 14);
  ctx.lineTo(32, 20);
  ctx.lineTo(38, 19);
  ctx.lineTo(28, 14);
  ctx.closePath();
  ctx.fill();

  // Twin tail fins
  ctx.fillStyle = "#5a5a68";
  ctx.beginPath();
  ctx.moveTo(48, 5);
  ctx.lineTo(54, 1);
  ctx.lineTo(56, 2);
  ctx.lineTo(52, 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(48, 15);
  ctx.lineTo(54, 19);
  ctx.lineTo(56, 18);
  ctx.lineTo(52, 15);
  ctx.closePath();
  ctx.fill();

  // Cockpit canopy (blue tint)
  ctx.fillStyle = "#5588aa";
  ctx.beginPath();
  ctx.ellipse(10, 9, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6699bb";
  ctx.beginPath();
  ctx.ellipse(9, 8, 2, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Engine glow (afterburner at tail)
  ctx.fillStyle = "#ff6600";
  ctx.beginPath();
  ctx.ellipse(56, 10, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffaa00";
  ctx.beginPath();
  ctx.ellipse(56, 10, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

function drawBombSprite() {
  const c = mc(8, 8);
  const ctx = c.getContext("2d");

  // Outer circle
  ctx.fillStyle = "#ff8800";
  ctx.beginPath();
  ctx.arc(4, 4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#cc6600";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Inner highlight
  ctx.fillStyle = "#ffcc00";
  ctx.beginPath();
  ctx.arc(3, 3, 1.5, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

function drawCarrierDeck() {
  const c = mc(200, 40);
  const ctx = c.getContext("2d");

  // Main deck (dark gray)
  ctx.fillStyle = "#5a5a62";
  ctx.fillRect(0, 10, 200, 30);

  // Deck surface (lighter gray)
  ctx.fillStyle = "#6a6a72";
  ctx.fillRect(5, 10, 190, 5);

  // Runway lines (white dashes)
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(10, 14);
  ctx.lineTo(190, 14);
  ctx.stroke();
  ctx.setLineDash([]);

  // Edge markings (yellow)
  ctx.fillStyle = "#ccaa00";
  ctx.fillRect(5, 10, 3, 1);
  ctx.fillRect(60, 10, 3, 1);
  ctx.fillRect(120, 10, 3, 1);
  ctx.fillRect(180, 10, 3, 1);

  // Hull below deck (darker)
  ctx.fillStyle = "#3a3a42";
  ctx.fillRect(10, 15, 180, 25);

  // Hull bottom curve
  ctx.fillStyle = "#2a2a32";
  ctx.beginPath();
  ctx.moveTo(10, 40);
  ctx.quadraticCurveTo(100, 45, 190, 40);
  ctx.lineTo(190, 40);
  ctx.lineTo(10, 40);
  ctx.closePath();
  ctx.fill();

  // Bridge/island (right side)
  ctx.fillStyle = "#4a4a52";
  ctx.fillRect(160, 0, 25, 10);
  ctx.fillStyle = "#3a3a42";
  ctx.fillRect(165, 2, 8, 6);

  // Antennas
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(170, 0); ctx.lineTo(170, -4);
  ctx.moveTo(178, 0); ctx.lineTo(178, -3);
  ctx.stroke();

  return c;
}

function drawChaffSprite() {
  const c = mc(6, 6);
  const ctx = c.getContext("2d");

  // White sparkle
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(3, 0); ctx.lineTo(3.8, 2.2); ctx.lineTo(6, 3);
  ctx.lineTo(3.8, 3.8); ctx.lineTo(3, 6); ctx.lineTo(2.2, 3.8);
  ctx.lineTo(0, 3); ctx.lineTo(2.2, 2.2);
  ctx.closePath();
  ctx.fill();

  return c;
}

let _aerialGenerated = false;

export function generateAerialTextures(k) {
  if (_aerialGenerated) return;
  _aerialGenerated = true;

  k.loadSprite("jet_f15", drawJetF15().toDataURL());
  k.loadSprite("bomb_sprite", drawBombSprite().toDataURL());
  k.loadSprite("carrier_deck", drawCarrierDeck().toDataURL());
  k.loadSprite("chaff_sprite", drawChaffSprite().toDataURL());
}

// ═══════════════════════════════════════════════════════════════
// DRONE / BOSS TEXTURES (Level 4 — Operation Underground)
// ═══════════════════════════════════════════════════════════════

function drawDroneSprite() {
  const c = mc(24, 24);
  const ctx = c.getContext("2d");
  const cx = 12, cy = 12;
  // Body
  ctx.fillStyle = "#3a3a42";
  ctx.fillRect(cx - 6, cy - 4, 12, 8);
  // Arms
  ctx.fillStyle = "#4a4a52";
  ctx.fillRect(cx - 10, cy - 1, 20, 2);
  ctx.fillRect(cx - 1, cy - 10, 2, 20);
  // Rotors (4 corners)
  ctx.fillStyle = "#666";
  ctx.beginPath(); ctx.arc(cx - 9, cy - 9, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy - 9, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 9, cy + 9, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy + 9, 3, 0, Math.PI * 2); ctx.fill();
  // Camera lens (red dot)
  ctx.fillStyle = "#cc2222";
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
  // Rotor blade hints
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 0.5;
  [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(([rx, ry]) => {
    ctx.beginPath(); ctx.moveTo(cx + rx - 3, cy + ry); ctx.lineTo(cx + rx + 3, cy + ry); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rx, cy + ry - 3); ctx.lineTo(cx + rx, cy + ry + 3); ctx.stroke();
  });
  return c;
}

function drawDroneBullet() {
  const c = mc(6, 6);
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(3, 3, 0, 3, 3, 3);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.4, "#00e5ff");
  grad.addColorStop(1, "rgba(0,229,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 6, 6);
  return c;
}

function drawDroneMissile() {
  const c = mc(10, 6);
  const ctx = c.getContext("2d");
  // Trail hint (orange)
  ctx.fillStyle = "#ff8800";
  ctx.beginPath(); ctx.ellipse(2, 3, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
  // Body (red)
  ctx.fillStyle = "#dd2222";
  ctx.fillRect(2, 1, 7, 4);
  // Nose
  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.moveTo(9, 1); ctx.lineTo(10, 3); ctx.lineTo(9, 5);
  ctx.closePath(); ctx.fill();
  // Fins
  ctx.fillStyle = "#aa1111";
  ctx.fillRect(2, 0, 3, 1);
  ctx.fillRect(2, 5, 3, 1);
  return c;
}

function drawBossSinwar(expression) {
  // expression: 'normal', 'angry', 'furious'
  const s = 64;
  const c = mc(s, s);
  const ctx = c.getContext("2d");
  const cx = s / 2;

  let skinBase, skinDark;
  if (expression === 'furious') {
    skinBase = '#B07048'; skinDark = '#8A5030';
  } else if (expression === 'angry') {
    skinBase = '#BA8858'; skinDark = '#9A6A40';
  } else {
    skinBase = '#C4956A'; skinDark = '#A07850';
  }

  // Body (dark suit)
  ctx.fillStyle = '#2A2A2A';
  ctx.fillRect(cx - 14, 40, 28, 22);
  // Shoulders
  ctx.fillStyle = '#333333';
  ctx.fillRect(cx - 18, 38, 36, 6);

  // Neck
  ctx.fillStyle = skinDark;
  ctx.fillRect(cx - 5, 32, 10, 10);

  // Head (oval)
  ctx.fillStyle = skinBase;
  ctx.beginPath(); ctx.ellipse(cx, 20, 12, 16, 0, 0, Math.PI * 2); ctx.fill();

  // Military beret (green)
  ctx.fillStyle = '#2a6a2a';
  ctx.beginPath();
  ctx.moveTo(cx - 14, 12);
  ctx.quadraticCurveTo(cx, 0, cx + 14, 12);
  ctx.lineTo(cx + 12, 14);
  ctx.quadraticCurveTo(cx, 8, cx - 12, 14);
  ctx.closePath();
  ctx.fill();
  // Beret badge
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath(); ctx.arc(cx, 9, 2, 0, Math.PI * 2); ctx.fill();

  // Eyebrows (thick, signature)
  const browY = 15;
  const browAngle = expression === 'furious' ? 0.4 : expression === 'angry' ? 0.3 : 0.2;
  ctx.fillStyle = '#111111';
  // Left brow
  ctx.beginPath();
  ctx.moveTo(cx - 11, browY - browAngle * 5);
  ctx.lineTo(cx - 2, browY + browAngle * 5);
  ctx.lineTo(cx - 2, browY + browAngle * 5 + 2);
  ctx.lineTo(cx - 11, browY - browAngle * 5 + 2);
  ctx.closePath(); ctx.fill();
  // Right brow
  ctx.beginPath();
  ctx.moveTo(cx + 11, browY - browAngle * 5);
  ctx.lineTo(cx + 2, browY + browAngle * 5);
  ctx.lineTo(cx + 2, browY + browAngle * 5 + 2);
  ctx.lineTo(cx + 11, browY - browAngle * 5 + 2);
  ctx.closePath(); ctx.fill();

  // Eyes (narrow slits)
  const eyeY = 20;
  for (const side of [-1, 1]) {
    const ex = cx + side * 6;
    ctx.fillStyle = '#E8E4D8';
    ctx.beginPath();
    ctx.moveTo(ex - 3, eyeY);
    ctx.quadraticCurveTo(ex, eyeY - 1.5, ex + 3, eyeY);
    ctx.quadraticCurveTo(ex, eyeY + 1, ex - 3, eyeY);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath(); ctx.arc(ex, eyeY, 1, 0, Math.PI * 2); ctx.fill();
  }

  // Nose
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx - 1, 19); ctx.lineTo(cx + 1, 19);
  ctx.lineTo(cx + 3, 25); ctx.lineTo(cx - 3, 25);
  ctx.closePath(); ctx.fill();

  // Mouth
  ctx.strokeStyle = '#8A6A4A';
  ctx.lineWidth = 1;
  if (expression === 'furious') {
    ctx.beginPath();
    ctx.moveTo(cx - 5, 28);
    ctx.lineTo(cx - 2, 30); ctx.lineTo(cx + 2, 30);
    ctx.lineTo(cx + 5, 28);
    ctx.stroke();
    // Teeth
    ctx.fillStyle = '#ddddcc';
    ctx.fillRect(cx - 3, 28, 6, 2);
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 5, 28);
    ctx.quadraticCurveTo(cx, 30, cx + 5, 28);
    ctx.stroke();
  }

  // Short white beard
  ctx.fillStyle = '#8A8A8A';
  ctx.beginPath();
  ctx.moveTo(cx - 8, 28);
  ctx.quadraticCurveTo(cx, 36, cx + 8, 28);
  ctx.closePath(); ctx.fill();

  // Expression effects
  if (expression === 'angry' || expression === 'furious') {
    // Veins on temples
    ctx.strokeStyle = expression === 'furious' ? '#CC2020' : '#AA5050';
    ctx.lineWidth = expression === 'furious' ? 1.2 : 0.8;
    ctx.beginPath(); ctx.moveTo(cx - 10, 10); ctx.lineTo(cx - 8, 14); ctx.lineTo(cx - 9, 17); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 10, 10); ctx.lineTo(cx + 8, 14); ctx.lineTo(cx + 9, 17); ctx.stroke();
  }
  if (expression === 'furious') {
    // Red tint overlay
    ctx.fillStyle = 'rgba(180, 20, 10, 0.1)';
    ctx.fillRect(0, 0, s, s);
  }

  // Head outline
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(cx, 20, 12, 16, 0, 0, Math.PI * 2); ctx.stroke();

  return c;
}

function drawBossProjectile() {
  const c = mc(12, 12);
  const ctx = c.getContext("2d");
  // Brick/debris
  ctx.fillStyle = '#ba6a4a';
  ctx.fillRect(1, 3, 10, 6);
  // Crack
  ctx.strokeStyle = '#7a4a2a';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(6, 6); ctx.lineTo(4, 9); ctx.stroke();
  // Mortar edge
  ctx.fillStyle = '#d0b890';
  ctx.fillRect(1, 3, 2, 6);
  // Outline glow
  ctx.strokeStyle = '#ff8844';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 3, 10, 6);
  return c;
}

function drawArmchair() {
  const c = mc(50, 40);
  const ctx = c.getContext("2d");
  // Seat (brown)
  ctx.fillStyle = '#6a4a2a';
  ctx.fillRect(8, 12, 34, 20);
  // Back (darker, top)
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.moveTo(6, 12);
  ctx.quadraticCurveTo(25, 0, 44, 12);
  ctx.lineTo(44, 16); ctx.lineTo(6, 16);
  ctx.closePath(); ctx.fill();
  // Arms
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(2, 10, 8, 24);
  ctx.fillRect(40, 10, 8, 24);
  // Arm tops (rounded)
  ctx.beginPath(); ctx.arc(6, 10, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(44, 10, 4, 0, Math.PI * 2); ctx.fill();
  // Cushion line
  ctx.strokeStyle = '#4a2a10';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(12, 22); ctx.lineTo(38, 22); ctx.stroke();
  // Seat highlight
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(10, 14, 30, 6);
  return c;
}

function drawCityTile() {
  const c = mc(64, 64);
  const ctx = c.getContext("2d");
  // Concrete base
  ctx.fillStyle = '#5a5a62';
  ctx.fillRect(0, 0, 64, 64);
  // Cracks
  ctx.strokeStyle = '#3a3a42';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(30, 30); ctx.lineTo(20, 64); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(50, 10); ctx.lineTo(40, 40); ctx.lineTo(55, 64); ctx.stroke();
  // Debris specks
  ctx.fillStyle = '#4a4a52';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(Math.random() * 60, Math.random() * 60, 2 + Math.random() * 3, 2 + Math.random() * 2);
  }
  // Edge shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillRect(0, 0, 2, 64);
  return c;
}

function drawTargetWindow() {
  const c = mc(40, 40);
  const ctx = c.getContext("2d");
  // Outer glow
  const grad = ctx.createRadialGradient(20, 20, 4, 20, 20, 20);
  grad.addColorStop(0, "rgba(255,200,0,0.6)");
  grad.addColorStop(0.5, "rgba(255,150,0,0.3)");
  grad.addColorStop(1, "rgba(255,100,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 40, 40);
  // Window frame
  ctx.fillStyle = '#ffcc44';
  ctx.fillRect(10, 10, 20, 20);
  // Panes
  ctx.strokeStyle = '#aa8822';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, 10); ctx.lineTo(20, 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, 20); ctx.lineTo(30, 20); ctx.stroke();
  // Inner glow
  ctx.fillStyle = 'rgba(255,255,200,0.4)';
  ctx.fillRect(12, 12, 7, 7);
  ctx.fillRect(21, 12, 7, 7);
  return c;
}

let _droneGenerated = false;

export function generateDroneTextures(k) {
  if (_droneGenerated) return;
  _droneGenerated = true;

  k.loadSprite("drone_sprite", drawDroneSprite().toDataURL());
  k.loadSprite("drone_bullet", drawDroneBullet().toDataURL());
  k.loadSprite("drone_missile", drawDroneMissile().toDataURL());
  k.loadSprite("boss_sinwar_normal", drawBossSinwar('normal').toDataURL());
  k.loadSprite("boss_sinwar_angry", drawBossSinwar('angry').toDataURL());
  k.loadSprite("boss_sinwar_furious", drawBossSinwar('furious').toDataURL());
  k.loadSprite("boss_projectile", drawBossProjectile().toDataURL());
  k.loadSprite("armchair_sprite", drawArmchair().toDataURL());
  k.loadSprite("city_tile", drawCityTile().toDataURL());
  k.loadSprite("target_window", drawTargetWindow().toDataURL());
}

// ═══════════════════════════════════════════════════════════════
// B-2 STEALTH BOMBER TEXTURES (Level 5 — Operation Mountain Breaker)
// ═══════════════════════════════════════════════════════════════

function drawB2Bomber() {
  const c = mc(80, 30);
  const ctx = c.getContext("2d");
  const cx = 40, cy = 15;

  // Flying wing silhouette (top-down, dark gray boomerang)
  ctx.fillStyle = "#3a3a3a";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);        // nose (top)
  ctx.lineTo(cx + 38, cy + 8);    // right wing tip
  ctx.lineTo(cx + 28, cy + 12);   // right trailing edge
  ctx.lineTo(cx, cy + 5);         // center rear
  ctx.lineTo(cx - 28, cy + 12);   // left trailing edge
  ctx.lineTo(cx - 38, cy + 8);    // left wing tip
  ctx.closePath();
  ctx.fill();

  // Inner wing surface (darker)
  ctx.fillStyle = "#2e2e2e";
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 7);
  ctx.lineTo(cx + 22, cy + 6);
  ctx.lineTo(cx, cy + 4);
  ctx.lineTo(cx - 22, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Cockpit line
  ctx.strokeStyle = "#555555";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 9);
  ctx.lineTo(cx, cy + 4);
  ctx.stroke();

  // Panel line (horizontal)
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 3);
  ctx.lineTo(cx + 14, cy + 3);
  ctx.stroke();

  // Leading edge highlight
  ctx.strokeStyle = "#4a4a4a";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 36, cy + 7);
  ctx.lineTo(cx, cy - 9);
  ctx.lineTo(cx + 36, cy + 7);
  ctx.stroke();

  // Engine glow (two exhaust points at rear)
  ctx.fillStyle = "#ff4400";
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(cx - 8, cy + 9, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8, cy + 9, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ff8800";
  ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.arc(cx - 8, cy + 9, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 8, cy + 9, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  return c;
}

function drawB2Bomb() {
  const c = mc(8, 8);
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
  grad.addColorStop(0, "#ffcc00");
  grad.addColorStop(0.5, "#ff8800");
  grad.addColorStop(1, "rgba(255,136,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 8, 8);
  return c;
}

let _b2Generated = false;
export function generateB2Textures(k) {
  if (_b2Generated) return;
  _b2Generated = true;

  k.loadSprite("b2_bomber", drawB2Bomber().toDataURL());
  k.loadSprite("b2_bomb", drawB2Bomb().toDataURL());
}

// ═══════════════════════════════════════════════════════════════
// BOSS TEXTURES (Level 6)
// ═══════════════════════════════════════════════════════════════

function drawPlayerF16() {
  const c = mc(48, 16);
  const ctx = c.getContext("2d");
  // Fuselage (gray)
  ctx.fillStyle = "#7a7a8a";
  ctx.fillRect(6, 5, 34, 6);
  // Nose cone
  ctx.fillStyle = "#9a9aaa";
  ctx.beginPath();
  ctx.moveTo(42, 5);
  ctx.lineTo(48, 8);
  ctx.lineTo(42, 11);
  ctx.closePath();
  ctx.fill();
  // Tail
  ctx.fillStyle = "#6a6a7a";
  ctx.beginPath();
  ctx.moveTo(4, 3);
  ctx.lineTo(10, 5);
  ctx.lineTo(10, 11);
  ctx.lineTo(4, 13);
  ctx.closePath();
  ctx.fill();
  // Delta wings
  ctx.fillStyle = "#8a8a9a";
  ctx.beginPath();
  ctx.moveTo(18, 5);
  ctx.lineTo(30, 0);
  ctx.lineTo(30, 5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(18, 11);
  ctx.lineTo(30, 16);
  ctx.lineTo(30, 11);
  ctx.closePath();
  ctx.fill();
  // Cockpit canopy
  ctx.fillStyle = "#4488cc";
  ctx.fillRect(34, 6, 6, 4);
  ctx.fillStyle = "#66aaee";
  ctx.fillRect(35, 7, 4, 2);
  // Engine glow
  ctx.fillStyle = "#ffaa44";
  ctx.fillRect(2, 6, 4, 4);
  ctx.fillStyle = "#ff6622";
  ctx.fillRect(0, 7, 3, 2);
  return c;
}

function drawBossFortress() {
  const c = mc(120, 80);
  const ctx = c.getContext("2d");
  // Base structure (dark gray fortified bunker)
  ctx.fillStyle = "#3a3a44";
  ctx.fillRect(10, 30, 100, 50);
  // Upper wall
  ctx.fillStyle = "#4a4a54";
  ctx.fillRect(20, 20, 80, 15);
  // Battlements / crenellations
  ctx.fillStyle = "#555564";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(24 + i * 18, 14, 10, 8);
  }
  // Left turret
  ctx.fillStyle = "#4a4a54";
  ctx.fillRect(5, 18, 20, 30);
  ctx.fillStyle = "#555564";
  ctx.fillRect(8, 12, 14, 8);
  // Right turret
  ctx.fillRect(95, 18, 20, 30);
  ctx.fillStyle = "#555564";
  ctx.fillRect(98, 12, 14, 8);
  // Central dome
  ctx.fillStyle = "#5a5a6a";
  ctx.beginPath();
  ctx.arc(60, 25, 18, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();
  // Red gem on dome
  ctx.fillStyle = "#ff2222";
  ctx.beginPath();
  ctx.arc(60, 18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff6644";
  ctx.beginPath();
  ctx.arc(60, 17, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Gun barrels on turrets
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(0, 28, 8, 3);
  ctx.fillRect(112, 28, 8, 3);
  // Ground level detail
  ctx.fillStyle = "#2a2a34";
  ctx.fillRect(10, 70, 100, 10);
  // Door
  ctx.fillStyle = "#222230";
  ctx.fillRect(52, 55, 16, 25);
  // Armor plates
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(10, 30, 100, 2);
  ctx.fillRect(10, 50, 100, 1);
  return c;
}

function drawBossShield() {
  const c = mc(140, 140);
  const ctx = c.getContext("2d");
  const cx = 70, cy = 70;
  // Semi-transparent energy shield
  const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 68);
  grad.addColorStop(0, "rgba(0,180,255,0.04)");
  grad.addColorStop(0.6, "rgba(0,220,255,0.1)");
  grad.addColorStop(0.85, "rgba(0,200,255,0.2)");
  grad.addColorStop(1, "rgba(0,180,255,0.35)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 68, 0, Math.PI * 2);
  ctx.fill();
  // Energy ring
  ctx.strokeStyle = "rgba(0,220,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 66, 0, Math.PI * 2);
  ctx.stroke();
  // Crackling energy lines
  ctx.strokeStyle = "rgba(100,220,255,0.4)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 30, cy + Math.sin(angle) * 30);
    const mx = cx + Math.cos(angle + 0.2) * 48 + (Math.random() - 0.5) * 10;
    const my = cy + Math.sin(angle + 0.2) * 48 + (Math.random() - 0.5) * 10;
    ctx.lineTo(mx, my);
    ctx.lineTo(cx + Math.cos(angle) * 64, cy + Math.sin(angle) * 64);
    ctx.stroke();
  }
  return c;
}

function drawSAMMissile() {
  const c = mc(8, 4);
  const ctx = c.getContext("2d");
  // Body
  ctx.fillStyle = "#dd3333";
  ctx.fillRect(0, 0, 6, 4);
  // Nose
  ctx.fillStyle = "#ff4444";
  ctx.fillRect(6, 1, 2, 2);
  // Trail glow
  ctx.fillStyle = "#ff8800";
  ctx.fillRect(0, 1, 2, 2);
  return c;
}

function drawPlayerBullet() {
  const c = mc(6, 3);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffdd44";
  ctx.fillRect(0, 0, 6, 3);
  ctx.fillStyle = "#ffffaa";
  ctx.fillRect(1, 1, 4, 1);
  return c;
}

function drawHeavyBomb() {
  const c = mc(10, 10);
  const ctx = c.getContext("2d");
  // Outer glow
  ctx.fillStyle = "rgba(255,100,0,0.3)";
  ctx.beginPath();
  ctx.arc(5, 5, 5, 0, Math.PI * 2);
  ctx.fill();
  // Core
  ctx.fillStyle = "#ff6622";
  ctx.beginPath();
  ctx.arc(5, 5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Bright center
  ctx.fillStyle = "#ffcc66";
  ctx.beginPath();
  ctx.arc(5, 5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function drawBossBullet() {
  const c = mc(6, 6);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ff4422";
  ctx.beginPath();
  ctx.arc(3, 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff8844";
  ctx.beginPath();
  ctx.arc(3, 3, 1.5, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

let _bossGenerated = false;
export function generateBossTextures(k) {
  if (_bossGenerated) return;
  _bossGenerated = true;

  k.loadSprite("player_f16", drawPlayerF16().toDataURL());
  k.loadSprite("boss_fortress", drawBossFortress().toDataURL());
  k.loadSprite("boss_shield", drawBossShield().toDataURL());
  k.loadSprite("sam_missile", drawSAMMissile().toDataURL());
  k.loadSprite("player_bullet_boss", drawPlayerBullet().toDataURL());
  k.loadSprite("heavy_bomb", drawHeavyBomb().toDataURL());
  k.loadSprite("boss_bullet", drawBossBullet().toDataURL());
}
