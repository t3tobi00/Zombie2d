import { AssetFactory } from '../utils/AssetFactory.js';
import { GridEnvironment } from '../environment/GridEnvironment.js';
import { Player } from '../entities/Player.js';
import { ResourceDrop } from '../entities/ResourceDrop.js';
import { UnlockZone } from '../assets/zones/UnlockZone.js';
import { StorageZone } from '../assets/zones/StorageZone.js';

export class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        AssetFactory.generateAll(this);
    }

    create() {
        // --- WORLD & CAMERA BOUNDS ---
        const worldWidth = 3000;
        const worldHeight = 3000;
        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;

        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        GridEnvironment.create(this, centerX, centerY, worldWidth, worldHeight);

        this.player = new Player(this, centerX, centerY, 'player');
        this.player.setDepth(10);
        
        // --- CAMERA FOLLOW ---
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08); // Smooth lerp follow
        this.cameras.main.setZoom(0.85); // Wider strategy view

        // --- SPAWN DROPS TO TEST ---
        this.dropsGroup = this.add.group();
        this.unlockZones = this.add.group();
        this.storageZones = this.add.group(); // New group for storage zones

        // Spawn some coins relative to player
        for (let i = 0; i < 10; i++) {
            this.dropsGroup.add(new ResourceDrop(this, centerX - 100 + i * 15, centerY - 150, 'item_coin'));
        }

        // Spawn some bullets relative to player
        for (let i = 0; i < 5; i++) {
            this.dropsGroup.add(new ResourceDrop(this, centerX + 100 + i * 40, centerY - 100, 'item_bullet'));
        }

        // --- DISPLAY UNLOCK ZONE ---
        const zone = new UnlockZone(this, centerX - 200, centerY + 200, {
            output_icon: 'icon_house',
            input_icon: 'ui_icon_coin',
            number: 10,
            plate_normal: 'plate_normal',
            plate_pressed: 'plate_pressed',
            depth: 8,
            onClick: () => console.log("Clicked House Zone!"),
            onComplete: () => console.log("BOUGHT HOUSE!")
        });
        this.unlockZones.add(zone);

        // --- ROOM FOR SURVIVORS ---
        const room = this.add.image(centerX + 300, centerY - 100, 'room_sleeping');
        room.setDepth(1); 

        this.storageZones.add(new StorageZone(this, centerX + 200, centerY + 200, {
            plate_normal: 'plate_normal',
            plate_pressed: 'plate_pressed',
            depth: 8,
            resourceType: 'item_coin' 
        }));
    }

    update(time, delta) {
        this.player.update(time, delta);

        // Update all storage zones (for wobbles/stack animations)
        this.storageZones.getChildren().forEach(zone => zone.update(time, delta));

        // Process Unlock Zones overlap
        this.physics.overlap(this.player, this.unlockZones, (p, zone) => {
            zone.handleInteraction(this.player, delta);
        });

        // Process Storage Zones overlap (New!)
        this.physics.overlap(this.player, this.storageZones, (p, zone) => {
            zone.handleInteraction(this.player, delta);
        });
    }
}