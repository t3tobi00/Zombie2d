export class Movement {
    constructor(scene, speed) {
        this.speed = speed;
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    // Returns a velocity vector based on current input
    getVelocity() {
        let velocity = new Phaser.Math.Vector2(0, 0);

        if (this.keys.left.isDown)  velocity.x = -1;
        if (this.keys.right.isDown) velocity.x = 1;
        if (this.keys.up.isDown)    velocity.y = -1;
        if (this.keys.down.isDown)  velocity.y = 1;

        if (velocity.length() > 0) {
            velocity.normalize().scale(this.speed);
        }

        return velocity;
    }
}