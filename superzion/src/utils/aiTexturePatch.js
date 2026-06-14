// ===================================================================
// AI texture patch — makes procedural generators yield to AI PNGs.
// ===================================================================
// All texture generators register art via `scene.textures.addCanvas(key, …)`.
// We preload hand-made (Nano Banana) PNGs under the SAME keys in BootScene.
//
//  • addCanvas is patched to be a no-op when a key already exists (returns
//    the existing PNG texture instead of warning + returning null).
//  • remove is patched to refuse to delete an AI-override key — several
//    generators do `if (exists(key)) remove(key)` then redraw; without this
//    they would wipe the PNG and replace it with procedural art.
//
// So any key with an AI PNG keeps the PNG; everything else draws procedurally.
// Import this ONCE, before the game boots (see main.js). Safe because no
// generator in this project uses addCanvas's return value.

import Phaser from 'phaser';
import { AI_SPRITES } from './AISprites.js';

const OVERRIDE = new Set(AI_SPRITES);
const proto = Phaser.Textures.TextureManager.prototype;

if (!proto.__aiPatched) {
  const originalAddCanvas = proto.addCanvas;
  proto.addCanvas = function (key, source, skipCache) {
    if (typeof key === 'string' && this.exists(key)) {
      return this.get(key); // AI PNG (or already-made) texture wins
    }
    return originalAddCanvas.call(this, key, source, skipCache);
  };

  const originalRemove = proto.remove;
  proto.remove = function (key) {
    const k = typeof key === 'string' ? key : key && key.key;
    if (k && OVERRIDE.has(k)) return this; // protect AI textures from deletion
    return originalRemove.call(this, key);
  };

  proto.__aiPatched = true;
}
