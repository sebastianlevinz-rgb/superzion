// ===================================================================
// Deep Strike Intro Cinematic -- Transition Level 2 -> Level 3
// Military terminal aesthetic with classified intel briefing
// Ported from DeepStrikeIntroCinematicScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../../constants.js';
import { runCinematic } from '../cinematic.js';

export function deepstrikeIntroCinematicScene(k) {
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
          k.pos(W / 2, 70), k.anchor('center'), k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(prev);

        // Boss silhouette (Haniyeh) with X
        const bossFig = k.add([
          k.rect(40, 60), k.pos(W / 2 - 60, H * 0.35), k.anchor('center'),
          k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(bossFig);
        const bossHead = k.add([
          k.circle(14), k.pos(W / 2 - 60, H * 0.35 - 40),
          k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(bossHead);

        // Red X
        const xLine1 = k.add([k.rect(4, 50), k.pos(W / 2 - 60, H * 0.35),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(45)]);
        visuals.push(xLine1);
        const xLine2 = k.add([k.rect(4, 50), k.pos(W / 2 - 60, H * 0.35),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(-45)]);
        visuals.push(xLine2);

        // Tehran COMPLETE
        const complete = k.add([
          k.text('Tehran: COMPLETE \u2713', { size: 20, font: 'monospace' }),
          k.pos(W / 2, H * 0.55), k.anchor('center'), k.color(68, 255, 68), k.z(2),
        ]);
        visuals.push(complete);
      },
    },
    // Page 1
    {
      text: 'The tracker worked. We know where everything was going.',
      color: [68, 136, 255], size: 20, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.7), k.z(1)]);
        visuals.push(bg);
        // Night city lights
        const cityGfx = k.add([k.rect(W, 70), k.pos(0, H - 70), k.color(42, 58, 74), k.opacity(0.6), k.z(2)]);
        visuals.push(cityGfx);
        // Building silhouettes
        for (const bd of [{x:100,w:80,h:50},{x:200,w:90,h:60},{x:600,w:85,h:55}]) {
          const b = k.add([k.rect(bd.w, bd.h), k.pos(bd.x, H - 120),
            k.color(51, 68, 85), k.opacity(0.6), k.z(2)]);
          visuals.push(b);
        }
      },
    },
    // Page 2
    {
      text: 'A fortified bunker in the mountains. The nerve center.',
      color: [255, 255, 255], size: 20, y: H * 0.45,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16),
          k.opacity(0.85), k.z(1)]);
        visuals.push(bg);
      },
    },
    // Page 3 -- Boss reveal
    {
      text: 'Inside: Hassan Nasrallah. Every rocket that fell on our schools, our hospitals, our homes \u2014 he gave the order.',
      color: [255, 68, 68], size: 18, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16),
          k.opacity(0.85), k.z(1)]);
        visuals.push(bg);

        // Boss silhouette (larger, centered)
        const bossFig = k.add([
          k.rect(50, 80), k.pos(W / 2, H * 0.4), k.anchor('center'),
          k.color(120, 30, 30), k.opacity(0), k.z(10),
        ]);
        visuals.push(bossFig);
        const bossHead = k.add([
          k.circle(18), k.pos(W / 2, H * 0.4 - 55),
          k.color(120, 30, 30), k.opacity(0), k.z(10),
        ]);
        visuals.push(bossHead);

        // Turban shape (wider arc on head)
        const turban = k.add([
          k.rect(40, 12), k.pos(W / 2, H * 0.4 - 68), k.anchor('center'),
          k.color(100, 25, 25), k.opacity(0), k.z(11),
        ]);
        visuals.push(turban);

        k.tween(0, 1, 0.6, (v) => {
          if (bossFig.exists()) bossFig.opacity = v;
          if (bossHead.exists()) bossHead.opacity = v;
          if (turban.exists()) turban.opacity = v;
        });

        // Name label
        const label = k.add([
          k.text('HASSAN NASRALLAH', { size: 14, font: 'monospace' }),
          k.pos(W / 2, H * 0.63), k.anchor('center'),
          k.color(255, 68, 68), k.opacity(0), k.z(11),
        ]);
        visuals.push(label);
        k.wait(0.3, () => {
          k.tween(0, 1, 0.4, (v) => {
            if (label.exists()) label.opacity = v;
          });
        });

        k.shake(4);
      },
    },
    // Page 4 -- Precision strike
    {
      text: 'No ground team can reach that bunker. But 2,000 pounds of precision-guided steel can.',
      color: [0, 229, 255], size: 18, y: H * 0.45,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 8, 8),
          k.opacity(0.85), k.z(1)]);
        visuals.push(bg);

        // Animated coordinates appearing character-by-character
        const coordsText = 'TARGET: 33\u00b050\'12"N  35\u00b045\'08"E  ALT: -280m';
        const coordLabel = k.add([
          k.text('', { size: 11, font: 'monospace' }),
          k.pos(W / 2, H * 0.22), k.anchor('center'),
          k.color(204, 170, 0), k.z(5),
        ]);
        visuals.push(coordLabel);
        let ci = 0;
        const coordLoop = k.loop(0.04, () => {
          ci++;
          if (coordLabel.exists()) {
            coordLabel.text = coordsText.substring(0, ci);
          }
          if (ci >= coordsText.length && coordLoop && coordLoop.cancel) {
            coordLoop.cancel();
          }
        });
      },
    },
    // Page 5 -- Final page with hero and title
    {
      text: "The sunset over the Mediterranean will be beautiful tonight. He won't see the sunrise.",
      color: [255, 215, 0], size: 20, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16),
          k.opacity(0.85), k.z(1)]);
        visuals.push(bg);

        // Sunset glow
        const glow = k.add([
          k.circle(60), k.pos(W * 0.3, H * 0.35),
          k.color(255, 170, 0), k.opacity(0.12), k.z(2),
        ]);
        visuals.push(glow);

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
          k.text('OPERATION DEEP STRIKE', { size: 28, font: 'monospace' }),
          k.pos(W / 2 + 2, H * 0.22 + 2), k.anchor('center'),
          k.color(58, 37, 16), k.opacity(0), k.z(55),
        ]);
        visuals.push(titleShadow);
        const titleMain = k.add([
          k.text('OPERATION DEEP STRIKE', { size: 28, font: 'monospace' }),
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

  runCinematic(k, pages, 'level3-bomber', {
    title: 'OPERATION DEEP STRIKE',
    coords: "33\u00b052'N  35\u00b044'E",
  });
}
