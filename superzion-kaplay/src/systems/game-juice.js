// ===================================================================
// Game Juice — screen flash, particles, shake effects
// ===================================================================

export function screenFlash(k, r, g, b, duration = 150, alpha = 0.4) {
  const flash = k.add([
    k.rect(960, 540),
    k.pos(0, 0),
    k.color(r, g, b),
    k.opacity(alpha),
    k.fixed(),
    k.z(999),
  ]);
  k.tween(
    alpha, 0, duration / 1000,
    (v) => { flash.opacity = v; },
    k.easings.linear
  ).onEnd(() => flash.destroy());
}

export function impactParticles(k, x, y, count = 8, colors = [[255, 100, 0], [255, 136, 0], [255, 170, 0]]) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 80;
    const c = colors[Math.floor(Math.random() * colors.length)];
    const radius = 2 + Math.random() * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const p = k.add([
      k.circle(radius),
      k.pos(x, y),
      k.color(c[0], c[1], c[2]),
      k.opacity(0.9),
      k.z(20),
    ]);

    p.onUpdate(() => {
      p.pos.x += vx * k.dt();
      p.pos.y += vy * k.dt();
    });

    k.tween(
      0.9, 0, 0.3 + Math.random() * 0.2,
      (v) => { p.opacity = v; },
      k.easings.linear
    ).onEnd(() => p.destroy());
  }
}

export function deathParticles(k, x, y) {
  impactParticles(k, x, y, 12, [[255, 0, 0], [200, 0, 0], [255, 80, 0]]);
}

export function pickupParticles(k, x, y) {
  impactParticles(k, x, y, 6, [[255, 255, 100], [255, 215, 0], [200, 200, 50]]);
}

export function bossPhaseTransition(k, text, r, g, b) {
  // Full-screen dramatic phase transition text with flash
  screenFlash(k, r, g, b, 400, 0.5);
  k.shake(8);
  const label = k.add([
    k.text(text, { size: 36, font: 'monospace' }),
    k.pos(480, 270),
    k.anchor('center'),
    k.color(r, g, b),
    k.opacity(0),
    k.fixed(),
    k.z(998),
  ]);
  k.tween(0, 1, 0.3, (v) => { label.opacity = v; }, k.easings.linear).onEnd(() => {
    k.wait(1.2, () => {
      k.tween(1, 0, 0.5, (v) => { if (label.exists()) label.opacity = v; }, k.easings.linear)
        .onEnd(() => { if (label.exists()) label.destroy(); });
    });
  });
}
