import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }
  preload() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x3b82f6, 1); g.fillRect(0, 0, 32, 32); g.generateTexture('player', 32, 32); g.clear();
    g.fillStyle(0xef4444, 1); g.fillRect(0, 0, 32, 32); g.generateTexture('enemy', 32, 32); g.clear();
    g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8); g.generateTexture('bubble', 16, 16); g.clear();
    g.fillStyle(0x6b7280, 1); g.fillRect(0, 0, 64, 16); g.generateTexture('block', 64, 16); g.clear();
  }
  create() { this.scene.start('LevelSelect'); }
}
