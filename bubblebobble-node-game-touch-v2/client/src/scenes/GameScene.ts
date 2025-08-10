import Phaser from 'phaser';

type EnemyState = 'patrol' | 'trapped';

type LevelDef = { platforms: {x:number,y:number,w?:number,h?:number}[], enemySpawns: {x:number,y:number}[], player: {x:number,y:number} };

const LEVELS: Record<number, LevelDef> = {
  1: {
    platforms: [
      { x:400, y:580, w:12.5, h:2 },
      { x:150, y:420 }, { x:650, y:360 }, { x:400, y:280 }
    ],
    enemySpawns: [ {x:600,y:500}, {x:450,y:250} ],
    player: { x:100, y:520 }
  },
  2: {
    platforms: [
      { x:400, y:580, w:12.5, h:2 },
      { x:120, y:420 }, { x:280, y:380 }, { x:440, y:340 }, { x:600, y:300 }, { x:760, y:260 }
    ],
    enemySpawns: [ {x:700,y:250}, {x:500,y:330}, {x:300,y:410} ],
    player: { x:80, y:520 }
  },
  3: {
    platforms: [
      { x:400, y:580, w:12.5, h:2 },
      { x:120, y:500 }, { x:240, y:440 }, { x:360, y:380 }, { x:480, y:320 }, { x:600, y:260 }, { x:720, y:200 }
    ],
    enemySpawns: [ {x:700,y:180}, {x:500,y:300}, {x:260,y:460} ],
    player: { x:100, y:540 }
  }
};

export default class GameScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  bubbles!: Phaser.Physics.Arcade.Group;
  enemies!: Phaser.Physics.Arcade.Group;
  floor!: Phaser.Physics.Arcade.StaticGroup;
  score: number = 0;
  scoreEl?: HTMLElement;
  comboEl?: HTMLElement;
  comboMultiplier: number = 1;
  lastPopTime: number = 0;

  touchLeft = false;
  touchRight = false;
  touchJump = false;
  touchShootQueued = false;

  levelId: number = 1;

  constructor() { super({ key: 'GameScene' }); }

  create(data: { level?: number }) {
    this.levelId = data?.level ?? 1;
    const worldW = 800, worldH = 600;
    this.add.rectangle(worldW/2, worldH/2, worldW, worldH, 0x0b1020);

    this.scoreEl = document.getElementById('score') || undefined;
    this.comboEl = document.getElementById('combo') || undefined;
    this.updateScore(0);
    this.updateCombo(1);

    // Platforms per level
    this.floor = this.physics.add.staticGroup();
    const def = LEVELS[this.levelId] || LEVELS[1];
    def.platforms.forEach(p => {
      const block = this.floor.create(p.x, p.y, 'block');
      if (p.w || p.h) block.setScale(p.w || 1, p.h || 1).refreshBody();
    });

    // Player
    this.player = this.physics.add.sprite(def.player.x, def.player.y, 'player').setCollideWorldBounds(true);
    this.player.body.setSize(24, 28).setOffset(4, 2);
    this.physics.add.collider(this.player, this.floor);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.bubbles = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, runChildUpdate: true });

    // Enemies
    this.enemies = this.physics.add.group();
    def.enemySpawns.forEach((s, i) => {
      const e = this.physics.add.sprite(s.x, s.y, 'enemy') as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      e.setData('state', 'patrol' as EnemyState);
      e.setData('dir', i % 2 === 0 ? -1 : 1);
      e.setBounce(0.1);
      e.setCollideWorldBounds(true);
      this.enemies.add(e as Phaser.GameObjects.GameObject);
    });
    this.physics.add.collider(this.enemies, this.floor);

    // Bubble hits enemy -> trap
    this.physics.add.overlap(this.bubbles, this.enemies, (bubbleAny, enemyAny) => {
      const bubble = bubbleAny as Phaser.Physics.Arcade.Image;
      const enemy = enemyAny as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      bubble.destroy();

      if (enemy.getData('state') !== 'trapped') {
        enemy.setData('state', 'trapped');
        enemy.setTint(0x22c55e);
        enemy.body.setVelocity(0, -50);
        (enemy.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        this.playTone(880, 0.05); // hit/trap blip
        this.time.delayedCall(2500, () => {
          if (enemy.active && enemy.getData('state') === 'trapped') {
            enemy.setData('state', 'patrol');
            enemy.clearTint();
            (enemy.body as Phaser.Physics.Arcade.Body).allowGravity = true;
          }
        });
      }
    });

    // Player pops trapped enemies on touch
    this.physics.add.overlap(this.player, this.enemies, (_p, eAny) => {
      const e = eAny as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      if (e.getData('state') === 'trapped') {
        this.handlePop(e.x, e.y);
        e.disableBody(true, true);
      }
    });

    // Touch controls
    this.setupTouchControls();
  }

  update() {
    const onFloor = (this.player.body as any).onFloor?.() || (this.player.body as any).blocked?.down;
    if (this.cursors.left?.isDown || this.touchLeft) this.player.setVelocityX(-220);
    else if (this.cursors.right?.isDown || this.touchRight) this.player.setVelocityX(220);
    else this.player.setVelocityX(0);

    if ((this.cursors.up?.isDown || this.touchJump) and onFloor) this.player.setVelocityY(-420);

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) || this.consumeTouchShoot()) {
      const facing = this.player.body.velocity.x >= 0 ? 1 : -1;
      const b = this.bubbles.get(this.player.x, this.player.y - 10, 'bubble') as Phaser.Physics.Arcade.Image;
      if (b) {
        b.setActive(true).setVisible(true);
        (b.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        b.setVelocity(200 * facing, -120);
        this.tweens.add({ targets: b, y: b.y - 140, duration: 1800, onComplete: () => b.destroy() });
        this.playTone(660, 0.04); // shoot blip
      }
    }

    // enemy patrol
    this.enemies.children.iterate((child: any) => {
      if (!child || !child.body) return;
      const state: EnemyState = child.getData('state') || 'patrol';
      if (state === 'patrol') {
        const dir = child.getData('dir') || 1;
        child.setVelocityX(80 * dir);
        if (child.x < 50) child.setData('dir', 1);
        if (child.x > 750) child.setData('dir', -1);
      } else if (state === 'trapped') {
        child.setVelocityX(0);
      }
    });
  }

  handlePop(x: number, y: number) {
    const now = this.time.now;
    if (now - this.lastPopTime < 1200) {
      this.comboMultiplier = Math.min(this.comboMultiplier + 1, 9);
      this.comboChime(this.comboMultiplier);
    } else {
      this.comboMultiplier = 1;
    }
    this.lastPopTime = now;
    this.updateCombo(this.comboMultiplier);

    const gained = 100 * this.comboMultiplier;
    this.updateScore(gained);
    this.floatingText(`+${gained}`, x, y);

    const part = this.add.particles(0xffffff);
    part.createEmitter({
      x, y, speed: { min: -120, max: 120 }, lifespan: 400, quantity: 20, scale: { start: 0.6, end: 0 }, on: false
    }).explode(20, x, y);

    this.playTone(520 + this.comboMultiplier*40, 0.08);
  }

  floatingText(text: string, x: number, y: number) {
    const t = this.add.text(x, y, text, { fontFamily: 'system-ui,sans-serif', fontSize: '16px', color: '#fff' }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  updateScore(delta: number) {
    this.score += delta;
    if (this.scoreEl) this.scoreEl.textContent = `Score: ${this.score}`;
  }
  updateCombo(mult: number) {
    if (this.comboEl) this.comboEl.textContent = `Combo x${mult}`;
  }

  setupTouchControls() {
    const bindHold = (el: HTMLElement, on: (v: boolean)=>void) => {
      const start = (e: Event) => { e.preventDefault(); el.classList.add('active'); on(true); };
      const end = (e: Event) => { e.preventDefault(); el.classList.remove('active'); on(false); };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    };
    const left = document.getElementById('btn-left');
    const right = document.getElementById('btn-right');
    const jump = document.getElementById('btn-jump');
    const shoot = document.getElementById('btn-shoot');
    if (left) bindHold(left, (v)=> this.touchLeft = v);
    if (right) bindHold(right, (v)=> this.touchRight = v);
    if (jump) bindHold(jump, (v)=> this.touchJump = v);
    if (shoot) {
      const press = (e: Event) => { e.preventDefault(); this.touchShootQueued = true; shoot!.classList.add('active'); };
      const release = (e: Event) => { e.preventDefault(); shoot!.classList.remove('active'); };
      shoot.addEventListener('touchstart', press, { passive: false });
      shoot.addEventListener('touchend', release, { passive: false });
      shoot.addEventListener('mousedown', press);
      shoot.addEventListener('mouseup', release);
      shoot.addEventListener('mouseleave', release);
    }
  }
  consumeTouchShoot() { if (this.touchShootQueued) { this.touchShootQueued = false; return true; } return false; }

  // --- Sound helpers (WebAudio beeps) ---
  playTone(freq: number, dur: number) {
    const ctx = (this.sound as any).context as AudioContext | undefined;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.value = 0.02;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); }, Math.max(10, dur*1000));
  }
  comboChime(mult: number) {
    // Little arpeggio
    const ctx = (this.sound as any).context as AudioContext | undefined;
    if (!ctx) return;
    const base = 660;
    [0, 120, 240].forEach((ms,i) => {
      setTimeout(()=> this.playTone(base + i*80 + mult*10, 0.05), ms);
    });
  }
}
