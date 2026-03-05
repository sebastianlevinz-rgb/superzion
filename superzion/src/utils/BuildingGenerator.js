// ═══════════════════════════════════════════════════════════════
// BuildingGenerator — Procedural target building textures
// ═══════════════════════════════════════════════════════════════

export function createTargetBuildingTextures(scene) {
  const FLOOR_W = 224;
  const FLOOR_H = 38;
  const NUM_FLOORS = 5;

  for (let floor = 0; floor < NUM_FLOORS; floor++) {
    const canvas = document.createElement('canvas');
    canvas.width = FLOOR_W;
    canvas.height = FLOOR_H;
    const ctx = canvas.getContext('2d');

    // Concrete base color — slight variation per floor
    const shade = 140 + floor * 6;
    ctx.fillStyle = `rgb(${shade}, ${shade - 5}, ${shade - 10})`;
    ctx.fillRect(0, 0, FLOOR_W, FLOOR_H);

    // Concrete texture noise
    for (let i = 0; i < 120; i++) {
      const nx = Math.random() * FLOOR_W;
      const ny = Math.random() * FLOOR_H;
      const nv = 120 + Math.random() * 40;
      ctx.fillStyle = `rgba(${nv}, ${nv}, ${nv}, 0.15)`;
      ctx.fillRect(nx, ny, 2 + Math.random() * 3, 1 + Math.random() * 2);
    }

    // Vertical pilaster columns at edges and middle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, 6, FLOOR_H);
    ctx.fillRect(FLOOR_W - 6, 0, 6, FLOOR_H);
    ctx.fillRect(FLOOR_W / 2 - 3, 0, 6, FLOOR_H);

    // 5 large dark windows
    const winW = 28;
    const winH = 24;
    const winY = 6;
    const winSpacing = (FLOOR_W - 20) / 5;
    for (let w = 0; w < 5; w++) {
      const wx = 14 + w * winSpacing;
      // Window recess
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(wx, winY, winW, winH);
      // Window frame
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.strokeRect(wx, winY, winW, winH);
      // Window divider
      ctx.beginPath();
      ctx.moveTo(wx + winW / 2, winY);
      ctx.lineTo(wx + winW / 2, winY + winH);
      ctx.stroke();
      // Faint interior glow on some windows
      if ((floor + w) % 3 === 0) {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.08)';
        ctx.fillRect(wx + 1, winY + 1, winW - 2, winH - 2);
      }
    }

    // Angular balconies on alternating floors
    if (floor % 2 === 0) {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
      for (let b = 0; b < 3; b++) {
        const bx = 30 + b * 75;
        ctx.fillRect(bx, FLOOR_H - 6, 40, 4);
        // Balcony supports
        ctx.fillRect(bx + 2, FLOOR_H - 8, 2, 4);
        ctx.fillRect(bx + 36, FLOOR_H - 8, 2, 4);
      }
    }

    // Floor divider line at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, FLOOR_H - 2, FLOOR_W, 2);

    // Enhancement: Haniyeh silhouette in floor 3 window
    if (floor === 3) {
      const figWinIdx = 2; // center window
      const fwx = 14 + figWinIdx * winSpacing;
      // Warm interior glow behind figure
      ctx.fillStyle = 'rgba(255, 190, 80, 0.25)';
      ctx.fillRect(fwx + 1, winY + 1, winW - 2, winH - 2);
      ctx.fillStyle = 'rgba(255, 160, 60, 0.15)';
      ctx.fillRect(fwx + 3, winY + 3, winW - 6, winH - 6);
      // Head (circle silhouette)
      const figCx = fwx + winW / 2;
      const headY = winY + 6;
      ctx.fillStyle = '#0a0a12';
      ctx.beginPath();
      ctx.arc(figCx, headY, 4, 0, Math.PI * 2);
      ctx.fill();
      // Shoulders/body
      ctx.fillRect(figCx - 6, headY + 4, 12, 14);
      // Slight highlight on silhouette edge
      ctx.fillStyle = 'rgba(255, 180, 80, 0.1)';
      ctx.fillRect(figCx + 4, headY + 4, 2, 10);
    }

    scene.textures.addCanvas(`target_bldg_floor_${floor}`, canvas);
  }

  // Roof
  const roofCanvas = document.createElement('canvas');
  roofCanvas.width = FLOOR_W;
  roofCanvas.height = 38;
  const rctx = roofCanvas.getContext('2d');

  // Roof base
  rctx.fillStyle = '#8a8a7a';
  rctx.fillRect(0, 0, FLOOR_W, 38);

  // Parapet wall
  rctx.fillStyle = '#7a7a6a';
  rctx.fillRect(0, 0, FLOOR_W, 10);
  rctx.fillStyle = 'rgba(0,0,0,0.2)';
  rctx.fillRect(0, 8, FLOOR_W, 2);

  // Antenna
  rctx.fillStyle = '#444444';
  rctx.fillRect(FLOOR_W / 2 - 1, -18, 3, 26);
  // Antenna crossbar
  rctx.fillRect(FLOOR_W / 2 - 8, -10, 16, 2);
  // Red light on antenna
  rctx.fillStyle = '#ff0000';
  rctx.beginPath();
  rctx.arc(FLOOR_W / 2, -18, 2, 0, Math.PI * 2);
  rctx.fill();

  // Roof details
  rctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let i = 0; i < 5; i++) {
    rctx.fillRect(20 + i * 40, 14, 20, 12);
  }

  scene.textures.addCanvas('target_bldg_roof', roofCanvas);
}

export function createTargetMarkerTexture(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext('2d');

  // Red downward-pointing arrow
  ctx.fillStyle = '#ff2222';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 6;

  ctx.beginPath();
  ctx.moveTo(20, 38); // bottom point
  ctx.lineTo(6, 16);
  ctx.lineTo(13, 16);
  ctx.lineTo(13, 2);
  ctx.lineTo(27, 2);
  ctx.lineTo(27, 16);
  ctx.lineTo(34, 16);
  ctx.closePath();
  ctx.fill();

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 0;
  ctx.stroke();

  scene.textures.addCanvas('target_marker', canvas);
}

export function createExplosiveTexture(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');

  // Olive box body
  ctx.fillStyle = '#4a5530';
  ctx.fillRect(1, 2, 22, 12);

  // Metal edges
  ctx.fillStyle = '#666655';
  ctx.fillRect(1, 2, 22, 2);
  ctx.fillRect(1, 12, 22, 2);

  // Clasp/strap
  ctx.fillStyle = '#555544';
  ctx.fillRect(10, 0, 4, 16);

  // Red LED
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(18, 8, 2, 0, Math.PI * 2);
  ctx.fill();

  // Wires
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(3, 5);
  ctx.lineTo(3, 0);
  ctx.stroke();
  ctx.strokeStyle = '#0000cc';
  ctx.beginPath();
  ctx.moveTo(6, 5);
  ctx.lineTo(6, 0);
  ctx.stroke();

  scene.textures.addCanvas('explosive_device', canvas);
}

export function createRuinsTexture(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Rubble pile shape
  ctx.fillStyle = '#6a6a5a';
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(10, 30);
  ctx.lineTo(30, 18);
  ctx.lineTo(55, 22);
  ctx.lineTo(70, 10);
  ctx.lineTo(90, 14);
  ctx.lineTo(112, 6);
  ctx.lineTo(135, 12);
  ctx.lineTo(155, 8);
  ctx.lineTo(175, 16);
  ctx.lineTo(195, 20);
  ctx.lineTo(210, 28);
  ctx.lineTo(224, 38);
  ctx.lineTo(224, 64);
  ctx.closePath();
  ctx.fill();

  // Rubble texture
  const rubbleColors = ['#7a7a6a', '#5a5a4a', '#8a8a78', '#4a4a3a'];
  for (let i = 0; i < 60; i++) {
    const rx = Math.random() * 220;
    const ry = 20 + Math.random() * 40;
    ctx.fillStyle = rubbleColors[Math.floor(Math.random() * rubbleColors.length)];
    ctx.fillRect(rx, ry, 3 + Math.random() * 8, 2 + Math.random() * 5);
  }

  // Rebar sticking out
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const bx = 30 + i * 50;
    ctx.beginPath();
    ctx.moveTo(bx, 30);
    ctx.lineTo(bx + 3, 8 + Math.random() * 10);
    ctx.stroke();
  }

  // Small orange fire dots
  const fireSpots = [[45, 20], [100, 12], [160, 15], [190, 22]];
  fireSpots.forEach(([fx, fy]) => {
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(fx, fy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(fx, fy - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  scene.textures.addCanvas('building_ruins', canvas);
}
