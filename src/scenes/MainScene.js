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
        this.player = new Player(this, 100, 100, 'player');
        this.player.setDepth(10);

        // Define the magnetic pull distance
        this.magnetRadius = 120;

        // --- SPAWN DROPS TO TEST ---
        this.dropsGroup = this.add.group();

        // Spawn some coins
        for (let i = 0; i < 15; i++) {
            this.dropsGroup.add(new ResourceDrop(this, 200 + i * 15, 100, 'item_coin'));
        }
    }

    update(time, delta) {
        this.player.update(time, delta);

        // Process magnetism
        this.player.stackManager.processMagnetism(this.dropsGroup, this.magnetRadius);
    }
}