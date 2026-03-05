// ═══════════════════════════════════════════════════════════════
// DifficultyManager — Hard mode toggle, difficulty multipliers
// Unlocked after completing the game (localStorage flag)
// ═══════════════════════════════════════════════════════════════

let instance = null;

export default class DifficultyManager {
  constructor() {
    this.hardMode = false;
    this._loadState();
  }

  static get() {
    if (!instance) instance = new DifficultyManager();
    return instance;
  }

  _loadState() {
    try {
      this.hardMode = localStorage.getItem('superzion_hardmode') === 'true';
    } catch (e) { this.hardMode = false; }
  }

  isHard() { return this.hardMode; }

  isUnlocked() {
    try { return !!localStorage.getItem('superzion_completed'); }
    catch (e) { return false; }
  }

  toggle() {
    if (!this.isUnlocked()) return false;
    this.hardMode = !this.hardMode;
    try { localStorage.setItem('superzion_hardmode', String(this.hardMode)); } catch (e) {}
    return this.hardMode;
  }

  // ── Difficulty multipliers ──

  /** Player HP multiplier (lower in hard mode) */
  playerHPMult() { return this.hardMode ? 0.6 : 1.0; }

  /** Enemy speed multiplier */
  enemySpeedMult() { return this.hardMode ? 1.3 : 1.0; }

  /** Enemy spawn rate multiplier (lower = faster spawns) */
  spawnRateMult() { return this.hardMode ? 0.7 : 1.0; }

  /** Detection rate multiplier (higher = detected faster) */
  detectionMult() { return this.hardMode ? 1.5 : 1.0; }

  /** Timer multiplier (less time in hard mode) */
  timerMult() { return this.hardMode ? 0.8 : 1.0; }

  /** Boss HP multiplier */
  bossHPMult() { return this.hardMode ? 1.4 : 1.0; }

  /** Missile speed multiplier */
  missileSpeedMult() { return this.hardMode ? 1.35 : 1.0; }
}
