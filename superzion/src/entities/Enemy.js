// ═══════════════════════════════════════════════════════════════
// Operation Tehran — Enemy classes
// BaseEnemy + Drone, Guard, Turret with AI
// ═══════════════════════════════════════════════════════════════

import Phaser from 'phaser';

// ── BASE ENEMY ──────────────────────────────────────────────────
class BaseEnemy {
  constructor(scene, x, y, textureKey, hp) {
    this.scene = scene;
    this.hp = hp;
    this.maxHp = hp;
    this.alive = true;
    this.hitFlashTimer = 0;
    this.dying = false;

    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setDepth(8);
    this.sprite.enemyRef = this; // back-reference for collisions
  }

  takeDamage(amount = 1) {
    if (!this.alive || this.dying) return;
    this.hp -= amount;
    this.hitFlashTimer = 200;

    if (this.hp <= 0) {
      this.die();
    } else {
      // White flash for 100ms
      this.sprite.setTintFill(0xffffff);
      this.scene.time.delayedCall(100, () => {
        if (this.alive && this.sprite && this.sprite.active) {
          this.sprite.clearTint();
          this._showIdleTexture();
        }
      });
    }
  }

  die() {
    this.alive = false;
    this.dying = true;
    this.sprite.body.enable = false;

    // Blink 3 times then disappear
    let blinks = 0;
    const blinkEvent = this.scene.time.addEvent({
      delay: 150,
      callback: () => {
        if (!this.sprite || !this.sprite.active) {
          blinkEvent.remove();
          return;
        }
        blinks++;
        this.sprite.setVisible(!this.sprite.visible);
        if (blinks >= 6) { // 3 full on/off cycles
          blinkEvent.remove();
          // Spawn particles then destroy
          this._spawnDeathParticles();
          this.sprite.destroy();
        }
      },
      loop: true,
    });
  }

  _spawnDeathParticles() {
    const colors = [0xff6600, 0xffaa00, 0xffcc44, 0x888888];
    for (let i = 0; i < 8; i++) {
      const p = this.scene.add.circle(
        this.sprite.x + (Math.random() - 0.5) * 20,
        this.sprite.y + (Math.random() - 0.5) * 20,
        2,
        colors[Math.floor(Math.random() * colors.length)]
      );
      p.setDepth(9);
      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 40,
        y: p.y - 10 - Math.random() * 30,
        alpha: 0,
        scale: 0.2,
        duration: 400 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  _showHitTexture() {}
  _showIdleTexture() {}
  _showDeathTexture() {}

  update(delta, playerX, playerY) {}
}

// ── DRONE ───────────────────────────────────────────────────────
// Flies 200-300px above ground, patrols horizontally,
// shoots diagonally toward player every 3s
export class Drone extends BaseEnemy {
  constructor(scene, x, y, patrolRange = 80) {
    super(scene, x, y, 'drone_fly_0', 2);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setSize(40, 20);
    this.sprite.body.setOffset(12, 22);

    this.originX = x;
    this.patrolRange = patrolRange;
    this.speed = 60;
    this.direction = 1;
    this.shootTimer = 3000;
    this.shootCooldown = 3000;
    this.animTimer = 0;
    this.animFrame = 0;
  }

  _showHitTexture() { this.sprite.setTexture('drone_hit'); }
  _showIdleTexture() { this.sprite.setTexture(`drone_fly_${this.animFrame}`); }
  _showDeathTexture() { this.sprite.setTexture('drone_death'); }

  update(delta, playerX, playerY, projectiles) {
    if (!this.alive) return;

    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - delta);

    // Patrol movement
    this.sprite.x += this.speed * this.direction * (delta / 1000);
    if (this.sprite.x > this.originX + this.patrolRange) this.direction = -1;
    if (this.sprite.x < this.originX - this.patrolRange) this.direction = 1;
    this.sprite.setFlipX(this.direction < 0);

    // Animate rotors
    this.animTimer += delta;
    if (this.animTimer > 150) {
      this.animTimer = 0;
      this.animFrame = 1 - this.animFrame;
      if (this.hitFlashTimer <= 0) {
        this.sprite.setTexture(`drone_fly_${this.animFrame}`);
      }
    }

    // Shoot toward player diagonally
    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
      this.shootTimer = this.shootCooldown;
      this._shoot(projectiles, playerX, playerY);
    }
  }

  _shoot(projectiles, playerX, playerY) {
    if (!projectiles) return;
    const bullet = projectiles.get(this.sprite.x, this.sprite.y + 15, 'enemy_bullet');
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.setAllowGravity(false);
      bullet.body.setSize(12, 6);

      // Aim diagonally toward player
      const angle = Math.atan2(
        playerY - this.sprite.y,
        playerX - this.sprite.x
      );
      const speed = 220;
      bullet.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      this.scene.time.delayedCall(2500, () => {
        if (bullet.active) {
          bullet.setActive(false);
          bullet.setVisible(false);
          bullet.body.stop();
        }
      });
    }
  }
}

// ── GUARD ───────────────────────────────────────────────────────
// Walks ±100px from origin (200px total patrol).
// Detects player at <400px horizontal → stops, faces, shoots every 2s.
export class Guard extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'guard_idle', 3);
    this.sprite.setGravityY(900);
    this.sprite.body.setSize(20, 44);
    this.sprite.body.setOffset(22, 14);

    this.originX = x;
    this.patrolRange = 100; // ±100px = 200px total
    this.patrolSpeed = 40;
    this.direction = 1;

    this.shootTimer = 0;
    this.shootCooldown = 2000; // every 2 seconds
    this.detectRange = 400;
    this.detecting = false;
    this.walkFrame = 0;
    this.walkAnimTimer = 0;
    this.isShooting = false;
  }

  _showHitTexture() { this.sprite.setTexture('guard_hit'); }
  _showIdleTexture() {
    this.sprite.setTexture(this.detecting && this.isShooting ? 'guard_shoot' : 'guard_idle');
  }
  _showDeathTexture() { this.sprite.setTexture('guard_death'); }

  update(delta, playerX, playerY, projectiles) {
    if (!this.alive) return;

    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - delta);

    const dx = playerX - this.sprite.x;
    const dist = Math.abs(dx);

    if (dist < this.detectRange) {
      // Detect player — stop and shoot
      this.detecting = true;
      this.sprite.body.setVelocityX(0);
      this.sprite.setFlipX(dx < 0);

      this.shootTimer -= delta;
      if (this.shootTimer <= 0) {
        this.shootTimer = this.shootCooldown;
        this.isShooting = true;
        if (this.hitFlashTimer <= 0) {
          this.sprite.setTexture('guard_shoot');
        }
        this._shoot(projectiles, dx > 0 ? 1 : -1);

        this.scene.time.delayedCall(300, () => {
          this.isShooting = false;
          if (this.alive && this.hitFlashTimer <= 0) {
            this.sprite.setTexture('guard_idle');
          }
        });
      }
    } else {
      // Patrol within ±100px of origin
      this.detecting = false;
      this.isShooting = false;
      this.shootTimer = 0;

      // Reverse at patrol bounds
      if (this.sprite.x > this.originX + this.patrolRange) {
        this.direction = -1;
      } else if (this.sprite.x < this.originX - this.patrolRange) {
        this.direction = 1;
      }

      this.sprite.body.setVelocityX(this.patrolSpeed * this.direction);
      this.sprite.setFlipX(this.direction < 0);

      // Walk animation
      this.walkAnimTimer += delta;
      if (this.walkAnimTimer > 200) {
        this.walkAnimTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 4;
        if (this.hitFlashTimer <= 0) {
          this.sprite.setTexture(`guard_walk_${this.walkFrame}`);
        }
      }
    }
  }

  _shoot(projectiles, dir) {
    if (!projectiles) return;
    const bullet = projectiles.get(
      this.sprite.x + dir * 25,
      this.sprite.y - 2,
      'enemy_bullet'
    );
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.setAllowGravity(false);
      bullet.setVelocity(dir * 350, 0);
      bullet.setFlipX(dir < 0);
      bullet.body.setSize(12, 6);
      this.scene.time.delayedCall(2000, () => {
        if (bullet.active) {
          bullet.setActive(false);
          bullet.setVisible(false);
          bullet.body.stop();
        }
      });
    }
  }
}

// ── TURRET ──────────────────────────────────────────────────────
export class Turret extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'turret_idle', 4);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    this.sprite.body.setSize(24, 30);
    this.sprite.body.setOffset(20, 26);

    this.detecting = false;
    this.shootTimer = 0;
    this.shootCooldown = 2500;
    this.burstCount = 0;
    this.burstTimer = 0;
    this.burstMax = 3;
    this.burstInterval = 200;
    this.isBursting = false;
    this.targetDir = 1;
  }

  _showHitTexture() { this.sprite.setTexture('turret_hit'); }
  _showIdleTexture() {
    this.sprite.setTexture(this.detecting ? 'turret_alert' : 'turret_idle');
  }
  _showDeathTexture() { this.sprite.setTexture('turret_death'); }

  update(delta, playerX, playerY, projectiles) {
    if (!this.alive) return;

    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - delta);

    const dx = playerX - this.sprite.x;
    const dist = Math.abs(dx);

    if (dist < 350) {
      this.detecting = true;
      this.targetDir = dx > 0 ? 1 : -1;
      this.sprite.setFlipX(dx < 0);

      if (this.hitFlashTimer <= 0 && !this.isBursting) {
        this.sprite.setTexture('turret_alert');
      }

      if (this.isBursting) {
        this.burstTimer -= delta;
        if (this.burstTimer <= 0 && this.burstCount < this.burstMax) {
          this.burstTimer = this.burstInterval;
          this.burstCount++;
          this._shoot(projectiles, this.targetDir, playerX, playerY);

          if (this.hitFlashTimer <= 0) {
            this.sprite.setTexture('turret_shoot');
            this.scene.time.delayedCall(100, () => {
              if (this.alive && this.hitFlashTimer <= 0) {
                this.sprite.setTexture('turret_alert');
              }
            });
          }

          if (this.burstCount >= this.burstMax) {
            this.isBursting = false;
            this.shootTimer = this.shootCooldown;
          }
        }
      } else {
        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
          this.isBursting = true;
          this.burstCount = 0;
          this.burstTimer = 0;
        }
      }
    } else {
      this.detecting = false;
      this.isBursting = false;
      this.shootTimer = Math.max(0, this.shootTimer - delta);
      if (this.hitFlashTimer <= 0) {
        this.sprite.setTexture('turret_idle');
      }
    }
  }

  _shoot(projectiles, dir, playerX, playerY) {
    if (!projectiles) return;
    const bullet = projectiles.get(
      this.sprite.x + dir * 20,
      this.sprite.y - 4,
      'enemy_bullet'
    );
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.setAllowGravity(false);

      const angle = Math.atan2(
        playerY - this.sprite.y,
        playerX - this.sprite.x
      );
      const speed = 300;
      bullet.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      bullet.body.setSize(12, 6);
      this.scene.time.delayedCall(2500, () => {
        if (bullet.active) {
          bullet.setActive(false);
          bullet.setVisible(false);
          bullet.body.stop();
        }
      });
    }
  }
}
