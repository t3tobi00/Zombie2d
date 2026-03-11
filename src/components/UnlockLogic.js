import { ResourceDrainer } from './ResourceDrainer.js';

export class UnlockLogic {
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Configuration
        this.config = Object.assign({
            totalCost: 10,
            resourceType: 'item_coin',
            drainInterval: 150,
            onProgress: null,
            onComplete: null,
            onDrain: null
        }, config);

        this.remainingCost = this.config.totalCost;
        this.isComplete = false;

        // --- DELEGATION ---
        // Instead of writing our own timers, we use the specialized Drainer
        this.drainer = new ResourceDrainer({
            resourceType: this.config.resourceType,
            interval: this.config.drainInterval,
            canDrain: () => !this.isComplete && this.remainingCost > 0,
            onDrain: (item) => this._onItemDrained(item)
        });
    }

    /**
     * Process potential drain.
     */
    update(player, delta) {
        this.drainer.update(player, delta);
    }

    /**
     * Internal handler to bridge the physical item to the logical cost
     */
    _onItemDrained(item) {
        this.remainingCost--;

        // Notify View of progress
        if (this.config.onProgress) {
            this.config.onProgress(this.remainingCost);
        }

        // Notify View to handle the visual animation
        if (this.config.onDrain) {
            this.config.onDrain(item);
        }

        // Finalize if needed
        if (this.remainingCost <= 0) {
            this.complete();
        }
    }

    complete() {
        if (this.isComplete) return;
        this.isComplete = true;
        if (this.config.onComplete) {
            this.config.onComplete();
        }
    }

    setCost(newCost) {
        this.remainingCost = newCost;
        if (this.config.onProgress) {
            this.config.onProgress(this.remainingCost);
        }
    }
}
