// ═══════════════════════════════════════════════════════════════
// BossTextures — Level 6: Operation Last Stand textures
// Morning Beirut approach: sky, city, ground, bunker, fighter, projectiles
// ═══════════════════════════════════════════════════════════════

const W = 960;
const H = 540;

// ── Player Fighter (64×64) — side-view military fighter jet (F-16 style) ──
export function createPlayerFighter(scene) {
  if (scene.textures.exists('player_fighter')) scene.textures.remove('player_fighter');

  const w = 64, h = 64;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Jet faces RIGHT (nose on right side)
  // Colors — military gray tones
  const fuselageDark = '#5a5a62';
  const fuselageMain = '#6a6a72';
  const fuselageLight = '#7a7a82';
  const fuselageHighlight = '#8a8a92';
  const canopyGlass = '#2a3a5a';
  const canopyGlare = '#5a7aaa';

  // ── Main fuselage body ──
  ctx.fillStyle = fuselageMain;
  ctx.beginPath();
  ctx.moveTo(58, 30);          // nose tip (pointed, rightward)
  ctx.lineTo(52, 27);          // upper nose
  ctx.lineTo(40, 25);          // upper fuselage before cockpit
  ctx.lineTo(20, 24);          // mid upper fuselage
  ctx.lineTo(8, 23);           // rear upper fuselage
  ctx.lineTo(4, 22);           // tail root upper
  ctx.lineTo(2, 28);           // tail nozzle upper
  ctx.lineTo(2, 34);           // tail nozzle lower
  ctx.lineTo(4, 40);           // tail root lower
  ctx.lineTo(8, 39);           // rear lower fuselage
  ctx.lineTo(16, 38);          // mid lower fuselage
  ctx.lineTo(30, 37);          // lower fuselage
  ctx.lineTo(48, 34);          // lower nose
  ctx.lineTo(55, 32);          // chin
  ctx.closePath();
  ctx.fill();

  // ── Fuselage underside (slightly darker) ──
  ctx.fillStyle = fuselageDark;
  ctx.beginPath();
  ctx.moveTo(55, 32);
  ctx.lineTo(48, 34);
  ctx.lineTo(30, 37);
  ctx.lineTo(16, 38);
  ctx.lineTo(8, 39);
  ctx.lineTo(4, 40);
  ctx.lineTo(2, 34);
  ctx.lineTo(4, 36);
  ctx.lineTo(30, 35);
  ctx.lineTo(50, 33);
  ctx.closePath();
  ctx.fill();

  // ── Fuselage top highlight (lighter stripe) ──
  ctx.fillStyle = fuselageHighlight;
  ctx.beginPath();
  ctx.moveTo(56, 28);
  ctx.lineTo(40, 25);
  ctx.lineTo(20, 24);
  ctx.lineTo(10, 24);
  ctx.lineTo(10, 26);
  ctx.lineTo(20, 26);
  ctx.lineTo(40, 27);
  ctx.lineTo(54, 29);
  ctx.closePath();
  ctx.fill();

  // ── Pointed nose / radome ──
  ctx.fillStyle = '#4a4a52';
  ctx.beginPath();
  ctx.moveTo(62, 30);          // very tip
  ctx.lineTo(56, 27);
  ctx.lineTo(52, 28);
  ctx.lineTo(56, 30);
  ctx.lineTo(54, 33);
  ctx.lineTo(56, 32);
  ctx.closePath();
  ctx.fill();
  // Radome stripe
  ctx.strokeStyle = '#3a3a42';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(55, 28);
  ctx.lineTo(55, 33);
  ctx.stroke();

  // ── Cockpit canopy ──
  // Canopy frame
  ctx.fillStyle = '#555560';
  ctx.beginPath();
  ctx.moveTo(46, 25);
  ctx.lineTo(38, 24);
  ctx.lineTo(36, 25);
  ctx.lineTo(36, 28);
  ctx.lineTo(38, 29);
  ctx.lineTo(46, 28);
  ctx.closePath();
  ctx.fill();
  // Glass
  ctx.fillStyle = canopyGlass;
  ctx.beginPath();
  ctx.moveTo(45, 25.5);
  ctx.lineTo(38, 24.5);
  ctx.lineTo(37, 25.5);
  ctx.lineTo(37, 27.5);
  ctx.lineTo(38, 28.5);
  ctx.lineTo(45, 27.5);
  ctx.closePath();
  ctx.fill();
  // Glass glare highlight
  ctx.fillStyle = canopyGlare;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(44, 26);
  ctx.lineTo(40, 25.5);
  ctx.lineTo(40, 26.5);
  ctx.lineTo(43, 26.5);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Delta / swept wings (side-view = triangular shape extending down) ──
  ctx.fillStyle = fuselageMain;
  ctx.beginPath();
  ctx.moveTo(28, 30);          // wing root leading edge
  ctx.lineTo(16, 30);          // wing root trailing edge
  ctx.lineTo(10, 46);          // wing tip trailing edge (extends down)
  ctx.lineTo(22, 46);          // wing tip leading edge
  ctx.lineTo(26, 38);          // wing sweep back
  ctx.closePath();
  ctx.fill();

  // Wing edge highlight
  ctx.strokeStyle = fuselageHighlight;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(28, 30);
  ctx.lineTo(22, 46);
  ctx.stroke();

  // Wing underside shading
  ctx.fillStyle = fuselageDark;
  ctx.beginPath();
  ctx.moveTo(16, 32);
  ctx.lineTo(11, 46);
  ctx.lineTo(22, 46);
  ctx.lineTo(26, 38);
  ctx.lineTo(20, 32);
  ctx.closePath();
  ctx.fill();

  // ── Weapons pylons under wing (small rectangles) ──
  ctx.fillStyle = '#4a4a50';
  ctx.fillRect(18, 40, 3, 5);   // pylon 1
  ctx.fillRect(23, 38, 3, 4);   // pylon 2
  // Missiles/bombs on pylons
  ctx.fillStyle = '#888888';
  ctx.fillRect(18, 45, 3, 2);
  ctx.fillRect(23, 42, 3, 2);

  // ── Tail section — vertical stabilizer (extends upward) ──
  ctx.fillStyle = fuselageLight;
  ctx.beginPath();
  ctx.moveTo(10, 23);           // stabilizer base leading edge
  ctx.lineTo(4, 10);            // stabilizer top
  ctx.lineTo(2, 10);            // top trailing
  ctx.lineTo(4, 22);            // trailing base
  ctx.closePath();
  ctx.fill();
  // Stabilizer edge
  ctx.strokeStyle = fuselageHighlight;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(10, 23);
  ctx.lineTo(4, 10);
  ctx.stroke();
  // Rudder line
  ctx.strokeStyle = fuselageDark;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(5, 12);
  ctx.lineTo(5, 22);
  ctx.stroke();

  // ── Horizontal stabilizers (small wing-like shapes at tail) ──
  ctx.fillStyle = fuselageMain;
  ctx.beginPath();
  ctx.moveTo(8, 34);
  ctx.lineTo(2, 34);
  ctx.lineTo(0, 42);
  ctx.lineTo(6, 42);
  ctx.lineTo(8, 38);
  ctx.closePath();
  ctx.fill();
  // Upper stabilizer
  ctx.beginPath();
  ctx.moveTo(8, 24);
  ctx.lineTo(2, 24);
  ctx.lineTo(0, 18);
  ctx.lineTo(6, 18);
  ctx.lineTo(8, 22);
  ctx.closePath();
  ctx.fill();

  // ── Engine exhaust / nozzle at rear ──
  ctx.fillStyle = '#3a3a42';
  ctx.beginPath();
  ctx.moveTo(4, 27);
  ctx.lineTo(1, 28);
  ctx.lineTo(1, 34);
  ctx.lineTo(4, 35);
  ctx.closePath();
  ctx.fill();
  // Exhaust glow
  ctx.fillStyle = '#ff6600';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(0, 31, 3, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffaa33';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(1, 31, 1.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── Gold Star of David (small on fuselage) ──
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 0.8;
  const sx = 30, sy = 30, sr = 3;
  // Triangle up
  ctx.beginPath();
  ctx.moveTo(sx, sy - sr);
  ctx.lineTo(sx + sr * 0.866, sy + sr * 0.5);
  ctx.lineTo(sx - sr * 0.866, sy + sr * 0.5);
  ctx.closePath();
  ctx.stroke();
  // Triangle down
  ctx.beginPath();
  ctx.moveTo(sx, sy + sr);
  ctx.lineTo(sx + sr * 0.866, sy - sr * 0.5);
  ctx.lineTo(sx - sr * 0.866, sy - sr * 0.5);
  ctx.closePath();
  ctx.stroke();

  // ── Panel lines (subtle detail) ──
  ctx.strokeStyle = fuselageDark;
  ctx.lineWidth = 0.3;
  // Horizontal panel line along fuselage
  ctx.beginPath();
  ctx.moveTo(50, 29);
  ctx.lineTo(10, 29);
  ctx.stroke();
  // Panel near cockpit
  ctx.beginPath();
  ctx.moveTo(35, 25);
  ctx.lineTo(35, 35);
  ctx.stroke();

  scene.textures.addCanvas('player_fighter', c);
}

// ── Bunker Fortress / Supreme Turban (256×256) — final boss face ──
// Ancient, powerful, terrifying. Massive dark turban, blade-like white beard,
// menacing glowing staff. The most imposing boss of all.
export function createBunkerFortress(scene) {
  if (scene.textures.exists('bunker_fortress')) scene.textures.remove('bunker_fortress');

  const w = 256, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  const cx = w / 2, cy = h / 2;

  // Determine boss expression from scene data (default normal)
  const expression = (scene._bossExpression) || 'normal';

  // ── Skin tint based on expression ──
  let skinBase, skinDark, skinLight;
  if (expression === 'furious') {
    skinBase = '#8a2a1a'; skinDark = '#5a1a10'; skinLight = '#aa3a28';
  } else if (expression === 'angry') {
    skinBase = '#7a4a2a'; skinDark = '#5a3218'; skinLight = '#8a5a38';
  } else {
    skinBase = '#6a4020'; skinDark = '#4a2a14'; skinLight = '#7a5030';
  }

  // ── STAFF (behind body, glowing menacingly) ──
  // Staff shaft
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx + 70, cy - 70);
  ctx.lineTo(cx + 55, cy + 100);
  ctx.stroke();
  // Staff ornament top (crescent)
  ctx.fillStyle = '#8a7020';
  ctx.beginPath();
  ctx.arc(cx + 72, cy - 76, 10, Math.PI * 0.8, Math.PI * 2.2);
  ctx.fill();
  // Staff glow
  const staffGlow = ctx.createRadialGradient(cx + 72, cy - 76, 4, cx + 72, cy - 76, 30);
  const glowIntensity = expression === 'furious' ? 0.6 : expression === 'angry' ? 0.4 : 0.25;
  staffGlow.addColorStop(0, `rgba(255, 80, 0, ${glowIntensity})`);
  staffGlow.addColorStop(0.5, `rgba(200, 40, 0, ${glowIntensity * 0.5})`);
  staffGlow.addColorStop(1, 'rgba(150, 20, 0, 0)');
  ctx.fillStyle = staffGlow;
  ctx.beginPath();
  ctx.arc(cx + 72, cy - 76, 30, 0, Math.PI * 2);
  ctx.fill();

  // ── ROBES / SHOULDERS (behind head) ──
  ctx.fillStyle = '#1a1812';
  ctx.beginPath();
  ctx.moveTo(cx - 70, cy + 50);
  ctx.lineTo(cx - 80, cy + 110);
  ctx.lineTo(cx - 100, cy + 128);
  ctx.lineTo(cx + 100, cy + 128);
  ctx.lineTo(cx + 80, cy + 110);
  ctx.lineTo(cx + 70, cy + 50);
  ctx.closePath();
  ctx.fill();
  // Robe texture
  ctx.strokeStyle = '#2a2818';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const ry = cy + 60 + i * 10;
    ctx.beginPath();
    ctx.moveTo(cx - 75, ry);
    ctx.quadraticCurveTo(cx, ry + 5, cx + 75, ry);
    ctx.stroke();
  }

  // ── ANGULAR HEAD SHAPE — aged, powerful, terrifying ──
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.moveTo(cx - 44, cy - 30);   // top-left
  ctx.lineTo(cx + 44, cy - 30);   // top-right
  ctx.lineTo(cx + 52, cy - 15);   // right temple
  ctx.lineTo(cx + 56, cy + 5);    // right cheekbone
  ctx.lineTo(cx + 50, cy + 20);   // right mid
  ctx.lineTo(cx + 42, cy + 32);   // right jaw
  ctx.lineTo(cx + 30, cy + 38);   // right chin
  ctx.lineTo(cx, cy + 42);        // chin point
  ctx.lineTo(cx - 30, cy + 38);   // left chin
  ctx.lineTo(cx - 42, cy + 32);   // left jaw
  ctx.lineTo(cx - 50, cy + 20);   // left mid
  ctx.lineTo(cx - 56, cy + 5);    // left cheekbone
  ctx.lineTo(cx - 52, cy - 15);   // left temple
  ctx.closePath();
  ctx.fill();

  // Deep wrinkles and age lines
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 1.5;
  // Forehead wrinkles (deep, aged)
  for (let i = 0; i < 4; i++) {
    const wy = cy - 24 + i * 5;
    ctx.beginPath();
    ctx.moveTo(cx - 30, wy);
    ctx.quadraticCurveTo(cx, wy - 2, cx + 30, wy);
    ctx.stroke();
  }
  // Nasolabial folds (deep creases from nose to mouth)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 4);
  ctx.quadraticCurveTo(cx - 18, cy + 18, cx - 22, cy + 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 14, cy + 4);
  ctx.quadraticCurveTo(cx + 18, cy + 18, cx + 22, cy + 28);
  ctx.stroke();

  // Cheekbone highlights (gaunt, skeletal)
  ctx.fillStyle = skinLight;
  ctx.beginPath();
  ctx.moveTo(cx + 40, cy - 5);
  ctx.lineTo(cx + 54, cy + 2);
  ctx.lineTo(cx + 48, cy + 14);
  ctx.lineTo(cx + 36, cy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy - 5);
  ctx.lineTo(cx - 54, cy + 2);
  ctx.lineTo(cx - 48, cy + 14);
  ctx.lineTo(cx - 36, cy + 8);
  ctx.closePath();
  ctx.fill();

  // Sunken cheeks (dark hollows)
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.ellipse(cx - 28, cy + 12, 10, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 28, cy + 12, 10, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // ── EARS (aged, large) ──
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx - 56, cy - 10);
  ctx.lineTo(cx - 62, cy - 2);
  ctx.lineTo(cx - 60, cy + 12);
  ctx.lineTo(cx - 56, cy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 56, cy - 10);
  ctx.lineTo(cx + 62, cy - 2);
  ctx.lineTo(cx + 60, cy + 12);
  ctx.lineTo(cx + 56, cy + 8);
  ctx.closePath();
  ctx.fill();

  // ── MASSIVE DARK TURBAN — the most imposing of all ──
  const turbanBase = '#0a0806';
  const turbanMid = '#1a1410';
  const turbanHighlight = '#2a2218';

  // Main turban mass — very tall, very dark
  ctx.fillStyle = turbanBase;
  ctx.beginPath();
  ctx.moveTo(cx - 48, cy - 30);
  ctx.lineTo(cx - 54, cy - 44);
  ctx.lineTo(cx - 50, cy - 62);
  ctx.lineTo(cx - 40, cy - 78);
  ctx.lineTo(cx - 24, cy - 90);
  ctx.lineTo(cx - 8, cy - 96);
  ctx.lineTo(cx + 8, cy - 96);
  ctx.lineTo(cx + 24, cy - 90);
  ctx.lineTo(cx + 40, cy - 78);
  ctx.lineTo(cx + 50, cy - 62);
  ctx.lineTo(cx + 54, cy - 44);
  ctx.lineTo(cx + 48, cy - 30);
  ctx.closePath();
  ctx.fill();

  // Turban fabric fold lines (subtle texture)
  ctx.strokeStyle = turbanMid;
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const wy = cy - 34 - i * 8;
    const spread = 48 - i * 4;
    const wave = Math.sin(i * 1.5) * 4;
    ctx.beginPath();
    ctx.moveTo(cx - spread, wy);
    ctx.quadraticCurveTo(cx + wave, wy - 4, cx + spread, wy);
    ctx.stroke();
  }

  // Turban top highlight
  ctx.strokeStyle = turbanHighlight;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 36, cy - 82);
  ctx.quadraticCurveTo(cx, cy - 100, cx + 36, cy - 82);
  ctx.stroke();

  // Turban center jewel (menacing dark red gem, larger)
  ctx.fillStyle = '#660000';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 38);
  ctx.lineTo(cx + 8, cy - 32);
  ctx.lineTo(cx, cy - 26);
  ctx.lineTo(cx - 8, cy - 32);
  ctx.closePath();
  ctx.fill();
  // Inner gem glow
  ctx.fillStyle = '#aa0000';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 36);
  ctx.lineTo(cx + 4, cy - 32);
  ctx.lineTo(cx, cy - 28);
  ctx.lineTo(cx - 4, cy - 32);
  ctx.closePath();
  ctx.fill();
  // Gem radial glow
  const gemGlow = ctx.createRadialGradient(cx, cy - 32, 2, cx, cy - 32, 18);
  gemGlow.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
  gemGlow.addColorStop(0.5, 'rgba(200, 0, 0, 0.2)');
  gemGlow.addColorStop(1, 'rgba(150, 0, 0, 0)');
  ctx.fillStyle = gemGlow;
  ctx.beginPath();
  ctx.arc(cx, cy - 32, 18, 0, Math.PI * 2);
  ctx.fill();

  // ── THICK ANGRY EYEBROWS — dominating, ancient fury ──
  const browColor = expression === 'dead' ? '#3a3a3a' : '#1a1008';
  ctx.fillStyle = browColor;
  // Left eyebrow — massive, angled severely down toward center
  ctx.beginPath();
  ctx.moveTo(cx - 44, cy - 18);
  ctx.lineTo(cx - 8, cy - 6);
  ctx.lineTo(cx - 8, cy - 12);
  ctx.lineTo(cx - 44, cy - 26);
  ctx.closePath();
  ctx.fill();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(cx + 44, cy - 18);
  ctx.lineTo(cx + 8, cy - 6);
  ctx.lineTo(cx + 8, cy - 12);
  ctx.lineTo(cx + 44, cy - 26);
  ctx.closePath();
  ctx.fill();

  // Eyebrow hair texture
  ctx.strokeStyle = browColor;
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const bx = cx - 40 + i * 6;
    const by = cy - 22 + i * 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 5, by + 4);
    ctx.stroke();
  }
  for (let i = 0; i < 10; i++) {
    const bx = cx + 40 - i * 6;
    const by = cy - 22 + i * 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 5, by + 4);
    ctx.stroke();
  }

  // ── EYES — deeply sunken, glowing, ancient and hateful ──
  if (expression === 'dead') {
    // Spiral eyes
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2.5;
    for (const ex of [cx - 24, cx + 24]) {
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 5; a += 0.2) {
        const r = a * 1.3;
        ctx.lineTo(ex + Math.cos(a) * r, cy - 4 + Math.sin(a) * r);
      }
      ctx.stroke();
    }
    // Heavy bruises
    ctx.fillStyle = 'rgba(80, 30, 100, 0.5)';
    ctx.beginPath(); ctx.ellipse(cx - 24, cy + 4, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 24, cy + 4, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    let irisColor, scleraColor, glowColor;
    if (expression === 'furious') {
      irisColor = '#ee0000'; scleraColor = '#ffaaaa'; glowColor = 'rgba(255, 0, 0, 0.6)';
    } else if (expression === 'angry') {
      irisColor = '#cc2200'; scleraColor = '#ffe0c0'; glowColor = 'rgba(255, 50, 0, 0.4)';
    } else {
      irisColor = '#aa5500'; scleraColor = '#eee8d0'; glowColor = 'rgba(200, 100, 0, 0.25)';
    }

    // Deep sunken eye sockets
    ctx.fillStyle = 'rgba(20, 10, 5, 0.5)';
    ctx.beginPath(); ctx.ellipse(cx - 24, cy - 4, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 24, cy - 4, 16, 10, 0, 0, Math.PI * 2); ctx.fill();

    for (const side of [-1, 1]) {
      const ex = cx + side * 24;
      const ey = cy - 4;

      // Very narrow, piercing eyes
      ctx.fillStyle = scleraColor;
      ctx.beginPath();
      ctx.moveTo(ex - 12, ey);
      ctx.quadraticCurveTo(ex, ey - 4, ex + 12, ey);
      ctx.quadraticCurveTo(ex, ey + 3, ex - 12, ey);
      ctx.closePath();
      ctx.fill();

      // Small intense iris
      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pinpoint pupil
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Menacing glow around eyes
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(ex, ey, 9, 0, Math.PI * 2);
      ctx.fill();

      // Deep dark circles / bags
      ctx.fillStyle = 'rgba(30, 10, 15, 0.5)';
      ctx.beginPath();
      ctx.ellipse(ex, ey + 8, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── NOSE — long, hooked, ancient ──
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx + 6, cy + 10);
  ctx.lineTo(cx + 8, cy + 14);
  ctx.lineTo(cx + 4, cy + 16);
  ctx.lineTo(cx - 4, cy + 16);
  ctx.lineTo(cx - 8, cy + 14);
  ctx.lineTo(cx - 6, cy + 10);
  ctx.closePath();
  ctx.fill();
  // Nostrils
  ctx.fillStyle = '#1a0805';
  ctx.beginPath(); ctx.arc(cx - 4, cy + 14, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy + 14, 2.5, 0, Math.PI * 2); ctx.fill();

  // ── MOUTH — cold, cruel grimace ──
  if (expression === 'dead') {
    ctx.strokeStyle = '#3a1a10';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 22);
    ctx.lineTo(cx - 6, cy + 26);
    ctx.lineTo(cx + 8, cy + 23);
    ctx.lineTo(cx + 18, cy + 25);
    ctx.stroke();
  } else {
    // Thin cruel line that opens to show teeth
    ctx.fillStyle = '#1a0505';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 20);
    ctx.quadraticCurveTo(cx, cy + 25, cx + 20, cy + 20);
    ctx.lineTo(cx + 18, cy + 26);
    ctx.quadraticCurveTo(cx, cy + 30, cx - 18, cy + 26);
    ctx.closePath();
    ctx.fill();

    // Teeth — aged, yellowish
    ctx.fillStyle = '#ccc8a8';
    const teethY = cy + 21;
    const teethH = expression === 'furious' ? 6 : expression === 'angry' ? 5 : 4;
    for (let t = -3; t <= 3; t++) {
      ctx.fillRect(cx + t * 5 - 2, teethY, 4, teethH);
    }
    // Gaps
    ctx.fillStyle = '#0a0505';
    for (let t = -3; t <= 2; t++) {
      ctx.fillRect(cx + t * 5 + 2, teethY, 1, teethH);
    }
    // Missing tooth (one gap wider)
    ctx.fillStyle = '#1a0505';
    ctx.fillRect(cx + 8, teethY, 4, teethH);
  }

  // ── LONG WHITE BEARD — sharp/pointed like a blade ──
  const beardWhite = '#e0dcd0';
  const beardLight = '#ccc8b8';
  const beardMid = '#b8b4a4';
  const beardShadow = '#a09c90';

  // Main beard shape — sharp blade-like point
  ctx.fillStyle = beardWhite;
  ctx.beginPath();
  ctx.moveTo(cx - 36, cy + 24);
  ctx.lineTo(cx - 40, cy + 34);
  ctx.lineTo(cx - 38, cy + 50);
  ctx.lineTo(cx - 30, cy + 65);
  ctx.lineTo(cx - 18, cy + 80);
  ctx.lineTo(cx - 8, cy + 95);
  ctx.lineTo(cx, cy + 108);       // sharp blade point
  ctx.lineTo(cx + 8, cy + 95);
  ctx.lineTo(cx + 18, cy + 80);
  ctx.lineTo(cx + 30, cy + 65);
  ctx.lineTo(cx + 38, cy + 50);
  ctx.lineTo(cx + 40, cy + 34);
  ctx.lineTo(cx + 36, cy + 24);
  ctx.closePath();
  ctx.fill();

  // Beard depth layers
  ctx.fillStyle = beardLight;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy + 30);
  ctx.lineTo(cx - 28, cy + 50);
  ctx.lineTo(cx - 16, cy + 75);
  ctx.lineTo(cx, cy + 100);
  ctx.lineTo(cx + 16, cy + 75);
  ctx.lineTo(cx + 28, cy + 50);
  ctx.lineTo(cx + 30, cy + 30);
  ctx.closePath();
  ctx.fill();

  // Center shadow crease
  ctx.fillStyle = beardShadow;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 30);
  ctx.lineTo(cx, cy + 105);
  ctx.lineTo(cx + 4, cy + 30);
  ctx.closePath();
  ctx.fill();

  // Beard strand texture (many fine lines, 3 shades)
  const beardStrands = [beardWhite, beardLight, beardMid, beardShadow];
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 100; i++) {
    const sx = cx + (Math.random() - 0.5) * 60;
    const sy = cy + 28 + Math.random() * 10;
    const endX = cx + (sx - cx) * 0.2 + (Math.random() - 0.5) * 4;
    const endY = sy + 30 + Math.random() * 50;
    ctx.strokeStyle = beardStrands[Math.floor(Math.random() * beardStrands.length)];
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + (Math.random() - 0.5) * 6, (sy + endY) / 2, endX, endY);
    ctx.stroke();
  }

  // Wispy jagged edges at beard boundary
  ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    const angle = -0.2 + Math.random() * 0.4 + Math.PI / 2;
    const bx = cx + (Math.random() - 0.5) * 70;
    const by = cy + 40 + Math.random() * 40;
    const len = 4 + Math.random() * 8;
    ctx.strokeStyle = beardStrands[Math.floor(Math.random() * beardStrands.length)];
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(angle) * len, by + Math.sin(angle) * len);
    ctx.stroke();
  }

  // ── DAMAGE EXPRESSIONS ──
  if (expression === 'angry' || expression === 'furious') {
    // Forehead veins
    ctx.strokeStyle = expression === 'furious' ? '#dd2020' : '#bb4040';
    ctx.lineWidth = expression === 'furious' ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 26);
    ctx.lineTo(cx - 22, cy - 18);
    ctx.lineTo(cx - 26, cy - 12);
    ctx.lineTo(cx - 18, cy - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 30, cy - 26);
    ctx.lineTo(cx + 22, cy - 18);
    ctx.lineTo(cx + 26, cy - 12);
    ctx.lineTo(cx + 18, cy - 8);
    ctx.stroke();
  }

  if (expression === 'furious') {
    // Deep red tint
    ctx.fillStyle = 'rgba(160, 10, 5, 0.12)';
    ctx.fillRect(0, 0, w, h);

    // Throbbing temple veins
    ctx.strokeStyle = '#dd2020';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 52, cy - 8);
    ctx.lineTo(cx - 46, cy - 2);
    ctx.lineTo(cx - 50, cy + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 52, cy - 8);
    ctx.lineTo(cx + 46, cy - 2);
    ctx.lineTo(cx + 50, cy + 4);
    ctx.stroke();

    // Steam/smoke above turban
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    for (let i = 0; i < 8; i++) {
      const px = cx + (Math.random() - 0.5) * 50;
      const py = cy - 98 - Math.random() * 18;
      const pr = 4 + Math.random() * 6;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enhanced staff glow
    ctx.fillStyle = 'rgba(255, 60, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(cx + 72, cy - 76, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  if (expression === 'dead') {
    // Heavy bruises across face
    ctx.fillStyle = 'rgba(80, 30, 100, 0.45)';
    ctx.beginPath(); ctx.arc(cx - 28, cy + 2, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 30, cy + 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 10, cy + 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 14, cy + 22, 7, 0, Math.PI * 2); ctx.fill();

    // Cracks
    ctx.strokeStyle = 'rgba(50, 25, 15, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 24);
    ctx.lineTo(cx - 10, cy - 10);
    ctx.lineTo(cx - 16, cy + 2);
    ctx.lineTo(cx - 8, cy + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 20, cy - 20);
    ctx.lineTo(cx + 14, cy - 6);
    ctx.lineTo(cx + 22, cy + 8);
    ctx.stroke();

    // Turban cracked
    ctx.strokeStyle = 'rgba(60, 50, 30, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 80);
    ctx.lineTo(cx - 10, cy - 60);
    ctx.lineTo(cx - 18, cy - 42);
    ctx.stroke();

    // Staff gem dimmed
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(cx + 72, cy - 76, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  scene.textures.addCanvas('bunker_fortress', c);
}

// ── Beirut Morning Sky (960×540) — sunrise gradient ───────────
export function createBeirutMorningSky(scene) {
  if (scene.textures.exists('beirut_sky')) scene.textures.remove('beirut_sky');

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Sunrise gradient: deep blue-purple top → orange-gold horizon
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#1a1a3a');
  skyGrad.addColorStop(0.3, '#2a2a5a');
  skyGrad.addColorStop(0.55, '#5a3a5a');
  skyGrad.addColorStop(0.75, '#ff8844');
  skyGrad.addColorStop(0.9, '#ffcc66');
  skyGrad.addColorStop(1, '#ffddaa');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Sun glow near right-center horizon
  const sunX = W * 0.65, sunY = H * 0.78;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
  sunGrad.addColorStop(0, 'rgba(255, 240, 180, 0.9)');
  sunGrad.addColorStop(0.2, 'rgba(255, 220, 120, 0.6)');
  sunGrad.addColorStop(0.5, 'rgba(255, 180, 80, 0.3)');
  sunGrad.addColorStop(1, 'rgba(255, 150, 60, 0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, W, H);

  // Sun disc
  ctx.fillStyle = 'rgba(255, 250, 200, 0.95)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 230, 1)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 10, 0, Math.PI * 2);
  ctx.fill();

  // Thin clouds with warm light
  ctx.fillStyle = 'rgba(255, 221, 170, 0.15)';
  // Cloud 1
  ctx.beginPath();
  ctx.ellipse(200, 100, 80, 12, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // Cloud 2
  ctx.beginPath();
  ctx.ellipse(600, 150, 60, 8, -0.05, 0, Math.PI * 2);
  ctx.fill();
  // Cloud 3
  ctx.beginPath();
  ctx.ellipse(800, 80, 50, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloud 4
  ctx.fillStyle = 'rgba(255, 200, 150, 0.12)';
  ctx.beginPath();
  ctx.ellipse(400, 200, 70, 10, 0.08, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('beirut_sky', c);
}

// ── Beirut City Layer (960×150) — building silhouettes ────────
export function createBeirutCityLayer(scene) {
  if (scene.textures.exists('beirut_city')) scene.textures.remove('beirut_city');

  const w = 960, h = 150;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  const baseY = h - 10;

  // Building silhouettes — dark against sunrise
  ctx.fillStyle = '#1a1a22';

  // Modern buildings (rectangles of varying height)
  const buildings = [
    [10, 50, 40], [55, 70, 30], [90, 90, 35], [130, 60, 25],
    [160, 110, 30], [200, 45, 20], [225, 80, 35], [265, 55, 28],
    [300, 95, 32], [340, 40, 20], [365, 75, 30], [400, 100, 40],
    [445, 60, 25], [475, 85, 35], [515, 50, 22], [542, 70, 30],
    [580, 105, 38], [625, 45, 20], [650, 80, 32], [690, 65, 28],
    [725, 95, 35], [765, 50, 24], [795, 75, 30], [830, 55, 26],
    [860, 90, 34], [900, 60, 28], [932, 70, 28],
  ];

  for (const [bx, bh, bw] of buildings) {
    ctx.fillRect(bx, baseY - bh, bw, bh);
  }

  // Minarets (thin towers with domes)
  const minarets = [
    [185, 120], [490, 100], [750, 110], [920, 95],
  ];
  for (const [mx, mh] of minarets) {
    // Tower
    ctx.fillRect(mx - 3, baseY - mh, 6, mh);
    // Dome
    ctx.beginPath();
    ctx.arc(mx, baseY - mh, 6, Math.PI, Math.PI * 2);
    ctx.fill();
    // Spire
    ctx.fillRect(mx - 1, baseY - mh - 10, 2, 10);
    // Crescent hint
    ctx.beginPath();
    ctx.arc(mx, baseY - mh - 12, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Warm window lights (orange/yellow dots scattered)
  const windowColors = ['#ffaa44', '#ffcc66', '#ff9933', '#ffdd88'];
  for (const [bx, bh, bw] of buildings) {
    if (bh < 50) continue;
    const cols = Math.floor(bw / 8);
    const rows = Math.floor(bh / 12);
    for (let wy = 0; wy < rows; wy++) {
      for (let wx = 0; wx < cols; wx++) {
        if (Math.random() > 0.3) continue; // sparse windows
        ctx.fillStyle = windowColors[Math.floor(Math.random() * windowColors.length)];
        ctx.fillRect(bx + 3 + wx * 8, baseY - bh + 6 + wy * 12, 3, 4);
      }
    }
  }

  scene.textures.addCanvas('beirut_city', c);
}

// ── Beirut Ground Layer (960×120) — sandy terrain ─────────────
export function createBeirutGroundLayer(scene) {
  if (scene.textures.exists('beirut_ground')) scene.textures.remove('beirut_ground');

  const w = 960, h = 120;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Sandy terrain gradient
  const groundGrad = ctx.createLinearGradient(0, 0, 0, h);
  groundGrad.addColorStop(0, '#8a7a60');
  groundGrad.addColorStop(0.4, '#7a6a50');
  groundGrad.addColorStop(1, '#6a5a40');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 0, w, h);

  // Sandy texture noise
  for (let i = 0; i < 600; i++) {
    const nx = Math.random() * w;
    const ny = Math.random() * h;
    ctx.fillStyle = `rgba(${140 + Math.random() * 30}, ${120 + Math.random() * 30}, ${80 + Math.random() * 20}, 0.3)`;
    ctx.fillRect(nx, ny, 2, 1);
  }

  // Road lines
  ctx.fillStyle = '#555045';
  ctx.fillRect(0, 25, w, 16);
  // Center dashes
  ctx.fillStyle = '#999070';
  for (let dx = 0; dx < w; dx += 40) {
    ctx.fillRect(dx, 32, 20, 2);
  }

  // Vegetation patches (dark green)
  ctx.fillStyle = '#2a4020';
  const vegPatches = [50, 180, 340, 500, 620, 780, 890];
  for (const vx of vegPatches) {
    const vw = 15 + Math.random() * 20;
    ctx.beginPath();
    ctx.ellipse(vx, 60 + Math.random() * 30, vw / 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Darker green tufts
  ctx.fillStyle = '#1a3015';
  for (let i = 0; i < 10; i++) {
    const tx = Math.random() * w;
    ctx.beginPath();
    ctx.ellipse(tx, 55 + Math.random() * 40, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Military checkpoint structures (small dark rectangles)
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(300, 50, 20, 12);
  ctx.fillRect(300, 62, 4, 25);
  ctx.fillRect(700, 55, 18, 10);
  ctx.fillRect(700, 65, 3, 20);
  // Barrier poles
  ctx.fillStyle = '#aa3333';
  ctx.fillRect(320, 46, 2, 20);
  ctx.fillRect(718, 50, 2, 18);

  scene.textures.addCanvas('beirut_ground', c);
}

// ── SAM Missile (12×4) — white body, red nose, fins ───────────
export function createSAMMissile(scene) {
  if (scene.textures.exists('sam_missile')) scene.textures.remove('sam_missile');

  const w = 12, h = 4;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // White body
  ctx.fillStyle = '#dddddd';
  ctx.fillRect(2, 0, 8, h);

  // Red nose
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(0, 0, 3, h);

  // Small fins
  ctx.fillStyle = '#bbbbbb';
  ctx.fillRect(9, -1, 3, 1);
  ctx.fillRect(9, h, 3, 1);

  // Exhaust glow at rear
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.arc(11, h / 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(11, h / 2, 1, 0, Math.PI * 2);
  ctx.fill();

  scene.textures.addCanvas('sam_missile', c);
}

// ── Bunker Silhouette (200×150) — for cinematic ───────────────
export function createBunkerSilhouette(scene) {
  if (scene.textures.exists('bunker_silhouette')) scene.textures.remove('bunker_silhouette');

  const w = 200, h = 150;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  const cx = w / 2, cy = h / 2 + 10;

  // Black silhouette bunker body
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(cx - 70, cy - 30);
  ctx.lineTo(cx + 70, cy - 30);
  ctx.lineTo(cx + 78, cy - 15);
  ctx.lineTo(cx + 78, cy + 40);
  ctx.lineTo(cx + 70, cy + 48);
  ctx.lineTo(cx - 70, cy + 48);
  ctx.lineTo(cx - 78, cy + 40);
  ctx.lineTo(cx - 78, cy - 15);
  ctx.closePath();
  ctx.fill();

  // Radar dish silhouette
  ctx.fillRect(cx - 2, cy - 55, 4, 26);
  ctx.beginPath();
  ctx.arc(cx, cy - 56, 10, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 1, cy - 66, 2, 10);

  // SAM launcher silhouettes
  ctx.save();
  ctx.translate(cx + 25, cy - 32);
  ctx.rotate(-0.5);
  ctx.fillRect(-3, -14, 6, 18);
  ctx.restore();
  ctx.save();
  ctx.translate(cx - 15, cy - 32);
  ctx.rotate(-0.4);
  ctx.fillRect(-2, -12, 5, 16);
  ctx.restore();

  // Gun port slits
  ctx.fillRect(cx - 76, cy - 8, 10, 4);
  ctx.fillRect(cx + 66, cy - 8, 10, 4);
  ctx.fillRect(cx - 76, cy + 14, 10, 4);
  ctx.fillRect(cx + 66, cy + 14, 10, 4);

  // Red warning light glow
  ctx.fillStyle = '#ff2222';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(cx - 60, cy - 26, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 60, cy - 26, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy - 32, 3, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Antenna tip
  ctx.fillStyle = '#ff4444';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(cx + 40, cy - 42, 2, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  scene.textures.addCanvas('bunker_silhouette', c);
}

// ── Player Bullet (8×16) — cyan elongated projectile ──────────
export function createBullet(scene) {
  if (scene.textures.exists('player_bullet')) scene.textures.remove('player_bullet');

  const w = 8, h = 16;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Shadow glow
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 4;

  // Outer glow
  ctx.fillStyle = '#005577';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main bullet body
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 3, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // White core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 1.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  scene.textures.addCanvas('player_bullet', c);
}

// ── Boss Bullet (10×10) — red circle projectile ───────────────
export function createBossBullet(scene) {
  if (scene.textures.exists('boss_bullet')) scene.textures.remove('boss_bullet');

  const w = 10, h = 10;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  // Shadow glow
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = 6;

  // Orange edge
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Red center
  ctx.fillStyle = '#ff2222';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Bright core
  ctx.fillStyle = '#ff8844';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  scene.textures.addCanvas('boss_bullet', c);
}
