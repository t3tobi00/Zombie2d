import { Character } from './Character.js';
import { Movement } from '../components/Movement.js';
import { StackManager } from '../components/StackManager.js';

export class Player extends Character {
    constructor(scene, x, y, textureKey = 'player') {
        super(scene, x, y, textureKey);

        this.movement = new Movement(scene, 250);
        this.stackManager = new StackManager(scene, this);

        // Velocity vector re-used each frame to avoid GC pressure.
        this._velocity = new Phaser.Math.Vector2();
    }

    update(time, delta) {
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
        this.stackManager.update();
    }
}