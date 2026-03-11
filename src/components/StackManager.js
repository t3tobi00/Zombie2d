export class StackManager {
    constructor(scene, owner) {
        this.scene = scene;
        this.owner = owner;
        this.items = []; // The internal array of stacked items
        
        // A queue for items flying but not yet landed
        this.collectionQueue = []; 

        // Visual container, doesn't rotate with owner
        this.container = scene.add.container(owner.x, owner.y);
        this.container.setDepth(10);
        
        // Spacing for vertical stack
        this.itemSpacing = 8; 

        // Animation config
        this.animSpeed = 200; // Time (ms) to fly from ground to stack
    }

    update() {
        // Simple smoothing for the container follow
        this.container.x = Phaser.Math.Linear(this.container.x, this.owner.x, 0.4);
        this.container.y = Phaser.Math.Linear(this.container.y, this.owner.y - 20, 0.4); 
    }

    // Add this anywhere inside the StackManager class
    processMagnetism(dropsGroup, radius) {
        if (!dropsGroup) return;
        
        const drops = dropsGroup.getChildren();
        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];

            if (drop.state === 'idle') {
                // The StackManager does its own math relative to its owner
                const distance = Phaser.Math.Distance.Between(
                    this.owner.x, this.owner.y, 
                    drop.x, drop.y
                );

                if (distance <= radius) {
                    this.magnetize(drop);
                }
            }
        }
    }

    magnetize(resourceSprite) {
        if (resourceSprite.state !== 'idle') return;

        resourceSprite.state = 'magnetized';
        // Disable physics/idle motion
        this.scene.physics.world.disable(resourceSprite);
        this.scene.tweens.killTweensOf(resourceSprite);

        // Add to the queue and check if we need to start processing
        this.collectionQueue.push(resourceSprite);
        if (this.collectionQueue.length === 1) {
            this.processNextInQueue();
        }
    }

    processNextInQueue() {
        if (this.collectionQueue.length === 0) return;

        const nextItem = this.collectionQueue[0];
        nextItem.state = 'flying';

        // 1. Move into the container at its CURRENT WORLD POSITION
        const worldX = nextItem.x;
        const worldY = nextItem.y;
        this.container.add(nextItem);
        nextItem.x = worldX - this.container.x;
        nextItem.y = worldY - this.container.y;

        // 2. Determine target height based on current stack size
        // Note: The new item sets the target height, but doesn't modify this.items yet
        const stackIndex = this.items.length;
        nextItem.stackY = -(stackIndex * this.itemSpacing);

        // --- The satisfying sequential tween ---
        // A. Pop Up First (Phase 1)
        this.scene.tweens.add({
            targets: nextItem,
            y: nextItem.y - 30, // Pop up 30px
            duration: this.animSpeed * 0.4,
            ease: 'Sine.easeOut',
            onComplete: () => {
                // B. Arc to Stack Target (Phase 2)
                this.scene.tweens.add({
                    targets: nextItem,
                    x: 0,
                    y: nextItem.stackY,
                    duration: this.animSpeed * 0.6,
                    ease: 'Power2.easeOut', // Fast start, soft landing
                    onComplete: () => this.onStackTweenComplete(nextItem)
                });
            }
        });
    }

    onStackTweenComplete(itemSprite) {
        // Item is now 'Stacked'
        itemSprite.state = 'stacked';
        
        // Commit it to the official inventory
        this.items.push(itemSprite);

        // --- JUICE: Impact visual effect ---
        // Slight vertical squash and stretch
        this.scene.tweens.add({
            targets: itemSprite,
            scaleY: 0.8,
            scaleX: 1.1,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeInOut'
        });
        
        // Remove from the processing queue
        this.collectionQueue.shift();
        
        // Immediately start processing the next one! This creates the fast, 
        // one-after-another 'machine-gun' stacking feel.
        this.processNextInQueue();
    }
}