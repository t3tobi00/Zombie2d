# The Modular Resource System

## Overview
The game utilizes a highly modular, contract-based resource management system built on a **Composition-over-Inheritance** pattern. Instead of using monolithic "God Classes" to handle game logic, behavior is split into separate, reusable components. This allows any in-game entity (Player, NPC, Storage, Unlocks) to give, take, or store items universally.

This architectural pattern divides responsibilities into distinct layers, ensuring that visuals, business logic, timing mechanisms, and physics simulations do not tightly couple with one another.

---

## 1. The Component Stack (Layered Architecture)

The system works like an onion, where each component strictly handles its designated concern:

| Layer | Module | Responsibility | Example "Thought Process" |
| :--- | :--- | :--- | :--- |
| **View (UI/Visuals)** | `UnlockZone`, `StorageZone` | Rendering assets, animations, and catching physics overlaps. | "I am rendering a gray plate. When the player steps on me, my sprite visually presses down." |
| **Business Logic** | `UnlockLogic`, `StorageLogic` | Enforcing rules, tracking capacities, and determining states. | "I require 10 coins. I currently have 5. I am not full yet." |
| **Engine (Timing)** | `ResourceDrainer` | Handling temporal loops and triggering the physical exchange. | "120ms just passed. The logic says I can take an item. I will trigger the pop action now." |
| **System (Physics)** | `StackManager` | Managing the local inventory array and dynamic 3D rendering of stacks. | "I've been asked for my top coin. I will detach it and return the sprite reference." |

---

## 2. Universal Data Flow: Two-Way Transactions

Because the `ResourceDrainer` is agnostic about "who" is being drained, the system supports both **Deposits** and **Withdrawals** simply by swapping the Actors.

### A. The Deposit Flow (Entity -> Storage)
1. **Source:** The `player`'s `stackManager`.
2. **Action:** `ResourceDrainer` pops from the player and sets `item.state = 'consumed'`.
3. **Receipt:** `StorageZone` receives the item, sets `state = 'idle'`, and calls `this.stackManager.magnetize(item)`.

### B. The Withdraw Flow (Storage -> Entity)
1. **Source:** The `StorageZone`'s own `stackManager`.
2. **Action:** A separate `ResourceDrainer` (owned by `StorageLogic`) pops from the storage pile and sets `item.state = 'consumed'`.
3. **Receipt:** `StorageZone` takes that item, sets `state = 'idle'`, and calls `player.stackManager.magnetize(item)` to give it to the player.

---

## 3. The "State" Safety Handshake

To ensure physical items move correctly between independent modules without race conditions (especially when two entities are standing on top of each other), item sprites utilize a state handshake:

* **Item Extraction:** The `ResourceDrainer` marks the item as **`consumed`**. This acts as a "Safety Lock," making the item invisible to all Magnetism systems.
* **Item Receipt:** The receiving View resets the item to **`idle`** and immediately calls **`magnetize()`**.
* **Success:** This ensures that if the Player stands on a Zone, they don't accidentally "vacuum up" a coin that was just given back to them, or vice versa.

---

## 4. Scalability & Modularity Examples

Because logic is decoupled from entities, expanding the game requires minimal refactoring.

### Example: The Dual-Mode Bank
The `StorageZone` uses a toggle pattern. Clicking it switches the `StorageLogic` mode between `DEPOSIT` and `WITHDRAW`. 
* The **Logic** decides which of its two `ResourceDrainer` instances to run.
* The **Visuals** simply update a text label (e.g., "DEPOSIT" vs "WITHDRAW").

### Advanced: Entity-Agnostic Draining
If you add an NPC helper:
```javascript
// A storage zone can drain from an NPC just as easily as the Player
this.physics.overlap(this.npc, this.storageZones, (npc, zone) => {
    zone.handleInteraction(npc, delta);
});
```

If you add an automated factory:
```javascript
// A Factory can drain items directly from a nearby StorageZone
this.factoryLogic.handleInteraction(this.storageZone, delta);
```

By relying on this interface contract, the game engine remains robust, highly readable, and exceptionally scalable.
