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

```text
Bio-Stacker/
├── index.html
└── src/
    ├── main.js
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
    └── utils/
        └── AssetFactory.js

```

## 🏗️ 3. Architecture & Module Breakdown

### Core Setup

* **`index.html`**: The entry point. Loads the Phaser 3 library via CDN and imports `src/main.js` as an ES6 `<script type="module">`.
* **`src/main.js`**: The Phaser Game configuration. Initializes the canvas (800x600), sets the background color, initializes the Arcade Physics engine (with 0 gravity for top-down view), and loads the `MainScene`.

### Utilities

* **`src/utils/AssetFactory.js`**: The central graphics generator. Instead of loading external `.png` files, this class uses Phaser's `Graphics` API to procedurally draw and generate textures (`body_player`, `leg_player`, `road_tile`, `wall_tile`, `item_essence`) into the game's memory during the `preload` phase. It maintains a central `COLORS` dictionary for a consistent art palette.

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

* **`src/components/Movement.js`**: Isolates keyboard input. Maps WASD keys and returns a normalized `Phaser.Math.Vector2` velocity vector.
* **`src/components/StackManager.js`**: The most complex and vital component. Handles the "Infinite Stack" illusion.
* *Container Logic*: Creates a visual stack container that follows the owner's X/Y coordinates but **does not rotate** with them, preserving the vertical tower illusion.
* *Queueing*: Uses a `collectionQueue` array to process items one at a time.
* *Juice/Animation*: When `magnetize()` is called, it triggers a two-part tween: Phase 1 (pop up into the air) and Phase 2 (arc aggressively onto the target stack height). Completes with a satisfying squash-and-stretch impact tween.



## ⚙️ 4. Core Mechanics Currently Implemented

1. **Procedural 2.5D Rendering**: Characters are drawn via code with waddling, forced-perspective legs.
2. **8-Way Movement**: WASD input with velocity normalization (diagonals are not faster than cardinal directions).
3. **Dynamic Facing**: Character body rotates to face the exact angle of movement.
4. **Math-Based Magnetic Radius**: Instead of expensive physics overlaps, the game uses Pythagorean distance checking (`Phaser.Math.Distance.Between`) every frame to vacuum items within a specific radius (currently 120px).
5. **Sequential Stacking Animation**: Items queued in the magnet zone fly one-by-one with easing tweens to create a satisfying, rapid-fire visual stacking effect.
6. **Stack Friction**: The player's base speed (250) is dynamically reduced by the length of the StackManager's item array, simulating the weight of the tower.

## 🚀 5. Roadmap & Next Steps

*(For the next agent or developer picking up this project)*

1. **The Deposit Hub**: Create a specific zone/tile that reverses the `StackManager` logic—rapidly removing items from the top of the stack and converting them into a base currency.
2. **Base Building**: Implement a drag-and-drop or click-to-build system utilizing the existing `wall_tile` asset to allow the player to build perimeter defenses.
3. **Zombie Entities**: Extend `Character.js` to create a Zombie class with basic pathfinding/chase AI toward the player or the base core.
4. **Refinery Wings**: Create processing buildings (e.g., Bio-Lab) that take Green Essence from the stack and output Blue Vials.