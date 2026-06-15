// ===================================================================
// Underground Intro Cinematic -- Transition Level 3 -> Level 4
// Military terminal aesthetic with classified intel briefing
// Ported from UndergroundIntroCinematicScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../../constants.js';
import { runCinematic } from '../cinematic.js';

export function undergroundIntroCinematicScene(k) {
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

        // Boss 1 silhouette (Haniyeh) with X
        const boss1Fig = k.add([
          k.rect(40, 60), k.pos(W / 2 - 80, H * 0.32), k.anchor('center'),
          k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(boss1Fig);
        const boss1Head = k.add([
          k.circle(14), k.pos(W / 2 - 80, H * 0.32 - 40),
          k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(boss1Head);
        // Red X
        const x1a = k.add([k.rect(4, 50), k.pos(W / 2 - 80, H * 0.32),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(45)]);
        visuals.push(x1a);
        const x1b = k.add([k.rect(4, 50), k.pos(W / 2 - 80, H * 0.32),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(-45)]);
        visuals.push(x1b);

        const h1Label = k.add([
          k.text('Haniyeh \u2713', { size: 10, font: 'monospace' }),
          k.pos(W / 2 - 80, H * 0.44), k.anchor('center'), k.color(68, 255, 68), k.z(2),
        ]);
        visuals.push(h1Label);

        // Boss 2 silhouette (Nasrallah) with X
        const boss2Fig = k.add([
          k.rect(40, 60), k.pos(W / 2 + 80, H * 0.32), k.anchor('center'),
          k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(boss2Fig);
        const boss2Head = k.add([
          k.circle(14), k.pos(W / 2 + 80, H * 0.32 - 40),
          k.color(102, 102, 102), k.z(2),
        ]);
        visuals.push(boss2Head);
        const x2a = k.add([k.rect(4, 50), k.pos(W / 2 + 80, H * 0.32),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(45)]);
        visuals.push(x2a);
        const x2b = k.add([k.rect(4, 50), k.pos(W / 2 + 80, H * 0.32),
          k.anchor('center'), k.color(255, 0, 0), k.opacity(0.8), k.z(3), k.rotate(-45)]);
        visuals.push(x2b);

        const h2Label = k.add([
          k.text('Nasrallah \u2713', { size: 10, font: 'monospace' }),
          k.pos(W / 2 + 80, H * 0.44), k.anchor('center'), k.color(68, 255, 68), k.z(2),
        ]);
        visuals.push(h2Label);

        // Deep Strike COMPLETE
        const complete = k.add([
          k.text('Deep Strike: COMPLETE \u2713', { size: 20, font: 'monospace' }),
          k.pos(W / 2, H * 0.7), k.anchor('center'), k.color(68, 255, 68), k.z(2),
        ]);
        visuals.push(complete);
      },
    },

    // Page 1 -- "The general is gone. But the tunnels remain."
    {
      text: "The general is gone. But the tunnels remain.",
      color: [255, 102, 68], size: 20, y: H * 0.82,
      charDelay: 0.03,
      setup: (visuals) => {
        // Bunker exploding overlay
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.7), k.z(1)]);
        visuals.push(bg);
        // Mountain silhouette
        const mountain = k.add([k.rect(W, 70), k.pos(0, H - 70), k.color(42, 58, 42), k.z(2)]);
        visuals.push(mountain);
        // Explosion glow
        const explosion = k.add([
          k.circle(60), k.pos(W / 2, H * 0.4), k.color(255, 68, 0), k.opacity(0.3), k.z(3),
        ]);
        visuals.push(explosion);
        k.shake(6);
      },
    },

    // Page 2 -- Tunnel description
    {
      text: "Hundreds of kilometers underground. Built with cement meant for schools. Filled with weapons meant for war.",
      color: [200, 200, 200], size: 18, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(10, 10, 10), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);
        // Tunnel cross-section (horizontal lines)
        for (let i = 0; i < 5; i++) {
          const ty = 100 + i * 80;
          const tunnel = k.add([
            k.rect(W * 0.6, 30), k.pos(W * 0.2, ty),
            k.color(68, 68, 68), k.opacity(0.3), k.z(2),
          ]);
          visuals.push(tunnel);
          const line = k.add([
            k.rect(W * 0.6, 1), k.pos(W * 0.2, ty + 15),
            k.color(51, 51, 51), k.opacity(0.3), k.z(2),
          ]);
          visuals.push(line);
        }
        // Weapon cache indicators
        const cache1 = k.add([
          k.rect(W * 0.4, 20), k.pos(W * 0.3, 130),
          k.color(68, 68, 0), k.opacity(0.15), k.z(3),
        ]);
        visuals.push(cache1);
        const cache2 = k.add([
          k.rect(W * 0.5, 20), k.pos(W * 0.25, 290),
          k.color(68, 68, 0), k.opacity(0.15), k.z(3),
        ]);
        visuals.push(cache2);

        // Sonar ping effect
        const ping = k.add([
          k.circle(8), k.pos(W * 0.5, H * 0.4),
          k.color(0, 255, 68), k.opacity(0.35), k.z(3),
        ]);
        visuals.push(ping);
        k.tween(1, 6, 1.8, (v) => {
          if (ping.exists()) {
            ping.scaleTo(v);
            ping.opacity = 0.35 * (1 - (v - 1) / 5);
          }
        }, k.easings.easeOutQuad);
      },
    },

    // Page 3 -- Sinwar reveal
    {
      text: "And hiding inside: Yahya Sinwar. The man who turned the underground into a fortress.",
      color: [255, 68, 68], size: 18, y: H * 0.82,
      charDelay: 0.03,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);

        // Boss silhouette (dark, menacing figure)
        const bossBg = k.add([
          k.circle(50), k.pos(W / 2, H * 0.4),
          k.color(30, 20, 20), k.opacity(0.5), k.z(2),
        ]);
        visuals.push(bossBg);

        // Head
        const bossHead = k.add([
          k.circle(18), k.pos(W / 2, H * 0.33),
          k.color(160, 120, 85), k.opacity(0), k.z(10),
        ]);
        visuals.push(bossHead);
        k.tween(0, 1, 0.6, (v) => { if (bossHead.exists()) bossHead.opacity = v; });

        // Body
        const bossBody = k.add([
          k.rect(40, 50), k.pos(W / 2, H * 0.45), k.anchor('center'),
          k.color(42, 42, 42), k.opacity(0), k.z(10),
        ]);
        visuals.push(bossBody);
        k.tween(0, 1, 0.6, (v) => { if (bossBody.exists()) bossBody.opacity = v; });

        // Beret
        const beret = k.add([
          k.rect(30, 8), k.pos(W / 2, H * 0.33 - 16), k.anchor('center'),
          k.color(42, 106, 42), k.opacity(0), k.z(11),
        ]);
        visuals.push(beret);
        k.tween(0, 1, 0.8, (v) => { if (beret.exists()) beret.opacity = v; });

        // Name label
        const nameLabel = k.add([
          k.text('YAHYA SINWAR', { size: 14, font: 'monospace' }),
          k.pos(W / 2, H * 0.6), k.anchor('center'),
          k.color(255, 68, 68), k.z(11),
        ]);
        visuals.push(nameLabel);
      },
    },

    // Page 4 -- Every entrance is a trap
    {
      text: "Every entrance is a trap. Every tunnel is a maze.",
      color: [255, 255, 255], size: 20, y: H * 0.45,
      charDelay: 0.03,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);
      },
    },

    // Page 5 -- Drone mission briefing
    {
      text: "Good thing we're not sending a man. We're sending something with no fear and perfect aim. Time to pull the last chair from under him.",
      color: [255, 215, 0], size: 20, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => {
        const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 10, 16), k.opacity(0.85), k.z(1)]);
        visuals.push(bg);

        // Drone visual
        const droneBody = k.add([
          k.rect(40, 8), k.pos(W / 2, H * 0.35), k.anchor('center'),
          k.color(85, 102, 102), k.z(10),
        ]);
        visuals.push(droneBody);
        const droneWingL = k.add([
          k.rect(20, 5), k.pos(W / 2 - 30, H * 0.35 - 3), k.anchor('center'),
          k.color(102, 136, 136), k.z(10),
        ]);
        visuals.push(droneWingL);
        const droneWingR = k.add([
          k.rect(20, 5), k.pos(W / 2 + 30, H * 0.35 - 3), k.anchor('center'),
          k.color(102, 136, 136), k.z(10),
        ]);
        visuals.push(droneWingR);
        const droneCam = k.add([
          k.circle(3), k.pos(W / 2, H * 0.35 + 3),
          k.color(136, 170, 204), k.opacity(0.8), k.z(11),
        ]);
        visuals.push(droneCam);

        // Hover animation
        let hoverDir = -1;
        const hoverLoop = k.loop(1.5, () => {
          hoverDir *= -1;
          k.tween(
            droneBody.pos.y, droneBody.pos.y + hoverDir * 5, 1.5,
            (v) => {
              if (droneBody.exists()) droneBody.pos.y = v;
              if (droneWingL.exists()) droneWingL.pos.y = v - 3;
              if (droneWingR.exists()) droneWingR.pos.y = v - 3;
              if (droneCam.exists()) droneCam.pos.y = v + 3;
            },
            k.easings.easeInOutSine
          );
        });

        // Operation title
        const opTitle = k.add([
          k.text('OPERATION LAST CHAIR', { size: 22, font: 'monospace' }),
          k.pos(W / 2, H * 0.55), k.anchor('center'),
          k.color(255, 215, 0), k.z(10),
        ]);
        visuals.push(opTitle);
      },
    },
  ];

  // Red ambient glow (tunnel danger atmosphere)
  const redGlow = k.add([
    k.rect(W, H), k.pos(0, 0), k.color(255, 0, 0), k.opacity(0.02), k.z(6),
  ]);
  let glowDir = 1;
  k.loop(2.5, () => {
    glowDir *= -1;
    const target = glowDir > 0 ? 0.05 : 0.02;
    k.tween(redGlow.opacity, target, 2.5, (v) => {
      if (redGlow.exists()) redGlow.opacity = v;
    }, k.easings.easeInOutSine);
  });

  runCinematic(k, pages, 'level4-drone', {
    title: 'OPERATION LAST CHAIR',
    coords: "31\u00b025'N 34\u00b023'E",
  });
}
