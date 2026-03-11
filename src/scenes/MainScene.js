import { AssetFactory } from '../utils/AssetFactory.js';
import { GridEnvironment } from '../environment/GridEnvironment.js';
import { Player } from '../entities/Player.js';
import { ResourceDrop } from '../entities/ResourceDrop.js';
import { UnlockZone } from '../assets/zones/UnlockZone.js';

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

        // --- DISPLAY EXTRACTED ICONS ---
        this.add.image(150, 400, 'icon_house');
        this.add.text(150, 440, 'House', { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);

        this.add.image(250, 400, 'icon_syringe');
        this.add.text(250, 440, 'Syringe', { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);

        this.add.image(350, 400, 'icon_plus');
        this.add.text(350, 440, 'Plus', { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);

        // --- COIN STACK PREVIEW ---
        // Showing a stack of the new V2 coins to see the vertical pile look
        const stackX = 500;
        const stackBaseY = 400;
        for (let j = 0; j < 8; j++) {
            this.add.image(stackX, stackBaseY - (j * 6), 'item_coin');
        }
        this.add.text(stackX, 440, 'Coin V2 Stack', { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);

        // --- DISPLAY UNLOCK ZONE ---
        // Using the new Coin V2 as the price icon
        UnlockZone.create(this, 300, 500, {
            output_icon: 'icon_house',
            input_icon: 'ui_icon_coin',
            number: 300,
            plate_normal: 'plate_normal',
            plate_pressed: 'plate_pressed',
            depth: 8,
            onClick: () => console.log("Bought House Zone!")
        });
    }

    update(time, delta) {
        this.player.update(time, delta);

        // Process magnetism
        this.player.stackManager.processMagnetism(this.dropsGroup, this.magnetRadius);
    }
}