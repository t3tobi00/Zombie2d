/**
 * ResourceDrainer.js
 * 
 * A specialized component that handles the temporal logic of 
 * draining resources from a source entity (like a Player) 
 * at a specific interval.
 */
export class ResourceDrainer {
    constructor(config = {}) {
        this.config = Object.assign({
            resourceType: 'item_coin',
            interval: 150,
            onDrain: null,    // Callback when an item is successfully taken
            canDrain: () => true // External condition check (e.g., cost > 0 or capacity available)
        }, config);

        this.timer = 0;
    }

    /**
     * Process the drain logic. 
     * @param {Object} sourceEntity - The entity being drained (must have a stackManager)
     * @param {number} delta - Frame delta time
     */
    update(sourceEntity, delta) {
        if (!sourceEntity || !sourceEntity.stackManager) return;
        if (!this.config.canDrain()) return;

        this.timer += delta;
        
        if (this.timer >= this.config.interval) {
            this.timer = 0;
            
            // Execute the physical pop
            const item = sourceEntity.stackManager.popFromStack(this.config.resourceType);
            
            if (item) {
                // IMPORTANT: Change state so the source's magnetism doesn't grab it back!
                item.state = 'consumed';

                // Pass the item to the owner for visual handling
                if (this.config.onDrain) {
                    this.config.onDrain(item);
                }
            }
        }
    }

    setRate(newInterval) {
        this.config.interval = newInterval;
    }
}
