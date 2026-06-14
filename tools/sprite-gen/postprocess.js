// ===================================================================
// Background removal + crisp downscale for generated sprites.
// Flood-fills the green background from the borders (so the character
// interior is never touched), kills leftover halo, trims, and resizes
// with nearest-neighbour for clean pixel-art edges.
// ===================================================================

import sharp from "sharp";

// Transparent + horizontally seamless tile — for scrolling PARALLAX layers
// (distant mountains, clouds) that overlay the sky. Chroma-keys green to
// transparent, then mirrors for a seamless tile.
export async function postProcessTileAlpha(rawBuf, size) {
  const w = typeof size === "number" ? size : size.w;
  const h = typeof size === "number" ? size : size.h;
  const half = Math.round(w / 2);
  // resize to half width, key out the green background (flood fill from borders)
  const base = sharp(rawBuf).resize(half, h, { fit: "cover", position: "center", kernel: "lanczos3" }).ensureAlpha();
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const isBg = (i) => { const r = data[i], g = data[i + 1], b = data[i + 2]; return g > 80 && g - r > 14 && g - b > 14; };
  const visited = new Uint8Array(W * H), stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x; if (visited[p]) return; visited[p] = 1;
    if (isBg(p * C)) { data[p * C + 3] = 0; stack.push(x, y); }
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) { const y = stack.pop(), x = stack.pop(); push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1); }
  for (let i = 0; i < data.length; i += C) { if (data[i + 3] === 0) continue; const r = data[i], g = data[i + 1], b = data[i + 2]; if (g > 115 && g - Math.max(r, b) > 45) data[i + 3] = 0; }
  const left = await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toBuffer();
  const right = await sharp(left).flop().png().toBuffer();
  return sharp({ create: { width: half * 2, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: half, top: 0 }])
    .png().toBuffer();
}

// Tile mode: opaque, horizontally SEAMLESS (mirror) — for scrolling tileSprites.
// Generates at half width then mirrors, so the left and right edges match exactly.
export async function postProcessTile(rawBuf, size) {
  const w = typeof size === "number" ? size : size.w;
  const h = typeof size === "number" ? size : size.h;
  const half = Math.round(w / 2);
  const left = await sharp(rawBuf)
    .resize(half, h, { fit: "cover", position: "center", kernel: "lanczos3" })
    .png()
    .toBuffer();
  const right = await sharp(left).flop().png().toBuffer(); // horizontal mirror
  return sharp({ create: { width: half * 2, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: half, top: 0 }])
    .png()
    .toBuffer();
}

// Background mode: opaque image cover-fit to exact dims, no key, no trim.
export async function postProcessBg(rawBuf, size) {
  const w = typeof size === "number" ? size : size.w;
  const h = typeof size === "number" ? size : size.h;
  return sharp(rawBuf)
    .resize(w, h, { fit: "cover", position: "center", kernel: "lanczos3" })
    .png()
    .toBuffer();
}

// size may be a number (square) or { w, h } for wide sprites (vehicles).
// key: "green" (default) or "magenta" — use magenta for green-coloured subjects.
export async function postProcess(rawBuf, size, key = "green") {
  const W_OUT = typeof size === "number" ? size : size.w;
  const H_OUT = typeof size === "number" ? size : size.h;
  const img = sharp(rawBuf).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;

  const isBg =
    key === "magenta"
      ? (i) => {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const mg = Math.min(r, b);
          return mg > 80 && mg - g > 40; // strong red+blue, low green
        }
      : (i) => {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          return g > 80 && g - r > 14 && g - b > 14;
        };

  const visited = new Uint8Array(W * H);
  const stack = [];
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (visited[p]) return;
    visited[p] = 1;
    if (isBg(p * C)) { data[p * C + 3] = 0; stack.push(x, y); }
  };
  for (let x = 0; x < W; x++) { pushIf(x, 0); pushIf(x, H - 1); }
  for (let y = 0; y < H; y++) { pushIf(0, y); pushIf(W - 1, y); }
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    pushIf(x - 1, y); pushIf(x + 1, y); pushIf(x, y - 1); pushIf(x, y + 1);
  }

  for (let i = 0; i < data.length; i += C) {
    if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (key === "magenta") {
      if (Math.min(r, b) > 110 && Math.min(r, b) - g > 45) data[i + 3] = 0;
    } else {
      if (g > 115 && g - Math.max(r, b) > 45) data[i + 3] = 0;
    }
  }

  return sharp(data, { raw: { width: W, height: H, channels: C } })
    .png()
    .trim()
    .resize(W_OUT, H_OUT, {
      fit: "contain",
      kernel: "lanczos3", // clean downscale from the 1024px model output
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}
