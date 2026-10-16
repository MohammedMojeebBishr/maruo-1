/**
 * collision.js - Efficient AABB collision detection
 */

const Collision = {
    /**
     * Check if two axis-aligned rectangles overlap
     */
    rectRect(a, b) {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    },

    /**
     * Resolve collision between a moving entity and a static tile.
     * Returns collision flags.
     */
    resolveTile(entity, tile) {
        const overlapX = Math.min(entity.x + entity.w, tile.x + tile.w) - Math.max(entity.x, tile.x);
        const overlapY = Math.min(entity.y + entity.h, tile.y + tile.h) - Math.max(entity.y, tile.y);

        if (overlapX <= 0 || overlapY <= 0) return { hit: false };

        let side = '';
        if (overlapY < overlapX) {
            if (entity.y + entity.h / 2 < tile.y + tile.h / 2) {
                entity.y = tile.y - entity.h;
                side = 'bottom';
            } else {
                entity.y = tile.y + tile.h;
                side = 'top';
            }
            entity.vy = 0;
        } else {
            if (entity.x + entity.w / 2 < tile.x + tile.w / 2) {
                entity.x = tile.x - entity.w;
                side = 'right';
            } else {
                entity.x = tile.x + tile.w;
                side = 'left';
            }
            entity.vx = 0;
        }
        return { hit: true, side };
    },

    /**
     * Check if player is stomping on an enemy (attack from above)
     */
    isStomping(player, enemy) {
        const prevBottom = player.y + player.h - player.vy;
        const enemyTop = enemy.y;
        const overlapX = player.x + player.w > enemy.x + 4 && player.x < enemy.x + enemy.w - 4;
        return (
            overlapX &&
            prevBottom <= enemyTop + 6 &&
            player.y + player.h >= enemyTop &&
            player.vy >= 0
        );
    },

    /**
     * Circle vs Rectangle (for items)
     */
    circleRect(cx, cy, cr, rect) {
        const nearX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
        const nearY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
        const dx = cx - nearX;
        const dy = cy - nearY;
        return dx * dx + dy * dy < cr * cr;
    }
};

window.Collision = Collision;
