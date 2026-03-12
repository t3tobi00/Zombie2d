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

        // Overlay text to show current mode
        this.modeText = scene.add.text(0, -50, "DEPOSIT", { 
            fontSize: '18px', 
            fontFamily: 'Arial Black', 
            color: '#ffffff' 
        }).setOrigin(0.5);
        this.add(this.modeText);

        // --- Visual Plate ---
        this.plate = scene.add.image(0, 0, plate_normal);
        this.add(this.plate);

        // --- Interaction Logic (UI) ---
        this.plate.setInteractive();
        this.plate.on('pointerdown', () => this._setPressed(true));
        
        const release = () => {
            this._setPressed(false);
            const newMode = this.logic.toggleMode();
            this.modeText.setText(newMode);
            this.modeText.setColor(newMode === 'DEPOSIT' ? '#ffffff' : '#00ff00');
        };
        this.plate.on('pointerup', release);
        this.plate.on('pointerout', () => this._setPressed(false));

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
        this.logic = new StorageLogic(scene, {
            resourceType: this.resourceType,
            drainInterval: 80, // Slightly faster for bank-like feel
            maxCapacity: maxCapacity,
            onDeposit: (item) => this.addItem(item),
            onWithdraw: (item) => this._giveToTarget(item),
            getCurrentCount: () => this.stackManager.items.length
        });

        this.currentTargetInRange = null;
    }

    /**
     * Entry point for interaction: delegates to the logic component
     */
    handleInteraction(sourceEntity, delta) {
        this.currentTargetInRange = sourceEntity;
        this.logic.update(sourceEntity, delta, this);
    }

    /**
     * Deposit item from source to storage
     */
    addItem(item) {
        item.state = 'idle';
        this.scene.add.existing(item);
        this.stackManager.magnetize(item);
    }

    /**
     * Internal handler to give item back to current target
     */
    _giveToTarget(item) {
        if (!this.currentTargetInRange) return;
        
        // Reset item so the target can magnetized it
        item.state = 'idle';
        this.scene.add.existing(item);
        
        // Use target's stack manager to take the item
        this.currentTargetInRange.stackManager.magnetize(item);
    }

    update(time, delta) {
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
