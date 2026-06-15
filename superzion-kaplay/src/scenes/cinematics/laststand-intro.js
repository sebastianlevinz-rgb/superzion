// ===================================================================
// Last Stand Intro Cinematic -- Transition Level 5 -> Level 6
// Dark red atmosphere, lightning flashes, villain reveal
// The most dramatic cinematic -- OPERATION ENDGAME
// Ported from LastStandCinematicScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../../constants.js';
import { runCinematic } from '../cinematic.js';

export function laststandIntroScene(k) {
  // Persistent lightning state
  let lightningAlpha = 0;

  // Custom dark red background with lightning
  function drawLastStandBg(k) {
    k.onDraw(() => {
      // Dark military gradient (blood-red tinted)
      for (let y = 0; y < H; y += 2) {
        const t = y / H;
        const r = Math.floor(8 + t * 18);
        const g = Math.floor(4 + t * 6);
        const b = Math.floor(6 + t * 10);
        k.drawRect({ pos: k.vec2(0, y), width: W, height: 2, color: k.rgb(r, g, b) });
      }

      // Grid lines (amber/dark)
      for (let x = 0; x < W; x += 30) {
        k.drawLine({
          p1: k.vec2(x, 0), p2: k.vec2(x, H),
          color: k.rgb(204, 170, 0), opacity: 0.03, width: 1,
        });
      }
      for (let y = 0; y < H; y += 30) {
        k.drawLine({
          p1: k.vec2(0, y), p2: k.vec2(W, y),
          color: k.rgb(204, 170, 0), opacity: 0.03, width: 1,
        });
      }

      // Scanlines
      for (let y = 0; y < H; y += 2) {
        k.drawRect({ pos: k.vec2(0, y), width: W, height: 1, color: k.rgb(0, 0, 0), opacity: 0.12 });
      }

      // Lightning flash overlay
      if (lightningAlpha > 0) {
        k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(255, 255, 255), opacity: lightningAlpha });
      }

      // Threatening figure silhouette (Ayatollah Khamenei) -- amber tint
      const a = 0.12;
      const fx = W * 0.5, fy = H * 0.35;
      // Body
      k.drawRect({ pos: k.vec2(fx - 30, fy), width: 60, height: 120, color: k.rgb(204, 170, 0), opacity: a });
      // Shoulders
      k.drawRect({ pos: k.vec2(fx - 50, fy), width: 100, height: 20, color: k.rgb(204, 170, 0), opacity: a });
      // Head
      k.drawCircle({ pos: k.vec2(fx, fy - 10), radius: 18, color: k.rgb(204, 170, 0), opacity: a });
      // Arms
      k.drawRect({ pos: k.vec2(fx - 70, fy + 10), width: 25, height: 8, color: k.rgb(204, 170, 0), opacity: a });
      k.drawRect({ pos: k.vec2(fx + 45, fy + 10), width: 25, height: 8, color: k.rgb(204, 170, 0), opacity: a });

      // Lightning bolts (static decorations)
      const drawBolt = (bx, by, scale) => {
        k.drawLine({ p1: k.vec2(bx, by), p2: k.vec2(bx + 15 * scale, by + 40 * scale), color: k.rgb(204, 170, 0), opacity: 0.15, width: 2 });
        k.drawLine({ p1: k.vec2(bx + 15 * scale, by + 40 * scale), p2: k.vec2(bx + 5 * scale, by + 40 * scale), color: k.rgb(204, 170, 0), opacity: 0.15, width: 2 });
        k.drawLine({ p1: k.vec2(bx + 5 * scale, by + 40 * scale), p2: k.vec2(bx + 20 * scale, by + 80 * scale), color: k.rgb(204, 170, 0), opacity: 0.15, width: 2 });
      };
      drawBolt(W * 0.2, H * 0.15, 1);
      drawBolt(W * 0.78, H * 0.2, 0.85);
      drawBolt(W * 0.6, H * 0.08, 0.7);

      // Ground line
      k.drawLine({ p1: k.vec2(0, fy + 125), p2: k.vec2(W, fy + 125), color: k.rgb(204, 170, 0), opacity: 0.08, width: 1 });
    });
  }

  // Dark red ambient pulse (persistent)
  let pulseAlpha = 0.025;
  let pulseDir = 1;
  const redPulse = k.add([
    k.rect(W, H), k.pos(0, 0), k.color(255, 0, 0), k.opacity(0.025), k.z(6),
  ]);
  redPulse.onUpdate(() => {
    pulseAlpha += pulseDir * k.dt() * 0.02;
    if (pulseAlpha >= 0.07) pulseDir = -1;
    if (pulseAlpha <= 0.025) pulseDir = 1;
    redPulse.opacity = pulseAlpha;
  });

  // Lightning flash system
  let nextFlash = 2;
  k.onUpdate(() => {
    nextFlash -= k.dt();
    if (nextFlash <= 0) {
      lightningAlpha = 0.12 + Math.random() * 0.08;
      nextFlash = 5 + Math.random() * 3;
      // Fade out quickly
      k.tween(lightningAlpha, 0, 0.15, (v) => { lightningAlpha = v; }, k.easings.linear);
      // Occasional double flash
      if (Math.random() > 0.6) {
        k.wait(0.08, () => {
          lightningAlpha = 0.06;
          k.tween(0.06, 0, 0.1, (v) => { lightningAlpha = v; }, k.easings.linear);
        });
      }
    }
  });

  // Amber scan line
  const scanLine = k.add([
    k.rect(W, 2), k.pos(0, 0), k.color(204, 170, 0), k.opacity(0.04), k.z(6),
  ]);
  k.tween(0, H, 3, (v) => { if (scanLine.exists()) scanLine.pos.y = v; }, k.easings.linear);
  k.loop(3, () => {
    if (scanLine.exists()) {
      scanLine.pos.y = 0;
      k.tween(0, H, 3, (v) => { if (scanLine.exists()) scanLine.pos.y = v; }, k.easings.linear);
    }
  });

  // Status LEDs (blinking red dots)
  for (let i = 0; i < 3; i++) {
    const led = k.add([
      k.circle(2), k.pos(W * 0.1 + i * 15, H - 20),
      k.color(255, 34, 34), k.opacity(0.6), k.z(5),
    ]);
    let ledTime = i * 0.5;
    led.onUpdate(() => {
      ledTime += k.dt();
      led.opacity = 0.1 + Math.abs(Math.sin(ledTime * 1.2)) * 0.5;
    });
  }

  const pages = [
    // -- RECAP PAGE: Previously on SuperZion (auto-advance) --
    {
      text: '',
      charDelay: 0,
      autoAdvance: 3000,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.z(1)]);
        visuals.push(bg);
        visuals.push(k.add([
          k.text('PREVIOUSLY...', { size: 14, font: 'monospace' }),
          k.pos(W / 2, 50), k.anchor('center'), k.color(102, 102, 102), k.z(2),
        ]));

        // Bosses with X marks
        const bossData = [
          { name: 'Haniyeh \u2713', x: W * 0.2 },
          { name: 'Nasrallah \u2713', x: W * 0.4 },
          { name: 'Sinwar \u2713', x: W * 0.6 },
        ];
        for (const bd of bossData) {
          visuals.push(k.add([
            k.rect(40, 60), k.pos(bd.x, H * 0.28), k.anchor('center'),
            k.color(102, 102, 102), k.z(2),
          ]));
          visuals.push(k.add([
            k.circle(14), k.pos(bd.x, H * 0.28 - 40),
            k.color(102, 102, 102), k.z(2),
          ]));
          // Red X
          visuals.push(k.add([
            k.rect(4, 50), k.pos(bd.x, H * 0.28),
            k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(45),
          ]));
          visuals.push(k.add([
            k.rect(4, 50), k.pos(bd.x, H * 0.28),
            k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(-45),
          ]));
          visuals.push(k.add([
            k.text(bd.name, { size: 10, font: 'monospace' }),
            k.pos(bd.x, H * 0.39), k.anchor('center'), k.color(68, 255, 68), k.z(2),
          ]));
        }

        // Nuclear facility destroyed
        visuals.push(k.add([
          k.text('\u2622', { size: 28, font: 'monospace' }),
          k.pos(W * 0.8, H * 0.28), k.anchor('center'), k.color(68, 255, 68), k.z(2),
        ]));
        visuals.push(k.add([
          k.rect(4, 50), k.pos(W * 0.8, H * 0.28),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(45),
        ]));
        visuals.push(k.add([
          k.rect(4, 50), k.pos(W * 0.8, H * 0.28),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(-45),
        ]));
        visuals.push(k.add([
          k.text('Fordow \u2713', { size: 10, font: 'monospace' }),
          k.pos(W * 0.8, H * 0.39), k.anchor('center'), k.color(68, 255, 68), k.z(2),
        ]));

        visuals.push(k.add([
          k.text('Mountain Breaker: COMPLETE \u2713', { size: 20, font: 'monospace' }),
          k.pos(W / 2, H * 0.58), k.anchor('center'), k.color(68, 255, 68), k.z(2),
        ]));

        // Final tease
        const tease = k.add([
          k.text('ONE TARGET REMAINS...', { size: 18, font: 'monospace' }),
          k.pos(W / 2, H * 0.78), k.anchor('center'), k.color(255, 34, 34), k.opacity(0), k.z(2),
        ]);
        visuals.push(tease);
        k.tween(0, 1, 0.8, (v) => { if (tease.exists()) tease.opacity = v; }, k.easings.linear);
      },
    },

    // -- PAGE 1: Fordow aftermath --
    {
      text: "Fordow is a crater. The centrifuges are scrap metal. The bomb will never exist.",
      color: [255, 136, 68], size: 20, y: H * 0.82,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.75), k.z(1)]);
        visuals.push(bg);
        // Explosion aftermath glow (drawn as objects)
        visuals.push(k.add([k.circle(120), k.pos(W / 2, H * 0.4), k.color(255, 102, 0), k.opacity(0.25), k.z(2)]));
        visuals.push(k.add([k.circle(180), k.pos(W / 2, H * 0.4), k.color(255, 170, 0), k.opacity(0.12), k.z(2)]));
        visuals.push(k.add([k.circle(200), k.pos(W / 2, H * 0.35), k.color(255, 51, 0), k.opacity(0.08), k.z(2)]));
        // Scorched ground
        visuals.push(k.add([k.rect(W, 70), k.pos(0, H - 70), k.color(26, 10, 5), k.z(2)]));
        // Fire glow (flickering)
        const fireGlow = k.add([k.circle(90), k.pos(W / 2, H * 0.4), k.color(255, 102, 0), k.opacity(0.15), k.z(3)]);
        visuals.push(fireGlow);
        let fireTime = 0;
        fireGlow.onUpdate(() => {
          fireTime += k.dt();
          fireGlow.opacity = 0.05 + Math.abs(Math.sin(fireTime * 2.5)) * 0.1;
        });
        k.shake(4);
      },
    },

    // -- PAGE 2: Darkness -- one man remains --
    {
      text: "But one man remains. The one who started all of this.",
      color: [255, 255, 255], size: 22, y: H * 0.45,
      setup: (visuals) => {
        visuals.push(k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.85), k.z(1)]));
        // Single flash
        const flash = k.add([k.rect(W, H), k.pos(0, 0), k.color(255, 255, 255), k.opacity(0.15), k.z(3)]);
        visuals.push(flash);
        k.tween(0.15, 0, 0.4, (v) => { if (flash.exists()) flash.opacity = v; }, k.easings.easeOutCubic);
      },
    },

    // -- PAGE 3: Ayatollah Khamenei reveal --
    {
      text: "Ayatollah Ali Khamenei. The puppet master. Every missile, every tunnel, every death \u2014 traces back to him.",
      color: [255, 68, 68], size: 18, y: H * 0.82,
      setup: (visuals) => {
        // Blood sky
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(40, 10, 10), k.opacity(0.6), k.z(1)]);
        visuals.push(bg);

        // Fire columns along bottom
        const fireXPositions = [80, 180, 300, 420, 560, 680, 780, 880];
        for (let fi = 0; fi < fireXPositions.length; fi++) {
          const fx = fireXPositions[fi];
          const fire = k.add([
            k.rect(14, 30 + Math.random() * 20), k.pos(fx, H * 0.55),
            k.anchor('botcenter'), k.color(255, 100, 0), k.opacity(0.4), k.z(3),
          ]);
          visuals.push(fire);
          let ft = fi * 0.3;
          fire.onUpdate(() => {
            ft += k.dt();
            fire.opacity = 0.3 + Math.sin(ft * 4) * 0.15;
          });
        }

        // Dark ground
        visuals.push(k.add([k.rect(W, H * 0.4), k.pos(0, H * 0.6), k.color(26, 10, 5), k.opacity(0.8), k.z(2)]));

        // Army silhouettes (small dark figures)
        const soldiers = [60, 130, 210, 310, 400, 510, 590, 650, 740, 830, 900];
        for (const sx of soldiers) {
          const sh = 10 + Math.random() * 4;
          visuals.push(k.add([k.rect(4, sh), k.pos(sx, H * 0.65 - sh), k.color(10, 5, 5), k.z(4)]));
          visuals.push(k.add([k.circle(2), k.pos(sx + 2, H * 0.65 - sh - 3), k.color(10, 5, 5), k.z(4)]));
        }

        // Boss figure (dramatic scale-up entrance)
        // Red vignette behind
        const vignette = k.add([k.circle(120), k.pos(W / 2, H * 0.35), k.color(255, 0, 0), k.opacity(0.15), k.z(9)]);
        visuals.push(vignette);
        let vigTime = 0;
        vignette.onUpdate(() => {
          vigTime += k.dt();
          vignette.opacity = 0.08 + Math.sin(vigTime * 0.7) * 0.07;
        });

        // Boss figure (large threatening rectangle silhouette with dramatic scale)
        const bossBody = k.add([
          k.rect(60, 100), k.pos(W / 2, H * 0.35), k.anchor('center'),
          k.color(30, 5, 5), k.opacity(0), k.z(10),
        ]);
        visuals.push(bossBody);
        const bossHead = k.add([
          k.circle(22), k.pos(W / 2, H * 0.35 - 65),
          k.color(30, 5, 5), k.opacity(0), k.z(10),
        ]);
        visuals.push(bossHead);
        const bossShoulders = k.add([
          k.rect(100, 18), k.pos(W / 2, H * 0.35 - 38), k.anchor('center'),
          k.color(30, 5, 5), k.opacity(0), k.z(10),
        ]);
        visuals.push(bossShoulders);

        // Dramatic scale-up entrance
        k.tween(0, 1, 0.8, (v) => {
          if (bossBody.exists()) bossBody.opacity = v;
          if (bossHead.exists()) bossHead.opacity = v;
          if (bossShoulders.exists()) bossShoulders.opacity = v;
        }, k.easings.easeOutBack);

        // Menacing pulse on boss
        let bossPulseTime = 0;
        bossBody.onUpdate(() => {
          bossPulseTime += k.dt();
          const pv = 0.7 + Math.sin(bossPulseTime * 0.8) * 0.3;
          if (bossBody.exists()) bossBody.opacity = pv;
          if (bossHead.exists()) bossHead.opacity = pv;
          if (bossShoulders.exists()) bossShoulders.opacity = pv;
        });

        // Name label
        const nameLabel = k.add([
          k.text('AYATOLLAH ALI KHAMENEI', { size: 22, font: 'monospace' }),
          k.pos(W / 2, H * 0.62), k.anchor('center'), k.color(255, 34, 34), k.z(11),
        ]);
        visuals.push(nameLabel);

        k.shake(6);
      },
    },

    // -- PAGE 4: Last fortress --
    {
      text: "He's in his last fortress. Everything he has left, protecting one man.",
      color: [204, 204, 204], size: 20, y: H * 0.45,
      setup: (visuals) => {
        visuals.push(k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.85), k.z(1)]));
        // Fortress silhouette
        visuals.push(k.add([k.rect(W * 0.4, H * 0.35), k.pos(W * 0.3, H * 0.35), k.color(6, 4, 4), k.z(2)]));
        visuals.push(k.add([k.rect(W * 0.1, H * 0.4), k.pos(W * 0.25, H * 0.3), k.color(6, 4, 4), k.z(2)]));
        visuals.push(k.add([k.rect(W * 0.1, H * 0.4), k.pos(W * 0.65, H * 0.3), k.color(6, 4, 4), k.z(2)]));
        // Distant fire glows
        visuals.push(k.add([k.circle(40), k.pos(W * 0.15, H * 0.6), k.color(255, 102, 0), k.opacity(0.08), k.z(2)]));
        visuals.push(k.add([k.circle(35), k.pos(W * 0.85, H * 0.55), k.color(255, 68, 0), k.opacity(0.06), k.z(2)]));
      },
    },

    // -- PAGE 5: History --
    {
      text: "Babylon tried. Rome tried. The Inquisition tried. The Nazis tried.",
      color: [255, 255, 255], size: 20, y: H * 0.45,
      setup: (visuals) => {
        visuals.push(k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.85), k.z(1)]));
        // Distant red glow on horizon
        const horizon = k.add([k.rect(W, H * 0.3), k.pos(0, H * 0.7), k.color(255, 34, 0), k.opacity(0.08), k.z(2)]);
        visuals.push(horizon);
        let hTime = 0;
        horizon.onUpdate(() => {
          hTime += k.dt();
          horizon.opacity = 0.04 + Math.sin(hTime * 0.5) * 0.04;
        });
      },
    },

    // -- PAGE 6: Hero reveal + OPERATION ENDGAME title --
    {
      text: "His turn to fail.",
      color: [255, 215, 0], size: 28, y: H * 0.82,
      setup: (visuals) => {
        visuals.push(k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16), k.opacity(0.85), k.z(1)]));

        // Hero figure (simple gold silhouette)
        visuals.push(k.add([
          k.rect(24, 40), k.pos(W / 2, H * 0.4), k.anchor('center'),
          k.color(255, 215, 0), k.opacity(0.8), k.z(10),
        ]));
        visuals.push(k.add([
          k.circle(10), k.pos(W / 2, H * 0.4 - 28),
          k.color(255, 215, 0), k.opacity(0.8), k.z(10),
        ]));

        // Operation title (3D-ish with shadow)
        visuals.push(k.add([
          k.text('OPERATION ENDGAME', { size: 38, font: 'monospace' }),
          k.pos(W / 2 + 2, H * 0.18 + 2), k.anchor('center'),
          k.color(100, 20, 0), k.z(19),
        ]));
        visuals.push(k.add([
          k.text('OPERATION ENDGAME', { size: 38, font: 'monospace' }),
          k.pos(W / 2, H * 0.18), k.anchor('center'),
          k.color(255, 34, 34), k.z(20),
        ]));
        // Subtitle
        visuals.push(k.add([
          k.text('DEATH TO THE REGIME', { size: 16, font: 'monospace' }),
          k.pos(W / 2, H * 0.28), k.anchor('center'),
          k.color(204, 170, 0), k.z(20),
        ]));

        k.shake(4);
      },
    },
  ];

  runCinematic(k, pages, 'level6-boss', {
    drawBg: drawLastStandBg,
    title: 'OPERATION ENDGAME: DEATH TO THE REGIME',
    coords: "35\u00b040'N 51\u00b025'E",
  });
}
