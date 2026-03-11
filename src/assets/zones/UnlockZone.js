import { ResourceAnimator } from '../../utils/ResourceAnimator.js';

export class UnlockZone extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // Static body

        const {
            output_icon,       
            input_icon,        
            number,            
            plate_normal,      
            plate_pressed,     
            depth = 8,         
            onClick = () => {},
            onComplete = () => { console.log("Zone Unlocked!"); }
        } = config;

        this.config = config;
        this.remainingCost = number;
        this.inputIconKey = input_icon;
        this.onComplete = onComplete;
        this.isComplete = false;

        // Visuals
        this.plate = scene.add.image(0, 0, plate_normal);
        this.add(this.plate);

        this.outIcon = scene.add.image(0, -14, output_icon);
        this.add(this.outIcon);

        this.costText = scene.add.text(0, 0, String(this.remainingCost), {
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontSize: '26px',
            color: '#ffffff',
            stroke: '#111111',
            strokeThickness: 6
        }).setOrigin(0, 0.5);

        this.inIcon = scene.add.image(0, 0, input_icon);

        const gap = 4;
        this.updateContentLayout();

        this.add([this.inIcon, this.costText]);

        // Interactive (Click fallback)
        this.plate.setInteractive();
        this.plate.on('pointerdown', () => this.setPressed(true));
        
        const release = () => this.setPressed(false);
        this.plate.on('pointerup', () => {
            release();
            onClick(); 
        });
        this.plate.on('pointerout', release);

        // Timer for draining
        this.drainTimer = 0;
        this.drainInterval = 150; // ms between coin drains
    }

    updateContentLayout() {
        const gap = 4;
        const totalWidth = this.inIcon.displayWidth + gap + this.costText.width;
        const startX = -totalWidth / 2;
        const bottomY = 22;

        this.inIcon.setPosition(startX + this.inIcon.displayWidth / 2, bottomY);
        this.costText.setPosition(startX + this.inIcon.displayWidth + gap, bottomY);
    }

    setPressed(isPressed) {
        const d = this.config.depth || 8;
        if (isPressed) {
            this.plate.setTexture(this.config.plate_pressed);
            this.outIcon.y = -14 + d;
            this.inIcon.y = 22 + d;
            this.costText.y = 22 + d;
            this.costText.setTint(0xdddddd);
        } else {
            this.plate.setTexture(this.config.plate_normal);
            this.outIcon.y = -14;
            this.inIcon.y = 22;
            this.costText.y = 22;
            this.costText.clearTint();
        }
    }

    /**
     * Called by the Scene when the player is overlapping with this zone.
     */
    processPlayerOverlap(player, time, delta) {
        if (this.isComplete || this.remainingCost <= 0) return;

        this.drainTimer += delta;
        if (this.drainTimer >= this.drainInterval) {
            this.drainTimer = 0;
            this.tryDrainFromPlayer(player);
        }
    }

    tryDrainFromPlayer(player) {
        // Pop One coin from player's stack (which grabs from the top)
        const item = player.stackManager.popFromStack('item_coin');

        if (item) {
            // CRITICAL: Prevent the player's magnetism from instantly picking it right back up
            item.state = 'consumed';

            this.remainingCost--;
            this.costText.setText(String(this.remainingCost));
            this.updateContentLayout();

            // We need to move the 'item' to the MainScene coordinate space 
            // since popFromStack converts its coordinates to absolute world coordinates.
            this.scene.add.existing(item);

            // Calculate destination relative to the dropped item's starting pos
            const targetX = this.x;
            const targetY = this.y;

            // Use the established ResourceAnimator for an arc movement
            ResourceAnimator.flyTo(item, { x: targetX, y: targetY }, {
                duration: 400,
                popHeight: 20, // Small arc popup before it falls
                ease: 'Sine.easeIn',
                onComplete: () => {
                    item.destroy();
                    if (this.remainingCost <= 0) {
                        this.finishUnlocking();
                    }
                }
            });
            
            // Add a scale/alpha fade out while it flies to make it look like it's being "absorbed"
            this.scene.tweens.add({
                targets: item,
                scale: 0.1,
                alpha: 0.2,
                duration: 400,
                ease: 'Quad.easeIn'
            });
        }
    }

    finishUnlocking() {
        if (this.isComplete) return;
        this.isComplete = true;
        
        // Final "Pop" effect
        this.scene.tweens.add({
            targets: this,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.onComplete();
                // Optionally hide or transform the zone
                this.visible = false;
                this.body.enable = false;
            }
        });
    }
}
