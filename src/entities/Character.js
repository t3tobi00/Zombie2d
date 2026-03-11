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
 * Manages ALL visuals and procedural animation.
 * Contains ZERO game-logic knowledge (no input, no enemies).
 *
 * Layer z-order (index 0 = bottom, drawn first):
 *   0  hairBack
 *   1  legLeft
 *   2  legRight
 *   3  torso
 *   4  head
 *   5  faceOverlay
 *   6  hairFront
 *   7  hairSide
 */
export class Character extends Phaser.GameObjects.Container {
    // ─────────────────────────────────────────────────────────────────────
    // Construction
    // ─────────────────────────────────────────────────────────────────────

    constructor(scene, x, y, textureKey = 'player') {
        super(scene, x, y);

        this._buildSprites(scene, textureKey);
        this._registerWithScene(scene);

        /** Walk-cycle phase accumulator (radians). */
        this._walkPhase = 0;

        /** Currently active direction state. */
        this.facingDir = DIR.FRONT;

        // Apply initial state without tweening.
        this._applyDirectionState(DIR.FRONT, true);
    }

    _buildSprites(scene, textureKey) {
        const k = textureKey; // shorthand

        // Back-of-head hair (sits BEHIND head in FRONT view; ON TOP in BACK view)
        this.hairBack = scene.add
            .sprite(0, -20, 'hair_back')
            .setOrigin(0.5, 0.5);

        // Legs – origin at top-center so y-offset drives stride cleanly
        this.legLeft = scene.add
            .sprite(-7, 12, `leg_${k}`)
            .setOrigin(0.5, 0);
        this.legRight = scene.add
            .sprite(7, 12, `leg_${k}`)
            .setOrigin(0.5, 0);

        // Torso
        this.torso = scene.add
            .sprite(0, 4, 'torso_player')
            .setOrigin(0.5, 0.5);

        // Head circle
        this.head = scene.add
            .sprite(0, -16, 'head_player')
            .setOrigin(0.5, 0.5);

        // Face overlay – swaps between 'face_front' and 'face_side'
        this.faceOverlay = scene.add
            .sprite(0, -16, 'face_front')
            .setOrigin(0.5, 0.5);

        // Top-of-head tuft (FRONT view only)
        this.hairFront = scene.add
            .sprite(0, -30, 'hair_front')
            .setOrigin(0.5, 0.5);

        // Side-profile hair crescent (LEFT / RIGHT views)
        this.hairSide = scene.add
            .sprite(0, -20, 'hair_side')
            .setOrigin(0.5, 0.5);

        // Add in z-order (bottom → top)
        this.add([
            this.hairBack,   // 0
            this.legLeft,    // 1
            this.legRight,   // 2
            this.torso,      // 3
            this.head,       // 4
            this.faceOverlay,// 5
            this.hairFront,  // 6
            this.hairSide,   // 7
        ]);
    }

    _registerWithScene(scene) {
        scene.add.existing(this);
        scene.physics.add.existing(this);
        // Hitbox slightly narrower than the visual for good feel
        this.body.setSize(26, 36).setOffset(-13, -18);
        this.body.setCollideWorldBounds(true);
        // CRITICAL: the container itself must NEVER rotate.
        this.rotation = 0;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Public API – called by Player (or Bot) every frame
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Feed the raw velocity vector.
     * Character resolves the correct direction state and updates animation.
     *
     * @param {Phaser.Math.Vector2} velocity
     * @param {number} time   – scene time (ms)
     * @param {number} delta  – frame delta (ms)
     */
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

    // ─────────────────────────────────────────────────────────────────────
    // Direction resolution
    // ─────────────────────────────────────────────────────────────────────

    _resolveDir(vel) {
        // Horizontal wins when |x| decisively beats |y|; adds a small
        // threshold to avoid flickering on pure-diagonal inputs.
        if (Math.abs(vel.x) > Math.abs(vel.y) * 1.15) {
            return vel.x > 0 ? DIR.RIGHT : DIR.LEFT;
        }
        return vel.y > 0 ? DIR.FRONT : DIR.BACK;
    }

    // ─────────────────────────────────────────────────────────────────────
    // State configuration table
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Returns the target visual properties for each direction state.
     * All values describe the DESIRED end-state of the tween.
     */
    _getStateConfig(dir) {
        const isRight = dir === DIR.RIGHT;

        switch (dir) {
            case DIR.FRONT:
                return {
                    zOrder: 'front',
                    torso: { scaleX: 1 },
                    head: { x: 0, scaleX: 1 },
                    faceOverlay: { x: 0, alpha: 1, texture: 'face_front', scaleX: 1 },
                    hairBack: { alpha: 0.55 }, // subtle halo behind head
                    hairFront: { alpha: 1 },
                    hairSide: { alpha: 0 },
                    legLeft: { x: -7, alpha: 1 },
                    legRight: { x: 7, alpha: 1 },
                };

            case DIR.BACK:
                return {
                    zOrder: 'back',
                    torso: { scaleX: 1 },
                    head: { x: 0, scaleX: 1 },
                    faceOverlay: { x: 0, alpha: 0, texture: 'face_front', scaleX: 1 },
                    hairBack: { alpha: 1 }, // covers the full head
                    hairFront: { alpha: 0 },
                    hairSide: { alpha: 0 },
                    legLeft: { x: -7, alpha: 1 },
                    legRight: { x: 7, alpha: 1 },
                };

            case DIR.LEFT:
            case DIR.RIGHT:
                return {
                    zOrder: 'side',
                    torso: { scaleX: 0.48 },
                    head: { x: isRight ? 5 : -5, scaleX: 1 },
                    faceOverlay: {
                        x: isRight ? 5 : -5,
                        alpha: 0.95,
                        texture: 'face_side',
                        scaleX: isRight ? 1 : -1,
                    },
                    hairBack: { alpha: 0 },
                    hairFront: { alpha: 0 },
                    hairSide: {
                        alpha: 1,
                        // scaleX flip is applied immediately (not tweened)
                        _immScaleX: isRight ? -1 : 1,
                    },
                    // Both legs collapse toward center; back leg dims.
                    legLeft: { x: isRight ? -2 : 2, alpha: isRight ? 0.45 : 1 },
                    legRight: { x: isRight ? 2 : -2, alpha: isRight ? 1 : 0.45 },
                };
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // State application (instant or tweened)
    // ─────────────────────────────────────────────────────────────────────

    _applyDirectionState(dir, instant = false) {
        const cfg = this._getStateConfig(dir);
        const duration = instant ? 0 : 160;
        const ease = 'Sine.easeInOut';

        // Kill in-flight tweens so they don't fight the new ones.
        const allParts = [
            this.torso, this.head, this.faceOverlay,
            this.hairBack, this.hairFront, this.hairSide,
            this.legLeft, this.legRight,
        ];
        this.scene.tweens.killTweensOf(allParts);

        // 1. Texture swaps must happen before tweening alpha in.
        this.faceOverlay.setTexture(cfg.faceOverlay.texture);
        this.faceOverlay.scaleX = cfg.faceOverlay.scaleX;

        if (cfg.hairSide._immScaleX !== undefined) {
            this.hairSide.scaleX = cfg.hairSide._immScaleX;
        }

        // 2. Reorder z-layers to match the new view.
        this._reorderLayers(cfg.zOrder);

        // 3. Tween (or snap) every part.
        const parts = [
            [this.torso, cfg.torso],
            [this.head, cfg.head],
            [this.faceOverlay, cfg.faceOverlay],
            [this.hairBack, cfg.hairBack],
            [this.hairFront, cfg.hairFront],
            [this.hairSide, cfg.hairSide],
            [this.legLeft, cfg.legLeft],
            [this.legRight, cfg.legRight],
        ];

        for (const [sprite, props] of parts) {
            // Strip any internal-only keys before passing to Phaser.
            const tweenProps = Object.fromEntries(
                Object.entries(props).filter(([k]) => !k.startsWith('_'))
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

    /**
     * Moves children within the container to produce correct z-ordering
     * for each camera-facing direction.
     */
    _reorderLayers(viewType) {
        switch (viewType) {
            // hairBack sits BEHIND the head (index 0)
            case 'front':
            case 'side':
                this.moveTo(this.hairBack, 0);
                break;

            // hairBack sits ON TOP of the head (last index)
            case 'back':
                this.bringToTop(this.hairBack);
                break;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Walk animation
    // ─────────────────────────────────────────────────────────────────────

    _animateWalking(isMoving, delta) {
        // Accumulate phase at a speed proportional to time
        const phaseSpeed = 0.007; // radians per ms

        if (isMoving) {
            this._walkPhase += delta * phaseSpeed;
        } else {
            // Smoothly decay phase back to rest (legs center)
            this._walkPhase = Phaser.Math.Linear(this._walkPhase, 0, 0.12);
        }

        const phase = this._walkPhase;
        const strideY = 5;  // vertical leg swing amplitude
        const strideX = 2;  // lateral leg sway for FRONT/BACK views
        const bodyBob = 1;  // how much the whole torso/head bobs

        if (
            this.facingDir === DIR.FRONT ||
            this.facingDir === DIR.BACK
        ) {
            // Standard walk: legs swing fore/aft (simulated by y-offset)
            const base = 12; // leg origin y
            this.legLeft.y = base + Math.sin(phase) * strideY;
            this.legRight.y = base + Math.sin(phase + Math.PI) * strideY;

            // Slight lateral sway for visual polish
            this.legLeft.x = Phaser.Math.Linear(
                this.legLeft.x, -7 + Math.sin(phase) * strideX, 0.3
            );
            this.legRight.x = Phaser.Math.Linear(
                this.legRight.x, 7 + Math.sin(phase + Math.PI) * strideX, 0.3
            );

            // Body bobs up/down on every full stride
            const bobOffset = Math.abs(Math.sin(phase)) * bodyBob;
            this.torso.y = 4 - bobOffset;
            this.head.y = -16 - bobOffset;
            this.faceOverlay.y = -16 - bobOffset;
            this.hairFront.y = -30 - bobOffset;
            this.hairBack.y = -20 - bobOffset;
        } else {
            // Side-profile walk: legs "pass through" each other
            // We animate y to simulate the leg coming forward vs going back.
            const base = 12;
            this.legLeft.y = base + Math.sin(phase) * strideY;
            this.legRight.y = base + Math.sin(phase + Math.PI) * strideY;

            // Scale the lead leg slightly larger (closer to camera)
            const leadScale = 1 + Math.max(0, Math.sin(phase)) * 0.15;
            const trailScale = 1 - Math.max(0, Math.sin(phase)) * 0.08;
            if (this.facingDir === DIR.RIGHT) {
                this.legRight.scaleX = leadScale;
                this.legLeft.scaleX = trailScale;
            } else {
                this.legLeft.scaleX = leadScale;
                this.legRight.scaleX = trailScale;
            }

            // Torso slight lean
            const bobOffset = Math.abs(Math.sin(phase * 2)) * bodyBob;
            this.torso.y = 4 - bobOffset;
            this.head.y = -16 - bobOffset;
            this.faceOverlay.y = -16 - bobOffset;
            this.hairSide.y = -20 - bobOffset;
        }

        if (!isMoving) {
            // Reset leg scales on idle
            this.legLeft.scaleX = 1;
            this.legRight.scaleX = 1;
        }
    }
}