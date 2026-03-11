# 🧪 Project: Bio-Stacker (Top-Down Edition)

**Current Version:** Prototype v0.1

**Engine:** Phaser 3 (v3.60.0) via CDN

**Language:** Vanilla JavaScript (ES6 Modules)

**Environment:** Local Web Server (e.g., Node `serve`, VS Code Live Server)

## 💡 1. High-Level Concept

Bio-Stacker is a Top-Down Hybrid Crafty-Buildy-Strategy Simulation (CBSS). The player acts as a Bio-Commander managing a "Cure Outpost" in a zombie-infested wasteland.

**The Core Hook ("The Infinite Stack"):** Resources do not go into an invisible UI inventory. Instead, they physically stack vertically on the character's back. In the top-down perspective, this creates a "walking tower" visual. The core friction of the game is **Stack Penalty**: the taller the stack, the slower the player moves, creating a constant risk/reward loop regarding collection greed vs. evasion speed.

## 📂 2. Directory Structure

The project uses a highly modular ES6 architecture, favoring composition over inheritance to ensure scalability for future entities (Bots, Zombies) and mechanics.

Bio-Stacker/
├── index.html
└── src/
    ├── main.js
    ├── assets/
    │   ├── icons/
    │   │   ├── IconCoin.js
    │   │   ├── IconHouse.js
    │   │   ├── IconPlus.js
    │   │   └── IconSyringe.js
    │   ├── items/
    │   │   ├── BulletAsset.js
    │   │   └── CoinAsset2.js
    │   └── zones/
    │       ├── UnlockZone.js
    │       └── UnlockZonePlate.js
    ├── components/
    │   ├── Movement.js
    │   └── StackManager.js
    ├── entities/
    │   ├── Character.js
    │   ├── Player.js
    │   └── ResourceDrop.js
    ├── environment/
    │   └── GridEnvironment.js
    ├── scenes/
    │   └── MainScene.js
    ├── templates/
    │   └── BaseAsset.js
    └── utils/
        ├── AssetFactory.js
        └── ResourceAnimator.js

## 🏗️ 3. Architecture & Module Breakdown

### Core Setup

* **`index.html`**: The entry point. Loads the Phaser 3 library via CDN and imports `src/main.js` as an ES6 `<script type="module">`.
* **`src/main.js`**: The Phaser Game configuration. Initializes the canvas (800x600), sets the background color, initializes the Arcade Physics engine (with 0 gravity for top-down view), and loads the `MainScene`.

### Utilities & Assets

* **`src/templates/BaseAsset.js`**: A standardized template for all procedurally generated assets.
* **`src/utils/AssetFactory.js`**: The central graphics generator. Uses Phaser's `Graphics` API and the modular asset classes (e.g., `CoinAsset2`, `IconHouse`) to procedurally draw and generate textures into the game's memory during the `preload` phase.
* **`src/utils/ResourceAnimator.js`**: A reusable animation utility for handling complex tweens like the arcing "flight" and squash-and-stretch "impact" of resources moving between entities and zones.

### UI & Zones

* **`src/assets/icons/`**: Contains modular ES6 classes for generating specific UI graphics (`IconHouse`, `IconSyringe`, `IconPlus`).
* **`src/assets/zones/`**:
  * **`UnlockZonePlate.js`**: Generates the 3D visual base plate for interactive zones, handling normal and pressed states.
  * **`UnlockZone.js`**: A functional container class that acts as a physical unlocking area. It handles physics overlaps, drains items from a player's stack one by one, animates the transfer using `ResourceAnimator`, and triggers a callback upon completion.

### Scenes & Environment

* **`src/scenes/MainScene.js`**: The primary game loop.
* **Preload**: Calls `AssetFactory` to generate textures.
* **Create**: Initializes the environment, instantiates the `Player`, creates a visual pulsing "Magnet Zone", and spawns `ResourceDrop` items.
* **Update**: Runs the distance-based magnetic collection logic checking the radius between the Player and all idle drops.


* **`src/environment/GridEnvironment.js`**: Handles drawing the static background. Sets the sand-colored background, draws a vertical road using repeated tiles, and overlays a subtle building grid.

### Entities (Game Objects)

* **`src/entities/Character.js`**: The base class for all bipedal entities. Extends `Phaser.GameObjects.Container`.
* *Visuals*: Manages the "2.5D forced perspective" visual style. Places the body sprite and tucks two leg sprites at the bottom edge (`Y: 14`).
* *Animation*: Contains `animateWalking(time)`, which uses a Sine wave to pump the legs forward and backward, creating a cute waddling effect independent of the container's rotation.


* **`src/entities/Player.js`**: Extends `Character`.
* *Composition*: Injects the `Movement` and `StackManager` components.
* *Logic*: Reads velocity, applies the Stack Penalty (slowdown math based on inventory array length), normalizes diagonal speed, and rotates the player to face the direction of movement.


* **`src/entities/ResourceDrop.js`**: Extends `Phaser.GameObjects.Sprite`. Represents ground items (Green Essence). Contains state management (`idle`, `magnetized`, `flying`, `stacked`) and an idle floating tween.

### Components (Reusable Logic)

* **`src/components/StackManager.js`**: The most complex and vital component. Handles the "Infinite Stack" illusion.
* *Container Logic*: Creates a visual stack container that follows the owner's X/Y coordinates but **does not rotate** with them, preserving the vertical tower illusion.
* *Queueing*: Uses a `collectionQueue` array to process items one at a time.
* *Dynamic Heights*: Uses `getItemSpacing(textureKey)` to automatically adjust the vertical spacing between items based on their visual thickness (e.g., 16px for a coin, 8px for a bullet), preventing clipping in mixed stacks.
* *Constraints*: Accepts a configuration object (`allowedItems`, `allowMixed`) to restrict which entities can carry which types of resources, and whether they can mix them.
* *Gravity Drop*: When an item is `popFromStack()`, the remaining items smoothly animate down to fill the gap via `recalculateStackPositions()`.



## ⚙️ 4. Core Mechanics Currently Implemented

1. **Procedural 2.5D Rendering**: Assets (like `CoinAsset2`) and characters are drawn via code with forced-perspective to create a 3D illusion without 3D models.
2. **Modular Assets System**: All graphics and UI elements extend a base template, allowing rapid instantiation and visual tweaking.
3. **8-Way Movement & Facing**: WASD input with velocity normalization and dynamic body rotation to face the angle of movement.
4. **Distance Magnetism & Constraints**: Uses Pythagorean distance checking (`Phaser.Math.Distance.Between`) to vacuum items. Components like `StackManager` enforce rules on what items an entity is allowed to collect.
5. **Dynamic Sequential Stacking**: Items fly into backpacks with parabolic arcs and squash/stretch physics. The stack mathematically adjusts to the specific thickness of different items, and remaining items fall to fill gaps when objects are removed.
6. **Stack Friction**: The player's base speed is dynamically reduced by the length of the StackManager's item array, simulating the weight of the tower.
7. **Animated Unlock Zones**: Physical zones that detect player overlaps, forcibly pop items off the player's back, and animate them being "absorbed" into the zone to pay down a cost counter.

## 🚀 5. Roadmap & Next Steps

*(For the next agent or developer picking up this project)*

1. **The Deposit Hub**: Create a specific zone/tile that reverses the `StackManager` logic—rapidly removing items from the top of the stack and converting them into a base currency.
2. **Base Building**: Implement a drag-and-drop or click-to-build system utilizing the existing `wall_tile` asset to allow the player to build perimeter defenses.
3. **Zombie Entities**: Extend `Character.js` to create a Zombie class with basic pathfinding/chase AI toward the player or the base core.
4. **Refinery Wings**: Create processing buildings (e.g., Bio-Lab) that take Green Essence from the stack and output Blue Vials.