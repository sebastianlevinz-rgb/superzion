// ═══════════════════════════════════════════════════════════════
// All canvas textures for the top-down stealth game
// ═══════════════════════════════════════════════════════════════

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

// ── Player sprites (16×20) — 4 directions × 2 frames ─────────
// HERO REDESIGN: Tactical vest, aviator sunglasses (dark band), slicked hair
function drawPlayer(ctx, dir, frame) {
  ctx.clearRect(0, 0, 16, 20);

  // Body (black tactical suit)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(4, 6, 8, 10); // torso base
  // Tactical vest overlay
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(5, 7, 6, 8);

  // Head — Mediterranean skin tone
  ctx.fillStyle = '#C49A6C';
  ctx.beginPath();
  ctx.arc(8, 5, 4, 0, Math.PI * 2);
  ctx.fill();

  // Slicked-back black hair
  ctx.fillStyle = '#1A1A1A';
  ctx.beginPath();
  ctx.ellipse(8, 2, 4.5, 2.5, 0, Math.PI, 0);
  ctx.fill();
  // Hair volume pompadour
  ctx.beginPath();
  ctx.ellipse(7.5, 1.5, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // AVIATOR SUNGLASSES — dark band across face (visible at 16px)
  if (dir === 'down') {
    // Two dark ovals covering eyes
    ctx.fillStyle = '#0A0A0A';
    ctx.beginPath(); ctx.ellipse(6, 4.5, 1.8, 1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, 4.5, 1.8, 1, 0, 0, Math.PI * 2); ctx.fill();
    // Frame bridge
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(7.5, 4.5); ctx.lineTo(8.5, 4.5); ctx.stroke();
    // Reflection pixel
    ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
    ctx.fillRect(5, 4, 1, 1);
    ctx.fillRect(9, 4, 1, 1);
    // Serious mouth
    ctx.strokeStyle = '#6a4030';
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(7, 7); ctx.lineTo(9, 7); ctx.stroke();
  } else if (dir === 'up') {
    // Back of head — just hair
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(4, 3, 8, 3);
  } else if (dir === 'left') {
    // Side sunglasses — single dark oval
    ctx.fillStyle = '#0A0A0A';
    ctx.beginPath(); ctx.ellipse(5, 4.5, 1.8, 1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
    ctx.fillRect(4, 4, 1, 1);
  } else {
    ctx.fillStyle = '#0A0A0A';
    ctx.beginPath(); ctx.ellipse(11, 4.5, 1.8, 1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
    ctx.fillRect(11, 4, 1, 1);
  }

  // Gold Star of David on chest (tiny but visible)
  ctx.fillStyle = '#FFD700';
  // Tiny up triangle
  ctx.beginPath();
  ctx.moveTo(8, 9); ctx.lineTo(6.5, 11); ctx.lineTo(9.5, 11); ctx.closePath();
  ctx.fill();
  // Tiny down triangle
  ctx.beginPath();
  ctx.moveTo(8, 12); ctx.lineTo(6.5, 10); ctx.lineTo(9.5, 10); ctx.closePath();
  ctx.fill();

  // Legs with walk animation — black tactical pants
  ctx.fillStyle = '#1a1a1a';
  if (dir === 'down' || dir === 'up') {
    const offset = frame === 1 ? 2 : 0;
    ctx.fillRect(5 - offset, 16, 3, 4);
    ctx.fillRect(8 + offset, 16, 3, 4);
  } else {
    const offset = frame === 1 ? 2 : 0;
    ctx.fillRect(6, 16 - offset, 4, 4);
    if (frame === 1) ctx.fillRect(6, 16 + 1, 4, 3);
  }
  // Boots — slightly wider, dark
  ctx.fillStyle = '#0e0e0e';
  if (dir === 'down' || dir === 'up') {
    const offset = frame === 1 ? 2 : 0;
    ctx.fillRect(4 - offset, 19, 4, 1);
    ctx.fillRect(7 + offset, 19, 4, 1);
  } else {
    ctx.fillRect(5, 19, 5, 1);
  }

  // Silenced pistol (right hand side)
  ctx.fillStyle = '#0e0e0e';
  if (dir === 'right') {
    ctx.fillRect(12, 10, 3, 1.5);
    ctx.fillStyle = '#333333';
    ctx.fillRect(14, 10, 2, 1);
  } else if (dir === 'left') {
    ctx.fillRect(0, 10, 3, 1.5);
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 10, 2, 1);
  } else {
    ctx.fillRect(12, 10, 2, 2);
    ctx.fillStyle = '#333333';
    ctx.fillRect(12, 10, 1, 3);
  }
}

// ── Guard sprites (16×20) — 4 directions × 2 frames ──────────
function drawGuard(ctx, dir, frame) {
  ctx.clearRect(0, 0, 16, 20);

  const offset = frame === 1 ? 2 : 0;

  // ── Dark outline silhouette (drawn first, 1px larger) ──
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  // Body outline
  ctx.beginPath();
  ctx.ellipse(8, 11, 5.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head outline
  ctx.beginPath();
  ctx.arc(8, 5, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Legs (elliptical capsules) ──
  ctx.fillStyle = '#1E3A10';
  if (dir === 'down' || dir === 'up') {
    ctx.beginPath();
    ctx.ellipse(6 - offset * 0.5, 17.5, 1.8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10 + offset * 0.5, 17.5, 1.8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(8, 17 - offset * 0.5, 2.2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (frame === 1) {
      ctx.beginPath();
      ctx.ellipse(8, 18, 2.2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Boots (small rounded caps) ──
  ctx.fillStyle = '#111111';
  if (dir === 'down' || dir === 'up') {
    ctx.beginPath();
    ctx.ellipse(6 - offset * 0.5, 19.5, 2, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10 + offset * 0.5, 19.5, 2, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(8, 19.5, 2.5, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Body (olive green uniform — elliptical torso) ──
  ctx.fillStyle = '#2D4A1E';
  ctx.beginPath();
  ctx.ellipse(8, 11, 4.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Arms (small ellipses on sides) ──
  ctx.fillStyle = '#2D4A1E';
  if (dir === 'down' || dir === 'up') {
    ctx.beginPath();
    ctx.ellipse(3.5, 10, 1.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12.5, 10, 1.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (dir === 'left') {
    ctx.beginPath();
    ctx.ellipse(4, 10, 1.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(12, 10, 1.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Head (skin-colored circle) ──
  ctx.fillStyle = '#8a7060';
  ctx.beginPath();
  ctx.arc(8, 5, 4, 0, Math.PI * 2);
  ctx.fill();

  // ── Beret (elliptical dome) ──
  ctx.fillStyle = '#1a3010';
  ctx.beginPath();
  ctx.ellipse(8, 2, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Beret dome top
  ctx.beginPath();
  ctx.ellipse(7, 1.5, 4, 1.5, -0.15, Math.PI, 0);
  ctx.fill();

  // ── Eyes (small ellipses) ──
  ctx.fillStyle = '#000000';
  if (dir === 'down') {
    ctx.beginPath();
    ctx.ellipse(6, 4.5, 1, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, 4.5, 1, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (dir === 'left') {
    ctx.beginPath();
    ctx.ellipse(5.5, 4.5, 1, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (dir === 'right') {
    ctx.beginPath();
    ctx.ellipse(10.5, 4.5, 1, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Rifle (kept rectangular — it's a weapon, not a body part) ──
  ctx.fillStyle = '#1a1a1a';
  if (dir === 'right') {
    ctx.fillRect(12, 8, 4, 2);
  } else if (dir === 'left') {
    ctx.fillRect(0, 8, 4, 2);
  } else if (dir === 'down') {
    ctx.fillRect(11, 7, 2, 6);
  } else {
    ctx.fillRect(3, 7, 2, 6);
  }
}

// ── Floor tiles ───────────────────────────────────────────────
function drawRoomFloor(ctx) {
  // Checkerboard beige tiles (48×48 repeating)
  for (let y = 0; y < 48; y += 24) {
    for (let x = 0; x < 48; x += 24) {
      ctx.fillStyle = ((x + y) / 24) % 2 === 0 ? '#C2956B' : '#B8A070';
      ctx.fillRect(x, y, 24, 24);
      // Subtle grout line
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.strokeRect(x, y, 24, 24);
    }
  }
}

function drawCorridorFloor(ctx) {
  ctx.fillStyle = '#3A3A3A';
  ctx.fillRect(0, 0, 48, 48);
  // Tile lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let y = 0; y < 48; y += 24) {
    for (let x = 0; x < 48; x += 24) {
      ctx.strokeRect(x, y, 24, 24);
    }
  }
  // Subtle stains
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath(); ctx.arc(12, 30, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(36, 14, 4, 0, Math.PI * 2); ctx.fill();
}

// ── Decorations (small canvas sprites) ────────────────────────
function drawDecoration(type) {
  let w, h;
  switch (type) {
    case 'bed': w = 32; h = 48; break;
    case 'desk': case 'table': w = 32; h = 24; break;
    case 'chair': w = 16; h = 16; break;
    case 'bookshelf': w = 40; h = 16; break;
    case 'sofa': w = 40; h = 20; break;
    case 'crate': w = 20; h = 20; break;
    case 'lamp': w = 8; h = 8; break;
    case 'rug': w = 48; h = 36; break;
    default: w = 16; h = 16;
  }
  const [c, ctx] = makeCanvas(w, h);

  switch (type) {
    case 'bed':
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, 0, 32, 48); // frame
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(2, 2, 28, 12); // pillow
      ctx.fillStyle = '#B0C4DE';
      ctx.fillRect(2, 16, 28, 30); // blanket
      break;
    case 'desk':
    case 'table':
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(0, 0, 32, 24);
      ctx.fillStyle = '#4A3020';
      ctx.fillRect(2, 2, 28, 20);
      // Legs
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(1, 22, 4, 2); ctx.fillRect(27, 22, 4, 2);
      break;
    case 'chair':
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#6B5040';
      ctx.fillRect(4, 0, 8, 3); // back
      break;
    case 'bookshelf':
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(0, 0, 40, 16);
      // Books
      const colors = ['#8B0000', '#00008B', '#006400', '#DAA520', '#4B0082'];
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(2 + i * 5, 2, 4, 12);
      }
      break;
    case 'sofa':
      ctx.fillStyle = '#6B4226';
      ctx.fillRect(0, 0, 40, 20);
      ctx.fillStyle = '#8B6A4A';
      ctx.fillRect(2, 4, 36, 14);
      // Cushions
      ctx.fillStyle = '#7B5A3A';
      ctx.fillRect(4, 6, 14, 10);
      ctx.fillRect(22, 6, 14, 10);
      break;
    case 'crate':
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, 0, 20, 20);
      ctx.strokeStyle = '#5C4033';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 20, 20);
      ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(20, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(10, 20); ctx.stroke();
      break;
    case 'lamp':
      // Glow halo
      const grad = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
      grad.addColorStop(0, 'rgba(255,215,0,0.8)');
      grad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 8, 8);
      // Bright center
      ctx.fillStyle = '#FFD700';
      ctx.beginPath(); ctx.arc(4, 4, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'rug':
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(0, 0, 48, 36);
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(4, 4, 40, 28);
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(8, 8, 32, 20);
      // Pattern
      ctx.fillStyle = '#DAA520';
      ctx.fillRect(16, 12, 16, 12);
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(20, 14, 8, 8);
      break;
  }
  return c;
}

// ── Bomb device (16×16) ───────────────────────────────────────
function drawBomb(ctx) {
  ctx.fillStyle = '#333';
  ctx.fillRect(2, 4, 12, 10);
  ctx.fillStyle = '#222';
  ctx.fillRect(4, 6, 8, 6);
  // Red LED
  ctx.fillStyle = '#ff0000';
  ctx.beginPath(); ctx.arc(8, 9, 2, 0, Math.PI * 2); ctx.fill();
  // Antenna
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(8, 4); ctx.lineTo(8, 0); ctx.stroke();
  ctx.fillStyle = '#ff0000';
  ctx.beginPath(); ctx.arc(8, 0, 1, 0, Math.PI * 2); ctx.fill();
}

// ── EXIT sign (40×20) ────────────────────────────────────────
function drawExitSign(ctx) {
  ctx.fillStyle = '#004400';
  ctx.fillRect(0, 0, 40, 20);
  ctx.strokeStyle = '#33FF33';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 38, 18);
  ctx.fillStyle = '#33FF33';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', 20, 15);
  // Arrow
  ctx.beginPath();
  ctx.moveTo(34, 10); ctx.lineTo(38, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(36, 7); ctx.lineTo(38, 10); ctx.lineTo(36, 13); ctx.stroke();
}

// ── Alert icon (16×16) ───────────────────────────────────────
function drawAlertIcon(ctx) {
  ctx.fillStyle = '#ff0000';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('!', 8, 14);
}

// ═══════════════════════════════════════════════════════════════
// Main export — generates all textures
// ═══════════════════════════════════════════════════════════════
export function createAllTextures(scene) {
  const dirs = ['down', 'up', 'left', 'right'];

  // Player sprites: 4 dirs × 2 frames
  dirs.forEach(dir => {
    for (let f = 0; f < 2; f++) {
      const [c, ctx] = makeCanvas(16, 20);
      drawPlayer(ctx, dir, f);
      scene.textures.addCanvas(`player_${dir}_${f}`, c);
    }
  });

  // Guard sprites: 4 dirs × 2 frames
  dirs.forEach(dir => {
    for (let f = 0; f < 2; f++) {
      const [c, ctx] = makeCanvas(16, 20);
      drawGuard(ctx, dir, f);
      scene.textures.addCanvas(`guard_${dir}_${f}`, c);
    }
  });

  // Floor tiles
  {
    const [c, ctx] = makeCanvas(48, 48);
    drawRoomFloor(ctx);
    scene.textures.addCanvas('floor_room', c);
  }
  {
    const [c, ctx] = makeCanvas(48, 48);
    drawCorridorFloor(ctx);
    scene.textures.addCanvas('floor_corridor', c);
  }

  // Decorations
  const decoTypes = ['bed', 'desk', 'table', 'chair', 'bookshelf', 'sofa', 'crate', 'lamp', 'rug'];
  decoTypes.forEach(type => {
    const c = drawDecoration(type);
    scene.textures.addCanvas(`deco_${type}`, c);
  });

  // Bomb device
  {
    const [c, ctx] = makeCanvas(16, 16);
    drawBomb(ctx);
    scene.textures.addCanvas('bomb_device', c);
  }

  // EXIT sign
  {
    const [c, ctx] = makeCanvas(40, 20);
    drawExitSign(ctx);
    scene.textures.addCanvas('exit_sign', c);
  }

  // Alert icon
  {
    const [c, ctx] = makeCanvas(16, 16);
    drawAlertIcon(ctx);
    scene.textures.addCanvas('alert_icon', c);
  }

  // Wall texture (dark)
  {
    const [c, ctx] = makeCanvas(24, 24);
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 0, 24, 24);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.strokeRect(0, 0, 24, 24);
    scene.textures.addCanvas('wall_tile', c);
  }

  // Door frame texture
  {
    const [c, ctx] = makeCanvas(24, 24);
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(0, 0, 24, 24);
    ctx.fillStyle = '#4A3020';
    ctx.fillRect(2, 2, 20, 20);
    scene.textures.addCanvas('door_frame', c);
  }

  // Target room glow (rendered as graphics in GameScene, but we need a marker)
  {
    const [c, ctx] = makeCanvas(24, 24);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFA500';
    ctx.beginPath(); ctx.arc(12, 12, 6, 0, Math.PI * 2); ctx.fill();
    scene.textures.addCanvas('target_marker', c);
  }
}
