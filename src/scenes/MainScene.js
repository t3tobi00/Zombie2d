import { AssetFactory } from '../utils/AssetFactory.js';
import { GridEnvironment } from '../environment/GridEnvironment.js';
import { Player } from '../entities/Player.js';
import { ResourceDrop } from '../entities/ResourceDrop.js';

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        AssetFactory.generateAll(this);
    }

    create() {
        GridEnvironment.create(this);
        this.player = new Player(this, 400, 300, 'player');

        // Define the magnetic pull distance
        this.magnetRadius = 120;

        // --- VISUALIZE THE MAGNET ZONE ---
        // We draw a faint circle so you can see the exact range of your magnet
        this.magnetCircle = this.add.graphics();
        this.magnetCircle.setDepth(-1); // Keep it under the player

        // Add a pulsing tween to the visual circle for extra juice
        this.tweens.add({
            targets: this.magnetCircle,
            alpha: 0.3,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Spawn drops
        this.dropsGroup = this.add.group(); // No longer needs physics!
        for (let i = 0; i < 30; i++) {
            const randomX = Phaser.Math.Between(100, 700);
            const randomY = Phaser.Math.Between(100, 500);
            this.dropsGroup.add(new ResourceDrop(this, randomX, randomY, 'item_essence'));
        }
    }

    update(time, delta) {
        // 1. Update the player (movement, animations)
        this.player.update(time, delta);

        // 2. The Scene just tells the Player's StackManager to do its thing!
        // We pass the drops group and the desired radius (120)
        this.player.stackManager.processMagnetism(this.dropsGroup, 120);
        
        // (Optional: You can move the visual magnet circle drawing here if you still want it)
    }
}