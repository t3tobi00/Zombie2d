import { ResourceDrainer } from './ResourceDrainer.js';

export class StorageLogic {
    constructor(scene, config = {}) {
        this.scene = scene;
        
        this.config = Object.assign({
            resourceType: 'item_coin',
            drainInterval: 120,
            maxCapacity: Infinity,
            onDrain: null,
            getCurrentCount: () => 0
        }, config);

        // --- DELEGATION ---
        this.drainer = new ResourceDrainer({
            resourceType: this.config.resourceType,
            interval: this.config.drainInterval,
            canDrain: () => this.config.getCurrentCount() < this.config.maxCapacity,
            onDrain: (item) => {
                if (this.config.onDrain) this.config.onDrain(item);
            }
        });
    }

    /**
     * Process potential drain from a player.
     */
    update(player, delta) {
        this.drainer.update(player, delta);
    }
}
