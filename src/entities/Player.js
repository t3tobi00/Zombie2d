import { Character } from './Character.js';
import { Movement } from '../components/Movement.js';
import { StackManager } from '../components/StackManager.js';

export class Player extends Character {
    // 1. Add textureKey to the constructor parameters
    constructor(scene, x, y, textureKey = 'player') {

        // 2. Pass the textureKey to the parent Character class
        super(scene, x, y, textureKey);

        // Attach WASD movement logic
        this.movement = new Movement(scene, 250);

        // Attach stack manager logic
        this.stackManager = new StackManager(scene, this);
    }

    update(time, delta) {
        // 1. Get velocity from our Movement component
        const velocity = this.movement.getVelocity();

        // 2. Apply it to the physics body
        this.body.setVelocity(velocity.x, velocity.y);

        const isMoving = velocity.length() > 0;

        // 3. Handle Rotation
        if (isMoving) {
            // Because our eyes face "UP" (-Y), we add 90 degrees (Math.PI/2) to the angle
            this.rotation = Math.atan2(velocity.y, velocity.x) + (Math.PI / 2);
        }

        // 4. Trigger the procedural leg animation from the parent class
        this.animateWalking(isMoving, time);

        // 5. Update the stack position to follow the player
        this.stackManager.update();
    }
}