/**
 * enemy.js - Enemy types with AI, physics, and death effects
 */

class Enemy {
    constructor(x, y, type = 'walker', patrolLen = 180) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.patrolLen = patrolLen;

        // Size based on type
        const sizes = {
            walker: { w: 38, h: 38 },
            bee:    { w: 40, h: 36 },
            slime:  { w: 32, h: 38 },
        };
        const s = sizes[type] || sizes.walker;
        this.w = s.w;
        this.h = s.h;

        // Physics
        this.vx = type === 'bee' ? 0 : -1.8;
        this.vy = 0;
        this.gravity = type === 'bee' ? 0 : 0.5;
        this.startX = x;
        this.onGround = false;

        // State
        this.alive = true;
        this.dying = false;
        this.dyingTimer = 0;
        this.frame = Math.random() * 100; // offset

        // Bee specific
        this.beeAngle = Math.random() * Math.PI * 2;
        this.beeAmpX = 80;
        this.beeAmpY = 40;
        this.beeSpeed = 0.025 + Math.random() * 0.01;
        this.beeCenterX = x;
        this.beeCenterY = y;

        // Particles for death
        this.particles = [];
    }

    update(tiles) {
        if (!this.alive) {
            this._updateParticles();
            return;
        }

        this.frame++;

        if (this.type === 'bee') {
            this._updateBee();
        } else {
            this._updateGroundEnemy(tiles);
        }
    }

    _updateBee() {
        this.beeAngle += this.beeSpeed;
        this.x = this.beeCenterX + Math.cos(this.beeAngle) * this.beeAmpX;
        this.y = this.beeCenterY + Math.sin(this.beeAngle) * this.beeAmpY;
    }

    _updateGroundEnemy(tiles) {
        // Patrol
        this.vx = this.vx !== 0 ? this.vx : -1.8;

        // Apply gravity
        this.vy += this.gravity;
        if (this.vy > 15) this.vy = 15;

        this.x += this.vx;
        this.y += this.vy;
        this.onGround = false;

        // Tile collision
        for (const tile of tiles) {
            if (!Collision.rectRect(this, tile)) continue;
            const result = Collision.resolveTile(this, tile);
            if (result.hit && result.side === 'bottom') {
                this.onGround = true;
            }
            if (result.hit && (result.side === 'left' || result.side === 'right')) {
                this.vx *= -1; // Reverse
            }
        }

        // Patrol bounds
        if (Math.abs(this.x - this.startX) > this.patrolLen) {
            this.vx *= -1;
        }

        // Edge detection (don't walk off platforms)
        if (this.onGround) {
            const edgeCheckX = this.vx > 0 ? this.x + this.w + 2 : this.x - 2;
            let overEdge = true;
            for (const tile of tiles) {
                if (edgeCheckX >= tile.x && edgeCheckX <= tile.x + tile.w &&
                    this.y + this.h + 1 >= tile.y && this.y + this.h + 1 <= tile.y + tile.h + 2) {
                    overEdge = false;
                    break;
                }
            }
            if (overEdge) this.vx *= -1;
        }
    }

    die() {
        this.dying = true;
        this.alive = false;
        window.audioManager.playEnemyHit();
        this._spawnDeathParticles();
    }

    _spawnDeathParticles() {
        const colors = this.type === 'bee' ? ['#f5d020','#f5a623','#fff'] :
                       this.type === 'slime' ? ['#1e88e5','#5bc8ff','#fff'] :
                       ['#8B4513','#a0522d','#f5a623'];

        for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * Math.PI * 2;
            const spd = 2 + Math.random() * 4;
            this.particles.push({
                x: this.x + this.w / 2,
                y: this.y + this.h / 2,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 3,
                r: 3 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 25 + Math.random() * 20
            });
        }
    }

    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    isFullyDead() {
        return !this.alive && this.particles.length === 0;
    }

    draw(ctx) {
        // Draw death particles
        for (const p of this.particles) {
            SpriteRenderer.drawParticle(ctx, p.x, p.y, p.r, p.color, p.life / 40);
        }

        if (!this.alive) return;

        switch (this.type) {
            case 'walker':
                SpriteRenderer.drawWalker(ctx, this.x, this.y, this.w, this.h, this.frame);
                break;
            case 'bee':
                SpriteRenderer.drawBee(ctx, this.x, this.y, this.w, this.h, this.frame);
                break;
            case 'slime':
                SpriteRenderer.drawSlime(ctx, this.x, this.y, this.w, this.h, this.frame);
                break;
        }
    }
}

window.Enemy = Enemy;
