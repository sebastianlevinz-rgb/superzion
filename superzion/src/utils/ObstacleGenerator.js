// ═══════════════════════════════════════════════════════════════
// Obstacle hardware textures — searchlight, camera, laser emitter
// ═══════════════════════════════════════════════════════════════

export function createObstacleTextures(scene) {
  // ── Searchlight base (24×16): grey housing with yellow lens ──
  {
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 16;
    const ctx = c.getContext('2d');

    // Metal housing
    ctx.fillStyle = '#666666';
    ctx.fillRect(2, 4, 20, 10);
    ctx.fillStyle = '#555555';
    ctx.fillRect(4, 6, 16, 6);

    // Yellow lens circle
    ctx.beginPath();
    ctx.arc(12, 12, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffee44';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, 12, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Mounting bracket
    ctx.fillStyle = '#444444';
    ctx.fillRect(10, 0, 4, 5);

    scene.textures.addCanvas('searchlight_base', c);
  }

  // ── Camera body (20×14): dark box with red LED ──
  {
    const c = document.createElement('canvas');
    c.width = 20;
    c.height = 14;
    const ctx = c.getContext('2d');

    // Camera box
    ctx.fillStyle = '#333333';
    ctx.fillRect(2, 3, 16, 10);
    ctx.fillStyle = '#444444';
    ctx.fillRect(3, 4, 14, 8);

    // Lens
    ctx.beginPath();
    ctx.arc(16, 8, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#222222';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, 8, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#555555';
    ctx.fill();

    // Red LED
    ctx.beginPath();
    ctx.arc(5, 5, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();

    // Mounting bracket
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, 4, 6);

    scene.textures.addCanvas('camera_body', c);
  }

  // ── Laser emitter (10×10): dark circle with red center ──
  {
    const c = document.createElement('canvas');
    c.width = 10;
    c.height = 10;
    const ctx = c.getContext('2d');

    // Outer circle
    ctx.beginPath();
    ctx.arc(5, 5, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#222222';
    ctx.fill();

    // Inner ring
    ctx.beginPath();
    ctx.arc(5, 5, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#333333';
    ctx.fill();

    // Red center dot
    ctx.beginPath();
    ctx.arc(5, 5, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2222';
    ctx.fill();

    scene.textures.addCanvas('laser_emitter', c);
  }
}
