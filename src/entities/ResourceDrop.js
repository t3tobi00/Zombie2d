export class ResourceDrop extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, textureKey) {
        super(scene, x, y, textureKey);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.resourceType = textureKey;

        // Define states: 'idle', 'magnetized', 'flying', 'stacked'
        this.state = 'idle';

        // Will store the local Y position where it rests in the stack
        this.stackY = 0;

        // Idle animation
        this.idleTween = scene.tweens.add({
            targets: this,
            y: y - 5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}