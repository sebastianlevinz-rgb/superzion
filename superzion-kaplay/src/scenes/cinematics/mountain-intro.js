// ===================================================================
// Mountain Breaker Intro Cinematic -- Transition Level 4 -> Level 5
// Military terminal aesthetic — night/stealth atmosphere
// Ported from MountainBreakerIntroCinematicScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../../constants.js';
import { runCinematic } from '../cinematic.js';

export function mountainIntroCinematicScene(k) {
  const pages = [
    // Page 0 -- RECAP: Previously on SuperZion (auto-advance)
    {
      text: '',
      charDelay: 0,
      autoAdvance: 2500,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.z(1)]);
        visuals.push(bg);

        const prev = k.add([
          k.text('PREVIOUSLY...', { size: 14, font: 'monospace' }),
          k.pos(W / 2, 60), k.anchor('center'), k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(prev);

        // Three bosses with X marks
        const bossData = [
          { name: 'Haniyeh \u2713', x: W / 2 - 120 },
          { name: 'Nasrallah \u2713', x: W / 2 },
          { name: 'Sinwar \u2713', x: W / 2 + 120 },
        ];
        for (const bd of bossData) {
          const fig = k.add([
            k.rect(40, 60), k.pos(bd.x, H * 0.32), k.anchor('center'),
            k.color(102, 102, 102), k.z(2),
          ]);
          visuals.push(fig);
          const head = k.add([
            k.circle(14), k.pos(bd.x, H * 0.32 - 40),
            k.color(102, 102, 102), k.z(2),
          ]);
          visuals.push(head);
          // Red X
          const xa = k.add([k.rect(4, 50), k.pos(bd.x, H * 0.32),
            k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(45)]);
          visuals.push(xa);
          const xb = k.add([k.rect(4, 50), k.pos(bd.x, H * 0.32),
            k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(-45)]);
          visuals.push(xb);
          const label = k.add([
            k.text(bd.name, { size: 10, font: 'monospace' }),
            k.pos(bd.x, H * 0.44), k.anchor('center'), k.color(68, 255, 68), k.z(2),
          ]);
          visuals.push(label);
        }

        // Last Chair COMPLETE
        const complete = k.add([
          k.text('Last Chair: COMPLETE \u2713', { size: 20, font: 'monospace' }),
          k.pos(W / 2, H * 0.7), k.anchor('center'), k.color(68, 255, 68), k.z(2),
        ]);
        visuals.push(complete);
      },
    },

    // Page 1 -- "The underground empire is finished."
    {
      text: "The underground empire is finished. Yahya Sinwar won't give orders again.",
      color: [68, 136, 255], size: 20, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(10, 10, 10), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);
        // Tunnels collapsing
        for (let i = 0; i < 6; i++) {
          const rubble = k.add([
            k.rect(80, 15 + Math.random() * 10),
            k.pos(W * 0.15 + i * 110, H * 0.3 + Math.random() * 30),
            k.color(58, 42, 26), k.opacity(0.6), k.z(2),
          ]);
          visuals.push(rubble);
        }
        k.shake(4);
      },
    },

    // Page 2 -- "But the real threat..."
    {
      text: "But the real threat was never the soldiers or the tunnels.",
      color: [255, 255, 255], size: 22, y: H * 0.45,
      charDelay: 0.03,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);
      },
    },

    // Page 3 -- The centrifuges
    {
      text: "It's the bomb. 8,000 centrifuges spinning under a mountain. Day and night. Getting closer.",
      color: [68, 255, 68], size: 18, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(6, 6, 8), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);

        // Mountain shape (triangle)
        // We use onDraw for the mountain since k.add doesn't directly do triangles
        // Instead, approximate with a tall rect-based mountain
        const mtnBase = k.add([
          k.rect(600, 200), k.pos(W / 2 - 300, H - 260),
          k.color(42, 58, 42), k.opacity(0.8), k.z(2),
        ]);
        visuals.push(mtnBase);
        const mtnPeak = k.add([
          k.rect(200, 100), k.pos(W / 2 - 100, H - 360),
          k.color(42, 58, 42), k.opacity(0.6), k.z(2),
        ]);
        visuals.push(mtnPeak);

        // Nuclear glow from inside the mountain
        const nukeGlow = k.add([
          k.circle(80), k.pos(W / 2, H * 0.45),
          k.color(68, 255, 68), k.opacity(0.08), k.z(3),
        ]);
        visuals.push(nukeGlow);
        const nukeCore = k.add([
          k.circle(12), k.pos(W / 2, H * 0.45),
          k.color(68, 255, 68), k.opacity(0.3), k.z(4),
        ]);
        visuals.push(nukeCore);

        // Pulsing glow
        let glowDir = 1;
        k.loop(1.5, () => {
          glowDir *= -1;
          const target = glowDir > 0 ? 0.15 : 0.06;
          k.tween(nukeGlow.opacity, target, 1.5, (v) => {
            if (nukeGlow.exists()) nukeGlow.opacity = v;
          }, k.easings.easeInOutSine);
        });
      },
    },

    // Page 4 -- Stakes
    {
      text: "If they finish it, nothing else matters. Not the missions. Not the victories. Everything... gone.",
      color: [255, 68, 68], size: 20, y: H * 0.45,
      charDelay: 0.03,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);
      },
    },

    // Page 5 -- "They buried it under a mountain"
    {
      text: "They buried it under a mountain because they think nothing can reach it.",
      color: [200, 200, 200], size: 20, y: H * 0.45,
      charDelay: 0.03,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);
      },
    },

    // Page 6 -- "They haven't met the B-2 Spirit."
    {
      text: "They haven't met the B-2 Spirit.",
      color: [255, 215, 0], size: 26, y: H * 0.82,
      charDelay: 0.04,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);

        // B-2 silhouette (large, centered)
        const b2Body = k.add([
          k.rect(240, 16), k.pos(W / 2, H * 0.38), k.anchor('center'),
          k.color(51, 51, 68), k.z(10),
        ]);
        visuals.push(b2Body);
        // Wing tips (angled rects)
        const b2WingL = k.add([
          k.rect(100, 10), k.pos(W / 2 - 100, H * 0.38 + 3), k.anchor('right'),
          k.color(51, 51, 68), k.z(10), k.rotate(-8),
        ]);
        visuals.push(b2WingL);
        const b2WingR = k.add([
          k.rect(100, 10), k.pos(W / 2 + 100, H * 0.38 + 3), k.anchor('left'),
          k.color(51, 51, 68), k.z(10), k.rotate(8),
        ]);
        visuals.push(b2WingR);
        // Nose
        const b2Nose = k.add([
          k.rect(30, 8), k.pos(W / 2, H * 0.38 - 6), k.anchor('center'),
          k.color(58, 58, 68), k.z(11),
        ]);
        visuals.push(b2Nose);

        // Spotlight effect
        const spotlight = k.add([
          k.rect(160, 60), k.pos(W / 2, H * 0.38 - 80), k.anchor('center'),
          k.color(255, 255, 204), k.opacity(0.04), k.z(9),
        ]);
        visuals.push(spotlight);

        // Operation title (big)
        const opTitle = k.add([
          k.text('OPERATION MOUNTAIN BREAKER', { size: 22, font: 'monospace' }),
          k.pos(W / 2, H * 0.58), k.anchor('center'),
          k.color(255, 215, 0), k.z(10),
        ]);
        visuals.push(opTitle);
      },
    },
  ];

  // Night sky twinkling stars background (persistent)
  for (let i = 0; i < 20; i++) {
    const sx = Math.random() * W;
    const sy = Math.random() * (H * 0.45);
    const star = k.add([
      k.circle(0.8 + Math.random() * 1.2),
      k.pos(sx, sy),
      k.color(255, 255, 255),
      k.opacity(0.15 + Math.random() * 0.2),
      k.z(4),
    ]);
    let starDir = 1;
    k.loop(1.5 + Math.random() * 2.5, () => {
      starDir *= -1;
      const target = starDir > 0 ? 0.03 : (0.15 + Math.random() * 0.2);
      k.tween(star.opacity, target, 1.5 + Math.random() * 2, (v) => {
        if (star.exists()) star.opacity = v;
      }, k.easings.easeInOutSine);
    });
  }

  // Amber ambient glow (stealth/night atmosphere)
  const amberGlow = k.add([
    k.rect(W, H), k.pos(0, 0), k.color(204, 170, 0), k.opacity(0.015), k.z(6),
  ]);
  let glowDir2 = 1;
  k.loop(3, () => {
    glowDir2 *= -1;
    const target = glowDir2 > 0 ? 0.03 : 0.01;
    k.tween(amberGlow.opacity, target, 3, (v) => {
      if (amberGlow.exists()) amberGlow.opacity = v;
    }, k.easings.easeInOutSine);
  });

  runCinematic(k, pages, 'level5-b2', {
    title: 'OPERATION MOUNTAIN BREAKER',
    coords: "33\u00b043'N 51\u00b043'E",
  });
}
