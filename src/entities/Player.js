import { Character } from './Character.js';
import { Movement } from '../components/Movement.js';
import { StackManager } from '../components/StackManager.js';

export class Player extends Character {
    constructor(scene, x, y, textureKey = 'player') {
        super(scene, x, y, textureKey);

        this.baseSpeed = 250; // Store the original healthy speed
        this.movement = new Movement(scene, this.baseSpeed);
        
        // Pass configuration to StackManager
        // - allowedItems: ['item_coin'] means Player can ONLY pick up coin items.
        //   (Add 'item_bullet', 'item_essence' to this array if they should carry others)
        // - allowMixed: false means they can only hold one type at a time.
        this.stackManager = new StackManager(scene, this, {
            allowedItems: ['item_coin'], 
            allowMixed: false,
            magnetRadius: 120
        });

        // Velocity vector re-used each frame to avoid GC pressure.
        this._velocity = new Phaser.Math.Vector2();
    }

    update(time, delta) {
        // ── 0. Calculate Weight Penalty (The CBSS Friction) ──────────────
        const stackSize = this.stackManager.items.length;

        // Exponential math: Math.pow(size, 1.3) gives a gentle curve that gets steeper.
        // Multiply by 4 to scale the severity.
        const penalty = Math.pow(stackSize, 1.3) * 4;

        // Cap the minimum speed so the player never completely freezes
        const minSpeed = 50;

        // Dynamically update the Movement component's speed
        this.movement.speed = Math.max(minSpeed, this.baseSpeed - penalty);


        // ── 1. Resolve input → velocity ──────────────────────────────────
        const raw = this.movement.getVelocity();
        this._velocity.set(raw.x, raw.y);

        // ── 2. Drive physics body ────────────────────────────────────────
        this.body.setVelocity(this._velocity.x, this._velocity.y);

        // ── 3. NEVER rotate the container – the Character handles facing ─
        //       (Explicitly clamped here as a safety net.)
        this.rotation = 0;

        // ── 4. Pass raw velocity to Character for perspective shifting ───
        //       Character.updateFacing() owns ALL visual logic.
        this.updateFacing(this._velocity, time, delta);

        // ── 5. Update the stack (it manages its own world position) ──────
        const isMoving = this._velocity.length() > 10;
        this.stackManager.update(time, delta, isMoving);

        // ── 6. Process magnetism ─────────────────────────────────────────
        if (this.scene.dropsGroup) {
            this.stackManager.processMagnetism(this.scene.dropsGroup);
        }
    }
}