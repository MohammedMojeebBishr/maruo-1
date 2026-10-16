/**
 * main.js - Entry point, global helpers, screen management
 */

// ===== SCREEN MANAGEMENT =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}

window.showScreen = showScreen;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Create the game instance
    window.game = new Game();

    // Start on main menu
    showScreen('main-menu');

    // Animate the menu background with floating platforms
    const menuCanvas = document.createElement('canvas');
    menuCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.15;pointer-events:none;z-index:1;';
    const menuBg = document.querySelector('#main-menu .menu-bg');
    if (menuBg) {
        menuBg.appendChild(menuCanvas);
        _animateMenuBg(menuCanvas);
    }

    // Handle first interaction to resume AudioContext
    const resumeAudio = () => {
        if (window.audioManager && window.audioManager.ctx) {
            window.audioManager.ctx.resume();
        }
        document.removeEventListener('pointerdown', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
    };
    document.addEventListener('pointerdown', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
});

// ===== MENU BACKGROUND ANIMATION =====
function _animateMenuBg(canvas) {
    const ctx = canvas.getContext('2d');
    let frame = 0;
    const platforms = [
        { x: 50, y: 300, w: 120, spd: 0.4 },
        { x: 250, y: 220, w: 100, spd: 0.3 },
        { x: 450, y: 280, w: 150, spd: 0.5 },
        { x: 700, y: 200, w: 90,  spd: 0.35 },
        { x: 900, y: 260, w: 130, spd: 0.45 },
    ];
    const coins = [
        { x: 80, y: 260 }, { x: 130, y: 260 },
        { x: 280, y: 180 }, { x: 330, y: 180 },
        { x: 490, y: 240 }, { x: 540, y: 240 },
        { x: 730, y: 160 }, { x: 780, y: 160 },
        { x: 940, y: 220 },
    ];

    function draw() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frame++;

        // Floating platforms
        platforms.forEach((p, i) => {
            const py = p.y + Math.sin(frame * 0.02 + i * 1.2) * 15;
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(p.x, py, p.w, 20);
            ctx.fillStyle = '#66BB6A';
            ctx.fillRect(p.x, py, p.w, 7);
        });

        // Coins
        coins.forEach((c, i) => {
            const cy = c.y + Math.sin(frame * 0.03 + i * 0.8) * 8;
            ctx.fillStyle = '#f5a623';
            ctx.beginPath();
            ctx.arc(c.x, cy, 8, 0, Math.PI * 2);
            ctx.fill();
        });

        // Decorative character silhouette
        const charX = 150 + Math.sin(frame * 0.015) * 30;
        const charY = 240 + Math.sin(frame * 0.02 + 1) * 12;
        ctx.fillStyle = '#e03020';
        ctx.fillRect(charX - 12, charY - 30, 24, 18);
        ctx.fillStyle = '#f5c6a0';
        ctx.beginPath();
        ctx.arc(charX, charY - 40, 12, 0, Math.PI * 2);
        ctx.fill();

        requestAnimationFrame(draw);
    }
    draw();
}

// ===== POLYFILL: roundRect for older browsers =====
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x,   y + h, r);
        this.arcTo(x,   y + h, x,   y,   r);
        this.arcTo(x,   y,   x + w, y,   r);
        this.closePath();
        return this;
    };
}
