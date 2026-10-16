/**
 * player.js - Complete player with physics, animation, and state management
 */

class Player {
    constructor(x, y) {
        // Position & Size
        this.x = x;
        this.y = y;
        this.w = 36;
        this.h = 52;

        // Physics
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0.6;
        this.jumpForce = -14;
        this.speed = 5.5;
        this.maxVx = 6;
        this.friction = 0.82;
        this.airFriction = 0.9;

        // State
        this.onGround = false;
        this.facingRight = true;
        this.dead = false;
        this.alive = true;

        // Invincibility (after damage)
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 120; // frames

        // Animation
        this.animState = 'idle'; // idle, walk, jump, fall
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 6; // frames per animation advance

        // Controls
        this.keys = {
            left: false,
            right: false,
            jump: false,
            jumpPressed: false // one-shot
        };

        // Jump buffering
        this.jumpBuffer = 0;
        this.coyoteTime = 0; // grace period after leaving platform
        this.coyoteMax = 8;
        this.jumpBufferMax = 10;

        // Stats
        this.lives = 3;
        this.coins = 0;
        this.score = 0;

        // Particles emitter list
        this.particles = [];

        // Last safe position (before falling into pit)
        this.lastSafeX = x;
        this.lastSafeY = y;

        // Death animation
        this.deathTimer = 0;
        this.deathVy = -16;

        // Respawn
        this.respawnX = x;
        this.respawnY = y;
    }

    setRespawn(x, y) {
        this.respawnX = x;
        this.respawnY = y;
    }

    update(tiles, worldW, worldH) {
        if (this.dead) {
            this._updateDeath();
            return;
        }

        this._handleInput();
        this._applyPhysics();
        this._collideWithTiles(tiles);
        this._clampToWorld(worldW, worldH);
        this._updateAnimation();
        this._updateInvincibility();
        this._updateParticles();

        // Save safe position while grounded
        if (this.onGround && this.y < worldH - 10) {
            this.lastSafeX = this.x;
            this.lastSafeY = this.y;
        }
    }

    _handleInput() {
        const k = this.keys;

        // Horizontal movement
        if (k.left) {
            this.vx -= this.onGround ? 1.2 : 0.7;
            this.facingRight = false;
        }
        if (k.right) {
            this.vx += this.onGround ? 1.2 : 0.7;
            this.facingRight = true;
        }

        // Stop sliding if no key pressed
        if (!k.left && !k.right) {
            this.vx *= this.onGround ? this.friction : this.airFriction;
        }

        // Clamp horizontal speed
        this.vx = Math.max(-this.maxVx, Math.min(this.maxVx, this.vx));

        // Jump buffering
        if (k.jump) {
            this.jumpBuffer = this.jumpBufferMax;
            k.jump = false; // consume
        }
        if (this.jumpBuffer > 0) this.jumpBuffer--;

        // Execute jump
        if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
            this.vy = this.jumpForce;
            this.jumpBuffer = 0;
            this.coyoteTime = 0;
            this.onGround = false;
            window.audioManager.playJump();
            this._spawnJumpParticles();
        }
    }

    _applyPhysics() {
        this.vy += this.gravity;
        if (this.vy > 18) this.vy = 18; // terminal velocity

        this.x += this.vx;
        this.y += this.vy;

        // Coyote time
        if (this.onGround) {
            this.coyoteTime = this.coyoteMax;
        } else {
            if (this.coyoteTime > 0) this.coyoteTime--;
        }
        this.onGround = false; // reset, will be set by collision
    }

    _collideWithTiles(tiles) {
        for (const tile of tiles) {
            if (!Collision.rectRect(this, tile)) continue;
            const result = Collision.resolveTile(this, tile);
            if (result.hit) {
                if (result.side === 'bottom') {
                    this.onGround = true;
                    this.coyoteTime = this.coyoteMax;
                }
                if (result.side === 'top' && tile.type === 'question' && !tile.hit) {
                    tile.hit = true;
                    tile.hitTimer = 8;
                    if (tile.reward === 'coin') {
                        // spawn coin effect
                        this.score += 200;
                        this.coins++;
                        window.audioManager.playCoin();
                        this._spawnCoinBurst(tile.x + tile.w / 2, tile.y);
                    }
                }
            }
        }
    }

    _clampToWorld(worldW, worldH) {
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.x + this.w > worldW) { this.x = worldW - this.w; this.vx = 0; }

        // Fell into pit
        if (this.y > worldH + 100) {
            this.takeDamage(true);
        }
    }

    _updateAnimation() {
        const absVx = Math.abs(this.vx);
        let newState;

        if (!this.onGround) {
            newState = this.vy < 0 ? 'jump' : 'fall';
        } else if (absVx > 0.5) {
            newState = 'walk';
        } else {
            newState = 'idle';
        }

        if (newState !== this.animState) {
            this.animState = newState;
            this.animFrame = 0;
            this.animTimer = 0;
        }

        this.animTimer++;
        const speed = this.animState === 'walk' ? Math.max(2, 8 - Math.abs(this.vx)) : 8;
        if (this.animTimer >= speed) {
            this.animTimer = 0;
            this.animFrame++;
        }
    }

    _updateInvincibility() {
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }

    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    _updateDeath() {
        this.y += this.deathTimer < 20 ? this.deathVy : 4;
        this.deathVy += 0.5;
        this.deathTimer++;
    }

    takeDamage(instant = false) {
        if (this.invincible && !instant) return;
        this.lives--;
        window.audioManager.playDamage();
        if (this.lives <= 0) {
            this.die();
        } else {
            // Respawn at checkpoint
            this.x = this.respawnX;
            this.y = this.respawnY - 10;
            this.vx = 0;
            this.vy = 0;
            this.invincible = true;
            this.invincibleTimer = this.invincibleDuration;
            if (window.camera) window.camera.startShake(8);
        }
    }

    die() {
        this.dead = true;
        this.alive = false;
        this.deathTimer = 0;
        this.deathVy = -16;
        this.vy = this.deathVy;
    }

    collectCoin() {
        this.coins++;
        this.score += 100;
        window.audioManager.playCoin();
    }

    addScore(amount) {
        this.score += amount;
    }

    jump() {
        if (this.onGround || this.coyoteTime > 0) {
            this.vy = this.jumpForce;
            this.onGround = false;
            this.coyoteTime = 0;
            window.audioManager.playJump();
            this._spawnJumpParticles();
        }
    }

    _spawnJumpParticles() {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.x + this.w / 2 + (Math.random() - 0.5) * 16,
                y: this.y + this.h,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * -2 - 1,
                r: 3 + Math.random() * 3,
                color: '#aabbcc',
                life: 15 + Math.random() * 15
            });
        }
    }

    _spawnCoinBurst(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3 - 3,
                r: 4, color: '#f5a623',
                life: 25
            });
        }
    }

    draw(ctx) {
        // Draw particles
        for (const p of this.particles) {
            const alpha = p.life / 30;
            SpriteRenderer.drawParticle(ctx, p.x, p.y, p.r, p.color, Math.min(1, alpha));
        }

        if (this.dead) {
            // Spinning dead
            ctx.save();
            ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            ctx.rotate(this.deathTimer * 0.25);
            ctx.translate(-this.w / 2, -this.h / 2);
            SpriteRenderer.drawPlayer(ctx, 0, 0, this.w, this.h, 'jump', 0, true, false);
            ctx.restore();
            return;
        }

        SpriteRenderer.drawPlayer(
            ctx, this.x, this.y, this.w, this.h,
            this.animState, this.animFrame,
            this.facingRight, this.invincible
        );
    }

    // Bounding box for debug
    drawHitbox(ctx) {
        ctx.strokeStyle = 'rgba(255,0,0,0.5)';
        ctx.strokeRect(this.x, this.y, this.w, this.h);
    }
}

window.Player = Player;
