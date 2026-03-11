export class StackManager {
    constructor(scene, owner) {
        this.scene = scene;
        this.owner = owner;
        this.items = [];
        this.collectionQueue = [];

        this.container = scene.add.container(owner.x, owner.y);
        // Depth is now managed dynamically in update() — no hardcoded value.

        this.itemSpacing = 8;
        this.animSpeed = 200;

        // Track last depth to avoid redundant setDepth calls every frame.
        this._lastDepth = null;
    }

    update() {
        // ── Position smoothing ───────────────────────────────────────────
        this.container.x = Phaser.Math.Linear(
            this.container.x, this.owner.x, 0.4
        );
        this.container.y = Phaser.Math.Linear(
            this.container.y, this.owner.y - 20, 0.4
        );

        // ── Dynamic depth sorting ────────────────────────────────────────
        this._updateDepth();
    }

    /**
     * Resolves the correct stack depth relative to the owner each frame.
     *
     * Facing BACK  (moving UP)    → stack is closer to camera than the player
     *                               (you see the back of their head + the stack
     *                                rising in front of them from our POV).
     *                               depth = owner.depth + 1
     *
     * Facing FRONT (moving DOWN)  → player body is closer to camera; stack is
     *                               behind them like a backpack.
     *                               depth = owner.depth - 1
     *
     * Facing LEFT / RIGHT         → stack sits behind the player silhouette.
     *                               depth = owner.depth - 1
     *
     * IDLE (no facingDir yet)     → default to FRONT behaviour (safe).
     */
    _updateDepth() {
        const dir = this.owner.facingDir; // e.g. 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT'
        const ownerDepth = this.owner.depth;

        const targetDepth =
            dir === 'BACK'
                ? ownerDepth + 1  // Stack visible above/in-front of back-of-head
                : ownerDepth - 1; // Stack hidden behind body (FRONT / LEFT / RIGHT)

        // Only call setDepth when the value actually changes — avoids
        // unnecessary render-list mutations every frame.
        if (targetDepth !== this._lastDepth) {
            this.container.setDepth(targetDepth);
            this._lastDepth = targetDepth;
        }
    }

    // ── Magnetism ────────────────────────────────────────────────────────

    processMagnetism(dropsGroup, radius) {
        if (!dropsGroup) return;

        const drops = dropsGroup.getChildren();
        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];
            if (drop.state !== 'idle') continue;

            const distance = Phaser.Math.Distance.Between(
                this.owner.x, this.owner.y,
                drop.x, drop.y
            );

            if (distance <= radius) {
                this.magnetize(drop);
            }
        }
    }

    magnetize(resourceSprite) {
        if (resourceSprite.state !== 'idle') return;

        resourceSprite.state = 'magnetized';
        this.scene.physics.world.disable(resourceSprite);
        this.scene.tweens.killTweensOf(resourceSprite);

        this.collectionQueue.push(resourceSprite);
        if (this.collectionQueue.length === 1) {
            this.processNextInQueue();
        }
    }

    // ── Stacking tweens ──────────────────────────────────────────────────

    processNextInQueue() {
        if (this.collectionQueue.length === 0) return;

        const nextItem = this.collectionQueue[0];
        nextItem.state = 'flying';

        const worldX = nextItem.x;
        const worldY = nextItem.y;
        this.container.add(nextItem);
        nextItem.x = worldX - this.container.x;
        nextItem.y = worldY - this.container.y;

        const stackIndex = this.items.length;
        nextItem.stackY = -(stackIndex * this.itemSpacing);

        // Phase 1 – pop up
        this.scene.tweens.add({
            targets: nextItem,
            y: nextItem.y - 30,
            duration: this.animSpeed * 0.4,
            ease: 'Sine.easeOut',
            onComplete: () => {
                // Phase 2 – arc to stack slot
                this.scene.tweens.add({
                    targets: nextItem,
                    x: 0,
                    y: nextItem.stackY,
                    duration: this.animSpeed * 0.6,
                    ease: 'Power2.easeOut',
                    onComplete: () => this.onStackTweenComplete(nextItem),
                });
            },
        });
    }

    onStackTweenComplete(itemSprite) {
        itemSprite.state = 'stacked';
        this.items.push(itemSprite);

        // Impact squash
        this.scene.tweens.add({
            targets: itemSprite,
            scaleY: 0.8,
            scaleX: 1.1,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeInOut',
        });

        this.collectionQueue.shift();
        this.processNextInQueue();
    }
}