// ===================================================================
// PlatformerScene — Level 1 side-scrolling platformer phase
// (Tehran rooftop run at night)
//
// Temporary stub — full implementation in Plan 02
// ===================================================================

import Phaser from 'phaser';

export default class PlatformerScene extends Phaser.Scene {
  constructor() { super('PlatformerScene'); }
  create() { this.scene.start('GameScene'); }
}
