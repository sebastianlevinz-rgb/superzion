// ═══════════════════════════════════════════════════════════════
// BossScene — Level 6: Operation Last Stand
// Scrolling approach toward fortified bunker in morning Beirut
// Dodge SAMs → close distance → destroy bunker
// Pixel-by-pixel disintegration death animation preserved
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager.js';
import MusicManager from '../systems/MusicManager.js';
import DifficultyManager from '../systems/DifficultyManager.js';
import {
  createPlayerFighter, createBunkerFortress, createBeirutMorningSky,
  createBeirutCityLayer, createBeirutGroundLayer,
  createSAMMissile, createBullet, createBossBullet,
} from '../utils/BossTextures.js';

const W = 960;
const H = 540;

// Approach constants
const APPROACH_SPEED = 120;
const PLAYER_SPEED_Y = 250;
const PLAYER_SPEED_X_BOOST = 80;
const TOTAL_DISTANCE = 6000;
const ATTACK_DISTANCE = 4500;
const BASE_BUNKER_HP = 80;
const BASE_PLAYER_MAX_HP = 6;
const PLAYER_MAX_BULLETS = 8;
const PLAYER_SHOOT_COOLDOWN = 150;
const PLAYER_BULLET_SPEED = 500;
const INVULN_TIME = 1.5;

export default class BossScene extends Phaser.Scene {
  constructor() { super('BossScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Generate textures
    createPlayerFighter(this);
    createBunkerFortress(this);
    createBeirutMorningSky(this);
    createBeirutCityLayer(this);
    createBeirutGroundLayer(this);
    createSAMMissile(this);
    createBullet(this);
    createBossBullet(this);

    // ── State ──
    this.phase = 'intro';
    this.introTimer = 0;
    this.distance = 0;

    // Difficulty
    const dm = DifficultyManager.get();
    this.PLAYER_MAX_HP = Math.round(BASE_PLAYER_MAX_HP * dm.playerHPMult());
    this.BUNKER_HP = Math.round(BASE_BUNKER_HP * dm.bossHPMult());

    // Player
    this.playerX = -40;
    this.playerY = H / 2;
    this.playerHP = this.PLAYER_MAX_HP;
    this.playerBullets = [];
    this.invulnTimer = 0;
    this.shootCooldown = 0;

    // Bunker
    this.bunkerX = W + 150;
    this.bunkerY = 300;
    this.bunkerHP = this.BUNKER_HP;
    // Boss phases: 1=normal(80-50), 2=shield(50-25), 3=enrage(25-0)
    this.bunkerPhase = 1;
    this.shieldActive = false;
    this.shieldAngle = 0; // rotating shield angle
    this.shieldHP = 0;
    this.laserSweepActive = false;
    this.laserSweepAngle = 0;
    this.laserSweepDir = 1;
    this.laserWarningTimer = 0;
    this.laserFiring = false;

    // Dodge/roll
    this.dodgeCooldown = 0;
    this.dodgeTimer = 0;
    this.isDodging = false;
    this.dodgeVX = 0;
    this.dodgeVY = 0;

    // Enemy projectiles
    this.samMissiles = [];
    this.bossBullets = [];
    this.homingMissiles = [];
    this.flakBursts = [];

    // Smoke particles from damaged bunker
    this.smokeParticles = [];
    this.smokeAccum = 0;

    // Attack timers
    this.samTimer = 0;
    this.spreadTimer = 0;
    this.homingTimer = 0;
    this.flakTimer = 0;
    this.laserCooldown = 0;

    // Stats
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.damageTaken = 0;

    // One-time trigger flags
    this.musicPhase2Triggered = false;
    this.warningTextTriggered = false;
    this.phase2Triggered = false;
    this.phase3Triggered = false;

    // Disintegration
    this.disintPixels = [];
    this.disintTimer = 0;

    // "TOO FAR" flash
    this.tooFarFlash = 0;

    // ── Setup ──
    this._setupLayers();
    this._setupHUD();
    this._setupInput();
    this._startIntro();

    this.events.on('shutdown', this.shutdown, this);
  }

  // ═════════════════════════════════════════════════════════════
  // SETUP
  // ═════════════════════════════════════════════════════════════

  _setupLayers() {
    // Sky — static background
    this.skyBg = this.add.image(W / 2, H / 2, 'beirut_sky').setDepth(-10);

    // City silhouette — slow parallax
    this.cityTile = this.add.tileSprite(W / 2, H - 140, W, 150, 'beirut_city').setDepth(-7);

    // Ground — faster parallax
    this.groundTile = this.add.tileSprite(W / 2, H - 60, W, 120, 'beirut_ground').setDepth(-5);

    // Player fighter — rotated 90° for side-view (nose points right)
    this.playerSprite = this.add.image(this.playerX, this.playerY, 'player_fighter').setDepth(10);
    this.playerSprite.setAngle(-90); // point right

    // Bunker fortress — hidden until attack phase
    this.bunkerSprite = this.add.image(this.bunkerX, this.bunkerY, 'bunker_fortress').setDepth(10);
    this.bunkerSprite.setVisible(false);

    // Graphics layers
    this.gfx = this.add.graphics().setDepth(15);
    this.effectsGfx = this.add.graphics().setDepth(20);
  }

  _setupHUD() {
    const hudStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' };

    // Distance indicator (top-right)
    this.hudDistance = this.add.text(W - 15, 15, `DISTANCE: ${TOTAL_DISTANCE}m`, {
      fontFamily: 'monospace', fontSize: '13px', color: '#00e5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00e5ff', blur: 4, fill: true },
    }).setOrigin(1, 0).setDepth(30);

    // Player HP (top-left)
    this.hudPlayerHP = this.add.text(15, 15, `HP: ${this.playerHP}/${this.PLAYER_MAX_HP}`, hudStyle).setDepth(30);

    // Bunker HP bar (hidden until attack phase)
    this.hpBarBg = this.add.rectangle(W / 2, 20, 400, 14, 0x333333).setDepth(30).setAlpha(0);
    this.hpBarFill = this.add.rectangle(W / 2 - 198, 20, 396, 10, 0xff2222).setDepth(31);
    this.hpBarFill.setOrigin(0, 0.5);
    this.hpBarFill.setAlpha(0);
    this.hpBarLabel = this.add.text(W / 2, 20, 'BUNKER', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(32).setAlpha(0);

    // Center message
    this.centerMsg = this.add.text(W / 2, H / 2 - 60, '', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ff2222',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 16, fill: true },
    }).setOrigin(0.5).setDepth(35).setAlpha(0);

    // Instruction text
    this.instrText = this.add.text(W / 2, H - 12, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#666666',
    }).setOrigin(0.5).setDepth(30);

    // "TOO FAR" flash text
    this.tooFarText = this.add.text(W / 2, H / 2, 'TOO FAR TO SHOOT', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff8800',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff6600', blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(35).setAlpha(0);
  }

  _setupInput() {
    this.keys = {
      left: this.input.keyboard.addKey('LEFT'),
      right: this.input.keyboard.addKey('RIGHT'),
      up: this.input.keyboard.addKey('UP'),
      down: this.input.keyboard.addKey('DOWN'),
      space: this.input.keyboard.addKey('SPACE'),
      shift: this.input.keyboard.addKey('SHIFT'),
      enter: this.input.keyboard.addKey('ENTER'),
      m: this.input.keyboard.addKey('M'),
      r: this.input.keyboard.addKey('R'),
      esc: this.input.keyboard.addKey('ESC'),
    };
    this.isPaused = false;
    this.pauseObjects = [];
  }

  // ═════════════════════════════════════════════════════════════
  // INTRO
  // ═════════════════════════════════════════════════════════════

  _startIntro() {
    this.phase = 'intro';
    this.introTimer = 0;
    MusicManager.get().playLevel6Music(1);
    SoundManager.get().playBossEntrance();

    this.instrText.setText('UP/DOWN: Dodge | LEFT/RIGHT: Speed | SPACE: Shoot | SHIFT: Roll');

    // Slide player in from left
    this.tweens.add({
      targets: this,
      playerX: 120,
      duration: 2000,
      ease: 'Power2',
    });

    // "APPROACHING TARGET" text
    this.centerMsg.setText('APPROACHING TARGET');
    this.centerMsg.setColor('#00e5ff');
    this.centerMsg.setAlpha(1);
    this.tweens.add({
      targets: this.centerMsg,
      alpha: 0,
      duration: 500,
      delay: 2200,
    });

    // Transition to approach after 3s
    this.time.delayedCall(3000, () => {
      this.phase = 'approach';
    });
  }

  // ═════════════════════════════════════════════════════════════
  // MAIN UPDATE
  // ═════════════════════════════════════════════════════════════

  update(time, delta) {
    const dt = delta / 1000;

    // Mute toggle
    if (Phaser.Input.Keyboard.JustDown(this.keys.m)) {
      const muted = SoundManager.get().toggleMute();
      MusicManager.get().setMuted(muted);
    }

    // ESC pause
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc) && this.phase !== 'victory' && this.phase !== 'dead') {
      this._togglePause();
      return;
    }
    if (this.isPaused) return;

    switch (this.phase) {
      case 'intro':
        this.introTimer += dt;
        this._updateScrolling(dt, APPROACH_SPEED * 0.3);
        this._updatePlayerSprite();
        break;
      case 'approach':
        this._updateApproach(dt);
        break;
      case 'attack':
        this._updateAttack(dt);
        break;
      case 'disintegrating':
        this._updateDisintegration(dt);
        break;
      case 'victory_pending':
        break;
      case 'victory':
        if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
          this.scene.start('CreditsScene');
        }
        break;
      case 'dead':
        if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
          this.scene.start('MenuScene');
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
          this.scene.start('BossScene');
        }
        break;
    }
  }

  // ═════════════════════════════════════════════════════════════
  // SCROLLING
  // ═════════════════════════════════════════════════════════════

  _updateScrolling(dt, speed) {
    this.cityTile.tilePositionX += speed * 0.15 * dt;
    this.groundTile.tilePositionX += speed * 0.6 * dt;
  }

  // ═════════════════════════════════════════════════════════════
  // APPROACH PHASE
  // ═════════════════════════════════════════════════════════════

  _updateApproach(dt) {
    // Determine effective speed
    let speedMult = 1;
    if (this.keys.left.isDown) speedMult = 0.6;
    if (this.keys.right.isDown) speedMult = 1.4;
    const effectiveSpeed = APPROACH_SPEED * speedMult;

    // Update distance
    this.distance += effectiveSpeed * dt;

    // Scrolling
    this._updateScrolling(dt, effectiveSpeed);

    // Player vertical movement
    if (this.keys.up.isDown) this.playerY -= PLAYER_SPEED_Y * dt;
    if (this.keys.down.isDown) this.playerY += PLAYER_SPEED_Y * dt;
    this.playerY = Phaser.Math.Clamp(this.playerY, 60, 480);

    // SPACE pressed during approach → "TOO FAR" flash
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.tooFarFlash = 0.8;
      this.tooFarText.setAlpha(1);
    }
    if (this.tooFarFlash > 0) {
      this.tooFarFlash -= dt;
      if (this.tooFarFlash <= 0) this.tooFarText.setAlpha(0);
    }

    // Invulnerability
    this._updateInvulnerability(dt);

    // Sub-phase spawning
    this._spawnApproachEnemies(dt);

    // Update projectiles
    this._updateSAMs(dt);
    this._updateBossBullets(dt);
    this._updateHomingMissiles(dt);
    this._updateFlakBursts(dt);

    // Collisions
    this._checkPlayerCollisions();

    // Update sprite + HUD
    this._updatePlayerSprite();
    this._updateApproachHUD();
    this._drawApproachEffects();

    // Music transition at mid-range (one-time)
    if (!this.musicPhase2Triggered && this.distance >= 2000) {
      this.musicPhase2Triggered = true;
      MusicManager.get().playLevel6Music(2);
    }

    // Warning text at 4200m (one-time)
    if (!this.warningTextTriggered && this.distance >= 4200) {
      this.warningTextTriggered = true;
      this._showCenterMessage('ENTERING ATTACK RANGE', '#ff8800');
    }

    // Transition to attack at ATTACK_DISTANCE
    if (this.distance >= ATTACK_DISTANCE) {
      this._transitionToAttack();
    }
  }

  _spawnApproachEnemies(dt) {
    this.samTimer += dt;
    this.spreadTimer += dt;
    this.homingTimer += dt;
    this.flakTimer += dt;

    if (this.distance < 2000) {
      // Sub-phase 1: Long range — light SAMs
      if (this.samTimer >= 3) {
        this.samTimer = 0;
        this._spawnSAM(200, true);
      }
      // Occasional flak
      if (this.flakTimer >= 4) {
        this.flakTimer = 0;
        this._spawnFlakBurst();
      }
    } else if (this.distance < 4000) {
      // Sub-phase 2: Mid range — more SAMs + AA bursts + homing
      if (this.samTimer >= 1.5) {
        this.samTimer = 0;
        this._spawnSAM(280, true);
      }
      if (this.spreadTimer >= 2) {
        this.spreadTimer = 0;
        this._fireAABurst(3);
      }
      if (this.homingTimer >= 6) {
        this.homingTimer = 0;
        this._spawnHomingMissile();
      }
      if (this.flakTimer >= 3) {
        this.flakTimer = 0;
        this._spawnFlakBurst();
      }
    } else {
      // Sub-phase 3: Close range — heavy everything
      if (this.samTimer >= 1) {
        this.samTimer = 0;
        this._spawnSAM(320, true);
      }
      if (this.spreadTimer >= 1.5) {
        this.spreadTimer = 0;
        this._fireAABurst(5);
      }
      if (this.homingTimer >= 4) {
        this.homingTimer = 0;
        this._spawnHomingMissile();
      }
      if (this.flakTimer >= 2) {
        this.flakTimer = 0;
        this._spawnFlakBurst();
      }
    }
  }

  _transitionToAttack() {
    this.phase = 'attack';
    this.playerX = 120;

    // Reset attack timers for bunker phase
    this.samTimer = 0;
    this.spreadTimer = 0;
    this.homingTimer = 0;
    this.flakTimer = 0;

    // Show bunker sliding in from right
    this.bunkerSprite.setVisible(true);
    this.bunkerX = W + 150;
    this.tweens.add({
      targets: this,
      bunkerX: 780,
      duration: 1500,
      ease: 'Power2',
    });

    // Show bunker HP bar
    this.time.delayedCall(1000, () => {
      this.hpBarBg.setAlpha(1);
      this.hpBarFill.setAlpha(1);
      this.hpBarLabel.setAlpha(1);
    });

    this._showCenterMessage('DESTROY THE BUNKER', '#ff2222');
    this.instrText.setText('UP/DOWN: Dodge | LEFT/RIGHT: Move | SPACE: Shoot | SHIFT: Roll');
  }

  // ═════════════════════════════════════════════════════════════
  // ATTACK PHASE
  // ═════════════════════════════════════════════════════════════

  _updateAttack(dt) {
    // Dodge/roll mechanic
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    if (this.isDodging) {
      this.dodgeTimer -= dt;
      this.playerX += this.dodgeVX * dt;
      this.playerY += this.dodgeVY * dt;
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.playerSprite.setAlpha(1);
      }
    }

    // Trigger dodge
    if (!this.isDodging && this.dodgeCooldown <= 0 && Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
      this.isDodging = true;
      this.dodgeTimer = 0.2;
      this.dodgeCooldown = 1.5;
      this.invulnTimer = Math.max(this.invulnTimer, 0.25);
      // Roll in movement direction
      const dx = this.keys.right.isDown ? 1 : this.keys.left.isDown ? -1 : 0;
      const dy = this.keys.down.isDown ? 1 : this.keys.up.isDown ? -1 : 0;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      this.dodgeVX = (dx / mag) * 600;
      this.dodgeVY = (dy / mag) * 600;
      this.playerSprite.setAlpha(0.4);
      SoundManager.get().playTypewriterClick();
    }

    // Player movement — full control (unless dodging)
    if (!this.isDodging) {
      if (this.keys.up.isDown) this.playerY -= PLAYER_SPEED_Y * dt;
      if (this.keys.down.isDown) this.playerY += PLAYER_SPEED_Y * dt;
      if (this.keys.left.isDown) this.playerX -= PLAYER_SPEED_X_BOOST * 2.5 * dt;
      if (this.keys.right.isDown) this.playerX += PLAYER_SPEED_X_BOOST * 2.5 * dt;
    }
    this.playerX = Phaser.Math.Clamp(this.playerX, 60, 500);
    this.playerY = Phaser.Math.Clamp(this.playerY, 60, 480);

    // Update shield rotation in phase 2
    if (this.shieldActive) {
      this.shieldAngle += dt * 1.2;
    }

    // Update laser sweep in phase 3
    if (this.laserSweepActive) {
      if (this.laserWarningTimer > 0) {
        this.laserWarningTimer -= dt;
        if (this.laserWarningTimer <= 0) {
          this.laserFiring = true;
        }
      }
      if (this.laserFiring) {
        this.laserSweepAngle += this.laserSweepDir * 1.8 * dt;
        if (this.laserSweepAngle > 1.2 || this.laserSweepAngle < -1.2) {
          this.laserSweepActive = false;
          this.laserFiring = false;
        }
        // Check laser collision with player
        if (this.invulnTimer <= 0) {
          const laserY = this.bunkerY + Math.sin(this.laserSweepAngle) * 300;
          const laserStartX = this.bunkerX - 60;
          if (this.playerX < laserStartX && Math.abs(this.playerY - laserY) < 25) {
            this._damagePlayer();
          }
        }
      }
    }

    // Shooting toward bunker
    this.shootCooldown -= dt * 1000;
    if (this.keys.space.isDown && this.shootCooldown <= 0) {
      const activeCount = this.playerBullets.filter(b => b.active).length;
      if (activeCount < PLAYER_MAX_BULLETS) {
        this.playerBullets.push({
          x: this.playerX + 20,
          y: this.playerY,
          active: true,
          sprite: this.add.image(this.playerX + 20, this.playerY, 'player_bullet')
            .setDepth(12).setAngle(-90), // bullet goes right
        });
        this.shootCooldown = PLAYER_SHOOT_COOLDOWN;
        this.shotsFired++;
        SoundManager.get().playPlayerShoot();
      }
    }

    // Invulnerability
    this._updateInvulnerability(dt);

    // Bunker attacks
    this._spawnBunkerAttacks(dt);

    // Update projectiles
    this._updatePlayerBullets(dt);
    this._updateSAMs(dt);
    this._updateBossBullets(dt);
    this._updateHomingMissiles(dt);
    this._updateFlakBursts(dt);
    this._updateSmokeParticles(dt);

    // Collisions
    this._checkPlayerCollisions();
    this._checkBunkerCollisions();

    // Update sprites + HUD
    this._updatePlayerSprite();
    this.bunkerSprite.setPosition(this.bunkerX, this.bunkerY);
    this._updateAttackHUD();
    this._drawAttackEffects();
  }

  _spawnBunkerAttacks(dt) {
    this.samTimer += dt;
    this.spreadTimer += dt;
    this.homingTimer += dt;
    this.flakTimer += dt;
    this.laserCooldown = Math.max(0, this.laserCooldown - dt);

    // Phase-dependent parameters
    let samInterval, spreadInterval, homingInterval, flakInterval, samSpeed, spreadCount;

    if (this.bunkerPhase === 1) {
      // Phase 1: Standard assault — SAMs + spreads
      samInterval = 2.2; spreadInterval = 2; homingInterval = 6; flakInterval = 3.5;
      samSpeed = 250; spreadCount = 4;
    } else if (this.bunkerPhase === 2) {
      // Phase 2: Shield phase — less projectiles but shield blocks bullets
      samInterval = 2.5; spreadInterval = 2.5; homingInterval = 4; flakInterval = 4;
      samSpeed = 280; spreadCount = 3;
    } else {
      // Phase 3: Enrage — everything at max + laser sweep
      samInterval = 1; spreadInterval = 1; homingInterval = 3; flakInterval = 1.5;
      samSpeed = 380; spreadCount = 7;
    }

    if (this.samTimer >= samInterval) {
      this.samTimer = 0;
      this._spawnSAMFromBunker(samSpeed);
    }
    if (this.spreadTimer >= spreadInterval) {
      this.spreadTimer = 0;
      this._fireBunkerSpread(spreadCount);
    }
    if (this.homingTimer >= homingInterval) {
      this.homingTimer = 0;
      this._spawnHomingMissile();
    }
    if (this.flakTimer >= flakInterval) {
      this.flakTimer = 0;
      this._spawnFlakBurst();
    }

    // Phase 3: Laser sweep attack
    if (this.bunkerPhase === 3 && !this.laserSweepActive && this.laserCooldown <= 0) {
      this.laserCooldown = 5;
      this.laserSweepActive = true;
      this.laserSweepAngle = -1.0;
      this.laserSweepDir = 1;
      this.laserWarningTimer = 1.0; // 1s warning before firing
      this.laserFiring = false;
      this._showCenterMessage('LASER WARNING', '#ff4444');
    }

    // Smoke from damaged bunker
    if (this.bunkerHP < this.BUNKER_HP * 0.6) {
      const rate = this.bunkerHP < this.BUNKER_HP * 0.25 ? 20 : 10;
      this.smokeAccum += dt;
      const interval = 1 / rate;
      while (this.smokeAccum >= interval) {
        this.smokeAccum -= interval;
        this.smokeParticles.push({
          x: this.bunkerX + (Math.random() - 0.5) * 80,
          y: this.bunkerY + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 20,
          vy: -Math.random() * 40 - 20,
          life: 1.0, maxLife: 1.0,
          size: 3 + Math.random() * 4,
        });
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // ENEMY SPAWNING
  // ═════════════════════════════════════════════════════════════

  _spawnSAM(speed, homing) {
    const y = 80 + Math.random() * 360;
    this.samMissiles.push({
      x: W + 10,
      y: y,
      vx: -speed,
      vy: 0,
      speed: speed,
      homing: homing,
      active: true,
    });
    SoundManager.get().playHomingMissile();
  }

  _spawnSAMFromBunker(speed) {
    // Fire from bunker gun ports
    const offsets = [-20, 20];
    for (const oy of offsets) {
      this.samMissiles.push({
        x: this.bunkerX - 60,
        y: this.bunkerY + oy,
        vx: -speed,
        vy: 0,
        speed: speed,
        homing: true,
        active: true,
      });
    }
    SoundManager.get().playHomingMissile();
  }

  _fireAABurst(count) {
    // Stream of red bullets from right
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 120, () => {
        if (this.phase !== 'approach' && this.phase !== 'attack') return;
        const spawnY = 100 + Math.random() * 340;
        const targetY = this.playerY + (Math.random() - 0.5) * 80;
        this.bossBullets.push({
          x: W + 5,
          y: spawnY,
          vx: -220,
          vy: (targetY - spawnY) * 0.3,
          active: true,
          sprite: this.add.image(W + 5, spawnY, 'boss_bullet').setDepth(12),
        });
      });
    }
  }

  _fireBunkerSpread(count) {
    const angleStep = 0.7 / (count - 1 || 1);
    const startAngle = Math.PI - 0.35;
    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      this.bossBullets.push({
        x: this.bunkerX - 50,
        y: this.bunkerY,
        vx: Math.cos(angle) * 200,
        vy: Math.sin(angle) * 200,
        active: true,
        sprite: this.add.image(this.bunkerX - 50, this.bunkerY, 'boss_bullet').setDepth(12),
      });
    }
  }

  _spawnHomingMissile() {
    const spawnX = this.phase === 'attack' ? this.bunkerX - 40 : W + 10;
    const spawnY = this.phase === 'attack' ? this.bunkerY : 100 + Math.random() * 300;
    SoundManager.get().playHomingMissile();
    this.homingMissiles.push({
      x: spawnX,
      y: spawnY,
      vx: -60,
      vy: 0,
      speed: 160,
      active: true,
    });
  }

  _spawnFlakBurst() {
    // Orange warning circle at random position ahead of player
    const fx = this.playerX + 150 + Math.random() * 400;
    const fy = 80 + Math.random() * 380;
    this.flakBursts.push({
      x: Phaser.Math.Clamp(fx, 100, W - 50),
      y: fy,
      radius: 0,
      maxRadius: 40 + Math.random() * 30,
      timer: 0,
      duration: 0.8,
      active: true,
    });
  }

  // ═════════════════════════════════════════════════════════════
  // PROJECTILE UPDATES
  // ═════════════════════════════════════════════════════════════

  _updateSAMs(dt) {
    for (const m of this.samMissiles) {
      if (!m.active) continue;

      if (m.homing) {
        // Slight homing — turn toward player Y
        const dy = this.playerY - m.y;
        m.vy += dy * 1.5 * dt;
        m.vy = Phaser.Math.Clamp(m.vy, -150, 150);
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (m.x < -20 || m.x > W + 20 || m.y < -20 || m.y > H + 20) {
        m.active = false;
      }
    }
    this.samMissiles = this.samMissiles.filter(m => m.active);
  }

  _updatePlayerBullets(dt) {
    for (const b of this.playerBullets) {
      if (!b.active) continue;
      b.x += PLAYER_BULLET_SPEED * dt; // bullets go RIGHT
      b.sprite.setPosition(b.x, b.y);
      if (b.x > W + 20) {
        b.active = false;
        b.sprite.destroy();
      }
    }
    this.playerBullets = this.playerBullets.filter(b => b.active);
  }

  _updateBossBullets(dt) {
    for (const b of this.bossBullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.sprite.setPosition(b.x, b.y);
      if (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20) {
        b.active = false;
        b.sprite.destroy();
      }
    }
    this.bossBullets = this.bossBullets.filter(b => b.active);
  }

  _updateHomingMissiles(dt) {
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      const dx = this.playerX - m.x;
      const dy = this.playerY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        m.vx += (dx / dist) * 180 * dt;
        m.vy += (dy / dist) * 180 * dt;
        const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        if (spd > m.speed) {
          m.vx = (m.vx / spd) * m.speed;
          m.vy = (m.vy / spd) * m.speed;
        }
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (m.x < -40 || m.x > W + 40 || m.y < -40 || m.y > H + 40) {
        m.active = false;
      }
    }
    this.homingMissiles = this.homingMissiles.filter(m => m.active);
  }

  _updateFlakBursts(dt) {
    for (const f of this.flakBursts) {
      if (!f.active) continue;
      f.timer += dt;
      f.radius = f.maxRadius * (f.timer / f.duration);
      if (f.timer >= f.duration) {
        f.active = false;
      }
    }
    this.flakBursts = this.flakBursts.filter(f => f.active);
  }

  _updateSmokeParticles(dt) {
    for (const p of this.smokeParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.size += dt * 2;
    }
    this.smokeParticles = this.smokeParticles.filter(p => p.life > 0);
  }

  // ═════════════════════════════════════════════════════════════
  // COLLISIONS
  // ═════════════════════════════════════════════════════════════

  _checkPlayerCollisions() {
    if (this.invulnTimer > 0) return;

    // SAMs → player
    for (const m of this.samMissiles) {
      if (!m.active) continue;
      const dx = m.x - this.playerX;
      const dy = m.y - this.playerY;
      if (Math.sqrt(dx * dx + dy * dy) < 22) {
        m.active = false;
        this._damagePlayer();
        return;
      }
    }

    // Boss bullets → player
    for (const b of this.bossBullets) {
      if (!b.active) continue;
      const dx = b.x - this.playerX;
      const dy = b.y - this.playerY;
      if (Math.sqrt(dx * dx + dy * dy) < 22) {
        b.active = false;
        b.sprite.destroy();
        this._damagePlayer();
        return;
      }
    }

    // Homing missiles → player
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      const dx = m.x - this.playerX;
      const dy = m.y - this.playerY;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        m.active = false;
        this._damagePlayer();
        return;
      }
    }

    // Flak bursts → player (damage when overlapping expanding ring)
    for (const f of this.flakBursts) {
      if (!f.active) continue;
      const dx = this.playerX - f.x;
      const dy = this.playerY - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < f.radius && f.timer > 0.1 && f.timer < 0.5) {
        this._damagePlayer();
        return;
      }
    }
  }

  _checkBunkerCollisions() {
    for (const b of this.playerBullets) {
      if (!b.active) continue;
      const dx = b.x - this.bunkerX;
      const dy = b.y - this.bunkerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Phase 2: Shield blocks bullets from the front
      if (this.shieldActive && dist < 90) {
        const bulletAngle = Math.atan2(dy, dx);
        // Shield covers a 120-degree arc, rotating
        const shieldFacing = this.shieldAngle + Math.PI; // faces left (toward player)
        let angleDiff = bulletAngle - shieldFacing;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) < Math.PI / 3) {
          // Bullet blocked by shield
          b.active = false;
          b.sprite.destroy();
          this.shieldHP--;
          SoundManager.get().playTypewriterClick();
          if (this.shieldHP <= 0) {
            this.shieldActive = false;
            this.cameras.main.flash(200, 100, 200, 255);
            this._showCenterMessage('SHIELD DOWN', '#00e5ff');
            SoundManager.get().playExplosion();
          }
          continue;
        }
      }

      if (dist < 70) {
        b.active = false;
        b.sprite.destroy();
        this.bunkerHP--;
        this.shotsHit++;
        SoundManager.get().playBossHit();

        this.bunkerSprite.setTint(0xffffff);
        this.time.delayedCall(80, () => {
          if (this.bunkerSprite && this.bunkerSprite.active) this.bunkerSprite.clearTint();
        });

        // Phase 2 transition: HP <= 50 — Shield deploys
        if (this.bunkerHP <= this.BUNKER_HP * 0.625 && !this.phase2Triggered) {
          this.phase2Triggered = true;
          this.bunkerPhase = 2;
          this.shieldActive = true;
          this.shieldHP = 12;
          this.shieldAngle = 0;
          this.cameras.main.flash(500, 100, 100, 255);
          SoundManager.get().playBossPhaseTransition();
          MusicManager.get().playLevel6Music(2);
          this._showCenterMessage('SHIELD DEPLOYED', '#8888ff');
          this.instrText.setText('UP/DOWN: Dodge | SHIFT: Roll | Flank the shield!');
          this.samTimer = 0; this.spreadTimer = 0; this.homingTimer = 0;
        }

        // Phase 3 transition: HP <= 25 — Full enrage
        if (this.bunkerHP <= this.BUNKER_HP * 0.3125 && !this.phase3Triggered) {
          this.phase3Triggered = true;
          this.bunkerPhase = 3;
          this.shieldActive = false;
          this.cameras.main.flash(500, 255, 50, 0);
          SoundManager.get().playBossPhaseTransition();
          MusicManager.get().playLevel6Music(3);
          this._showCenterMessage('BUNKER CRITICAL — FULL ASSAULT', '#ff2222');
          this.instrText.setText('DODGE THE LASER! SHIFT to roll!');
          this.samTimer = 0; this.spreadTimer = 0; this.homingTimer = 0;
        }

        if (this.bunkerHP <= 0) {
          this.bunkerHP = 0;
          this._startDisintegration();
          return;
        }
      }
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PLAYER DAMAGE
  // ═════════════════════════════════════════════════════════════

  _damagePlayer() {
    this.playerHP--;
    this.damageTaken++;
    this.invulnTimer = INVULN_TIME;
    this.cameras.main.shake(200, 0.01);
    SoundManager.get().playPlayerHit();

    if (this.playerHP <= 0) {
      this.playerHP = 0;
      this._playerDeath();
    }
  }

  _updateInvulnerability(dt) {
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      this.playerSprite.setAlpha(Math.sin(Date.now() * 0.02) > 0 ? 1 : 0.3);
    } else {
      this.playerSprite.setAlpha(1);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // SPRITE & HUD UPDATES
  // ═════════════════════════════════════════════════════════════

  _updatePlayerSprite() {
    this.playerSprite.setPosition(this.playerX, this.playerY);
  }

  _showCenterMessage(text, color) {
    this.centerMsg.setText(text);
    this.centerMsg.setColor(color);
    this.centerMsg.setAlpha(1);
    this.tweens.add({
      targets: this.centerMsg,
      alpha: 0,
      duration: 800,
      delay: 1200,
    });
  }

  _updateApproachHUD() {
    const remaining = Math.max(0, Math.round(TOTAL_DISTANCE - this.distance));
    this.hudDistance.setText(`DISTANCE: ${remaining}m`);
    this.hudPlayerHP.setText(`HP: ${this.playerHP}/${this.PLAYER_MAX_HP}`);
    this.hudPlayerHP.setColor(this.playerHP <= 2 ? '#ff4444' : '#ffffff');
  }

  _updateAttackHUD() {
    this.hudDistance.setText('DISTANCE: ENGAGED');
    this.hudPlayerHP.setText(`HP: ${this.playerHP}/${this.PLAYER_MAX_HP}`);
    this.hudPlayerHP.setColor(this.playerHP <= 2 ? '#ff4444' : '#ffffff');

    // Bunker HP bar
    const hpRatio = this.bunkerHP / this.BUNKER_HP;
    this.hpBarFill.setScale(hpRatio, 1);
  }

  // ═════════════════════════════════════════════════════════════
  // DRAWING EFFECTS
  // ═════════════════════════════════════════════════════════════

  _drawApproachEffects() {
    this.effectsGfx.clear();

    // SAM missiles
    for (const m of this.samMissiles) {
      if (!m.active) continue;
      // Missile body
      this.effectsGfx.fillStyle(0xdddddd, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 12, 4);
      // Red nose
      this.effectsGfx.fillStyle(0xff3333, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 3, 4);
      // Exhaust
      this.effectsGfx.fillStyle(0xff8800, 0.7);
      this.effectsGfx.fillCircle(m.x + 7, m.y, 3);
      this.effectsGfx.fillStyle(0xffcc00, 0.5);
      this.effectsGfx.fillCircle(m.x + 9, m.y, 2);
    }

    // Homing missiles
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      this.effectsGfx.fillStyle(0xff2222, 1);
      this.effectsGfx.fillCircle(m.x, m.y, 5);
      this.effectsGfx.fillStyle(0xff6600, 0.5);
      this.effectsGfx.fillCircle(m.x, m.y, 8);
    }

    // Flak bursts
    for (const f of this.flakBursts) {
      if (!f.active) continue;
      const alpha = 1 - f.timer / f.duration;
      this.effectsGfx.lineStyle(3, 0xff8800, alpha * 0.6);
      this.effectsGfx.strokeCircle(f.x, f.y, f.radius);
      this.effectsGfx.fillStyle(0xff6600, alpha * 0.2);
      this.effectsGfx.fillCircle(f.x, f.y, f.radius * 0.5);
    }
  }

  _drawAttackEffects() {
    this.effectsGfx.clear();

    // SAM missiles
    for (const m of this.samMissiles) {
      if (!m.active) continue;
      this.effectsGfx.fillStyle(0xdddddd, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 12, 4);
      this.effectsGfx.fillStyle(0xff3333, 1);
      this.effectsGfx.fillRect(m.x - 6, m.y - 2, 3, 4);
      this.effectsGfx.fillStyle(0xff8800, 0.7);
      this.effectsGfx.fillCircle(m.x + 7, m.y, 3);
    }

    // Homing missiles
    for (const m of this.homingMissiles) {
      if (!m.active) continue;
      this.effectsGfx.fillStyle(0xff2222, 1);
      this.effectsGfx.fillCircle(m.x, m.y, 5);
      this.effectsGfx.fillStyle(0xff6600, 0.5);
      this.effectsGfx.fillCircle(m.x, m.y, 8);
    }

    // Flak bursts
    for (const f of this.flakBursts) {
      if (!f.active) continue;
      const alpha = 1 - f.timer / f.duration;
      this.effectsGfx.lineStyle(3, 0xff8800, alpha * 0.6);
      this.effectsGfx.strokeCircle(f.x, f.y, f.radius);
      this.effectsGfx.fillStyle(0xff6600, alpha * 0.2);
      this.effectsGfx.fillCircle(f.x, f.y, f.radius * 0.5);
    }

    // Smoke particles
    for (const p of this.smokeParticles) {
      const alpha = (p.life / p.maxLife) * 0.5;
      this.effectsGfx.fillStyle(0x666666, alpha);
      this.effectsGfx.fillCircle(p.x, p.y, p.size);
    }

    // Shield rendering (Phase 2)
    if (this.shieldActive) {
      const sx = this.bunkerX, sy = this.bunkerY;
      const shieldR = 85;
      const facing = this.shieldAngle + Math.PI;
      const arcHalf = Math.PI / 3;
      this.effectsGfx.lineStyle(4, 0x6666ff, 0.6);
      this.effectsGfx.beginPath();
      this.effectsGfx.arc(sx, sy, shieldR, facing - arcHalf, facing + arcHalf, false);
      this.effectsGfx.strokePath();
      this.effectsGfx.lineStyle(8, 0x4444ff, 0.15);
      this.effectsGfx.beginPath();
      this.effectsGfx.arc(sx, sy, shieldR, facing - arcHalf, facing + arcHalf, false);
      this.effectsGfx.strokePath();
    }

    // Laser sweep rendering (Phase 3)
    if (this.laserSweepActive) {
      const lx = this.bunkerX - 60;
      const ly = this.bunkerY + Math.sin(this.laserSweepAngle) * 300;
      if (this.laserFiring) {
        // Active laser beam
        this.effectsGfx.lineStyle(6, 0xff0000, 0.8);
        this.effectsGfx.beginPath();
        this.effectsGfx.moveTo(this.bunkerX - 60, this.bunkerY);
        this.effectsGfx.lineTo(0, ly);
        this.effectsGfx.strokePath();
        // Glow
        this.effectsGfx.lineStyle(16, 0xff0000, 0.15);
        this.effectsGfx.beginPath();
        this.effectsGfx.moveTo(this.bunkerX - 60, this.bunkerY);
        this.effectsGfx.lineTo(0, ly);
        this.effectsGfx.strokePath();
      } else {
        // Warning line (pulsing thin red)
        const warningAlpha = Math.sin(Date.now() * 0.015) * 0.3 + 0.3;
        this.effectsGfx.lineStyle(2, 0xff4444, warningAlpha);
        this.effectsGfx.beginPath();
        this.effectsGfx.moveTo(this.bunkerX - 60, this.bunkerY);
        this.effectsGfx.lineTo(0, ly);
        this.effectsGfx.strokePath();
      }
    }

    // Dodge cooldown indicator
    if (this.dodgeCooldown > 0) {
      const pct = this.dodgeCooldown / 1.5;
      this.effectsGfx.fillStyle(0x666666, 0.3);
      this.effectsGfx.fillRect(this.playerX - 12, this.playerY + 20, 24, 3);
      this.effectsGfx.fillStyle(0x00e5ff, 0.6);
      this.effectsGfx.fillRect(this.playerX - 12, this.playerY + 20, 24 * (1 - pct), 3);
    }

    // Damage cracks on bunker
    if (this.bunkerHP < this.BUNKER_HP * 0.5) {
      this.effectsGfx.lineStyle(2, 0x111111, 0.8);
      const bx = this.bunkerX, by = this.bunkerY;
      this.effectsGfx.beginPath();
      this.effectsGfx.moveTo(bx - 30, by - 30);
      this.effectsGfx.lineTo(bx - 10, by - 5);
      this.effectsGfx.lineTo(bx - 25, by + 15);
      this.effectsGfx.strokePath();
    }
    if (this.bunkerHP < this.BUNKER_HP * 0.25) {
      this.effectsGfx.lineStyle(2, 0x111111, 0.8);
      const bx = this.bunkerX, by = this.bunkerY;
      this.effectsGfx.beginPath();
      this.effectsGfx.moveTo(bx + 30, by - 25);
      this.effectsGfx.lineTo(bx + 10, by + 5);
      this.effectsGfx.lineTo(bx + 25, by + 30);
      this.effectsGfx.strokePath();
      // Additional crack
      this.effectsGfx.beginPath();
      this.effectsGfx.moveTo(bx - 15, by + 20);
      this.effectsGfx.lineTo(bx + 5, by + 35);
      this.effectsGfx.strokePath();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // PLAYER DEATH
  // ═════════════════════════════════════════════════════════════

  _playerDeath() {
    this.phase = 'dead';
    MusicManager.get().stop(1);
    SoundManager.get().playGameOver();

    this.cameras.main.flash(300, 255, 100, 0);
    this.cameras.main.shake(500, 0.03);
    this.playerSprite.setVisible(false);

    this.time.delayedCall(800, () => {
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(40);

      this.add.text(W / 2, 120, 'MISSION FAILED', {
        fontFamily: 'monospace', fontSize: '36px', color: '#ff2222',
        shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 16, fill: true },
      }).setOrigin(0.5).setDepth(41);

      this.add.text(W / 2, 165, 'THE BUNKER SURVIVES', {
        fontFamily: 'monospace', fontSize: '14px', color: '#888888',
      }).setOrigin(0.5).setDepth(41);

      const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
      const distCovered = Math.min(Math.round(this.distance), TOTAL_DISTANCE);
      const lines = [
        `DISTANCE COVERED: ${distCovered}m`,
        `SHOTS FIRED: ${this.shotsFired}`,
        `ACCURACY: ${accuracy}%`,
        `DAMAGE TAKEN: ${this.damageTaken}`,
        `BUNKER HP REMAINING: ${Math.round((this.bunkerHP / this.BUNKER_HP) * 100)}%`,
      ];

      let yPos = 210;
      lines.forEach((line, i) => {
        const t = this.add.text(W / 2, yPos, line, {
          fontFamily: 'monospace', fontSize: '13px', color: '#ff6666',
        }).setOrigin(0.5).setDepth(41).setAlpha(0);
        this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: 400 + i * 200 });
        yPos += 24;
      });

      this.time.delayedCall(2000, () => {
        const retry = this.add.text(W / 2, yPos + 24, 'PRESS R TO RETRY', {
          fontFamily: 'monospace', fontSize: '16px', color: '#ff8800',
        }).setOrigin(0.5).setDepth(41);
        this.tweens.add({ targets: retry, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

        this.add.text(W / 2, yPos + 50, 'ENTER TO RETURN TO MENU', {
          fontFamily: 'monospace', fontSize: '12px', color: '#666666',
        }).setOrigin(0.5).setDepth(41);
      });
    });
  }

  // ═════════════════════════════════════════════════════════════
  // DISINTEGRATION — THE SPECTACULAR PIXEL DEATH
  // ═════════════════════════════════════════════════════════════

  _startDisintegration() {
    this.phase = 'disintegrating';
    this.disintTimer = 0;
    MusicManager.get().playDisintegrationMusic();
    SoundManager.get().playMegaExplosion();

    // Stop all attacks
    this._cleanupFight();

    // Freeze frame + flash
    this.cameras.main.flash(500, 255, 255, 255);

    // Create offscreen canvas for batched particle rendering
    this.disintCanvas = document.createElement('canvas');
    this.disintCanvas.width = W;
    this.disintCanvas.height = H;
    this.disintCtx = this.disintCanvas.getContext('2d');
    this.disintTexKey = 'disint_particles_' + Date.now();
    this.textures.addCanvas(this.disintTexKey, this.disintCanvas);
    this.disintImage = this.add.image(W / 2, H / 2, this.disintTexKey).setDepth(15);

    // Extract pixels from bunker texture after 0.5s freeze
    this.time.delayedCall(500, () => {
      this._extractBunkerPixels();
      this.bunkerSprite.setVisible(false);
      SoundManager.get().playDisintegrate();
    });
  }

  _extractBunkerPixels() {
    const texKey = 'bunker_fortress';
    const source = this.textures.get(texKey).getSourceImage();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = source.width;
    tempCanvas.height = source.height;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(source, 0, 0);

    const imgData = ctx.getImageData(0, 0, source.width, source.height);
    const data = imgData.data;
    const step = 4; // sample every 4th pixel
    const cx = source.width / 2;
    const cy = source.height / 2;

    for (let py = 0; py < source.height; py += step) {
      for (let px = 0; px < source.width; px += step) {
        const idx = (py * source.width + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (a < 10) continue;

        // Map pixel position to world position (bunker at full scale)
        const worldX = this.bunkerX + (px - cx);
        const worldY = this.bunkerY + (py - cy);
        const distFromCenter = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));

        // Core pixels — red warning lights / gun port glows
        const isCore = distFromCenter < 30 && r > 150 && r > g * 2;

        this.disintPixels.push({
          x: worldX,
          y: worldY,
          origX: worldX,
          origY: worldY,
          color: (r << 16) | (g << 8) | b,
          vx: 0,
          vy: 0,
          alpha: 1,
          size: 4,
          distFromCenter: distFromCenter,
          isCore: isCore,
          detachTime: isCore ? 1.5 + Math.random() * 0.5 : (distFromCenter / (cx * 1.5)) * 1.5,
          detached: false,
        });
      }
    }
  }

  _updateDisintegration(dt) {
    this.disintTimer += dt;

    // 0-0.5s: freeze frame (handled by delayedCall)
    if (this.disintTimer < 0.5) return;

    const elapsed = this.disintTimer - 0.5;

    // Clear offscreen canvas and write pixels via ImageData
    const ctx = this.disintCtx;
    ctx.clearRect(0, 0, W, H);
    const imgData = ctx.createImageData(W, H);
    const buf = imgData.data;

    let aliveCount = 0;

    for (const p of this.disintPixels) {
      if (!p.detached && elapsed >= p.detachTime) {
        p.detached = true;
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 150 + (p.distFromCenter * 0.3);
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
      }

      if (!p.detached) {
        const jitterX = (Math.random() - 0.5) * 4;
        const jitterY = (Math.random() - 0.5) * 4;
        p.x = p.origX + jitterX;
        p.y = p.origY + jitterY;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 30 * dt;

        const timeSinceDetach = elapsed - p.detachTime;
        p.alpha = Math.max(0, 1 - timeSinceDetach / 2.5);
        p.size = Math.max(1, 4 - timeSinceDetach * 1.2);
      }

      if (p.alpha > 0.01) {
        aliveCount++;
        const r = (p.color >> 16) & 0xff;
        const g = (p.color >> 8) & 0xff;
        const b = p.color & 0xff;
        const a = Math.round(p.alpha * 255);
        const sz = Math.round(p.size);
        const startX = Math.round(p.x - sz / 2);
        const startY = Math.round(p.y - sz / 2);

        for (let dy = 0; dy < sz; dy++) {
          const py = startY + dy;
          if (py < 0 || py >= H) continue;
          for (let dx = 0; dx < sz; dx++) {
            const px = startX + dx;
            if (px < 0 || px >= W) continue;
            const idx = (py * W + px) * 4;
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = a;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this.textures.get(this.disintTexKey).refresh();

    // Screen shake (decreasing)
    if (elapsed < 3.5) {
      const intensity = 0.02 * (1 - elapsed / 3.5);
      this.cameras.main.shake(50, intensity);
    }

    // All particles faded → victory
    if (elapsed >= 4 || aliveCount === 0) {
      this.phase = 'victory_pending';
      this.disintPixels = [];
      if (this.disintImage) this.disintImage.destroy();
      this.disintImage = null;

      this.time.delayedCall(500, () => {
        this._showVictory();
      });
    }
  }

  // ═════════════════════════════════════════════════════════════
  // VICTORY / CREDITS
  // ═════════════════════════════════════════════════════════════

  _showVictory() {
    this.phase = 'victory';
    MusicManager.get().playVictoryMusic();
    SoundManager.get().playFinalVictory();

    // Dark overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.92).setDepth(40);

    // VICTORY title
    const title = this.add.text(W / 2, 50, 'VICTORY', {
      fontFamily: 'monospace', fontSize: '40px', color: '#FFD700',
      shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 20, fill: true },
    }).setOrigin(0.5).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 800 });
    this.tweens.add({
      targets: title, scaleX: 1.05, scaleY: 1.05,
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Subtitle
    const sub = this.add.text(W / 2, 95, 'THE BUNKER HAS BEEN DESTROYED', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 400 });

    // Separator
    const sep = this.add.rectangle(W / 2, 115, 300, 2, 0x00e5ff, 0.5).setDepth(41).setAlpha(0);
    this.tweens.add({ targets: sep, alpha: 1, duration: 300, delay: 600 });

    // Stats
    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    const distCovered = Math.min(Math.round(this.distance), TOTAL_DISTANCE);

    // Star rating
    let stars, starCount;
    if (this.playerHP >= 4 && accuracy >= 35) { stars = '\u2605\u2605\u2605'; starCount = 3; }
    else if (this.playerHP >= 2) { stars = '\u2605\u2605\u2606'; starCount = 2; }
    else { stars = '\u2605\u2606\u2606'; starCount = 1; }

    // Save star rating
    try { localStorage.setItem('superzion_stars_6', String(starCount)); } catch (e) {}

    const statLines = [
      `DISTANCE COVERED: ${distCovered}m`,
      `SHOTS FIRED: ${this.shotsFired}`,
      `ACCURACY: ${accuracy}%`,
      `DAMAGE TAKEN: ${this.damageTaken}`,
      `RATING: ${stars}`,
    ];

    let yPos = 138;
    statLines.forEach((line, i) => {
      const t = this.add.text(W / 2, yPos, line, {
        fontFamily: 'monospace', fontSize: '13px', color: '#00e5ff',
      }).setOrigin(0.5).setDepth(41).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 300, delay: 800 + i * 250 });
      yPos += 24;
    });

    // Second separator
    this.time.delayedCall(2500, () => {
      this.add.rectangle(W / 2, yPos + 5, 300, 2, 0x00e5ff, 0.5).setDepth(41);
    });

    // PRESS ENTER
    this.time.delayedCall(3000, () => {
      const cont = this.add.text(W / 2, H - 30, 'PRESS ENTER TO CONTINUE', {
        fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(41);
      this.tweens.add({ targets: cont, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    });
  }

  // ═════════════════════════════════════════════════════════════
  // CLEANUP & PAUSE
  // ═════════════════════════════════════════════════════════════

  _cleanupFight() {
    for (const b of this.playerBullets) {
      if (b.sprite && b.sprite.active) b.sprite.destroy();
    }
    this.playerBullets = [];

    for (const b of this.bossBullets) {
      if (b.sprite && b.sprite.active) b.sprite.destroy();
    }
    this.bossBullets = [];

    this.samMissiles = [];
    this.homingMissiles = [];
    this.flakBursts = [];
    this.smokeParticles = [];
    this.effectsGfx.clear();
  }

  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(60);
      this.pauseObjects.push(overlay);
      const title = this.add.text(W / 2, H / 2 - 30, 'PAUSED', {
        fontFamily: 'monospace', fontSize: '36px', color: '#ffffff',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(title);
      const hint = this.add.text(W / 2, H / 2 + 15, 'Press ESC to resume', {
        fontFamily: 'monospace', fontSize: '14px', color: '#888888',
      }).setOrigin(0.5).setDepth(61);
      this.pauseObjects.push(hint);
    } else {
      for (const obj of this.pauseObjects) obj.destroy();
      this.pauseObjects = [];
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this._cleanupFight();
    this.disintPixels = [];
    if (this.disintImage) { this.disintImage.destroy(); this.disintImage = null; }
    if (this.disintTexKey && this.textures.exists(this.disintTexKey)) {
      this.textures.remove(this.disintTexKey);
    }
  }
}
