/**
 * ui.js - HUD updates, screen transitions, and floating text effects
 */

class UI {
    constructor() {
        this.floatingTexts = [];
        this.frame = 0;

        // DOM refs
        this.livesEl = document.getElementById('lives-count');
        this.coinsEl = document.getElementById('coins-count');
        this.scoreEl = document.getElementById('score-count');
        this.levelEl = document.getElementById('level-name');
        this.timeEl  = document.getElementById('time-count');
    }

    update(player, levelName, timeLeft) {
        this.frame++;

        // Update HUD
        this.livesEl.textContent = player.lives;
        this.coinsEl.textContent = player.coins;
        this.scoreEl.textContent = player.score;
        this.levelEl.textContent = levelName;
        this.timeEl.textContent  = Math.ceil(timeLeft);

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y -= 1.5;
            t.alpha -= 0.02;
            if (t.alpha <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    spawnFloatingText(x, y, text, color = '#f5d020') {
        this.floatingTexts.push({ x, y, text, color, alpha: 1.0 });
    }

    drawFloatingTexts(ctx) {
        for (const t of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = t.alpha;
            ctx.fillStyle = t.color;
            ctx.strokeStyle = 'rgba(0,0,0,0.7)';
            ctx.lineWidth = 3;
            ctx.font = 'bold 18px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }
    }

    // Draw semi-transparent death overlay
    drawDamageFlash(ctx, w, h, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    showScreen(id) {
        showScreen(id);
    }

    updateGameOverScreen(score, coins) {
        document.getElementById('go-score').textContent = score;
        document.getElementById('go-coins').textContent = coins;
    }

    updateLevelCompleteScreen(score, coins, time) {
        document.getElementById('lc-score').textContent = score;
        document.getElementById('lc-coins').textContent = coins;
        document.getElementById('lc-time').textContent = Math.ceil(time) + 's';
        // Stars rating
        const starsEl = document.getElementById('completion-stars');
        const remaining = time;
        let stars = '★ ★ ★';
        if (remaining < 60) stars = '★ ★ ☆';
        if (remaining < 20) stars = '★ ☆ ☆';
        starsEl.textContent = stars;
    }
}

window.UI = UI;
