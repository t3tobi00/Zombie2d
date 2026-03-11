import { StackManager } from '../../components/StackManager.js';
import { StorageLogic } from '../../components/StorageLogic.js';

export class StorageZone extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body

        const {
            plate_normal,
            plate_pressed,
            depth = 8,
            resourceType = 'item_coin', // Single item type
            maxCapacity = 50
        } = config;

        this.config = config;
        this.resourceType = resourceType;

        // --- Visual Plate ---
        this.plate = scene.add.image(0, 0, plate_normal);
        this.add(this.plate);

        // --- Interaction Logic (UI) ---
        this.plate.setInteractive();
        this.plate.on('pointerdown', () => this._setPressed(true));
        
        const release = () => this._setPressed(false);
        this.plate.on('pointerup', release);
        this.plate.on('pointerout', release);

        // --- Stack & Visual Management ---
        const stackOwner = {
            x: this.x,
            y: this.y,
            depth: depth,
            facingDir: 'FRONT'
        };

        this.stackManager = new StackManager(scene, stackOwner, {
            allowedItems: [this.resourceType],
            allowMixed: false
        });
        this.stackManager.container.setDepth(this.depth + 1);

        // --- PURE LOGIC INITIALIZATION ---
        // Separating the Business Logic (timers, capacity, pop) from this View
        this.logic = new StorageLogic(scene, {
            resourceType: this.resourceType,
            drainInterval: 120,
            maxCapacity: maxCapacity,
            onDrain: (item) => this.addItem(item),
            getCurrentCount: () => this.stackManager.items.length
        });
    }

    /**
     * Entry point for interaction: delegates to the logic component
     */
    handleInteraction(sourceEntity, delta) {
        this.logic.update(sourceEntity, delta);
    }

    /**
     * Interface to handle the physical transfer of an item into this view's stack.
     */
    addItem(item) {
        // Reset state so our StackManager accepts it (ResourceDrainer marked it as 'consumed')
        item.state = 'idle';
        
        this.scene.add.existing(item);
        this.stackManager.magnetize(item);
    }

    update(time, delta) {
        // StackManager needs periodic updates for wobbles/animations
        this.stackManager.update(time, delta, false);
    }

    _setPressed(isPressed) {
        if (isPressed) {
            this.plate.setTexture(this.config.plate_pressed);
        } else {
            this.plate.setTexture(this.config.plate_normal);
        }
    }
}
