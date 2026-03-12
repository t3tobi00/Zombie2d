export class Movement {
    constructor(scene, speed) {
        this.speed = speed;
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        // Joystick state
        this.isDragging = false;
        this.activePointerId = null;
        this.joystickVector = new Phaser.Math.Vector2(0, 0);
        this.maxRadius = 50; // Max drag distance for full speed

        // Visuals (Circles overlay on UI)
        this.baseCircle = scene.add.circle(0, 0, this.maxRadius, 0x888888, 0.4)
            .setDepth(1000).setScrollFactor(0).setVisible(false);
        this.thumbCircle = scene.add.circle(0, 0, 25, 0xffffff, 0.8)
            .setDepth(1001).setScrollFactor(0).setVisible(false);

        // Ensure we support multi-touch just in case
        scene.input.addPointer(1);

        // Input Events
        scene.input.on('pointerdown', (pointer) => {
            if (!this.isDragging) {
                this.isDragging = true;
                this.activePointerId = pointer.id;
                
                this.baseCircle.setPosition(pointer.x, pointer.y).setVisible(true);
                this.thumbCircle.setPosition(pointer.x, pointer.y).setVisible(true);
                this.joystickVector.set(0, 0);
            }
        });

        scene.input.on('pointermove', (pointer) => {
            if (this.isDragging && pointer.id === this.activePointerId) {
                let dx = pointer.x - this.baseCircle.x;
                let dy = pointer.y - this.baseCircle.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                
                let angle = Math.atan2(dy, dx);
                let cappedDist = Math.min(dist, this.maxRadius);
                
                this.thumbCircle.x = this.baseCircle.x + Math.cos(angle) * cappedDist;
                this.thumbCircle.y = this.baseCircle.y + Math.sin(angle) * cappedDist;
                
                // Keep values from 0.0 to 1.0 based on drag ratio
                this.joystickVector.set(Math.cos(angle) * (cappedDist / this.maxRadius), Math.sin(angle) * (cappedDist / this.maxRadius));
            }
        });

        const pointerUpHandler = (pointer) => {
            if (this.isDragging && pointer.id === this.activePointerId) {
                this.isDragging = false;
                this.activePointerId = null;
                this.baseCircle.setVisible(false);
                this.thumbCircle.setVisible(false);
                this.joystickVector.set(0, 0);
            }
        };

        scene.input.on('pointerup', pointerUpHandler);
        scene.input.on('pointerout', pointerUpHandler);
    }

    // Returns a velocity vector based on current input
    getVelocity() {
        let velocity = new Phaser.Math.Vector2(0, 0);

        if (this.keys.left.isDown)  velocity.x -= 1;
        if (this.keys.right.isDown) velocity.x += 1;
        if (this.keys.up.isDown)    velocity.y -= 1;
        if (this.keys.down.isDown)  velocity.y += 1;

        if (velocity.length() > 0) {
            return velocity.normalize().scale(this.speed);
        }

        // Fallback to Joystick Input
        if (this.isDragging) {
            velocity.copy(this.joystickVector).scale(this.speed);
        }

        return velocity;
    }
}