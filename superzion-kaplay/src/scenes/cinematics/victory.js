// ===================================================================
// Victory Cinematic -- Epic narrative after defeating Supreme Turban
// Page-by-page text, sunrise, hero moment, "Am Yisrael Chai"
// Ported from VictoryScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../../constants.js';
import { runCinematic } from '../cinematic.js';

export function victoryScene(k) {
  // Persistent sunrise state
  let sunriseProgress = 0;
  let confettiParticles = [];
  let confettiActive = false;

  // Confetti spawner
  function spawnConfetti() {
    confettiActive = true;
  }
  function stopConfetti() {
    confettiActive = false;
  }

  // Confetti update (runs continuously)
  k.onUpdate(() => {
    if (confettiActive && Math.random() < 0.3) {
      confettiParticles.push({
        x: Math.random() * W,
        y: -10,
        vx: (Math.random() - 0.5) * 80,
        vy: 40 + Math.random() * 60,
        rotation: Math.random() * 360,
        color: [[255, 215, 0], [0, 100, 200], [255, 255, 255], [255, 68, 68], [0, 200, 100]][Math.floor(Math.random() * 5)],
        life: 4 + Math.random() * 2,
        size: 2 + Math.random() * 3,
      });
    }
    for (const c of confettiParticles) {
      c.x += c.vx * k.dt();
      c.y += c.vy * k.dt();
      c.rotation += 120 * k.dt();
      c.life -= k.dt();
    }
    confettiParticles = confettiParticles.filter(c => c.life > 0 && c.y < H + 20);
  });

  // Custom victory background with progressive sunrise
  function drawVictoryBg(k) {
    k.onDraw(() => {
      const p = Math.min(1, sunriseProgress);

      // Sky gradient (dawn -> full sunrise based on progress)
      for (let y = 0; y < H * 0.62; y += 2) {
        const t = y / (H * 0.62);
        const r = Math.floor((12 + 38 * p) + t * (60 + 195 * p));
        const g = Math.floor((14 + 76 * p) + t * (40 + 110 * p));
        const b = Math.floor((44 - 20 * p) + t * (-20 + 156 * p));
        k.drawRect({
          pos: k.vec2(0, y), width: W, height: 2,
          color: k.rgb(clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)),
        });
      }

      // Sea below horizon
      for (let y = Math.floor(H * 0.62); y < H * 0.88; y += 2) {
        const t = (y - H * 0.62) / (H * 0.26);
        const r = Math.floor(8 + 150 * p * (1 - t));
        const g = Math.floor(20 + 58 * p * (1 - t));
        const b = Math.floor(40 + 10 * p);
        k.drawRect({
          pos: k.vec2(0, y), width: W, height: 2,
          color: k.rgb(clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)),
        });
      }

      // Sand
      for (let y = Math.floor(H * 0.88); y < H; y += 2) {
        const sandT = (y - H * 0.88) / (H * 0.12);
        const r = Math.floor(60 + 40 * p - 15 * sandT);
        const g = Math.floor(45 + 25 * p - 10 * sandT);
        const b = Math.floor(25 + 10 * p - 8 * sandT);
        k.drawRect({
          pos: k.vec2(0, y), width: W, height: 2,
          color: k.rgb(clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)),
        });
      }

      // Sun (rises with progress)
      if (p > 0.1) {
        const horizonY = H * 0.62;
        const sunY = horizonY + 30 - p * 90;
        const sunRadius = 30 + p * 22;
        // Glow layers
        k.drawCircle({ pos: k.vec2(W / 2, sunY), radius: sunRadius * 3, color: k.rgb(255, 204, 64), opacity: 0.04 * p });
        k.drawCircle({ pos: k.vec2(W / 2, sunY), radius: sunRadius * 2, color: k.rgb(255, 187, 32), opacity: 0.08 * p });
        k.drawCircle({ pos: k.vec2(W / 2, sunY), radius: sunRadius * 1.3, color: k.rgb(255, 204, 85), opacity: 0.22 * p });
        k.drawCircle({ pos: k.vec2(W / 2, sunY), radius: sunRadius, color: k.rgb(255, 238, 170), opacity: 0.9 * p });
      }

      // Clouds
      if (p > 0.2) {
        const cloudAlpha = Math.min(0.3, p * 0.35);
        const cloudDefs = [
          { cx: W * 0.15, cy: H * 0.17, w: 120, h: 14 },
          { cx: W * 0.42, cy: H * 0.11, w: 150, h: 18 },
          { cx: W * 0.72, cy: H * 0.22, w: 110, h: 12 },
          { cx: W * 0.88, cy: H * 0.14, w: 90, h: 10 },
        ];
        for (const cd of cloudDefs) {
          for (let e = 0; e < 3; e++) {
            const eOff = (e - 1) * cd.w * 0.2;
            const eW = cd.w * (0.4 + e * 0.1);
            k.drawRect({
              pos: k.vec2(cd.cx + eOff - eW / 2, cd.cy - cd.h / 2), width: eW, height: cd.h,
              color: k.rgb(Math.min(255, 80 + Math.floor(175 * p)), Math.min(255, 50 + Math.floor(100 * p)), Math.min(255, 80 + Math.floor(60 * p))),
              opacity: cloudAlpha * (0.6 + 0.4 * (1 - Math.abs(1 - e) / 1)),
            });
          }
        }
      }

      // Confetti
      for (const c of confettiParticles) {
        const alpha = Math.min(1, c.life / 2);
        k.drawRect({
          pos: k.vec2(c.x - c.size / 2, c.y - c.size / 2), width: c.size, height: c.size * 1.5,
          color: k.rgb(c.color[0], c.color[1], c.color[2]), opacity: alpha,
        });
      }
    });
  }

  function drawHeroFigure(visuals) {
    // Forward-facing hero silhouette (gold)
    visuals.push(k.add([
      k.rect(20, 36), k.pos(W / 2, H * 0.68), k.anchor('center'),
      k.color(255, 215, 0), k.opacity(0.9), k.z(10),
    ]));
    visuals.push(k.add([
      k.circle(9), k.pos(W / 2, H * 0.68 - 24),
      k.color(255, 215, 0), k.opacity(0.9), k.z(10),
    ]));
    // Star of David on chest
    visuals.push(k.add([
      k.text('\u2721', { size: 10, font: 'monospace' }),
      k.pos(W / 2, H * 0.68), k.anchor('center'),
      k.color(218, 165, 32), k.z(11),
    ]));
  }

  function drawGiantStar(visuals) {
    // Large Star of David (golden)
    visuals.push(k.add([
      k.text('\u2721', { size: 80, font: 'monospace' }),
      k.pos(W / 2, H * 0.48), k.anchor('center'),
      k.color(218, 165, 32), k.opacity(0.3), k.z(5),
    ]));
  }

  function drawFlag(visuals, fx, fy) {
    // Simple Israeli flag
    visuals.push(k.add([k.rect(40, 28), k.pos(fx, fy), k.anchor('center'), k.color(255, 255, 255), k.z(8)]));
    visuals.push(k.add([k.rect(40, 5), k.pos(fx, fy - 10), k.anchor('center'), k.color(0, 56, 184), k.z(9)]));
    visuals.push(k.add([k.rect(40, 5), k.pos(fx, fy + 10), k.anchor('center'), k.color(0, 56, 184), k.z(9)]));
    visuals.push(k.add([
      k.text('\u2721', { size: 14, font: 'monospace' }),
      k.pos(fx, fy), k.anchor('center'), k.color(0, 56, 184), k.z(10),
    ]));
  }

  const pages = [
    // Page 0 -- "The weapons are silent"
    {
      text: "The weapons are silent. For the first time in years... silence.",
      color: [255, 215, 0], size: 32, y: H * 0.45, charDelay: 0.04,
      setup: () => { sunriseProgress = 0; },
    },
    // Page 1 -- gardens and children
    {
      text: "Where there were ashes, there will be gardens. Where there was fear, children will play again.",
      color: [255, 255, 255], size: 20, y: H * 0.45,
      setup: () => { sunriseProgress = 0.1; },
    },
    // Page 2 -- 3000 years
    {
      text: "For 3,000 years they tried to erase us. Empire after empire. Name after name.",
      color: [204, 204, 204], size: 22, y: H * 0.45,
      setup: () => { sunriseProgress = 0.2; },
    },
    // Page 3 -- belongs to every soul
    {
      text: "This land does not belong to those who conquer. It belongs to every soul who was promised they would return.",
      color: [204, 204, 204], size: 20, y: H * 0.45,
      setup: () => { sunriseProgress = 0.25; },
    },
    // Page 4 -- those who came before (hero appears)
    {
      text: "To those who came before us and never saw this day...",
      color: [255, 255, 255], size: 22, y: H * 0.82,
      setup: (visuals) => {
        sunriseProgress = 0.3;
        drawHeroFigure(visuals);
      },
    },
    // Page 5 -- those beside
    {
      text: "To those beside us who carried the weight when we could not...",
      color: [255, 255, 255], size: 22, y: H * 0.82,
      setup: (visuals) => {
        sunriseProgress = 0.5;
        drawHeroFigure(visuals);
      },
    },
    // Page 6 -- those who will come after (Star of David)
    {
      text: "And to those who will come after, who will inherit what we fought to protect...",
      color: [255, 255, 255], size: 20, y: H * 0.82,
      setup: (visuals) => {
        sunriseProgress = 0.6;
        drawGiantStar(visuals);
        drawHeroFigure(visuals);
      },
    },
    // Page 7 -- AM YISRAEL CHAI (climax)
    {
      text: "Am Yisrael Chai.",
      color: [255, 215, 0], size: 40, y: H * 0.5,
      setup: (visuals) => {
        sunriseProgress = 1.0;
        drawGiantStar(visuals);
        drawHeroFigure(visuals);
        spawnConfetti();
        k.shake(6);
      },
      cleanup: () => stopConfetti(),
    },
    // Page 8 -- Final title screen
    {
      text: '', color: [0, 0, 0], size: 1, y: -100, charDelay: 0.001,
      setup: (visuals) => {
        sunriseProgress = 1.0;
        drawGiantStar(visuals);
        drawHeroFigure(visuals);
        spawnConfetti();

        // Flanking flags
        drawFlag(visuals, 120, H * 0.55);
        drawFlag(visuals, W - 120, H * 0.55);

        // Title: SUPERZION
        visuals.push(k.add([
          k.text('S U P E R Z I O N', { size: 52, font: 'monospace' }),
          k.pos(W / 2 + 2, H * 0.25 + 2), k.anchor('center'),
          k.color(0, 0, 0), k.z(49),
        ]));
        visuals.push(k.add([
          k.text('S U P E R Z I O N', { size: 52, font: 'monospace' }),
          k.pos(W / 2, H * 0.25), k.anchor('center'),
          k.color(255, 215, 0), k.z(50),
        ]));

        // Subtitle
        const sub = k.add([
          k.text('THEY FIGHT TO CONQUER. WE FIGHT TO EXIST.', { size: 18, font: 'monospace' }),
          k.pos(W / 2, H * 0.38), k.anchor('center'),
          k.color(255, 255, 255), k.opacity(0), k.z(50),
        ]);
        visuals.push(sub);
        k.tween(0, 1, 0.6, (v) => { if (sub.exists()) sub.opacity = v; }, k.easings.linear);

        k.shake(6);
      },
      cleanup: () => stopConfetti(),
    },
  ];

  // Save completion
  try { localStorage.setItem('superzion_completed', 'true'); } catch (e) { /* ignore */ }

  runCinematic(k, pages, 'credits', {
    drawBg: drawVictoryBg,
    title: '',
    coords: '',
  });

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
}
