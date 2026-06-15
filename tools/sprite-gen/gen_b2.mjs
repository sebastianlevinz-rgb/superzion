// ===================================================================
// Procedural B-2 Spirit generator — the AI model keeps drawing fighters,
// so we draw the flying-wing planform precisely with node-canvas.
// Top-down view, nose UP. Outputs drop-in PNGs that overwrite the AI ones:
//   b2_top.png        128x76   (bombing-level plane)
//   b2_silhouette.png 200x80   (intro flyover)
// ===================================================================
import { createCanvas } from "canvas";
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "superzion", "public", "assets", "sprites");

// Flying-wing planform in normalized design units.
// x: -1..1 (full span = 2), y: 0 (nose) .. 0.80 (centre tail). Nose up.
// Trailing edge = classic B-2 double-W sawtooth (one W per side).
const NOSE = [0, 0];
const TIP_R = [1.0, 0.60];
// right trailing edge, centre -> tip (mirror for left)
const TRAIL_R = [
  [0.00, 0.80], // centre rear point (rearmost)
  [0.22, 0.68], // notch (forward)
  [0.42, 0.76], // rear point
  [0.66, 0.64], // notch (forward)
  [1.00, 0.60], // wingtip
];

function buildPolygon() {
  // clockwise: nose -> right tip -> right trailing (tip->centre) -> left trailing (centre->tip) -> left tip -> nose
  const pts = [];
  pts.push(NOSE);
  // right leading edge handled implicitly (nose -> right tip is first trailing entry's last point)
  // right trailing edge from tip inward to centre (reverse of TRAIL_R)
  for (let i = TRAIL_R.length - 1; i >= 0; i--) pts.push(TRAIL_R[i]);
  // left trailing edge from centre outward to tip (skip centre dup)
  for (let i = 1; i < TRAIL_R.length; i++) pts.push([-TRAIL_R[i][0], TRAIL_R[i][1]]);
  return pts; // last point is left tip; close back to nose
}

function drawB2(W, H) {
  const SS = 4; // supersample for crisp downscale
  const cw = W * SS, ch = H * SS;
  const c = createCanvas(cw, ch);
  const ctx = c.getContext("2d");

  const pad = 6 * SS;
  const s = Math.min((cw - 2 * pad) / 2, (ch - 2 * pad) / 0.80); // uniform scale
  const shapeH = 0.80 * s;
  const topPad = (ch - shapeH) / 2;
  const cx = cw / 2;
  const P = ([x, y]) => [cx + x * s, topPad + y * s];

  const poly = buildPolygon().map(P);

  const tracePath = () => {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
  };

  // ── base fill: matte charcoal ──
  tracePath();
  ctx.fillStyle = "#2c3037";
  ctx.fill();

  // ── leading-edge bevel highlight (clip to wing) ──
  ctx.save();
  tracePath();
  ctx.clip();

  // lighter band along the two leading edges
  const [nx, ny] = P(NOSE);
  const [rtx, rty] = P(TIP_R);
  const [ltx, lty] = P([-TIP_R[0], TIP_R[1]]);
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3c424b";
  ctx.lineWidth = 6 * SS;
  ctx.beginPath();
  ctx.moveTo(ltx, lty); ctx.lineTo(nx, ny); ctx.lineTo(rtx, rty);
  ctx.stroke();

  // darker central spine (a slim diamond down the centreline)
  ctx.fillStyle = "#20242a";
  ctx.beginPath();
  const spineTop = P([0, 0.10]); const spineBot = P([0, 0.80]);
  ctx.moveTo(spineTop[0], spineTop[1]);
  ctx.lineTo(P([0.14, 0.55])[0], P([0.14, 0.55])[1]);
  ctx.lineTo(spineBot[0], spineBot[1]);
  ctx.lineTo(P([-0.14, 0.55])[0], P([-0.14, 0.55])[1]);
  ctx.closePath();
  ctx.fill();

  // faint engine intake humps (two soft darker ovals behind cockpit, on top)
  ctx.fillStyle = "rgba(20,22,26,0.55)";
  for (const sx of [-0.20, 0.20]) {
    const e = P([sx, 0.40]);
    ctx.beginPath();
    ctx.ellipse(e[0], e[1], 0.10 * s, 0.07 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // panel lines
  ctx.strokeStyle = "rgba(90,98,110,0.35)";
  ctx.lineWidth = 1.2 * SS;
  ctx.beginPath();
  ctx.moveTo(...P([0, 0.18])); ctx.lineTo(...P([0.70, 0.58]));   // right rib
  ctx.moveTo(...P([0, 0.18])); ctx.lineTo(...P([-0.70, 0.58]));  // left rib
  ctx.moveTo(...P([-0.45, 0.45])); ctx.lineTo(...P([0.45, 0.45])); // lateral
  ctx.stroke();

  // cockpit canopy near nose (small dark teardrop + window glints)
  const cock = P([0, 0.12]);
  ctx.fillStyle = "#15171b";
  ctx.beginPath();
  ctx.ellipse(cock[0], cock[1], 0.07 * s, 0.12 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(120,140,160,0.5)";
  ctx.beginPath();
  ctx.ellipse(cock[0] - 0.025 * s, cock[1] - 0.02 * s, 0.018 * s, 0.03 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cock[0] + 0.025 * s, cock[1] - 0.02 * s, 0.018 * s, 0.03 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // ── bold dark outline ──
  tracePath();
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111316";
  ctx.lineWidth = 2.6 * SS;
  ctx.stroke();

  return c;
}

async function emit(name, W, H) {
  const c = drawB2(W, H);
  const buf = c.toBuffer("image/png");
  // downscale supersampled canvas to target with high-quality filter
  const out = await sharp(buf).resize(W, H, { kernel: "lanczos3" }).png().toBuffer();
  await writeFile(join(OUT, `${name}.png`), out);
  console.log(`✅ ${name}.png (${W}x${H})`);
}

await emit("b2_top", 128, 76);
await emit("b2_silhouette", 200, 80);
console.log("done");
