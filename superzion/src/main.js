import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GameIntroScene from './scenes/GameIntroScene.js';
import MenuScene from './scenes/MenuScene.js';
import IntroCinematicScene from './scenes/IntroCinematicScene.js';
import GameScene from './scenes/GameScene.js';
import ExplosionCinematicScene from './scenes/ExplosionCinematicScene.js';
import BeirutIntroCinematicScene from './scenes/BeirutIntroCinematicScene.js';
import BeirutRadarScene from './scenes/BeirutRadarScene.js';
import DeepStrikeIntroCinematicScene from './scenes/DeepStrikeIntroCinematicScene.js';
import BomberScene from './scenes/BomberScene.js';
import UndergroundIntroCinematicScene from './scenes/UndergroundIntroCinematicScene.js';
import DroneScene from './scenes/DroneScene.js';
import MountainBreakerIntroCinematicScene from './scenes/MountainBreakerIntroCinematicScene.js';
import B2BomberScene from './scenes/B2BomberScene.js';
import LastStandCinematicScene from './scenes/LastStandCinematicScene.js';
import BossScene from './scenes/BossScene.js';
import CreditsScene from './scenes/CreditsScene.js';

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: document.body,
  backgroundColor: '#0a0a0a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 900 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameIntroScene, MenuScene, IntroCinematicScene, GameScene, ExplosionCinematicScene, BeirutIntroCinematicScene, BeirutRadarScene, DeepStrikeIntroCinematicScene, BomberScene, UndergroundIntroCinematicScene, DroneScene, MountainBreakerIntroCinematicScene, B2BomberScene, LastStandCinematicScene, BossScene, CreditsScene],
  pixelArt: false,
  antialias: true,
};

new Phaser.Game(config);
