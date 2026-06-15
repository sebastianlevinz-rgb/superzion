// ===================================================================
// StarOfDavid — shared Maguen David renderer
// ===================================================================
// One consistent gold Star of David (two interlocking triangles) with an
// optional soft blue halo. Used by the menu, victory finale and credits so
// the game's identity mark looks the same everywhere.
//
//   drawStarOfDavid(gfx, cx, cy, R, opts)
//     gfx   : a Phaser.GameObjects.Graphics
//     cx,cy : centre
//     R     : outer radius (point distance from centre)
//     opts  : { halo=true, gold=0xFFD700, blue=0x1b4dad,
//               lineWidth=3, fillAlpha=0.07, lineAlpha=0.6, haloAlpha=0.18 }
// ===================================================================

export function drawStarOfDavid(gfx, cx, cy, R, opts = {}) {
  const {
    halo = true,
    gold = 0xFFD700,
    blue = 0x1b4dad,
    lineWidth = 3,
    fillAlpha = 0.07,
    lineAlpha = 0.6,
    haloAlpha = 0.18,
  } = opts;

  // Trace both triangles of the hexagram (pointed up + pointed down).
  const tris = (radius, mode) => {
    for (const off of [0, Math.PI]) {
      gfx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + off + i * (Math.PI * 2 / 3);
        const px = cx + Math.cos(a) * radius;
        const py = cy + Math.sin(a) * radius;
        if (i === 0) gfx.moveTo(px, py); else gfx.lineTo(px, py);
      }
      gfx.closePath();
      if (mode === 'fill') gfx.fillPath(); else gfx.strokePath();
    }
  };

  // Soft blue outer halo
  if (halo) {
    gfx.lineStyle(lineWidth * 3.3, blue, haloAlpha);
    tris(R + 4, 'stroke');
  }
  // Faint gold body
  if (fillAlpha > 0) {
    gfx.fillStyle(gold, fillAlpha);
    tris(R, 'fill');
  }
  // Crisp gold outline
  gfx.lineStyle(lineWidth, gold, lineAlpha);
  tris(R, 'stroke');
}
