// ===================================================================
// Level 1 Intro Cinematic -- Pre-Level 1: Operation Tehran
// Military terminal aesthetic with classified intel briefing
// Ported from IntroCinematicScene.js (Phaser) to Kaplay
// ===================================================================

import { W, H } from '../../constants.js';
import { runCinematic, drawMilitaryBg } from '../cinematic.js';

export function level1IntroScene(k) {
  const pages = [
    // Page 0 -- Tehran panorama overview
    {
      text: 'Tehran. The heart of the spider web. From here, they fund every enemy we have.',
      color: [255, 255, 255], size: 20, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => setupTehranPanorama(k, visuals),
    },
    // Page 1 -- Intelligence briefing
    {
      text: 'Intelligence located a command center inside a military compound.',
      color: [0, 229, 255], size: 18, y: H * 0.45,
      charDelay: 0.025,
      setup: (visuals) => setupBriefingOverlay(k, visuals),
    },
    // Page 2 -- Target: Ismail Haniyeh
    {
      text: 'The man in charge: Ismail Haniyeh. Chairman of the Hamas Political Bureau.',
      color: [255, 136, 0], size: 18, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => setupTargetReveal(k, visuals),
    },
    // Page 3 -- Mission parameters
    {
      text: 'Get in. Plant the bomb. Get out. No backup. No extraction team.',
      color: [255, 136, 0], size: 20, y: H * 0.45,
      charDelay: 0.025,
      setup: (visuals) => setupBriefingOverlay(k, visuals),
    },
    // Page 4 -- Hero moment
    {
      text: 'Just you, and 3,000 years of practice at the impossible.',
      color: [255, 215, 0], size: 22, y: H * 0.82,
      charDelay: 0.025,
      setup: (visuals) => setupHeroMoment(k, visuals),
    },
  ];

  runCinematic(k, pages, 'level1-platformer', {
    title: 'THE TEHRAN GUEST ROOM',
    coords: "35\u00b041'N 51\u00b025'E",
  });
}

// ===================================================================
// VISUAL SETUP FUNCTIONS
// ===================================================================

/** Page 0 -- Tehran panorama: silhouette of mosque dome, minaret, mountains */
function setupTehranPanorama(k, visuals) {
  // Title overlay
  const title = k.add([
    k.text('TEHRAN, IRAN', { size: 32, font: 'monospace' }),
    k.pos(W / 2, 80), k.anchor('center'),
    k.color(255, 255, 255), k.z(20),
  ]);
  visuals.push(title);

  // Title flicker effect
  let flickerTimer = 0;
  title.onUpdate(() => {
    flickerTimer += k.dt();
    // Brief alpha jitter every ~2 seconds
    if (Math.random() < 0.003) {
      title.opacity = 0.7;
    } else {
      title.opacity = 1;
    }
  });

  // Mountain ridge silhouette across bottom
  drawTehranSilhouette(k, visuals);
}

/** Tehran silhouette -- mosque dome + minaret + mountain ridge */
function drawTehranSilhouette(k, visuals) {
  // Mountain range (simple green rectangles at various heights)
  const mountainDefs = [
    { x: 0, w: 120, h: 135 },
    { x: 100, w: 80, h: 105 },
    { x: 200, w: 100, h: 160 },
    { x: 350, w: 120, h: 130 },
    { x: 450, w: 100, h: 145 },
    { x: 550, w: 100, h: 120 },
    { x: 650, w: 80, h: 150 },
    { x: 750, w: 120, h: 110 },
    { x: 850, w: 110, h: 125 },
  ];
  for (const md of mountainDefs) {
    const mt = k.add([
      k.rect(md.w, md.h), k.pos(md.x, H - md.h),
      k.color(0, 170, 68), k.opacity(0.15), k.z(5),
    ]);
    visuals.push(mt);
  }

  // Mosque dome (center-right)
  const domeX = W * 0.65;
  const domeY = H * 0.45;
  const dome = k.add([
    k.circle(35), k.pos(domeX, domeY),
    k.color(0, 170, 68), k.opacity(0.18), k.z(5),
  ]);
  visuals.push(dome);
  // Dome base
  const domeBase = k.add([
    k.rect(70, 25), k.pos(domeX - 35, domeY),
    k.color(0, 170, 68), k.opacity(0.18), k.z(5),
  ]);
  visuals.push(domeBase);
  // Finial
  const finial = k.add([
    k.circle(3), k.pos(domeX, domeY - 35),
    k.color(0, 170, 68), k.opacity(0.18), k.z(5),
  ]);
  visuals.push(finial);

  // Minaret (tall thin tower left of dome)
  const minX = W * 0.55;
  const minBaseY = H * 0.52;
  const tower = k.add([
    k.rect(6, 80), k.pos(minX - 3, minBaseY - 80),
    k.color(0, 170, 68), k.opacity(0.18), k.z(5),
  ]);
  visuals.push(tower);
  // Balcony
  const balcony = k.add([
    k.rect(14, 3), k.pos(minX - 7, minBaseY - 55),
    k.color(0, 170, 68), k.opacity(0.18), k.z(5),
  ]);
  visuals.push(balcony);
}

/** CRT briefing overlay -- dark bg with subtle green scanlines */
function setupBriefingOverlay(k, visuals) {
  const overlay = k.add([
    k.rect(W, H), k.pos(0, 0),
    k.color(8, 8, 8), k.opacity(0.85), k.z(1),
  ]);
  visuals.push(overlay);

  // CRT green scanlines drawn per frame
  // (very subtle green horizontal lines)
}

/** Page 2 -- Target reveal: dark overlay + boss figure + name label */
function setupTargetReveal(k, visuals) {
  // Dark overlay
  const overlay = k.add([
    k.rect(W, H), k.pos(0, 0),
    k.color(8, 10, 16), k.opacity(0.85), k.z(1),
  ]);
  visuals.push(overlay);

  // Boss figure (silhouette with red tint)
  const bossBody = k.add([
    k.rect(50, 80), k.pos(W / 2, H * 0.4), k.anchor('center'),
    k.color(150, 40, 40), k.opacity(0), k.z(10),
  ]);
  visuals.push(bossBody);
  const bossHead = k.add([
    k.circle(18), k.pos(W / 2, H * 0.4 - 55), k.anchor('center'),
    k.color(150, 40, 40), k.opacity(0), k.z(10),
  ]);
  visuals.push(bossHead);

  // Fade in boss
  k.tween(0, 1, 0.6, (v) => {
    if (bossBody.exists()) bossBody.opacity = v;
    if (bossHead.exists()) bossHead.opacity = v;
  });

  // Red glow behind boss
  const glow = k.add([
    k.circle(80), k.pos(W / 2, H * 0.4),
    k.color(255, 0, 0), k.opacity(0), k.z(9),
  ]);
  visuals.push(glow);
  k.tween(0, 0.15, 0.8, (v) => {
    if (glow.exists()) glow.opacity = v;
  });

  // Target name
  const label = k.add([
    k.text('ISMAIL HANIYEH', { size: 14, font: 'monospace' }),
    k.pos(W / 2, H * 0.75), k.anchor('center'),
    k.color(255, 68, 68), k.opacity(0), k.z(11),
  ]);
  visuals.push(label);
  k.wait(0.3, () => {
    k.tween(0, 1, 0.4, (v) => {
      if (label.exists()) label.opacity = v;
    });
  });
}

/** Page 4 -- Hero moment: dark bg + gold hero figure + operation title */
function setupHeroMoment(k, visuals) {
  // Dark overlay
  const overlay = k.add([
    k.rect(W, H), k.pos(0, 0),
    k.color(8, 10, 16), k.opacity(0.85), k.z(1),
  ]);
  visuals.push(overlay);

  // Hero silhouette (gold tinted)
  const heroBody = k.add([
    k.rect(30, 60), k.pos(W / 2, H * 0.45), k.anchor('center'),
    k.color(255, 215, 0), k.opacity(0), k.z(10),
  ]);
  visuals.push(heroBody);
  const heroHead = k.add([
    k.circle(12), k.pos(W / 2, H * 0.45 - 42), k.anchor('center'),
    k.color(255, 215, 0), k.opacity(0), k.z(10),
  ]);
  visuals.push(heroHead);

  // Fade in hero
  k.tween(0, 1, 0.6, (v) => {
    if (heroBody.exists()) heroBody.opacity = v;
    if (heroHead.exists()) heroHead.opacity = v;
  });

  // Breathing animation on hero
  let breathDir = 1;
  k.loop(1.2, () => {
    if (!heroBody.exists()) return;
    const targetScale = breathDir > 0 ? 1.02 : 1.0;
    k.tween(heroBody.scale.y, targetScale, 0.6, (v) => {
      if (heroBody.exists()) heroBody.scale = k.vec2(heroBody.scale.x, v);
    });
    breathDir *= -1;
  });

  // Gold glow behind hero
  const glow = k.add([
    k.circle(80), k.pos(W / 2, H * 0.45),
    k.color(255, 215, 0), k.opacity(0), k.z(9),
  ]);
  visuals.push(glow);
  k.tween(0, 0.12, 0.8, (v) => {
    if (glow.exists()) glow.opacity = v;
  });

  // 3D operation title -- pseudo-3D gold text
  // Brown shadow
  const shadow1 = k.add([
    k.text('THE TEHRAN GUEST ROOM', { size: 28, font: 'monospace' }),
    k.pos(W / 2 + 2, H * 0.18 + 2), k.anchor('center'),
    k.color(58, 37, 16), k.opacity(0.6), k.z(55),
  ]);
  visuals.push(shadow1);
  // Dark gold
  const shadow2 = k.add([
    k.text('THE TEHRAN GUEST ROOM', { size: 28, font: 'monospace' }),
    k.pos(W / 2 + 1, H * 0.18 + 1), k.anchor('center'),
    k.color(139, 105, 20), k.opacity(0.8), k.z(56),
  ]);
  visuals.push(shadow2);
  // Main gold
  const opTitle = k.add([
    k.text('THE TEHRAN GUEST ROOM', { size: 28, font: 'monospace' }),
    k.pos(W / 2, H * 0.18), k.anchor('center'),
    k.color(255, 215, 0), k.z(57),
  ]);
  visuals.push(opTitle);
}
