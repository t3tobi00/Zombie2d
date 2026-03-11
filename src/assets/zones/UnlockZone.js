import { ResourceAnimator } from '../../utils/ResourceAnimator.js';
import { UnlockLogic } from '../../components/UnlockLogic.js';

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
        
        // --- LOGIC INITIALIZATION ---
        // We decouple the state and math from this visual container
        this.logic = new UnlockLogic(scene, {
            totalCost: number,
            resourceType: 'item_coin', // Hardcoded for now, but could be dynamic
            onProgress: (remaining) => this._updateUI(remaining),
            onDrain: (item) => this._animateDrain(item),
            onComplete: () => this._handleComplete(onComplete)
        });

        // Visuals
        this.plate = scene.add.image(0, 0, plate_normal);
        this.add(this.plate);

        this.outIcon = scene.add.image(0, -14, output_icon);
        this.add(this.outIcon);

        this.costText = scene.add.text(0, 0, String(this.logic.remainingCost), {
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontSize: '26px',
            color: '#ffffff',
            stroke: '#111111',
            strokeThickness: 6
        }).setOrigin(0, 0.5);

        this.inIcon = scene.add.image(0, 0, input_icon);

        this.updateContentLayout();
        this.add([this.inIcon, this.costText]);

        // Interaction (Click)
        this.plate.setInteractive();
        this.plate.on('pointerdown', () => this._setPressed(true));
        
        const release = () => this._setPressed(false);
        this.plate.on('pointerup', () => {
            release();
            onClick(); 
        });
        this.plate.on('pointerout', release);
    }

    /**
     * Entry point for interaction: delegates to the logic component
     */
    handleInteraction(sourceEntity, delta) {
        this.logic.update(sourceEntity, delta);
    }

    _updateUI(remaining) {
        this.costText.setText(String(remaining));
        this.updateContentLayout();
    }

    _animateDrain(item) {
        // Bring the item into the scene root (out of the player's stack container)
        this.scene.add.existing(item);

        // Visual "absortion" fly animation
        ResourceAnimator.flyTo(item, { x: this.x, y: this.y }, {
            duration: 400,
            popHeight: 20,
            ease: 'Sine.easeIn',
            onComplete: () => {
                item.destroy();
            }
        });
        
        // Fade out during flight
        this.scene.tweens.add({
            targets: item,
            scale: 0.1,
            alpha: 0.2,
            duration: 400,
            ease: 'Quad.easeIn'
        });
    }

    _handleComplete(onCompleteCallback) {
        // Final "Pop" effect
        this.scene.tweens.add({
            targets: this,
            scale: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut',
            onComplete: () => {
                onCompleteCallback(); // External callback
                this.visible = false;
                if (this.body) this.body.enable = false;
            }
        });
    }

    _setPressed(isPressed) {
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

    updateContentLayout() {
        const gap = 4;
        const totalWidth = this.inIcon.displayWidth + gap + this.costText.width;
        const startX = -totalWidth / 2;
        const bottomY = 22;

        this.inIcon.setPosition(startX + this.inIcon.displayWidth / 2, bottomY);
        this.costText.setPosition(startX + this.inIcon.displayWidth + gap, bottomY);
    }
}
