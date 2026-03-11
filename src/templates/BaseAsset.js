/**
 * BaseAsset.js
 * 
 * STANTARD TEMPLATE for all procedural assets in the project.
 * Designed for modularity, fast 2.5D/Top-Down prototyping, 
 * and easy integration with LLM-generated drawing code.
 */
export class BaseAsset {
    /**
     * Generates a Phaser 3 texture based on the procedural drawing logic.
     * 
     * @param {Phaser.Scene} scene - The scene to generate the texture in.
     * @param {string} key - The texture key to register (e.g., 'item_coin_gold').
     * @param {object} config - Customization options (size, colors, orientation).
     * @returns {string} - Returns the key for convenience.
     */
    static generate(scene, key, config = {}) {
        const { width = 48, height = 48 } = config;

        // Use scene.make.graphics (doesn't add to scene by default)
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        
        // Boilerplace for centering
        const center = { x: width / 2, y: height / 2 };
        
        // Call the specific drawing logic (to be filled by LLMs)
        this.draw(g, center, config);
        
        // Save to texture manager
        g.generateTexture(key, width, height);
        
        // Cleanup the graphics object
        g.destroy();

        console.log(`[AssetFactory] Generated Texture: "${key}"`);
        return key;
    }

    /**
     * DRAWING TEMPLATE: This is what the LLM will fill.
     * 
     * @param {Phaser.GameObjects.Graphics} g - The Graphics object to draw into.
     * @param {object} c - The center coordinates {x, y}.
     * @param {object} config - Custom arguments (scale, color, depth, etc).
     */
    static draw(g, c, config) {
        // OVERRIDE ME: 
        // 1. Setup colors (e.g., const baseColor = config.color || 0xffcc00)
        // 2. Draw depth/shadow layers (using offsets based on c.x, c.y)
        // 3. Draw main face/body
        // 4. Draw highlights/glints
    }

    /**
     * QUICK TEST UTILITY: Instantiates a sprite immediately in the scene for visual check.
     * 
     * @param {Phaser.Scene} scene - The scene to test in.
     * @param {number} x - X coordinate to place sprite.
     * @param {number} y - Y coordinate to place sprite.
     * @param {object} config - Any customization args.
     */
    static testInScene(scene, x, y, config = {}) {
        const testKey = `test_${this.name}_${Date.now()}`;
        this.generate(scene, testKey, config);
        return scene.add.image(x, y, testKey);
    }
}
