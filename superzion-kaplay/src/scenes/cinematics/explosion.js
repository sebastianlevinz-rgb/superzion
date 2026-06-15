// ===================================================================
// Explosion Cinematic -- Post-Level 1 (bomberman victory)
// 5-phase explosion sequence + victory screen
// Ported from ExplosionCinematicScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../../constants.js';

const WORLD_W = W;  // simplified: no camera scroll in Kaplay version
const GROUND_PX = 440;
const FLOOR_H = 38;
const NUM_FLOORS = 5;

export function explosionScene(k) {
  // Receive stats from bomberman scene (passed via scene data or defaults)
  const stats = {
    guardsKilled: 0,
    hp: 3,
    maxHp: 3,
    elapsed: 0,
    ...(_getSceneData()),
  };

  let victoryShown = false;
  let skipped = false;

  // No gravity for this cinematic
  k.setGravity(0);

  // -- Build the scene --
  const buildingX = W * 0.65;
  const playerX = W * 0.25;

  // Sky background
  k.add([k.rect(W, H), k.pos(0, 0), k.color(135, 206, 235), k.z(-10)]);

  // Ground
  k.add([k.rect(W, H - GROUND_PX + 20), k.pos(0, GROUND_PX), k.color(74, 106, 58), k.z(1)]);
  // Dirt layer
  k.add([k.rect(W, 30), k.pos(0, GROUND_PX + 20), k.color(42, 58, 26), k.z(0)]);

  // Building floors
  const floorSprites = [];
  for (let i = 0; i < NUM_FLOORS; i++) {
    const floorY = GROUND_PX - (i + 1) * FLOOR_H;
    const floor = k.add([
      k.rect(120, FLOOR_H - 2),
      k.pos(buildingX, floorY + FLOOR_H / 2),
      k.anchor('center'),
      k.color(140, 130, 110),
      k.z(3),
    ]);
    // Windows on each floor
    for (let w = 0; w < 3; w++) {
      const win = k.add([
        k.rect(12, 14),
        k.pos(buildingX - 35 + w * 35, floorY + FLOOR_H / 2),
        k.anchor('center'),
        k.color(60, 80, 100),
        k.z(4),
      ]);
      floorSprites.push(win);
    }
    floorSprites.push(floor);
  }

  // Roof
  const roofY = GROUND_PX - NUM_FLOORS * FLOOR_H - FLOOR_H;
  const roof = k.add([
    k.rect(130, FLOOR_H - 2),
    k.pos(buildingX, roofY + FLOOR_H / 2),
    k.anchor('center'),
    k.color(100, 90, 80),
    k.z(3),
  ]);
  floorSprites.push(roof);

  // Bomb blinking at base
  const bomb = k.add([
    k.circle(8), k.pos(buildingX, GROUND_PX - 10),
    k.color(200, 50, 50), k.z(5),
  ]);
  let bombBlink = 0;
  bomb.onUpdate(() => {
    bombBlink += k.dt();
    bomb.opacity = Math.sin(bombBlink * 10) > 0 ? 1 : 0.5;
  });

  // Player sprite (simple figure)
  const player = k.add([
    k.rect(20, 40), k.pos(playerX, GROUND_PX - 42), k.anchor('center'),
    k.color(50, 120, 200), k.z(5),
  ]);
  const playerHead = k.add([
    k.circle(8), k.pos(playerX, GROUND_PX - 68),
    k.color(50, 120, 200), k.z(5),
  ]);

  // Skip hint
  const skipHint = k.add([
    k.text('PRESS ENTER TO SKIP', { size: 10, font: 'monospace' }),
    k.pos(W - 16, H - 14), k.anchor('botright'),
    k.color(85, 85, 85), k.z(100),
  ]);

  // -- Phase 1: Detonation (0-1s) --
  k.wait(0.2, () => phase1());

  function phase1() {
    if (skipped) return;

    // Remove bomb
    if (bomb.exists()) bomb.destroy();

    // White flash
    const flash = k.add([
      k.rect(W + 200, H + 200), k.pos(-100, -100),
      k.color(255, 255, 255), k.opacity(1), k.z(300),
    ]);
    k.tween(1, 0, 0.8, (v) => {
      if (flash.exists()) flash.opacity = v;
    }).onEnd(() => { if (flash.exists()) flash.destroy(); });

    // Screen shake
    k.shake(8);

    // Phase 2 at 1s
    k.wait(1, () => phase2());
  }

  // -- Phase 2: Explosion (1-3s) --
  function phase2() {
    if (skipped) return;

    // Expanding fireball (concentric colored circles)
    const fireColors = [
      { r: 1.0, c: [255, 0, 0] },
      { r: 0.75, c: [255, 68, 0] },
      { r: 0.5, c: [255, 136, 0] },
      { r: 0.3, c: [255, 204, 0] },
      { r: 0.15, c: [255, 255, 136] },
      { r: 0.05, c: [255, 255, 255] },
    ];

    let radius = 0;
    const maxR = 200;
    const fireball = k.add([
      k.circle(1), k.pos(buildingX, GROUND_PX - 20),
      k.color(255, 136, 0), k.opacity(0.6), k.z(15),
    ]);

    // Animate fireball expansion
    k.tween(1, maxR, 2, (v) => {
      if (!fireball.exists()) return;
      radius = v;
      // Kaplay circles don't resize easily, so we use scale
      fireball.scale = k.vec2(v, v);
      fireball.opacity = 0.6 * (1 - v / maxR);
    }).onEnd(() => { if (fireball.exists()) fireball.destroy(); });

    // Multiple fireballs at random positions
    for (let i = 0; i < 8; i++) {
      const fb = k.add([
        k.circle(8 + Math.random() * 20),
        k.pos(
          buildingX + (Math.random() - 0.5) * 180,
          GROUND_PX - 80 + (Math.random() - 0.5) * 120
        ),
        k.color(255, 136 + Math.floor(Math.random() * 80), 0),
        k.opacity(0.9), k.z(16),
      ]);
      k.tween(0.9, 0, 0.7 + Math.random() * 0.8, (v) => {
        if (fb.exists()) fb.opacity = v;
      }).onEnd(() => { if (fb.exists()) fb.destroy(); });
    }

    // Debris particles
    const debrisColors = [[136, 136, 136], [106, 90, 74], [122, 122, 106], [90, 74, 58], [154, 138, 122]];
    for (let i = 0; i < 40; i++) {
      const sz = 2 + Math.random() * 6;
      const c = debrisColors[Math.floor(Math.random() * debrisColors.length)];
      const d = k.add([
        k.rect(sz, sz * (0.5 + Math.random())),
        k.pos(
          buildingX + (Math.random() - 0.5) * 60,
          GROUND_PX - 20 - Math.random() * 40
        ),
        k.color(...c), k.z(14),
      ]);
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 300;
      const targetX = d.pos.x + Math.cos(angle) * speed;
      const targetY = d.pos.y + Math.sin(angle) * speed + 120;
      const dur = 0.8 + Math.random() * 1.5;

      k.tween(d.pos.x, targetX, dur, (v) => {
        if (d.exists()) d.pos.x = v;
      });
      k.tween(d.pos.y, targetY, dur, (v) => {
        if (d.exists()) d.pos.y = v;
      });
      k.tween(1, 0, dur, (v) => {
        if (d.exists()) d.opacity = v;
      }).onEnd(() => { if (d.exists()) d.destroy(); });
    }

    // Ongoing shake
    k.shake(5);

    // Phase 3 at 3s
    k.wait(2, () => phase3());
  }

  // -- Phase 3: Collapse (3-5s) --
  function phase3() {
    if (skipped) return;

    // Floors collapse downward
    const pieces = [...floorSprites].reverse();
    pieces.forEach((sp, i) => {
      k.wait(i * 0.3, () => {
        if (!sp.exists()) return;
        k.tween(sp.pos.y, GROUND_PX - 8 - i * 3, 0.4, (v) => {
          if (sp.exists()) sp.pos.y = v;
        }, k.easings.easeOutBounce);
        k.tween(1, 0.4, 0.5, (v) => {
          if (sp.exists()) sp.opacity = v;
        });
      });
    });

    // More falling debris
    for (let i = 0; i < 20; i++) {
      const d = k.add([
        k.rect(2 + Math.random() * 4, 2 + Math.random() * 4),
        k.pos(
          buildingX + (Math.random() - 0.5) * 160,
          GROUND_PX - 200 - Math.random() * 100
        ),
        k.color(Math.random() > 0.5 ? 136 : 106, Math.random() > 0.5 ? 136 : 90, Math.random() > 0.5 ? 136 : 74),
        k.z(13),
      ]);
      const dur = 1 + Math.random() * 2;
      k.tween(d.pos.y, GROUND_PX, dur, (v) => {
        if (d.exists()) d.pos.y = v;
      });
      k.tween(1, 0, dur, (v) => {
        if (d.exists()) d.opacity = v;
      }).onEnd(() => { if (d.exists()) d.destroy(); });
    }

    // Diminishing shake
    k.shake(3);

    // Phase 4 at 5s
    k.wait(2, () => phase4());
  }

  // -- Phase 4: Smoke & aftermath (5-8s) --
  function phase4() {
    if (skipped) return;

    // Rising smoke particles
    for (let i = 0; i < 12; i++) {
      k.wait(i * 0.18, () => {
        const smoke = k.add([
          k.circle(15 + Math.random() * 25),
          k.pos(
            buildingX + (Math.random() - 0.5) * 80,
            GROUND_PX - 25
          ),
          k.color(Math.random() > 0.3 ? 51 : 85, Math.random() > 0.3 ? 51 : 85, Math.random() > 0.3 ? 51 : 85),
          k.opacity(0.45), k.z(13),
        ]);
        const dur = 2.2 + Math.random();
        k.tween(GROUND_PX - 25, GROUND_PX - 200 - Math.random() * 160, dur, (v) => {
          if (smoke.exists()) smoke.pos.y = v;
        });
        k.tween(0.45, 0, dur, (v) => {
          if (smoke.exists()) smoke.opacity = v;
        }).onEnd(() => { if (smoke.exists()) smoke.destroy(); });
      });
    }

    // Small fires flickering in rubble
    for (let i = 0; i < 8; i++) {
      const fx = buildingX + (Math.random() - 0.5) * 170;
      const fy = GROUND_PX - 6 - Math.random() * 18;
      const fire = k.add([
        k.rect(3 + Math.random() * 5, 6 + Math.random() * 8),
        k.pos(fx, fy),
        k.color(255, 102, 0), k.opacity(0.7), k.z(14),
      ]);
      let fireDir = 1;
      const flickerCount = { n: 0 };
      k.loop(0.15 + Math.random() * 0.25, () => {
        if (!fire.exists()) return;
        flickerCount.n++;
        if (flickerCount.n > 20) {
          k.tween(fire.opacity, 0, 0.6, (v) => {
            if (fire.exists()) fire.opacity = v;
          }).onEnd(() => { if (fire.exists()) fire.destroy(); });
          return;
        }
        const t = fireDir > 0 ? 0.15 : 0.7;
        fire.opacity = t;
        fireDir *= -1;
      });
    }

    // Fade out collapsed floor sprites
    k.wait(0.4, () => {
      for (const sp of floorSprites) {
        if (sp.exists()) {
          k.tween(sp.opacity, 0, 0.6, (v) => {
            if (sp.exists()) sp.opacity = v;
          }).onEnd(() => { if (sp.exists()) sp.destroy(); });
        }
      }
    });

    // Rubble pile
    k.wait(0.5, () => {
      const rubble = k.add([
        k.rect(140, 30), k.pos(buildingX, GROUND_PX - 15), k.anchor('center'),
        k.color(100, 90, 70), k.opacity(0), k.z(3),
      ]);
      k.tween(0, 1, 0.8, (v) => {
        if (rubble.exists()) rubble.opacity = v;
      });
    });

    // Skull emoji
    k.wait(0.8, () => {
      const skull = k.add([
        k.text('\u2620', { size: 72, font: 'monospace' }),
        k.pos(buildingX, GROUND_PX - 130), k.anchor('center'),
        k.color(255, 255, 255), k.opacity(0), k.z(20),
      ]);
      k.tween(0, 1, 0.6, (v) => {
        if (skull.exists()) skull.opacity = v;
      });
      k.wait(1.5, () => {
        k.tween(1, 0, 0.5, (v) => {
          if (skull.exists()) skull.opacity = v;
        }).onEnd(() => { if (skull.exists()) skull.destroy(); });
      });
    });

    // Hebrew text typewriter
    k.wait(1.3, () => {
      const fullText = '\u05D3\u05D5\u05D3 \u05D0\u05D1\u05D9'; // "dod avi"
      const dodAvi = k.add([
        k.text('', { size: 28, font: 'monospace' }),
        k.pos(buildingX, GROUND_PX - 65), k.anchor('center'),
        k.color(255, 215, 0), k.z(20),
      ]);
      let idx = 0;
      k.loop(0.12, () => {
        if (!dodAvi.exists()) return;
        idx++;
        dodAvi.text = fullText.substring(0, idx);
        if (idx >= fullText.length) return; // stop naturally
      });
      k.wait(2.5, () => {
        k.tween(1, 0, 0.5, (v) => {
          if (dodAvi.exists()) dodAvi.opacity = v;
        }).onEnd(() => { if (dodAvi.exists()) dodAvi.destroy(); });
      });
    });

    // Phase 5 at 8s
    k.wait(3, () => phase5());
  }

  // -- Phase 5: Fade to victory (8-10s) --
  function phase5() {
    if (skipped) return;

    // Fade to black
    const fade = k.add([
      k.rect(W, H), k.pos(0, 0),
      k.color(0, 0, 0), k.opacity(0), k.z(500),
    ]);
    k.tween(0, 1, 0.8, (v) => {
      if (fade.exists()) fade.opacity = v;
    }).onEnd(() => {
      showVictory();
    });
  }

  // -- Victory screen --
  function showVictory() {
    if (victoryShown) return;
    victoryShown = true;
    if (skipHint.exists()) skipHint.destroy();

    // Black bg
    k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.z(600)]);

    // MISSION COMPLETE
    k.add([
      k.text('MISSION COMPLETE', { size: 36, font: 'monospace' }),
      k.pos(W / 2, 120), k.anchor('center'),
      k.color(0, 255, 100), k.z(601),
    ]);

    // Gold divider
    k.add([
      k.rect(400, 2), k.pos(W / 2, 165), k.anchor('center'),
      k.color(255, 215, 0), k.opacity(0.5), k.z(601),
    ]);

    // Stats
    const lives = stats.hp || 0;
    const maxLives = stats.maxHp || 3;
    const elapsed = stats.elapsed || 0;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    let ratingLabel;
    if (lives === maxLives) ratingLabel = 'PERFECT';
    else if (lives >= 2) ratingLabel = 'GREAT';
    else if (lives >= 1) ratingLabel = 'GOOD';
    else ratingLabel = 'SURVIVED';

    const starCount = lives === maxLives ? 3 : lives >= 2 ? 2 : lives >= 1 ? 1 : 0;
    try { localStorage.setItem('superzion_stars_1', String(starCount)); } catch (e) { /* storage */ }

    // Save level progress
    try {
      const prev = parseInt(localStorage.getItem('superzion_level_progress') || '1');
      if (2 > prev) localStorage.setItem('superzion_level_progress', '2');
    } catch (e) { /* storage */ }

    const statLines = [
      { label: 'TIME', value: timeStr },
      { label: 'LIVES REMAINING', value: `${lives}/${maxLives}` },
      { label: 'GUARDS ELIMINATED', value: `${stats.guardsKilled || 0}` },
      { label: 'RATING', value: ratingLabel },
    ];

    statLines.forEach((s, i) => {
      const y = 200 + i * 35;
      k.add([
        k.text(s.label, { size: 14, font: 'monospace' }),
        k.pos(W / 2 - 120, y), k.color(150, 150, 170), k.z(601),
      ]);
      k.add([
        k.text(s.value, { size: 14, font: 'monospace' }),
        k.pos(W / 2 + 120, y), k.anchor('topright'),
        k.color(255, 215, 0), k.z(601),
      ]);
    });

    // Stars
    const starY = 360;
    for (let i = 0; i < 3; i++) {
      const filled = i < starCount;
      k.add([
        k.text(filled ? '\u2605' : '\u2606', { size: 36, font: 'monospace' }),
        k.pos(W / 2 - 40 + i * 40, starY), k.anchor('center'),
        k.color(filled ? 255 : 80, filled ? 215 : 80, filled ? 0 : 80),
        k.z(601),
      ]);
    }

    // Continue prompt
    const prompt = k.add([
      k.text('PRESS SPACE TO CONTINUE', { size: 16, font: 'monospace' }),
      k.pos(W / 2, 430), k.anchor('center'),
      k.color(255, 215, 0), k.z(601),
    ]);
    let bt = 0;
    prompt.onUpdate(() => {
      bt += k.dt();
      prompt.opacity = Math.sin(bt * 3) > 0 ? 1 : 0.3;
    });

    // Menu button
    k.add([
      k.text('M - MENU', { size: 12, font: 'monospace' }),
      k.pos(W / 2, 470), k.anchor('center'),
      k.color(120, 120, 140), k.z(601),
    ]);

    k.onKeyPress('space', () => {
      if (victoryShown) k.go('beirut-intro');
    });
    k.onKeyPress('enter', () => {
      if (victoryShown) k.go('beirut-intro');
    });
    k.onKeyPress('m', () => {
      if (victoryShown) k.go('menu');
    });
    k.onMousePress(() => {
      if (victoryShown) k.go('beirut-intro');
    });
  }

  // -- Skip cinematic input --
  k.onKeyPress('enter', () => {
    if (!victoryShown && !skipped) {
      skipped = true;
      const fade = k.add([
        k.rect(W, H), k.pos(0, 0),
        k.color(0, 0, 0), k.opacity(0), k.z(500),
      ]);
      k.tween(0, 1, 0.3, (v) => {
        if (fade.exists()) fade.opacity = v;
      }).onEnd(() => showVictory());
    }
  });
  k.onKeyPress('space', () => {
    if (!victoryShown && !skipped) {
      skipped = true;
      const fade = k.add([
        k.rect(W, H), k.pos(0, 0),
        k.color(0, 0, 0), k.opacity(0), k.z(500),
      ]);
      k.tween(0, 1, 0.3, (v) => {
        if (fade.exists()) fade.opacity = v;
      }).onEnd(() => showVictory());
    }
  });
}

/** Helper to retrieve scene data (stats from bomberman).
 *  In Kaplay there's no built-in scene data passing,
 *  so we use a global variable or localStorage fallback.
 */
function _getSceneData() {
  try {
    const raw = window.__superzion_explosion_stats;
    if (raw) {
      window.__superzion_explosion_stats = null;
      return raw;
    }
  } catch (e) { /* */ }
  return {};
}
