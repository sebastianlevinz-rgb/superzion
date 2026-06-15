// ===================================================================
// Credits Scene -- Star Wars scrolling credits
// Animated sunset background, Star of David, scrolling text
// Ported from CreditsScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../../constants.js';

export function creditsScene(k) {
  let done = false;
  let scrollY = 0;
  const scrollSpeed = 30; // pixels per second

  // Credits content
  const creditsLines = [
    '',
    '',
    'SUPERZION',
    '',
    '"THEY FIGHT TO CONQUER. WE FIGHT TO EXIST."',
    '',
    '',
    '-- -- -- -- --',
    '',
    '',
    'Op. Tehran -- Infiltration',
    '',
    'Op. Deep Strike -- Aerial Assault',
    '',
    'Op. Underground -- Reconnaissance',
    '',
    'Op. Mountain Breaker -- Nuclear Strike',
    '',
    'Op. Last Stand -- Final Battle',
    '',
    '',
    '-- -- -- -- --',
    '',
    '',
    'CREATED WITH',
    'CLAUDE CODE + ANTIGRAVITY',
    '',
    '',
    'DESIGNED BY',
    'SEBASTIAN',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'THANK YOU FOR PLAYING',
    '',
    '',
  ];

  const lineHeight = 28;
  const totalHeight = creditsLines.length * lineHeight + H;
  const starOfDavidY = (creditsLines.length - 5) * lineHeight; // Position in credits flow

  // Save completion
  try { localStorage.setItem('superzion_completed', 'true'); } catch (e) { /* ignore */ }

  // Sun glow animation state
  let sunGlowTime = 0;

  // Cloud positions
  const clouds = [
    { x: W * 0.25, y: H * 0.3, w: 120, h: 20, speed: 2 },
    { x: W * 0.7, y: H * 0.22, w: 100, h: 15, speed: 1.5 },
    { x: W * 0.5, y: H * 0.42, w: 140, h: 18, speed: 2.5 },
  ];

  // Skip hint
  k.add([
    k.text('ENTER TO SKIP', { size: 10, font: 'monospace' }),
    k.pos(W - 16, H - 14), k.anchor('botright'),
    k.color(68, 68, 68), k.fixed(), k.z(100),
  ]);

  // Scroll update
  k.onUpdate(() => {
    if (done) return;
    const dt = k.dt();
    scrollY += scrollSpeed * dt;
    sunGlowTime += dt;

    // Update cloud positions
    for (const c of clouds) {
      c.x += c.speed * dt;
      if (c.x > W + c.w) c.x = -c.w;
    }

    // Auto-finish when all text has scrolled
    if (scrollY > totalHeight) {
      finish();
    }
  });

  // Draw everything
  k.onDraw(() => {
    // ── Animated sunset background ──
    // Sky gradient (dark purple -> warm orange)
    for (let y = 0; y < H * 0.6; y += 2) {
      const t = y / (H * 0.6);
      const r = Math.floor(18 + t * 140);
      const g = Math.floor(8 + t * 70);
      const b = Math.floor(40 - t * 30);
      k.drawRect({ pos: k.vec2(0, y), width: W, height: 2, color: k.rgb(r, g, b) });
    }

    // Sea gradient (orange -> deep dark blue)
    for (let y = Math.floor(H * 0.6); y < H; y += 2) {
      const t = (y - H * 0.6) / (H * 0.4);
      const r = Math.max(0, Math.floor(158 - t * 140));
      const g = Math.max(0, Math.floor(78 - t * 70));
      const b = Math.floor(10 + t * 25);
      k.drawRect({ pos: k.vec2(0, y), width: W, height: 2, color: k.rgb(r, g, b) });
    }

    // Sun glow (pulsing)
    const sunPulse = 1 + Math.sin(sunGlowTime * 0.33) * 0.08;
    k.drawCircle({ pos: k.vec2(W / 2, H * 0.6), radius: 80 * sunPulse, color: k.rgb(255, 204, 68), opacity: 0.08 + Math.sin(sunGlowTime * 0.33) * 0.04 });
    k.drawCircle({ pos: k.vec2(W / 2, H * 0.6), radius: 40, color: k.rgb(255, 220, 120), opacity: 0.2 });

    // Clouds
    for (const c of clouds) {
      k.drawRect({
        pos: k.vec2(c.x - c.w / 2, c.y - c.h / 2),
        width: c.w, height: c.h,
        color: k.rgb(255, 221, 170), opacity: 0.1,
      });
    }

    // Dark overlay for readability
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(0, 0, 0), opacity: 0.5 });

    // ── Scrolling credits text ──
    for (let i = 0; i < creditsLines.length; i++) {
      const lineY = H + 40 + i * lineHeight - scrollY;
      if (lineY < -30 || lineY > H + 30) continue;

      const line = creditsLines[i];
      if (!line) continue;

      // Determine style
      let size = 18;
      let color = k.rgb(204, 204, 204);
      if (line === 'SUPERZION') {
        size = 36;
        color = k.rgb(255, 215, 0);
      } else if (line.startsWith('"')) {
        size = 16;
        color = k.rgb(200, 200, 220);
      } else if (line.startsWith('CREATED') || line.startsWith('DESIGNED') || line.startsWith('THANK YOU')) {
        color = k.rgb(255, 215, 0);
      } else if (line === 'CLAUDE CODE + ANTIGRAVITY' || line === 'SEBASTIAN') {
        color = k.rgb(255, 255, 255);
        size = 20;
      }

      k.drawText({
        text: line, pos: k.vec2(W / 2, lineY),
        size, font: 'monospace', color, anchor: 'center',
      });
    }

    // ── Star of David (scrolls with text) ──
    const starScreenY = H + 40 + starOfDavidY - scrollY;
    if (starScreenY > -60 && starScreenY < H + 60) {
      drawStarOfDavid(W / 2, starScreenY, 40);
    }
  });

  // ── Star of David drawing ──
  function drawStarOfDavid(cx, cy, r) {
    const color = k.rgb(218, 165, 32);
    // Upward triangle
    k.drawLine({ p1: k.vec2(cx, cy - r), p2: k.vec2(cx + r * 0.87, cy + r * 0.5), color, opacity: 0.8, width: 2 });
    k.drawLine({ p1: k.vec2(cx + r * 0.87, cy + r * 0.5), p2: k.vec2(cx - r * 0.87, cy + r * 0.5), color, opacity: 0.8, width: 2 });
    k.drawLine({ p1: k.vec2(cx - r * 0.87, cy + r * 0.5), p2: k.vec2(cx, cy - r), color, opacity: 0.8, width: 2 });
    // Downward triangle
    k.drawLine({ p1: k.vec2(cx, cy + r), p2: k.vec2(cx + r * 0.87, cy - r * 0.5), color, opacity: 0.8, width: 2 });
    k.drawLine({ p1: k.vec2(cx + r * 0.87, cy - r * 0.5), p2: k.vec2(cx - r * 0.87, cy - r * 0.5), color, opacity: 0.8, width: 2 });
    k.drawLine({ p1: k.vec2(cx - r * 0.87, cy - r * 0.5), p2: k.vec2(cx, cy + r), color, opacity: 0.8, width: 2 });
    // Glow
    k.drawLine({ p1: k.vec2(cx, cy - r), p2: k.vec2(cx + r * 0.87, cy + r * 0.5), color, opacity: 0.15, width: 4 });
    k.drawLine({ p1: k.vec2(cx + r * 0.87, cy + r * 0.5), p2: k.vec2(cx - r * 0.87, cy + r * 0.5), color, opacity: 0.15, width: 4 });
    k.drawLine({ p1: k.vec2(cx - r * 0.87, cy + r * 0.5), p2: k.vec2(cx, cy - r), color, opacity: 0.15, width: 4 });
    k.drawLine({ p1: k.vec2(cx, cy + r), p2: k.vec2(cx + r * 0.87, cy - r * 0.5), color, opacity: 0.15, width: 4 });
    k.drawLine({ p1: k.vec2(cx + r * 0.87, cy - r * 0.5), p2: k.vec2(cx - r * 0.87, cy - r * 0.5), color, opacity: 0.15, width: 4 });
    k.drawLine({ p1: k.vec2(cx - r * 0.87, cy - r * 0.5), p2: k.vec2(cx, cy + r), color, opacity: 0.15, width: 4 });
  }

  // ── Input ──
  function finish() {
    if (done) return;
    done = true;
    // Fade out
    const fade = k.add([
      k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0), k.z(999),
    ]);
    k.tween(0, 1, 0.5, (v) => { if (fade.exists()) fade.opacity = v; }, k.easings.linear)
      .onEnd(() => k.go('menu'));
  }

  k.onKeyPress('enter', () => { if (!done) finish(); });
  k.onKeyPress('escape', () => { if (!done) finish(); });
  k.onKeyPress('space', () => { if (!done) finish(); });
  k.onMousePress(() => { if (!done) finish(); });
}
