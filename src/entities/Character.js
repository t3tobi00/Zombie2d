import { StackManager } from '../components/StackManager.js';

/** Direction enum used throughout the character system. */
export const DIR = Object.freeze({
    FRONT: 'FRONT',
    BACK: 'BACK',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
});

/**
 * Character – base class.
 *
 * Layer z-order (index 0 = bottom, drawn first):
 *   0  hairBack
 *   1  backpackStrap
 *   2  legLeft
 *   3  legRight
 *   4  torso
 *   5  head
 *   6  faceOverlay
 *   7  hairFront
 *   8  hairSide
 */
export class Character extends Phaser.GameObjects.Container {
    constructor(scene, x, y, textureKey = 'player') {
        super(scene, x, y);

        this._buildSprites(scene, textureKey);
        this._registerWithScene(scene);

        this._walkPhase = 0;
        this.facingDir = DIR.FRONT;

        this._applyDirectionState(DIR.FRONT, true);
    }

    _buildSprites(scene, textureKey) {
        const k = textureKey;

        this.hairBack = scene.add
            .sprite(0, -20, 'hair_back')
            .setOrigin(0.5, 0.5);

        // Backpack strap — thin, dark band on the trailing shoulder.
        // Uses torso texture scaled way down so no new asset needed.
        this.backpackStrap = scene.add
            .sprite(0, 0, 'torso_player')
            .setOrigin(0.5, 0.5)
            .setScale(0.18, 0.45)
            .setTint(0x5a4e3e)
            .setAlpha(0);

        this.legLeft = scene.add
            .sprite(-7, 12, `leg_${k}`)
            .setOrigin(0.5, 0);
        this.legRight = scene.add
            .sprite(7, 12, `leg_${k}`)
            .setOrigin(0.5, 0);

        this.torso = scene.add
            .sprite(0, 4, 'torso_player')
            .setOrigin(0.5, 0.5);

        this.head = scene.add
            .sprite(0, -16, 'head_player')
            .setOrigin(0.5, 0.5);

        this.faceOverlay = scene.add
            .sprite(0, -16, 'face_front')
            .setOrigin(0.5, 0.5);

        this.hairFront = scene.add
            .sprite(0, -30, 'hair_front')
            .setOrigin(0.5, 0.5);

        this.hairSide = scene.add
            .sprite(0, -20, 'hair_side')
            .setOrigin(0.5, 0.5);

        this.add([
            this.hairBack,      // 0
            this.backpackStrap, // 1
            this.legLeft,       // 2
            this.legRight,      // 3
            this.torso,         // 4
            this.head,          // 5
            this.faceOverlay,   // 6
            this.hairFront,     // 7
            this.hairSide,      // 8
        ]);
    }

    _registerWithScene(scene) {
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setSize(26, 36).setOffset(-13, -18);
        this.body.setCollideWorldBounds(true);
        this.rotation = 0;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────

    updateFacing(velocity, time, delta) {
        const isMoving = velocity.lengthSq() > 0;

        if (isMoving) {
            const newDir = this._resolveDir(velocity);
            if (newDir !== this.facingDir) {
                this.facingDir = newDir;
                this._applyDirectionState(newDir, false);
            }
        }

        this._animateWalking(isMoving, delta);
    }

    _resolveDir(vel) {
        if (Math.abs(vel.x) > Math.abs(vel.y) * 1.15) {
            return vel.x > 0 ? DIR.RIGHT : DIR.LEFT;
        }
        return vel.y > 0 ? DIR.FRONT : DIR.BACK;
    }

    // ─────────────────────────────────────────────────────────────────────
    // State configuration
    // ─────────────────────────────────────────────────────────────────────

    _getStateConfig(dir) {
        const isRight = dir === DIR.RIGHT;

        switch (dir) {
            case DIR.FRONT:
                return {
                    zOrder: 'front',
                    torso: { scaleX: 1 },
                    head: { x: 0, scaleX: 1 },
                    faceOverlay: {
                        x: 0,
                        alpha: 1,
                        texture: 'face_front',
                        scaleX: 1,
                    },
                    hairBack: { alpha: 0.55 },
                    hairFront: { alpha: 1 },
                    hairSide: { alpha: 0 },
                    backpackStrap: { alpha: 0, x: 0 },
                    legLeft: { x: -7, alpha: 1 },
                    legRight: { x: 7, alpha: 1 },
                };

            case DIR.BACK:
                return {
                    zOrder: 'back',
                    torso: { scaleX: 1 },
                    head: { x: 0, scaleX: 1 },
                    faceOverlay: {
                        x: 0,
                        alpha: 0,
                        texture: 'face_front',
                        scaleX: 1,
                    },
                    hairBack: { alpha: 1 },
                    hairFront: { alpha: 0 },
                    hairSide: { alpha: 0 },
                    backpackStrap: { alpha: 0, x: 0 },
                    legLeft: { x: -7, alpha: 1 },
                    legRight: { x: 7, alpha: 1 },
                };

            case DIR.LEFT:
            case DIR.RIGHT: {
                // fwd = +1 when facing right, -1 when facing left
                const fwd = isRight ? 1 : -1;

                return {
                    zOrder: 'side',
                    // ── Subtle narrowing — NOT paper-thin ────────────
                    torso: { scaleX: 0.5 },
                    // Head nudged only 3px forward — just enough to
                    // break symmetry without detaching from body
                    head: { x: fwd * 3, scaleX: 0.92 },
                    // Eye sits ~2px ahead of head center — clearly
                    // "facing that way" but still ON the face
                    faceOverlay: {
                        x: fwd * 5,
                        alpha: 0.95,
                        texture: 'face_side',
                        scaleX: isRight ? 1 : -1,
                    },
                    hairBack: { alpha: 0 },
                    hairFront: { alpha: 0 },
                    hairSide: {
                        alpha: 1,
                        _immScaleX: isRight ? -1 : 1,
                    },
                    // Strap on the TRAILING shoulder (where stack will sit)
                    backpackStrap: { alpha: 0.75, x: fwd * -5 },
                    legLeft: {
                        x: isRight ? -2 : 2,
                        alpha: isRight ? 0.45 : 1,
                    },
                    legRight: {
                        x: isRight ? 2 : -2,
                        alpha: isRight ? 1 : 0.45,
                    },
                };
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // State application
    // ─────────────────────────────────────────────────────────────────────

    _applyDirectionState(dir, instant = false) {
        const cfg = this._getStateConfig(dir);
        const duration = instant ? 0 : 160;
        const ease = 'Sine.easeInOut';

        const allParts = [
            this.torso,
            this.head,
            this.faceOverlay,
            this.hairBack,
            this.hairFront,
            this.hairSide,
            this.backpackStrap,
            this.legLeft,
            this.legRight,
        ];
        this.scene.tweens.killTweensOf(allParts);

        this.faceOverlay.setTexture(cfg.faceOverlay.texture);
        this.faceOverlay.scaleX = cfg.faceOverlay.scaleX;

        if (cfg.hairSide._immScaleX !== undefined) {
            this.hairSide.scaleX = cfg.hairSide._immScaleX;
        }

        this._reorderLayers(cfg.zOrder);

        const parts = [
            [this.torso, cfg.torso],
            [this.head, cfg.head],
            [this.faceOverlay, cfg.faceOverlay],
            [this.hairBack, cfg.hairBack],
            [this.hairFront, cfg.hairFront],
            [this.hairSide, cfg.hairSide],
            [this.backpackStrap, cfg.backpackStrap],
            [this.legLeft, cfg.legLeft],
            [this.legRight, cfg.legRight],
        ];

        for (const [sprite, props] of parts) {
            const tweenProps = Object.fromEntries(
                Object.entries(props).filter(
                    ([k]) => !k.startsWith('_')
                )
            );

            if (instant || duration === 0) {
                Object.assign(sprite, tweenProps);
            } else {
                this.scene.tweens.add({
                    targets: sprite,
                    ...tweenProps,
                    duration,
                    ease,
                });
            }
        }
    }

    _reorderLayers(viewType) {
        switch (viewType) {
            case 'front':
            case 'side':
                this.moveTo(this.hairBack, 0);
                this.moveTo(this.backpackStrap, 1);
                break;
            case 'back':
                this.bringToTop(this.hairBack);
                break;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Walk animation
    // ─────────────────────────────────────────────────────────────────────

    _animateWalking(isMoving, delta) {
        const phaseSpeed = 0.007;

        if (isMoving) {
            this._walkPhase += delta * phaseSpeed;
        } else {
            this._walkPhase = Phaser.Math.Linear(
                this._walkPhase,
                0,
                0.12
            );
        }

        const phase = this._walkPhase;
        const strideY = 5;
        const strideX = 2;
        const bodyBob = 1;

        if (
            this.facingDir === DIR.FRONT ||
            this.facingDir === DIR.BACK
        ) {
            const base = 12;
            this.legLeft.y = base + Math.sin(phase) * strideY;
            this.legRight.y =
                base + Math.sin(phase + Math.PI) * strideY;

            this.legLeft.x = Phaser.Math.Linear(
                this.legLeft.x,
                -7 + Math.sin(phase) * strideX,
                0.3
            );
            this.legRight.x = Phaser.Math.Linear(
                this.legRight.x,
                7 + Math.sin(phase + Math.PI) * strideX,
                0.3
            );

            const bobOffset =
                Math.abs(Math.sin(phase)) * bodyBob;
            this.torso.y = 4 - bobOffset;
            this.head.y = -16 - bobOffset;
            this.faceOverlay.y = -16 - bobOffset;
            this.hairFront.y = -30 - bobOffset;
            this.hairBack.y = -20 - bobOffset;
        } else {
            const base = 12;
            this.legLeft.y = base + Math.sin(phase) * strideY;
            this.legRight.y =
                base + Math.sin(phase + Math.PI) * strideY;

            const leadScale =
                1 + Math.max(0, Math.sin(phase)) * 0.15;
            const trailScale =
                1 - Math.max(0, Math.sin(phase)) * 0.08;

            if (this.facingDir === DIR.RIGHT) {
                this.legRight.scaleX = leadScale;
                this.legLeft.scaleX = trailScale;
            } else {
                this.legLeft.scaleX = leadScale;
                this.legRight.scaleX = trailScale;
            }

            const bobOffset =
                Math.abs(Math.sin(phase * 2)) * bodyBob;
            this.torso.y = 4 - bobOffset;
            this.head.y = -16 - bobOffset;
            this.faceOverlay.y = -16 - bobOffset;
            this.hairSide.y = -20 - bobOffset;
            this.backpackStrap.y = 0 - bobOffset;
        }

        if (!isMoving) {
            this.legLeft.scaleX = 1;
            this.legRight.scaleX = 1;
        }
    }
}