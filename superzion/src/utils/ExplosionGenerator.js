// ═══════════════════════════════════════════════════════════════
// ExplosionGenerator — Explosion effect textures
// ═══════════════════════════════════════════════════════════════

export function createExplosionTextures(scene) {
  _createFireball(scene);
  _createDebris(scene);
  _createSmokePuff(scene);
  _createDustCloud(scene);
  _createSmallFires(scene);
}

function _createFireball(scene) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
  grad.addColorStop(0.2, 'rgba(255, 200, 50, 0.95)');
  grad.addColorStop(0.5, 'rgba(255, 120, 20, 0.8)');
  grad.addColorStop(0.8, 'rgba(200, 40, 0, 0.5)');
  grad.addColorStop(1, 'rgba(100, 10, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('fireball', canvas);
}

function _createDebris(scene) {
  const colors = ['#888888', '#6a5a4a', '#7a7a6a', '#5a4a3a'];
  for (let i = 0; i < 4; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colors[i];
    // Irregular polygon shape
    ctx.beginPath();
    ctx.moveTo(1 + Math.random() * 2, 1 + Math.random() * 2);
    ctx.lineTo(5 + Math.random() * 2, 0 + Math.random() * 2);
    ctx.lineTo(6 + Math.random() * 2, 5 + Math.random() * 2);
    ctx.lineTo(2 + Math.random() * 2, 6 + Math.random() * 2);
    ctx.closePath();
    ctx.fill();

    scene.textures.addCanvas(`debris_${i}`, canvas);
  }
}

function _createSmokePuff(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 14);
  grad.addColorStop(0, 'rgba(60, 60, 60, 0.6)');
  grad.addColorStop(0.5, 'rgba(40, 40, 40, 0.4)');
  grad.addColorStop(1, 'rgba(20, 20, 20, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fill();

  // Extra blob for organic shape
  ctx.beginPath();
  ctx.arc(20, 12, 8, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('smoke_puff', canvas);
}

function _createDustCloud(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 48, 8, 64, 48, 60);
  grad.addColorStop(0, 'rgba(180, 160, 120, 0.5)');
  grad.addColorStop(0.4, 'rgba(160, 140, 100, 0.35)');
  grad.addColorStop(0.8, 'rgba(140, 120, 80, 0.15)');
  grad.addColorStop(1, 'rgba(120, 100, 60, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(64, 48, 60, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Additional puffs for volume
  for (let i = 0; i < 5; i++) {
    const px = 20 + i * 22;
    const py = 40 + Math.random() * 12;
    const pr = 12 + Math.random() * 8;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('dust_cloud', canvas);
}

function _createSmallFires(scene) {
  for (let i = 0; i < 2; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 12;
    const ctx = canvas.getContext('2d');

    // Flame shape
    const grad = ctx.createLinearGradient(4, 12, 4, 0);
    grad.addColorStop(0, i === 0 ? '#ff6600' : '#ff8800');
    grad.addColorStop(0.5, '#ffaa00');
    grad.addColorStop(1, '#ffee66');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(8, 4, 7, 8);
    ctx.quadraticCurveTo(6, 12, 4, 12);
    ctx.quadraticCurveTo(2, 12, 1, 8);
    ctx.quadraticCurveTo(0, 4, 4, 0);
    ctx.closePath();
    ctx.fill();

    scene.textures.addCanvas(`small_fire_${i}`, canvas);
  }
}
