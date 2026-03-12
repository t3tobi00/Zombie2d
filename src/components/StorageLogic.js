import { ResourceDrainer } from './ResourceDrainer.js';

export class StorageLogic {
    constructor(scene, config = {}) {
        this.scene = scene;
        
        this.config = Object.assign({
            resourceType: 'item_coin',
            drainInterval: 120,
            maxCapacity: Infinity,
            onDeposit: null,    // (item) => void
            onWithdraw: null,   // (item) => void
            getCurrentCount: () => 0
        }, config);

        this.currentMode = 'DEPOSIT'; // 'DEPOSIT' or 'WITHDRAW'

        // --- DEPOSIT DRAINER (Takes from Player/Entity) ---
        this.depositDrainer = new ResourceDrainer({
            resourceType: this.config.resourceType,
            interval: this.config.drainInterval,
            canDrain: () => this.currentMode === 'DEPOSIT' && this.config.getCurrentCount() < this.config.maxCapacity,
            onDrain: (item) => {
                if (this.config.onDeposit) this.config.onDeposit(item);
            }
        });

        // --- WITHDRAW DRAINER (Takes from Self/Storage) ---
        this.withdrawDrainer = new ResourceDrainer({
            resourceType: this.config.resourceType,
            interval: this.config.drainInterval,
            canDrain: () => this.currentMode === 'WITHDRAW' && this.config.getCurrentCount() > 0,
            onDrain: (item) => {
                if (this.config.onWithdraw) this.config.onWithdraw(item);
            }
        });
    }

    /**
     * Process potential transfer
     * @param {Object} targetEntity - The entity interacting with storage (e.g. Player)
     * @param {number} delta - Frame time
     * @param {Object} storageEntity - The storage entity itself (the one holding the stack)
     */
    update(targetEntity, delta, storageEntity) {
        if (this.currentMode === 'DEPOSIT') {
            this.depositDrainer.update(targetEntity, delta);
        } else {
            // Withdrawal drains from the storage's own stack manager
            this.withdrawDrainer.update(storageEntity, delta);
        }
    }

    toggleMode() {
        this.currentMode = this.currentMode === 'DEPOSIT' ? 'WITHDRAW' : 'DEPOSIT';
        return this.currentMode;
    }
}
