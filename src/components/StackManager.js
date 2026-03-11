import { ResourceAnimator } from '../utils/ResourceAnimator.js';

export class StackManager {
    constructor(scene, owner) {
        this.scene = scene;
        this.owner = owner;
        this.items = [];
        this.collectionQueue = [];

        this.container = scene.add.container(owner.x, owner.y);
        this._lastDepth = null;

        this.itemSpacing = 6;
        this.animSpeed = 200;

        // ── Backpack mount tuning ────────────────────────────────────────
        this.backpackOffsetX = 8;   // horizontal shift behind character
        this.backpackOffsetY = 6;   // lower the mount point to shoulders

        // ── Wobble config ────────────────────────────────────────────────
        this._bounceAmplitude = 18;
        this._bounceFrequency = 0.006;
        this._bouncePhaseStep = 0.55;

        this._swayAmplitude = 2;
        this._swayFrequency = 0.009;
        this._swayPhaseStep = 0.1;

        this._wobbleLerp = 0.22;

        this._prevOffsets = new WeakMap();

        const SPARK_TINTS = [0xffffff, 0xeef5ff, 0xfff5cc, 0xffe8a0];

        this._sparkLeft = scene.add.particles(0, 0, 'particle_spark', {
            speed: { min: 25, max: 65 },
            angle: { min: 155, max: 205 },
            scale: { start: 0.55, end: 0 },
            alpha: { start: 0.75, end: 0 },
            tint: SPARK_TINTS,
            lifespan: { min: 80, max: 160 },
            gravityY: 60,
            emitting: false,
        });
        this._sparkLeft.setDepth(9999);

        this._sparkRight = scene.add.particles(0, 0, 'particle_spark', {
            speed: { min: 25, max: 65 },
            angle: { min: -25, max: 25 },
            scale: { start: 0.55, end: 0 },
            alpha: { start: 0.75, end: 0 },
            tint: SPARK_TINTS,
            lifespan: { min: 80, max: 160 },
            gravityY: 60,
            emitting: false,
        });
        this._sparkRight.setDepth(9999);

        this._landingEmitter = scene.add.particles(0, 0, 'particle_spark', {
            speed: { min: 45, max: 60 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.75, end: 0 },
            alpha: { start: 0.85, end: 0 },
            tint: SPARK_TINTS,
            lifespan: { min: 200, max: 320 },
            gravityY: 15,
            emitting: false,
        });
        this._landingEmitter.setDepth(9999);
    }

    update(time, delta, isMoving) {
        const dir = this.owner.facingDir;

        // ── Resolve target position with view-dependent mount ────────────
        let targetX = this.owner.x;
        let targetY = this.owner.y - 20; // default: centered above head

        switch (dir) {
            case 'LEFT':
                // Facing left → back is to the right
                targetX += this.backpackOffsetX;
                targetY += this.backpackOffsetY;
                break;
            case 'RIGHT':
                // Facing right → back is to the left
                targetX -= this.backpackOffsetX;
                targetY += this.backpackOffsetY;
                break;
            // FRONT / BACK → no offset, stack sits centered above head
        }

        this.container.x = Phaser.Math.Linear(
            this.container.x,
            targetX,
            0.4
        );
        this.container.y = Phaser.Math.Linear(
            this.container.y,
            targetY,
            0.4
        );

        this._updateDepth();
        this._updateWobble(time, isMoving);
    }

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

    _updateWobble(time, isMoving) {
        const count = this.items.length;

        for (let i = 0; i < count; i++) {
            const item = this.items[i];

            if (item.state !== 'stacked') continue;

            let targetX;
            let targetY;
            let bounceOffset = 0;

            if (isMoving) {
                const bouncePhase =
                    time * this._bounceFrequency +
                    i * this._bouncePhaseStep;

                bounceOffset =
                    -Math.abs(Math.sin(bouncePhase)) *
                    this._bounceAmplitude;

                targetY = item.stackY + bounceOffset;

                const factor = count > 1 ? i / (count - 1) : 0;
                const swayPhase =
                    time * this._swayFrequency +
                    i * this._swayPhaseStep;

                targetX =
                    Math.sin(swayPhase) * this._swayAmplitude * factor;
            } else {
                targetX = 0;
                targetY = item.stackY;
            }

            const prevOffset = this._prevOffsets.get(item) ?? 0;
            const wasAirborne = prevOffset < -1;
            const nowResting = bounceOffset > -1;

            if (isMoving && wasAirborne && nowResting) {
                this._onImpact(item);
            }

            this._prevOffsets.set(item, bounceOffset);

            item.x = Phaser.Math.Linear(
                item.x,
                targetX,
                this._wobbleLerp
            );
            item.y = Phaser.Math.Linear(
                item.y,
                targetY,
                this._wobbleLerp
            );
        }
    }

    _onImpact(item) {
        item.x += (Math.random() - 0.5) * 3;
        item.y += (Math.random() - 0.5) * 1.5;

        const halfH = (item.displayHeight ?? this.itemSpacing) * 0.5;
        const worldX = this.container.x + item.x;
        const worldY = this.container.y + item.y + halfH;

        this._sparkLeft.emitParticleAt(worldX, worldY, 2);
        this._sparkRight.emitParticleAt(worldX, worldY, 2);
    }

    _onLanding(item) {
        const worldX = this.container.x;
        const worldY = this.container.y + item.stackY;

        this._landingEmitter.emitParticleAt(worldX, worldY, 10);
    }

    processMagnetism(dropsGroup, radius) {
        if (!dropsGroup) return;

        const drops = dropsGroup.getChildren();
        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];
            if (drop.state !== 'idle') continue;

            const dist = Phaser.Math.Distance.Between(
                this.owner.x,
                this.owner.y,
                drop.x,
                drop.y
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

        // --- Extracted to ResourceAnimator ---
        ResourceAnimator.flyTo(item, { x: 0, y: item.stackY }, {
            duration: this.animSpeed,
            onComplete: () => this.onStackTweenComplete(item),
        });
    }

    onStackTweenComplete(itemSprite) {
        itemSprite.state = 'stacked';
        this.items.push(itemSprite);

        itemSprite.scaleX = 1;
        itemSprite.scaleY = 1;

        this._onLanding(itemSprite);

        // --- Extracted to ResourceAnimator ---
        ResourceAnimator.playImpact(itemSprite);

        this.collectionQueue.shift();
        this.processNextInQueue();
    }
    popFromStack(resourceKey = null) {
        if (this.items.length === 0) return null;

        let index = -1;
        if (!resourceKey) {
            index = this.items.length - 1;
        } else {
            for (let i = this.items.length - 1; i >= 0; i--) {
                if (this.items[i].texture.key === resourceKey) {
                    index = i;
                    break;
                }
            }
        }

        if (index === -1) return null;

        const item = this.items.splice(index, 1)[0];

        // Convert local position to world position before detaching
        const worldPos = new Phaser.Math.Vector2();
        this.container.getWorldTransformMatrix().transformPoint(item.x, item.y, worldPos);

        this.container.remove(item);
        item.x = worldPos.x;
        item.y = worldPos.y;

        // Items removed from stack should reset their state
        item.state = 'idle';

        return item;
    }
}