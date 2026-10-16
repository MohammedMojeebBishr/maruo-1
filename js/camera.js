/**
 * camera.js - Smooth camera system with bounds and parallax support
 */

class Camera {
    constructor(viewW, viewH) {
        this.x = 0;
        this.y = 0;
        this.viewW = viewW;
        this.viewH = viewH;
        this.worldW = 0;
        this.worldH = 0;
        this.smoothFactor = 0.1; // Lower = smoother
        this.targetX = 0;
        this.targetY = 0;
        this.shake = 0;
        this.shakeX = 0;
        this.shakeY = 0;
    }

    setBounds(worldW, worldH) {
        this.worldW = worldW;
        this.worldH = worldH;
    }

    follow(entity) {
        // Center on player with slight lead in direction of movement
        this.targetX = entity.x + entity.w / 2 - this.viewW / 2;
        this.targetY = entity.y + entity.h / 2 - this.viewH / 2;

        // Smooth lerp
        this.x += (this.targetX - this.x) * this.smoothFactor;
        this.y += (this.targetY - this.y) * this.smoothFactor;

        // Clamp to world bounds
        this.x = Math.max(0, Math.min(this.x, this.worldW - this.viewW));
        this.y = Math.max(0, Math.min(this.y, this.worldH - this.viewH));

        // Shake
        if (this.shake > 0) {
            this.shakeX = (Math.random() - 0.5) * this.shake;
            this.shakeY = (Math.random() - 0.5) * this.shake;
            this.shake *= 0.85;
            if (this.shake < 0.5) this.shake = 0;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }
    }

    startShake(intensity) {
        this.shake = intensity;
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(
            -Math.round(this.x) + this.shakeX,
            -Math.round(this.y) + this.shakeY
        );
    }

    restore(ctx) {
        ctx.restore();
    }

    // Check if entity is in view (for culling)
    inView(x, y, w, h, margin = 64) {
        return (
            x + w + margin > this.x &&
            x - margin < this.x + this.viewW &&
            y + h + margin > this.y &&
            y - margin < this.y + this.viewH
        );
    }

    resize(viewW, viewH) {
        this.viewW = viewW;
        this.viewH = viewH;
    }
}

window.Camera = Camera;
