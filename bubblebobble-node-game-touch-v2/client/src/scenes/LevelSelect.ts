import Phaser from 'phaser';

export default class LevelSelect extends Phaser.Scene {
  constructor() { super({ key: 'LevelSelect' }); }
  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0,0,width*2,height*2,0x0b1020).setOrigin(0);
    this.add.text(width/2, 120, 'BubbleBobble 2025', { fontFamily: 'system-ui, sans-serif', fontSize: '32px', color: '#fff' }).setOrigin(0.5);
    this.add.text(width/2, 170, 'Level Select', { fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: '#9af' }).setOrigin(0.5);

    const levels = [
      { id: 1, name: 'Intro Platforms' },
      { id: 2, name: 'Gaps & Traps' },
      { id: 3, name: 'Stairs Run' },
    ];

    levels.forEach((lvl, idx) => {
      const y = 240 + idx*60;
      const btn = this.add.text(width/2, y, `Level ${lvl.id} — ${lvl.name}`, 
        { fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#fff', backgroundColor: '#253', padding: { x: 12, y: 8 } }
      ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.scene.start('GameScene', { level: lvl.id }));
    });

    // Navbar link (from DOM) triggers this scene
    const domBtn = document.getElementById('btn-levels');
    if (domBtn) {
      domBtn.addEventListener('click', (e) => { e.preventDefault(); this.scene.start('LevelSelect'); });
    }
  }
}
