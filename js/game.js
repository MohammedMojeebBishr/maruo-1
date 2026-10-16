/**
 * game.js - Main game loop, state machine, and input handling
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.state = 'idle'; // idle, playing, paused, dead, gameover, leveldone
        this.currentLevelIndex = 0;
        this.level = null;
        this.player = null;
        this.camera = null;
        this.ui = null;

        this.raf = null;
        this.lastTime = 0;
        this.frameTimer = 0;

        // Time
        this.timeLeft = 300;
        this.timePaused = false;

        // Screen dimensions
        this.viewW = 0;
        this.viewH = 0;

        // Global frame counter
        this.frame = 0;

        // Damage flash
        this.damageFlash = 0;

        // Level complete delay
        this.levelCompleteDelay = 0;

        // Game over delay
        this.gameOverDelay = 0;

        this._setupInput();
        this._setupButtons();
        this._resize();
        window.addEventListener('resize', () => this._resize());

        // Expose camera globally for player.js
        window.camera = null;
    }

    _resize() {
        const screen = document.getElementById('game-screen');
        const hud = document.getElementById('hud');
        const hudH = hud ? hud.offsetHeight : 56;
        this.viewW = screen.clientWidth;
        this.viewH = screen.clientHeight - hudH;
        this.canvas.width = this.viewW;
        this.canvas.height = this.viewH;
        if (this.camera) this.camera.resize(this.viewW, this.viewH);
    }

    // ===== INPUT =====
    _setupInput() {
        const keys = {};
        this._keys = keys;

        document.addEventListener('keydown', e => {
            keys[e.code] = true;
            if (this.player) {
                if (['ArrowLeft', 'KeyA'].includes(e.code))  this.player.keys.left = true;
                if (['ArrowRight','KeyD'].includes(e.code)) this.player.keys.right = true;
                if (['ArrowUp','KeyW','Space'].includes(e.code)) {
                    if (this.state === 'playing') this.player.keys.jump = true;
                }
            }
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.state === 'playing') this.pause();
                else if (this.state === 'paused') this.resume();
                e.preventDefault();
            }
            if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', e => {
            keys[e.code] = false;
            if (this.player) {
                if (['ArrowLeft', 'KeyA'].includes(e.code))  this.player.keys.left = false;
                if (['ArrowRight','KeyD'].includes(e.code)) this.player.keys.right = false;
            }
        });

        // Touch controls
        const setupTouch = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const press = () => {
                btn.classList.add('pressed');
                action(true);
            };
            const release = () => {
                btn.classList.remove('pressed');
                action(false);
            };
            btn.addEventListener('touchstart',  e => { e.preventDefault(); press(); }, { passive: false });
            btn.addEventListener('touchend',    e => { e.preventDefault(); release(); }, { passive: false });
            btn.addEventListener('touchcancel', e => { e.preventDefault(); release(); }, { passive: false });
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
        };

        setupTouch('btn-left',  on => { if (this.player) this.player.keys.left = on; });
        setupTouch('btn-right', on => { if (this.player) this.player.keys.right = on; });
        setupTouch('btn-jump',  on => { if (this.player && on && this.state === 'playing') this.player.keys.jump = true; });
    }

    _setupButtons() {
        const $ = id => document.getElementById(id);
        const click = (id, fn) => {
            const el = $(id);
            if (el) el.addEventListener('click', () => { window.audioManager.playMenuClick(); fn(); });
        };

        click('btn-play', () => this.startLevel(0));
        click('btn-settings', () => showScreen('settings-screen'));
        click('btn-how-to-play', () => showScreen('how-to-play-screen'));
        click('btn-pause', () => this.pause());
        click('btn-resume', () => this.resume());
        click('btn-restart', () => this.startLevel(this.currentLevelIndex));
        click('btn-pause-main', () => { this.stopGame(); showScreen('main-menu'); });
        click('btn-retry', () => this.startLevel(this.currentLevelIndex));
        click('btn-go-main', () => { this.stopGame(); showScreen('main-menu'); });
        click('btn-next-level', () => this.nextLevel());
        click('btn-replay', () => this.startLevel(this.currentLevelIndex));

        // Settings
        const musicToggle = $('music-toggle');
        const sfxToggle = $('sfx-toggle');
        const volSlider = $('volume-slider');
        if (musicToggle) musicToggle.addEventListener('change', e => window.audioManager.setMusicEnabled(e.target.checked));
        if (sfxToggle) sfxToggle.addEventListener('change', e => window.audioManager.setSfxEnabled(e.target.checked));
        if (volSlider) volSlider.addEventListener('input', e => window.audioManager.setVolume(e.target.value / 100));
    }

    // ===== LEVEL MANAGEMENT =====
    startLevel(index) {
        this.currentLevelIndex = index;
        const data = LEVELS[index];

        // Build level
        this.level = new Level(data);

        // Create player
        const ps = this.level.playerStart;
        this.player = new Player(ps.x, ps.y);
        if (this._savedLives !== undefined) {
            this.player.lives = this._savedLives;
            this.player.coins = this._savedCoins;
            this.player.score = this._savedScore;
        }

        // Camera
        this.camera = new Camera(this.viewW, this.viewH);
        this.camera.setBounds(this.level.worldW, this.level.worldH);
        this.camera.x = Math.max(0, ps.x - this.viewW / 2);
        this.camera.y = Math.max(0, ps.y - this.viewH / 2);
        window.camera = this.camera;

        // UI
        this.ui = new UI();

        // Time
        this.timeLeft = 300;
        this.timePaused = false;
        this.damageFlash = 0;
        this.levelCompleteDelay = 0;
        this.gameOverDelay = 0;

        this.state = 'playing';
        showScreen('game-screen');
        this._resize();

        // Start music
        window.audioManager.playBgMusic();

        // Start loop
        this.stopGame();
        this.lastTime = performance.now();
        this.raf = requestAnimationFrame(t => this._loop(t));
    }

    nextLevel() {
        const nextIdx = this.currentLevelIndex + 1;
        if (nextIdx < LEVELS.length) {
            // Carry over stats
            this._savedLives = this.player.lives;
            this._savedCoins = this.player.coins;
            this._savedScore = this.player.score;
            this.startLevel(nextIdx);
        } else {
            // No more levels - back to menu
            this._savedLives = undefined;
            this._savedCoins = undefined;
            this._savedScore = undefined;
            this.stopGame();
            showScreen('main-menu');
        }
    }

    stopGame() {
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
        window.audioManager.stopMusic();
    }

    pause() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        showScreen('pause-menu');
    }

    resume() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        showScreen('game-screen');
    }

    // ===== MAIN LOOP =====
    _loop(timestamp) {
        const dt = Math.min(timestamp - this.lastTime, 50); // cap delta at 50ms
        this.lastTime = timestamp;
        this.frame++;

        if (this.state === 'playing') {
            this._update(dt);
        }

        this._draw();
        this.raf = requestAnimationFrame(t => this._loop(t));
    }

    _update(dt) {
        const p = this.player;
        const lvl = this.level;
        const cam = this.camera;

        // Countdown timer
        this.timeLeft -= dt / 1000;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            p.takeDamage(true);
        }

        // Update player
        p.update(lvl.tiles, lvl.worldW, lvl.worldH);

        // Update level entities
        lvl.update(p);

        // Camera follows player
        cam.follow(p);

        // UI
        this.ui.update(p, LEVELS[this.currentLevelIndex].name, this.timeLeft);

        // Damage flash
        if (this.damageFlash > 0) this.damageFlash -= 0.04;

        // Check player dead
        if (!p.alive) {
            this.gameOverDelay++;
            if (p.lives <= 0 && this.gameOverDelay > 90) {
                this._triggerGameOver();
            } else if (p.lives > 0 && this.gameOverDelay > 60) {
                // Respawn
                p.dead = false;
                p.alive = true;
                p.x = p.respawnX;
                p.y = p.respawnY;
                p.vx = 0; p.vy = 0;
                p.invincible = true;
                p.invincibleTimer = p.invincibleDuration;
                this.gameOverDelay = 0;
            }
        }

        // Level complete
        if (lvl.isLevelComplete() && this.levelCompleteDelay === 0) {
            this.levelCompleteDelay = 1;
            window.audioManager.playLevelComplete();
        }
        if (this.levelCompleteDelay > 0) {
            this.levelCompleteDelay++;
            if (this.levelCompleteDelay > 120) {
                this._triggerLevelComplete();
            }
        }

        // Previous invincible flash = set damageFlash
        if (p.invincible && p.invincibleTimer === p.invincibleDuration - 1) {
            this.damageFlash = 1;
        }
    }

    _triggerGameOver() {
        this.state = 'gameover';
        this.ui.updateGameOverScreen(this.player.score, this.player.coins);
        window.audioManager.playGameOver();
        window.audioManager.stopMusic();
        showScreen('game-over-screen');
        this._savedLives = undefined;
        this._savedCoins = undefined;
        this._savedScore = undefined;
    }

    _triggerLevelComplete() {
        this.state = 'leveldone';
        const elapsed = 300 - this.timeLeft;
        this.ui.updateLevelCompleteScreen(this.player.score, this.player.coins, this.timeLeft);
        showScreen('level-complete-screen');

        // Save stats for next level
        this._savedLives = this.player.lives;
        this._savedCoins = this.player.coins;
        this._savedScore = this.player.score;
    }

    // ===== DRAW =====
    _draw() {
        const ctx = this.ctx;
        const cam = this.camera;
        const p = this.player;

        if (!cam) return;

        ctx.clearRect(0, 0, this.viewW, this.viewH);

        // Background (parallax, fixed to view)
        SpriteRenderer.drawBackground(ctx, this.viewW, this.viewH, cam.x, cam.y);

        // World objects
        cam.apply(ctx);
        this.level.draw(ctx, cam);
        p.draw(ctx);
        cam.restore(ctx);

        // Floating texts (world-space but drawn in view-space)
        // Convert world positions to screen
        ctx.save();
        ctx.translate(-cam.x + cam.shakeX, -cam.y + cam.shakeY);
        this.ui.drawFloatingTexts(ctx);
        ctx.restore();

        // Damage flash overlay
        if (this.damageFlash > 0) {
            this.ui.drawDamageFlash(ctx, this.viewW, this.viewH, this.damageFlash * 0.35);
        }

        // Death overlay fade
        if (!p.alive) {
            const alpha = Math.min(0.7, this.gameOverDelay / 90);
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.fillRect(0, 0, this.viewW, this.viewH);
        }

        // Level complete overlay
        if (this.levelCompleteDelay > 0) {
            const alpha = Math.min(0.5, this.levelCompleteDelay / 120);
            ctx.fillStyle = `rgba(245,208,32,${alpha * 0.3})`;
            ctx.fillRect(0, 0, this.viewW, this.viewH);
        }
    }
}

window.Game = Game;
