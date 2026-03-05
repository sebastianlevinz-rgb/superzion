// ═══════════════════════════════════════════════════════════════
// Operation Tehran — Decoration textures
// Cat, plant in pot, samovar, Iranian flag
// ═══════════════════════════════════════════════════════════════

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// ── CAT (24x20) ─────────────────────────────────────────────────
export function createCatTexture(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 20;
  const ctx = canvas.getContext('2d');

  const fur = '#c87830';
  const furDk = '#a06020';
  const furLt = '#e09040';
  const nose = '#ff8888';
  const eye = '#44cc44';

  // Body
  pxRect(ctx, 5, 10, 14, 6, fur);
  pxRect(ctx, 6, 11, 12, 4, furLt);
  // Head
  pxRect(ctx, 2, 4, 8, 7, fur);
  pxRect(ctx, 3, 5, 6, 5, furLt);
  // Ears
  pxRect(ctx, 2, 2, 2, 3, fur);
  pxRect(ctx, 8, 2, 2, 3, fur);
  px(ctx, 3, 3, furDk);
  px(ctx, 8, 3, furDk);
  // Eyes
  px(ctx, 4, 6, eye);
  px(ctx, 7, 6, eye);
  // Nose
  px(ctx, 5, 8, nose);
  px(ctx, 6, 8, nose);
  // Tail
  pxRect(ctx, 18, 8, 4, 2, fur);
  pxRect(ctx, 20, 6, 2, 3, furDk);
  px(ctx, 22, 5, furDk);
  // Legs
  pxRect(ctx, 6, 16, 2, 4, furDk);
  pxRect(ctx, 10, 16, 2, 4, furDk);
  pxRect(ctx, 14, 16, 2, 4, furDk);
  pxRect(ctx, 17, 16, 2, 4, furDk);

  scene.textures.addCanvas('deco_cat', canvas);
}

// ── PLANT IN POT (20x28) ───────────────────────────────────────
export function createPlantTexture(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 20;
  canvas.height = 28;
  const ctx = canvas.getContext('2d');

  const pot = '#b85533';
  const potDk = '#8a3a22';
  const potLt = '#d06840';
  const leaf = '#2d7a2d';
  const leafLt = '#4a9a3a';
  const leafDk = '#1a5a1a';

  // Pot
  pxRect(ctx, 4, 18, 12, 10, pot);
  pxRect(ctx, 3, 18, 14, 2, potLt);
  pxRect(ctx, 5, 26, 10, 2, potDk);
  // Pot rim
  pxRect(ctx, 2, 16, 16, 2, potLt);
  pxRect(ctx, 2, 16, 16, 1, '#d88050');

  // Leaves (several fanning out)
  pxRect(ctx, 8, 8, 4, 8, leaf);
  pxRect(ctx, 6, 4, 3, 6, leafLt);
  pxRect(ctx, 11, 3, 3, 7, leafLt);
  pxRect(ctx, 3, 6, 3, 5, leafDk);
  pxRect(ctx, 14, 5, 3, 6, leafDk);
  // Top leaves
  pxRect(ctx, 7, 1, 2, 4, leafLt);
  pxRect(ctx, 11, 0, 2, 4, leaf);
  pxRect(ctx, 4, 3, 2, 3, leaf);
  pxRect(ctx, 15, 2, 2, 4, leafLt);

  scene.textures.addCanvas('deco_plant', canvas);
}

// ── SAMOVAR (16x28) ────────────────────────────────────────────
export function createSamovarTexture(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 28;
  const ctx = canvas.getContext('2d');

  const brass = '#c49520';
  const brassLt = '#daa520';
  const brassDk = '#8a6a10';
  const brassHi = '#eab530';

  // Base
  pxRect(ctx, 3, 24, 10, 4, brassDk);
  pxRect(ctx, 2, 24, 12, 1, brassLt);
  // Body (bulbous)
  pxRect(ctx, 3, 8, 10, 16, brass);
  pxRect(ctx, 4, 9, 8, 14, brassLt);
  pxRect(ctx, 5, 10, 2, 12, brassHi); // highlight
  // Narrowing top
  pxRect(ctx, 4, 4, 8, 4, brass);
  pxRect(ctx, 5, 5, 6, 2, brassLt);
  // Lid
  pxRect(ctx, 5, 2, 6, 3, brassDk);
  pxRect(ctx, 6, 1, 4, 2, brass);
  pxRect(ctx, 7, 0, 2, 2, brassLt);
  // Spout (right side)
  pxRect(ctx, 13, 14, 3, 2, brass);
  pxRect(ctx, 14, 15, 2, 1, brassDk);
  // Handle outlines (left side)
  pxRect(ctx, 0, 10, 3, 2, brassDk);
  pxRect(ctx, 0, 10, 1, 8, brassDk);
  pxRect(ctx, 0, 17, 3, 2, brassDk);
  // Decorative band
  pxRect(ctx, 3, 14, 10, 1, brassDk);
  pxRect(ctx, 3, 18, 10, 1, brassDk);

  scene.textures.addCanvas('deco_samovar', canvas);
}

// ── IRANIAN FLAG (12x20) ───────────────────────────────────────
export function createFlagTexture(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 12;
  canvas.height = 20;
  const ctx = canvas.getContext('2d');

  const pole = '#666666';
  const poleLt = '#888888';

  // Pole
  pxRect(ctx, 0, 0, 2, 20, pole);
  pxRect(ctx, 0, 0, 1, 20, poleLt);
  // Pole top ball
  pxRect(ctx, 0, 0, 3, 2, poleLt);

  // Flag stripes (green, white, red)
  const flagX = 2;
  const flagW = 10;

  // Green stripe
  pxRect(ctx, flagX, 2, flagW, 4, '#239f40');
  pxRect(ctx, flagX, 2, flagW, 1, '#2ab84a');
  // White stripe
  pxRect(ctx, flagX, 6, flagW, 4, '#f0f0f0');
  pxRect(ctx, flagX, 7, flagW, 2, '#ffffff');
  // Red stripe
  pxRect(ctx, flagX, 10, flagW, 4, '#da0000');
  pxRect(ctx, flagX, 10, flagW, 1, '#ee2020');

  // Emblem hint (center of white stripe) — stylized red tulip
  pxRect(ctx, 6, 7, 2, 2, '#da0000');
  px(ctx, 7, 6, '#da0000');

  scene.textures.addCanvas('deco_flag', canvas);
}
