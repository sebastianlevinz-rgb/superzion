// ===================================================================
// Game Intro Cinematic -- Opening narrative
// Ported from GameIntroScene.js (Phaser) to Kaplay
// Text content and visual design preserved from original
// ===================================================================

import { W, H } from '../../constants.js';
import { runCinematic } from '../cinematic.js';

export function gameIntroScene(k) {
  const pages = [
    // Page 0 -- Destruction: flames, ruins, embers
    {
      text: 'For 3,000 years, they tried to erase us. The oldest living civilization on Earth.',
      color: [255, 255, 255], size: 26, y: H * 0.45,
      charDelay: 0.03,
      setup: (visuals) => setupDestructionBg(k, visuals),
    },
    // Page 1 -- Intense destruction: wider flames, red glow
    {
      text: "Babylon. Rome. The Inquisition. The Nazis. They're all gone. We're still here.",
      color: [255, 215, 0], size: 24, y: H * 0.45,
      charDelay: 0.03,
      setup: (visuals) => setupDestructionIntenseBg(k, visuals),
    },
    // Page 2 -- Enemy bosses with red glow
    {
      text: 'New enemies. Hamas. Hezbollah. The Iranian regime. Same mistake.',
      color: [255, 68, 68], size: 22, y: H * 0.20,
      charDelay: 0.03,
      setup: (visuals) => setupBossSilhouettes(k, visuals),
    },
    // Page 3 -- Enemy parade: red sky, chaos
    {
      text: 'They forgot our secret weapon: we have nowhere else to go.',
      color: [255, 255, 255], size: 26, y: H * 0.82,
      charDelay: 0.03,
      setup: (visuals) => setupEnemyParade(k, visuals),
    },
    // Page 4 -- Hero reveal: B-2 over ocean
    {
      text: 'One Nation. One mission. 3,000 years of resilience.',
      color: [255, 215, 0], size: 24, y: H * 0.85,
      charDelay: 0.03,
      setup: (visuals) => setupHeroReveal(k, visuals),
    },
    // Page 5 -- Title reveal
    {
      text: ' ',
      color: [0, 0, 0], size: 1, y: -100,
      charDelay: 0.001,
      setup: (visuals) => setupTitleReveal(k, visuals),
    },
  ];

  runCinematic(k, pages, 'level1-intro', {
    drawBg: (k) => drawIntroBg(k),
    title: '',
    coords: '',
  });
}

// ===================================================================
// VISUAL SETUP FUNCTIONS
// ===================================================================

/** Default dark background for intro (no military HUD) */
function drawIntroBg(k) {
  // Simple dark background -- individual pages provide their own visuals
  k.add([k.rect(W, H), k.pos(0, 0), k.color(5, 3, 8), k.z(-10)]);
}

/** Page 0 -- Flames, dark ruins, floating embers */
function setupDestructionBg(k, visuals) {
  // Dark overlay bg with red tint
  const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(15, 4, 4), k.z(0)]);
  visuals.push(bg);

  // Ruin silhouettes
  const ruinDefs = [
    { x: 60, w: 35, h: 120 }, { x: 130, w: 20, h: 80 },
    { x: 200, w: 45, h: 140 }, { x: 780, w: 30, h: 100 },
    { x: 850, w: 40, h: 130 }, { x: 900, w: 25, h: 90 },
  ];
  for (const rd of ruinDefs) {
    const ruin = k.add([
      k.rect(rd.w, rd.h), k.pos(rd.x, H - rd.h),
      k.color(26, 18, 16), k.opacity(0.8), k.z(1),
    ]);
    visuals.push(ruin);
  }

  // Empire silhouettes (Babylon ziggurat, Rome columns, Nazi X)
  // Babylon -- triangle
  const empBg = k.add([k.rect(W, H), k.pos(0, 0), k.opacity(0), k.z(5)]);
  visuals.push(empBg);

  // Animated flames at bottom
  const flameColors = [[255, 68, 0], [255, 102, 0], [255, 136, 0], [204, 34, 0]];
  for (let i = 0; i < 8; i++) {
    const fx = 40 + (i / 8) * (W - 80) + (Math.random() - 0.5) * 60;
    const fy = H - 20 - Math.random() * 30;
    const fr = 12 + Math.random() * 18;
    const c = flameColors[i % flameColors.length];
    const flame = k.add([
      k.circle(fr), k.pos(fx, fy), k.color(...c), k.opacity(0.35), k.z(2),
    ]);
    visuals.push(flame);
    // Flickering via pulsing scale
    const baseOp = 0.15 + Math.random() * 0.2;
    const dur = 0.4 + Math.random() * 0.4;
    const startScale = 0.6 + Math.random() * 0.5;
    let dir = 1;
    k.loop(dur, () => {
      if (!flame.exists()) return;
      const target = dir > 0 ? baseOp : 0.35;
      k.tween(flame.opacity, target, dur * 0.5, (v) => {
        if (flame.exists()) flame.opacity = v;
      });
      dir *= -1;
    });
  }

  // Floating embers rising upward
  for (let i = 0; i < 12; i++) {
    const ex = Math.random() * W;
    const eColor = Math.random() > 0.5 ? [255, 170, 0] : [255, 102, 0];
    const eSize = 1.5 + Math.random() * 2.5;
    const ember = k.add([
      k.circle(eSize), k.pos(ex, H + 10 + Math.random() * 40),
      k.color(...eColor), k.opacity(0.6), k.z(3),
    ]);
    visuals.push(ember);
    // Rise upward animation
    const riseDur = 3 + Math.random() * 3;
    function riseEmber() {
      if (!ember.exists()) return;
      ember.pos.x = Math.random() * W;
      ember.pos.y = H + 10;
      ember.opacity = 0.6;
      k.tween(H + 10, -20, riseDur, (v) => {
        if (ember.exists()) ember.pos.y = v;
      });
      k.tween(0.6, 0, riseDur, (v) => {
        if (ember.exists()) ember.opacity = v;
      }).onEnd(() => riseEmber());
    }
    k.wait(Math.random() * 2, () => riseEmber());
  }
}

/** Page 1 -- More intense destruction with red glow */
function setupDestructionIntenseBg(k, visuals) {
  // Darker with stronger red
  const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(20, 4, 4), k.z(0)]);
  visuals.push(bg);

  // Dense ruin silhouettes
  const ruinDefs = [
    { x: 30, w: 40, h: 150 }, { x: 100, w: 25, h: 90 },
    { x: 160, w: 50, h: 170 }, { x: 260, w: 30, h: 110 },
    { x: 680, w: 35, h: 120 }, { x: 750, w: 45, h: 160 },
    { x: 830, w: 28, h: 95 }, { x: 890, w: 38, h: 140 },
  ];
  for (const rd of ruinDefs) {
    const ruin = k.add([
      k.rect(rd.w, rd.h), k.pos(rd.x, H - rd.h),
      k.color(26, 13, 8), k.opacity(0.85), k.z(2),
    ]);
    visuals.push(ruin);
  }

  // Intense flames
  const flameColors = [[255, 34, 0], [255, 68, 0], [255, 102, 0], [255, 136, 0], [255, 170, 0]];
  for (let i = 0; i < 16; i++) {
    const fx = (i / 16) * W + (Math.random() - 0.5) * 40;
    const fy = H - 15 - Math.random() * 40;
    const fr = 14 + Math.random() * 22;
    const c = flameColors[i % flameColors.length];
    const flame = k.add([
      k.circle(fr), k.pos(fx, fy), k.color(...c), k.opacity(0.4), k.z(3),
    ]);
    visuals.push(flame);
  }

  // Dense ember shower
  for (let i = 0; i < 20; i++) {
    const ex = Math.random() * W;
    const eColors = [[255, 170, 0], [255, 102, 0], [255, 68, 0], [255, 204, 0]];
    const c = eColors[i % 4];
    const ember = k.add([
      k.circle(1 + Math.random() * 3), k.pos(ex, H + 10 + Math.random() * 50),
      k.color(...c), k.opacity(0.7), k.z(3),
    ]);
    visuals.push(ember);
    const dur = 2.5 + Math.random() * 2.5;
    function rise() {
      if (!ember.exists()) return;
      ember.pos.x = Math.random() * W;
      ember.pos.y = H + 10;
      ember.opacity = 0.7;
      k.tween(H + 10, -30, dur, (v) => {
        if (ember.exists()) ember.pos.y = v;
      });
      k.tween(0.7, 0, dur, (v) => {
        if (ember.exists()) ember.opacity = v;
      }).onEnd(() => rise());
    }
    k.wait(Math.random() * 1.5, () => rise());
  }

  // Red glow circles at bottom
  for (const gx of [W * 0.15, W * 0.4, W * 0.65, W * 0.85]) {
    const glow = k.add([
      k.circle(120), k.pos(gx, H + 10), k.color(255, 34, 0), k.opacity(0.06), k.z(1),
    ]);
    visuals.push(glow);
  }
}

/** Page 2 -- 4 boss silhouettes with red glow */
function setupBossSilhouettes(k, visuals) {
  // Very dark bg
  const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 2, 2), k.z(0)]);
  visuals.push(bg);

  const bossNames = ['ISMAIL HANIYEH', 'HASSAN NASRALLAH', 'YAHYA SINWAR', 'ALI KHAMENEI'];
  const spacing = W / 5;

  for (let i = 0; i < 4; i++) {
    const bx = spacing * (i + 1);
    const by = H * 0.4;

    // Red glow behind
    const glow = k.add([
      k.circle(60), k.pos(bx, by), k.color(255, 34, 0), k.opacity(0), k.z(3),
    ]);
    visuals.push(glow);
    k.tween(0, 0.45, 0.6, (v) => {
      if (glow.exists()) glow.opacity = v;
    });
    // Pulsing glow
    let glowDir = 1;
    k.loop(0.6, () => {
      if (!glow.exists()) return;
      const t = glowDir > 0 ? 0.15 : 0.45;
      k.tween(glow.opacity, t, 0.5, (v) => {
        if (glow.exists()) glow.opacity = v;
      });
      glowDir *= -1;
    });

    // Boss silhouette (dark rectangle figure)
    const figure = k.add([
      k.rect(40, 70), k.pos(bx, by), k.anchor('center'),
      k.color(100, 20, 20), k.opacity(0), k.z(5),
    ]);
    visuals.push(figure);
    k.tween(0, 1, 0.4, (v) => {
      if (figure.exists()) figure.opacity = v;
    });

    // Head (circle)
    const head = k.add([
      k.circle(15), k.pos(bx, by - 48), k.anchor('center'),
      k.color(100, 20, 20), k.opacity(0), k.z(5),
    ]);
    visuals.push(head);
    k.tween(0, 1, 0.4, (v) => {
      if (head.exists()) head.opacity = v;
    });

    // Name label
    const label = k.add([
      k.text(bossNames[i], { size: 13, font: 'monospace' }),
      k.pos(bx, by + 65), k.anchor('center'),
      k.color(255, 68, 68), k.opacity(0), k.z(6),
    ]);
    visuals.push(label);
    k.wait(0.2 * i + 0.2, () => {
      k.tween(0, 1, 0.4, (v) => {
        if (label.exists()) label.opacity = v;
      });
    });
  }
}

/** Page 3 -- Enemy parade: red sky, missiles, jets */
function setupEnemyParade(k, visuals) {
  // Red sky background
  const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(40, 5, 5), k.z(0)]);
  visuals.push(bg);

  // Ground
  const ground = k.add([k.rect(W, 60), k.pos(0, H - 60), k.color(42, 21, 8), k.z(1)]);
  visuals.push(ground);

  // Enemy org labels (since we don't have flag sprites)
  const orgs = [
    { name: 'IRAN', x: 120 },
    { name: 'HAMAS', x: W / 2 - 120 },
    { name: 'HEZBOLLAH', x: W / 2 + 120 },
    { name: 'REGIME', x: W - 120 },
  ];
  orgs.forEach((org, i) => {
    const label = k.add([
      k.text(org.name, { size: 16, font: 'monospace' }),
      k.pos(org.x, H / 2 - 10), k.anchor('center'),
      k.color(255, 68, 0), k.opacity(0), k.z(4),
    ]);
    visuals.push(label);
    k.wait(i * 0.2, () => {
      k.tween(0, 1, 0.5, (v) => {
        if (label.exists()) label.opacity = v;
      });
    });
  });

  // Missiles flying across (simple rects)
  for (let i = 0; i < 5; i++) {
    k.wait(i * 0.4, () => {
      const my = 60 + Math.random() * (H * 0.5);
      const missile = k.add([
        k.rect(20, 4), k.pos(-30, my), k.color(200, 200, 200), k.z(8),
      ]);
      visuals.push(missile);
      // Trail
      const trail = k.add([
        k.rect(40, 2), k.pos(-70, my + 1), k.color(255, 136, 0), k.opacity(0.5), k.z(7),
      ]);
      visuals.push(trail);
      k.tween(-30, W + 40, 1.5 + Math.random(), (v) => {
        if (missile.exists()) missile.pos.x = v;
        if (trail.exists()) trail.pos.x = v - 40;
      });
    });
  }

  // F-15 jets (simple triangular shapes)
  const jetDefs = [
    { yOff: 0, delay: 0, dur: 2.5 },
    { yOff: 25, delay: 0.4, dur: 3.0 },
    { yOff: 50, delay: 0.8, dur: 3.5 },
  ];
  for (const jd of jetDefs) {
    k.wait(jd.delay, () => {
      const jetY = H * 0.15 + jd.yOff;
      const jet = k.add([
        k.rect(30, 8), k.pos(-40, jetY), k.color(68, 85, 102), k.opacity(0.7), k.z(8),
      ]);
      visuals.push(jet);
      // Engine glow
      const glow = k.add([
        k.circle(3), k.pos(-52, jetY + 4), k.color(255, 102, 0), k.opacity(0.4), k.z(8),
      ]);
      visuals.push(glow);
      k.tween(-40, W + 120, jd.dur, (v) => {
        if (jet.exists()) jet.pos.x = v;
        if (glow.exists()) glow.pos.x = v - 12;
      });
    });
  }
}

/** Page 4 -- Hero reveal: B-2 over night ocean */
function setupHeroReveal(k, visuals) {
  // Night sky + ocean background
  const sky = k.add([k.rect(W, H * 0.4), k.pos(0, 0), k.color(6, 10, 20), k.z(0)]);
  visuals.push(sky);
  const ocean = k.add([k.rect(W, H * 0.6), k.pos(0, H * 0.4), k.color(10, 22, 40), k.z(0)]);
  visuals.push(ocean);

  // Stars
  for (let i = 0; i < 15; i++) {
    const star = k.add([
      k.circle(0.8), k.pos(Math.random() * W, Math.random() * H * 0.35),
      k.color(255, 255, 255), k.opacity(0.3 + Math.random() * 0.3), k.z(1),
    ]);
    visuals.push(star);
  }

  // B-2 bomber silhouette (simple wing shape flying across)
  const b2 = k.add([
    k.rect(50, 6), k.pos(-60, H * 0.38), k.anchor('center'),
    k.color(58, 58, 58), k.z(10),
  ]);
  visuals.push(b2);
  // Wings
  const wingUp = k.add([
    k.rect(6, 35), k.pos(-60, H * 0.38 - 18), k.anchor('center'),
    k.color(46, 46, 46), k.z(10),
  ]);
  visuals.push(wingUp);
  const wingDown = k.add([
    k.rect(6, 35), k.pos(-60, H * 0.38 + 18), k.anchor('center'),
    k.color(46, 46, 46), k.z(10),
  ]);
  visuals.push(wingDown);
  // Engine glow
  const eng1 = k.add([
    k.circle(3), k.pos(-68, H * 0.38 - 5), k.color(255, 68, 0), k.opacity(0.5), k.z(11),
  ]);
  visuals.push(eng1);
  const eng2 = k.add([
    k.circle(3), k.pos(-68, H * 0.38 + 5), k.color(255, 68, 0), k.opacity(0.5), k.z(11),
  ]);
  visuals.push(eng2);

  // Fly across screen
  k.tween(-60, W + 200, 4.5, (v) => {
    if (b2.exists()) b2.pos.x = v;
    if (wingUp.exists()) wingUp.pos.x = v;
    if (wingDown.exists()) wingDown.pos.x = v;
    if (eng1.exists()) eng1.pos.x = v - 8;
    if (eng2.exists()) eng2.pos.x = v - 8;
  });

  // SuperZion hero silhouette walks in from right
  const heroY = H - 160;
  const hero = k.add([
    k.rect(24, 50), k.pos(W + 80, heroY), k.anchor('center'),
    k.color(255, 215, 0), k.z(20),
  ]);
  visuals.push(hero);
  // Hero head
  const heroHead = k.add([
    k.circle(10), k.pos(W + 80, heroY - 35), k.anchor('center'),
    k.color(255, 215, 0), k.z(20),
  ]);
  visuals.push(heroHead);
  // Walk in
  k.tween(W + 80, W / 2, 2.5, (v) => {
    if (hero.exists()) hero.pos.x = v;
    if (heroHead.exists()) heroHead.pos.x = v;
  }, k.easings.easeOutSine);
}

/** Page 5 -- Title reveal: SUPERZION in gold */
function setupTitleReveal(k, visuals) {
  // Very dark bg
  const bg = k.add([k.rect(W, H), k.pos(0, 0), k.color(8, 4, 8), k.z(0)]);
  visuals.push(bg);

  // Skyline silhouette at bottom
  const skyline = k.add([k.rect(W, 80), k.pos(0, H - 80), k.color(10, 8, 8), k.z(1)]);
  visuals.push(skyline);

  // Fire glow behind title
  const glow = k.add([
    k.circle(200), k.pos(W / 2, H * 0.35),
    k.color(255, 170, 0), k.opacity(0), k.z(2),
  ]);
  visuals.push(glow);
  k.tween(0, 0.08, 1.2, (v) => {
    if (glow.exists()) glow.opacity = v;
  });

  // 3D-effect title: shadow layers + main gold
  // Brown shadow
  const shadow1 = k.add([
    k.text('SUPERZION', { size: 42, font: 'monospace' }),
    k.pos(W / 2 + 3, H * 0.35 + 3), k.anchor('center'),
    k.color(58, 37, 16), k.opacity(0), k.z(55),
  ]);
  visuals.push(shadow1);

  // Dark gold
  const shadow2 = k.add([
    k.text('SUPERZION', { size: 42, font: 'monospace' }),
    k.pos(W / 2 + 1.5, H * 0.35 + 1.5), k.anchor('center'),
    k.color(139, 105, 20), k.opacity(0), k.z(56),
  ]);
  visuals.push(shadow2);

  // Main gold title
  const title = k.add([
    k.text('SUPERZION', { size: 42, font: 'monospace' }),
    k.pos(W / 2, H * 0.35), k.anchor('center'),
    k.color(255, 215, 0), k.opacity(0), k.z(57),
  ]);
  visuals.push(title);

  // Fade in title layers
  k.tween(0, 0.8, 0.8, (v) => {
    if (shadow1.exists()) shadow1.opacity = v * 0.6;
    if (shadow2.exists()) shadow2.opacity = v * 0.8;
    if (title.exists()) title.opacity = v;
  });

  // Subtitle below
  const subtitle = k.add([
    k.text('OPERATION TEHRAN', { size: 18, font: 'monospace' }),
    k.pos(W / 2, H * 0.35 + 50), k.anchor('center'),
    k.color(0, 170, 68), k.opacity(0), k.z(57),
  ]);
  visuals.push(subtitle);
  k.wait(0.6, () => {
    k.tween(0, 1, 0.6, (v) => {
      if (subtitle.exists()) subtitle.opacity = v;
    });
  });

  // "PRESS SPACE" prompt
  const prompt = k.add([
    k.text('PRESS SPACE TO BEGIN', { size: 14, font: 'monospace' }),
    k.pos(W / 2, H * 0.65), k.anchor('center'),
    k.color(200, 200, 200), k.opacity(0), k.z(57),
  ]);
  visuals.push(prompt);
  k.wait(1.2, () => {
    k.tween(0, 1, 0.4, (v) => {
      if (prompt.exists()) prompt.opacity = v;
    });
  });
}
