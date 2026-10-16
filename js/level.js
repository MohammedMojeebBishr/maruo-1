/**
 * level.js - Level data and entity factories
 * Creates 2 full levels with platforms, enemies, coins, and collectibles
 */

const TILE_SIZE = 48;

// ============================================================
// COIN class
// ============================================================
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 12;
        this.collected = false;
        this.frame = Math.random() * 60;
        this.floatOffset = Math.random() * Math.PI * 2;
        // Pop-up effect
        this.popY = 0;
        this.popAlpha = 1;
    }

    update() {
        this.frame++;
        if (!this.collected) {
            this.y += Math.sin(this.frame * 0.05 + this.floatOffset) * 0.3;
        } else {
            this.popY -= 2.5;
            this.popAlpha -= 0.05;
        }
    }

    isGone() {
        return this.collected && this.popAlpha <= 0;
    }

    draw(ctx) {
        if (this.collected) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.popAlpha);
            SpriteRenderer.drawCoin(ctx, this.x, this.y + this.popY, this.r, this.frame);
            ctx.restore();
        } else {
            SpriteRenderer.drawCoin(ctx, this.x, this.y, this.r, this.frame);
        }
    }
}

// ============================================================
// CHECKPOINT class
// ============================================================
class Checkpoint {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.active = false;
        this.frame = 0;
        this.particles = [];
    }

    activate() {
        if (this.active) return false;
        this.active = true;
        window.audioManager.playCheckpoint();
        this._spawnParticles();
        return true;
    }

    _spawnParticles() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x + this.w / 2,
                y: this.y + this.h / 2,
                vx: (Math.random() - 0.5) * 5,
                vy: Math.random() * -5 - 2,
                r: 3 + Math.random() * 4,
                color: i % 2 === 0 ? '#4CAF50' : '#f5d020',
                life: 40 + Math.random() * 20
            });
        }
    }

    update() {
        this.frame++;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            SpriteRenderer.drawParticle(ctx, p.x, p.y, p.r, p.color, p.life / 60);
        }
        SpriteRenderer.drawCheckpoint(ctx, this.x, this.y, this.w, this.h, this.active, this.frame);
    }
}

// ============================================================
// GOAL FLAG class
// ============================================================
class GoalFlag {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.frame = 0;
        this.triggered = false;
    }

    update() { this.frame++; }

    draw(ctx) {
        SpriteRenderer.drawFlag(ctx, this.x, this.y, this.w, this.h, this.frame);
    }
}

// ============================================================
// LEVEL PARSER - builds tile/object lists
// ============================================================
class Level {
    constructor(levelData) {
        this.tiles = [];
        this.enemies = [];
        this.coins = [];
        this.checkpoints = [];
        this.goalFlag = null;
        this.worldW = 0;
        this.worldH = 0;
        this.playerStart = { x: 100, y: 300 };
        this._build(levelData);
    }

    _build(data) {
        const T = TILE_SIZE;
        this.worldW = data.width * T;
        this.worldH = data.height * T;
        this.playerStart = { x: data.playerStart.x * T, y: data.playerStart.y * T };

        // Build tiles from grid
        const grid = data.tilemap;
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const cell = grid[row][col];
                if (!cell || cell === 0) continue;
                const tx = col * T;
                const ty = row * T;
                let tile = { x: tx, y: ty, w: T, h: T, type: 'solid' };
                if (cell === 1) tile.type = 'grass';
                else if (cell === 2) tile.type = 'stone';
                else if (cell === 3) tile.type = 'brick';
                else if (cell === 4) { tile.type = 'question'; tile.hit = false; tile.hitTimer = 0; tile.reward = 'coin'; }
                this.tiles.push(tile);
            }
        }

        // Enemies
        if (data.enemies) {
            for (const e of data.enemies) {
                this.enemies.push(new Enemy(e.x * T, e.y * T, e.type || 'walker', e.patrol || 200));
            }
        }

        // Coins
        if (data.coins) {
            for (const c of data.coins) {
                this.coins.push(new Coin(c.x * T + T / 2, c.y * T + T / 2 - 4));
            }
        }

        // Checkpoints
        if (data.checkpoints) {
            for (const ch of data.checkpoints) {
                this.checkpoints.push(new Checkpoint(ch.x * T, (ch.y - 2) * T, T, T * 2.5));
            }
        }

        // Goal
        if (data.goal) {
            this.goalFlag = new GoalFlag(data.goal.x * T, (data.goal.y - 4) * T, T, T * 4);
        }
    }

    update(player) {
        // Update tiles (question block animations)
        for (const tile of this.tiles) {
            if (tile.type === 'question' && tile.hitTimer > 0) tile.hitTimer--;
        }

        // Update coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.update();
            if (!coin.collected) {
                const dist = Math.hypot(
                    (player.x + player.w / 2) - coin.x,
                    (player.y + player.h / 2) - coin.y
                );
                if (dist < coin.r + 24) {
                    coin.collected = true;
                    player.collectCoin();
                }
            }
            if (coin.isGone()) this.coins.splice(i, 1);
        }

        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(this.tiles);
            if (!enemy.alive) continue;

            if (Collision.rectRect(player, enemy)) {
                if (Collision.isStomping(player, enemy)) {
                    enemy.die();
                    player.vy = -10;
                    player.addScore(200);
                } else {
                    player.takeDamage();
                }
            }
        }

        // Update checkpoints
        for (const cp of this.checkpoints) {
            cp.update();
            if (!cp.active && Collision.rectRect(player, cp)) {
                if (cp.activate()) {
                    player.setRespawn(cp.x, cp.y);
                }
            }
        }

        // Update goal
        if (this.goalFlag) {
            this.goalFlag.update();
            if (!this.goalFlag.triggered && Collision.rectRect(player, this.goalFlag)) {
                this.goalFlag.triggered = true;
            }
        }
    }

    draw(ctx, camera) {
        // Draw visible tiles
        for (const tile of this.tiles) {
            if (!camera.inView(tile.x, tile.y, tile.w, tile.h)) continue;
            switch (tile.type) {
                case 'grass':  SpriteRenderer.drawGrassTile(ctx, tile.x, tile.y, tile.w, tile.h); break;
                case 'stone':  SpriteRenderer.drawStoneTile(ctx, tile.x, tile.y, tile.w, tile.h); break;
                case 'brick':  SpriteRenderer.drawBrickTile(ctx, tile.x, tile.y, tile.w, tile.h); break;
                case 'question': SpriteRenderer.drawQuestionBlock(ctx, tile.x, tile.y, tile.w, tile.h, tile.hit); break;
                default:
                    ctx.fillStyle = '#4a7c4e';
                    ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
            }
        }

        // Coins
        for (const coin of this.coins) {
            if (camera.inView(coin.x - coin.r, coin.y - coin.r, coin.r * 2, coin.r * 2)) {
                coin.draw(ctx);
            }
        }

        // Enemies
        for (const enemy of this.enemies) {
            if (camera.inView(enemy.x, enemy.y, enemy.w, enemy.h, 100)) {
                enemy.draw(ctx);
            }
        }

        // Checkpoints
        for (const cp of this.checkpoints) {
            cp.draw(ctx);
        }

        // Goal
        if (this.goalFlag) this.goalFlag.draw(ctx);
    }

    isLevelComplete() {
        return this.goalFlag && this.goalFlag.triggered;
    }
}

// ============================================================
// LEVEL DEFINITIONS
// ============================================================

// Helper: create flat ground row
function groundRow(startCol, endCol, row, type = 1) {
    const cells = [];
    for (let c = startCol; c <= endCol; c++) cells.push({ col: c, row, type });
    return cells;
}

const LEVELS = [
    {
        // === LEVEL 1: Sunny Fields ===
        id: 1,
        name: '1-1',
        width: 80,
        height: 18,
        playerStart: { x: 2, y: 11 },
        tilemap: (() => {
            const T = 18, W = 80;
            const grid = Array.from({ length: T }, () => new Array(W).fill(0));

            const place = (col, row, type) => { if (row >= 0 && row < T && col >= 0 && col < W) grid[row][col] = type; };
            const row = (r, c1, c2, t = 1) => { for (let c = c1; c <= c2; c++) place(c, r, t); };

            // Ground
            row(13, 0, 14, 1);   // start
            // gap at 15-16
            row(13, 17, 30, 1);
            row(13, 32, 45, 1);
            row(13, 47, 62, 1);
            row(13, 64, 79, 1);

            // Platforms
            row(10, 4, 8, 3);
            row(9, 12, 16, 1);
            row(8, 20, 24, 1);
            row(6, 22, 25, 2);
            row(10, 28, 32, 1);
            row(8, 35, 39, 3);
            row(6, 37, 41, 2);
            row(10, 48, 52, 1);
            row(8, 54, 57, 3);
            row(6, 56, 59, 2);
            row(9, 62, 66, 1);
            row(7, 68, 72, 3);
            row(5, 70, 74, 2);

            // Question blocks
            place(6, 11, 4);
            place(7, 11, 4);
            place(14, 10, 4);
            place(23, 7, 4);
            place(38, 9, 4);
            place(57, 7, 4);
            place(71, 8, 4);

            // Brick blocks
            place(6, 9, 3);
            place(8, 9, 3);
            place(23, 9, 3);
            place(40, 9, 3);
            place(58, 9, 3);

            return grid;
        })(),
        enemies: [
            { x: 18, y: 12, type: 'walker', patrol: 150 },
            { x: 22, y: 12, type: 'walker', patrol: 100 },
            { x: 33, y: 12, type: 'slime',  patrol: 130 },
            { x: 42, y: 7,  type: 'bee',    patrol: 0 },
            { x: 50, y: 12, type: 'walker', patrol: 200 },
            { x: 56, y: 12, type: 'slime',  patrol: 100 },
            { x: 63, y: 7,  type: 'bee',    patrol: 0 },
            { x: 70, y: 12, type: 'walker', patrol: 130 },
            { x: 74, y: 12, type: 'walker', patrol: 80 },
        ],
        coins: [
            // Intro coins
            { x: 3, y: 12 }, { x: 4, y: 12 }, { x: 5, y: 12 },
            // Platform coins
            { x: 4, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 },
            { x: 12, y: 8 }, { x: 13, y: 8 }, { x: 14, y: 8 },
            // Mid section
            { x: 21, y: 7 }, { x: 22, y: 7 }, { x: 23, y: 7 },
            { x: 29, y: 9 }, { x: 30, y: 9 }, { x: 31, y: 9 },
            { x: 35, y: 7 }, { x: 36, y: 7 }, { x: 37, y: 7 },
            // Floating coins
            { x: 48, y: 9 }, { x: 49, y: 9 }, { x: 50, y: 9 },
            { x: 54, y: 7 }, { x: 55, y: 7 }, { x: 56, y: 7 },
            // Near end
            { x: 62, y: 8 }, { x: 63, y: 8 }, { x: 64, y: 8 },
            { x: 68, y: 6 }, { x: 69, y: 6 }, { x: 70, y: 6 },
            { x: 75, y: 12 }, { x: 76, y: 12 }, { x: 77, y: 12 },
        ],
        checkpoints: [
            { x: 30, y: 13 },
            { x: 55, y: 13 },
        ],
        goal: { x: 77, y: 13 },
    },

    {
        // === LEVEL 2: Stormy Heights ===
        id: 2,
        name: '1-2',
        width: 100,
        height: 18,
        playerStart: { x: 2, y: 11 },
        tilemap: (() => {
            const T = 18, W = 100;
            const grid = Array.from({ length: T }, () => new Array(W).fill(0));
            const place = (col, row, type) => { if (row >= 0 && row < T && col >= 0 && col < W) grid[row][col] = type; };
            const row = (r, c1, c2, t = 2) => { for (let c = c1; c <= c2; c++) place(c, r, t); };

            // Ground sections with more gaps
            row(14, 0, 10, 1);
            row(14, 13, 22, 2);
            row(14, 25, 35, 1);
            row(14, 38, 48, 2);
            row(14, 51, 62, 1);
            row(14, 65, 78, 2);
            row(14, 81, 99, 1);

            // Complex platforms
            row(11, 4, 8, 3);
            row(10, 6, 10, 2);
            row(9, 13, 17, 3);
            row(8, 15, 19, 1);
            row(7, 17, 20, 2);
            row(11, 22, 26, 3);
            row(9, 25, 29, 1);
            row(7, 27, 31, 3);
            row(5, 29, 33, 2);
            row(11, 35, 40, 1);
            row(9, 38, 42, 3);
            row(7, 40, 44, 2);
            row(5, 42, 46, 1);
            row(11, 48, 54, 3);
            row(9, 52, 56, 1);
            row(7, 54, 58, 2);
            row(5, 56, 60, 3);
            row(11, 62, 68, 1);
            row(9, 66, 71, 3);
            row(7, 69, 74, 2);
            row(5, 72, 76, 1);
            row(11, 78, 84, 3);
            row(9, 82, 87, 2);
            row(7, 85, 90, 1);

            // Question blocks - more of them
            place(6, 12, 4); place(9, 11, 4);
            place(16, 10, 4); place(18, 9, 4);
            place(28, 8, 4); place(30, 6, 4);
            place(40, 10, 4); place(43, 8, 4);
            place(53, 12, 4); place(55, 10, 4); place(57, 8, 4);
            place(67, 12, 4); place(70, 10, 4); place(73, 8, 4); place(75, 6, 4);
            place(83, 12, 4); place(86, 10, 4); place(88, 8, 4);

            return grid;
        })(),
        enemies: [
            { x: 14, y: 13, type: 'walker', patrol: 100 },
            { x: 18, y: 13, type: 'slime',  patrol: 100 },
            { x: 20, y: 9,  type: 'bee',    patrol: 0 },
            { x: 26, y: 13, type: 'walker', patrol: 120 },
            { x: 30, y: 13, type: 'walker', patrol: 100 },
            { x: 32, y: 8,  type: 'bee',    patrol: 0 },
            { x: 39, y: 13, type: 'slime',  patrol: 130 },
            { x: 44, y: 13, type: 'walker', patrol: 100 },
            { x: 48, y: 8,  type: 'bee',    patrol: 0 },
            { x: 52, y: 13, type: 'walker', patrol: 150 },
            { x: 58, y: 13, type: 'slime',  patrol: 100 },
            { x: 60, y: 8,  type: 'bee',    patrol: 0 },
            { x: 65, y: 13, type: 'walker', patrol: 180 },
            { x: 72, y: 13, type: 'slime',  patrol: 100 },
            { x: 75, y: 8,  type: 'bee',    patrol: 0 },
            { x: 82, y: 13, type: 'walker', patrol: 150 },
            { x: 88, y: 13, type: 'walker', patrol: 100 },
            { x: 90, y: 8,  type: 'bee',    patrol: 0 },
            { x: 94, y: 13, type: 'slime',  patrol: 100 },
        ],
        coins: (() => {
            const coins = [];
            const positions = [
                [3,13],[4,13],[5,13],[6,13],
                [5,10],[6,10],[7,10],[8,10],
                [14,9],[15,9],[16,9],
                [17,8],[18,8],[19,8],
                [25,6],[26,6],[27,6],[28,6],
                [38,10],[39,10],[40,10],
                [42,8],[43,8],[44,8],
                [52,12],[53,12],[54,12],
                [55,10],[56,10],[57,10],
                [58,8],[59,8],[60,8],
                [65,11],[66,11],[67,11],
                [69,9],[70,9],[71,9],
                [72,7],[73,7],[74,7],[75,7],
                [82,11],[83,11],[84,11],
                [86,9],[87,9],[88,9],
                [93,13],[94,13],[95,13],[96,13],
            ];
            positions.forEach(([x, y]) => coins.push({ x, y }));
            return coins;
        })(),
        checkpoints: [
            { x: 35, y: 14 },
            { x: 65, y: 14 },
        ],
        goal: { x: 97, y: 14 },
    }
];

window.Level = Level;
window.LEVELS = LEVELS;
window.TILE_SIZE = TILE_SIZE;
