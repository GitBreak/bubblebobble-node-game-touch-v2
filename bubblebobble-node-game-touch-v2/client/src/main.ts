import 'phaser';
import BootScene from './scenes/BootScene';
import LevelSelect from './scenes/LevelSelect';
import GameScene from './scenes/GameScene';

(window as any).__BUILD_VERSION__ = (window as any).__BUILD_VERSION__ || 'dev';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false }
  },
  scene: [BootScene, LevelSelect, GameScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
