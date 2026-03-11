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
        // PRIMARY — asymmetric slam bounce
        //   abs(sin) lifts items up then drops them hard back to stackY.
        //   Items never sink below stackY — only hop above it.
        this._bounceAmplitude = 18;      // px — vertical travel from stackY
        this._bounceFrequency = 0.006;   // ~2 slams/sec at walking pace
        this._bouncePhaseStep = 0.55;    // radians between consecutive items
        //
        // SECONDARY — horizontal instability
        this._swayAmplitude = 2;
        this._swayFrequency = 0.009;
        this._swayPhaseStep = 0.1;
        //
        // SHARED
        this._wobbleLerp = 0.22;   // snappy settle so items clack down crisply

        // ── Per-item state for impact detection ──────────────────────────
        this._prevOffsets = new WeakMap();

        // ── Spark tints — cool silver-white, hint of pale gold ────────────
        const SPARK_TINTS = [0xffffff, 0xeef5ff, 0xfff5cc, 0xffe8a0];

        // Left-shooting sparks (walking slam impact)
        this._sparkLeft = scene.add.particles(0, 0, 'particle_spark', {
            speed:    { min: 25, max: 65 },
            angle:    { min: 155, max: 205 },
            scale:    { start: 0.55, end: 0 },
            alpha:    { start: 0.75, end: 0 },
            tint:     SPARK_TINTS,
            lifespan: { min: 80,  max: 160 },
            gravityY: 60,
            emitting: false,
        });
        this._sparkLeft.setDepth(9999);

        // Right-shooting sparks (walking slam impact)
        this._sparkRight = scene.add.particles(0, 0, 'particle_spark', {
            speed:    { min: 25, max: 65 },
            angle:    { min: -25, max: 25 },
            scale:    { start: 0.55, end: 0 },
            alpha:    { start: 0.75, end: 0 },
            tint:     SPARK_TINTS,
            lifespan: { min: 80,  max: 160 },
            gravityY: 60,
            emitting: false,
        });
        this._sparkRight.setDepth(9999);

        // Delicate ring shimmer (new item landing on stack)
        this._landingEmitter = scene.add.particles(0, 0, 'particle_spark', {
            speed:    { min: 45, max: 60 },    // tight range → clean ring shape
            angle:    { min: 0,   max: 360 },
            scale:    { start: 0.75, end: 0 },
            alpha:    { start: 0.85, end: 0 },
            tint:     SPARK_TINTS,
            lifespan: { min: 200, max: 320 },
            gravityY: 15,
            emitting: false,
        });
        this._landingEmitter.setDepth(9999);
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
            let bounceOffset = 0;

            if (isMoving) {
                // ── Primary: asymmetric slam bounce ───────────────────────
                //
                // abs(sin) gives a shape that lifts to a peak then falls
                // back to zero — always non-negative, so the item only
                // hops ABOVE stackY and never sinks below it.
                // Negating maps positive values to upward screen movement.
                const bouncePhase =
                    time * this._bounceFrequency + i * this._bouncePhaseStep;

                bounceOffset =
                    -Math.abs(Math.sin(bouncePhase)) * this._bounceAmplitude;

                targetY = item.stackY + bounceOffset;

                // ── Secondary: horizontal instability ────────────────────
                const factor = count > 1 ? i / (count - 1) : 0;
                const swayPhase =
                    time * this._swayFrequency + i * this._swayPhaseStep;

                targetX =
                    Math.sin(swayPhase) * this._swayAmplitude * factor;
            } else {
                targetX = 0;
                targetY = item.stackY;
            }

            // ── Impact detection ─────────────────────────────────────────
            //
            // An item "slams" when it was airborne (offset < -1) last frame
            // and has now returned to rest (offset ≈ 0).
            const prevOffset = this._prevOffsets.get(item) ?? 0;
            const wasAirborne = prevOffset < -1;
            const nowResting  = bounceOffset > -1;

            if (isMoving && wasAirborne && nowResting) {
                this._onImpact(item);
            }

            this._prevOffsets.set(item, bounceOffset);

            item.x = Phaser.Math.Linear(item.x, targetX, this._wobbleLerp);
            item.y = Phaser.Math.Linear(item.y, targetY, this._wobbleLerp);
        }
    }

    // ── Walking slam impact ───────────────────────────────────────────────

    _onImpact(item) {
        // Micro-shake: gentle 1-frame jolt
        item.x += (Math.random() - 0.5) * 3;
        item.y += (Math.random() - 0.5) * 1.5;

        // Two fine sparks each side at the contact point
        const halfH = (item.displayHeight ?? this.itemSpacing) * 0.5;
        const worldX = this.container.x + item.x;
        const worldY = this.container.y + item.y + halfH;

        this._sparkLeft.emitParticleAt(worldX, worldY, 2);
        this._sparkRight.emitParticleAt(worldX, worldY, 2);
    }

    // ── New-item landing ring ─────────────────────────────────────────────

    _onLanding(item) {
        const worldX = this.container.x;
        const worldY = this.container.y + item.stackY;

        // Delicate ring shimmer — 10 particles, clean radial spread
        this._landingEmitter.emitParticleAt(worldX, worldY, 10);
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

        // Ring explosion at the landing point
        this._onLanding(itemSprite);

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