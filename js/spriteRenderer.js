/**
 * spriteRenderer.js
 * Draws all game sprites procedurally on canvas (no external images needed)
 * Character inspired by the reference image: boy in red shirt with dark hair
 */

const SpriteRenderer = {

    // === CHARACTER ===
    drawPlayer(ctx, x, y, w, h, state, frame, facingRight, invincible) {
        ctx.save();
        ctx.translate(x + w / 2, y);
        if (!facingRight) ctx.scale(-1, 1);
        if (invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        const blink = state === 'walk' ? Math.sin(frame * 0.8) : 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.ellipse(0, h * 0.97, w * 0.35, h * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs animation
        const legSwing = state === 'walk' ? Math.sin(frame * 1.5) * 8 : 0;
        const legSwing2 = state === 'walk' ? Math.cos(frame * 1.5) * 8 : 0;

        // Left shoe
        ctx.fillStyle = '#2c1810';
        this._roundRect(ctx, -w * 0.28 + legSwing * 0.4, h * 0.78, w * 0.26, h * 0.14, 3);
        // Right shoe
        this._roundRect(ctx, w * 0.02 + legSwing2 * 0.4, h * 0.78, w * 0.26, h * 0.14, 3);

        // Pants (dark blue)
        ctx.fillStyle = '#1a3a6b';
        const jumpLeg = state === 'jump' ? -5 : 0;
        this._roundRect(ctx, -w * 0.3, h * 0.52 + jumpLeg, w * 0.28, h * 0.32, 4);
        this._roundRect(ctx, w * 0.02, h * 0.52 + jumpLeg, w * 0.28, h * 0.32, 4);

        // Body / Shirt (red)
        ctx.fillStyle = '#e03020';
        this._roundRect(ctx, -w * 0.32, h * 0.28, w * 0.64, h * 0.28, 5);

        // Shirt highlights
        ctx.fillStyle = '#f04030';
        this._roundRect(ctx, -w * 0.28, h * 0.3, w * 0.22, h * 0.1, 3);

        // Arms
        ctx.fillStyle = '#e03020';
        const armSwing = state === 'walk' ? Math.sin(frame * 1.5) * 12 : 0;
        // Left arm
        ctx.save();
        ctx.translate(-w * 0.36, h * 0.32);
        ctx.rotate((-0.3 + armSwing * 0.04) * Math.PI);
        this._roundRect(ctx, -w * 0.1, 0, w * 0.18, h * 0.22, 4);
        // Left hand (skin)
        ctx.fillStyle = '#f5c6a0';
        ctx.beginPath();
        ctx.arc(0, h * 0.23, w * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(w * 0.36, h * 0.32);
        ctx.rotate((0.3 - armSwing * 0.04) * Math.PI);
        ctx.fillStyle = '#e03020';
        this._roundRect(ctx, -w * 0.08, 0, w * 0.18, h * 0.22, 4);
        ctx.fillStyle = '#f5c6a0';
        ctx.beginPath();
        ctx.arc(w * 0.04, h * 0.23, w * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Neck
        ctx.fillStyle = '#f5c6a0';
        this._roundRect(ctx, -w * 0.1, h * 0.2, w * 0.2, h * 0.12, 3);

        // Head
        ctx.fillStyle = '#f5c6a0';
        this._roundRect(ctx, -w * 0.3, h * 0.0, w * 0.6, h * 0.25, 8);

        // Hair (dark brown)
        ctx.fillStyle = '#2c1200';
        this._roundRect(ctx, -w * 0.3, h * 0.0, w * 0.6, h * 0.12, 8);
        // Hair tuft
        ctx.beginPath();
        ctx.arc(w * 0.05, h * -0.01, w * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1a0a00';
        ctx.beginPath();
        ctx.arc(-w * 0.1, h * 0.1, w * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.1, h * 0.1, w * 0.07, 0, Math.PI * 2);
        ctx.fill();
        // Eye whites
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-w * 0.1 + 1, h * 0.09, w * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.1 + 1, h * 0.09, w * 0.035, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows
        ctx.strokeStyle = '#2c1200';
        ctx.lineWidth = 2;
        const eyebrowY = state === 'jump' ? h * 0.05 : h * 0.07;
        ctx.beginPath();
        ctx.moveTo(-w * 0.17, eyebrowY);
        ctx.lineTo(-w * 0.03, eyebrowY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w * 0.03, eyebrowY);
        ctx.lineTo(w * 0.17, eyebrowY);
        ctx.stroke();

        // Mouth  
        ctx.strokeStyle = '#a0603a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (state === 'jump') {
            ctx.arc(0, h * 0.17, w * 0.06, 0, Math.PI);
        } else {
            ctx.arc(0, h * 0.16, w * 0.05, 0, Math.PI);
        }
        ctx.stroke();

        // Ears
        ctx.fillStyle = '#f5c6a0';
        ctx.beginPath();
        ctx.arc(-w * 0.3, h * 0.12, w * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.3, h * 0.12, w * 0.07, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
    },

    // === ENEMY: Goomba-style walker ===
    drawWalker(ctx, x, y, w, h, frame) {
        ctx.save();
        ctx.translate(x + w/2, y + h);
        const bob = Math.sin(frame * 0.1) * 2;

        // Body
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.55 + bob, w * 0.45, h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#a0522d';
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.8 + bob, w * 0.38, h * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (angry)
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(-w*0.15, -h*0.82+bob, w*0.1, h*0.1, -0.3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w*0.15, -h*0.82+bob, w*0.1, h*0.1, 0.3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a0000';
        ctx.beginPath(); ctx.arc(-w*0.12, -h*0.82+bob, w*0.05, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(w*0.12, -h*0.82+bob, w*0.05, 0, Math.PI*2); ctx.fill();

        // Eyebrows (angry)
        ctx.strokeStyle = '#1a0000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-w*0.22, -h*0.9+bob); ctx.lineTo(-w*0.06, -h*0.86+bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w*0.06, -h*0.86+bob); ctx.lineTo(w*0.22, -h*0.9+bob); ctx.stroke();

        // Mouth
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, -h*0.72+bob, w*0.12, 0.1, Math.PI-0.1); ctx.stroke();

        // Feet
        const footL = Math.sin(frame * 0.15) * 5;
        ctx.fillStyle = '#5c2d0e';
        ctx.beginPath(); ctx.ellipse(-w*0.2, -h*0.08 + footL, w*0.18, h*0.1, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w*0.2, -h*0.08 - footL, w*0.18, h*0.1, 0, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    },

    // === ENEMY: Flying Bee ===
    drawBee(ctx, x, y, w, h, frame) {
        ctx.save();
        ctx.translate(x + w/2, y + h/2);
        const hover = Math.sin(frame * 0.12) * 4;

        // Stinger
        ctx.fillStyle = '#f5a623';
        ctx.beginPath();
        ctx.moveTo(w*0.35, hover); ctx.lineTo(w*0.5, hover+2); ctx.lineTo(w*0.35, hover+4); ctx.fill();

        // Body
        const grad = ctx.createRadialGradient(0, hover, 0, 0, hover, w*0.4);
        grad.addColorStop(0, '#f5d020');
        grad.addColorStop(1, '#f5a623');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.ellipse(0, hover, w*0.38, h*0.45, 0, 0, Math.PI*2); ctx.fill();

        // Stripes
        ctx.fillStyle = '#1a1a00';
        for (let i = -1; i <= 1; i++) {
            ctx.fillRect(-w*0.32, hover + i * h*0.13 - h*0.07, w*0.64, h*0.08);
        }

        // Wings
        const wingFlap = Math.sin(frame * 0.5) * 0.3;
        ctx.fillStyle = 'rgba(200,240,255,0.7)';
        ctx.save(); ctx.rotate(-0.4 + wingFlap);
        ctx.beginPath(); ctx.ellipse(-w*0.2, -h*0.3, w*0.3, h*0.2, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.rotate(0.4 - wingFlap);
        ctx.beginPath(); ctx.ellipse(w*0.2, -h*0.3, w*0.3, h*0.2, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        // Eyes
        ctx.fillStyle = '#1a0000';
        ctx.beginPath(); ctx.arc(-w*0.15, hover-h*0.15, w*0.08, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-w*0.12, hover-h*0.17, w*0.04, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    },

    // === ENEMY: Slime/Water drop ===
    drawSlime(ctx, x, y, w, h, frame) {
        ctx.save();
        ctx.translate(x + w/2, y + h);
        const bob = Math.sin(frame * 0.08) * 3;

        ctx.fillStyle = 'rgba(30,100,220,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, bob * 0.3, w*0.5, h*0.12, 0, 0, Math.PI*2);
        ctx.fill();

        const grad = ctx.createRadialGradient(-w*0.1, -h*0.6+bob, 0, 0, -h*0.5+bob, w*0.45);
        grad.addColorStop(0, '#5bc8ff');
        grad.addColorStop(0.6, '#1e88e5');
        grad.addColorStop(1, '#0d47a1');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-w*0.4, bob);
        ctx.bezierCurveTo(-w*0.45, -h*0.4+bob, -w*0.2, -h+bob, 0, -h*0.95+bob);
        ctx.bezierCurveTo(w*0.2, -h+bob, w*0.45, -h*0.4+bob, w*0.4, bob);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(-w*0.12, -h*0.65+bob, w*0.12, h*0.1, -0.5, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#1a3060';
        ctx.beginPath(); ctx.arc(-w*0.13, -h*0.5+bob, w*0.08, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(w*0.13, -h*0.5+bob, w*0.08, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-w*0.1, -h*0.52+bob, w*0.04, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(w*0.16, -h*0.52+bob, w*0.04, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    },

    // === TILE rendering ===
    drawGrassTile(ctx, x, y, w, h) {
        // Dirt
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(x, y + h * 0.35, w, h * 0.65);
        // Grass top
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(x, y, w, h * 0.38);
        // Grass highlight
        ctx.fillStyle = '#66BB6A';
        ctx.fillRect(x, y, w, h * 0.15);
        // Dirt texture lines
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + (w / 4) * (i + 0.5), y + h * 0.5, w * 0.15, h * 0.08);
        }
        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    },

    drawStoneTile(ctx, x, y, w, h) {
        ctx.fillStyle = '#78909C';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(x, y, w, h * 0.2);
        ctx.fillStyle = '#607D8B';
        ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
        // Cracks
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + w*0.2, y + h*0.3); ctx.lineTo(x + w*0.4, y + h*0.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w*0.6, y + h*0.2); ctx.lineTo(x + w*0.8, y + h*0.5); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    },

    drawBrickTile(ctx, x, y, w, h) {
        ctx.fillStyle = '#c0673a';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#d4795c';
        ctx.fillRect(x, y, w, h * 0.18);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        // Horizontal lines
        ctx.fillRect(x, y + h * 0.33, w, 2);
        ctx.fillRect(x, y + h * 0.66, w, 2);
        // Vertical lines (alternating)
        ctx.fillRect(x + w * 0.5, y, 2, h * 0.33);
        ctx.fillRect(x + w * 0.25, y + h * 0.33, 2, h * 0.33);
        ctx.fillRect(x + w * 0.75, y + h * 0.33, 2, h * 0.33);
        ctx.fillRect(x + w * 0.5, y + h * 0.66, 2, h * 0.34);
    },

    drawQuestionBlock(ctx, x, y, w, h, hit = false) {
        const base = hit ? '#8B6914' : '#f5a623';
        const top = hit ? '#a07820' : '#f5d020';
        ctx.fillStyle = base;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = top;
        ctx.fillRect(x, y, w, h * 0.2);
        ctx.fillStyle = hit ? '#7a5c10' : '#c47d0a';
        ctx.fillRect(x, y + h * 0.75, w, h * 0.25);

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

        if (!hit) {
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${h * 0.6}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', x + w / 2, y + h / 2 + 1);
        }
    },

    drawCoin(ctx, x, y, r, frame) {
        ctx.save();
        ctx.translate(x, y);
        const scaleX = Math.abs(Math.cos(frame * 0.1));

        ctx.scale(scaleX, 1);
        const grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
        grad.addColorStop(0, '#ffe066');
        grad.addColorStop(0.5, '#f5a623');
        grad.addColorStop(1, '#c47d0a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        if (scaleX > 0.3) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(-r * 0.25, -r * 0.25, r * 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#7a5000';
            ctx.font = `bold ${r * 1.0}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 2);
        }

        ctx.restore();
    },

    drawFlag(ctx, x, y, w, h, frame) {
        // Pole
        ctx.fillStyle = '#888';
        ctx.fillRect(x + w * 0.45, y, w * 0.1, h);

        // Flag cloth wave
        ctx.fillStyle = '#e74c3c';
        ctx.save();
        ctx.translate(x + w * 0.5, y + h * 0.05);
        const wave = Math.sin(frame * 0.1) * 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(w * 0.4 + wave, h * 0.08, w * 0.4, h * 0.22);
        ctx.quadraticCurveTo(w * 0.4 + wave, h * 0.3, 0, h * 0.38);
        ctx.closePath();
        ctx.fill();
        // Star on flag
        ctx.fillStyle = '#fff';
        ctx.font = `${h * 0.15}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('★', w * 0.2, h * 0.22);
        ctx.restore();

        // Flag ball top
        ctx.fillStyle = '#f5d020';
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y, w * 0.18, 0, Math.PI * 2);
        ctx.fill();
    },

    drawCheckpoint(ctx, x, y, w, h, active, frame) {
        // Pole
        ctx.fillStyle = '#888';
        ctx.fillRect(x + w * 0.45, y, w * 0.1, h);

        // Flag
        ctx.fillStyle = active ? '#4CAF50' : '#888';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y + h * 0.1);
        ctx.lineTo(x + w * 0.9, y + h * 0.2);
        ctx.lineTo(x + w * 0.5, y + h * 0.35);
        ctx.closePath();
        ctx.fill();

        if (active) {
            ctx.strokeStyle = 'rgba(76,175,80,0.5)';
            ctx.lineWidth = 2;
            const r = w * 0.5 + Math.sin(frame * 0.08) * 3;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    },

    drawStar(ctx, x, y, r, frame) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(frame * 0.04);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, '#f5d020');
        grad.addColorStop(1, '#f5a623');
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const ia = ((i * 4 + 2) * Math.PI / 5) - Math.PI / 2;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.lineTo(Math.cos(ia) * r * 0.4, Math.sin(ia) * r * 0.4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    // === Particle-style effects ===
    drawParticle(ctx, x, y, r, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    drawBackground(ctx, width, height, scrollX, scrollY) {
        // Sky gradient
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#1a1a7a');
        sky.addColorStop(0.4, '#3a6dc8');
        sky.addColorStop(0.7, '#6aacf0');
        sky.addColorStop(1, '#a0d8f0');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        // Clouds (parallax layer 1 - very slow)
        this._drawClouds(ctx, scrollX * 0.05, width, height);

        // Distant mountains (parallax layer 2)
        this._drawMountains(ctx, scrollX * 0.15, width, height);

        // Mid ground hills (parallax layer 3)
        this._drawHills(ctx, scrollX * 0.3, width, height);
    },

    _drawClouds(ctx, offsetX, width, height) {
        const clouds = [
            { x: 100, y: height * 0.12, scale: 1.2 },
            { x: 350, y: height * 0.08, scale: 0.9 },
            { x: 620, y: height * 0.15, scale: 1.5 },
            { x: 900, y: height * 0.1, scale: 1.0 },
            { x: 1200, y: height * 0.13, scale: 1.3 },
            { x: 1500, y: height * 0.07, scale: 0.8 },
        ];
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        clouds.forEach(c => {
            const cx = ((c.x - offsetX) % (width + 200)) - 100;
            const s = c.scale;
            ctx.save();
            ctx.translate(cx, c.y);
            ctx.scale(s, s);
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.arc(40, -15, 50, 0, Math.PI * 2);
            ctx.arc(90, 0, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    },

    _drawMountains(ctx, offsetX, width, height) {
        ctx.fillStyle = '#4a6fa5';
        const mpoints = [0, 120, 80, 200, 50, 300, 130, 400, 70, 500, 150, 600, 60, 700, 110, 800, 80];
        ctx.beginPath();
        ctx.moveTo(-offsetX % (width + 100) - 100, height * 0.65);

        let mx = -offsetX % (width * 1.5) - 200;
        const peaks = [
            { x: 0, y: 0.28 }, { x: 150, y: 0.32 }, { x: 280, y: 0.22 },
            { x: 420, y: 0.30 }, { x: 560, y: 0.25 }, { x: 700, y: 0.33 },
            { x: 850, y: 0.27 }, { x: 1000, y: 0.24 }, { x: 1150, y: 0.31 },
        ];
        ctx.moveTo(mx, height);
        peaks.forEach(p => {
            ctx.lineTo(mx + p.x, height * p.y);
        });
        ctx.lineTo(mx + 1300, height);
        ctx.lineTo(mx + 1300 + width, height);
        ctx.closePath();
        ctx.fill();

        // Snow caps
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        peaks.forEach(p => {
            ctx.beginPath();
            const px = mx + p.x;
            const py = height * p.y;
            ctx.moveTo(px, py);
            ctx.lineTo(px - 30, py + 40);
            ctx.lineTo(px + 30, py + 40);
            ctx.closePath();
            ctx.fill();
        });
    },

    _drawHills(ctx, offsetX, width, height) {
        const grad = ctx.createLinearGradient(0, height * 0.5, 0, height * 0.8);
        grad.addColorStop(0, '#2d6a2d');
        grad.addColorStop(1, '#1a4a1a');
        ctx.fillStyle = grad;

        const hx = -offsetX % (width * 1.2);
        ctx.beginPath();
        ctx.moveTo(hx - 50, height);
        ctx.bezierCurveTo(hx + 100, height * 0.55, hx + 200, height * 0.5, hx + 300, height * 0.62);
        ctx.bezierCurveTo(hx + 400, height * 0.55, hx + 500, height * 0.48, hx + 650, height * 0.60);
        ctx.bezierCurveTo(hx + 750, height * 0.55, hx + 900, height * 0.52, hx + 1050, height * 0.62);
        ctx.bezierCurveTo(hx + 1150, height * 0.55, hx + 1300, height * 0.50, hx + 1500, height * 0.60);
        ctx.lineTo(hx + 1500, height);
        ctx.closePath();
        ctx.fill();

        // Trees
        const treePositions = [50, 180, 350, 520, 700, 870, 1040, 1210, 1380];
        treePositions.forEach(tx => {
            const realX = ((hx + tx) % (width + 100)) - 50;
            this._drawTree(ctx, realX, height * 0.58, 0.7 + Math.random() * 0.4);
        });
    },

    _drawTree(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Trunk
        ctx.fillStyle = '#5c3317';
        ctx.fillRect(-6, 0, 12, 40);

        // Foliage layers
        [[0, 10, 30], [-15, -20, 35], [-10, -45, 28]].forEach(([ox, oy, r]) => {
            ctx.fillStyle = '#1b5e20';
            ctx.beginPath();
            ctx.arc(ox, oy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2e7d32';
            ctx.beginPath();
            ctx.arc(ox - 5, oy - 5, r * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    },
};

window.SpriteRenderer = SpriteRenderer;
