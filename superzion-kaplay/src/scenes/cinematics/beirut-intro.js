// ===================================================================
// Beirut Intro Cinematic -- Transition Level 1 -> Level 2
// Military terminal aesthetic with classified intel briefing
// Ported from BeirutIntroCinematicScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../../constants.js';
import { runCinematic } from '../cinematic.js';

export function beirutIntroCinematicScene(k) {
  const pages = [
    // Page 0 -- RECAP: Previously on SuperZion (auto-advance)
    {
      text: '',
      charDelay: 0,
      autoAdvance: 2500,
      setup: (visuals) => {
        // Dark recap screen
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.z(1)]);
        visuals.push(bg);

        const prev = k.add([
          k.text('PREVIOUSLY...', { size: 14, font: 'monospace' }),
          k.pos(W / 2, 70), k.anchor('center'), k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(prev);

        // Boss silhouette (Haniyeh)
        const bossFig = k.add([
          k.rect(40, 60), k.pos(W / 2, H * 0.35), k.anchor('center'),
          k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(bossFig);
        const bossHead = k.add([
          k.circle(14), k.pos(W / 2, H * 0.35 - 40),
          k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(bossHead);

        // Red X over boss
        const xSize = 30;
        const xLine1 = k.add([k.rect(4, xSize * 1.8), k.pos(W / 2, H * 0.35),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(45)]);
        visuals.push(xLine1);
        const xLine2 = k.add([k.rect(4, xSize * 1.8), k.pos(W / 2, H * 0.35),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(-45)]);
        visuals.push(xLine2);

        // Target name
        const name = k.add([
          k.text('ISMAIL HANIYEH', { size: 12, font: 'monospace' }),
          k.pos(W / 2, H * 0.55), k.anchor('center'), k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(name);

        // Tehran COMPLETE
        const complete = k.add([
          k.text('Tehran: COMPLETE \u2713', { size: 20, font: 'monospace' }),
          k.pos(W / 2, H * 0.7), k.anchor('center'), k.color(68, 255, 68), k.z(2),
        ]);
        visuals.push(complete);
      },
    },
    // Page 1 -- The aftermath
    {
      text: "Tehran: done. But cutting one head means nothing if the body keeps moving.",
      color: [255, 102, 68], size: 20, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => {
        // Dark overlay with explosion hints
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.7), k.z(1)]);
        visuals.push(bg);
        // Faint explosion circles
        for (let i = 0; i < 8; i++) {
          const ex = k.add([
            k.circle(30 + Math.random() * 50),
            k.pos(Math.random() * W, H * 0.3 + Math.random() * H * 0.4),
            k.color(255, 68, 0), k.opacity(0.1), k.z(2),
          ]);
          visuals.push(ex);
        }
        k.shake(3);
      },
    },
    // Page 2 -- New threat
    {
      text: 'The enemy adapted. New communication networks. Thousands of encrypted beepers.',
      color: [200, 200, 200], size: 20, y: H * 0.45,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16),
          k.opacity(0.85), k.z(1)]);
        visuals.push(bg);
      },
    },
    // Page 3 -- CLASSIFIED briefing with stamp
    {
      text: 'The beepers are manufactured in Hong Kong. One factory. One shipment. One chance.',
      color: [0, 229, 255], size: 18, y: H * 0.45,
      charDelay: 0.025,
      setup: (visuals) => {
        // Briefing overlay with CRT scanlines
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 8, 8),
          k.opacity(0.85), k.z(1)]);
        visuals.push(bg);

        // "CLASSIFIED" stamp with scale-bounce
        const stamp = k.add([
          k.text('CLASSIFIED', { size: 18, font: 'monospace' }),
          k.pos(W * 0.72, H * 0.22), k.anchor('center'),
          k.color(255, 34, 34), k.opacity(0), k.z(5), k.rotate(-12),
        ]);
        visuals.push(stamp);
        k.wait(0.4, () => {
          k.tween(0, 0.85, 0.3, (v) => { if (stamp.exists()) stamp.opacity = v; });
          k.tween(2.5, 1, 0.3, (v) => {
            if (stamp.exists()) stamp.scale = k.vec2(v, v);
          });
        });
      },
    },
    // Page 4 -- Mission parameters + hero
    {
      text: 'Plant the explosives at the source. Then wait for the perfect moment to detonate.',
      color: [255, 215, 0], size: 24, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16),
          k.opacity(0.85), k.z(1)]);
        visuals.push(bg);

        // Hero silhouette
        const hero = k.add([
          k.rect(24, 50), k.pos(W / 2, H * 0.45), k.anchor('center'),
          k.color(255, 215, 0), k.opacity(0), k.z(10),
        ]);
        visuals.push(hero);
        const heroHead = k.add([
          k.circle(10), k.pos(W / 2, H * 0.45 - 35),
          k.color(255, 215, 0), k.opacity(0), k.z(10),
        ]);
        visuals.push(heroHead);
        k.tween(0, 1, 0.6, (v) => {
          if (hero.exists()) hero.opacity = v;
          if (heroHead.exists()) heroHead.opacity = v;
        });

        // 3D Operation title
        const titleShadow = k.add([
          k.text('OPERATION GRIM BEEPER', { size: 28, font: 'monospace' }),
          k.pos(W / 2 + 2, H * 0.22 + 2), k.anchor('center'),
          k.color(58, 37, 16), k.opacity(0), k.z(55),
        ]);
        visuals.push(titleShadow);
        const titleMain = k.add([
          k.text('OPERATION GRIM BEEPER', { size: 28, font: 'monospace' }),
          k.pos(W / 2, H * 0.22), k.anchor('center'),
          k.color(0, 170, 68), k.opacity(0), k.z(56),
        ]);
        visuals.push(titleMain);
        k.tween(0, 1, 0.8, (v) => {
          if (titleShadow.exists()) titleShadow.opacity = v * 0.5;
          if (titleMain.exists()) titleMain.opacity = v;
        });
      },
    },
  ];

  runCinematic(k, pages, 'level2-stealth', {
    title: 'OPERATION GRIM BEEPER',
    coords: "33\u00b053'N  35\u00b030'E",
  });
}
