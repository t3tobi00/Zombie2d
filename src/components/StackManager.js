export class StackManager {
    constructor(scene, owner) {
        this.scene = scene;
        this.owner = owner;
        this.items = [];
        this.collectionQueue = [];

        this.container = scene.add.container(owner.x, owner.y);
        this._lastDepth = null;

        this.itemSpacing = 16;
        this.animSpeed = 200;

        // ── Wobble config ────────────────────────────────────────────────
        //
        // PRIMARY — vertical accordion/clack
        //   Each item bounces up then compresses back to stackY.
        //   The phase offset per index makes the wave ripple bottom → top,
        //   briefly opening and closing the gap between neighbours.
        this._bounceAmplitude = 12;      // px — vertical travel from stackY
        this._bounceFrequency = 0.001; // sine speed — tune to match walk cadence
        this._bouncePhaseStep = 0.55;   // radians between consecutive items
        //
        // SECONDARY — horizontal instability
        //   Represents the natural lean of a tall, unbalanced column.
        //   Kept deliberately tiny so it reads as physics, not animation.
        this._swayAmplitude = 2;    // px — absolute max, applied only to top item
        this._swayFrequency = 0.009;  // independent, slower than bounce
        this._swayPhaseStep = 0.1;   // radians per item
        //
        // SHARED
        this._wobbleLerp = 0.1;   // lerp coefficient — controls settle speed
    }

    // isMoving is supplied by the caller (Player already knows its velocity).
    update(time, delta, isMoving) {
        // ── Container tracks owner ───────────────────────────────────────
        this.container.x = Phaser.Math.Linear(
            this.container.x, this.owner.x, 0.4
        );
        this.container.y = Phaser.Math.Linear(
            this.container.y, this.owner.y - 20, 0.4
        );

        this._updateDepth();
        this._updateWobble(time, isMoving);
    }

    // ── Depth sorting ────────────────────────────────────────────────────

    _updateDepth() {
        const dir = this.owner.facingDir;
        const targetDepth =
            dir === 'BACK'
                ? this.owner.depth + 1
                : this.owner.depth - 1;

        if (targetDepth !== this._lastDepth) {
            this.container.setDepth(targetDepth);
            this._lastDepth = targetDepth;
        }
    }

    // ── Procedural wobble ────────────────────────────────────────────────

    _updateWobble(time, isMoving) {
        const count = this.items.length;

        for (let i = 0; i < count; i++) {
            const item = this.items[i];

            // Never fight an in-flight collection tween.
            if (item.state !== 'stacked') continue;

            let targetX;
            let targetY;

            if (isMoving) {
                // ── Primary: vertical accordion ──────────────────────────
                //
                // Each item i has its phase shifted forward by _bouncePhaseStep
                // radians.  This makes item 0 peak first, then item 1 slightly
                // later, and so on — a kinetic ripple travelling up the stack.
                //
                // At sine peak  (+1): item moves UP   → gap to item above opens
                // At sine trough(-1): item moves DOWN → item compresses toward stackY
                //
                // The result is items briefly clacking apart then snapping back,
                // like a column of coins struck from below.
                const bouncePhase =
                    time * this._bounceFrequency + i * this._bouncePhaseStep;

                // Negate: positive sine → negative Y offset → upward in screen space.
                const bounceOffset =
                    -Math.sin(bouncePhase) * this._bounceAmplitude;

                targetY = item.stackY + bounceOffset;

                // ── Secondary: horizontal instability ────────────────────
                //
                // factor = 0 at the base (rigid anchor), 1 at the apex.
                // A single-item stack always gets factor 0 — no sway at all.
                const factor = count > 1 ? i / (count - 1) : 0;

                const swayPhase =
                    time * this._swayFrequency + i * this._swayPhaseStep;

                targetX =
                    Math.sin(swayPhase) * this._swayAmplitude * factor;
            } else {
                // ── Idle: return to canonical rest positions ──────────────
                targetX = 0;
                targetY = item.stackY;
            }

            item.x = Phaser.Math.Linear(item.x, targetX, this._wobbleLerp);
            item.y = Phaser.Math.Linear(item.y, targetY, this._wobbleLerp);
        }
    }

    // ── Magnetism ────────────────────────────────────────────────────────

    processMagnetism(dropsGroup, radius) {
        if (!dropsGroup) return;

        const drops = dropsGroup.getChildren();
        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];
            if (drop.state !== 'idle') continue;

            const dist = Phaser.Math.Distance.Between(
                this.owner.x, this.owner.y,
                drop.x, drop.y
            );

            if (dist <= radius) this.magnetize(drop);
        }
    }

    magnetize(resourceSprite) {
        if (resourceSprite.state !== 'idle') return;

        resourceSprite.state = 'magnetized';
        this.scene.physics.world.disable(resourceSprite);
        this.scene.tweens.killTweensOf(resourceSprite);

        this.collectionQueue.push(resourceSprite);
        if (this.collectionQueue.length === 1) this.processNextInQueue();
    }

    // ── Collection animation ─────────────────────────────────────────────

    processNextInQueue() {
        if (this.collectionQueue.length === 0) return;

        const item = this.collectionQueue[0];
        item.state = 'flying';

        const worldX = item.x;
        const worldY = item.y;
        this.container.add(item);
        item.x = worldX - this.container.x;
        item.y = worldY - this.container.y;

        const stackIndex = this.items.length;
        item.stackY = -(stackIndex * this.itemSpacing);

        // Phase 1 — pop-up squash
        this.scene.tweens.add({
            targets: item,
            y: item.y - 30,
            scaleY: 0.75,
            duration: this.animSpeed * 0.3,
            ease: 'Sine.easeOut',
            onComplete: () => this._startArcPhase(item),
        });
    }

    _startArcPhase(item) {
        const arcDuration = this.animSpeed * 0.7;

        // Phase 2a — arc to stack slot
        this.scene.tweens.add({
            targets: item,
            x: 0,
            y: item.stackY,
            duration: arcDuration,
            ease: 'Power2.easeInOut',
            onComplete: () => this.onStackTweenComplete(item),
        });

        // Phase 2b — flip (parallel with arc)
        this.scene.tweens.add({
            targets: item,
            scaleX: -1,
            scaleY: 1,
            duration: arcDuration * 0.5,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: item,
                    scaleX: 1,
                    duration: arcDuration * 0.5,
                    ease: 'Sine.easeOut',
                });
            },
        });
    }

    // ── Impact squash-and-stretch ─────────────────────────────────────────

    onStackTweenComplete(itemSprite) {
        itemSprite.state = 'stacked';
        this.items.push(itemSprite);

        itemSprite.scaleX = 1;
        itemSprite.scaleY = 1;

        // Beat 1 — hard squash
        this.scene.tweens.add({
            targets: itemSprite,
            scaleX: 1.4,
            scaleY: 0.55,
            duration: 55,
            ease: 'Quad.easeOut',
            onComplete: () => {
                // Beat 2 — overshoot stretch
                this.scene.tweens.add({
                    targets: itemSprite,
                    scaleX: 0.82,
                    scaleY: 1.25,
                    duration: 75,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        // Beat 3 — elastic settle
                        this.scene.tweens.add({
                            targets: itemSprite,
                            scaleX: 1,
                            scaleY: 1,
                            duration: 160,
                            ease: 'Elastic.easeOut',
                        });
                    },
                });
            },
        });

        this.collectionQueue.shift();
        this.processNextInQueue();
    }
}